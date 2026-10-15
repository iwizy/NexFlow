#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

const base = "evaluation/prototypes/typescript/";
const manifest = JSON.parse(readFileSync(base + "package.json", "utf8"));
assert.equal(manifest.private, true);
assert.deepEqual(manifest.engines, { node: "26.12.0", npm: "12.2.0" });
assert.equal(manifest.devDependencies.typescript, "6.0.3");
const approved = JSON.parse(readFileSync("evaluation/repairs/supply-chain/toolchains.json"));
for (const file of ["package-lock.json"]) assert.equal(createHash("sha256").update(readFileSync(base+file)).digest("hex"),approved.locks[base+file]);

for (const name of readdirSync(base + "src").filter(name => name.endsWith(".ts") && name !== "self-test.ts")) {
  const source = readFileSync(base + "src/" + name, "utf8");
  // This source inventory is a maintenance guard, not proof of OS isolation.
  assert.doesNotMatch(source, /(?:scripts\/|node:(?:child_process|http|https|net|tls|dns)|\b(?:fetch|eval|Function|execSync|spawnSync|writeFileSync)\s*\(|process\.env)/u, name);
  for (const match of source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/gu)) {
    assert.ok(match[1].startsWith("./") || ["node:fs", "node:path", "node:util", "ajv/dist/2020.js", "ajv-formats", "yaml"].includes(match[1]), name);
  }
}
const record = JSON.parse(readFileSync("evaluation/candidates/typescript.json", "utf8"));
if (record.prototype.revision) {
  assert.equal(record.status, "in-progress");
  assert.equal(record.prototype.source, "evaluation/prototypes/typescript");
  const evidence = JSON.parse(readFileSync("evaluation/evidence/typescript-initial.json", "utf8"));
  assert.equal(evidence.prototypeRevision, record.prototype.revision);
  assert.equal(evidence.evaluationPackageRevision, record.evaluationPackageRevision);
  assert.equal(evidence.cli.results.length, 11);
  assert.ok(evidence.cli.results.every(item => item.result === "passed"));
  assert.deepEqual(evidence.library.counts, { passed: 128, failed: 0, "not-tested": 224 });
  assert.equal(evidence.library.results.length, 352);
  assert.ok(record.targets.every(target => target.result === "not-tested"));
  assert.ok(Object.values(record.hardGates).every(gate => gate.status === "not-tested"));
}
console.log("Initial TypeScript candidate checks passed; architecture and distribution remain untested.");
