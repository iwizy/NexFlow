import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { assessReport, digest, repositoryRoot, verifyCorpus } from "./runtime-evaluation.mjs";

export const reviewRevision = "1c5a4c6806e029a20245fa8d3110c3a1a23b43d1";
export const reviewRecordPath = "rfcs/reviews/2026-10-11-runtime-architecture-review.json";
export const prerequisitesPath = "rfcs/reviews/2026-10-11-runtime-review-prerequisites.json";
const read = file => readFileSync(path.join(repositoryRoot, file));
const archivedBytes = new Map();
const archived = file => {
  if (!archivedBytes.has(file)) archivedBytes.set(file, execFileSync("git", ["show", `${reviewRevision}:${file}`],
    { cwd: repositoryRoot, maxBuffer: 8 * 1024 * 1024 }));
  return archivedBytes.get(file);
};
const json = file => JSON.parse(archived(file));
const candidates = ["typescript", "python", "rust", "go"];
const normalize = value => Array.isArray(value) ? value.map(normalize)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) : value;

export const followUps = [
  { id: "NF-102-01", title: "Requalify repaired validation and public diagnostics", dependsOn: [], gates: [2, 3, 5, 10],
    acceptance: ["Bind new four-candidate reports to exact repaired sources, locks, specification, full catalog and actual results; keep historical reports unchanged.",
      "Define and verify the library-to-public diagnostic mapping, category/code/path/severity/meaning, ordering, repeatability, redaction and native-detail exposure; do not weaken the oracle.",
      "Cover the complete declared CLI/project scope, including explicit unsupported profiles/commands; the 352 fragment passes are not full project semantic conformance."],
    authority: "Evidence/report preparation only; candidate code or oracle changes require separately approved repair scope." },
  { id: "NF-102-02", title: "Close current supply-chain and provenance evidence", dependsOn: [], gates: [3, 6, 9],
    acceptance: ["Inventory current built artifacts and complete compiler/interpreter/native/license closure, SBOM and provenance with exact hashes.",
      "Refresh dated vulnerability evidence for all four actual graphs and review reachability, unresolved matches and license uncertainties; root npm audit is not a substitute.",
      "Document reproducibility and offline provisioning; any necessary dependency repair remains separately authorized with new locks/evidence."],
    authority: "Public metadata scans and evidence collection only; no automatic fixes, credentials or new infrastructure." },
  { id: "NF-102-03", title: "Requalify native target cohorts and artifact lifecycle", dependsOn: ["NF-102-01", "NF-102-02"], gates: [2, 3, 9],
    acceptance: ["Approve one exact common native cohort per Linux AMD64, macOS ARM64 and Windows AMD64, or reacquire the frozen contract; no silent drift.",
      "Build revision-versioned repaired artifacts for all four, verify Windows interpreter/Unicode paths and Rust relocation on each target; old failures are retained, not presumed present or fixed at new revisions.",
      "Verify install, validate/inspect, OS-denied offline use, upgrade, rollback and scoped uninstall using a verified real predecessor artifact where available.",
      "Obtain specific permitted signing/notarization and verification authority; missing keys/target access remain blockers, not ownership passes."],
    authority: "Existing approved native environments only; contract changes, repair, signing, credentials and paid resources need their own authority." },
  { id: "NF-102-04", title: "Requalify denied effects and security boundaries", dependsOn: ["NF-102-01"], gates: [3, 5, 6],
    acceptance: ["Run paired positive/negative OS controls on current exact artifacts for every target, not only archived macOS sources.",
      "Verify filesystem/network/process/credential/extension denial, redaction before queues/output, resource budgets and relevant inheritance/IPC/race/revocation assumptions.",
      "Preserve residual risks and unsupported controls; a virtual environment, static source audit or CI fixture is not a sandbox."],
    authority: "Synthetic data in scoped isolated environments; no real secrets, production actions or borrowed credentials." },
  { id: "NF-102-05", title: "Collect equivalent cross-target measurements", dependsOn: ["NF-102-01", "NF-102-02", "NF-102-03", "NF-102-04"], gates: [2, 3],
    acceptance: ["Collect all 84 target/candidate/metric cells on reviewed common cohorts and equivalent successful workloads, preserving the frozen run/cache/warmup method.",
      "Keep raw run IDs, tool/instrument versions, all samples/errors and dispersion; rejection/error runs are separate from successful validation.",
      "Do not mix OS/hardware classes, historical artifact sizes or unequal semantic coverage into a language ranking."],
    authority: "Existing permitted environments; no unapproved cohort change, paid infrastructure or product release." },
  { id: "NF-102-06", title: "Revise concrete architecture proposal and repeat decision review", dependsOn: ["NF-102-01", "NF-102-02", "NF-102-03", "NF-102-04", "NF-102-05"], gates: [1, 4, 5, 6, 7, 8, 10, 11],
    acceptance: ["Propose a defensible language/layout only after candidate qualification; compare all three layouts and record one evidence-linked scorecard per eligible candidate with original weights.",
      "Specify package/import/startup/pure API/version ownership, exact target support, compatibility/migration/conformance and concrete credential/provider/extension/audit/state failure mechanisms.",
      "Verify proposed boundaries with inert fakes/contract models and failure/redaction/recovery tests without implementing a production runtime.",
      "Review one immutable revised RFC/evidence set through both single-maintainer lenses, close all eleven gates and obtain a separate explicit maintainer decision; no automatic acceptance."],
    authority: "Proposal and validation-only contract evidence; runtime implementation, publication and final architecture acceptance are separate." }
].map(item => ({ ...item, owner: "Alexander Agafonov", status: "planned-blocker", classification: "blocker" }));

const gateReviews = [
  ["proposalCompleteness", "The Draft describes alternatives and non-goals, but has no proposed language/layout or exact product support matrix. NF-101 supplies bounded role ownership, not a selected package design.", ["NF-102-06"]],
  ["evidenceIntegrity", "Hashes and the frozen corpus resolve. Repair evidence closes catalog function coverage, but original reports/target/measurement/advisory records describe earlier sources. Comparable current evidence is absent. Two independent people are no longer required; no eligible candidate can yet be scored.", ["NF-102-01", "NF-102-03", "NF-102-05"]],
  ["candidateEligibility", "All four repaired libraries pass the frozen catalog in the supplemental macOS scope. Complete current public diagnostics, native target, security and supply-chain qualification remain unestablished; do not reuse historical ineligible verdicts as new-source failures.", ["NF-102-01", "NF-102-02", "NF-102-03", "NF-102-04"]],
  ["architectureDependencies", "All three layouts point inward toward pure validation. No selected package/import closure, startup sequence or supported API/version combinations are proven. Separate packages or languages alone do not isolate effects.", ["NF-102-06"]],
  ["cliRuntimeSeparation", "Eleven structural validate/inspect cases pass in each repair record; runtime/extension checks stay not-run. This does not test all installed command budgets, graph/init or denied facilities on every repaired target.", ["NF-102-01", "NF-102-04", "NF-102-06"]],
  ["securityAuthority", "Archived macOS OS controls and repair redaction/resource fixtures are scoped positives. They do not establish current cross-target native denial, complete inherited/IPC/race/revocation controls, dependency closure or runtime authority enforcement.", ["NF-102-02", "NF-102-04", "NF-102-06"]],
  ["extensionProvider", "Host-owned catalog, staged activation, operation-scoped mediation and no hidden fallback are appropriate requirements, but selected mechanisms and negative contract tests are absent. Declarative profile checks are not executable enforcement.", ["NF-102-06"]],
  ["eventAuditState", "The proposed pre-effect durable receipt and post-effect gap distinction is sound at design level. Concrete store/API, retention/access/recovery/durability behavior and failure tests remain unselected.", ["NF-102-06"]],
  ["packagingOperations", "Seven roles and support limits are acknowledged. That removes the old owner-consent blocker only. Archived artifacts use original source pins; repaired native lifecycle, verified predecessor paths, signing and complete provenance remain unqualified.", ["NF-102-02", "NF-102-03"]],
  ["conformanceCompatibility", "The Draft separates claim/version domains and NF-101 assigns validation/CLI ownership. No selected supported pair matrix, complete project semantic/diagnostic scope or migration/rollback/conformance proof is supplied.", ["NF-102-01", "NF-102-06"]],
  ["rationaleGovernanceOwnership", "Policy adoption and sole-maintainer assignment are established, and both review lenses are recorded here. No eligible ranking, defensible selected design, closed technical gates or separate exact-revision acceptance exists.", ["NF-102-06"]]
];

export function buildReviewRecord() {
  const baseline = json("evaluation/baseline.json");
  assert.deepEqual(verifyCorpus(baseline, archived), []);
  const paths = ["rfcs/RFC-0023-runtime-architecture-decision.md", "rfcs/reviews/runtime-architecture-decision-review.md",
    "rfcs/reviews/runtime-architecture-decision-draft.json", "rfcs/RFC-0024-single-maintainer-governance.md",
    "docs/single-maintainer-governance.md", "docs/governance.md", "rfcs/reviews/2026-10-11-single-maintainer-ownership.json",
    "evaluation/baseline.json", "evaluation/library-cases.json", "evaluation/library-inventory.json", "evaluation/fidelity/source-pins.json",
    "evaluation/environment-contract.json", "evaluation/architecture/alternatives.json", "evaluation/architecture/alternatives.md",
    "evaluation/reports/review/reviewer-a.json", "evaluation/reports/review/reviewer-b.json", "evaluation/reports/review/reconciliation.json",
    "docs/language-evaluation-matrix.md", "docs/cli-runtime-boundary.md", "docs/security-model.md", "docs/credential-handling.md",
    "docs/extension-loading-boundary.md", "docs/provider-adapter-boundary.md", "docs/event-audit-storage-boundary.md",
    "docs/mcp-a2a-boundaries.md", "docs/conformance.md", "docs/compatibility.md", "docs/versioning.md",
    "scripts/runtime-evaluation-repair-run.mjs", "scripts/lib/evaluation-library.mjs"];
  for (const candidate of candidates) paths.push(`evaluation/reports/${candidate}/candidate.json`, `evaluation/reports/${candidate}/bundle.json`,
    `evaluation/repairs/${candidate}.json`, `evaluation/isolation/${candidate}.json`,
    ...["inventory.json", "sbom.cdx.json", "advisories.json"].map(file => `evaluation/supply-chain/${candidate}/${file}`),
    ...["linux", "macos", "windows"].map(os => `evaluation/lifecycle/${os}/${candidate}.json`), `evaluation/measurements/${candidate}.json`);
  const evidenceIndex = paths.map(file => {
    const bytes = archived(file);
    return { path: file, sha256: digest(bytes) };
  });
  const repaired = candidates.map(c => json(`evaluation/repairs/${c}.json`));
  const historical = candidates.map(c => json(`evaluation/reports/${c}/candidate.json`));
  const referenceResults = repaired[0].results.map(normalize);
  const resultDifferences = repaired.map((report, index) => ({ candidate: candidates[index],
    rawDifferentCaseIds: report.results.filter((r, i) => JSON.stringify(normalize(r)) !== JSON.stringify(referenceResults[i])).map(r => r.id) }));
  const criteria = json("evaluation/reports/review/reviewer-a.json").candidateCards[0].criteria.map(({id, weight}) => ({id, weight}));
  const targetRecords = candidates.flatMap(candidate => ["linux", "macos", "windows"].map(os => {
    const file = `evaluation/lifecycle/${os}/${candidate}.json`, record = json(file);
    return { candidate, target: record.target, sourceRevision: record.sourceRevision,
      cohortMatched: record.environment?.cohortCheck?.fingerprint === "matched" || record.cohort?.matched === true,
      stages: Object.fromEntries(Object.entries(record.stages).map(([key, value]) => [key, value.status])),
      evidence: file, currentRepairLifecycle: "not-retested" };
  }));
  const prerequisites = JSON.parse(read(prerequisitesPath));
  const historicalGates = json("rfcs/reviews/runtime-architecture-decision-draft.json").gates;
  return {
    formatVersion: "1", task: "NF-102", recordedOn: "2026-10-11", reviewMode: "single-maintainer",
    reviewedRevision: reviewRevision, evidenceBaseUrl: `https://github.com/iwizy/NexFlow/blob/${reviewRevision}/`,
    reviewPassCompleted: true, taskCompleted: false, outcome: "not-ready", decisionStatus: "Draft",
    maintainer: "Alexander Agafonov", executionBasis: "Maintainer-directed delegated review under the accepted single-maintainer policy; not an independent person's review or a final human acceptance signature.",
    authorshipDeclaration: "author", conflictsDeclaration: "Sole maintainer reviewing own project materials; no independent assurance.", independenceClaimed: false,
    policyRevision: "2cd3b442d4549f0e5c1cd4c4363f9449796010df", policyAdoptionEvidence: "rfcs/reviews/2026-10-11-single-maintainer-ownership.json",
    specificationRevision: baseline.specificationRevision, evaluationPackageRevision: historical[0].evaluationPackageRevision,
    corpusSha256: baseline.corpus.sha256, catalogSha256: digest(archived("evaluation/library-cases.json")),
    evidenceIndex, prerequisiteReceipt: { path: prerequisitesPath, sha256: digest(read(prerequisitesPath)), successfulChecks: prerequisites.prerequisites.reduce((sum, p) => sum + p.checks.length, 0) },
    lenses: {
      architecture: { status: "completed-evidence-analysis", findings: ["New fragment coverage is recognized without promoting it to full project conformance.", "All three layouts remain viable hypotheses, not measured alternatives or a defensible winner.", "Package/version/startup/API/compatibility and concrete mechanism selection require a revised proposal."], gates: [1, 2, 3, 4, 5, 7, 8, 10, 11] },
      security: { status: "completed-evidence-analysis", findings: ["Old denial/lifecycle/SBOM/advisory evidence cannot automatically qualify repaired artifacts.", "Signing coordination and seven accepted roles are not keys, target authority or production support.", "Native denial, complete dependency/license closure, provenance, signing and lifecycle gaps remain blocking."], gates: [2, 3, 5, 6, 7, 8, 9, 10, 11] }
    },
    candidates: candidates.map((candidate, index) => ({ candidate,
      historicalPrototypeRevision: historical[index].prototype.revision, historicalAssessment: assessReport(historical[index], baseline),
      currentSourceRevision: repaired[index].sourceRevision, repairEvidence: `evaluation/repairs/${candidate}.json`,
      frozen: repaired[index].frozen, renamed: repaired[index].renamed, supplemental: repaired[index].supplemental,
      runsPerCase: repaired[index].runsPerCase, cohort: repaired[index].cohort, toolchain: repaired[index].toolchain,
      structuralCliPassed: repaired[index].structuralCli.results.filter(r => r.result === "passed").length,
      relocation: repaired[index].relocation ?? null, exclusions: repaired[index].exclusions,
      currentQualification: "not-established", eligibleForScoring: false, weightedScores: null, weightedTotal: null })),
    diagnosticReview: { method: "Compare saved per-case results after sorting object keys only; retain array/diagnostic order and native details. This is record analysis, not new candidate execution.",
      rawResultComparisons: resultDifferences, oracleUsesExpectedSubset: true,
      conclusion: "All repair cases satisfy the frozen subset oracle. Raw library records differ for one schema case in Rust/Go through nativeDiagnostic details; strict public normalized diagnostic compatibility is not established by these passes. Do not call this a proven validation failure or remove native fields/oracle cases to hide it.",
      followUp: "NF-102-01" },
    scoring: { criteria, rule: "Score only candidates that pass every hard gate; preserve original 0..5 scale and weight * score / 5.", eligibleCandidates: [], scorecards: [], abstention: "Current cross-target hard-gate qualification is incomplete for all four. No compensating scores or language ranking.", reconciliation: "Single written review summary replaces cross-person reconciliation; both lenses retain blockers, with no recorded external dissent or independent review." },
    targetRecords, missingComparableMetricCells: candidates.reduce((sum, candidate) => sum + json(`evaluation/measurements/${candidate}.json`).targets.reduce((n,t) => n + t.metrics.filter(m => m.status === "not-tested").length, 0), 0),
    gates: gateReviews.map(([id, finding, tasks], index) => ({ number: index + 1, id, status: "blocked", finding,
      evidence: [...new Set([...historicalGates[index].evidence,
        ...([2, 3, 5, 6, 9].includes(index + 1) ? candidates.map(c => `evaluation/repairs/${c}.json`) : []),
        ...([1, 2, 9, 10, 11].includes(index + 1) ? ["rfcs/reviews/2026-10-11-single-maintainer-ownership.json", "docs/single-maintainer-governance.md"] : [])])],
      followUps: tasks })),
    resolvedOrNarrowedFindings: ["Two-person headcount requirement replaced by explicitly adopted policy, not fabricated reviewers.", "Seven bounded ownership roles are acknowledged; no new signing or on-call capability.", "Original 224 unsupported library cases are covered in the repaired supplemental catalog run.", "Rust relocation passes in the repaired supplemental native macOS test, not a complete cross-target lifecycle."],
    followUps, acceptedConditions: [], nonBlockingDeferrals: [],
    acceptance: { accepted: false, maintainerSignOff: null, selectedCandidate: null, selectedLayout: null, productSupportTargets: [], runtimeImplementationAuthorized: false, releaseAuthorized: false },
    limitations: ["This is a completed delegated evidence-analysis pass, not an invented human signature or final acceptance decision.", "Historical reports and raw repair results are unchanged; no candidate runs, repair, live vulnerability refresh, benchmark, signing or version change is performed by this review.", "NF-102 remains open for its Accepted-decision objective; NF-103 release readiness remains separate."]
  };
}
