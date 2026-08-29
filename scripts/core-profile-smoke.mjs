#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import { parseDocument } from "yaml";

const profileSchema = JSON.parse(
  await readFile("profiles/core-profile.schema.json", "utf8")
);
const profileDocument = parseDocument(
  await readFile("profiles/core.yaml", "utf8"),
  {
    maxAliasCount: 100,
    uniqueKeys: true
  }
);
if (profileDocument.errors.length > 0) {
  console.error("Core Profile definition failed YAML parsing.");
  for (const error of profileDocument.errors) {
    console.error(`  - ${error.message.split("\n", 1)[0]}`);
  }
  process.exit(1);
}
const profile = profileDocument.toJS({ maxAliasCount: 100 });
const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const projectSchema = JSON.parse(await readFile("schemas/project.schema.json", "utf8"));
const claimSchema = JSON.parse(
  await readFile("conformance/conformance-claim.schema.json", "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validateProfile = ajv.compile(profileSchema);

if (!validateProfile(profile)) {
  console.error("Core Profile definition failed schema validation.");
  console.error(JSON.stringify(validateProfile.errors, null, 2));
  process.exit(1);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
}

const registryErrors = [];
for (const [label, values] of [
  ["required slot", profile.requiredSlots.map((slot) => slot.id)],
  ["optional module", profile.optionalModules.map((module) => module.id)],
  ["dependency rule", profile.dependencyRules.map((rule) => rule.id)]
]) {
  for (const duplicate of duplicateValues(values)) {
    registryErrors.push(`duplicate ${label} id ${JSON.stringify(duplicate)}`);
  }
}

const slotIds = new Set(profile.requiredSlots.map((slot) => slot.id));
const dependencyRulesById = new Map(
  profile.dependencyRules.map((rule) => [rule.id, rule])
);
for (const rule of profile.dependencyRules) {
  if (rule.target.slot && !slotIds.has(rule.target.slot)) {
    registryErrors.push(
      `dependency rule ${JSON.stringify(rule.id)} targets unknown slot ${JSON.stringify(rule.target.slot)}`
    );
  }
}

const minimalDirectory = "examples/minimal-team";
const minimalFiles = (await readdir(minimalDirectory))
  .filter((name) => /\.ya?ml$/u.test(name))
  .sort();
const expectedMinimalFiles = ["actors.yaml", "agents.yaml", "project.yaml"];
if (JSON.stringify(minimalFiles) !== JSON.stringify(expectedMinimalFiles)) {
  registryErrors.push("Minimal Team must contain exactly the three Core Profile manifests");
}
const minimalManifests = [];
for (const name of minimalFiles) {
  const document = parseDocument(await readFile(`${minimalDirectory}/${name}`, "utf8"), {
    maxAliasCount: 100,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    registryErrors.push(`Minimal Team ${name} must parse as safe YAML`);
  } else {
    minimalManifests.push(document.toJS({ maxAliasCount: 100 }));
  }
}
const minimalProject = minimalManifests.find((manifest) => manifest.kind === "Project");
if (JSON.stringify(Object.keys(minimalProject?.manifests ?? {}).sort()) !== JSON.stringify(["actors", "agents"])) {
  registryErrors.push("Minimal Team Project must hint only the actor and agent inventories");
}

const registeredProfiles = [
  profile.profileId,
  ...profile.optionalModules.map((module) => module.id)
].sort();
const claimProfiles = [
  ...(claimSchema.properties?.scope?.properties?.profiles?.items?.enum ?? [])
].sort();
if (JSON.stringify(registeredProfiles) !== JSON.stringify(claimProfiles)) {
  registryErrors.push(
    "conformance claim profile qualifiers do not match the Core Profile registry"
  );
}

if (registryErrors.length > 0) {
  console.error("Core Profile registry consistency failed:");
  for (const error of registryErrors) console.error(`  - ${error}`);
  process.exit(1);
}

const schemaAjv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false
});
schemaAjv.addSchema(commonSchema);
const validateProject = schemaAjv.compile(projectSchema);

const reducedProject = {
  specVersion: "0.1",
  kind: "Project",
  metadata: { project: "profile-check" },
  project: {
    id: "profile-check",
    displayName: "Profile Check",
    description: "Reduced Core Profile project."
  }
};

const projectCases = [
  {
    name: "reduced Project without source hints",
    value: reducedProject,
    expected: true
  },
  {
    name: "reduced Project with sparse source hints",
    value: {
      ...structuredClone(reducedProject),
      manifests: { actors: "team/participants.yaml" }
    },
    expected: true
  },
  {
    name: "Project source hint must remain a string",
    value: {
      ...structuredClone(reducedProject),
      manifests: { actors: ["team/participants.yaml"] }
    },
    expected: false
  }
];

const knownKinds = new Set(
  profile.optionalModules.flatMap((module) => module.manifestKinds)
);
for (const slot of profile.requiredSlots) {
  for (const alternative of slot.alternatives) knownKinds.add(alternative.kind);
}

function assess({
  documentKinds,
  requestedProfiles = ["core"],
  referenceRuleIds = [],
  supportedKinds = [...knownKinds]
}) {
  const diagnostics = [];
  const counts = new Map();
  const supported = new Set(supportedKinds);

  for (const kind of documentKinds) {
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  let participantKind;
  for (const slot of profile.requiredSlots) {
    if (slot.resolution === "require_exact") {
      const kind = slot.alternatives[0].kind;
      if ((counts.get(kind) ?? 0) !== 1) {
        diagnostics.push({
          code: "NF-PROFILE-INCOMPLETE",
          detail: `slot ${slot.id} requires exactly one ${kind}`
        });
      }
      continue;
    }

    const selected = slot.alternatives.find(
      (alternative) => (counts.get(alternative.kind) ?? 0) > 0
    );
    if (!selected) {
      diagnostics.push({
        code: "NF-PROFILE-INCOMPLETE",
        detail: `slot ${slot.id} has no available source`
      });
      continue;
    }
    if ((counts.get(selected.kind) ?? 0) !== 1) {
      diagnostics.push({
        code: "NF-PROFILE-INCOMPLETE",
        detail: `slot ${slot.id} has ambiguous ${selected.kind} sources`
      });
    }
    if (slot.id === "participant_inventory") participantKind = selected.kind;
  }

  for (const profileId of requestedProfiles) {
    if (profileId === "core") continue;
    const module = profile.optionalModules.find((entry) => entry.id === profileId);
    if (!module) {
      diagnostics.push({
        code: "NF-PROFILE-UNSUPPORTED-MODULE",
        detail: `unknown profile qualifier ${profileId}`
      });
      continue;
    }

    const missing = module.qualifierRequiredKinds.filter(
      (kind) => (counts.get(kind) ?? 0) === 0
    );
    if (missing.length > 0) {
      diagnostics.push({
        code: "NF-PROFILE-INCOMPLETE",
        detail: `profile ${profileId} requires ${missing.join(", ")}`
      });
    }
  }

  const requiredKinds = new Set();
  for (const ruleId of referenceRuleIds) {
    const rule = dependencyRulesById.get(ruleId);
    if (!rule) {
      diagnostics.push({
        code: "NF-PROFILE-UNSUPPORTED-MODULE",
        detail: `unknown dependency rule ${ruleId}`
      });
      continue;
    }
    if ((counts.get(rule.sourceKind) ?? 0) === 0) continue;
    if (rule.target.kind) requiredKinds.add(rule.target.kind);
  }

  for (const kind of requiredKinds) {
    if (!supported.has(kind)) {
      diagnostics.push({
        code: "NF-PROFILE-UNSUPPORTED-MODULE",
        detail: `required kind ${kind} is unsupported`
      });
    } else if ((counts.get(kind) ?? 0) === 0) {
      diagnostics.push({
        code: "NF-PROFILE-MISSING-DEPENDENCY",
        detail: `required kind ${kind} is absent`
      });
    }
  }

  const adoptedModules = profile.optionalModules
    .filter((module) =>
      module.manifestKinds.some((kind) => (counts.get(kind) ?? 0) > 0)
    )
    .map((module) => module.id);

  return {
    conformant: diagnostics.length === 0,
    participantKind,
    adoptedModules,
    diagnostics
  };
}

const assessmentCases = [
  {
    name: "ActorSet Core Profile",
    input: { documentKinds: ["Project", "ActorSet"] },
    expected: { conformant: true, participantKind: "ActorSet" }
  },
  {
    name: "legacy AgentSet Core Profile",
    input: { documentKinds: ["Project", "AgentSet"] },
    expected: { conformant: true, participantKind: "AgentSet" }
  },
  {
    name: "Minimal Team uses ActorSet authority with compact AgentSet identity",
    input: { documentKinds: minimalManifests.map((manifest) => manifest.kind) },
    expected: { conformant: true, participantKind: "ActorSet" }
  },
  {
    name: "missing Project is incomplete",
    input: { documentKinds: ["ActorSet"] },
    expected: { conformant: false, code: "NF-PROFILE-INCOMPLETE" }
  },
  {
    name: "missing participant inventory is incomplete",
    input: { documentKinds: ["Project"] },
    expected: { conformant: false, code: "NF-PROFILE-INCOMPLETE" }
  },
  {
    name: "absent optional modules do not block core",
    input: { documentKinds: ["Project", "ActorSet"] },
    expected: { conformant: true, adoptedModules: [] }
  },
  {
    name: "partial policy module remains core conformant when unclaimed",
    input: { documentKinds: ["Project", "ActorSet", "CapabilitySet"] },
    expected: { conformant: true, adoptedModules: ["policy"] }
  },
  {
    name: "claimed policy qualifier requires both policy kinds",
    input: {
      documentKinds: ["Project", "ActorSet", "CapabilitySet"],
      requestedProfiles: ["core", "policy"]
    },
    expected: { conformant: false, code: "NF-PROFILE-INCOMPLETE" }
  },
  {
    name: "complete policy qualifier",
    input: {
      documentKinds: ["Project", "ActorSet", "CapabilitySet", "PermissionSet"],
      requestedProfiles: ["core", "policy"]
    },
    expected: { conformant: true }
  },
  {
    name: "reference makes optional target required",
    input: {
      documentKinds: ["Project", "ActorSet", "TaskSet"],
      referenceRuleIds: ["task-capabilities"]
    },
    expected: { conformant: false, code: "NF-PROFILE-MISSING-DEPENDENCY" }
  },
  {
    name: "present reference target closes dependency",
    input: {
      documentKinds: ["Project", "ActorSet", "TaskSet", "CapabilitySet"],
      referenceRuleIds: ["task-capabilities"]
    },
    expected: { conformant: true }
  },
  {
    name: "transitive present sources require final target",
    input: {
      documentKinds: [
        "Project",
        "ActorSet",
        "AgentSet",
        "AgentDefinitionSet",
        "ModelProfileSet"
      ],
      referenceRuleIds: ["agent-definition-model", "model-provider-list"]
    },
    expected: { conformant: false, code: "NF-PROFILE-MISSING-DEPENDENCY" }
  },
  {
    name: "unsupported required target fails closed",
    input: {
      documentKinds: ["Project", "ActorSet", "ExtensionSet"],
      referenceRuleIds: ["extension-capabilities"],
      supportedKinds: ["Project", "ActorSet", "ExtensionSet"]
    },
    expected: { conformant: false, code: "NF-PROFILE-UNSUPPORTED-MODULE" }
  }
];

let failed = false;

for (const testCase of projectCases) {
  const actual = validateProject(testCase.value);
  if (actual === testCase.expected) continue;

  failed = true;
  console.error(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  if (validateProject.errors) {
    console.error(JSON.stringify(validateProject.errors, null, 2));
  }
}

for (const testCase of assessmentCases) {
  const actual = assess(testCase.input);
  const matches =
    actual.conformant === testCase.expected.conformant &&
    (testCase.expected.participantKind === undefined ||
      actual.participantKind === testCase.expected.participantKind) &&
    (testCase.expected.adoptedModules === undefined ||
      JSON.stringify(actual.adoptedModules) ===
        JSON.stringify(testCase.expected.adoptedModules)) &&
    (testCase.expected.code === undefined ||
      actual.diagnostics.some(
        (diagnostic) => diagnostic.code === testCase.expected.code
      ));

  if (matches) continue;

  failed = true;
  console.error(`${testCase.name}: unexpected assessment`);
  console.error(JSON.stringify(actual, null, 2));
}

if (failed) {
  process.exitCode = 1;
} else {
  const count = projectCases.length + assessmentCases.length;
  console.log(`Core Profile checks passed for ${count} cases.`);
  console.log(
    "Checked reduced Project structure, participant authority, optional qualifiers, claim qualifier sync, dependency closure, and fail-closed unsupported modules."
  );
  console.log("The checks consume normalized kind inventories; discovery and runtime execution are out of scope.");
}
