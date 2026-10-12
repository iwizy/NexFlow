// Evaluation-only observations. This is not a candidate backend or a new oracle.
import { isDeepStrictEqual } from "node:util";
import { validateOutput } from "./runtime-evaluation.mjs";
import { compareLibraryResult } from "./evaluation-library.mjs";

export const candidates = ["typescript", "python", "rust", "go"];
export const diagnosticFields = ["severity", "code", "message", "file", "kind", "path", "keyword", "related"];
export const mappingId = "nf-102-01-observation-v1";
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical); // Diagnostic order is evidence, not noise.
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const same = (a, b) => isDeepStrictEqual(canonical(a), canonical(b));
export function libraryObservation(operation, issue) {
  // Missing library fields stay missing; no fabricated candidate severity/message.
  const category = issue.category ?? null;
  const code = issue.code ?? null;
  return {
    category, code, path: issue.instancePath ?? null, severity: issue.severity ?? null,
    meaning: [operation, code ?? "not-emitted", category ?? "not-emitted"].join(":"),
    missingProperty: issue.missingProperty ?? null,
    context: Object.fromEntries(["kind", "sourceKind", "targetNamespace", "targetId"].filter(k => Object.hasOwn(issue, k)).map(k => [k, issue[k]])),
    nativeDetails: issue.nativeDiagnostic ?? null,
    emittedFields: Object.keys(issue).sort(),
    publicProjection: operation === "manifest-schema" || operation === "local-schema" ? "schema-adapter" :
      operation === "discovery" || operation === "yaml-parse" ? "context-required-discovery-adapter" : "not-implemented-in-cli",
  };
}
export function portableDiagnostic(issue) {
  // An explicitly bounded comparison view; the original record is always retained.
  const { nativeDetails, emittedFields, ...portable } = issue;
  return portable;
}
export function schemaProjection(issue, file, kind) {
  const missing = issue.missingProperty;
  return { code: issue.code, file, kind, severity: "error", keyword: issue.category,
    path: missing ? (issue.instancePath ?? "") + "/" + missing.replaceAll("~", "~0").replaceAll("/", "~1") : issue.instancePath ?? null };
}
export function publicErrors(output, status, stderr, raw, forbidden = []) {
  const errors = [];
  if (!validateOutput(output)) return ["invalid-public-envelope"];
  if (stderr !== "" || !raw.endsWith("\n") || raw.trim().split("\n").length !== 1) errors.push("invalid-json-transport");
  if (output.exitCode !== status || output.success !== (status === 0)) errors.push("inconsistent-exit");
  if (status !== 0 && output.result !== null || output.truncated && (output.success || output.result !== null)) errors.push("failure-publishes-result");
  if (output.executionAuthorized !== false || ["semantic", "coreProfile", "extensionProfiles"].some(k => output.checks[k] !== "not-run")) errors.push("expanded-cli-claim");
  if (forbidden.some(token => token && raw.includes(token))) errors.push("sensitive-output");
  const safeFile = value => value === null || value === "<input>" || value === "<redacted-source>" ||
    typeof value === "string" && value.length <= 512 && !/^[\/]|[\\:\u0000-\u001f]/u.test(value) && value.split("/").every(p => p && p !== "." && p !== "..");
  for (const issue of output.diagnostics) {
    if (!same(Object.keys(issue).sort(), [...diagnosticFields].sort())) errors.push("native-detail-in-public-diagnostic");
    if (!safeFile(issue.file) || issue.related.some(r => !safeFile(r.file))) errors.push("unsafe-public-locator");
  }
  const key = issue => [...["file", "path", "severity", "code", "kind", "keyword", "message"].map(k => issue[k] ?? ""), JSON.stringify(issue.related)].join("\0");
  const keys = output.diagnostics.map(key);
  if (!same(keys, [...keys].sort())) errors.push("unordered-public-diagnostics");
  return [...new Set(errors)];
}

export function reportErrors(report, catalog, pins) {
  const errors = [];
  if (report.formatVersion !== 1 || report.task !== "NF-102-01" || !candidates.includes(report.candidate) || report.mappingId !== mappingId) errors.push("invalid-report-identity");
  if (!same(report.pins, pins)) errors.push("unbound-report");
  if (!/^[0-9a-f]{40}$/u.test(report.harnessRevision ?? "") || !report.sourceInventory?.length || !report.artifacts?.length) errors.push("unfixed-source-or-build");
  const results = report.library?.results ?? [];
  if (!same(results.map(r => [r.id, r.operation]), catalog.cases.map(c => [c.id, c.operation]))) errors.push("incomplete-ordered-catalog");
  if (results.some((r,i) => r.errors.length || compareLibraryResult(catalog.cases[i],r.actual).length || !r.repeatable || !r.inputUnchanged || r.actual.caseId !== r.id || r.actual.operation !== r.operation ||
    !same(r.observations, r.actual.diagnostics.map(d => libraryObservation(r.operation, d))))) errors.push("library-failure");
  if (report.library?.outerRuns !== 2 || report.library?.passed !== catalog.cases.length || report.library?.failed !== 0) errors.push("invalid-library-counts");
  const cli = report.cli?.results ?? [];
  if (cli.length !== 58 || new Set(cli.map(r => r.id)).size !== cli.length || cli.some(r => r.errors.length || !r.repeatable || !r.inputUnchanged)) errors.push("cli-failure-or-incomplete");
  if (!same(report.limitations?.cliCommands, ["validate", "inspect"]) || report.limitations?.fullProjectSemanticConformance !== "not-tested" || report.limitations?.stablePublicApi !== "not-established" || report.architectureOutcome !== "not-ready") errors.push("inflated-qualification");
  return [...new Set(errors)];
}
