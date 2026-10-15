#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";
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

// Task closure is forward-only and does not promote the historical review.
const closure = JSON.parse(read("rfcs/reviews/2026-10-11-runtime-review-closure.json"));
const assertClosure = record => {
  assert.equal(record.formatVersion, "1"); assert.equal(record.task, "NF-102");
  assert.equal(record.recordedOn, "2026-10-11"); assert.equal(record.reviewMode, actual.reviewMode);
  assert.equal(record.maintainer, actual.maintainer);
  assert.deepEqual(record.closureAuthority, {
    type: "explicit-maintainer-scope-amendment",
    instruction: "Закрыть review; архитектура остаётся Draft",
    scope: "review-task-closure-only"
  });
  assert.equal(record.taskStatus, "closed"); assert.equal(record.resolution, "review-completed-not-ready");
  assert.equal(record.reviewPassCompleted, true); assert.equal(record.outcome, actual.outcome);
  assert.equal(record.decisionStatus, "Draft"); assert.equal(record.architectureAccepted, false);
  assert.equal(record.originalAcceptanceObjectiveSatisfied, false);
  assert.equal(record.technicalAcceptanceRequirementsWaived, false);
  assert.equal(record.reviewDeliveryRevision, "82d2f00780264b34e7241b306556808f6e0927bc");
  assert.equal(record.reviewedRevision, reviewRevision); assert.equal(record.reviewRecord, reviewRecordPath);
  const delivered = execFileSync("git", ["show", `${record.reviewDeliveryRevision}:${record.reviewRecord}`], { cwd: repositoryRoot });
  assert.equal(record.reviewRecordSha256, createHash("sha256").update(delivered).digest("hex"));
  assert.equal(record.reviewRecordSha256, createHash("sha256").update(read(reviewRecordPath)).digest("hex"));
  assert.deepEqual(record.openAcceptanceBlockers, followUps.map(f => f.id));
  assert.equal(record.mandatoryGateCount, actual.gates.length);
  assert.equal(record.runtimeImplementationAuthorized, false); assert.equal(record.releaseAuthorized, false);
  assert.equal(record.acceptanceMaintainerSignOff, null);
};
assertClosure(closure);
const closureMutations = [
  r => { r.architectureAccepted = true; }, r => { r.outcome = "accepted"; },
  r => { r.decisionStatus = "Accepted"; }, r => { r.originalAcceptanceObjectiveSatisfied = true; },
  r => { r.technicalAcceptanceRequirementsWaived = true; }, r => { r.openAcceptanceBlockers.pop(); },
  r => { r.acceptanceMaintainerSignOff = "invented"; }, r => { r.runtimeImplementationAuthorized = true; },
  r => { r.releaseAuthorized = true; }, r => { r.mandatoryGateCount = 0; },
  r => { r.closureAuthority.scope = "architecture-acceptance"; }, r => { r.reviewRecordSha256 = "0".repeat(64); }
];
for (const mutate of closureMutations) {
  const changed = structuredClone(closure); mutate(changed); assert.throws(() => assertClosure(changed));
}
const closureNote = read("rfcs/reviews/2026-10-11-runtime-review-closure.md");
for (const token of ["closed as a completed review", "RFC-0023 remains Draft", "not satisfied", "All", "eleven mandatory"]) assert.ok(closureNote.includes(token), token);
// The six-card state belongs to the immutable review, not the live tracker:
// NF-102-01's later bounded closure must not rewrite the historical review.
const originalCards = execFileSync("git", ["show", "9ae9d76b173515ba189ede6917faf97695bb5ed5:rfcs/reviews/nf-102-remediation.md"], { cwd: repositoryRoot, encoding: "utf8" });
assert.ok(originalCards.includes("All six cards remain open architecture-acceptance blockers"));
assert.ok(cards.includes("the other five cards remain open architecture-acceptance blockers"));
assert.ok(cards.includes("Status: declared-scope-complete"));
assert.ok(cards.includes("Status: evidence-collected-acceptance-blocked"));
console.log(`NF-102 task closure: explicit review-only amendment, Draft/not-ready, original six blockers preserved and ${closureMutations.length} rejection controls.`);
console.log(`NF-102 review: 74 exact inputs, recognized four-candidate repair, 11 blocked gates, 6 owned cards and ${mutations.length} rejection controls; no acceptance inferred.`);
