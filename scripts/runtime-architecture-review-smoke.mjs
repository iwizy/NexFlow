#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { buildReviewRecord, followUps, prerequisitesPath, reviewRecordPath, reviewRevision } from "./lib/runtime-architecture-review.mjs";
import { repositoryRoot } from "./lib/runtime-evaluation.mjs";
const read = file => readFileSync(path.join(repositoryRoot, file), "utf8");
const actual = JSON.parse(read(reviewRecordPath)), expected = buildReviewRecord();
const assertReview = record => assert.deepEqual(record, expected, "unsupported review/evidence/acceptance promotion");
assert.equal(read(reviewRecordPath), JSON.stringify(actual, null, 2) + "\n");
assertReview(actual);
assert.equal(actual.outcome, "not-ready"); assert.equal(actual.taskCompleted, false);
assert.equal(actual.reviewPassCompleted, true); assert.equal(actual.independenceClaimed, false);
assert.equal(actual.evidenceIndex.length, 74);
assert.equal(new Set(actual.evidenceIndex.map(e => e.path)).size, 74);
const indexed = new Set(actual.evidenceIndex.map(e => e.path));
assert.equal(actual.prerequisiteReceipt.successfulChecks, 32);
const prerequisites = JSON.parse(read(prerequisitesPath));
assert.equal(prerequisites.checkedOn, "2026-10-11");
assert.deepEqual(prerequisites.prerequisites.map(p => p.checks.length), [10, 11, 11]);
assert.deepEqual(prerequisites.prerequisites.map(p => p.pullRequest), [114, 115, 116].map(n => `https://github.com/iwizy/NexFlow/pull/${n}`));
for (const receipt of prerequisites.prerequisites) {
  for (const ref of [receipt.headRevision, receipt.mergeRevision]) assert.match(ref, /^[a-f0-9]{40}$/u);
  for (const check of receipt.checks) {
    assert.equal(check.result, "SUCCESS"); assert.ok(Number.isFinite(Date.parse(check.completedAt)));
    assert.match(check.url, /^https:\/\/github\.com\/iwizy\/NexFlow\/actions\/runs\/\d+\/job\/\d+$/u);
  }
  execFileSync("git", ["merge-base", "--is-ancestor", receipt.headRevision, receipt.mergeRevision], { cwd: repositoryRoot });
  execFileSync("git", ["merge-base", "--is-ancestor", receipt.mergeRevision, reviewRevision], { cwd: repositoryRoot });
}
assert.equal(actual.missingComparableMetricCells, 84);
assert.equal(actual.targetRecords.length, 12);
assert.ok(actual.targetRecords.every(t => t.currentRepairLifecycle === "not-retested"));
assert.deepEqual(actual.gates.map(g => g.number), Array.from({ length: 11 }, (_, i) => i + 1));
assert.ok(actual.gates.every(g => g.status === "blocked" && g.finding && g.evidence.length && g.evidence.every(e => indexed.has(e))));
assert.deepEqual(actual.scoring.criteria.map(c => c.weight), [20, 15, 15, 10, 10, 10, 8, 5, 4, 3]);
assert.equal(actual.scoring.criteria.reduce((s,c) => s + c.weight, 0), 100);
assert.deepEqual(actual.scoring.eligibleCandidates, []); assert.deepEqual(actual.scoring.scorecards, []);
for (const candidate of actual.candidates) {
  assert.deepEqual(candidate.frozen, { passed: 352, failed: 0, "not-tested": 0 });
  assert.deepEqual(candidate.renamed, { passed: 224, failed: 0, "not-tested": 0 });
  assert.deepEqual(candidate.supplemental, { passed: 14, failed: 0, "not-tested": 0 });
  assert.equal(candidate.structuralCliPassed, 11); assert.equal(candidate.runsPerCase, 2);
  assert.equal(candidate.historicalAssessment.outcome, "ineligible");
  assert.equal(candidate.currentQualification, "not-established");
  assert.equal(candidate.eligibleForScoring, false); assert.equal(candidate.weightedTotal, null);
  assert.ok(candidate.exclusions.includes("cross-target-lifecycle"));
}
assert.deepEqual(actual.diagnosticReview.rawResultComparisons.map(r => r.rawDifferentCaseIds),
  [[], [], ["draft-2020-prefixitems-rejected"], ["draft-2020-prefixitems-rejected"]]);
assert.equal(followUps.length, 6);
const ids = new Set(followUps.map(f => f.id));
for (const task of followUps) {
  assert.equal(task.owner, "Alexander Agafonov"); assert.equal(task.classification, "blocker");
  assert.ok(task.acceptance.length >= 3 && task.authority);
  assert.ok(task.dependsOn.every(id => ids.has(id) && id < task.id));
}
for (const gate of actual.gates) assert.ok(gate.followUps.length && gate.followUps.every(id => ids.has(id)));
const note = read(reviewRecordPath.replace(".json", ".md")), cards = read("rfcs/reviews/nf-102-remediation.md");
for (const token of [reviewRevision, "74 Git-blob", "self-review, no independent assurance", "not a proven", "84 comparable metric", "NF-102 remains blocked"]) assert.ok(note.includes(token), token);
for (const task of followUps) assert.ok(cards.includes(`## ${task.id}`));
const mutations = [
  r => { r.outcome = "accepted"; }, r => { r.taskCompleted = true; }, r => { r.reviewedRevision = "main"; },
  r => { r.independenceClaimed = true; }, r => { r.acceptance.maintainerSignOff = "invented"; },
  r => { r.acceptance.selectedCandidate = "go"; }, r => { r.acceptance.runtimeImplementationAuthorized = true; },
  r => { r.acceptance.releaseAuthorized = true; }, r => { r.gates[0].status = "passed"; },
  r => { r.gates[8].followUps = []; }, r => { r.candidates[0].eligibleForScoring = true; },
  r => { r.candidates[0].weightedTotal = 100; }, r => { r.candidates[0].frozen.passed = 128; },
  r => { r.candidates[2].relocation.scope = "all-targets"; },
  r => { r.diagnosticReview.rawResultComparisons[2].rawDifferentCaseIds = []; },
  r => { r.targetRecords[0].currentRepairLifecycle = "passed"; }, r => { r.missingComparableMetricCells = 0; },
  r => { r.scoring.criteria[0].weight = 25; }, r => { r.evidenceIndex[0].sha256 = "0".repeat(64); },
  r => { r.followUps[0].classification = "follow-up"; }, r => { r.followUps[0].owner = "Invented owner"; },
  r => { r.nonBlockingDeferrals = ["signing"]; }
];
for (const mutate of mutations) {
  const changed = structuredClone(actual); mutate(changed); assert.throws(() => assertReview(changed));
}
console.log(`NF-102 review: 74 exact inputs, recognized four-candidate repair, 11 blocked gates, 6 owned cards and ${mutations.length} rejection controls; no acceptance inferred.`);
