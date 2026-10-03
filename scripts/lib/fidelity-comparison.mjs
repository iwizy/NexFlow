import { isDeepStrictEqual } from "node:util";
import { compareLibraryResult } from "./evaluation-library.mjs";

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export function diagnosticMeaning(item) {
  return canonical(Object.fromEntries(Object.entries(item).filter(([key]) => !["message", "nativeDiagnostic"].includes(key))));
}
export function cliMeaning(output) {
  if (!output) return null;
  const { tool, diagnostics, ...rest } = output;
  return canonical({ ...rest, diagnostics: diagnostics.map(diagnosticMeaning) });
}
export function libraryMeaning(output) {
  const { diagnostics, ...rest } = output;
  return canonical({ ...rest, diagnostics: diagnostics.map(diagnosticMeaning) });
}
export function classifyLibrary(entry, actual) {
  const errors = [];
  if (actual?.caseId !== entry.id || actual?.operation !== entry.operation) errors.push("wrong-case");
  if (actual?.checks?.runtime !== "not-run" || actual?.checks?.extensions !== "not-run") errors.push("expanded-authority");
  if (!Array.isArray(actual?.diagnostics)) errors.push("invalid-diagnostics");
  if (actual?.status === "not-implemented") {
    if (actual.valid !== null || actual.diagnostics?.length !== 0) errors.push("false-unsupported-verdict");
    return { result: errors.length ? "failed" : "not-tested", errors };
  }
  errors.push(...compareLibraryResult(entry, actual));
  return { result: errors.length ? "failed" : "passed", errors: [...new Set(errors)] };
}
export function counts(results) {
  return Object.fromEntries(["passed", "failed", "not-tested"].map(result => [result, results.filter(item => item.result === result).length]));
}
export function compareFour(reports) {
  const ids = ["typescript", "python", "rust", "go"];
  if (reports.length !== 4 || reports.some((report, index) => report.candidate !== ids[index])) throw new Error("invalid candidate set");
  const first = reports[0];
  for (const report of reports) {
    for (const key of ["harnessRevision", "specificationRevision", "evaluationPackageRevision", "corpusSha256", "catalogSha256"]) {
      if (report[key] !== first[key]) throw new Error("non-comparable report revisions");
    }
    if (report.library.results.length !== 352 || report.cli.results.length !== 11) throw new Error("incomplete report");
    if (!isDeepStrictEqual(report.environment, first.environment)) throw new Error("non-comparable environment");
  }
  function compare(section) {
    return first[section].results.map((item, index) => {
      const rows = reports.map(report => report[section].results[index]);
      if (rows.some(row => row.id !== item.id)) throw new Error("non-comparable case order");
      const tested = rows.every(row => row.result !== "not-tested");
      const failures = rows.some(row => row.result === "failed");
      const equal = tested && rows.every(row => isDeepStrictEqual(row.normalized, rows[0].normalized));
      return { id: item.id, ...(item.operation ? { operation: item.operation } : {}),
        result: !tested && !failures ? "not-tested" : !failures && equal ? "passed" : "failed",
        candidates: Object.fromEntries(ids.map((id, index) => [id, rows[index].result])),
        errors: failures ? ["candidate-contract-failure"] : tested && !equal ? ["normalized-meaning-mismatch"] : [] };
    });
  }
  const library = compare("library"), cli = compare("cli");
  return { formatVersion: "0.1-draft", task: "NF-056-09", recordedAt: first.recordedAt,
    harnessRevision: first.harnessRevision, specificationRevision: first.specificationRevision,
    evaluationPackageRevision: first.evaluationPackageRevision, corpusSha256: first.corpusSha256,
    catalogSha256: first.catalogSha256, environment: first.environment,
    candidateRevisions: Object.fromEntries(reports.map(report => [report.candidate, report.prototypeRevision])),
    cli: { counts: counts(cli), results: cli }, library: { counts: counts(library), results: library },
    outcome: "not-ready", selection: null,
    blockers: ["missing-semantic-and-namespace-coverage", "full-diagnostic-gate-not-tested", "architecture-evidence-and-independent-review-outstanding"],
    nonClaims: ["No winner, scores, architecture acceptance, runtime execution, OS isolation, distribution support or performance comparison.", "Unsupported agreement is not successful specification fidelity."] };
}

// Human wording may differ, but every rendered diagnostic must carry the same
// severity/code and JSON-escaped file/path/keyword as the JSON envelope, in order.
export function textMeaningErrors(text, output) {
  const lines = text.trimEnd().split("\n");
  const errors = [];
  if (lines.length !== output.diagnostics.length + (output.success ? 1 + (output.result?.inspection ? 1 : 0) : 0)) errors.push("wrong-text-line-count");
  output.diagnostics.forEach((item, index) => {
    const line = lines[index] ?? "";
    const suffix = line.match(/file=(null|"(?:[^"\\]|\\.)*") path=(null|"(?:[^"\\]|\\.)*") keyword=(null|"(?:[^"\\]|\\.)*")$/u);
    if (!line.startsWith(item.severity + " " + item.code + ": " + item.message + " file=") || !suffix ||
      !isDeepStrictEqual(suffix.slice(1).map(value => JSON.parse(value)), [item.file, item.path, item.keyword])) errors.push("text-diagnostic-meaning-mismatch");
  });
  if (output.success) {
    if (lines[output.diagnostics.length] !== "Selected local manifest structure is valid; no execution is authorized.") errors.push("text-authority-mismatch");
    if (output.result?.inspection) {
      try { if (!isDeepStrictEqual(JSON.parse(lines.at(-1)), output.result.inspection)) errors.push("text-inspection-mismatch"); }
      catch { errors.push("invalid-text-inspection"); }
    }
  }
  return [...new Set(errors)];
}
