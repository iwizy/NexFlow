#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const agentSchema = JSON.parse(await readFile("schemas/agents.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(agentSchema);

function manifest(agent) {
  return {
    specVersion: "0.1",
    kind: "AgentSet",
    metadata: { project: "agent-identity-check" },
    agents: [agent]
  };
}

const identity = {
  id: "docs-agent",
  displayName: "Docs Agent",
  role: "technical_writer",
  description: "Stable AI identity for documentation work.",
  responsibilities: ["Keep specification documentation aligned."],
  skills: ["specification_writing"]
};

const legacy = {
  ...identity,
  permissions: ["docs_write_with_review"],
  capabilities: ["read_repository"],
  contextAccess: ["repository"],
  memoryAccess: ["task"],
  autonomyLevel: "ask_before_changes",
  providerPreferences: [{
    provider: "general_reasoning",
    priority: "preferred"
  }],
  extensions: []
};

function without(object, field) {
  const copy = { ...object };
  delete copy[field];
  return copy;
}

const cases = [
  {
    name: "simplified stable identity",
    value: manifest(identity),
    expected: true
  },
  {
    name: "legacy compatibility fields",
    value: manifest(legacy),
    expected: true
  },
  {
    name: "missing role",
    value: manifest(without(identity, "role")),
    expected: false
  },
  {
    name: "missing responsibilities",
    value: manifest(without(identity, "responsibilities")),
    expected: false
  },
  {
    name: "empty responsibilities",
    value: manifest({ ...identity, responsibilities: [] }),
    expected: false
  },
  {
    name: "missing skills",
    value: manifest(without(identity, "skills")),
    expected: false
  },
  {
    name: "empty skills",
    value: manifest({ ...identity, skills: [] }),
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
  console.log(`Agent identity schema checks passed for ${cases.length} cases.`);
  console.log("Legacy behavior fields remain valid but deprecated; this check does not select an agent definition.");
}
