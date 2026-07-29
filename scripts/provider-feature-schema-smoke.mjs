#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const providerSchema = JSON.parse(await readFile("schemas/providers.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(providerSchema);

function manifest(provider) {
  return {
    specVersion: "0.1",
    kind: "ProviderSet",
    metadata: { project: "provider-feature-check" },
    providers: [provider]
  };
}

function provider(update = {}) {
  return {
    id: "general_reasoning",
    type: "abstract",
    description: "Provider-neutral model class for structural checks.",
    ...update
  };
}

const cases = [
  {
    name: "provider without feature declaration",
    value: manifest(provider()),
    expected: true
  },
  {
    name: "one core provider feature",
    value: manifest(provider({ features: ["text_generation"] })),
    expected: true
  },
  {
    name: "complete core provider feature vocabulary",
    value: manifest(provider({
      features: [
        "text_generation",
        "code_reasoning",
        "tool_reasoning",
        "visual_reasoning",
        "policy_reasoning"
      ]
    })),
    expected: true
  },
  {
    name: "legacy provider capabilities remain structurally valid",
    value: manifest(provider({ capabilities: ["text_generation"] })),
    expected: true
  },
  {
    name: "features and legacy capabilities cannot coexist",
    value: manifest(provider({
      features: ["text_generation"],
      capabilities: ["text_generation"]
    })),
    expected: false
  },
  {
    name: "project action capability is not a provider feature",
    value: manifest(provider({ features: ["read_repository"] })),
    expected: false
  },
  {
    name: "unknown provider feature",
    value: manifest(provider({ features: ["audio_reasoning"] })),
    expected: false
  },
  {
    name: "empty provider feature list",
    value: manifest(provider({ features: [] })),
    expected: false
  },
  {
    name: "duplicate provider feature",
    value: manifest(provider({
      features: ["text_generation", "text_generation"]
    })),
    expected: false
  },
  {
    name: "scalar provider feature",
    value: manifest(provider({ features: "text_generation" })),
    expected: false
  },
  {
    name: "malformed provider feature",
    value: manifest(provider({ features: ["TextGeneration"] })),
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
  console.log(`Provider feature schema checks passed for ${cases.length} cases.`);
  console.log(
    "These checks separate provider support signals from project action capabilities; they do not select or call a provider."
  );
}
