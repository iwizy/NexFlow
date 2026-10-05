#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { candidates, sha256, makeGapReports, assertGapReport } from "./lib/comparable-measurements.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = path => readFileSync(new URL("../" + path, import.meta.url));
const json = path => JSON.parse(read(path));
const show = (revision, path) => {
  assert.match(revision, /^[a-f0-9]{40}$/u);
  assert.match(path, /^evaluation\/(?:lifecycle\/(?:linux|macos|windows)|fidelity)\/(?:typescript|python|rust|go)\.json$/u);
  return execFileSync("git", ["show", revision + ":" + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
};

export function loadMeasurementInputs() {
  const receipt = json("evaluation/measurements/prerequisites.json");
  const pins = json("evaluation/fidelity/source-pins.json");
  const contract = json("evaluation/environment-contract.json");
  const catalog = json("evaluation/library-cases.json");
  const inventory = json("evaluation/library-inventory.json");
  const fidelity = {}, lifecycle = {};
  const hashes = { receipt: sha256(read("evaluation/measurements/prerequisites.json")), contract: sha256(read("evaluation/environment-contract.json")), catalog: sha256(read("evaluation/library-cases.json")), fidelity: {} };
  for (const candidate of candidates) {
    const path = "evaluation/fidelity/" + candidate + ".json";
    const bytes = show(receipt.pullRequests[1].head, path);
    assert.deepEqual(json(path), JSON.parse(bytes));
    hashes.fidelity[candidate] = sha256(bytes);
    fidelity[candidate] = JSON.parse(bytes);
  }
  for (const binding of receipt.lifecycleSources) {
    const bytes = show(binding.revision, binding.path);
    assert.equal(sha256(bytes), binding.sha256);
    const record = JSON.parse(bytes);
    lifecycle[record.target] ||= {};
    assert.equal(lifecycle[record.target][record.candidate], undefined);
    lifecycle[record.target][record.candidate] = record;
  }
  return { receipt, contract, pins, catalog, inventory, fidelity, lifecycle, hashes };
}

export function verifyStoredReports() {
  const inputs = loadMeasurementInputs();
  const expected = makeGapReports(inputs);
  for (const report of expected) assertGapReport(json("evaluation/measurements/" + report.candidate + ".json"), report);
  return { inputs, reports: expected };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] || "--verify";
  assert.ok(["--write", "--verify"].includes(mode));
  assert.equal(process.argv.length <= 3, true);
  const reports = makeGapReports(loadMeasurementInputs());
  for (const report of reports) {
    const path = new URL("../evaluation/measurements/" + report.candidate + ".json", import.meta.url);
    if (mode === "--write") writeFileSync(path, JSON.stringify(report, null, 2) + "\n");
    else assertGapReport(JSON.parse(readFileSync(path)), report);
  }
  console.log(JSON.stringify({ candidates: 4, targets: 3, metricRecords: 84, newTimingSamples: 0, comparableMetrics: 0, outcome: "not-ready" }));
}
