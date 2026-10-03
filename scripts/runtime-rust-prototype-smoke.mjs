#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const base = "evaluation/prototypes/rust/";
assert.match(readFileSync(base + "Cargo.toml", "utf8"), /path = "src\/library_driver\.rs"/u);
assert.match(readFileSync(base + "src/library_driver.rs", "utf8"), /evaluate_library_case/u);
assert.equal(readFileSync(base + "rust-toolchain.toml", "utf8"), readFileSync("evaluation/toolchains/rust/rust-toolchain.toml", "utf8"));
assert.equal(readFileSync(base + "Cargo.lock", "utf8").replace('name = "nexflow-rust-evaluation"', 'name = "nexflow-rust-capability-probe"'), readFileSync("evaluation/toolchains/rust/Cargo.lock", "utf8"));
for (const name of readdirSync(base + "src", { recursive: true }).filter(name => name.endsWith(".rs"))) {
  const source = readFileSync(base + "src/" + name, "utf8");
  // Limited maintenance guard, not an OS isolation or supply-chain verdict.
  assert.doesNotMatch(source, /(?:std::process::Command|std::net|reqwest|TcpStream|UdpSocket|std::env::var|scripts\/|\.mjs\b|unsafe\s*\{)/u, name);
}
const record = JSON.parse(readFileSync("evaluation/candidates/rust.json", "utf8"));
if (record.prototype.revision) {
  const evidence = JSON.parse(readFileSync("evaluation/evidence/rust-initial.json", "utf8"));
  assert.equal(record.status, "in-progress");
  assert.equal(record.prototype.source, "evaluation/prototypes/rust");
  assert.equal(evidence.prototypeRevision, record.prototype.revision);
  assert.equal(evidence.evaluationPackageRevision, record.evaluationPackageRevision);
  assert.equal(evidence.cli.results.length, 11);
  assert.ok(evidence.cli.results.every(item => item.result === "passed"));
  assert.equal(evidence.library.results.length, 352);
  assert.deepEqual(evidence.library.counts, { passed: 128, failed: 0, "not-tested": 224 });
  assert.ok(record.targets.every(target => target.result === "not-tested"));
  assert.ok(Object.values(record.hardGates).every(gate => gate.status === "not-tested"));
}
console.log("Independent Rust candidate source/lock checks passed; architecture and distribution remain untested.");
