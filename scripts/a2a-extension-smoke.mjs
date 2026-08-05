#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import { parseDocument } from "yaml";

const schema = JSON.parse(
  await readFile("extensions/a2a/profile.schema.json", "utf8")
);
const profileDocument = parseDocument(
  await readFile("extensions/a2a/profile.yaml", "utf8"),
  { maxAliasCount: 100, uniqueKeys: true }
);

if (profileDocument.errors.length > 0) {
  console.error("A2A extension profile YAML is invalid:");
  for (const error of profileDocument.errors) console.error(`- ${error.message}`);
  process.exit(1);
}

const profile = profileDocument.toJS({ maxAliasCount: 100 });
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

const cases = [
  { name: "maintained A2A profile", value: profile, expected: true },
  mutation("wrong namespace", (value) => {
    value.namespace = "com.example.a2a";
  }),
  mutation("NexFlow claims protocol authority", (value) => {
    value.protocol.authority = "nexflow";
  }),
  mutation("unknown protocol surface", (value) => {
    value.surfaces[0].id = "endpoint";
  }),
  mutation("surface is not protocol-owned", (value) => {
    value.surfaces[0].protocolOwned = false;
  }),
  mutation("core typed references inferred", (value) => {
    value.requirements.references.coreTypedReferences = "automatic";
  }),
  mutation("remote agent becomes Actor automatically", (value) => {
    value.requirements.references.remoteAgentToActor = "automatic";
  }),
  mutation("remote task becomes TaskSet task", (value) => {
    value.requirements.work.tasks = "taskset";
  }),
  mutation("artifact import loses provenance", (value) => {
    value.requirements.work.artifacts = "automatic_import";
  }),
  mutation("operation bypasses permission", (value) => {
    value.requirements.operations.permissionRequired = false;
  }),
  mutation("push callback bypasses inbound policy", (value) => {
    value.requirements.network.inboundCallbacks = "allowed";
  }),
  mutation("credentials embedded in profile", (value) => {
    value.requirements.credentials.handling = "manifest";
  }),
  mutation("unknown remote agent executes", (value) => {
    value.failurePolicy.unknownAgent = "invoke";
  })
];

const failures = [];
for (const testCase of cases) {
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
  ["agent_card", ["discovery", "external_metadata"]],
  ["agent", ["identity", "external_identity"]],
  ["skill", ["advertisement", "external_claim"]],
  ["message", ["exchange", "external_message"]],
  ["task", ["work_instance", "external_instance"]],
  ["artifact", ["output", "external_output"]]
]);
const actualSurfaces = new Map(
  profile.surfaces.map((surface) => [
    surface.id,
    [surface.class, surface.nexflowTreatment]
  ])
);

for (const [id, expected] of expectedSurfaces) {
  if (JSON.stringify(actualSurfaces.get(id)) !== JSON.stringify(expected)) {
    failures.push({ name: `surface mapping ${id}`, expected, actual: actualSurfaces.get(id) });
  }
}

if (actualSurfaces.size !== expectedSurfaces.size) {
  failures.push({
    name: "surface inventory cardinality",
    expected: expectedSurfaces.size,
    actual: actualSurfaces.size
  });
}

const requiredAudit = new Set([
  "discovery_decision",
  "invocation_decision",
  "approval_decision",
  "remote_task_transition",
  "artifact_import",
  "network_decision"
]);
const actualAudit = new Set(profile.requirements.audit.requiredFor);
for (const auditEvent of requiredAudit) {
  if (!actualAudit.has(auditEvent)) {
    failures.push({ name: `required audit boundary ${auditEvent}` });
  }
}

if (failures.length > 0) {
  console.error(`A2A extension checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.errors) console.error(JSON.stringify(failure.errors, null, 2));
  }
  process.exit(1);
}

console.log(`A2A extension checks passed for ${cases.length} schema cases.`);
console.log("Validated external identity, task, artifact, authority, network, credential, and fail-closed boundaries without contacting an A2A agent.");
