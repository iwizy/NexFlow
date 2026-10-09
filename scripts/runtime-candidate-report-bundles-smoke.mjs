#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { assessReport, validateReport } from "./lib/runtime-evaluation.mjs";
import { candidates, criteria, assertPacket } from "./lib/candidate-report-bundles.mjs";
import { verifyCandidateBundles } from "./runtime-candidate-report-bundles.mjs";

const packet = verifyCandidateBundles();
assert.equal(Object.keys(packet).length, 11);
const matrix = readFileSync("docs/language-evaluation-matrix.md", "utf8").split("## Weighted Criteria")[1].split("### Scoring Scale")[0];
const weights = [...matrix.matchAll(/^\| ([^|]+) \| (\d+) \|/gmu)].map(m => [m[1].toLowerCase().replace(/[^a-z]/gu, ""), Number(m[2])]);
assert.deepEqual(weights, criteria.map(([id, weight]) => [id.toLowerCase(), weight]));
assert.equal(criteria.reduce((sum, [, weight]) => sum + weight, 0), 100);
let metricGaps = 0;
for (const c of candidates) {
  const r = packet[`evaluation/reports/${c}/candidate.json`];
  const b = packet[`evaluation/reports/${c}/bundle.json`];
  assert.equal(validateReport(r), true);
  assert.equal(assessReport(r).outcome, "ineligible");
  assert.equal(b.outcome, "not-ready");
  assert.equal(b.selection, null);
  assert.equal(b.scores, null);
  assert.equal(b.fidelity.counts["not-tested"], 224);
  assert.equal(b.fidelity.fullCatalogCases, 352);
  assert.equal(b.sources.length, 16);
  assert.equal(b.supplyChain.refreshed, false);
  assert.equal(b.supplyChain.status, "partial");
  assert.equal(b.supplyChain.advisoryReview.reachability, "not-tested");
  assert.equal(b.supplyChain.advisoryReview.fixesApplied, false);
  assert.equal(r.reviewerScorecards.length, 0);
  assert.equal(r.reconciliation, null);
  assert.deepEqual(r.measurements, []);
  for (const t of b.targets) {
    assert.equal(t.metrics.length, 7);
    assert.equal(t.stages.upgrade, "not-tested");
    assert.equal(t.stages.rollback, "not-tested");
    assert.equal(t.stages.signing, "not-tested");
    for (const m of t.metrics) {
      assert.equal(m.status, "not-tested");
      assert.equal(m.sampleCount, 0);
      assert.equal(m.median, null);
      assert.equal(m.comparisonEligible, false);
      metricGaps++;
    }
  }
  const cli = spawnSync(process.execPath, ["scripts/runtime-evaluation-report.mjs", `evaluation/reports/${c}/candidate.json`], { encoding: "utf8" });
  assert.equal(cli.status, 1);
  assert.equal(cli.stderr, "");
  assert.equal(JSON.parse(cli.stdout).outcome, "ineligible");
}
assert.equal(metricGaps, 84);
for (const slot of ["reviewer-a", "reviewer-b"]) {
  const form = packet[`evaluation/reports/review/${slot}.json`];
  assert.equal(form.reviewer, null);
  assert.equal(form.signature, null);
  assert.equal(form.independenceConfirmed, false);
  assert.equal(form.reportSet.length, 4);
  for (const card of form.candidateCards) {
    assert.equal(card.eligibleForScoring, false);
    assert.equal(card.weightedTotal, null);
    assert.deepEqual(card.criteria.map(({ id, weight }) => [id, weight]), criteria);
    for (const criterion of card.criteria) {
      assert.equal(criterion.score, null);
      assert.deepEqual(criterion.evidence, []);
    }
  }
}
assert.deepEqual(packet["evaluation/reports/review/reviewer-a.json"].reportSet, packet["evaluation/reports/review/reviewer-b.json"].reportSet);
assert.deepEqual(packet["evaluation/reports/review/reconciliation.json"].reportSet, packet["evaluation/reports/review/reviewer-a.json"].reportSet);
const rust = packet["evaluation/reports/rust/bundle.json"];
assert.equal(rust.targets.every(t => t.stages.validateInspect === "failed"), true);
assert.equal(packet["evaluation/reports/python/bundle.json"].targets[2].stages.build, "failed");
assert.equal(packet["evaluation/reports/python/bundle.json"].targets[2].artifact, null);
assert.equal(packet["evaluation/reports/python/bundle.json"].supplyChain.advisoryReview.advisoryRecords, 16);
assert.equal(packet["evaluation/reports/go/bundle.json"].supplyChain.advisoryReview.advisoryRecords, 1);

let controls = 0;
const reject = mutate => {
  const changed = structuredClone(packet);
  mutate(changed);
  assert.throws(() => assertPacket(changed, packet));
  controls++;
};
const r = "evaluation/reports/typescript/candidate.json";
const b = "evaluation/reports/typescript/bundle.json";
const a = "evaluation/reports/review/reviewer-a.json";
const rec = "evaluation/reports/review/reconciliation.json";
reject(p => { delete p[r]; });
reject(p => { p[r].status = "complete"; });
reject(p => { p[r].prototype.revision = "a".repeat(40); });
reject(p => { p[r].evaluationPackageRevision = "a".repeat(40); });
reject(p => { p[r].hardGates.specificationFidelity.status = "passed"; });
reject(p => { p[r].hardGates.securityBoundary.status = "passed"; });
reject(p => { p[r].hardGates.supplyChainEvidence.status = "passed"; });
reject(p => { p[r].targets[2].result = "passed"; });
reject(p => { p[r].measurements = [{ target: "linux/amd64", metric: "validationMs", value: 0, runs: 1, method: "invented", evidence: "invented" }]; });
reject(p => { p[r].reviewerScorecards = [{ reviewer: "unconfirmed", scores: {} }]; });
reject(p => { p[r].reconciliation = "unconfirmed"; });
reject(p => { p[r].evidence.pop(); });
reject(p => { p[b].candidateReport.assessment.outcome = "candidate-evidence-complete"; });
reject(p => { p[b].fidelity.counts["not-tested"] = 0; });
reject(p => { p[b].fidelity.fullCatalogCases = 128; });
reject(p => { p[b].sources[0].sha256 = "a".repeat(64); });
reject(p => { p[b].targets[0].metrics[0].median = 0; });
reject(p => { p[b].targets[0].metrics[0].comparisonEligible = true; });
reject(p => { p[b].targets[0].metrics.pop(); });
reject(p => { p[b].targets[0].frozenCheck.matched = true; });
reject(p => { p[b].targets[2].stages.install = "passed"; });
reject(p => { p["evaluation/reports/rust/bundle.json"].targets[0].stages.validateInspect = "passed"; });
reject(p => { p["evaluation/reports/python/bundle.json"].supplyChain.advisoryReview.advisoryRecords = 0; });
reject(p => { p[b].supplyChain.refreshed = true; });
reject(p => { p[b].supplyChain.recordedAt = "2026-10-09"; });
reject(p => { p[b].ownership = "confirmed"; });
reject(p => { p[b].selection = "typescript"; });
reject(p => { p[a].reviewer = "unconfirmed"; });
reject(p => { p[a].signature = "unconfirmed"; });
reject(p => { p[a].independenceConfirmed = true; });
reject(p => { p[a].candidateCards[0].criteria[0].score = 5; });
reject(p => { p[a].candidateCards[0].criteria[0].weight = 21; });
reject(p => { p[a].reportSet[0].sha256 = "a".repeat(64); });
reject(p => { p[rec].outcome = "accepted"; });
reject(p => { p[rec].reviewers = ["same", "same"]; });
reject(p => { p[rec].agreedScores = [5]; });
console.log(`Candidate bundles: 4 schema-valid/ineligible assessments, 84 retained metric gaps, 80 prerequisite CI receipts, 2 blank scorecards, blank reconciliation and ${controls} rejection controls passed; packet not-ready.`);
