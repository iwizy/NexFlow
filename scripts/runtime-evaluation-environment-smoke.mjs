#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkEnvironment } from "./lib/evaluation-environment.mjs";
const contract = JSON.parse(readFileSync("evaluation/environment-contract.json", "utf8"));
assert.deepEqual(contract.targets.map(target => target.id), ["linux/amd64", "macos/arm64", "windows/amd64"]);
assert.equal(contract.scope, "validation-only");
for (const metric of ["coldStartMs", "validationMs", "peakMemoryBytes", "artifactBytes", "cleanBuildMs", "cachedBuildMs", "ciMs"]) {
  assert.ok(contract.measurements[metric].runs > 0);
}
for (const target of contract.targets) {
  const record = target.snapshot ?? { target: target.id, platform: target.platform, architecture: target.architecture,
    runnerLabel: target.runnerLabel, imageOS: "synthetic", imageVersion: "synthetic", osVersion: target.platform === "linux" ? "24.04" : "15.0",
    osBuild: "synthetic", osCaption: target.osFamily, cpuModel: "synthetic", cpuCount: 1, memoryBytes: 1, translated: false };
  assert.deepEqual(checkEnvironment(contract, record, false), []);
  const frozen = structuredClone(contract);
  frozen.targets.find(entry => entry.id === target.id).snapshot = record;
  assert.deepEqual(checkEnvironment(frozen, record), []);
  assert.ok(checkEnvironment(frozen, { ...record, architecture: "other" }).includes("wrong-native-target"));
  assert.ok(checkEnvironment(frozen, { ...record, imageVersion: "other" }).includes("environment-drift:imageVersion"));
  assert.deepEqual(checkEnvironment(frozen, { ...record, imageVersion: "other" }, false), []);
  assert.ok(checkEnvironment(frozen, { ...record, architecture: "other" }, false).includes("wrong-native-target"));
  assert.ok(checkEnvironment(frozen, { ...record, osBuild: "other" }).includes("environment-drift:osBuild"));
  assert.ok(checkEnvironment(frozen, { ...record, cpuCount: record.cpuCount + 1 }).includes("environment-drift:cpuCount"));
  assert.ok(checkEnvironment(frozen, { ...record, imageVersion: "" }).includes("incomplete-environment"));
  const untested = structuredClone(contract);
  untested.targets.find(entry => entry.id === target.id).snapshot = null;
  assert.ok(checkEnvironment(untested, record).includes("unfrozen-environment"));
}
console.log("Environment contract checks passed: exact targets, fingerprint drift and untested rejection.");
