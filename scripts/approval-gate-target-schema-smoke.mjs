#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const projectSchema = JSON.parse(await readFile("schemas/project.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(projectSchema);

const manifestPaths = {
  agents: "agents.yaml",
  workflow: "workflow.yaml",
  tasks: "tasks.yaml",
  handoffs: "handoffs.yaml",
  permissions: "permissions.yaml",
  capabilities: "capabilities.yaml",
  context: "context.yaml",
  memory: "memory.yaml",
  providers: "providers.yaml",
  events: "events.yaml",
  extensions: "extensions.yaml"
};

function manifest(gate) {
  return {
    specVersion: "0.1",
    kind: "Project",
    metadata: { project: "approval-target-check" },
    project: {
      id: "approval-target-check",
      displayName: "Approval Target Check",
      description: "Structural approval gate target boundary check.",
      approvalGates: [gate]
    },
    manifests: manifestPaths
  };
}

function gate(update = {}) {
  return {
    id: "review_gate",
    description: "Review is required for the declared targets.",
    ...update
  };
}

const cases = [
  {
    name: "gate without static targets",
    value: manifest(gate()),
    expected: true
  },
  {
    name: "assembly-scoped task target",
    value: manifest(gate({
      targets: [{ kind: "task", id: "review-change" }]
    })),
    expected: true
  },
  {
    name: "mixed assembly-scoped targets",
    value: manifest(gate({
      targets: [
        { kind: "capability", id: "write_repository" },
        { kind: "context-source", id: "security_knowledge" },
        { kind: "memory-scope", id: "project" }
      ]
    })),
    expected: true
  },
  {
    name: "workflow-scoped stage target",
    value: manifest(gate({
      targets: [{
        kind: "workflow-stage",
        id: "review",
        scope: { kind: "workflow", id: "delivery-workflow" }
      }]
    })),
    expected: true
  },
  {
    name: "workflow-scoped step target",
    value: manifest(gate({
      targets: [{
        kind: "workflow-step",
        id: "review-change",
        scope: { kind: "workflow", id: "delivery-workflow" }
      }]
    })),
    expected: true
  },
  {
    name: "legacy scalar targets remain structurally valid",
    value: manifest(gate({
      appliesTo: ["review-change"]
    })),
    expected: true
  },
  {
    name: "typed and legacy targets cannot coexist",
    value: manifest(gate({
      targets: [{ kind: "task", id: "review-change" }],
      appliesTo: ["review-change"]
    })),
    expected: false
  },
  {
    name: "scalar value in typed targets",
    value: manifest(gate({
      targets: ["review-change"]
    })),
    expected: false
  },
  {
    name: "actor is not an approval target kind",
    value: manifest(gate({
      targets: [{ kind: "actor", id: "reviewer" }]
    })),
    expected: false
  },
  {
    name: "workflow step without workflow scope",
    value: manifest(gate({
      targets: [{ kind: "workflow-step", id: "review-change" }]
    })),
    expected: false
  },
  {
    name: "workflow stage with wrong scope kind",
    value: manifest(gate({
      targets: [{
        kind: "workflow-stage",
        id: "review",
        scope: { kind: "project", id: "approval-target-check" }
      }]
    })),
    expected: false
  },
  {
    name: "assembly-scoped task with explicit scope",
    value: manifest(gate({
      targets: [{
        kind: "task",
        id: "review-change",
        scope: { kind: "workflow", id: "delivery-workflow" }
      }]
    })),
    expected: false
  },
  {
    name: "empty target list",
    value: manifest(gate({ targets: [] })),
    expected: false
  },
  {
    name: "duplicate typed target",
    value: manifest(gate({
      targets: [
        { kind: "task", id: "review-change" },
        { kind: "task", id: "review-change" }
      ]
    })),
    expected: false
  },
  {
    name: "extra typed target property",
    value: manifest(gate({
      targets: [{
        kind: "task",
        id: "review-change",
        reason: "Sensitive change"
      }]
    })),
    expected: false
  },
  {
    name: "invalid typed target ID",
    value: manifest(gate({
      targets: [{ kind: "capability", id: "WriteRepository" }]
    })),
    expected: false
  }
];

let failed = false;

for (const testCase of cases) {
  const actual = validate(testCase.value);
  if (actual === testCase.expected) continue;

  failed = true;
  console.error(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  if (validate.errors) console.error(JSON.stringify(validate.errors, null, 2));
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Approval gate target schema checks passed for ${cases.length} cases.`);
  console.log(
    "These checks validate authored target kind and scope, not target existence or approval enforcement."
  );
}
