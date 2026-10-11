#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assessReport, digest, repositoryRoot, singleMaintainerReviewComplete, validateReport
} from "./lib/runtime-evaluation.mjs";

const read = file => readFileSync(path.join(repositoryRoot, file), "utf8");
const templatePath = "evaluation/single-maintainer-review.template.json";
const template = JSON.parse(read(templatePath));
assert.equal(read(templatePath), JSON.stringify(template, null, 2) + "\n");
assert.equal(template.reviewMode, "single-maintainer");
assert.equal(template.independenceClaimed, false);
for (const field of ["policyRevision", "policyAdoptionEvidence", "reviewedRfcRevision",
  "reviewedReportRevision", "reportSha256", "maintainer", "authorshipDeclaration",
  "conflictsDeclaration", "completedAt", "reviewSummary"]) assert.equal(template[field], null);
for (const lens of [template.architectureReview, template.securityReview]) {
  assert.equal(lens.status, "not-reviewed");
  assert.deepEqual(lens.evidence, []);
}

// Synthetic completeness controls are not reviews, adoption or candidate evidence.
const report = JSON.parse(read("evaluation/candidate-report.template.json"));
report.candidate = "typescript";
report.status = "complete";
report.evaluationPackageRevision = "1".repeat(40);
report.prototype.revision = "2".repeat(40);
report.prototype.source = "prototypes/typescript";
report.toolchain = { version: "synthetic", dependencyLock: "synthetic.lock", buildCommand: "synthetic-build" };
report.evidence = ["evidence/synthetic.json", "evidence/policy-adoption.json",
  "evidence/architecture-review.json", "evidence/security-review.json", "evidence/review-summary.json"];
for (const target of report.targets) { target.result = "passed"; target.evidence = [report.evidence[0]]; }
for (const gate of Object.values(report.hardGates)) { gate.status = "passed"; gate.evidence = [report.evidence[0]]; }
const criteria = ["specificationAndValidationFidelity", "securityAndIsolationFit",
  "crossPlatformDistribution", "ecosystemAndIntegrationFit", "contributorAccessibility",
  "maintainability", "performanceAndResourceUse", "observabilityAndDiagnostics",
  "embeddingAndInteroperability", "operationalFootprint"];
report.reviewerScorecards = [{ reviewer: "synthetic-maintainer",
  scores: Object.fromEntries(criteria.map(id => [id, { score: 0, evidence: [] }])) }];
report.reconciliation = "evidence/review-summary.json";
report.measurements = report.targets.flatMap(target => ["coldStartMs", "validationMs",
  "peakMemoryBytes", "artifactBytes", "cleanBuildMs", "cachedBuildMs", "ciMs"].map(metric => ({
  target: `${target.os}/${target.architecture}`, metric, value: 1, runs: 2,
  method: "synthetic unit-test record", evidence: report.evidence[0]
})));
const context = {
  ...structuredClone(template), policyRevision: "3".repeat(40),
  policyAdoptionEvidence: "evidence/policy-adoption.json", reviewedRfcRevision: "4".repeat(40),
  reviewedReportRevision: "5".repeat(40), reportSha256: digest(JSON.stringify(report)),
  maintainer: "synthetic-maintainer", authorshipDeclaration: "author",
  conflictsDeclaration: "Self-authored synthetic fixture; no independent assurance.",
  completedAt: "2026-10-11T09:00:00Z",
  architectureReview: { status: "completed", evidence: ["evidence/architecture-review.json"] },
  securityReview: { status: "completed", evidence: ["evidence/security-review.json"] },
  reviewSummary: report.reconciliation
};
assert.equal(validateReport(report), true);
assert.equal(singleMaintainerReviewComplete(report, context), true);
assert.equal(assessReport(report).outcome, "not-ready");
assert.deepEqual(assessReport(report).blockers, ["missing-independent-review"]);
assert.equal(assessReport(report, undefined, context).outcome, "candidate-evidence-complete");
assert.equal(assessReport(report, undefined, template).outcome, "not-ready");

let controls = 0;
for (const mutate of [
  c => { c.reviewMode = "unknown"; }, c => { c.policyRevision = "main"; },
  c => { c.policyAdoptionEvidence = null; }, c => { c.reviewedRfcRevision = null; },
  c => { c.reviewedReportRevision = null; }, c => { c.reportSha256 = "0".repeat(64); },
  c => { c.maintainer = ""; }, c => { c.maintainer = "another-person"; },
  c => { c.authorshipDeclaration = null; }, c => { c.conflictsDeclaration = " "; },
  c => { c.independenceClaimed = true; }, c => { c.completedAt = "yesterday"; },
  c => { c.architectureReview.status = "not-reviewed"; },
  c => { c.securityReview.evidence = []; },
  c => { c.securityReview.evidence = ["evidence/uncataloged.json"]; },
  c => { c.securityReview.evidence = ["../outside"]; },
  c => { c.architectureReview.accepted = true; },
  c => { c.reviewSummary = null; }, c => { c.reviewSummary = "evidence/uncataloged.json"; },
  c => { c.architectureAccepted = true; }
]) {
  const changed = structuredClone(context); mutate(changed);
  assert.equal(singleMaintainerReviewComplete(report, changed), false);
  assert.ok(assessReport(report, undefined, changed).blockers.includes("missing-single-maintainer-review"));
  controls++;
}
for (const invalid of [null, [], "single-maintainer", 1, {}]) {
  assert.equal(singleMaintainerReviewComplete(report, invalid), false); controls++;
}
for (const mutate of [
  r => { r.reviewerScorecards.push(structuredClone(r.reviewerScorecards[0])); },
  r => { r.reviewerScorecards = []; }
]) {
  const changed = structuredClone(report); mutate(changed);
  const updated = { ...context, reportSha256: digest(JSON.stringify(changed)) };
  assert.equal(singleMaintainerReviewComplete(changed, updated), false); controls++;
}
for (const [mutate, outcome, blocker] of [
  [r => { r.hardGates.scopeIntegrity.status = "failed"; }, "ineligible", null],
  [r => { r.hardGates.securityBoundary.status = "not-tested"; }, "not-ready", "untested-hard-gate"],
  [r => { r.targets[0].result = "failed"; }, "ineligible", null],
  [r => { r.measurements.pop(); }, "not-ready", "missing-measurements"],
  [r => { r.targets.pop(); }, "not-ready", "target-matrix-mismatch"],
  [r => { r.specificationRevision = "6".repeat(40); }, "not-ready", "baseline-mismatch"]
]) {
  const changed = structuredClone(report); mutate(changed);
  const updated = { ...context, reportSha256: digest(JSON.stringify(changed)) };
  assert.equal(singleMaintainerReviewComplete(changed, updated), true);
  const result = assessReport(changed, undefined, updated);
  assert.equal(result.outcome, outcome);
  if (blocker) assert.ok(result.blockers.includes(blocker));
  assert.equal(Object.hasOwn(result, "architectureAccepted"), false); controls++;
}

const cli = spawnSync(process.execPath, ["scripts/runtime-evaluation-report.mjs",
  "evaluation/candidate-report.template.json", "--review-context", templatePath],
{ cwd: repositoryRoot, encoding: "utf8" });
assert.equal(cli.status, 1);
assert.equal(cli.stderr, "");
assert.ok(JSON.parse(cli.stdout).blockers.includes("missing-single-maintainer-review"));
const badFlag = spawnSync(process.execPath, ["scripts/runtime-evaluation-report.mjs",
  "evaluation/candidate-report.template.json", "--unknown", templatePath],
{ cwd: repositoryRoot, encoding: "utf8" });
assert.equal(badFlag.status, 1);
assert.equal(badFlag.stdout, "");
assert.ok(!badFlag.stderr.includes(repositoryRoot));

const temporary = mkdtempSync(path.join(tmpdir(), "nexflow-review-context-"));
try {
  const reportFile = path.join(temporary, "report.json"), contextFile = path.join(temporary, "review.json");
  writeFileSync(reportFile, JSON.stringify(report));
  writeFileSync(contextFile, JSON.stringify(context));
  const run = () => spawnSync(process.execPath, ["scripts/runtime-evaluation-report.mjs",
    reportFile, "--review-context", contextFile], { cwd: repositoryRoot, encoding: "utf8" });
  const complete = run();
  assert.equal(complete.status, 0);
  assert.equal(complete.stderr, "");
  assert.deepEqual(JSON.parse(complete.stdout), { outcome: "candidate-evidence-complete", blockers: [] });
  for (const invalid of [null, [], "single-maintainer"]) {
    writeFileSync(contextFile, JSON.stringify(invalid));
    const rejected = run();
    assert.equal(rejected.status, 1);
    assert.equal(rejected.stdout, "");
    assert.ok(!rejected.stderr.includes(temporary)); controls++;
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }

const before = "dc34aa786b4df9e7c20c04e35e58db612d057954";
for (const file of ["rfcs/RFC-0023-runtime-architecture-decision.md",
  ".github/workflows/schema-smoke.yml",
  "rfcs/reviews/runtime-architecture-decision-review.md",
  "rfcs/reviews/runtime-architecture-decision-draft.json",
  "rfcs/reviews/2026-10-09-runtime-reviewer-ownership.md",
  "rfcs/reviews/2026-10-09-runtime-reviewer-ownership.json",
  "evaluation/reports/review/reviewer-a.json", "evaluation/reports/review/reviewer-b.json",
  "evaluation/reports/review/reconciliation.json"]) {
  assert.equal(read(file), execFileSync("git", ["show", `${before}:${file}`],
    { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }));
}
for (const candidate of ["typescript", "python", "rust", "go"]) {
  const historical = JSON.parse(read(`evaluation/reports/${candidate}/candidate.json`));
  assert.equal(assessReport(historical).outcome, "ineligible");
  assert.ok(assessReport(historical).blockers.includes("missing-independent-review"));
}
const policy = read("docs/single-maintainer-governance.md");
const previousMatrix = execFileSync("git", ["show", `${before}:docs/language-evaluation-matrix.md`],
  { cwd: repositoryRoot, encoding: "utf8" });
const currentMatrix = read("docs/language-evaluation-matrix.md");
const technicalSection = text => text.split("## Hard Gates")[1].split("### Scoring Scale")[0];
assert.equal(technicalSection(currentMatrix), technicalSection(previousMatrix));
for (const text of ["all eleven gates must pass", "separate explicit", "historical",
  "NF-101", "NF-102", "NF-103", "Self-review", "no-SLA", "not proof of adoption"]) {
  assert.ok(policy.toLowerCase().includes(text.toLowerCase()), text);
}
assert.match(read("rfcs/RFC-0024-single-maintainer-governance.md"), /^## Status\s+Accepted\b/mu);
console.log(`Single-maintainer governance: explicit opt-in, both review lenses, ${controls} rejection/technical controls, legacy snapshots and default assessments preserved; no adoption, consent or architecture acceptance inferred.`);
