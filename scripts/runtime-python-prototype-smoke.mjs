#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
const base = "evaluation/prototypes/python/";
assert.equal(readFileSync(base + ".python-version", "utf8").trim(), "3.12.15");
const approved = JSON.parse(readFileSync("evaluation/repairs/supply-chain/toolchains.json"));
for (const file of ["requirements.in","requirements.lock"]) assert.equal(createHash("sha256").update(readFileSync(base+file)).digest("hex"),approved.locks[base+file]);
for (const name of readdirSync(base + "nexflow_python_evaluation").filter(name => name.endsWith(".py"))) {
  const source = readFileSync(base + "nexflow_python_evaluation/" + name, "utf8");
  // A limited maintenance guard; never an isolation or supply-chain verdict.
  assert.doesNotMatch(source, /(?:subprocess|socket|urllib|requests|ctypes|pickle|process\.env|os\.(?:system|popen|getenv|environ)|\b(?:exec|eval|__import__)\s*\(|scripts\/|\.mjs\b)/u, name);
}
const record = JSON.parse(readFileSync("evaluation/candidates/python.json", "utf8"));
if (record.prototype.revision) {
  const evidence = JSON.parse(readFileSync("evaluation/evidence/python-initial.json", "utf8"));
  assert.equal(record.status, "in-progress");
  assert.equal(record.prototype.source, "evaluation/prototypes/python");
  assert.equal(evidence.prototypeRevision, record.prototype.revision);
  assert.equal(evidence.evaluationPackageRevision, record.evaluationPackageRevision);
  assert.equal(evidence.cli.results.length, 11);
  assert.ok(evidence.cli.results.every(item => item.result === "passed"));
  assert.equal(evidence.library.results.length, 352);
  assert.deepEqual(evidence.library.counts, { passed: 128, failed: 0, "not-tested": 224 });
  assert.ok(record.targets.every(target => target.result === "not-tested"));
  assert.ok(Object.values(record.hardGates).every(gate => gate.status === "not-tested"));
}
console.log("Independent Python candidate source/lock checks passed; architecture and distribution remain untested.");
