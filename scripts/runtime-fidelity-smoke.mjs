#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { baseline, digest, validateOutput } from "./lib/runtime-evaluation.mjs";
import { canonical, classifyLibrary, cliMeaning, compareFour, counts, libraryMeaning, textMeaningErrors } from "./lib/fidelity-comparison.mjs";

const ids = ["typescript", "python", "rust", "go"];
const pins = JSON.parse(readFileSync("evaluation/fidelity/source-pins.json"));
const catalog = JSON.parse(readFileSync("evaluation/library-cases.json"));
assert.equal(pins.specificationRevision, baseline.specificationRevision);
assert.equal(pins.corpusSha256, baseline.corpus.sha256);
assert.equal(pins.catalogSha256, digest(readFileSync("evaluation/library-cases.json")));
assert.deepEqual(Object.keys(pins.candidates), ids);
for (const pin of Object.values(pins.candidates)) {
  assert.match(pin.sourceRevision, /^[a-f0-9]{40}$/u);
  assert.match(pin.publishedHead, /^[a-f0-9]{40}$/u);
}
const entry = { id: "synthetic", operation: "semantic-fragment", expected: { valid: true, diagnostics: [] } };
const absent = { caseId: entry.id, operation: entry.operation, valid: null, status: "not-implemented", diagnostics: [], checks: { runtime: "not-run", extensions: "not-run" } };
assert.equal(classifyLibrary(entry, absent).result, "not-tested");
assert.equal(classifyLibrary(entry, { ...absent, valid: true }).result, "failed");
assert.equal(classifyLibrary(entry, { ...absent, checks: { runtime: "passed", extensions: "not-run" } }).result, "failed");
assert.equal(classifyLibrary(entry, { ...absent, diagnostics: [{}] }).result, "failed");
assert.equal(classifyLibrary(entry, { ...absent, caseId: "other" }).result, "failed");
assert.equal(classifyLibrary(entry, undefined).result, "failed");
assert.deepEqual(canonical({ b: 1, a: { d: 2, c: 3 } }), { a: { c: 3, d: 2 }, b: 1 });
assert.notDeepEqual(canonical([1, 2]), canonical([2, 1]));
const diagnostic = { severity: "error", code: "NF-SCHEMA", message: "fixed meaning", file: "project.yaml", path: "", keyword: "type", related: [] };
const envelope = { success: false, diagnostics: [diagnostic] };
const rendered = 'error NF-SCHEMA: fixed meaning file="project.yaml" path="" keyword="type"\n';
assert.deepEqual(textMeaningErrors(rendered, envelope), []);
assert.ok(textMeaningErrors(rendered.replace("fixed meaning", "different meaning"), envelope).length);
assert.ok(textMeaningErrors(rendered.replace("error", "warning"), envelope).length);
assert.ok(textMeaningErrors(rendered.replace('path=""', 'path="/other"'), envelope).length);
assert.deepEqual(textMeaningErrors(rendered.replace('"project.yaml"', '"\\u003cinput\\u003e"'), { ...envelope, diagnostics: [{ ...diagnostic, file: "<input>" }] }), []);
assert.deepEqual(libraryMeaning({ ...absent, diagnostics: [{ category: "items", nativeDiagnostic: { category: "falseSchema" } }] }).diagnostics, [{ category: "items" }]);
function syntheticReports() {
  return ids.map(candidate => ({ candidate, harnessRevision: "a".repeat(40), environment: { os: "synthetic" },
    cli: { results: Array.from({ length: 11 }, (_, i) => ({ id: "cli-" + i, result: "passed", normalized: { code: "example" } })) },
    library: { results: Array.from({ length: 352 }, (_, i) => ({ id: "library-" + i, result: "not-tested", normalized: absent })) } }));
}
let synthetic = syntheticReports();
assert.deepEqual(compareFour(synthetic).library.counts, { passed: 0, failed: 0, "not-tested": 352 });
synthetic[3].cli.results[0].normalized.code = "different";
assert.equal(compareFour(synthetic).cli.results[0].result, "failed");
synthetic = syntheticReports(); synthetic[2].library.results[0].result = "failed";
assert.equal(compareFour(synthetic).library.results[0].result, "failed");
synthetic[1].harnessRevision = "b".repeat(40);
assert.throws(() => compareFour(synthetic));
assert.throws(() => compareFour(syntheticReports().slice(1)));

if (existsSync("evaluation/fidelity/typescript.json")) {
  const reports = ids.map(id => JSON.parse(readFileSync("evaluation/fidelity/" + id + ".json")));
  for (const [index, report] of reports.entries()) {
    assert.equal(report.candidate, ids[index]);
    assert.equal(report.prototypeRevision, pins.candidates[report.candidate].sourceRevision);
    assert.equal(report.evaluationPackageRevision, pins.evaluationPackageRevision);
    assert.equal(report.catalogSha256, pins.catalogSha256);
    assert.equal(report.outcome, "not-ready");
    assert.equal(report.selection, null);
    assert.equal(report.gates.specificationFidelity.status, "failed");
    assert.equal(report.gates.deterministicDiagnostics.status, "not-tested");
    assert.equal(report.library.nativeEvaluationsPerCase, 4);
    assert.equal(report.library.inputIncludesOracle, false);
    assert.deepEqual(report.library.results.map(({ id, operation }) => ({ id, operation })), catalog.cases.map(({ id, operation }) => ({ id, operation })));
    assert.deepEqual(counts(report.library.results), report.library.counts);
    assert.deepEqual(counts(report.cli.results), report.cli.counts);
    report.library.results.forEach((item, i) => {
      const classification = classifyLibrary(catalog.cases[i], item.normalized);
      assert.deepEqual(classification.errors, item.errors);
      assert.equal(classification.result, item.result);
    });
    for (const item of report.cli.results) {
      // Normalization removes only candidate identity and wording; preserve
      // envelope authority states and full declared inspection for comparison.
      assert.equal(item.normalized.executionAuthorized, false);
      const shape = { ...item.normalized, tool: { name: "nexflow-fidelity-check", version: "unreleased" }, diagnostics: item.normalized.diagnostics.map(issue => ({ ...issue, message: "reviewed diagnostic meaning" })) };
      assert.ok(validateOutput(shape));
      assert.deepEqual(cliMeaning(shape), item.normalized);
      assert.equal(item.formats.json.processRuns, 2);
      assert.equal(item.formats.text.processRuns, 2);
    }
  }
  const expected = compareFour(reports);
  assert.deepEqual(JSON.parse(readFileSync("evaluation/fidelity/comparison.json")), expected);
}
console.log("Fidelity harness rejection checks passed; unsupported evidence never becomes a fidelity pass.");
