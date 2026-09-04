#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const outputSchema = JSON.parse(await readFile(new URL("./contracts/cli-output.schema.json", import.meta.url), "utf8"));
const validateOutput = new Ajv2020({ allErrors: true, strict: false }).compile(outputSchema);
const failures = [];
let checkCount = 0;

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

function run(args, cwd = root) {
  return spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, NEXFLOW_PROTOTYPE_CANARY: "private-test-environment-value" }
  });
}

function jsonRun(args, cwd = root) {
  const result = run([...args, "--format", "json"], cwd);
  let output;
  try { output = JSON.parse(result.stdout); } catch { /* The checks below report malformed output. */ }
  check("JSON init outcome matches the closed output schema", Boolean(output) && validateOutput(output)
    && output.exitCode === result.status && result.stderr === "");
  return { ...result, output };
}

const parent = await mkdtemp(path.join(tmpdir(), "nexflow-cli-init-"));
try {
  const destination = path.join(parent, "sample-project");
  await mkdir(destination);
  await writeFile(path.join(destination, "keep.txt"), "unchanged\n");

  const initialized = run(["init", "--root", destination, "--id", "sample-project", "--name", "Sample Project"]);
  check("init creates a starter in an explicit existing destination", initialized.status === 0 && initialized.stderr === ""
    && initialized.stdout.includes("3 created, 0 unchanged")
    && !initialized.stdout.includes(destination) && !initialized.stdout.includes("private-test-environment-value"));
  check("init reports every starter file", ["project.yaml", "actors.yaml", "agents.yaml"]
    .every((file) => initialized.stdout.includes(`created \"${file}\"`)));
  check("unrelated destination content is preserved", await readFile(path.join(destination, "keep.txt"), "utf8") === "unchanged\n");

  const contentsBefore = {};
  for (const file of ["project.yaml", "actors.yaml", "agents.yaml"]) {
    contentsBefore[file] = await readFile(path.join(destination, file), "utf8");
  }
  const project = parse(contentsBefore["project.yaml"]);
  const actors = parse(contentsBefore["actors.yaml"]);
  const agents = parse(contentsBefore["agents.yaml"]);
  check("starter is provider-neutral and human-led", project.project.defaultAutonomy === "suggest_only"
    && project.project.policies.requireReview === true && project.project.maintainers[0].id === "human-maintainer"
    && !contentsBefore["project.yaml"].match(/provider|credential|runtime/iu));
  check("starter uses ActorSet authority and compact AgentSet identity", actors.actors.some((actor) => actor.kind === "human")
    && actors.actors.some((actor) => actor.kind === "agent" && actor.agentRef.id === "developer-agent")
    && agents.agents.length === 1 && agents.agents[0].id === "developer-agent"
    && agents.agents[0].autonomyLevel === undefined);

  const validation = run(["validate", "--root", destination]);
  check("generated starter passes repository structural validation", validation.status === 0
    && validation.stdout.includes("Validated 3 manifest(s)") && validation.stderr === "");

  const unchanged = jsonRun(["init", "--root", destination, "--id", "sample-project", "--name", "Sample Project"]);
  check("repeat init is idempotent and reports skipped files", unchanged.status === 0
    && unchanged.output?.command === "init" && unchanged.output?.inputMode === null
    && unchanged.output?.checks.discovery === "not-run" && unchanged.output?.checks.schema === "not-run"
    && unchanged.output?.executionAuthorized === false && unchanged.output?.result.reviewRequired === true
    && unchanged.output?.result.files.every(({ status }) => status === "skipped"));
  const invalidFileSet = structuredClone(unchanged.output);
  invalidFileSet.result.files[2] = { file: "project.yaml", status: "created" };
  check("JSON schema requires one outcome for every starter file", !validateOutput(invalidFileSet));
  check("repeat init does not rewrite matching files", (await Promise.all(Object.keys(contentsBefore)
    .map(async (file) => [file, await readFile(path.join(destination, file), "utf8")])))
    .every(([file, contents]) => contents === contentsBefore[file]));

  await unlink(path.join(destination, "agents.yaml"));
  const resumed = jsonRun(["init", "--root", destination, "--id", "sample-project", "--name", "Sample Project"]);
  check("init can add a missing file beside exact template matches", resumed.status === 0
    && resumed.output?.result.files.filter(({ status }) => status === "created").map(({ file }) => file).join() === "agents.yaml"
    && resumed.output?.result.files.filter(({ status }) => status === "skipped").length === 2);

  const conflict = path.join(parent, "conflict");
  await mkdir(conflict);
  await writeFile(path.join(conflict, "project.yaml"), "private-test-conflicting-content\n");
  const rejected = jsonRun(["init", "--root", conflict, "--id", "conflict-project"]);
  check("a conflicting starter file prevents every write", rejected.status === 1 && rejected.output?.result === null
    && rejected.output?.diagnostics.length === 1
    && rejected.output?.diagnostics[0].code === "NEXFLOW-PROTOTYPE-INIT-CONFLICT"
    && rejected.output?.diagnostics[0].file === "project.yaml"
    && JSON.stringify((await readdir(conflict)).sort()) === JSON.stringify(["project.yaml"]));
  check("conflict output does not expose file content or machine path", !rejected.stdout.includes("private-test-")
    && !rejected.stdout.includes(conflict));

  const outside = path.join(parent, "outside.yaml");
  await writeFile(outside, "outside remains unchanged\n");
  const linkedTarget = path.join(parent, "linked-target");
  await mkdir(linkedTarget);
  await symlink(outside, path.join(linkedTarget, "project.yaml"));
  const linkedFile = run(["init", "--root", linkedTarget, "--id", "linked-target"]);
  check("a symlinked starter target is a non-writing conflict", linkedFile.status === 1
    && await readFile(outside, "utf8") === "outside remains unchanged\n"
    && JSON.stringify((await readdir(linkedTarget)).sort()) === JSON.stringify(["project.yaml"]));

  const actualDestination = path.join(parent, "actual-destination");
  const linkedDestination = path.join(parent, "linked-destination");
  await mkdir(actualDestination);
  await symlink(actualDestination, linkedDestination);
  const rejectedRoot = run(["init", "--root", linkedDestination, "--id", "linked-project"]);
  check("a symlinked destination is rejected", rejectedRoot.status === 1
    && rejectedRoot.stderr.includes("existing, non-symlinked local directory")
    && (await readdir(actualDestination)).length === 0);

  const missingRoot = run(["init", "--root", path.join(parent, "missing"), "--id", "missing-project"]);
  check("a missing destination is rejected without creating it", missingRoot.status === 1
    && !(await readdir(parent)).includes("missing"));

  for (const args of [
    ["init", "--root", destination],
    ["init", "--root", destination, "--id", "Invalid-ID"],
    ["init", "--root", destination, "--id", "valid-id", "--name", ""],
    ["init", "--root", destination, "--id", "valid-id", "--file", "project.yaml"],
    ["validate", "--root", destination, "--id", "valid-id"]
  ]) {
    const invalid = run(args);
    check(`invalid init usage is rejected: ${JSON.stringify(args)}`, invalid.status === 2
      && invalid.stdout === "" && invalid.stderr.startsWith("Invalid prototype usage."));
  }
} finally {
  await rm(parent, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`CLI init checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI init checks passed for ${checkCount} cases.`);
  console.log("Verified bounded starter creation, validation, idempotence, conflict handling, symlink rejection, and closed JSON output.");
  console.log("This is repository prototype evidence, not a reference CLI, runtime, or execution claim.");
}
