#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, readdirSync, lstatSync, mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { digest, safeRelative, repositoryRoot as root } from "./lib/runtime-evaluation.mjs";
import { peMachine, windowsErrors } from "./lib/windows-lifecycle-evidence.mjs";
assert.ok([4, 5].includes(process.argv.length));
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json"))), records = [];
const bundles = path.resolve(process.argv[2]), observations = [];
for (const directory of readdirSync(bundles).sort()) {
  const prefix = path.join(bundles, directory), record = JSON.parse(readFileSync(path.join(prefix, "lifecycle.json")));
  assert.deepEqual(windowsErrors(record, pins), []); records.push({ candidate: record.candidate, bytes: readFileSync(path.join(prefix, "lifecycle.json")) });
  const receipt = { candidate: record.candidate, collectorRevision: record.collectorRevision, recordSha256: digest(readFileSync(path.join(prefix, "lifecycle.json"))) };
  if (record.artifact === null) { assert.equal(record.stages.build.status, "failed"); observations.push({ ...receipt, archive: "not-built", reason: "Native record reports exact pinned toolchain/provisioning blocker; no artifact fabricated." }); continue; }
  assert.ok(safeRelative(record.artifact.filename)); const archive = path.join(prefix, "evaluation-capsules", record.artifact.filename); assert.ok(existsSync(archive));
  const bytes = readFileSync(archive); assert.equal(bytes.length, record.artifact.bytes); assert.equal(digest(bytes), record.artifact.sha256);
  const tar = process.platform === "win32" ? "tar.exe" : "tar";
  const entries = execFileSync(tar, ["-tzf", archive], { encoding: "utf8" }).trim().split(/\r?\n/u);
  for (const entry of entries) { const relative = entry.replace(/^\.\//u, "").replace(/\/$/u, ""); assert.ok(relative === "" || relative === "." || safeRelative(relative), "unsafe-archive-path"); }
  const extracted = mkdtempSync(path.join(os.tmpdir(), "nexflow-windows-archive-")), files = [], binaries = [];
  try {
    execFileSync(tar, ["-xzf", archive, "-C", extracted]);
    function visit(dir, prefix = "") { for (const name of readdirSync(dir).sort()) {
      const f = path.join(dir, name), rel = prefix ? prefix + "/" + name : name, stat = lstatSync(f);
      if (stat.isDirectory()) visit(f, rel); else { assert.ok(stat.isFile(), "nonregular-archive-payload"); const content = readFileSync(f);
        files.push({ path: rel, bytes: content.length, sha256: digest(content) });
        if (rel.endsWith(".exe")) { assert.equal(peMachine(content), 0x8664); binaries.push({ path: rel, machine: "AMD64", sha256: digest(content) }); }
      }
    } }
    visit(extracted); assert.deepEqual(files, record.artifact.files); assert.equal(digest(JSON.stringify(files)), record.artifact.manifestSha256);
    observations.push({ ...receipt, archive: "verified", sha256: digest(bytes), bytes: bytes.length, fileCount: files.length, manifestSha256: digest(JSON.stringify(files)), binaries });
  } finally { rmSync(extracted, { recursive: true }); }
}
assert.deepEqual(observations.map(r => r.candidate).sort(), ["go", "python", "rust", "typescript"]);
const output = { task: "NF-056-14", checkedAt: new Date().toISOString(), scope: "Independent archive byte/checksum/file-manifest and PE-header verification; not native execution or signing.",
  verifierSha256: digest(readFileSync(new URL(import.meta.url))), platform: process.platform, architecture: process.arch, observations };
writeFileSync(process.argv[3], JSON.stringify(output, null, 2) + "\n"); console.log(JSON.stringify({ verified: observations.filter(r => r.archive === "verified").length, blocked: observations.filter(r => r.archive === "not-built").length }));
if (process.argv[4]) {
  const destination = path.resolve(process.argv[4]), allowed = path.join(root, "evaluation/lifecycle/windows");
  assert.ok(destination === allowed || destination.startsWith(allowed + path.sep)); mkdirSync(destination, { recursive: true });
  for (const record of records) { const file = path.join(destination, record.candidate + ".json"); assert.ok(!existsSync(file), "refuse-overwrite-record"); writeFileSync(file, record.bytes); }
}
