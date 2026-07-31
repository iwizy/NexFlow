#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const schema = JSON.parse(
  await readFile("conformance/conformance-claim.schema.json", "utf8")
);
const template = parse(
  await readFile("conformance/conformance-claim.template.yaml", "utf8")
);
const humanTemplate = await readFile(
  "conformance/CONFORMANCE-CLAIM.template.md",
  "utf8"
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const levelNames = [
  "NF-MANIFEST",
  "NF-SCHEMA",
  "NF-SEMANTIC",
  "NF-CLI",
  "NF-RUNTIME",
  "NF-EXTENSION"
];

function changed(update) {
  const claim = structuredClone(template);
  update(claim);
  return claim;
}

const evidence = [{
  type: "test-suite",
  description: "Versioned tests exercise the stated support boundary.",
  uri: "https://example.com/example-tool/tests",
  revision: "v0.1.0"
}];

const cases = [
  {
    name: "maintained YAML template",
    value: template,
    expected: true
  },
  {
    name: "supported level with evidence",
    value: changed((claim) => {
      claim.claims["NF-MANIFEST"] = {
        status: "supported",
        summary: "The listed manifest kinds are authored and preserved.",
        evidence
      };
    }),
    expected: true
  },
  {
    name: "partial level with evidence and limitation",
    value: changed((claim) => {
      claim.claims["NF-SCHEMA"] = {
        status: "partial",
        summary: "Only the listed manifest kinds are validated.",
        evidence,
        limitations: ["ExtensionSet is not validated."]
      };
    }),
    expected: true
  },
  {
    name: "missing spec version scope",
    value: changed((claim) => {
      claim.scope.specVersions = [];
    }),
    expected: false
  },
  {
    name: "duplicate manifest kind",
    value: changed((claim) => {
      claim.scope.manifestKinds = ["Project", "Project"];
    }),
    expected: false
  },
  {
    name: "duplicate profile qualifier",
    value: changed((claim) => {
      claim.scope.profiles = ["core", "core"];
    }),
    expected: false
  },
  {
    name: "unknown profile qualifier",
    value: changed((claim) => {
      claim.scope.profiles = ["everything"];
    }),
    expected: false
  },
  {
    name: "unknown conformance level",
    value: changed((claim) => {
      claim.claims["NF-PROVIDER"] = {
        status: "not-evaluated",
        summary: "Unknown level."
      };
    }),
    expected: false
  },
  {
    name: "missing required conformance level",
    value: changed((claim) => {
      delete claim.claims["NF-EXTENSION"];
    }),
    expected: false
  },
  {
    name: "supported level without evidence",
    value: changed((claim) => {
      claim.claims["NF-MANIFEST"] = {
        status: "supported",
        summary: "Unsupported assertion without evidence."
      };
    }),
    expected: false
  },
  {
    name: "partial level without limitation",
    value: changed((claim) => {
      claim.claims["NF-SCHEMA"] = {
        status: "partial",
        summary: "Partial assertion without a stated gap.",
        evidence
      };
    }),
    expected: false
  },
  {
    name: "unknown publication status",
    value: changed((claim) => {
      claim.metadata.status = "certified";
    }),
    expected: false
  },
  {
    name: "invalid issued timestamp",
    value: changed((claim) => {
      claim.metadata.issuedAt = "2026-01-01";
    }),
    expected: false
  },
  {
    name: "unsupported top-level field",
    value: changed((claim) => {
      claim.certifiedBy = "NexFlow";
    }),
    expected: false
  },
  {
    name: "non-self-declared assurance",
    value: changed((claim) => {
      claim.attestation.assurance = "officially-certified";
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

const requiredHeadings = [
  "## Claim Metadata",
  "## Subject",
  "## Evaluated Scope",
  "## Level Claims",
  "## Validation Behavior",
  "## Enforcement Behavior",
  "## Overall Limitations",
  "## Evidence",
  "## Attestation"
];

for (const marker of [...requiredHeadings, ...levelNames]) {
  if (humanTemplate.includes(marker)) continue;
  failed = true;
  console.error(`Human-readable template is missing required marker: ${marker}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Conformance claim checks passed for ${cases.length} schema cases.`);
  console.log(
    `Human-readable template includes ${requiredHeadings.length} required sections and ${levelNames.length} conformance levels.`
  );
  console.log(
    "These checks validate claim structure, not external evidence or implementation conformance."
  );
}
