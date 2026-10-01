import { isDeepStrictEqual } from "node:util";

export const LIBRARY_OPERATIONS = Object.freeze([
  "semantic-fragment", "workflow-namespace", "artifact-namespace",
  "manifest-schema", "local-schema", "yaml-parse", "discovery"
]);

export function catalogErrors(catalog, baseline) {
  const errors = [];
  if (catalog.formatVersion !== "0.1-draft" || catalog.scope !== "validation-only-library-experiment") errors.push("wrong-contract");
  if (catalog.specificationRevision !== baseline.specificationRevision
    || catalog.sourceCorpusSha256 !== baseline.corpus.sha256) errors.push("stale-baseline");
  if (!Array.isArray(catalog.unsupported) || !catalog.unsupported.length) errors.push("missing-limitations");
  const seen = new Set();
  for (const entry of catalog.files ?? []) {
    if (seen.has(entry.path) || !baseline.corpus.files.some(file => file.path === entry.path && file.sha256 === entry.sha256)) errors.push("invalid-source-file");
    seen.add(entry.path);
  }
  const ids = new Set();
  for (const item of catalog.cases ?? []) {
    if (!/^[a-z][a-z0-9-]+$/u.test(item.id ?? "") || ids.has(item.id)) errors.push("invalid-case-id");
    ids.add(item.id);
    if (!LIBRARY_OPERATIONS.includes(item.operation)) errors.push("unsupported-operation");
    if (!item.input || typeof item.expected?.valid !== "boolean" || !Array.isArray(item.expected.diagnostics)
      || item.expected.valid !== (item.expected.diagnostics.length === 0)) errors.push("invalid-case-contract");
    if (item.specificationRule?.specificationRevision !== baseline.specificationRevision
      || !/^docs\/[a-z0-9.-]+\.md$/u.test(item.specificationRule?.path ?? "")
      || !item.specificationRule?.section) errors.push("unfixed-specification-rule");
    if (item.operation === "manifest-schema" && !seen.has(item.input?.file)) errors.push("unfixed-case-input");
  }
  const requiredExamples = baseline.corpus.files.filter(file => /^examples\/.*\.ya?ml$/u.test(file.path)).map(file => file.path).sort();
  const actualExamples = (catalog.cases ?? []).filter(item => item.operation === "manifest-schema" && item.expected?.valid).map(item => item.input?.file).sort();
  if (!isDeepStrictEqual(requiredExamples, actualExamples)) errors.push("missing-maintained-examples");
  if (!ids.size) errors.push("missing-cases");
  return errors;
}

function contains(actual, expected) {
  if (expected === null || typeof expected !== "object") return actual === expected;
  if (actual === null || typeof actual !== "object") return false;
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((value, index) => contains(actual[index], value));
  return Object.entries(expected).every(([key, value]) => Object.hasOwn(actual, key) && contains(actual[key], value));
}

export function compareLibraryResult(testCase, result) {
  if (result?.caseId !== testCase.id || result?.operation !== testCase.operation) return ["wrong-case"];
  if (result.checks?.runtime !== "not-run" || result.checks?.extensions !== "not-run") return ["expanded-authority"];
  if (!contains(result, testCase.expected)) return ["wrong-result-properties"];
  return [];
}
