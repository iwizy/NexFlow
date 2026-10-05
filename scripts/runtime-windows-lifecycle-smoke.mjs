#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { baseline, digest, verifyCorpus, repositoryRoot as root } from "./lib/runtime-evaluation.mjs";
import { windowsErrors, windowsStages, windowsCollectorFiles, peMachine } from "./lib/windows-lifecycle-evidence.mjs";
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const rows = [{ path: "fixture/package.json", sha256: "1".repeat(64), bytes: 1 }], stage = status => ({ status, evidence: ["Synthetic rejection fixture; not native evidence"] });
const synthetic = { task: "NF-056-14", candidate: "typescript", sourceRevision: pins.candidates.typescript.sourceRevision,
  specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
  target: "windows/amd64", environment: { platform: "win32", architecture: "x64", runnerLabel: "windows-2025", translated: false,
    imageVersion: "synthetic", cpuModel: "synthetic", osBuild: "synthetic", cohortCheck: { fingerprint: "not-matched" } },
  collectorRevision: "2".repeat(40), collectorSources: windowsCollectorFiles.map(path => ({ path, sha256: "3".repeat(64) })),
  sourceManifest: rows, sourceManifestSha256: digest(JSON.stringify(rows)), lockfiles: rows,
  supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: "4".repeat(64), remediation: "none" },
  artifact: { version: pins.candidates.typescript.sourceRevision + ".windows.amd64." + "2".repeat(40), sha256: "5".repeat(64), bytes: 1, files: rows, manifestSha256: digest(JSON.stringify(rows)) },
  nativeBinaries: [{ machine: 0x8664, sha256: "6".repeat(64) }], previousArtifact: null, outcome: "not-ready", distributionGate: "partial", blockers: ["Synthetic incomplete gates"],
  installation: { installedPrefixVerified: true, commands: [{ exitCode: 0 }] },
  stages: Object.fromEntries(windowsStages.map(k => [k, stage(["offlineUse", "upgrade", "rollback", "signing"].includes(k) ? "not-tested" : k === "validateInspect" ? "failed" : "passed")])),
  isolation: { network: "not-tested", filesystem: "not-tested", credential: "not-tested", buildSchemasHidden: true },
  execution: { cases: baseline.cases.map(c => ({ id: c.id, status: "failed", errors: ["Synthetic failure"], attempts: [0, 1].map(() => ({ exitCode: 1, output: null, stdoutSha256: "7".repeat(64), stderrSha256: "8".repeat(64) })) })) },
  immutability: { sources: true, locks: true, corpus: true } };
assert.deepEqual(windowsErrors(synthetic, pins), []);
const mutations = [r => r.sourceRevision = "0".repeat(40), r => r.specificationRevision = "0".repeat(40), r => r.evaluationPackageRevision = "0".repeat(40),
  r => r.corpusSha256 = "0".repeat(64), r => r.catalogSha256 = "0".repeat(64), r => r.target = "linux/amd64", r => r.environment.platform = "linux",
  r => r.environment.architecture = "arm64", r => r.environment.translated = true, r => r.environment.imageVersion = "", r => r.environment.cpuModel = "",
  r => r.environment.cohortCheck.fingerprint = "passed", r => r.collectorSources.pop(), r => r.collectorRevision = "", r => r.sourceManifest = [],
  r => r.lockfiles = [], r => r.supplyChain.remediation = "applied", r => r.supplyChain.revision = "0".repeat(40), r => r.artifact.files[0].sha256 = "0".repeat(64),
  r => r.artifact.version = "v0.4.0", r => r.nativeBinaries[0].machine = 0xaa64, r => r.previousArtifact = {}, r => r.stages.upgrade.status = "passed",
  r => r.stages.rollback.status = "passed", r => r.stages.signing.status = "passed", r => r.stages.offlineUse.status = "passed", r => r.isolation.network = "passed",
  r => r.isolation.filesystem = "passed", r => r.isolation.credential = "passed", r => r.isolation.buildSchemasHidden = false,
  r => r.execution.cases.pop(), r => r.execution.cases[0].attempts.pop(), r => { r.execution.cases[0].status = "passed"; r.execution.cases[0].errors = []; },
  r => r.stages.validateInspect.status = "passed", r => r.outcome = "ready", r => r.distributionGate = "passed", r => r.immutability.locks = false,
  r => r.blockers = [], r => r.limitations = ["C:\\Users\\example\\private"], r => delete r.stages.install];
for (const [index, mutate] of mutations.entries()) { const changed = structuredClone(synthetic); mutate(changed); assert.ok(windowsErrors(changed, pins).length, "mutation " + index); }
const blocked = structuredClone(synthetic); blocked.artifact = null; blocked.stages.build = stage("failed"); blocked.installation.installedPrefixVerified = false;
for (const k of ["install", "validateInspect", "uninstall"]) blocked.stages[k] = stage("not-tested"); blocked.execution.cases = [];
assert.deepEqual(windowsErrors(blocked, pins), []);
const pe = Buffer.alloc(80); pe.write("MZ"); pe.writeUInt32LE(64, 60); pe.write("PE\0\0", 64); pe.writeUInt16LE(0x8664, 68);
assert.equal(peMachine(pe), 0x8664); assert.equal(peMachine(Buffer.from("ELF")), null); assert.equal(peMachine(Buffer.alloc(64)), null);
assert.deepEqual(verifyCorpus(), []);
const directory = path.join(root, "evaluation/lifecycle/windows"), ids = Object.keys(pins.candidates); let real = 0;
if (ids.some(id => existsSync(path.join(directory, id + ".json")))) for (const id of ids) {
  const r = JSON.parse(readFileSync(path.join(directory, id + ".json"))); assert.equal(r.candidate, id); assert.deepEqual(windowsErrors(r, pins), [], id);
  for (const s of r.collectorSources) assert.equal(digest(execFileSync("git", ["show", r.collectorRevision + ":" + s.path], { cwd: root })), s.sha256);
  for (const s of r.sourceManifest) assert.equal(digest(execFileSync("git", ["show", r.sourceRevision + ":" + s.path], { cwd: root })), s.sha256);
  assert.equal(digest(readFileSync(path.join(root, "evaluation/supply-chain", id, "inventory.json"))), r.supplyChain.inventorySha256); real++;
}
console.log("Windows lifecycle consistency: " + (mutations.length + 5) + " synthetic controls; " + real + " native records checked. Not lifecycle approval.");
