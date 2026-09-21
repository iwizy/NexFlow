#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import { parseDocument } from "yaml";

async function readYaml(path) {
  const document = parseDocument(await readFile(path, "utf8"), {
    maxAliasCount: 100,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    throw new Error(
      `${path} is invalid YAML:\n${document.errors.map((error) => error.message).join("\n")}`
    );
  }
  return document.toJS({ maxAliasCount: 100 });
}

const schema = JSON.parse(
  await readFile("extensions/github/profile.schema.json", "utf8")
);
const profile = await readYaml("extensions/github/profile.yaml");

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function clone(value) {
  return structuredClone(value);
}

function mutation(name, change) {
  const value = clone(profile);
  change(value);
  return { name, value, expected: false };
}

const schemaCases = [
  { name: "maintained GitHub profile", value: profile, expected: true },
  mutation("wrong namespace", (value) => {
    value.namespace = "com.example.github";
  }),
  mutation("NexFlow claims provider authority", (value) => {
    value.provider.authority = "nexflow";
  }),
  mutation("branch ref becomes immutable identity", (value) => {
    value.requirements.identifiers.mutableRefs = "immutable_identity";
  }),
  mutation("provider review satisfies approval automatically", (value) => {
    value.requirements.reviewAuthority.providerReview = "approval_gate_decision";
  }),
  mutation("merge becomes supported implicitly", (value) => {
    value.requirements.reviewAuthority.merge = "allowed";
  }),
  mutation("external instructions become authority", (value) => {
    value.requirements.content.instructions = "follow";
  }),
  mutation("repository push loses write capability", (value) => {
    value.requirements.operations.find(({ id }) => id === "push_commit")
      .requiredCapabilities = ["read_repository", "access_network"];
  }),
  mutation("pull request creation skips approval", (value) => {
    value.requirements.operations.find(({ id }) => id === "create_pull_request")
      .approvalPolicy = "local_policy";
  }),
  mutation("provider calls bypass network policy", (value) => {
    value.requirements.network.outboundPolicy = "implicit";
  }),
  mutation("credentials become manifest fields", (value) => {
    value.requirements.credentials.manifestSecrets = "allowed";
  }),
  mutation("webhooks become trusted on receipt", (value) => {
    value.requirements.events.webhookTrust = "trusted";
  }),
  mutation("unknown operation executes", (value) => {
    value.failurePolicy.unknownOperation = "execute";
  }),
  mutation("extra profile field", (value) => {
    value.runtime = { enabled: true };
  })
];

const failures = [];
for (const testCase of schemaCases) {
  const actual = validate(testCase.value);
  if (actual !== testCase.expected) {
    failures.push({
      name: testCase.name,
      expected: testCase.expected,
      actual,
      errors: validate.errors
    });
  }
}

const expectedSurfaces = new Map([
  ["repository", ["context", "declared_context"]],
  ["ref", ["mutable_reference", "mutable_not_identity"]],
  ["commit", ["immutable_revision", "pinned_external_revision"]],
  ["pull_request", ["review_record", "external_review_record"]],
  ["review", ["review_signal", "not_approval_decision"]],
  ["check", ["status_signal", "evidence_not_authority"]],
  ["webhook", ["external_event", "untrusted_event_input"]]
]);
const actualSurfaces = new Map(
  profile.surfaces.map((surface) => [
    surface.id,
    [surface.class, surface.nexflowTreatment]
  ])
);

for (const [id, expected] of expectedSurfaces) {
  if (JSON.stringify(actualSurfaces.get(id)) !== JSON.stringify(expected)) {
    failures.push({
      name: `surface mapping ${id}`,
      expected,
      actual: actualSurfaces.get(id)
    });
  }
}
if (actualSurfaces.size !== expectedSurfaces.size) {
  failures.push({
    name: "surface inventory cardinality",
    expected: expectedSurfaces.size,
    actual: actualSurfaces.size
  });
}

const expectedOperations = new Map([
  ["read_repository", ["read_repository", "access_network"]],
  ["create_branch", ["create_branch", "access_network", "use_credential"]],
  ["push_commit", ["write_repository", "access_network", "use_credential"]],
  [
    "create_pull_request",
    ["create_pull_request", "access_network", "use_credential"]
  ],
  ["submit_review", ["approve_changes", "access_network", "use_credential"]]
]);
const actualOperations = new Map(
  profile.requirements.operations.map((operation) => [
    operation.id,
    operation.requiredCapabilities
  ])
);
for (const [id, expected] of expectedOperations) {
  if (JSON.stringify(actualOperations.get(id)) !== JSON.stringify(expected)) {
    failures.push({
      name: `operation capability mapping ${id}`,
      expected,
      actual: actualOperations.get(id)
    });
  }
}

const extensionSet = await readYaml("examples/software-team/extensions.yaml");
const capabilitySet = await readYaml("examples/software-team/capabilities.yaml");
const contextSet = await readYaml("examples/software-team/context.yaml");
const project = await readYaml("examples/software-team/project.yaml");

const githubExtension = extensionSet.extensions.find(
  (extension) => extension.namespace === profile.namespace
);
if (!githubExtension) {
  failures.push({ name: "Software Team declares io.nexflow.github" });
} else {
  for (const capability of profile.requirements.extension.requiredCapabilities) {
    if (!githubExtension.requiredCapabilities?.includes(capability)) {
      failures.push({
        name: `Software Team GitHub extension requires ${capability}`
      });
    }
  }
}

const declaredCapabilities = new Set(
  capabilitySet.capabilities.map((capability) => capability.id)
);
for (const capability of new Set([
  ...profile.requirements.operations.flatMap(
    (operation) => operation.requiredCapabilities
  ),
  profile.requirements.credentials.capability
])) {
  if (!declaredCapabilities.has(capability)) {
    failures.push({ name: `Software Team declares capability ${capability}` });
  }
}

const githubSources = contextSet.contextSources.filter(
  (source) => source.type === profile.requirements.contextSource.type
);
if (githubSources.length !== 1) {
  failures.push({
    name: "Software Team has exactly one GitHub context source",
    expected: 1,
    actual: githubSources.length
  });
} else {
  const source = githubSources[0];
  for (const field of profile.requirements.contextSource.requiredFields) {
    if (source[field] == null) {
      failures.push({ name: `GitHub context source declares ${field}` });
    }
  }
  const allowed = new Set(profile.requirements.contextSource.allowedContentTypes);
  for (const contentType of source.contentTypes ?? []) {
    if (!allowed.has(contentType)) {
      failures.push({ name: `GitHub context type is allowed: ${contentType}` });
    }
  }
}

const githubNetworkRule = project.project?.policies?.networkAccess?.rules?.find(
  (rule) =>
    rule.destinations?.extensions?.includes(githubExtension?.id) &&
    rule.destinations?.schemes?.includes("https")
);
if (!githubNetworkRule) {
  failures.push({
    name: "Software Team declares an HTTPS network rule for the GitHub extension"
  });
}

const requiredAudit = new Set([
  "context_read",
  "branch_creation",
  "repository_write",
  "pull_request_creation",
  "review_submission",
  "credential_decision",
  "network_decision",
  "webhook_decision"
]);
const actualAudit = new Set(profile.requirements.audit.requiredFor);
for (const event of requiredAudit) {
  if (!actualAudit.has(event)) {
    failures.push({ name: `required audit boundary ${event}` });
  }
}

if (failures.length > 0) {
  console.error(`GitHub extension checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.errors) console.error(JSON.stringify(failure.errors, null, 2));
  }
  process.exit(1);
}

const assertionCount =
  schemaCases.length +
  expectedSurfaces.size +
  expectedOperations.size +
  profile.requirements.extension.requiredCapabilities.length +
  new Set([
    ...profile.requirements.operations.flatMap(
      (operation) => operation.requiredCapabilities
    ),
    profile.requirements.credentials.capability
  ]).size +
  profile.requirements.contextSource.requiredFields.length +
  requiredAudit.size +
  2;

console.log(`GitHub extension checks passed for ${assertionCount} assertions.`);
console.log(
  "Validated provider authority, immutable evidence, operation separation, review, network, credential, webhook, and fail-closed boundaries without contacting GitHub."
);
