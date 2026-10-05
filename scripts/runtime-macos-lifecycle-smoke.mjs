#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { baseline, digest, repositoryRoot as root, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { macosStages, macosLifecycleErrors } from "./lib/macos-lifecycle-evidence.mjs";
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const sha = "a".repeat(64), revision = "b".repeat(40), files = [{ path: "fixture.txt", bytes: 1, sha256: sha }];
const environment = { platform: "darwin", architecture: "arm64", translated: false, nativeArm64: true };
const synthetic = { task: "NF-056-13", candidate: "typescript", sourceRevision: pins.candidates.typescript.sourceRevision,
  ...Object.fromEntries(["specificationRevision", "evaluationPackageRevision", "corpusSha256", "catalogSha256"].map(k => [k,pins[k]])),
  target: "macos/arm64", environment, environmentSha256: digest(JSON.stringify(environment)),
  cohort: { matched: false, status: "supplemental-drift", blockers: ["synthetic cohort mismatch"] },
  collectorRevision: revision, collectorSources: files, sourceManifest: files, sourceManifestSha256: digest(JSON.stringify(files)), lockfiles: files,
  prerequisitesSha256: sha, supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: sha, status: "partial", remediation: "none" },
  runtime: { version: "synthetic-only", executableSha256: sha }, toolchain: "synthetic-only",
  artifact: { files, sha256: sha, bytes: 100, manifestSha256: digest(JSON.stringify(files)),
    version: pins.candidates.typescript.sourceRevision + ".macos.arm64." + revision, format: "private source-layout evaluation capsule" },
  previousArtifact: null, distributionGate: "partial", outcome: "not-ready",
  stages: Object.fromEntries(macosStages.map(s => [s, { status: ["upgrade", "rollback", "signing", "notarization"].includes(s) ? "not-tested"
    : ["validateInspect", "offlineUse"].includes(s) ? "failed" : "passed", evidence: ["synthetic control only"] }])),
  isolation: { positive: Object.fromEntries(["read","write","connect","bind","fork","spawn","spawnSelf"].map(k=>[k,0])),
    denied: Object.fromEntries(["read","write","connect","bind","fork","spawn","spawnSelf"].map(k=>[k,1])),
    beforeCandidate: true, sourceSchemaRead: { positive: 0, denied: 1 }, profileSha256: sha, canarySha256: sha },
  installation: { status: "passed", archiveVerified: true, manifestVerified: true },
  uninstall: { status: "passed", prefixAbsent: true, archivePreserved: true, outsidePreserved: true, externalRuntimePreserved: true },
  execution: { cases: baseline.cases.map(c => ({ id: c.id, status: "failed", errors: ["synthetic observed failure"],
    attempts: [0,1].map(()=>({ exitCode: 1, output: null, stdoutSha256: sha, stderrSha256: sha })) })) },
  immutability: { sources: true, locks: true, corpus: true, installedPayload: true },
  nativeInspections: [{ sha256: sha, architectures: ["arm64"], codeSignature: { kind: "ad-hoc" } }], limitations: ["synthetic only"] };
assert.deepEqual(macosLifecycleErrors(synthetic, pins), []);
const mutations = [
  r => r.task = "NF-056-12", r => r.candidate = "javascript", r => r.sourceRevision = revision,
  r => r.specificationRevision = revision, r => r.corpusSha256 = sha, r => r.catalogSha256 = sha, r => r.evaluationPackageRevision = revision,
  r => r.target = "linux/amd64", r => r.environment.platform = "linux", r => r.environment.architecture = "x64",
  r => r.environment.translated = true, r => r.environment.nativeArm64 = false, r => r.environmentSha256 = sha,
  r => r.cohort.matched = true, r => r.cohort.status = "matched", r => r.cohort.blockers = [],
  r => r.collectorRevision = sha, r => r.collectorSources = [], r => r.sourceManifest = [], r => r.lockfiles = [],
  r => r.supplyChain.revision = revision, r => r.supplyChain.status = "passed", r => r.supplyChain.remediation = "automatic",
  r => r.prerequisitesSha256 = null, r => r.runtime.executableSha256 = null, r => r.artifact.files[0].path = "../escape",
  r => r.artifact.manifestSha256 = null, r => r.artifact.sha256 = null, r => r.artifact.version = "v0.4.0",
  r => r.previousArtifact = { sha256: sha }, r => r.stages.upgrade.status = "passed", r => r.stages.rollback.status = "passed",
  r => r.stages.signing.status = "passed", r => r.stages.notarization.status = "passed", r => r.outcome = "ready", r => r.distributionGate = "passed",
  r => r.isolation.denied.connect = 0, r => r.isolation.beforeCandidate = false, r => r.isolation.sourceSchemaRead.denied = 0,
  r => r.installation.archiveVerified = false, r => r.installation.manifestVerified = false, r => r.uninstall.outsidePreserved = false,
  r => r.uninstall.externalRuntimePreserved = false, r => r.execution.cases.pop(), r => r.execution.cases[0].attempts.pop(),
  r => { r.execution.cases[0].status = "passed"; r.execution.cases[0].errors = []; },
  r => r.stages.validateInspect.status = "passed", r => r.stages.offlineUse.status = "passed",
  r => r.immutability.installedPayload = false, r => r.nativeInspections[0].architectures = ["x86_64"],
  r => r.nativeInspections = [], r => r.limitations = ["/Users/example/private"]
];
for (const mutate of mutations) { const changed = structuredClone(synthetic); mutate(changed); assert.ok(macosLifecycleErrors(changed,pins).length); }
assert.deepEqual(verifyCorpus(), []);
const directory = path.join(root,"evaluation/lifecycle/macos");
let real = 0;
if (Object.keys(pins.candidates).some(id => existsSync(path.join(directory,id+".json")))) for (const id of Object.keys(pins.candidates)) {
  const report = JSON.parse(readFileSync(path.join(directory,id+".json"))); assert.deepEqual(macosLifecycleErrors(report,pins),[],id);
  for (const source of report.collectorSources) assert.equal(digest(execFileSync("git",["show",report.collectorRevision+":"+source.path],{cwd:root})),source.sha256);
  for (const source of report.sourceManifest) assert.equal(digest(execFileSync("git",["show",report.sourceRevision+":"+source.path],{cwd:root})),source.sha256);
  assert.equal(digest(readFileSync(path.join(root,"evaluation/supply-chain",id,"inventory.json"))),report.supplyChain.inventorySha256);
  assert.equal(digest(readFileSync(path.join(directory,"prerequisites.json"))),report.prerequisitesSha256);
  real++;
}
const prerequisites = JSON.parse(readFileSync(path.join(directory,"prerequisites.json")));
assert.deepEqual(prerequisites.prerequisites.map(p=>p.pullRequest),[90,95,96,97,99,100,104]);
assert.ok(prerequisites.prerequisites.every(p=>p.state === "MERGED" && p.checks.length && p.checks.every(c=>c.conclusion==="SUCCESS")));
assert.equal(prerequisites.previousArtifactQuery.eligibleMacOSCandidates,0);
assert.equal(prerequisites.previousArtifactQuery.artifacts.length,prerequisites.previousArtifactQuery.total);
assert.ok(prerequisites.previousArtifactQuery.artifacts.every(a=>a.name.startsWith("environment-") || a.name.startsWith("linux-evaluation-")));
const verificationFile = path.join(directory,"archive-verification.json");
if (real) {
  const verification = JSON.parse(readFileSync(verificationFile));
  assert.equal(verification.task,"NF-056-13");
  assert.deepEqual(verification.records.map(r=>r.candidate),Object.keys(pins.candidates));
  for (const v of verification.records) {
    const report = JSON.parse(readFileSync(path.join(directory,v.candidate+".json")));
    assert.equal(v.result,"passed"); assert.equal(v.archiveSha256,report.artifact.sha256);
    assert.equal(v.bytes,report.artifact.bytes); assert.equal(v.verifiedFiles,report.artifact.files.length);
  }
}
console.log("macOS lifecycle consistency: "+(mutations.length+1)+" synthetic controls passed; "+real+" stored native records checked. Not distribution approval.");
