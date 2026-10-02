#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assessReport, baseline, compareOutput, digest, repositoryRoot, safeRelative,
  validateOutput, validateReport, verifyCorpus
} from "./lib/runtime-evaluation.mjs";

assert.deepEqual(verifyCorpus(), []);
assert.equal(baseline.targetsConfirmedAt, "2026-10-01");
assert.deepEqual(baseline.targets.map(target => [target.os, target.architecture, target.selection]), [
  ["linux", "amd64", "confirmed"],
  ["macos", "arm64", "confirmed"],
  ["windows", "amd64", "confirmed"]
]);
for (const file of baseline.corpus.files) {
  const committed = execFileSync("git", ["show", baseline.specificationRevision + ":" + file.path],
    { cwd: repositoryRoot, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 4 * 1024 * 1024 });
  assert.equal(digest(committed), file.sha256, "Corpus must match its pinned specification revision");
}
for (const locator of ["../outside", "/absolute", "C:/absolute", "folder/../outside", "folder\\file", "a\0b"]) {
  assert.equal(safeRelative(locator), false);
}
const changed = structuredClone(baseline);
changed.corpus.files[0].sha256 = "0".repeat(64);
assert.ok(verifyCorpus(changed).includes("corpus-content-changed"));
assert.ok(verifyCorpus(changed).includes("corpus-inventory-changed"));
const duplicate = structuredClone(baseline);
duplicate.corpus.files.push(duplicate.corpus.files[0]);
assert.ok(verifyCorpus(duplicate).includes("invalid-corpus-entry"));
const escape = structuredClone(baseline);
escape.corpus.files[0].path = "../outside";
let unsafeRead = false;
verifyCorpus(escape, file => {
  if (!safeRelative(file)) unsafeRead = true;
  return readFileSync(path.join(repositoryRoot, file));
});
assert.equal(unsafeRead, false);
assert.ok(verifyCorpus(baseline, () => { throw new Error("missing"); }).includes("corpus-file-unavailable"));
assert.ok(verifyCorpus({ ...baseline, scope: "runtime" }).includes("invalid-scope"));

const template = JSON.parse(readFileSync(path.join(repositoryRoot, "evaluation/candidate-report.template.json"), "utf8"));
assert.equal(validateReport(template), true);
assert.equal(assessReport(template).outcome, "not-ready");
for (const candidate of baseline.candidates) {
  const record = JSON.parse(readFileSync(path.join(repositoryRoot, "evaluation/candidates/" + candidate + ".json"), "utf8"));
  assert.equal(record.candidate, candidate);
  assert.equal(record.status, record.prototype.revision ? "in-progress" : "not-started");
  assert.equal(validateReport(record), true);
  assert.equal(assessReport(record).outcome, "not-ready");
}
const emptyReport = spawnSync(process.execPath, [
  "scripts/runtime-evaluation-report.mjs", "evaluation/candidate-report.template.json"
], { cwd: repositoryRoot, encoding: "utf8" });
assert.equal(emptyReport.status, 1);
assert.equal(JSON.parse(emptyReport.stdout).outcome, "not-ready");
const unsupported = structuredClone(template);
unsupported.candidate = "other";
assert.equal(validateReport(unsupported), false);
const passedWithoutEvidence = structuredClone(template);
passedWithoutEvidence.hardGates.offlineOperation.status = "passed";
assert.equal(validateReport(passedWithoutEvidence), false);
const scoreWithoutEvidence = structuredClone(template);
const scores = Object.fromEntries([
  "specificationAndValidationFidelity", "securityAndIsolationFit", "crossPlatformDistribution",
  "ecosystemAndIntegrationFit", "contributorAccessibility", "maintainability",
  "performanceAndResourceUse", "observabilityAndDiagnostics", "embeddingAndInteroperability",
  "operationalFootprint"
].map(metric => [metric, { score: 0, evidence: [] }]));
scoreWithoutEvidence.reviewerScorecards = [{ reviewer: "reviewer-one", scores: structuredClone(scores) }];
scoreWithoutEvidence.reviewerScorecards[0].scores.maintainability.score = 5;
assert.equal(validateReport(scoreWithoutEvidence), false);

// Synthetic records exercise validation; they are not published candidate evidence.
const complete = structuredClone(template);
complete.candidate = "typescript";
complete.status = "complete";
complete.evaluationPackageRevision = "1".repeat(40);
complete.prototype.revision = "2".repeat(40);
complete.prototype.source = "prototypes/typescript";
complete.toolchain = { version: "test-version", dependencyLock: "test.lock", buildCommand: "test-build" };
complete.evidence = ["evidence/test-record.json"];
for (const target of complete.targets) {
  target.result = "passed";
  target.evidence = [...complete.evidence];
}
for (const gate of Object.values(complete.hardGates)) {
  gate.status = "passed";
  gate.evidence = [...complete.evidence];
}
complete.reviewerScorecards = ["reviewer-one", "reviewer-two"].map(reviewer => ({
  reviewer, scores: structuredClone(scores)
}));
complete.reconciliation = "evidence/test-record.json";
complete.measurements = complete.targets.flatMap(target => [
  "coldStartMs", "validationMs", "peakMemoryBytes", "artifactBytes", "cleanBuildMs", "cachedBuildMs", "ciMs"
].map(metric => ({
  target: target.os + "/" + target.architecture, metric, value: 1, runs: 2,
  method: "synthetic unit-test record", evidence: complete.evidence[0]
})));
assert.equal(assessReport(complete).outcome, "candidate-evidence-complete");
const unconfirmed = structuredClone(baseline);
unconfirmed.targets[0].selection = "proposed";
assert.ok(assessReport(complete, unconfirmed).blockers.includes("unconfirmed-experiment-targets"));
const fail = structuredClone(complete);
fail.hardGates.scopeIntegrity.status = "failed";
assert.equal(assessReport(fail).outcome, "ineligible");
const stale = structuredClone(complete);
stale.specificationRevision = "3".repeat(40);
assert.equal(assessReport(stale).outcome, "not-ready");
const partial = structuredClone(complete);
partial.hardGates.securityBoundary.status = "not-tested";
assert.equal(assessReport(partial).outcome, "not-ready");
const duplicateReviewer = structuredClone(complete);
duplicateReviewer.reviewerScorecards[1].reviewer = "reviewer-one";
assert.equal(assessReport(duplicateReviewer).outcome, "not-ready");
const missingTarget = structuredClone(complete);
missingTarget.targets.pop();
assert.equal(assessReport(missingTarget).outcome, "not-ready");
const missingMeasurement = structuredClone(complete);
missingMeasurement.measurements.pop();
assert.equal(assessReport(missingMeasurement).outcome, "not-ready");
const unlinked = structuredClone(complete);
unlinked.hardGates.offlineOperation.evidence = ["evidence/unlisted.json"];
assert.equal(assessReport(unlinked).outcome, "not-ready");

const item = baseline.cases.find(entry => entry.id === "inspect-valid-project");
const reference = execFileSync(process.execPath, [
  "scripts/cli-prototype.mjs", item.command, "--root", item.root, "--format", "json"
], { cwd: repositoryRoot, encoding: "utf8" });
const output = JSON.parse(reference);
assert.equal(validateOutput(output), true);
assert.deepEqual(compareOutput(item, output, 0, ""), []);
assert.ok(compareOutput(item, output, 1, "").includes("wrong-exit-status"));
assert.ok(compareOutput(item, output, 0, "unexpected").includes("unexpected-stderr"));
const authority = structuredClone(output);
authority.executionAuthorized = true;
assert.equal(validateOutput(authority), false);
const incorrect = structuredClone(output);
incorrect.result.inspection.resources.pop();
assert.ok(compareOutput(item, incorrect, 0, "").includes("wrong-inspection"));
const malformed = spawnSync(process.execPath, ["scripts/runtime-evaluation-run.mjs", "--command", "null"],
  { cwd: repositoryRoot, encoding: "utf8" });
assert.equal(malformed.status, 1);
assert.equal(malformed.stdout, "");
assert.ok(!malformed.stderr.includes(repositoryRoot));
console.log("Runtime evaluation packet checks passed: pinned corpus, rejection paths, shared output and non-claiming reports.");
