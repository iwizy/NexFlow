import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { repositoryRoot, digest, assessReport, validateReport } from "./runtime-evaluation.mjs";
import { candidates, encode } from "./candidate-report-bundles.mjs";
import { verifyCandidateBundles } from "../runtime-candidate-report-bundles.mjs";

export const snapshot = "cef48f83006eb7dd245268a717b27835b4512cd9";
export const rfcPath = "rfcs/RFC-0023-runtime-architecture-decision.md";
export const bundlePath = "rfcs/reviews/runtime-architecture-decision-draft.json";
const architecture = "evaluation/architecture/alternatives.json";
const framework = "rfcs/reviews/runtime-architecture-decision-review.md";
const contract = "evaluation/environment-contract.json";
const reports = candidates.map(c => `evaluation/reports/${c}/candidate.json`);
const companions = candidates.map(c => `evaluation/reports/${c}/bundle.json`);
const forms = ["reviewer-a", "reviewer-b", "reconciliation"].map(s => `evaluation/reports/review/${s}.json`);
export const decisions = ["reviewers", "owners", "signing", "targets", "remediation", "architecture", "acceptance"];
export const gateDefinitions = [
  ["proposalCompleteness", "Proposal Completeness", [architecture], "Language/layout, product support targets and named package ownership remain unselected."],
  ["evidenceIntegrity", "Evidence Integrity And Comparability", [...reports, ...forms], "Full equivalent semantics/diagnostics, all 84 comparable metrics and two independent scores/reconciliation are missing."],
  ["candidateEligibility", "Candidate Eligibility", reports, "All four unchanged assessor outcomes are ineligible; failed fidelity and target stages cannot be waived."],
  ["architectureDependencies", "Architecture And Dependency Direction", [architecture, "docs/cli-runtime-boundary.md"], "Concrete selected import/startup/API/version boundary implementations and tests are absent."],
  ["cliRuntimeSeparation", "CLI And Runtime Separation", ["docs/cli-runtime-boundary.md", ...companions], "Full installed static-command effect budgets and target-native credential/process/extension denial are not established."],
  ["securityAuthority", "Security And Authority Boundaries", ["docs/security-model.md", "docs/credential-handling.md", ...companions], "Partial isolation, dated advisories, native/runtime/license closure, resource/redaction/revocation/race evidence remain blockers."],
  ["extensionProvider", "Extension And Provider Boundaries", ["docs/extension-loading-boundary.md", "docs/provider-adapter-boundary.md", "docs/mcp-a2a-boundaries.md", architecture], "Catalog/isolation/mediation/fallback mechanism choices and negative invocation tests are absent."],
  ["eventAuditState", "Event, Audit, And State Boundaries", ["docs/event-audit-storage-boundary.md", architecture], "Concrete stores, ownership, retention/access/integrity/recovery/durability and crash/export tests are missing."],
  ["packagingOperations", "Packaging, Distribution, And Operations", [contract, ...companions], "Native lifecycle failures/drift, previous artifacts/upgrade/rollback/signing, dependency closure and accepted support obligations remain unresolved."],
  ["conformanceCompatibility", "Conformance, Compatibility, And Migration", ["docs/conformance.md", "docs/compatibility.md", "docs/versioning.md", architecture], "Supported pair matrix, fixture owners and complete migration/rollback/conformance evidence are not accepted."],
  ["rationaleGovernanceOwnership", "Rationale, Governance, And Ownership", ["docs/governance.md", architecture, ...forms], "No defensible selection, actual independent review/reconciliation, dissent record or named maintainer consent exists."]
];
const read = file => readFileSync(path.join(repositoryRoot, file));

export function verifyDraftText(text, titles) {
  assert.match(text, /^# RFC-0023: Runtime Architecture Decision\n/u);
  assert.match(text, /^## Status\s+Draft\b/mu);
  assert.ok(text.includes("Decision outcome: **not-ready**"));
  for (const h of ["Summary", "Motivation", "Proposal", "Compatibility Impact", "Security and Safety Impact", "Alternatives Considered", "Open Questions", "Mandatory Review Gate Mapping", "Verification And Handoff"]) assert.ok(text.includes(`## ${h}\n`));
  const rows = [...text.matchAll(/^\| (\d+) ([^|]+) \|/gmu)].map(m => [Number(m[1]), m[2].trim()]);
  assert.deepEqual(rows, titles.map((title, i) => [i + 1, title]));
  for (const id of decisions) assert.ok(text.includes(`\`${id}\``));
  for (const phrase of ["selectedCandidate = null", "selectedLayout = null", "runtime implementation authorization false", "NF-066/NF-067", "All eleven mandatory acceptance gates remain blocked", "All 84 comparable metric cells are not-tested", "The parent NF-056 remains blocked/not-ready"]) assert.ok(text.includes(phrase), phrase);
}

export function buildDecisionBundle() {
  const packet = verifyCandidateBundles();
  const index = new Map();
  const archived = (file, unchanged = true) => {
    const bytes = execFileSync("git", ["show", `${snapshot}:${file}`], { cwd: repositoryRoot, maxBuffer: 16 * 1024 * 1024 });
    if (unchanged) assert.deepEqual(read(file), bytes, `frozen input changed: ${file}`);
    index.set(file, { path: file, revision: snapshot, sha256: digest(bytes), url: `https://github.com/iwizy/NexFlow/blob/${snapshot}/${file}` });
    return bytes;
  };
  for (const file of ["evaluation/baseline.json", "evaluation/fidelity/source-pins.json", "evaluation/library-cases.json", "evaluation/library-inventory.json", "evaluation/candidate-report.schema.json", contract, architecture, "evaluation/architecture/alternatives.md", ...reports, ...companions, ...forms, "evaluation/reports/prerequisites.json", "evaluation/reports/README.md", ...new Set(gateDefinitions.flatMap(g => g[2]).filter(f => f.startsWith("docs/")))]) archived(file);
  const oldFramework = archived(framework, false).toString();
  const titles = [...oldFramework.matchAll(/^### \d+\. (.+)$/gmu)].map(m => m[1]);
  assert.deepEqual(titles, gateDefinitions.map(g => g[1]));
  assert.deepEqual([...read(framework).toString().matchAll(/^### \d+\. (.+)$/gmu)].map(m => m[1]), titles);
  for (const [start, end] of [["## Mandatory Review Gates", "## Blockers, Conditions, And Follow-Ups"], ["## Acceptance Rule", "## Review Record Template"]]) {
    const section = text => text.split(start)[1].split(end)[0];
    assert.equal(section(read(framework).toString()), section(oldFramework), "mandatory review/acceptance requirements changed");
  }
  const rfc = read(rfcPath);
  verifyDraftText(rfc.toString(), titles);
  const receiptPath = "rfcs/reviews/runtime-architecture-prerequisites.json";
  const receiptBytes = read(receiptPath), receipt = JSON.parse(receiptBytes);
  assert.equal(receiptBytes.toString(), encode(receipt));
  assert.equal(receipt.sourceSnapshot, snapshot);
  assert.equal(receipt.task, "NF-056-18");
  assert.equal(receipt.checkedOn, "2026-10-09");
  assert.equal(receipt.basePullRequest, 111);
  assert.equal(receipt.stackedBase, "nf-056-candidate-report-bundles");
  assert.deepEqual(receipt.pullRequests.map(p => [p.number, p.head, p.state]), [[110, "dfa11b50dcde79154a066c41983b708190b05643", "OPEN"], [111, snapshot, "OPEN"]]);
  for (const p of receipt.pullRequests) {
    assert.equal(p.checks.length, 10);
    assert.equal(p.checks.every(c => c.result === "SUCCESS" && /^https:\/\/github\.com\/iwizy\/NexFlow\/actions\/runs\/\d+\/job\/\d+$/u.test(c.url)), true);
    execFileSync("git", ["merge-base", "--is-ancestor", p.head, "HEAD"], { cwd: repositoryRoot });
  }
  const source = file => JSON.parse(read(file));
  const a = source(architecture), pins = source("evaluation/fidelity/source-pins.json"), environment = source(contract);
  assert.equal(a.selection, null);
  assert.equal(a.outcome, "not-ready");
  const candidateSummaries = candidates.map(c => {
    const report = packet[`evaluation/reports/${c}/candidate.json`], bundle = packet[`evaluation/reports/${c}/bundle.json`];
    assert.equal(validateReport(report), true);
    const assessment = assessReport(report); assert.equal(assessment.outcome, "ineligible");
    return { candidate: c, report: `evaluation/reports/${c}/candidate.json`, companion: `evaluation/reports/${c}/bundle.json`, prototypeRevision: report.prototype.revision, schemaValid: true, assessment, hardGates: report.hardGates, fidelity: bundle.fidelity.counts, missingComparableMetricCells: bundle.targets.reduce((sum, t) => sum + t.metrics.filter(m => m.status === "not-tested").length, 0), advisoryEvidenceDate: bundle.supplyChain.recordedAt, advisoryRefreshed: false };
  });
  const targetMatrix = environment.targets.map(t => ({ target: t.id, contract: t, productSupport: "not-declared", candidateObservations: candidates.map(c => {
    const b = packet[`evaluation/reports/${c}/bundle.json`], observed = b.targets.find(v => v.target === t.id);
    return { candidate: c, source: `evaluation/reports/${c}/bundle.json`, environment: observed.environment, frozenCheck: observed.frozenCheck, observedToolchain: observed.observedToolchain, stages: observed.stages, distributionGate: observed.distributionGate, artifactSha256: observed.artifact?.sha256 ?? null, blockers: observed.blockers, comparableMetricSamples: observed.metrics.reduce((sum, m) => sum + m.sampleCount, 0) };
  }) }));
  return {
    formatVersion: "0.1-draft", task: "NF-056-18", recordedOn: "2026-10-09", sourceSnapshot: snapshot,
    rfc: { id: "RFC-0023", path: rfcPath, sha256: digest(rfc), revision: null, status: "Draft" },
    outcome: "not-ready", selectedCandidate: null, selectedLayout: null, productSupportTargets: [], runtimeImplementationAuthorized: false,
    specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
    prerequisites: { path: receiptPath, sha256: digest(receiptBytes), successfulChecks: 20, publishedHeads: receipt.pullRequests.map(p => ({ number: p.number, revision: p.head })) },
    evidenceIndex: [...index.values()], candidates: candidateSummaries, targetMatrix,
    alternatives: a.options, versionDomains: a.versionDomains, ownershipProposals: a.ownershipProposals, reviewerProposals: a.reviewerProposals,
    gates: gateDefinitions.map(([id, title, evidence, blocker], i) => ({ number: i + 1, id, title, status: "blocked", evidence: [rfcPath, ...evidence], blockers: [blocker], closed: false })),
    humanDecisions: decisions.map(id => ({ id, status: "pending", confirmedPerson: null, consent: null, decision: null })),
    review: { reviewedRfcRevision: null, reviewers: [], scorecards: forms.slice(0, 2), scorecardStatus: "blank-template", completedScores: null, reconciliationTemplate: forms[2], reconciliation: null, signatures: [], dissent: null },
    acceptance: { authorized: false, acceptedRevision: null, signedOffBy: [], conditions: [], followUps: [], rule: "Every mandatory gate passed, all blockers closed at one exact reviewed RFC/evidence revision, two independent reviews and maintainer consent through governance. Merge or CI cannot waive this." },
    limitations: ["Preparation only; no new candidate execution, vulnerability refresh, benchmark, repair, runtime or product support claim.", "All failed/partial/unsupported/not-tested inputs remain visible; missing metrics are not zero-valued observations.", "Historical NF-066/NF-067 are framework preparation, not current architecture acceptance.", "A later human record must pin the published RFC/report assembly commits and hashes; null revisions/signatures are unfilled, not approvals.", "NF-101 appointments/owner/signing consent, NF-102 independent decision review and NF-103 readiness remain separate."]
  };
}

export function assertDecisionBundle(actual, expected) {
  assert.equal(digest(encode(actual)), digest(encode(expected)), "source-derived Draft review bundle mismatch");
}

export function verifyDecisionBundle() {
  const expected = buildDecisionBundle(), bytes = read(bundlePath).toString(), actual = JSON.parse(bytes);
  assert.equal(bytes, encode(actual), "noncanonical decision bundle serialization");
  assertDecisionBundle(actual, expected);
  const ids = new Set(actual.evidenceIndex.map(v => v.path)); ids.add(rfcPath);
  for (const gate of actual.gates) assert.ok(gate.evidence.every(v => ids.has(v)));
  return actual;
}
