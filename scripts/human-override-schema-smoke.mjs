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

const validPolicy = {
  authorities: [{ kind: "actor", id: "human-maintainer" }],
  operations: ["pause_agent", "stop_workflow", "revoke_approval"],
  response: {
    blockNewActions: true,
    inFlightActions: "request_stop",
    onFailure: "remain_blocked"
  },
  resume: {
    mode: "approval_required",
    approvalGate: "human_review",
    requireReason: true
  },
  audit: {
    events: ["override.requested", "override.applied"],
    recordAuthority: true,
    recordReason: true,
    recordTarget: true,
    recordOutcome: true
  }
};

function manifest(policy) {
  return {
    specVersion: "0.1",
    kind: "Project",
    metadata: { project: "override-check" },
    project: {
      id: "override-check",
      displayName: "Override Check",
      description: "Structural human override boundary check.",
      policies: { humanOverride: policy },
      approvalGates: [{
        id: "human_review",
        description: "Human review is required."
      }]
    },
    manifests: manifestPaths
  };
}

function changed(update) {
  const policy = structuredClone(validPolicy);
  update(policy);
  return manifest(policy);
}

const cases = [
  {
    name: "valid fail-closed policy",
    value: manifest(validPolicy),
    expected: true
  },
  {
    name: "missing authorities",
    value: changed((policy) => delete policy.authorities),
    expected: false
  },
  {
    name: "scalar authority",
    value: changed((policy) => {
      policy.authorities = ["human-maintainer"];
    }),
    expected: false
  },
  {
    name: "empty operations",
    value: changed((policy) => {
      policy.operations = [];
    }),
    expected: false
  },
  {
    name: "unsupported operation",
    value: changed((policy) => {
      policy.operations = ["force_deploy"];
    }),
    expected: false
  },
  {
    name: "new actions not blocked",
    value: changed((policy) => {
      policy.response.blockNewActions = false;
    }),
    expected: false
  },
  {
    name: "unsafe failure outcome",
    value: changed((policy) => {
      policy.response.onFailure = "continue";
    }),
    expected: false
  },
  {
    name: "automatic resume",
    value: changed((policy) => {
      policy.resume.mode = "automatic";
    }),
    expected: false
  },
  {
    name: "resume without reason",
    value: changed((policy) => {
      policy.resume.requireReason = false;
    }),
    expected: false
  },
  {
    name: "audit outcome disabled",
    value: changed((policy) => {
      policy.audit.recordOutcome = false;
    }),
    expected: false
  },
  {
    name: "invalid event type",
    value: changed((policy) => {
      policy.audit.events = ["override_requested"];
    }),
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
  console.log(`Human override schema checks passed for ${cases.length} cases.`);
  console.log("These checks validate policy shape, not runtime interruption or identity authentication.");
}
