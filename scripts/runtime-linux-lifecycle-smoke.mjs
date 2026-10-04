#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { repositoryRoot as root, baseline, digest, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { lifecycleErrors, lifecycleStages } from "./lib/linux-lifecycle-evidence.mjs";
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const stage = status => ({ status, evidence: ["synthetic rejection-control fixture only"] });
const candidate = "typescript", files = [{ path: "fixture.txt", bytes: 1, sha256: "1".repeat(64) }];
const synthetic = { task: "NF-056-12", candidate, sourceRevision: pins.candidates[candidate].sourceRevision,
  specificationRevision: pins.specificationRevision, corpusSha256: pins.corpusSha256,
  target: "linux/amd64", environment: { platform: "linux", architecture: "x64", translated: false, runnerLabel: "ubuntu-24.04" },
  artifact: { sha256: "2".repeat(64), bytes: 100, manifestSha256: digest(JSON.stringify(files)), files },
  lockfiles: files, supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: "3".repeat(64) },
  collectorRevision: "4".repeat(40), collectorSources: files, previousArtifact: null, outcome: "not-ready", distributionGate: "partial",
  stages: Object.fromEntries(lifecycleStages.map(s => [s, stage(["upgrade", "rollback", "signing"].includes(s) ? "not-tested"
    : ["validateInspect", "offlineUse"].includes(s) ? "failed" : "passed")])),
  isolation: { network: { status: "passed" }, inputReadOnly: { status: "passed" }, buildSchemasHidden: true, unprivileged: true },
  execution: { cases: baseline.cases.map(c => ({ id: c.id, status: "failed", errors: ["synthetic observed failure"],
    attempts: [0, 1].map(() => ({ exitCode: 1, output: null, stdoutSha256: "5".repeat(64), stderrSha256: "6".repeat(64) })) })) },
  immutability: { sources: true, locks: true, corpus: true } };
assert.deepEqual(lifecycleErrors(synthetic, pins), []);
const mutations = [
  r => r.sourceRevision = "a".repeat(40), r => r.corpusSha256 = "a".repeat(64), r => r.target = "macos/arm64",
  r => r.environment.platform = "darwin", r => r.environment.architecture = "arm64", r => r.environment.translated = true,
  r => r.artifact.sha256 = null, r => r.artifact.files[0].sha256 = "a".repeat(64), r => r.lockfiles = [],
  r => r.supplyChain.revision = "a".repeat(40), r => r.collectorSources = [], r => delete r.stages.install,
  r => r.previousArtifact = { sha256: "a".repeat(64) }, r => r.stages.upgrade.status = "passed", r => r.stages.rollback.status = "passed",
  r => r.stages.signing.status = "passed", r => r.outcome = "ready", r => r.distributionGate = "passed",
  r => r.isolation.network.status = "not-tested", r => r.isolation.inputReadOnly.status = "not-tested",
  r => r.isolation.buildSchemasHidden = false, r => r.isolation.unprivileged = false,
  r => r.execution.cases.pop(), r => r.execution.cases[0].attempts.pop(),
  r => { r.execution.cases[0].status = "passed"; r.execution.cases[0].errors = []; },
  r => r.stages.validateInspect.status = "passed", r => r.stages.offlineUse.status = "passed",
  r => r.immutability.locks = false, r => r.limitations = ["/home/runner/example"],
];
for (const mutate of mutations) { const altered = structuredClone(synthetic); mutate(altered); assert.ok(lifecycleErrors(altered, pins).length); }
assert.deepEqual(verifyCorpus(), []);
const directory = path.join(root, "evaluation/lifecycle/linux");
const any = Object.keys(pins.candidates).some(id => existsSync(path.join(directory, id + ".json")));
let real = 0;
if (any) for (const id of Object.keys(pins.candidates)) {
  const file = path.join(directory, id + ".json"); assert.ok(existsSync(file));
  const report = JSON.parse(readFileSync(file)); assert.deepEqual(lifecycleErrors(report, pins), [], id);
  for (const source of report.collectorSources) assert.equal(digest(execFileSync("git", ["show", report.collectorRevision + ":" + source.path], { cwd: root })), source.sha256);
  for (const source of report.sourceManifest) assert.equal(digest(execFileSync("git", ["show", report.sourceRevision + ":" + source.path], { cwd: root })), source.sha256);
  assert.equal(digest(JSON.stringify(report.sourceManifest)), report.sourceManifestSha256);
  assert.equal(digest(readFileSync(path.join(root, "evaluation/supply-chain", id, "inventory.json"))), report.supplyChain.inventorySha256);
  real++;
}
console.log("Linux lifecycle consistency: " + (mutations.length + 1) + " synthetic controls passed; " + real + " stored native records checked. Not distribution approval.");
