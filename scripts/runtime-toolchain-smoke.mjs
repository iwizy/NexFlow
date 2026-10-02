#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { candidateIds, checkProbe, scope } from "./runtime-toolchain-probe-lib.mjs";

const root = new URL("../evaluation/toolchains/", import.meta.url);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => {
  assert.match(path, /^[a-zA-Z0-9_.\/-]+$/u);
  assert.ok(!path.startsWith("/") && !path.split("/").includes(".."), "relative toolchain path required");
  return readFileSync(new URL(path, root), "utf8");
};
const json = path => JSON.parse(read(path));
const baseline = JSON.parse(readFileSync(new URL("../evaluation/baseline.json", import.meta.url), "utf8"));
const manifest = json("toolchains.json");
const packet = json("probe-cases.json");
const sources = ["probe-cases.json", "typescript/package.json", "typescript/package-lock.json",
  "typescript/tsconfig.json", "typescript/src/probe.ts", "python/requirements.in",
  "python/requirements.lock", "python/probe.py", "rust/Cargo.toml", "rust/Cargo.lock",
  "rust/rust-toolchain.toml", "rust/src/main.rs", "go/go.mod", "go/go.sum", "go/main.go"];
const version = /^\d+\.\d+\.\d+$/u;

function checkManifest(record, reader = read) {
  assert.equal(record.formatVersion, "0.1-draft");
  assert.equal(record.scope, scope);
  assert.equal(record.task, "NF-056-04");
  assert.equal(record.specificationRevision, baseline.specificationRevision);
  assert.equal(record.corpusDigest, baseline.corpus.sha256);
  assert.equal(record.candidateEvaluationStatus, "not-started");
  assert.equal(record.hardGateAssessment, "not-tested");
  assert.deepEqual(record.candidates.map(entry => entry.id), candidateIds);
  assert.deepEqual(Object.keys(record.sourceDigests).sort(), [...sources].sort());
  for (const [path, expected] of Object.entries(record.sourceDigests)) {
    assert.match(expected, /^[a-f0-9]{64}$/u);
    assert.equal(digest(reader(path)), expected, path);
  }
  for (const candidate of record.candidates) {
    for (const pin of [...Object.values(candidate.tools), ...Object.values(candidate.directDependencies)]) assert.match(pin, version);
    for (const lock of candidate.locks) {
      assert.ok(lock.startsWith(candidate.id + "/"));
      assert.ok(record.sourceDigests[lock], lock);
    }
    assert.equal(candidate.packaging.status, "planned");
    assert.ok(candidate.provisioning.length && candidate.offlineBuild.length && candidate.probeCommand.length);
    assert.ok(candidate.limitations.length);
    assert.equal(candidate.cli.version, Object.values(candidate.tools)[0]);
  }
  assert.deepEqual(record.targets.map(({ os, architecture }) => ({ os, architecture })),
    baseline.targets.map(({ os, architecture }) => ({ os, architecture })));
  for (const target of record.targets) assert.equal(target.candidateResult, "not-tested");
  for (const receipt of record.runtimeArchiveReceipts) {
    assert.match(receipt.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(["static.rust-lang.org", "go.dev"].includes(new URL(receipt.url).hostname));
    assert.match(receipt.version, version);
  }
  assert.doesNotMatch(JSON.stringify(record), /(?:\/Users\/|\/private\/|[A-Z]:\\|\.localdomain)/u);

  const typescript = record.candidates[0];
  const npmPackage = JSON.parse(reader("typescript/package.json"));
  const npmLock = JSON.parse(reader("typescript/package-lock.json"));
  assert.deepEqual({ ...npmPackage.dependencies, ...npmPackage.devDependencies }, typescript.directDependencies);
  assert.equal(npmPackage.engines.node, typescript.tools.node);
  assert.equal(npmPackage.engines.npm, typescript.tools.npm);
  assert.equal(npmLock.lockfileVersion, 3);
  assert.deepEqual(npmLock.packages[""].dependencies, npmPackage.dependencies);
  assert.deepEqual(npmLock.packages[""].devDependencies, npmPackage.devDependencies);
  for (const [path, item] of Object.entries(npmLock.packages).filter(([path]) => path)) {
    assert.match(item.version, version, path);
    assert.match(item.integrity, /^sha512-[a-zA-Z0-9+/]+=*$/u, path);
    assert.equal(new URL(item.resolved).hostname, "registry.npmjs.org", path);
  }
  for (const [name, pin] of Object.entries(typescript.directDependencies)) {
    assert.equal(npmLock.packages["node_modules/" + name].version, pin);
  }

  const pythonLock = reader("python/requirements.lock").replaceAll(/\\\r?\n/gu, "");
  const pins = new Map();
  for (const line of pythonLock.split("\n").filter(line => line.trim() && !line.startsWith("#"))) {
    const match = /^([\w.-]+)==(\d+\.\d+(?:\.\d+)?)(.*)$/u.exec(line);
    assert.ok(match, "unhashed or ranged Python requirement");
    assert.ok(!pins.has(match[1]), "duplicate Python requirement");
    assert.match(match[3], /^(?:\s+--hash=sha256:[a-f0-9]{64})+\s*$/u);
    pins.set(match[1], match[2]);
  }
  for (const [name, pin] of Object.entries(record.candidates[1].directDependencies)) assert.equal(pins.get(name), pin, name);
  assert.equal(pins.size, 15);
  for (const line of reader("python/requirements.in").trim().split("\n")) {
    const [name, pin] = line.split("==");
    assert.equal(pins.get(name), pin);
  }

  const cargoLock = reader("rust/Cargo.lock");
  const cargoPackages = cargoLock.split("[[package]]").slice(1);
  for (const entry of cargoPackages) {
    assert.match(entry, /\nversion = "\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?"/u);
    if (entry.includes("\nsource = ")) {
      assert.match(entry, /\nsource = "registry\+https:\/\/github\.com\/rust-lang\/crates\.io-index"/u);
      assert.match(entry, /\nchecksum = "[a-f0-9]{64}"/u);
    }
  }
  for (const [name, pin] of Object.entries(record.candidates[2].directDependencies)) {
    assert.ok(cargoPackages.some(entry => entry.includes('\nname = "' + name + '"') &&
      entry.includes('\nversion = "' + pin + '"')), name);
    assert.ok(reader("rust/Cargo.toml").includes('"' + "=" + pin + '"'), name);
  }
  assert.ok(reader("rust/rust-toolchain.toml").includes('channel = "' + record.candidates[2].tools.rustc + '"'));

  const goMod = reader("go/go.mod");
  const goSum = reader("go/go.sum");
  assert.ok(goMod.includes("\ngo " + record.candidates[3].tools.go + "\n"));
  for (const [name, pin] of Object.entries(record.candidates[3].directDependencies)) {
    assert.ok(goMod.includes(name + " v" + pin), name);
    assert.ok(goSum.includes(name + " v" + pin + " h1:"), name);
  }
  for (const line of goSum.trim().split("\n")) assert.match(line, /^\S+ v\S+ h1:[a-zA-Z0-9+/]+=*$/u);
}

function checkEvidence(evidence, candidate) {
  assert.equal(evidence.formatVersion, "0.1-draft");
  assert.equal(evidence.scope, scope);
  assert.deepEqual(evidence.target, { os: "darwin", architecture: "arm64", mode: "native" });
  assert.equal(evidence.probeCasesSha256, digest(read("probe-cases.json")));
  assert.equal(evidence.runs, 2);
  assert.equal(evidence.determinism, "passed");
  assert.equal(evidence.inputImmutable, "passed");
  assert.equal(evidence.stdoutSha256, digest(JSON.stringify(evidence.output) + "\n"));
  checkProbe(packet, evidence.output, candidate);
}

checkManifest(manifest);
for (const candidate of candidateIds) checkEvidence(json(candidate + "/probe-result.json"), candidate);
let rejected = 0;
function rejects(value, change, check) {
  const bad = structuredClone(value);
  change(bad);
  assert.throws(() => check(bad));
  rejected += 1;
}
rejects(manifest, item => item.candidates.pop(), checkManifest);
rejects(manifest, item => item.candidates[0].tools.node = "latest", checkManifest);
rejects(manifest, item => item.candidates[1].directDependencies.PyYAML = "^6.0.3", checkManifest);
rejects(manifest, item => item.candidateEvaluationStatus = "complete", checkManifest);
rejects(manifest, item => item.hardGateAssessment = "passed", checkManifest);
rejects(manifest, item => item.targets[0].candidateResult = "passed", checkManifest);
rejects(manifest, item => item.sourceDigests["/private/tool.lock"] = "0".repeat(64), checkManifest);
rejects(manifest, item => item.sourceDigests["python/requirements.lock"] = "0".repeat(64), checkManifest);
rejects(manifest, item => item.specificationRevision = "0".repeat(40), checkManifest);
const evidence = json("typescript/probe-result.json");
rejects(evidence, item => item.runs = 1, item => checkEvidence(item, "typescript"));
rejects(evidence, item => item.target.os = "linux", item => checkEvidence(item, "typescript"));
rejects(evidence.output, item => item.results[1].diagnostics = [], item => checkProbe(packet, item, "typescript"));
rejects(evidence.output, item => item.results[1].diagnostics[0].path = "", item => checkProbe(packet, item, "typescript"));
rejects(evidence.output, item => item.results[10].value.date = "2026-10-02T00:00:00Z", item => checkProbe(packet, item, "typescript"));
rejects(evidence.output, item => item.results[6].unresolvedReference = false, item => checkProbe(packet, item, "typescript"));
rejects(evidence.output, item => item.results[0].id = item.results[1].id, item => checkProbe(packet, item, "typescript"));
console.log("Candidate toolchains: four hash-pinned plans, 44 capability results, " + rejected + " rejected mutations; candidate gates remain not-tested.");
