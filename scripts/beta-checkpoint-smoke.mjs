#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const checkpointPath = "docs/0.5-beta-checkpoint.md";
const recordPath = "release/0.5-beta-checkpoint-checks.md";
const checkpoint = readFileSync(checkpointPath, "utf8");
const record = readFileSync(recordPath, "utf8");
const gateIds = Array.from({ length: 8 }, (_, index) => `B${index + 1}`);
const states = new Set(["ready", "partial", "blocked", "not-evaluated", "not-applicable"]);

function validatePreparation(markdown) {
  const errors = [];
  const source = markdown.match(/^- Assessed source commit: `([a-f0-9]{40})`$/mu)?.[1];
  if (!source) errors.push("Exact source commit is required.");
  if (!/^- Checkpoint date: `\d{4}-\d{2}-\d{2}`$/mu.test(markdown)) errors.push("Dated checkpoint is required.");
  if (!/^- Readiness outcome: `not-ready`$/mu.test(markdown)) errors.push("Preparation must not approve readiness.");
  if (!/^- Publication decision: `not-granted`$/mu.test(markdown)) errors.push("Preparation must not approve publication.");
  const gates = new Map();
  for (const line of markdown.split("\n").filter((row) => /^\| B\d+ — /u.test(row))) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = cells[0]?.match(/^(B\d+) — /u)?.[1];
    const state = cells[1]?.match(/^`([^`]+)`$/u)?.[1];
    if (!gateIds.includes(id) || gates.has(id)) errors.push("Unknown or duplicate gate.");
    if (cells.length !== 4 || !cells[2] || !cells[3]) errors.push("Evidence and next action are required.");
    if (!states.has(state)) errors.push("Unknown gate state.");
    if (state === "not-applicable" && !cells[2]?.includes("Reason:")) errors.push("Waiver reason is required.");
    gates.set(id, state);
  }
  if (gateIds.some((id) => !gates.has(id)) || gates.size !== 8) errors.push("All eight gates are required.");
  if (gates.size === 8 && [...gates.values()].every((state) => state === "ready" || state === "not-applicable")) {
    errors.push("Not-ready preparation must retain an unresolved mandatory gate.");
  }
  return { source, errors };
}

const result = validatePreparation(checkpoint);
assert.deepEqual(result.errors, []);
assert(record.includes(`- Assessed source commit: \`${result.source}\``));
execFileSync("git", ["cat-file", "-e", `${result.source}^{commit}`], { stdio: "pipe" });

// Check the frozen source's command inventory, not the later authoring checkout.
const sourcePackage = JSON.parse(execFileSync("git", ["show", `${result.source}:package.json`], { encoding: "utf8" }));
const expectedChecks = Object.keys(sourcePackage.scripts).filter((name) => !["cli-prototype", "runtime-evaluation-report"].includes(name));
const recordedChecks = record.match(/```text\n([\s\S]*?)\n```/u)?.[1].split("\n");
assert.deepEqual(recordedChecks, expectedChecks);
assert(record.includes(`**${expectedChecks.length} passed, 0 failed**`));
assert(checkpoint.includes("publication sequence"));
assert(checkpoint.includes("no candidate selected"));
assert(checkpoint.includes("not a proposed") || checkpoint.includes("**not** a proposed"));
assert(checkpoint.includes("It does not execute a release review"));
assert(record.includes("not an independent security review"));
assert(record.includes("no synthetic PR checkout"));
for (const hub of ["README.md", "docs/index.md", "docs/0.5-beta-readiness-checklist.md", "docs/release-plan.md"]) {
  assert(readFileSync(hub, "utf8").includes("0.5-beta-checkpoint.md"), `Missing checkpoint navigation in ${hub}`);
}
assert(readFileSync("release/README.md", "utf8").includes("0.5-beta-checkpoint-checks.md"));

const gateRow = checkpoint.split("\n").find((line) => line.startsWith("| B8 — "));
const negativeCases = [
  checkpoint.replace(result.source, "main"),
  checkpoint.replace(gateRow + "\n", ""),
  checkpoint + "\n" + gateRow,
  checkpoint.replace("| `partial` |", "| `passed` |"),
  checkpoint.replace("- Publication decision: `not-granted`", "- Publication decision: `approved`"),
  checkpoint.replace(/^(\| B\d+ — [^|]+\| )`[^`]+`/gmu, "$1`ready`"),
  checkpoint.replace("| `blocked` |", "| `not-applicable` |")
];
for (const invalid of negativeCases) assert(validatePreparation(invalid).errors.length > 0);

console.log(`Beta checkpoint consistency passed: eight gates and ${negativeCases.length} rejection cases.`);
console.log("Source rehearsal and document consistency do not approve beta publication; outcome remains not-ready.");
