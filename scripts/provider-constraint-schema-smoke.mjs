#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const providerSchema = JSON.parse(await readFile("schemas/providers.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(providerSchema);

function manifest(constraints) {
  const provider = {
    id: "general_reasoning",
    type: "abstract",
    description: "Provider-neutral model class for constraint checks."
  };
  if (constraints !== undefined) provider.constraints = constraints;

  return {
    specVersion: "0.1",
    kind: "ProviderSet",
    metadata: { project: "provider-constraint-check" },
    providers: [provider]
  };
}

const cases = [
  {
    name: "provider without constraints",
    value: manifest(),
    expected: true
  },
  {
    name: "complete structured provider constraints",
    value: manifest({
      trainingUse: "prohibited",
      dataResidency: "regions",
      allowedRegions: ["eu-west", "eu-central"],
      toolUse: "declared_tools_only",
      maxSensitivity: "confidential",
      costTier: "medium",
      latencyClass: "interactive",
      deployment: "remote",
      networkAccess: "required",
      approvalRequired: true,
      dataRetention: { mode: "bounded", maxDuration: "P30D" }
    }),
    expected: true
  },
  {
    name: "legacy training boolean remains structurally valid",
    value: manifest({ allowTrainingUse: false }),
    expected: true
  },
  {
    name: "structured and legacy training policy cannot coexist",
    value: manifest({ trainingUse: "prohibited", allowTrainingUse: false }),
    expected: false
  },
  {
    name: "empty provider constraints",
    value: manifest({}),
    expected: false
  },
  {
    name: "unknown training use policy",
    value: manifest({ trainingUse: "opt_out" }),
    expected: false
  },
  {
    name: "regional residency with region list",
    value: manifest({ dataResidency: "regions", allowedRegions: ["us-east"] }),
    expected: true
  },
  {
    name: "regional residency without region list",
    value: manifest({ dataResidency: "regions" }),
    expected: false
  },
  {
    name: "region list without regional residency mode",
    value: manifest({ dataResidency: "project_policy", allowedRegions: ["eu-west"] }),
    expected: false
  },
  {
    name: "empty region list",
    value: manifest({ dataResidency: "regions", allowedRegions: [] }),
    expected: false
  },
  {
    name: "unknown tool-use mode",
    value: manifest({ toolUse: "all_tools" }),
    expected: false
  },
  {
    name: "invalid sensitivity",
    value: manifest({ maxSensitivity: "secret" }),
    expected: false
  },
  {
    name: "invalid network posture",
    value: manifest({ networkAccess: "always" }),
    expected: false
  },
  {
    name: "bounded retention with duration",
    value: manifest({ dataRetention: { mode: "bounded", maxDuration: "PT24H" } }),
    expected: true
  },
  {
    name: "organization-managed retention",
    value: manifest({ dataRetention: { mode: "organization_policy" } }),
    expected: true
  },
  {
    name: "bounded retention without duration",
    value: manifest({ dataRetention: { mode: "bounded" } }),
    expected: false
  },
  {
    name: "provider-specific extension constraint remains preservable",
    value: manifest({
      trainingUse: "unspecified",
      "org.example.routing": { tier: "reviewed" }
    }),
    expected: true
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
  console.log(`Provider constraint schema checks passed for ${cases.length} cases.`);
  console.log(
    "These checks validate static provider eligibility vocabulary; they do not select, connect to, or authorize a provider."
  );
}
