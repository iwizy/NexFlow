#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const definitionSchema = JSON.parse(
  await readFile("schemas/agent-definitions.schema.json", "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(definitionSchema);

const activeDefinition = {
  id: "docs_agent_2026_07",
  agentRef: "docs-agent",
  definitionVersion: "2026.07.0",
  status: "active",
  owner: "human-maintainer",
  description: "Reviewed documentation agent behavioral release.",
  components: {
    modelProfileRef: "docs_agent_balanced",
    promptSetRef: "docs_agent_prompts",
    retrievalProfileRef: "docs_agent_retrieval",
    permissionRefs: ["docs_write_with_review"],
    capabilityRefs: ["read_repository", "modify_documentation"],
    contextSourceRefs: ["repository", "docs"],
    memoryScopes: ["ephemeral", "task"],
    extensionRefs: []
  },
  autonomyLevel: "ask_before_changes",
  changeSummary: "Selects the reviewed documentation behavior.",
  review: {
    required: true,
    state: "approved",
    approvers: ["human-maintainer"],
    approvalGate: "human_review",
    activationCriteria: ["Referenced components are reviewed."]
  },
  compatibility: {
    impact: "behavior_changing",
    notes: "Changes requested documentation behavior."
  },
  audit: {
    recordAgentDefinitionRef: true,
    recordDefinitionVersion: true,
    recordComponentRefs: true,
    recordReviewState: true,
    recordChangeSummary: true,
    events: ["agent.definition.selected"]
  }
};

const draftDefinition = {
  ...structuredClone(activeDefinition),
  id: "docs_agent_draft",
  status: "draft",
  components: {},
  review: {
    required: true,
    state: "pending"
  },
  audit: {}
};
delete draftDefinition.changeSummary;
delete draftDefinition.compatibility;

function manifest(definitions) {
  return {
    specVersion: "0.1",
    kind: "AgentDefinitionSet",
    metadata: { project: "agent-definition-authority-check" },
    agentDefinitions: definitions
  };
}

function changed(update) {
  const definition = structuredClone(activeDefinition);
  update(definition);
  return manifest([definition]);
}

const structuralCases = [
  {
    name: "complete approved active definition",
    value: manifest([activeDefinition]),
    expected: true
  },
  {
    name: "incomplete draft remains declaration-valid",
    value: manifest([draftDefinition]),
    expected: true
  },
  {
    name: "active definition missing model profile",
    value: changed((definition) => delete definition.components.modelProfileRef),
    expected: false
  },
  {
    name: "active definition missing explicit extension list",
    value: changed((definition) => delete definition.components.extensionRefs),
    expected: false
  },
  {
    name: "active definition without review state",
    value: changed((definition) => delete definition.review.state),
    expected: false
  },
  {
    name: "active definition with pending review",
    value: changed((definition) => {
      definition.review.state = "pending";
    }),
    expected: false
  },
  {
    name: "active definition without approvers",
    value: changed((definition) => {
      definition.review.approvers = [];
    }),
    expected: false
  },
  {
    name: "active definition with disabled audit field",
    value: changed((definition) => {
      definition.audit.recordReviewState = false;
    }),
    expected: false
  },
  {
    name: "active definition without compatibility record",
    value: changed((definition) => delete definition.compatibility),
    expected: false
  }
];

function selectUniqueActive(definitions, agentRef) {
  const active = definitions.filter(
    (definition) => definition.agentRef === agentRef && definition.status === "active"
  );

  if (active.length === 0) return { ok: false, code: "no_active_definition" };
  if (active.length > 1) return { ok: false, code: "ambiguous_active_definition" };
  return { ok: true, definitionRef: active[0].id };
}

const secondActive = {
  ...structuredClone(activeDefinition),
  id: "docs_agent_2026_08",
  definitionVersion: "2026.08.0"
};

const selectionCases = [
  {
    name: "unique active definition selected",
    definitions: [activeDefinition, draftDefinition],
    agentRef: "docs-agent",
    expected: { ok: true, definitionRef: "docs_agent_2026_07" }
  },
  {
    name: "draft definition is not selected",
    definitions: [draftDefinition],
    agentRef: "docs-agent",
    expected: { ok: false, code: "no_active_definition" }
  },
  {
    name: "missing agent definition blocks selection",
    definitions: [activeDefinition],
    agentRef: "qa-agent",
    expected: { ok: false, code: "no_active_definition" }
  },
  {
    name: "multiple active definitions block selection",
    definitions: [activeDefinition, secondActive],
    agentRef: "docs-agent",
    expected: { ok: false, code: "ambiguous_active_definition" }
  }
];

let failed = false;

for (const testCase of structuralCases) {
  const actual = validate(testCase.value);
  if (actual === testCase.expected) continue;

  failed = true;
  console.error(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  if (validate.errors) console.error(JSON.stringify(validate.errors, null, 2));
}

for (const testCase of selectionCases) {
  const actual = selectUniqueActive(testCase.definitions, testCase.agentRef);
  if (JSON.stringify(actual) === JSON.stringify(testCase.expected)) continue;

  failed = true;
  console.error(
    `${testCase.name}: expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(actual)}`
  );
}

if (failed) {
  process.exitCode = 1;
} else {
  const count = structuralCases.length + selectionCases.length;
  console.log(`Agent definition authority checks passed for ${count} cases.`);
  console.log("The checks cover authoritative selection boundaries, not runtime execution.");
}
