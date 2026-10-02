#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { baseline, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { catalogErrors, compareLibraryResult } from "./lib/evaluation-library.mjs";
import { evaluateLibraryCase, repositorySchemas } from "../evaluation/prototypes/typescript/dist/library.js";

assert.deepEqual(verifyCorpus(), []);
const bytes = readFileSync(new URL("../evaluation/library-cases.json", import.meta.url));
const catalog = JSON.parse(bytes);
assert.deepEqual(catalogErrors(catalog, baseline), []);
const schemas = repositorySchemas();
const results = catalog.cases.map(entry => {
  // The candidate receives only the case identity and input, never the oracle.
  const input = { id: entry.id, operation: entry.operation, input: structuredClone(entry.input) };
  const before = JSON.stringify(input);
  const first = evaluateLibraryCase(input, repositoryRoot, schemas);
  const second = evaluateLibraryCase(input, repositoryRoot, schemas);
  assert.deepEqual(first, second, entry.id + ": nondeterministic result");
  assert.equal(JSON.stringify(input), before, entry.id + ": mutated input");
  assert.equal(first.checks.runtime, "not-run");
  assert.equal(first.checks.extensions, "not-run");
  const errors = first.status === "not-implemented" ? [] : compareLibraryResult(entry, first);
  return { id: entry.id, operation: entry.operation,
    result: first.status === "not-implemented" ? "not-tested" : errors.length ? "failed" : "passed", errors };
});
assert.deepEqual(verifyCorpus(), []);
assert.equal(digest(readFileSync(new URL("../evaluation/library-cases.json", import.meta.url))), digest(bytes));
console.log(JSON.stringify({ scope: "initial-typescript-library-entry",
  specificationRevision: baseline.specificationRevision, corpusSha256: baseline.corpus.sha256,
  catalogSha256: digest(bytes), runsPerCase: 2,
  counts: Object.fromEntries(["passed", "failed", "not-tested"].map(result => [result, results.filter(item => item.result === result).length])),
  results, untested: ["semantic-port", "os-sandbox", "offline-enforcement", "distribution", "supply-chain", "performance", "review"] }, null, 2));
// Deferred operations remain explicit; an unexpected mismatch is a failure.
process.exitCode = results.some(item => item.result === "failed") ? 1 : 0;
