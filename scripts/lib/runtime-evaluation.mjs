import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const baseline = JSON.parse(readFileSync(path.join(repositoryRoot, "evaluation/baseline.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
export const validateReport = ajv.compile(JSON.parse(readFileSync(path.join(repositoryRoot,
  "evaluation/candidate-report.schema.json"), "utf8")));
export const validateOutput = ajv.compile(JSON.parse(readFileSync(path.join(repositoryRoot,
  "evaluation/command-result.schema.json"), "utf8")));

export function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function safeRelative(value) {
  return typeof value === "string" && value.length > 0
    && !value.includes("\\") && !value.includes("\0")
    && !path.posix.isAbsolute(value) && !/^[a-z]:/iu.test(value)
    && value.split("/").every(part => part && part !== "." && part !== "..");
}

export function verifyCorpus(record = baseline, read = file => readFileSync(path.join(repositoryRoot, file))) {
  const errors = [];
  if (!/^[0-9a-f]{40}$/u.test(record.specificationRevision ?? "")) errors.push("invalid-specification-revision");
  if (record.scope !== "validation-only") errors.push("invalid-scope");
  if (JSON.stringify(record.candidates) !== JSON.stringify(["typescript", "python", "rust", "go"])) {
    errors.push("invalid-candidate-set");
  }
  if (JSON.stringify(record.commands) !== JSON.stringify(["validate", "inspect"])) errors.push("invalid-command-set");
  const files = record.corpus?.files;
  if (!Array.isArray(files) || files.length === 0) return [...errors, "missing-corpus"];
  const seen = new Set();
  for (const entry of files) {
    if (!safeRelative(entry.path) || seen.has(entry.path) || !/^[0-9a-f]{64}$/u.test(entry.sha256 ?? "")) {
      errors.push("invalid-corpus-entry");
      continue;
    }
    seen.add(entry.path);
    try {
      if (digest(read(entry.path)) !== entry.sha256) errors.push("corpus-content-changed");
    } catch {
      errors.push("corpus-file-unavailable");
    }
  }
  if (digest(JSON.stringify(files)) !== record.corpus.sha256) errors.push("corpus-inventory-changed");
  const ids = new Set();
  for (const item of record.cases ?? []) {
    if (ids.has(item.id) || !/^[a-z][a-z0-9-]+$/u.test(item.id ?? "")
      || !safeRelative(item.root) || !files.some(file => file.path.startsWith(item.root + "/"))
      || !["validate", "inspect", "run"].includes(item.command)
      || !Array.isArray(item.args) || !item.args.every(arg => typeof arg === "string")
      || item.expected?.mutation !== "none"
      || (item.append && (!safeRelative(item.append.file) || typeof item.append.text !== "string"))) {
      errors.push("invalid-shared-case");
    }
    ids.add(item.id);
  }
  if (ids.size === 0) errors.push("missing-shared-cases");
  return errors;
}

export function compareOutput(item, output, status, stderr) {
  const errors = [];
  const expected = item.expected;
  if (!validateOutput(output)) return ["invalid-output-envelope"];
  if (status !== expected.exitCode || output.exitCode !== expected.exitCode) errors.push("wrong-exit-status");
  if (stderr !== "") errors.push("unexpected-stderr");
  if (output.command !== expected.reportedCommand || output.inputMode !== expected.inputMode) errors.push("wrong-input-mode");
  if (output.checks.discovery !== expected.discovery || output.checks.schema !== expected.schema) errors.push("wrong-check-state");
  if (JSON.stringify(output.diagnostics.map(diagnostic => diagnostic.code))
    !== JSON.stringify(expected.diagnosticCodes)) errors.push("wrong-diagnostics");
  if (expected.documentCount !== undefined && (output.result?.documentCount !== expected.documentCount
    || output.result?.documents?.length !== expected.documentCount)) errors.push("wrong-document-count");
  if (expected.inspection && (output.result?.inspection?.resources?.length !== expected.inspection.resourceCount
    || output.result?.inspection?.references?.length !== expected.inspection.referenceCount)) errors.push("wrong-inspection");
  return errors;
}

export function assessReport(report, record = baseline) {
  if (!validateReport(report)) return { outcome: "not-ready", blockers: ["invalid-report"] };
  const blockers = [];
  if (!Array.isArray(record.targets) || !record.targets.length
    || record.targets.some(target => target.selection !== "confirmed")) blockers.push("unconfirmed-experiment-targets");
  if (!record.candidates.includes(report.candidate)) blockers.push("candidate-not-selected");
  if (report.status !== "complete") blockers.push("report-not-complete");
  if (report.specificationRevision !== record.specificationRevision || report.corpusSha256 !== record.corpus.sha256) {
    blockers.push("baseline-mismatch");
  }
  if (!report.evaluationPackageRevision || !report.prototype.revision || !report.prototype.source) blockers.push("unfixed-prototype-or-package");
  if (Object.values(report.toolchain).some(value => !value)) blockers.push("unfixed-toolchain");
  const required = record.targets.map(target => target.os + "/" + target.architecture).sort();
  const actual = report.targets.map(target => target.os + "/" + target.architecture).sort();
  if (JSON.stringify(required) !== JSON.stringify(actual)) blockers.push("target-matrix-mismatch");
  if (report.targets.some(target => target.result === "not-tested" || target.evidence.length === 0)) blockers.push("missing-target-evidence");
  if (Object.values(report.hardGates).some(gate => gate.status === "not-tested")) blockers.push("untested-hard-gate");
  if (report.reviewerScorecards.length < 2
    || new Set(report.reviewerScorecards.map(card => card.reviewer.trim())).size !== report.reviewerScorecards.length
    || report.reviewerScorecards.some(card => !card.reviewer.trim())
    || !report.reconciliation) blockers.push("missing-independent-review");
  const references = [
    ...report.targets.flatMap(target => target.evidence),
    ...Object.values(report.hardGates).flatMap(gate => gate.evidence),
    ...report.reviewerScorecards.flatMap(card => Object.values(card.scores).flatMap(score => score.evidence)),
    ...report.measurements.map(measurement => measurement.evidence)
  ];
  if (references.some(reference => !report.evidence.includes(reference))) blockers.push("uncataloged-evidence");
  const metrics = ["coldStartMs", "validationMs", "peakMemoryBytes", "artifactBytes", "cleanBuildMs", "cachedBuildMs", "ciMs"];
  if (required.some(target => metrics.some(metric =>
    !report.measurements.some(measurement => measurement.target === target && measurement.metric === metric)))) {
    blockers.push("missing-measurements");
  }
  const failed = Object.values(report.hardGates).some(gate => gate.status === "failed")
    || report.targets.some(target => target.result === "failed");
  return { outcome: failed ? "ineligible" : blockers.length ? "not-ready" : "candidate-evidence-complete", blockers };
}
