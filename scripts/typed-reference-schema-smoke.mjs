#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const commonSchemaId = commonSchema.$id;
const ajv = new Ajv2020({ allErrors: true, strict: false });

ajv.addSchema(commonSchema);

function validator(definition) {
  return ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $ref: `${commonSchemaId}#/$defs/${definition}`
  });
}

const validators = new Map([
  ["typedReference", validator("typedReference")],
  ["resourceReference", validator("resourceReference")],
  ["resourceReferenceList", validator("resourceReferenceList")],
  ["actorReference", validator("actorReference")],
  ["agentReference", validator("agentReference")],
  ["extensionReference", validator("extensionReference")]
]);

const targetKinds = commonSchema.$defs.referenceTargetKind.enum;
const cases = targetKinds.map((kind) => ({
  name: `known target kind ${kind}`,
  definition: "typedReference",
  value: { kind, id: "known-resource" },
  expected: true
}));

cases.push(
  {
    name: "scoped nested reference",
    definition: "typedReference",
    value: {
      kind: "workflow-step",
      id: "publish-release",
      scope: { kind: "workflow", id: "release-workflow" }
    },
    expected: true
  },
  {
    name: "unknown target kind",
    definition: "typedReference",
    value: { kind: "database", id: "primary" },
    expected: false
  },
  {
    name: "uppercase target kind",
    definition: "typedReference",
    value: { kind: "Agent", id: "docs-agent" },
    expected: false
  },
  {
    name: "missing target kind",
    definition: "typedReference",
    value: { id: "docs-agent" },
    expected: false
  },
  {
    name: "missing target ID",
    definition: "typedReference",
    value: { kind: "agent" },
    expected: false
  },
  {
    name: "uppercase target ID",
    definition: "typedReference",
    value: { kind: "agent", id: "DocsAgent" },
    expected: false
  },
  {
    name: "leading digit in target ID",
    definition: "typedReference",
    value: { kind: "agent", id: "1-docs-agent" },
    expected: false
  },
  {
    name: "repeated separator in target ID",
    definition: "typedReference",
    value: { kind: "agent", id: "docs--agent" },
    expected: false
  },
  {
    name: "event type used as target ID",
    definition: "typedReference",
    value: { kind: "agent", id: "agent.started" },
    expected: false
  },
  {
    name: "extra reference property",
    definition: "typedReference",
    value: { kind: "agent", id: "docs-agent", version: "1.0" },
    expected: false
  },
  {
    name: "scope without kind",
    definition: "typedReference",
    value: {
      kind: "workflow-step",
      id: "publish-release",
      scope: { id: "release-workflow" }
    },
    expected: false
  },
  {
    name: "scope without ID",
    definition: "typedReference",
    value: {
      kind: "workflow-step",
      id: "publish-release",
      scope: { kind: "workflow" }
    },
    expected: false
  },
  {
    name: "scope with unknown kind",
    definition: "typedReference",
    value: {
      kind: "workflow-step",
      id: "publish-release",
      scope: { kind: "database", id: "release-workflow" }
    },
    expected: false
  },
  {
    name: "scope with extra property",
    definition: "typedReference",
    value: {
      kind: "workflow-step",
      id: "publish-release",
      scope: { kind: "workflow", id: "release-workflow", path: "workflow.yaml" }
    },
    expected: false
  },
  {
    name: "compact typed string is not a typed object",
    definition: "typedReference",
    value: "agent:docs-agent",
    expected: false
  },
  {
    name: "path-like string is not a typed object",
    definition: "typedReference",
    value: "agents/docs-agent",
    expected: false
  },
  {
    name: "legacy scalar resource reference",
    definition: "resourceReference",
    value: "docs-agent",
    expected: true
  },
  {
    name: "typed transitional resource reference",
    definition: "resourceReference",
    value: { kind: "agent", id: "docs-agent" },
    expected: true
  },
  {
    name: "compact transitional string is invalid",
    definition: "resourceReference",
    value: "agent:docs-agent",
    expected: false
  },
  {
    name: "mixed transitional reference list",
    definition: "resourceReferenceList",
    value: [
      "docs-agent",
      { kind: "agent", id: "review-agent" }
    ],
    expected: true
  },
  {
    name: "duplicate scalar transitional references",
    definition: "resourceReferenceList",
    value: ["docs-agent", "docs-agent"],
    expected: false
  },
  {
    name: "duplicate object transitional references",
    definition: "resourceReferenceList",
    value: [
      { kind: "agent", id: "docs-agent" },
      { kind: "agent", id: "docs-agent" }
    ],
    expected: false
  },
  {
    name: "strict actor reference",
    definition: "actorReference",
    value: { kind: "actor", id: "human-maintainer" },
    expected: true
  },
  {
    name: "actor reference with wrong kind",
    definition: "actorReference",
    value: { kind: "agent", id: "docs-agent" },
    expected: false
  },
  {
    name: "actor reference with explicit scope",
    definition: "actorReference",
    value: {
      kind: "actor",
      id: "human-maintainer",
      scope: { kind: "project", id: "minimal-team" }
    },
    expected: false
  },
  {
    name: "strict agent reference",
    definition: "agentReference",
    value: { kind: "agent", id: "docs-agent" },
    expected: true
  },
  {
    name: "agent reference with wrong kind",
    definition: "agentReference",
    value: { kind: "actor", id: "docs-agent" },
    expected: false
  },
  {
    name: "agent reference with explicit scope",
    definition: "agentReference",
    value: {
      kind: "agent",
      id: "docs-agent",
      scope: { kind: "project", id: "minimal-team" }
    },
    expected: false
  },
  {
    name: "strict extension reference",
    definition: "extensionReference",
    value: { kind: "extension", id: "github-basic" },
    expected: true
  },
  {
    name: "extension reference with wrong kind",
    definition: "extensionReference",
    value: { kind: "provider", id: "github-basic" },
    expected: false
  },
  {
    name: "extension reference with explicit scope",
    definition: "extensionReference",
    value: {
      kind: "extension",
      id: "github-basic",
      scope: { kind: "project", id: "minimal-team" }
    },
    expected: false
  }
);

let failed = false;

for (const testCase of cases) {
  const validate = validators.get(testCase.definition);
  const actual = validate(testCase.value);
  if (actual === testCase.expected) continue;

  failed = true;
  console.error(
    `${testCase.name}: expected ${testCase.expected}, got ${actual} for ${testCase.definition}`
  );
  if (validate.errors) console.error(JSON.stringify(validate.errors, null, 2));
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(
    `Typed reference schema checks passed for ${cases.length} cases across ${validators.size} shared definitions.`
  );
  console.log(
    "These checks validate common authored shapes and lexical boundaries, not target existence or semantic resolution."
  );
}
