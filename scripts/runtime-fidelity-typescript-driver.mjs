#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
assert.equal(process.argv.length, 3);
const root = path.resolve(process.argv[2]);
const { evaluateLibraryCase, repositorySchemas } = await import(pathToFileURL(path.join(root, "evaluation/prototypes/typescript/dist/library.js")));
const bytes = readFileSync(0);
assert.ok(bytes.length <= 4 * 1024 * 1024);
const packet = JSON.parse(bytes);
assert.equal(packet.length, 352);
const schemas = repositorySchemas();
const results = packet.map(entry => {
  const before = JSON.stringify(entry);
  const first = evaluateLibraryCase(entry, root, schemas);
  const second = evaluateLibraryCase(entry, root, schemas);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(entry), before);
  return first;
});
process.stdout.write(JSON.stringify(results) + "\n");
