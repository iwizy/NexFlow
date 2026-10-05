#!/usr/bin/env node
import assert from "node:assert/strict";
import { verifyStoredReports } from "./runtime-comparable-measurements.mjs";
import { candidates, metrics, assertGapReport, makeGapReports } from "./lib/comparable-measurements.mjs";

const { inputs, reports } = verifyStoredReports();
let controls = 0;
const reject = mutate => {
  const changed = structuredClone(reports[0]);
  mutate(changed);
  assert.throws(() => assertGapReport(changed, reports[0]));
  controls++;
};
assert.deepEqual(reports.map(r => r.candidate), candidates);
assert.equal(reports.reduce((n, r) => n + r.targets.flatMap(t => t.metrics).length, 0), 84);
for (const report of reports) {
  assert.equal(report.catalogCoverage.total, 352);
  assert.deepEqual(report.catalogCoverage.retainedResults, { passed: 128, failed: 0, "not-tested": 224 });
  for (const target of report.targets) {
    assert.deepEqual(target.metrics.map(m => m.metric), metrics);
    const original = inputs.lifecycle[target.target][report.candidate];
    if (original.artifact) {
      // Independently reconcile the manifest footprint and archive byte count.
      assert.equal(target.historicalArtifactObservation.archiveBytes, original.artifact.bytes);
      let total = 0;
      for (const entry of original.artifact.files) total += entry.bytes;
      assert.equal(target.historicalArtifactObservation.payloadFileBytes, total);
      assert.equal(target.historicalArtifactObservation.sha256, original.artifact.sha256);
      assert.equal(target.historicalArtifactObservation.classification, "historical-observation-not-comparable");
    } else assert.equal(target.historicalArtifactObservation, null);
    for (const metric of target.metrics) {
      assert.equal(metric.status, "not-tested");
      assert.deepEqual(metric.samples, []);
      assert.equal(metric.summary.median, null);
      assert.equal(metric.summary.count, 0);
      assert.equal(metric.comparisonEligible, false);
    }
  }
}
reject(r => { r.selection = "typescript"; });
reject(r => { r.scores = [5]; });
reject(r => { r.outcome = "passed"; });
reject(r => { r.fullCrossTargetComparability = true; });
reject(r => { r.catalogCoverage.retainedResults["not-tested"] = 0; });
reject(r => { r.retainedGates.specificationFidelity.status = "passed"; });
reject(r => { r.targets.pop(); });
reject(r => { r.targets[0].metrics.pop(); });
reject(r => { r.targets[0].metrics.push(r.targets[0].metrics[0]); });
reject(r => { r.targets[0].metrics[0].unit = "seconds"; });
reject(r => { r.targets[0].metrics[0].samples = [0]; });
reject(r => { r.targets[0].metrics[0].summary.median = 0; });
reject(r => { r.targets[0].metrics[0].status = "passed"; });
reject(r => { r.targets[0].metrics[0].comparisonEligible = true; });
reject(r => { r.targets[0].metrics[0].method.actual = "one fast failed exit"; });
reject(r => { r.targets[0].historicalArtifactObservation.classification = "comparable"; });
reject(r => { r.targets[0].historicalArtifactObservation.archiveBytes++; });
reject(r => { r.targets[0].retainedFrozenCheck.blockers = []; });
reject(r => { r.targets[0].freshCommonCandidateCohort.status = "passed"; });
reject(r => { r.prototypeRevision = "a".repeat(40); });
reject(r => { r.corpusSha256 = "a".repeat(64); });
reject(r => { r.targets[0].retainedLifecycleSource.sha256 = "a".repeat(64); });
const changedInputs = structuredClone(inputs);
changedInputs.receipt.pullRequests[4].checks[0].result = "FAILURE";
assert.throws(() => makeGapReports(changedInputs)); controls++;
assert.equal(reports[1].targets[2].historicalArtifactObservation, null);
assert.equal(reports[1].targets[2].retainedLifecycleStages.build, "failed");
assert.equal(reports[2].targets.every(t => t.retainedLifecycleStages.validateInspect === "failed"), true);
assert.equal(reports.every(r => r.targets[2].retainedLifecycleStages.offlineUse === "not-tested"), true);
assert.equal(reports[0].targets[2].retainedFrozenCheck.matched, true);
assert.equal(reports[3].targets[2].retainedFrozenCheck.matched, false);
console.log(JSON.stringify({ storedReports: 4, metricRecords: 84, rejectionControls: controls, newBenchmarkSamples: 0, outcome: "not-ready" }));
