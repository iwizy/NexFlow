#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const schema = JSON.parse(
  await readFile("release/candidate-readiness.schema.json", "utf8")
);
const template = parse(
  await readFile("release/0.1-candidate-readiness.template.yaml", "utf8")
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const expectedCheckIds = [
  "documentation",
  "schemas",
  "examples",
  "validation",
  "rfc-governance",
  "compatibility-migrations",
  "security-limitations",
  "release-evidence"
];

const evidence = {
  type: "command",
  description: "Pinned repository validation completed successfully.",
  location: "scripts/schema-smoke",
  revision: "0123456789abcdef0123456789abcdef01234567"
};

function changed(update) {
  const record = structuredClone(template);
  update(record);
  return record;
}

function readyRecord() {
  return changed((record) => {
    record.candidate.commit = "0123456789abcdef0123456789abcdef01234567";
    record.candidate.evaluatedAt = "2026-08-02T12:00:00Z";
    record.decision = {
      outcome: "ready",
      decidedBy: "release-maintainer",
      rationale: "All candidate gates passed with recorded evidence."
    };
    for (const check of Object.values(record.checks)) {
      check.status = "passed";
      check.evidence = [evidence];
    }
  });
}

function addDecisionMetadata(record) {
  record.candidate.commit = "0123456789abcdef0123456789abcdef01234567";
  record.candidate.evaluatedAt = "2026-08-02T12:00:00Z";
  record.decision.decidedBy = "release-maintainer";
}

const cases = [
  {
    name: "maintained not-evaluated template",
    value: template,
    expected: true
  },
  {
    name: "ready candidate with complete evidence",
    value: readyRecord(),
    expected: true
  },
  {
    name: "ready candidate missing commit",
    value: changed((record) => {
      const ready = readyRecord();
      Object.assign(record, ready);
      delete record.candidate.commit;
    }),
    expected: false
  },
  {
    name: "ready candidate missing decision maker",
    value: changed((record) => {
      Object.assign(record, readyRecord());
      delete record.decision.decidedBy;
    }),
    expected: false
  },
  {
    name: "ready candidate with unresolved blocker",
    value: changed((record) => {
      Object.assign(record, readyRecord());
      record.blockers = [{
        id: "validation-failure",
        summary: "A required validation command failed."
      }];
    }),
    expected: false
  },
  {
    name: "ready candidate with unevaluated gate",
    value: changed((record) => {
      Object.assign(record, readyRecord());
      record.checks["security-limitations"].status = "not-evaluated";
      record.checks["security-limitations"].evidence = [];
    }),
    expected: false
  },
  {
    name: "passed gate without evidence",
    value: changed((record) => {
      record.checks.documentation.status = "passed";
    }),
    expected: false
  },
  {
    name: "passed gate with empty evidence location",
    value: changed((record) => {
      record.checks.documentation.status = "passed";
      record.checks.documentation.evidence = [{
        ...evidence,
        location: ""
      }];
    }),
    expected: false
  },
  {
    name: "blocked decision without blocker",
    value: changed((record) => {
      record.decision = {
        outcome: "blocked",
        rationale: "A candidate blocker remains unresolved."
      };
      addDecisionMetadata(record);
    }),
    expected: false
  },
  {
    name: "blocked decision with blocker",
    value: changed((record) => {
      record.decision = {
        outcome: "blocked",
        rationale: "A candidate blocker remains unresolved."
      };
      addDecisionMetadata(record);
      record.blockers = [{
        id: "documentation-conflict",
        summary: "Two normative documents disagree."
      }];
    }),
    expected: true
  },
  {
    name: "deferred decision without review metadata",
    value: changed((record) => {
      record.decision = {
        outcome: "deferred",
        rationale: "The review will resume after an open design decision."
      };
    }),
    expected: false
  },
  {
    name: "short candidate commit",
    value: changed((record) => {
      record.candidate.commit = "abc123";
    }),
    expected: false
  },
  {
    name: "missing known limitations",
    value: changed((record) => {
      record.limitations = [];
    }),
    expected: false
  },
  {
    name: "unsupported check key",
    value: changed((record) => {
      record.checks.runtime = {
        status: "not-evaluated",
        summary: "A runtime is outside this candidate scope.",
        evidence: []
      };
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

const actualCheckIds = Object.keys(template.checks);
if (JSON.stringify(actualCheckIds) !== JSON.stringify(expectedCheckIds)) {
  failed = true;
  console.error(
    `Template check registry mismatch: expected ${expectedCheckIds.join(", ")}; got ${actualCheckIds.join(", ")}`
  );
}

if (
  template.decision.outcome !== "not-evaluated" ||
  actualCheckIds.some((id) => template.checks[id].status !== "not-evaluated")
) {
  failed = true;
  console.error("The maintained template must not make a candidate readiness claim.");
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Candidate readiness checks passed for ${cases.length} schema cases.`);
  console.log(`The template contains all ${expectedCheckIds.length} required candidate gates.`);
  console.log(
    "These checks validate record structure and decision guards, not release evidence or tag approval."
  );
}
