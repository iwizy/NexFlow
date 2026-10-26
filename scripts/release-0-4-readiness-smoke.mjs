#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const root = "release/0.4/";
const read = p => JSON.parse(readFileSync(p));
const sha = b => createHash("sha256").update(b).digest("hex");
const record = read(root + "record.json");
const index = read(root + "evidence-index.json");
const source = record.assessmentSourceRevision;
const gitBytes = p => execFileSync("git", ["show", `${source}:${p}`], { maxBuffer: 32 * 1024 * 1024 });

function validate(r) {
  assert.equal(r.task, "NF-103");
  assert.match(r.assessmentSourceRevision, /^[a-f0-9]{40}$/u);
  assert.equal(r.outcome, "not-ready");
  assert.equal(r.taskComplete, false);
  assert.deepEqual(r.criteria.map(c => c.id), Array.from({ length: 8 }, (_, i) => `R${i + 1}`));
  assert.deepEqual(r.criteria.map(c => c.status), ["passed", "blocked", "passed", "passed", "passed", "passed", "passed", "passed"]);
  assert.deepEqual(r.openBlockers.map(b => b.id), ["NF-103-01", "NF-103-02"]);
  for (const b of r.openBlockers) assert.ok(b.owner && b.scope.length > 50);
  assert.deepEqual(r.criteria[1].blockerIds, ["NF-103-01"]);
  assert.equal(r.comparison.allFourComparable, false);
  assert.equal(r.comparison.originalAll84SuccessfulCriterionSatisfied, false);
  assert.equal(r.comparison.measuredCells, 42);
  assert.equal(r.comparison.excludedCells, 42);
  assert.equal(r.maintainerReleaseDecision, "not-granted-technical-blockers-open");
  for (const k of ["publicationAuthorized", "tagAuthorized", "packagePublicationAuthorized", "versionChanges", "runtimeImplementationAuthorized"]) assert.equal(r[k], false);
  for (const k of ["personalReviewClaimed", "independenceClaimed", "signatureInvented"]) assert.equal(r.review[k], false);
  for (const k of ["executableAssets", "embeddedRuntime", "evaluationCapsuleAssets", "signingPerformed", "notarizationPerformed", "trustedNativePublisherClaimed"]) assert.equal(r.proposedDistribution[k], false);
  assert.equal(r.finalCandidateReassessmentRequired, true);
}
validate(record);
assert.equal(index.assessmentSourceRevision, source);
assert.ok(index.entries.length >= 40);
assert.equal(new Set(index.entries.map(e => e.path)).size, index.entries.length);
for (const e of index.entries) {
  assert.equal(e.revision, source);
  assert.equal(e.url, `https://github.com/iwizy/NexFlow/blob/${source}/${e.path}`);
  const bytes = gitBytes(e.path);
  assert.equal(bytes.length, e.bytes);
  assert.equal(sha(bytes), e.sha256, `Archived source changed: ${e.path}`);
  if (e.currentBytesMustMatch) assert.equal(sha(readFileSync(e.path)), e.sha256, `Technical input changed: ${e.path}`);
}

const checks = read(root + "source-checks.json");
const expected = Object.keys(JSON.parse(gitBytes("package.json")).scripts).filter(k => !checks.excludedEntries.includes(k));
assert.deepEqual(checks.excludedEntries, ["cli-prototype", "runtime-evaluation-report"]);
assert.equal(checks.sourceRevision, source);
assert.deepEqual(checks.checks.map(c => c.name), expected);
assert.equal(checks.passed, expected.length);
assert.equal(checks.failed, 0);
assert.equal(checks.cleanSourceBefore && checks.cleanSourceAfter, true);
assert.ok(checks.checks.every(c => c.exitCode === 0 && c.result === "passed"));
const remote = read(root + "remote-state.json");
assert.equal(remote.assessmentSourceRevision, source);
assert.equal(remote.mainWorkflows.length, 4);
assert.ok(remote.mainWorkflows.every(r => r.headSha === source && r.status === "completed" && r.conclusion === "success"));
assert.ok(!remote.releases.some(r => r.tagName === "v0.4.0"));

const decision = read("evaluation/architecture/revised/decision.json");
assert.equal(decision.outcome, "accepted");
assert.equal(record.architecture.reviewedRevision, decision.reviewedRfcRevision);
assert.equal(record.architecture.reviewRecordRevision, decision.reviewRecordRevision);
assert.equal(record.architecture.decisionRevision, remote.architecturePr.head);
assert.equal(remote.architecturePr.merge, source);
const measurements = read("evaluation/measurement-qualification/summary.json");
assert.equal(measurements.allFourComparable, false);
assert.equal(measurements.measuredCells, record.comparison.measuredCells);
assert.equal(measurements.excludedCells, record.comparison.excludedCells);

const advisory = read(root + "advisory-review.json");
const rawBytes = gunzipSync(readFileSync(root + advisory.rawRecord));
assert.equal(sha(rawBytes), advisory.rawUncompressedSha256);
const raw = JSON.parse(rawBytes);
assert.equal(raw.assessmentSourceRevision, source);
assert.equal(advisory.assessmentSourceRevision, source);
assert.equal(advisory.graphs.length, 9);
assert.equal(raw.results.length, 9);
assert.equal(advisory.queryCount, raw.results.reduce((n, r) => n + r.queryCount, 0));
assert.equal(advisory.fixesApplied, false);
assert.equal(advisory.blocker, "NF-103-02");
for (const graph of advisory.graphs) {
  const result = raw.results.find(r => r.candidate === graph.candidate);
  assert.equal(result.status, "completed");
  assert.equal(sha(gitBytes(graph.inventoryPath)), graph.inventorySha256);
  assert.equal(result.inventorySha256, graph.inventorySha256);
  assert.equal(sha(gitBytes(graph.previousScanPath)), graph.previousScanSha256);
  const old = JSON.parse(gitBytes(graph.previousScanPath));
  assert.equal(graph.previousAdvisoryCount, old.advisoryCount);
  assert.equal(graph.currentAdvisoryCount, result.advisoryCount);
  assert.deepEqual(graph.newIds, result.advisories.filter(a => !old.advisories.some(o => o.id === a.id)).map(a => a.id));
  assert.equal(result.advisoryCount, new Set(result.queries.flatMap(q => q.matches.map(m => m.id))).size);
  for (const page of result.pages) assert.equal(sha(JSON.stringify(page.response)), page.responseSha256);
}
const npmAudit = read(root + "npm-audit.json");
assert.equal(npmAudit.vulnerabilities["fast-uri"].via.length, 4);
assert.equal(npmAudit.metadata.vulnerabilities.moderate, 1);
assert.ok(advisory.graphs.find(g => g.candidate === "typescript").newIds.length > 0);
assert.equal(sha(readFileSync(advisory.scannerPath)), advisory.scannerSha256);

const sums = readFileSync(root + "SHA256SUMS", "utf8").trim().split("\n");
assert.ok(sums.length >= 10);
for (const line of sums) {
  const match = /^([a-f0-9]{64})  ((?:release|scripts)\/[^\s]+)$/u.exec(line);
  assert.ok(match && !match[2].split("/").includes(".."));
  assert.equal(sha(readFileSync(match[2])), match[1], `Checksum mismatch: ${match[2]}`);
}
// Reject loss of a gate/blocker, fabricated readiness, measurement or authority.
const mutations = [r => r.criteria.pop(), r => r.openBlockers.pop(), r => r.outcome = "ready", r => r.comparison.allFourComparable = true, r => r.publicationAuthorized = true, r => r.review.independenceClaimed = true];
for (const mutate of mutations) { const invalid = structuredClone(record); mutate(invalid); assert.throws(() => validate(invalid)); }
console.log(`0.4 readiness integrity passed: eight criteria, ${index.entries.length} immutable inputs, ${expected.length} source checks, nine fresh advisory graphs, two retained blockers and ${mutations.length} rejection cases; outcome not-ready.`);
