#!/usr/bin/env node

// Executes reviewed capability programs; this runner is not an OS sandbox.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { checkProbe } from "./runtime-toolchain-probe-lib.mjs";

const { values } = parseArgs({ options: {
  candidate: { type: "string" }, command: { type: "string" },
}, strict: true });
const command = JSON.parse(values.command);
assert.ok(Array.isArray(command) && command.length > 0 &&
  command.every(part => typeof part === "string" && part.length > 0), "JSON argv array required");
const root = fileURLToPath(new URL("../", import.meta.url));
const input = fileURLToPath(new URL("../evaluation/toolchains/probe-cases.json", import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const before = readFileSync(input);
const packet = JSON.parse(before);
const runs = Array.from({ length: 2 }, () => spawnSync(command[0], [...command.slice(1), input], {
  cwd: root, encoding: "utf8", shell: false, timeout: 30_000, maxBuffer: 2 * 1024 * 1024,
}));
for (const run of runs) {
  assert.ifError(run.error);
  assert.equal(run.status, 0, "probe execution failed");
  assert.equal(run.stderr, "", "unexpected probe stderr");
  checkProbe(packet, JSON.parse(run.stdout), values.candidate);
}
assert.equal(runs[0].stdout, runs[1].stdout, "nondeterministic stdout");
assert.deepEqual(readFileSync(input), before, "probe input changed");
process.stdout.write(JSON.stringify({
  formatVersion: "0.1-draft", scope: packet.scope,
  target: { os: process.platform, architecture: process.arch, mode: "native" },
  probeCasesSha256: digest(before), runs: 2, determinism: "passed", inputImmutable: "passed",
  stdoutSha256: digest(runs[0].stdout), output: JSON.parse(runs[0].stdout),
}, null, 2) + "\n");
