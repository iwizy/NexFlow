import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { checkEnvironment } from "./evaluation-environment.mjs";

export const candidates = ["typescript", "python", "rust", "go"];
export const metrics = ["coldStartMs", "validationMs", "peakMemoryBytes", "artifactBytes", "cleanBuildMs", "cachedBuildMs", "ciMs"];
export const sha256 = value => createHash("sha256").update(value).digest("hex");
const encode = value => JSON.stringify(value);

const methods = {
  coldStartMs: "External monotonic clock; fresh process for each unchanged CLI workload. Separate valid success, expected rejection and unexpected failure.",
  validationMs: "Warm native library process, excluding startup and provisioning; full ordered catalog and identical corpus passes. Unsupported operations are not completed validation.",
  peakMemoryBytes: "External native OS peak resident memory, including interpreter; disclose child-process accounting and exact instrument/version.",
  artifactBytes: "Byte count and SHA-256 of exact evaluation capsule; separately disclose installed payload and external runtime/native prerequisites.",
  cleanBuildMs: "External monotonic clock; empty project build cache, provisioned pinned dependency cache, verified OS network denial.",
  cachedBuildMs: "External monotonic clock; unchanged source and populated project build cache, verified OS network denial.",
  ciMs: "Execution excluding queue wait; separate provisioning/build/test/upload timings and cache hits for each repeated job."
};

export function makeGapReports({ receipt, contract, pins, catalog, inventory, fidelity, lifecycle, hashes }) {
  assert.equal(receipt.task, "NF-056-15");
  assert.deepEqual(receipt.pullRequests.map(p => p.task), ["NF-056-02", "NF-056-09", "NF-056-12", "NF-056-13", "NF-056-14"]);
  for (const pr of receipt.pullRequests) {
    assert.match(pr.head, /^[a-f0-9]{40}$/u);
    assert.ok(["MERGED", "OPEN"].includes(pr.state));
    assert.ok(pr.checks.length > 0 && pr.checks.every(check => check.result === "SUCCESS"));
  }
  assert.equal(hashes.catalog, inventory.catalogSha256);
  assert.equal(catalog.cases.length, inventory.caseCount);
  assert.equal(new Set(catalog.cases.map(c => c.id)).size, inventory.caseCount);
  assert.equal(contract.specificationRevision, pins.specificationRevision);
  assert.equal(contract.corpusSha256, pins.corpusSha256);
  assert.equal(hashes.catalog, pins.catalogSha256);
  const operationCounts = {};
  catalog.cases.forEach(c => { operationCounts[c.operation] = (operationCounts[c.operation] || 0) + 1; });
  assert.deepEqual(operationCounts, inventory.operationCounts);
  assert.equal(receipt.lifecycleSources.length, 12);
  assert.equal(new Set(receipt.lifecycleSources.map(s => s.target + "/" + s.candidate)).size, 12);
  return candidates.map(candidate => {
    const f = fidelity[candidate];
    assert.equal(f.prototypeRevision, pins.candidates[candidate].sourceRevision);
    assert.equal(f.evaluationPackageRevision, pins.evaluationPackageRevision);
    assert.equal(f.specificationRevision, pins.specificationRevision);
    assert.equal(f.corpusSha256, pins.corpusSha256);
    assert.equal(f.catalogSha256, hashes.catalog);
    assert.deepEqual(f.library.results.map(({ id, operation }) => ({ id, operation })), catalog.cases.map(({ id, operation }) => ({ id, operation })));
    const coverage = { passed: 0, failed: 0, "not-tested": 0 };
    const unsupportedByOperation = {};
    for (const item of f.library.results) {
      assert.ok(Object.hasOwn(coverage, item.result));
      coverage[item.result]++;
      if (item.result === "not-tested") unsupportedByOperation[item.operation] = (unsupportedByOperation[item.operation] || 0) + 1;
    }
    assert.deepEqual(coverage, f.library.counts);
    assert.equal(f.gates.specificationFidelity.status, "failed");
    assert.equal(f.gates.deterministicDiagnostics.status, "not-tested");
    const targets = contract.targets.map(target => {
      const binding = receipt.lifecycleSources.find(s => s.target === target.id.split("/")[0] && s.candidate === candidate);
      assert.ok(binding);
      const l = lifecycle[target.id][candidate];
      assert.equal(l.candidate, candidate);
      assert.equal(l.target, target.id);
      assert.equal(l.sourceRevision, f.prototypeRevision);
      assert.equal(l.specificationRevision, pins.specificationRevision);
      assert.equal(l.corpusSha256, pins.corpusSha256);
      assert.equal(l.catalogSha256, hashes.catalog);
      assert.ok(l.evaluationPackageRevision === undefined || l.evaluationPackageRevision === pins.evaluationPackageRevision);
      const environment = Object.fromEntries(Object.entries(l.environment).filter(([key]) => key !== "cohortCheck"));
      const retainedDrift = checkEnvironment(contract, environment);
      const stages = Object.fromEntries(Object.entries(l.stages).map(([key, value]) => [key, value.status]));
      const blockers = ["fresh-common-candidate-cohort-not-tested", "full-library-workload-unsupported", "instrument-version-and-native-accounting-not-tested", "raw-measurement-runs-not-tested"];
      if (retainedDrift.length) blockers.push("retained-environment-not-frozen");
      if (!l.artifact) blockers.push("native-artifact-unavailable");
      if (stages.validateInspect === "failed") blockers.push("installed-validation-failed");
      if (stages.build === "failed") blockers.push("native-build-failed");
      if (stages.install === "failed") blockers.push("unicode-install-failed");
      if (stages.offlineUse !== "passed") blockers.push("offline-lifecycle-not-passed");
      const artifact = l.artifact ? {
        classification: "historical-observation-not-comparable",
        measuredAt: l.recordedAt,
        collectorRevision: l.collectorRevision,
        version: l.artifact.version,
        sha256: l.artifact.sha256,
        archiveBytes: l.artifact.bytes,
        payloadFileCount: l.artifact.files.length,
        payloadFileBytes: l.artifact.files.reduce((sum, file) => sum + file.bytes, 0),
        footprintScope: "Sum of manifest file bytes only; excludes filesystem overhead, installer virtualenv expansion, external interpreters/runtimes and native closure.",
        externalRuntime: candidate === "typescript" ? "Node 22.23.2 is not bundled" : candidate === "python" ? "CPython 3.12.14 is not bundled" : "Target native/system dependencies remain separately reviewed",
        source: binding
      } : null;
      return {
        target: target.id,
        nativeArchitecture: target.architecture,
        retainedLifecycleSource: binding,
        retainedEnvironment: environment,
        retainedEnvironmentSnapshotSha256: sha256(encode(environment)),
        retainedFrozenCheck: { matched: retainedDrift.length === 0, blockers: retainedDrift },
        retainedToolchainObservation: l.toolchain,
        requiredToolchain: pins.candidates[candidate].toolchain,
        lockfiles: l.lockfiles,
        retainedLifecycleStages: stages,
        distributionGate: l.distributionGate,
        freshCommonCandidateCohort: { status: "not-tested", snapshot: null, snapshotSha256: null, runIdentities: [], candidateOrder: [] },
        historicalArtifactObservation: artifact,
        errorAndRejectionBenchmarks: { status: "not-tested", samples: [], reason: "Lifecycle outcomes have no agreed timing or memory samples. Expected rejection and unexpected failure cannot be substituted for successful full-workload throughput." },
        blockers,
        metrics: metrics.map(metric => ({
          metric,
          unit: contract.measurements[metric].unit,
          status: "not-tested",
          measuredAt: null,
          artifactSha256: null,
          environmentSnapshotSha256: null,
          dataset: { cliCases: contract.datasets.cliCases, maintainedManifests: contract.datasets.maintainedManifests, schemaNegativeCases: contract.datasets.schemaNegativeCases, libraryCases: inventory.caseCount, throughputCorpusPasses: contract.datasets.throughputCorpusPasses },
          order: [],
          cacheState: null,
          requiredCacheRule: contract.measurements[metric].cache,
          warmups: null,
          requiredWarmups: contract.measurements[metric].warmups,
          requiredRuns: contract.measurements[metric].runs,
          samples: [],
          summary: { count: 0, median: null, min: null, max: null, p95: null },
          method: { planned: methods[metric], observedInstrument: null, observedInstrumentVersion: null, actual: null },
          timeout: null,
          exitStatus: null,
          comparisonEligible: false,
          blockers
        }))
      };
    });
    return {
      formatVersion: "0.1-draft",
      task: "NF-056-15",
      candidate,
      recordedAt: receipt.checkedAt,
      scope: "gap-bearing measurement evidence; no new candidate execution or timing",
      specificationRevision: pins.specificationRevision,
      evaluationPackageRevision: pins.evaluationPackageRevision,
      prototypeRevision: f.prototypeRevision,
      corpusSha256: pins.corpusSha256,
      catalogSha256: hashes.catalog,
      environmentContractSha256: hashes.contract,
      prerequisiteReceiptSha256: hashes.receipt,
      fidelitySource: { path: "evaluation/fidelity/" + candidate + ".json", revision: receipt.pullRequests[1].head, sha256: hashes.fidelity[candidate] },
      catalogCoverage: { total: inventory.caseCount, operationCounts, retainedResults: coverage, unsupportedByOperation },
      retainedGates: f.gates,
      targets,
      outcome: "not-ready",
      fullCrossTargetComparability: false,
      selection: null,
      scores: null
    };
  });
}

export function assertGapReport(actual, expected) {
  // This bounded record is a source-derived gap inventory, not a generic
  // benchmark format that permits caller-supplied promotion or fake samples.
  assert.deepEqual(actual, expected);
}
