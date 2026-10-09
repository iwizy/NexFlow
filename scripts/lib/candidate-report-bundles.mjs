import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { assessReport, validateReport, repositoryRoot, digest, safeRelative } from "./runtime-evaluation.mjs";
import { verifyStoredReports } from "../runtime-comparable-measurements.mjs";

export const snapshot = "dfa11b50dcde79154a066c41983b708190b05643";
export const candidates = ["typescript", "python", "rust", "go"];
export const criteria = [
  ["specificationAndValidationFidelity", 20], ["securityAndIsolationFit", 15],
  ["crossPlatformDistribution", 15], ["ecosystemAndIntegrationFit", 10],
  ["contributorAccessibility", 10], ["maintainability", 10],
  ["performanceAndResourceUse", 8], ["observabilityAndDiagnostics", 5],
  ["embeddingAndInteroperability", 4], ["operationalFootprint", 3]
];
const url = (revision, file, tree = false) => `https://github.com/iwizy/NexFlow/${tree ? "tree" : "blob"}/${revision}/${file}`;
const read = file => readFileSync(path.join(repositoryRoot, file));
export const encode = value => JSON.stringify(value, null, 2) + "\n";

export function loadInputs() {
  const sources = new Map();
  const frozen = file => {
    assert.equal(safeRelative(file), true);
    const bytes = execFileSync("git", ["show", `${snapshot}:${file}`], { cwd: repositoryRoot, maxBuffer: 16 * 1024 * 1024 });
    assert.deepEqual(read(file), bytes, `archived evidence changed: ${file}`);
    sources.set(file, { path: file, revision: snapshot, sha256: digest(bytes), url: url(snapshot, file) });
    return JSON.parse(bytes);
  };
  const baseline = frozen("evaluation/baseline.json");
  const pins = frozen("evaluation/fidelity/source-pins.json");
  const catalog = frozen("evaluation/library-cases.json");
  const inventory = frozen("evaluation/library-inventory.json");
  const architecture = frozen("evaluation/architecture/alternatives.json");
  frozen("evaluation/candidate-report.schema.json");
  const commonSources = [...sources.values()];
  const perCandidate = Object.fromEntries(candidates.map(c => {
    const before = new Set(sources.keys());
    const initial = frozen(`evaluation/candidates/${c}.json`);
    const fidelity = frozen(`evaluation/fidelity/${c}.json`);
    const isolation = frozen(`evaluation/isolation/${c}.json`);
    const supply = frozen(`evaluation/supply-chain/${c}/inventory.json`);
    frozen(`evaluation/supply-chain/${c}/sbom.cdx.json`);
    const advisories = frozen(`evaluation/supply-chain/${c}/advisories.json`);
    const lifecycle = Object.fromEntries(["linux", "macos", "windows"].map(os => [os, frozen(`evaluation/lifecycle/${os}/${c}.json`)]));
    const measurements = frozen(`evaluation/measurements/${c}.json`);
    return [c, { initial, fidelity, isolation, supply, advisories, lifecycle, measurements, sources: [...commonSources, ...[...sources.values()].filter(s => !before.has(s.path))] }];
  }));
  const receipt = JSON.parse(read("evaluation/reports/prerequisites.json"));
  assert.equal(receipt.task, "NF-056-17");
  assert.equal(receipt.sourceSnapshot, snapshot);
  assert.equal(receipt.basePullRequest, 110);
  assert.equal(receipt.stackedBase, "nf-056-architecture-alternatives");
  assert.deepEqual(receipt.pullRequests.map(p => p.number), [101, 103, 104, 105, 107, 108, 109, 110]);
  const heads = ["1c9aa13c46175255d989edda5f6e677d1a723952", "72db0be4b32ac0069979abeeedc8870b4d987e3d", "5290b74aa8af3f0d8051ae18c419c49c47df7c08", "96a36bfdfc5b18380f0faf95d42f5c1cb52803a8", "f239461dbd80b9213a0c631bceeacf3afd68f40b", "d9eeed4216ce896d845fe0f30730b0bb5a24e6a9", "51b703cee9e21489a3fc08671c6906e5de102cc0", snapshot];
  receipt.pullRequests.forEach((p, i) => {
    assert.equal(p.head, heads[i]);
    assert.equal(p.state, i === 7 ? "OPEN" : "MERGED");
    assert.equal(p.checks.length, [7, 9, 9, 13, 9, 13, 10, 10][i]);
    assert.equal(p.checks.every(c => c.result === "SUCCESS" && /^https:\/\/github\.com\/iwizy\/NexFlow\/actions\/runs\/\d+\/job\/\d+$/u.test(c.url)), true);
    execFileSync("git", ["merge-base", "--is-ancestor", p.head, snapshot], { cwd: repositoryRoot });
    if (p.merge) execFileSync("git", ["merge-base", "--is-ancestor", p.merge, snapshot], { cwd: repositoryRoot });
  });
  // Existing verifier reconciles every case identity/operation and all 84 gaps
  // against original immutable fidelity and target lifecycle Git objects.
  const verified = verifyStoredReports();
  for (const c of candidates) assert.deepEqual(perCandidate[c].measurements, verified.reports.find(r => r.candidate === c));
  return { baseline, pins, catalog, inventory, architecture, receipt, perCandidate };
}

export function makePacket(input) {
  const { baseline, pins, catalog, inventory, architecture, receipt, perCandidate } = input;
  assert.equal(digest(encode(catalog)), pins.catalogSha256);
  assert.equal(catalog.cases.length, 352);
  assert.equal(inventory.caseCount, 352);
  assert.equal(architecture.outcome, "not-ready");
  assert.equal(architecture.selection, null);
  const files = {};
  for (const c of candidates) {
    const e = perCandidate[c], f = e.fidelity, m = e.measurements;
    assert.equal(f.prototypeRevision, pins.candidates[c].sourceRevision);
    assert.equal(e.initial.prototype.revision, f.prototypeRevision);
    assert.equal(e.initial.evaluationPackageRevision, pins.evaluationPackageRevision);
    assert.equal(e.initial.specificationRevision, pins.specificationRevision);
    assert.equal(e.initial.corpusSha256, pins.corpusSha256);
    assert.deepEqual(f.library.results.map(({ id, operation }) => ({ id, operation })), catalog.cases.map(({ id, operation }) => ({ id, operation })));
    assert.deepEqual(f.library.counts, { failed: 0, "not-tested": 224, passed: 128 });
    assert.equal(f.gates.specificationFidelity.status, "failed");
    assert.equal(f.gates.deterministicDiagnostics.status, "not-tested");
    assert.equal(e.isolation.securityBoundary.status, "partial");
    assert.equal(e.supply.supplyChainAcceptance, "partial");
    assert.equal(e.supply.sourceRevision, f.prototypeRevision);
    assert.equal(e.supply.advisoryReview.fixesApplied, false);
    const ref = file => url(snapshot, file);
    const refs = {
      fidelity: ref(`evaluation/fidelity/${c}.json`), isolation: ref(`evaluation/isolation/${c}.json`),
      supply: ref(`evaluation/supply-chain/${c}/inventory.json`), measurements: ref(`evaluation/measurements/${c}.json`),
      architecture: ref("evaluation/architecture/alternatives.json")
    };
    const record = structuredClone(e.initial);
    record.status = "in-progress";
    record.prototype.source = url(f.prototypeRevision, `evaluation/prototypes/${c}`, true);
    record.toolchain.dependencyLock = url(f.prototypeRevision, e.initial.toolchain.dependencyLock);
    record.targets = m.targets.map(t => ({
      os: t.target.split("/")[0], architecture: t.target.split("/")[1],
      result: Object.values(t.retainedLifecycleStages).includes("failed") ? "failed" : "not-tested",
      evidence: [ref(`evaluation/lifecycle/${t.target.split("/")[0]}/${c}.json`)]
    }));
    const mapping = {
      specificationFidelity: ["failed", [refs.fidelity], "224 mandatory semantic/namespace cases remain unsupported."],
      deterministicDiagnostics: ["not-tested", [refs.fidelity], "Supported subset repeats; full semantic/namespace diagnostics unavailable."],
      offlineOperation: [m.targets.some(t => t.retainedLifecycleStages.offlineUse === "failed") ? "failed" : "not-tested", [refs.isolation, ...record.targets.flatMap(t => t.evidence)], "Supplemental macOS and installed Linux/macOS results are bounded; Windows denial is not-tested; installed Rust offline validation fails."],
      reproducibleDependencies: ["not-tested", [refs.supply], "Pinned locks exist; complete native/runtime closure and reproducible build proof are unresolved."],
      distributionTargets: [record.targets.some(t => t.result === "failed") ? "failed" : "not-tested", record.targets.flatMap(t => t.evidence), "Actual stage failures remain failed; partial lifecycle is not a target pass. Predecessor upgrade/rollback and signing are not-tested."],
      securityBoundary: ["not-tested", [refs.isolation, refs.supply], "Partial scoped controls do not establish the complete architecture security gate."],
      supplyChainEvidence: ["not-tested", [refs.supply], "Archived acceptance is partial; dated advisories, unknown licenses and closure/provenance gaps remain."],
      providerNeutrality: ["not-tested", [refs.fidelity, refs.architecture], "Validation-only evidence and absence of provider execution do not establish a complete reviewed architecture gate."],
      scopeIntegrity: ["not-tested", [refs.fidelity, refs.architecture], "Prototype is validation-only; no full architecture hard-gate review or runtime claim is inferred."]
    };
    record.hardGates = Object.fromEntries(Object.entries(mapping).map(([k, [status, evidence]]) => [k, { status, evidence }]));
    record.reviewerScorecards = [];
    record.reconciliation = null;
    record.measurements = []; // Schema permits only real numeric samples, not null/zero substitutes.
    record.limitations = [
      "NF-056-17 assembles archived evidence only; candidate evaluation remains in-progress and the decision packet not-ready.",
      "352 full-catalog cases: 128 passed, zero tested failures, 224 not-tested; specification fidelity failed. Unsupported agreement is not a pass.",
      "This report schema has no partial state: retained partial gates/targets map to not-tested with their actual scope preserved in the companion bundle; known stage failures map to failed.",
      "All 21 comparable metric cells remain not-tested in the pinned measurement record; measurements is empty because no numeric samples exist. Historical capsule bytes are not comparable metrics.",
      "Two independent reviewers, scores, reconciliation, ownership/support/signing consent remain pending; no scores, winner, architecture acceptance or release is claimed.",
      "Advisory evidence is archived from 2026-10-04, not refreshed; no candidate source/lock, vulnerability, relocation or provisioning repairs occurred.",
      ...m.targets.flatMap(t => [`${t.target}: ${t.blockers.join(", ")}`])
    ];
    record.evidence = [...new Set([record.prototype.source, record.toolchain.dependencyLock, ...e.sources.map(s => s.url), ...Object.values(record.hardGates).flatMap(g => g.evidence)])];
    assert.equal(validateReport(record), true, JSON.stringify(validateReport.errors));
    const assessment = assessReport(record);
    assert.equal(assessment.outcome, "ineligible");
    assert.ok(assessment.blockers.includes("missing-independent-review"));
    assert.ok(assessment.blockers.includes("missing-measurements"));
    const reportPath = `evaluation/reports/${c}/candidate.json`;
    const bundle = {
      formatVersion: "0.1-draft", task: "NF-056-17", candidate: c, recordedAt: "2026-10-09",
      sourceSnapshot: snapshot, specificationRevision: pins.specificationRevision,
      evaluationPackageRevision: pins.evaluationPackageRevision, prototypeRevision: f.prototypeRevision,
      corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
      candidateReport: { path: reportPath, sha256: digest(encode(record)), schemaValid: true, assessment },
      sources: e.sources,
      fidelity: { counts: f.library.counts, fullCatalogCases: catalog.cases.length, unsupportedByOperation: m.catalogCoverage.unsupportedByOperation, gates: f.gates, limitations: f.limitations },
      isolation: { recordedAt: e.isolation.recordedAt, environment: e.isolation.environment, targetContractMatch: e.isolation.targetContractMatch, offlineOperation: e.isolation.offlineOperation, securityBoundary: e.isolation.securityBoundary, limitations: e.isolation.limitations },
      supplyChain: { recordedAt: e.supply.recordedAt, collectorRevision: e.supply.collectorRevision, status: e.supply.supplyChainAcceptance, components: e.supply.components.length, unknownLicenseCount: e.supply.licenseUnknownCount, advisoryReview: e.supply.advisoryReview, advisoryCompletedAt: e.advisories.completedAt, refreshed: false, openRisks: e.supply.openRisks, limitations: e.supply.limitations },
      targets: m.targets.map(t => ({ target: t.target, environment: t.retainedEnvironment, frozenCheck: t.retainedFrozenCheck, observedToolchain: t.retainedToolchainObservation, stages: t.retainedLifecycleStages, distributionGate: t.distributionGate, artifact: t.historicalArtifactObservation, blockers: t.blockers, lifecycleLimitations: e.lifecycle[t.target.split("/")[0]].limitations, metrics: t.metrics.map(v => ({ metric: v.metric, unit: v.unit, status: v.status, sampleCount: v.samples.length, median: v.summary.median, comparisonEligible: v.comparisonEligible })) })),
      gateMapping: Object.fromEntries(Object.entries(mapping).map(([k, [reportStatus, , reason]]) => [k, { reportStatus, reason }])),
      prerequisiteReceiptSha256: digest(encode(receipt)),
      independentReview: { status: "pending", appointedReviewers: [], scores: null, reconciliation: null },
      ownership: "pending; NF-101 requires actual appointments and consent",
      outcome: "not-ready", selection: null, scores: null,
      limitations: record.limitations
    };
    files[reportPath] = record;
    files[`evaluation/reports/${c}/bundle.json`] = bundle;
  }
  const reportSet = candidates.map(candidate => ({ candidate, path: `evaluation/reports/${candidate}/candidate.json`, sha256: digest(encode(files[`evaluation/reports/${candidate}/candidate.json`])), bundleSha256: digest(encode(files[`evaluation/reports/${candidate}/bundle.json`])) }));
  for (const slot of ["reviewer-a", "reviewer-b"]) {
    files[`evaluation/reports/review/${slot}.json`] = {
      formatVersion: "0.1-draft", task: "NF-056-17", status: "blank-template", slot,
      reviewer: null, reviewedAt: null, signature: null, independenceConfirmed: false, conflicts: null,
      specificationRevision: pins.specificationRevision, sourceSnapshot: snapshot, reportSetRevision: null, reportSet,
      scale: "0..5; weight * score / 5; missing evidence scores 0 only when an actual reviewer evaluates it. Blank null is not a score.",
      hardGateRule: "Do not score ineligible candidates; a failed gate cannot be compensated by a weighted total.",
      candidateCards: candidates.map(candidate => ({ candidate, eligibleForScoring: false, criteria: criteria.map(([id, weight]) => ({ id, weight, score: null, evidence: [], rationale: null, confidence: null })), weightedTotal: null })),
      outcome: "not-ready"
    };
  }
  files["evaluation/reports/review/reconciliation.json"] = {
    formatVersion: "0.1-draft", task: "NF-056-17", status: "blank-template", reportSetRevision: null, reportSet,
    reviewers: [], independentReviewRevisions: [], reconciledAt: null, signatures: [],
    differences: [], resolutions: [], agreedScores: null, rationale: null, dissent: null,
    required: "Two actual independent reviews of this same pinned report set before reconciliation; preserve initial scores, disagreement and all failed/missing gates.",
    outcome: "not-ready", selection: null
  };
  return files;
}

export function assertPacket(actual, expected) {
  // Exact source-derived assembly, not a general format that accepts upgrades
  // to evidence, human consent or eligibility from caller-supplied values.
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const file of Object.keys(expected)) {
    assert.equal(digest(encode(actual[file])), digest(encode(expected[file])), `source-derived packet mismatch: ${file}`);
  }
}
