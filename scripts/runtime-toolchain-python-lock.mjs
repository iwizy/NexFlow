#!/usr/bin/env node

// Provisioning-only helper. Network retrieval is never part of validation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
assert.equal(report.version, "1");
const packages = report.install.map(entry => ({ name: entry.metadata.name, version: entry.metadata.version }));
assert.equal(new Set(packages.map(entry => entry.name.toLowerCase().replaceAll(/[-_.]+/gu, "-"))).size, packages.length);
packages.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
const lines = ["# Generated from one pinned CPython 3.12.14 resolver graph.",
  "# All published wheel hashes of each exact release; source distributions excluded.",
  "# Provision separately with --require-hashes --only-binary=:all:."];
for (const entry of packages) {
  assert.match(entry.name, /^[a-zA-Z0-9_.-]+$/u);
  assert.match(entry.version, /^[a-zA-Z0-9_.+-]+$/u);
  const response = await fetch(`https://pypi.org/pypi/${entry.name}/${entry.version}/json`);
  assert.equal(response.status, 200, entry.name);
  const metadata = await response.json();
  assert.equal(metadata.info.version, entry.version);
  const hashes = [...new Set(metadata.urls.filter(file => file.packagetype === "bdist_wheel" && !file.yanked)
    .map(file => file.digests.sha256))].sort();
  assert.ok(hashes.length > 0, entry.name);
  assert.ok(hashes.every(hash => /^[a-f0-9]{64}$/u.test(hash)));
  const continuation = String.fromCharCode(92);
  lines.push(entry.name + "==" + entry.version + " " + continuation,
    ...hashes.map((hash, index) => "    --hash=sha256:" + hash + (index < hashes.length - 1 ? " " + continuation : "")));
}
process.stdout.write(lines.join("\n") + "\n");
