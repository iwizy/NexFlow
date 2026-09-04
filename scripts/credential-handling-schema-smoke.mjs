#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const projectSchema = JSON.parse(await readFile("schemas/project.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(projectSchema);

const validPolicy = {
  default: "deny",
  rules: [{
    id: "coding-provider-credential",
    description: "Reviewed provider authentication.",
    credentialRef: "coding-provider-access",
    kind: "api_key",
    effect: "approval_required",
    actors: ["implementation-agent"],
    capabilities: ["use_credential"],
    purposes: ["provider_request"],
    targets: { providers: ["coding_reasoning"] },
    lease: {
      scope: "operation",
      renewal: "reauthorize",
      maxDurationSeconds: 900
    },
    approvalGate: "credential_access_review"
  }],
  controls: {
    valuesInManifests: "forbidden",
    ambientDiscovery: "deny",
    directActorExposure: "deny",
    delegation: "deny",
    persistence: "deny"
  },
  audit: {
    events: ["credential.decision"],
    recordDecisions: true,
    recordActor: true,
    recordCredentialRef: true,
    recordTarget: true,
    redactValues: true
  }
};

function manifest(policy = validPolicy) {
  return {
    specVersion: "0.1",
    kind: "Project",
    metadata: { project: "credential-check" },
    project: {
      id: "credential-check",
      displayName: "Credential Check",
      description: "Structural credential handling boundary check.",
      policies: { credentialHandling: policy },
      approvalGates: [{
        id: "credential_access_review",
        description: "Credential use requires review."
      }]
    }
  };
}

function changed(update) {
  const policy = structuredClone(validPolicy);
  update(policy);
  return manifest(policy);
}

const cases = [
  {
    name: "valid operation-scoped policy",
    value: manifest(),
    expected: true
  },
  {
    name: "empty rules deny all",
    value: changed((policy) => {
      policy.rules = [];
    }),
    expected: true
  },
  {
    name: "policy omission remains valid and grants nothing",
    value: {
      specVersion: "0.1",
      kind: "Project",
      metadata: { project: "credential-check" },
      project: {
        id: "credential-check",
        displayName: "Credential Check",
        description: "No credential handling policy is declared."
      }
    },
    expected: true
  },
  {
    name: "allow by default",
    value: changed((policy) => {
      policy.default = "allow";
    }),
    expected: false
  },
  {
    name: "raw value field",
    value: changed((policy) => {
      policy.rules[0].value = "not-a-real-secret";
    }),
    expected: false
  },
  {
    name: "missing credential reference",
    value: changed((policy) => {
      delete policy.rules[0].credentialRef;
    }),
    expected: false
  },
  {
    name: "unsupported credential kind",
    value: changed((policy) => {
      policy.rules[0].kind = "ambient_session";
    }),
    expected: false
  },
  {
    name: "empty actors",
    value: changed((policy) => {
      policy.rules[0].actors = [];
    }),
    expected: false
  },
  {
    name: "unknown purpose",
    value: changed((policy) => {
      policy.rules[0].purposes = ["arbitrary_access"];
    }),
    expected: false
  },
  {
    name: "empty targets",
    value: changed((policy) => {
      policy.rules[0].targets = {};
    }),
    expected: false
  },
  {
    name: "wildcard target domain",
    value: changed((policy) => {
      policy.rules[0].targets = { domains: ["*.example.com"] };
    }),
    expected: false
  },
  {
    name: "task-scoped lease",
    value: changed((policy) => {
      policy.rules[0].lease.scope = "task";
    }),
    expected: false
  },
  {
    name: "automatic lease renewal",
    value: changed((policy) => {
      policy.rules[0].lease.renewal = "automatic";
    }),
    expected: false
  },
  {
    name: "approval-required rule without gate",
    value: changed((policy) => {
      delete policy.rules[0].approvalGate;
    }),
    expected: false
  },
  {
    name: "allow rule with approval gate",
    value: changed((policy) => {
      policy.rules[0].effect = "allow";
    }),
    expected: false
  },
  {
    name: "ambient discovery enabled",
    value: changed((policy) => {
      policy.controls.ambientDiscovery = "allow";
    }),
    expected: false
  },
  {
    name: "direct actor exposure enabled",
    value: changed((policy) => {
      policy.controls.directActorExposure = "allow";
    }),
    expected: false
  },
  {
    name: "delegation enabled",
    value: changed((policy) => {
      policy.controls.delegation = "allow";
    }),
    expected: false
  },
  {
    name: "persistence enabled",
    value: changed((policy) => {
      policy.controls.persistence = "allow";
    }),
    expected: false
  },
  {
    name: "value redaction disabled",
    value: changed((policy) => {
      policy.audit.redactValues = false;
    }),
    expected: false
  },
  {
    name: "invalid audit event type",
    value: changed((policy) => {
      policy.audit.events = ["credential_decision"];
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
  console.log(`Credential handling schema checks passed for ${cases.length} cases.`);
  console.log("These checks validate authored policy shape, not credential existence, broker behavior, or runtime isolation.");
}
