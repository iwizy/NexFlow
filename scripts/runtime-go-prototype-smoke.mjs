#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
const base = "evaluation/prototypes/go/";
const approved = readFileSync("evaluation/toolchains/go/go.mod", "utf8");
assert.equal(readFileSync(base + "go.mod", "utf8"), approved.replace("module nexflow.local/toolchain-probe", "module nexflow.local/go-evaluation"));
assert.equal(readFileSync(base + "go.sum", "utf8"), readFileSync("evaluation/toolchains/go/go.sum", "utf8"));
function sources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() && entry.name !== "bin" ? sources(name) : entry.isFile() && name.endsWith(".go") ? [name] : [];
  });
}
const files = sources(base);
assert.ok(files.includes(base + "cmd/cli/main.go"));
assert.ok(files.includes(base + "cmd/library-driver/main.go"));
for (const file of files.filter(file => !file.endsWith("_test.go"))) {
  // Source guard only; not an isolation, vulnerability or supply-chain verdict.
  assert.doesNotMatch(readFileSync(file, "utf8"), /"(?:os\/exec|net(?:\/[^"\n]*)?|plugin|unsafe|syscall\/js)"|os\.(?:Getenv|LookupEnv|Environ|WriteFile|Create)\b|\.mjs\b/u, file);
}
const record = JSON.parse(readFileSync("evaluation/candidates/go.json", "utf8"));
if (record.prototype.revision) {
  const evidence = JSON.parse(readFileSync("evaluation/evidence/go-initial.json", "utf8"));
  assert.equal(record.status, "in-progress");
  assert.equal(record.prototype.source, base.slice(0, -1));
  assert.equal(evidence.prototypeRevision, record.prototype.revision);
  assert.equal(evidence.evaluationPackageRevision, record.evaluationPackageRevision);
  assert.equal(evidence.cli.results.length, 11);
  assert.ok(evidence.cli.results.every(item => item.result === "passed"));
  assert.equal(evidence.library.results.length, 352);
  assert.deepEqual(evidence.library.counts, { passed: 128, failed: 0, "not-tested": 224 });
  assert.ok(record.targets.every(target => target.result === "not-tested"));
  assert.ok(Object.values(record.hardGates).every(gate => gate.status === "not-tested"));
}
console.log("Independent Go candidate source/lock checks passed; architecture and distribution remain untested.");
