#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { baseline, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { catalogErrors, compareLibraryResult } from "./lib/evaluation-library.mjs";

assert.equal(process.argv.length, 3, "Provide the reviewed native Go library driver.");
assert.deepEqual(verifyCorpus(), []);
const bytes = readFileSync("evaluation/library-cases.json");
const catalog = JSON.parse(bytes);
assert.deepEqual(catalogErrors(catalog, baseline), []);
const input = catalog.cases.map(({ id, operation, input }) => ({ id, operation, input }));
const run = spawnSync(process.argv[2], [repositoryRoot],
  { cwd: repositoryRoot, input: JSON.stringify(input), encoding: "utf8", shell: false, timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
assert.equal(run.status, 0, "Native library driver did not produce a result.");
assert.equal(run.stderr, "");
assert.equal(run.stdout.includes(repositoryRoot), false);
const actual = JSON.parse(run.stdout);
assert.equal(actual.length, catalog.cases.length);
const results = catalog.cases.map((entry, index) => {
  const result = actual[index];
  assert.equal(result.caseId, entry.id);
  assert.equal(result.operation, entry.operation);
  assert.deepEqual(result.checks, { runtime: "not-run", extensions: "not-run" });
  const errors = result.status === "not-implemented" ? [] : compareLibraryResult(entry, result);
  return { id: entry.id, operation: entry.operation, result: result.status === "not-implemented" ? "not-tested" : errors.length ? "failed" : "passed", errors, actual: result };
});
assert.deepEqual(verifyCorpus(), []);
assert.equal(digest(readFileSync("evaluation/library-cases.json")), digest(bytes));
console.log(JSON.stringify({ scope: "initial-go-library-entry", specificationRevision: baseline.specificationRevision,
  corpusSha256: baseline.corpus.sha256, catalogSha256: digest(bytes), runsPerCase: 2,
  counts: Object.fromEntries(["passed", "failed", "not-tested"].map(result => [result, results.filter(item => item.result === result).length])), results,
  untested: ["semantic-port", "os-sandbox", "offline-enforcement", "distribution", "supply-chain", "performance", "review"] }, null, 2));
process.exitCode = results.some(item => item.result === "failed") ? 1 : 0;
