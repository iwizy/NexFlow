#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { baseline, digest, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { controlsPass, effects, recordErrors, seatbeltProfile, supplementalIds } from "./lib/isolation-evidence.mjs";
const pins = JSON.parse(readFileSync("evaluation/fidelity/source-pins.json", "utf8"));
const ids = Object.keys(pins.candidates);
const expectedIds = [...baseline.cases.map(row => row.id), ...supplementalIds];
assert.equal(expectedIds.length, 21);
assert.deepEqual(verifyCorpus(), []);
const positive = Object.fromEntries(effects.map(key => [key, 0]));
const denied = Object.fromEntries(effects.map(key => [key, 1]));
assert(controlsPass(positive, denied));
for (const key of effects) assert(!controlsPass(positive, { ...denied, [key]: 0 }));
assert(!controlsPass(positive, { ...denied, read: 2 }), "Missing file is not denial proof");
assert(!controlsPass({ ...positive, write: 1 }, denied), "Unrestricted control must succeed");
assert(!controlsPass({}, denied));
const executable = path.resolve("CONTROL_EXECUTABLE"), canary = path.resolve("CONTROL_CANARY");
const profile = seatbeltProfile({ executable, canary, readable: [executable, canary] });
for (const rule of ["(deny network*)", "(deny process-fork)", "(deny process-exec)", "(deny file-read*)", "(deny file-write*)"]) assert(profile.includes(rule));
assert.throws(() => seatbeltProfile({ executable: "relative", canary, readable: [] }));
assert.throws(() => seatbeltProfile({ executable, canary, readable: ["/invalid\nprofile"] }));
assert.throws(() => seatbeltProfile({ executable, canary, readable: [path.parse(executable).root] }));
let negativeCount = 13;

if (ids.some(id => existsSync("evaluation/isolation/" + id + ".json"))) {
  const reports = ids.map(id => JSON.parse(readFileSync("evaluation/isolation/" + id + ".json", "utf8")));
  for (const report of reports) {
    assert.deepEqual(recordErrors(report, pins, expectedIds), [], report.candidate);
    for (const [key, file] of [["profileTemplateSha256", "scripts/lib/isolation-evidence.mjs"],
      ["canarySourceSha256", "evaluation/isolation/deny-canary.c"], ["runnerSourceSha256", "scripts/runtime-isolation-run.mjs"]]) {
      assert.equal(report.artifacts[key], digest(readFileSync(file)));
      const committed = execFileSync("git", ["show", report.harnessRevision + ":" + file]);
      assert.equal(digest(committed), report.artifacts[key], "Exact committed harness/source binding");
    }
  }
  assert.equal(new Set(reports.map(row => JSON.stringify(row.environment))).size, 1);
  assert.equal(new Set(reports.map(row => row.harnessRevision)).size, 1);
  assert.equal(new Set(reports.map(row => row.artifacts.canarySha256)).size, 1);
  const reference = reports[0];
  const invalid = [
    row => { row.prototypeRevision = "0".repeat(40); },
    row => { row.publishedHead = "0".repeat(40); },
    row => { row.harnessRevision = "branch-tip"; },
    row => { row.corpusSha256 = "0".repeat(64); },
    row => { row.controls.denied.connect = 0; },
    row => { row.controls.positive.read = 13; },
    row => { row.controls.beforeCandidate = false; },
    row => { row.results.pop(); },
    row => { row.results.push(row.results[0]); },
    row => { row.results[0].processRuns = 1; },
    row => { row.results[0].result = "failed"; row.results[0].errors = ["observed-failure"]; row.offlineOperation.status = "passed"; },
    row => { row.artifacts.executableSha256 = null; },
    row => { row.sourceAfter = "modified"; },
    row => { row.securityBoundary.status = "passed"; },
    row => { row.otherTargets[0].status = "passed"; },
    row => { row.targetContractMatch = true; },
    row => { row.outcome = "accepted"; },
    row => { row.selection = "winner"; },
    row => { row.limitations = []; },
    row => { row.limitations[0] = path.join(path.parse(executable).root, "Users", "synthetic", "private"); }
  ];
  for (const mutate of invalid) {
    const row = structuredClone(reference); mutate(row);
    assert(recordErrors(row, pins, expectedIds).length > 0);
  }
  negativeCount += invalid.length;
  console.log("Four source-bound isolation records verified; reported failures remain failures, not architecture approval.");
}
console.log(negativeCount + " isolation rejection/control cases passed; CI verifies records, not native OS isolation.");
