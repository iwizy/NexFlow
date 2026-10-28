#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const root = "release/0.4-completion/";
const read = path => JSON.parse(readFileSync(path));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const archived = (revision, path) => execFileSync("git", ["show", `${revision}:${path}`], { maxBuffer: 32 * 1024 * 1024 });
const collapse = value => value.replace(/\s+/gu, " ").trim();
const amendment = read(root + "scope-amendment.json");
const dispositions = read(root + "advisory-dispositions.json");
const index = read(root + "evidence-index.json");
const rawBytes = gunzipSync(readFileSync(root + "advisories.json.gz"));
const raw = JSON.parse(rawBytes);

function criteria(text) {
  const section = text.split("## `0.4` Runtime Decision Readiness")[1];
  const block = section.split("Release readiness:\n\n")[1].split("\n\n")[0];
  const result = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("- ")) result.push(line.slice(2));
    else result[result.length - 1] += " " + line.trim();
  }
  assert.equal(result.length, 8);
  return result;
}
const previous = archived(amendment.reviewedPreviousRevision, amendment.path).toString();
const current = readFileSync(amendment.path, "utf8");
assert.equal(collapse(criteria(previous)[1]), amendment.oldText);
assert.equal(collapse(criteria(current)[1]), amendment.newText);
for (let i = 0; i < 8; i++) if (i !== 1) assert.equal(criteria(current)[i], criteria(previous)[i]);
assert.equal(amendment.outcome, "adopted-forward-amendment");
for (const k of ["allFourComparable", "originalAll84SuccessfulCriterionSatisfied", "originalR2Satisfied", "weightsChanged", "hardGatesChanged", "candidateSourcesChanged", "personalReviewClaimed", "independenceClaimed", "publicationAuthorized", "runtimeImplementationAuthorized"]) assert.equal(amendment[k], false);
assert.ok(amendment.authority.length > 100);
for (const item of index.sourceEntries) {
  assert.equal(sha(archived(index.revision, item.path)), item.sha256);
  assert.equal(sha(readFileSync(item.path)), item.sha256, `Reviewed code or evidence drifted: ${item.path}`);
}
assert.equal(sha(rawBytes), index.rawScanSha256);
assert.equal(sha(readFileSync(root + "advisories.json.gz")), index.rawScanCompressedSha256);
assert.equal(raw.results.length, 9);
assert.equal(raw.results.reduce((n, row) => n + row.queryCount, 0), 2277);
assert.ok(raw.results.every(row => row.status === "completed"));
assert.match(raw.recordedAt, /^2026-10-28T/u);
const expected = [];
for (const result of raw.results) {
  assert.equal(sha(readFileSync(result.inventoryPath)), result.inventorySha256);
  const old = read(result.inventoryPath.replace("inventory.json", "advisories.json"));
  for (const a of result.advisories) if (!old.advisories.some(o => o.id === a.id)) expected.push(`${result.candidate}:${a.id}`);
  assert.equal(result.advisoryCount, new Set(result.queries.flatMap(q => q.matches.map(m => m.id))).size);
  for (const page of result.pages) assert.equal(sha(JSON.stringify(page.response)), page.responseSha256);
}
assert.equal(expected.length, 40);
assert.deepEqual(dispositions.findings.map(f => f.id), expected);
assert.equal(new Set(dispositions.findings.map(f => f.advisoryId)).size, 31);
assert.equal(dispositions.fixesApplied, false);
assert.equal(dispositions.dynamicValidationPerformed, false);
assert.equal(dispositions.independenceClaimed, false);
for (const finding of dispositions.findings) {
  assert.equal(finding.verdict, "not_actionable");
  assert.equal(finding.upstreamFixed, false);
  assert.ok(finding.reason.length > 100 && finding.scopeLimit.length > 50);
  assert.ok(finding.locations.length && finding.references.includes(`https://osv.dev/vulnerability/${finding.advisoryId}`));
}
const closure = read("evaluation/supply-chain/2026-10-15-repaired/tool-closure.json");
assert.equal(closure.tools.npm.files.find(f => f.file === index.externalNpmImporter.file).sha256, index.externalNpmImporter.sha256);
assert.ok(closure.tools.pip.files.some(f => f.file === "pip/_vendor/msgpack/fallback.py"));
assert.ok(!closure.tools.pip.files.some(f => /msgpack.*\.(so|pyd|dll)$|setuptools\/wheel\.py/u.test(f.file)));
const measurement = read("evaluation/measurement-qualification/summary.json");
assert.equal(measurement.allFourComparable, false);
assert.equal(measurement.measuredCells, 42);
assert.equal(measurement.excludedCells, 42);
assert.equal(read("evaluation/architecture/revised/decision.json").outcome, "accepted");

function verifyDecision(record) {
  assert.equal(record.outcome, "ready-with-notes");
  assert.match(record.assessmentSourceRevision, /^[a-f0-9]{40}$/u);
  assert.deepEqual(record.criteria.map(c => c.id), Array.from({ length: 8 }, (_, i) => `R${i + 1}`));
  assert.ok(record.criteria.every(c => c.status === "passed"));
  assert.deepEqual(record.openApplicableBlockers, []);
  assert.deepEqual(record.closedBlockers, ["NF-103-01", "NF-103-02"]);
  assert.ok(record.notes.length >= 7);
  for (const k of ["publicationAuthorized", "tagAuthorized", "packagePublicationAuthorized", "versionChanges", "runtimeImplementationAuthorized", "signingPerformed", "independenceClaimed", "personalReviewClaimed"]) assert.equal(record[k], false);
  assert.equal(record.originalAllFourSuccessfulCriterionSatisfied, false);
  assert.equal(record.allFourComparable, false);
  assert.ok(record.authority.length > 100);
}
if (existsSync(root + "record.json")) {
  const record = read(root + "record.json"); verifyDecision(record);
  const checks = read(root + "source-checks.json");
  assert.equal(checks.sourceRevision, record.assessmentSourceRevision);
  const names = Object.keys(JSON.parse(archived(checks.sourceRevision, "package.json")).scripts).filter(k => !["cli-prototype", "runtime-evaluation-report"].includes(k));
  assert.deepEqual(checks.checks.map(c => c.name), [...names, "release-0-4-readiness", "release-0-4-completion"]);
  assert.ok(checks.checks.every(c => c.exitCode === 0));
  assert.equal(checks.cleanSourceBefore && checks.cleanSourceAfter, true);
  const ci = read(root + "candidate-ci.json");
  assert.equal(ci.sourceRevision, record.assessmentSourceRevision);
  assert.equal(ci.runs.length, 5);
  assert.ok(ci.runs.every(r => r.headSha === record.assessmentSourceRevision && r.status === "completed" && r.conclusion === "success"));
  for (const input of record.immutableInputs) {
    assert.equal(sha(archived(record.assessmentSourceRevision, input.path)), input.sha256);
    if (input.currentBytesMustMatch) assert.equal(sha(readFileSync(input.path)), input.sha256);
  }
  const invalid = [r => r.criteria.pop(), r => r.openApplicableBlockers.push("unresolved"), r => r.allFourComparable = true, r => r.publicationAuthorized = true, r => r.independenceClaimed = true];
  for (const mutate of invalid) { const value = structuredClone(record); mutate(value); assert.throws(() => verifyDecision(value)); }
  console.log(`NF-103: exact-candidate ready-with-notes record verified, eight criteria, ${checks.checks.length} source checks and five CI receipts. Publication requires a separate command.`);
} else {
  console.log("NF-103: forward amendment and all 40 new advisory inputs verified; exact-candidate readiness decision has not yet been recorded.");
}
