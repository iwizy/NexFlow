#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";

const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const actorSchema = JSON.parse(await readFile("schemas/actors.schema.json", "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(commonSchema);
const validate = ajv.compile(actorSchema);

function manifest(actors) {
  return {
    specVersion: "0.1",
    kind: "ActorSet",
    metadata: { project: "actor-boundary-check" },
    actors
  };
}

function baseActor(id, kind) {
  return {
    id,
    kind,
    displayName: id,
    description: `Boundary check for ${id}.`,
    roles: ["test_role"],
    responsibilities: ["Exercise the ActorSet schema boundary."]
  };
}

const human = baseActor("human-owner", "human");
const agent = {
  ...baseActor("docs-agent", "agent"),
  agentRef: { kind: "agent", id: "docs-agent" }
};
const automation = {
  ...baseActor("schema-check", "automation"),
  operatedBy: [{ kind: "actor", id: "human-owner" }]
};
const service = {
  ...baseActor("repository-service", "service"),
  operatedBy: [{ kind: "actor", id: "human-owner" }],
  integrationRef: { kind: "extension", id: "repository-extension" }
};
const authority = {
  ...baseActor("change-authority", "authority"),
  representedBy: [{ kind: "actor", id: "human-owner" }]
};

const cases = [
  {
    name: "all actor kinds",
    value: manifest([human, agent, automation, service, authority]),
    expected: true
  },
  {
    name: "agent without agentRef",
    value: manifest([baseActor("orphan-agent", "agent")]),
    expected: false
  },
  {
    name: "agentRef with actor kind",
    value: manifest([{
      ...baseActor("wrong-kind-agent", "agent"),
      agentRef: { kind: "actor", id: "wrong-kind-agent" }
    }]),
    expected: false
  },
  {
    name: "human with agentRef",
    value: manifest([{
      ...baseActor("synthetic-human", "human"),
      agentRef: { kind: "agent", id: "synthetic-human" }
    }]),
    expected: false
  },
  {
    name: "automation without operator",
    value: manifest([baseActor("orphan-automation", "automation")]),
    expected: false
  },
  {
    name: "service without operator",
    value: manifest([baseActor("orphan-service", "service")]),
    expected: false
  },
  {
    name: "authority without representative",
    value: manifest([baseActor("orphan-authority", "authority")]),
    expected: false
  },
  {
    name: "assembly actor reference with scope",
    value: manifest([{
      ...baseActor("scoped-automation", "automation"),
      operatedBy: [{
        kind: "actor",
        id: "human-owner",
        scope: { kind: "project", id: "actor-boundary-check" }
      }]
    }]),
    expected: false
  },
  {
    name: "actor without role",
    value: manifest([{ ...baseActor("roleless-human", "human"), roles: [] }]),
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
  console.log(`Actor schema boundary checks passed for ${cases.length} cases.`);
  console.log("These checks cover structural ActorSet safety boundaries, not full semantic validation.");
}
