#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const checkpointPath = "docs/0.2-validation-checkpoint.md";
const recordPath = "release/0.2-validation-checkpoint-checks.md";
const checkpoint = readFileSync(checkpointPath, "utf8");
const record = readFileSync(recordPath, "utf8");
const field = (text, name) => text.match(new RegExp(`^- ${name}: \x60([^\x60]+)\x60$`, "mu"))?.[1];
const source = field(checkpoint, "Assessed source commit");
assert.match(source ?? "", /^[a-f0-9]{40}$/u);
const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: "pipe" });
git("cat-file", "-e", `${source}^{commit}`);

// Inspect immutable source objects, never a moving main or authoring checkout.
const sourcePackage = JSON.parse(git("show", `${source}:package.json`));
const expectedChecks = Object.keys(sourcePackage.scripts)
  .filter((name) => !["cli-prototype", "runtime-evaluation-report"].includes(name)).sort();
const lockDigest = createHash("sha256").update(git("show", `${source}:package-lock.json`)).digest("hex");
const trees = Object.fromEntries(["Schemas", "Examples", "Fixtures", "Conformance"]
  .map((name) => [name, git("rev-parse", `${source}:${name.toLowerCase()}`).trim()]));
const released = git("rev-parse", "v0.2.0^{commit}").trim();
const claim = parse(git("show", `${source}:conformance/repository-validator-claim.yaml`));
const criterionIds = Array.from({ length: 8 }, (_, index) => `V${index + 1}`);

function validateConsistency(markdown, receipt) {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const date = field(markdown, "Checkpoint date");
  require(/^\d{4}-\d{2}-\d{2}$/u.test(date ?? "") &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().startsWith(date), "Valid date required.");
  require(field(receipt, "Checkpoint date") === date, "Record date mismatch.");
  require(field(markdown, "Assessed source commit") === source &&
    field(receipt, "Assessed source commit") === source, "Exact assessed source mismatch.");
  require(field(markdown, "Historical release commit") === released &&
    field(receipt, "Historical release commit") === released && released !== source, "Release/source must remain distinct.");
  require(markdown.includes("- Historical release: `v0.2.0` — published `2026-10-01`"), "Preserve actual publication history.");
  require(field(markdown, "Checkpoint state") === "source-checks-recorded", "Source-only checkpoint state required.");
  require(field(markdown, "New publication decision") === "not-granted", "No new publication approval.");
  require(field(markdown, "Manifest specVersion") === "0.1", "No manifest dialect promotion.");
  const criteria = new Map();
  for (const line of markdown.split("\n").filter((row) => /^\| V\d+ — /u.test(row))) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = cells[0]?.match(/^(V\d+) — /u)?.[1];
    const state = cells[1]?.match(/^`([^`]+)`$/u)?.[1];
    require(criterionIds.includes(id) && !criteria.has(id), "Unknown/duplicate criterion.");
    require(cells.length === 4 && Boolean(cells[2]) && Boolean(cells[3]), "Evidence and limitation required.");
    require(["covered", "partial", "not-tested"].includes(state), "Unknown or approving criterion state.");
    criteria.set(id, state);
  }
  require(criteria.size === 8 && criterionIds.every((id) => criteria.has(id)), "All eight criteria required.");
  require(criteria.get("V5") === "partial" && criteria.get("V7") === "partial", "Diagnostic/conformance gaps cannot become passes.");
  const checks = receipt.match(/```text\n([\s\S]*?)\n```/u)?.[1].split("\n");
  require(JSON.stringify(checks) === JSON.stringify(expectedChecks), "Recorded source check inventory mismatch.");
  require(receipt.includes(`**${expectedChecks.length} passed, 0 failed**`), "Recorded check total mismatch.");
  require(field(receipt, "Maintenance lockfile SHA-256") === lockDigest, "Lockfile digest mismatch.");
  for (const [name, tree] of Object.entries(trees)) {
    require(field(receipt, `${name} Git tree`) === tree, "Source tree mismatch.");
  }
  const started = field(receipt, "Local suite started");
  const completed = field(receipt, "Local suite completed");
  require(started?.startsWith(date) && completed?.startsWith(date) &&
    Number.isFinite(Date.parse(started)) && Date.parse(completed) >= Date.parse(started), "Dated actual run interval required.");
  require(markdown.includes(claim.subject.version), "Historical claim subject must stay pinned.");
  for (const term of ["not a release announcement", "not an operating-system sandbox", "not an independent security review"]) {
    require(markdown.includes(term), "Claim ceiling missing.");
  }
  require(receipt.includes("not freshly downloaded or checksum-verified") &&
    receipt.includes("no synthetic PR checkout") && receipt.includes("No fresh advisory scan"), "Evidence boundaries missing.");
  return errors;
}

assert.deepEqual(validateConsistency(checkpoint, record), []);
const lastRow = checkpoint.split("\n").find((line) => line.startsWith("| V8 — "));
const negatives = [
  [checkpoint.replace(source, "main"), record],
  [checkpoint.replace(lastRow + "\n", ""), record],
  [checkpoint + "\n" + lastRow, record],
  [checkpoint.replace("| `covered` |", "| `passed` |"), record],
  [checkpoint.replace(/(\| V5 — [^|]+\| )`partial`/u, "$1`covered`"), record],
  [checkpoint.replace(/(\| V7 — [^|]+\| )`partial`/u, "$1`covered`"), record],
  [checkpoint.replace("New publication decision: `not-granted`", "New publication decision: `approved`"), record],
  [checkpoint.replace("Manifest specVersion: `0.1`", "Manifest specVersion: `0.2`"), record],
  [checkpoint.replace(released, source), record],
  [checkpoint.replace("published `2026-10-01`", "unreleased"), record],
  [checkpoint.replace(lastRow, "| V8 — Compatibility | `covered` | Evidence | |"), record],
  [checkpoint, record.replace("a2a-extension-smoke\n", "")],
  [checkpoint, record.replace(`**${expectedChecks.length} passed, 0 failed**`, "**0 passed, 0 failed**")],
  [checkpoint, record.replace(lockDigest, "0".repeat(64))],
  [checkpoint, record.replace(trees.Schemas, "0".repeat(40))],
  [checkpoint, record.replace(source, released)]
];
for (const [markdown, receipt] of negatives) assert(validateConsistency(markdown, receipt).length > 0);

for (const hub of ["README.md", "docs/index.md", "docs/roadmap.md", "docs/release-plan.md", "docs/compatibility-matrix.md"]) {
  assert(readFileSync(hub, "utf8").includes("0.2-validation-checkpoint.md"), `Missing checkpoint link in ${hub}`);
}
assert(readFileSync("release/README.md", "utf8").includes("0.2-validation-checkpoint-checks.md"));
assert(readFileSync(".github/workflows/schema-smoke.yml", "utf8").includes("npm run validation-checkpoint-smoke"));
console.log(`Validation checkpoint consistency passed: eight criteria and ${negatives.length} rejection cases.`);
console.log("Source checks do not republish a release, refresh a conformance claim or approve runtime/CLI support.");
