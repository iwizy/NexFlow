#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "fixtures", "cli");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const registryPath = path.join(fixtureRoot, "index.json");
const outputSchema = JSON.parse(await readFile(new URL("./contracts/cli-output.schema.json", import.meta.url), "utf8"));
const validateOutput = new Ajv2020({ allErrors: true, strict: false }).compile(outputSchema);
const failures = [];
let checkCount = 0;

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

function sameValues(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function containedPath(parent, relative) {
  if (typeof relative !== "string" || relative.length === 0 || path.isAbsolute(relative)) return null;
  const normalized = relative.replaceAll("\\", "/");
  if (normalized.split("/").includes("..")) return null;
  const resolved = path.resolve(parent, relative);
  return resolved.startsWith(`${path.resolve(parent)}${path.sep}`) ? resolved : null;
}

async function snapshot(directory) {
  const entries = [];
  async function visit(current, relative = "") {
    for (const item of (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const childRelative = relative ? `${relative}/${item.name}` : item.name;
      const child = path.join(current, item.name);
      if (item.isDirectory()) {
        entries.push([childRelative, "directory"]);
        await visit(child, childRelative);
      } else if (item.isFile()) {
        const digest = createHash("sha256").update(await readFile(child)).digest("hex");
        entries.push([childRelative, `file:${digest}`]);
      } else {
        entries.push([childRelative, "other"]);
      }
    }
  }
  await visit(directory);
  return entries;
}

async function filesIn(directory) {
  const result = [];
  async function visit(current, relative = "") {
    for (const item of (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const childRelative = relative ? `${relative}/${item.name}` : item.name;
      if (item.isDirectory()) await visit(path.join(current, item.name), childRelative);
      else result.push(childRelative);
    }
  }
  await visit(directory);
  return result;
}

function run(command, fixture, args) {
  return spawnSync(process.execPath, [entrypoint, command, "--root", fixture, ...args, "--format", "json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NEXFLOW_FIXTURE_CANARY: "fixture-environment-value" }
  });
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
const caseFields = ["args", "command", "description", "expected", "id", "root"];
const expectedFields = [
  "createdFiles", "diagnosticCodes", "discovery", "documentCount", "exitCode", "graph", "inputMode",
  "inspection", "mutation", "preservedFiles", "reportedCommand", "schema"
];
const caseIds = new Set();

check("fixture registry has the supported draft format", registry.formatVersion === "0.1-draft");
check("fixture registry has a non-empty case list", Array.isArray(registry.cases) && registry.cases.length > 0);
for (const fixtureCase of registry.cases ?? []) {
  const expected = fixtureCase.expected ?? {};
  check(`${fixtureCase.id ?? "<missing-id>"}: case fields are closed`,
    sameValues(Object.keys(fixtureCase).sort(), caseFields));
  check(`${fixtureCase.id ?? "<missing-id>"}: expectation fields are closed`,
    Object.keys(expected).every((field) => expectedFields.includes(field)));
  check(`${fixtureCase.id ?? "<missing-id>"}: id is stable and unique`,
    typeof fixtureCase.id === "string" && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(fixtureCase.id)
      && !caseIds.has(fixtureCase.id));
  caseIds.add(fixtureCase.id);
  check(`${fixtureCase.id ?? "<missing-id>"}: description is public and useful`,
    typeof fixtureCase.description === "string" && fixtureCase.description.length >= 24);
  check(`${fixtureCase.id ?? "<missing-id>"}: command and arguments are explicit`,
    typeof fixtureCase.command === "string" && Array.isArray(fixtureCase.args)
      && fixtureCase.args.every((value) => typeof value === "string"));
  check(`${fixtureCase.id ?? "<missing-id>"}: root is contained by the fixture corpus`,
    containedPath(fixtureRoot, fixtureCase.root) !== null);
  check(`${fixtureCase.id ?? "<missing-id>"}: expected outcome is complete`,
    [0, 1, 2, 3, 4].includes(expected.exitCode)
      && [null, "discover", "validate", "inspect", "graph", "init"].includes(expected.reportedCommand)
      && [null, "directory-project", "project-source-hints", "explicit-file-list"].includes(expected.inputMode)
      && ["not-run", "passed", "failed", "unavailable"].includes(expected.discovery)
      && ["not-run", "passed", "failed", "unavailable"].includes(expected.schema)
      && Array.isArray(expected.diagnosticCodes)
      && expected.diagnosticCodes.every((code) => typeof code === "string")
      && ["none", "starter"].includes(expected.mutation));
}

const catalogedRoots = (registry.cases ?? [])
  .map((fixtureCase) => containedPath(fixtureRoot, fixtureCase.root))
  .filter(Boolean);
for (const file of await filesIn(fixtureRoot)) {
  if (file === "index.json") continue;
  const absolute = path.join(fixtureRoot, file);
  check(`${file}: fixture file belongs to a cataloged root`,
    catalogedRoots.some((cataloged) => absolute.startsWith(`${cataloged}${path.sep}`)));
}

const sourceBefore = await snapshot(fixtureRoot);
const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-cli-fixtures-"));
try {
  for (const fixtureCase of registry.cases ?? []) {
    const source = containedPath(fixtureRoot, fixtureCase.root);
    const destination = path.join(temporary, fixtureCase.id);
    try {
      check(`${fixtureCase.id}: fixture root exists and is a directory`, (await lstat(source)).isDirectory());
      await cp(source, destination, { recursive: true, errorOnExist: true });
    } catch {
      failures.push(`${fixtureCase.id}: fixture root can be copied`);
      continue;
    }

    const before = await snapshot(destination);
    const result = run(fixtureCase.command, destination, fixtureCase.args);
    let output;
    try {
      output = JSON.parse(result.stdout);
    } catch {
      // The checks below report a malformed envelope without exposing fixture content.
    }
    const expected = fixtureCase.expected;
    check(`${fixtureCase.id}: emits one contract-valid JSON envelope`, Boolean(output) && validateOutput(output));
    check(`${fixtureCase.id}: process and envelope exit status match`,
      result.status === expected.exitCode && output?.exitCode === expected.exitCode);
    check(`${fixtureCase.id}: keeps machine output on stdout only`, result.stderr === "");
    check(`${fixtureCase.id}: reports command and input mode`,
      output?.command === expected.reportedCommand && output?.inputMode === expected.inputMode);
    check(`${fixtureCase.id}: reports performed structural checks`,
      output?.checks.discovery === expected.discovery && output?.checks.schema === expected.schema
        && ["coreProfile", "semantic", "extensionProfiles"].every((key) => output?.checks[key] === "not-run"));
    check(`${fixtureCase.id}: never grants execution authority`, output?.executionAuthorized === false);
    check(`${fixtureCase.id}: emits the cataloged diagnostic codes`,
      sameValues(output?.diagnostics?.map(({ code }) => code), expected.diagnosticCodes));
    check(`${fixtureCase.id}: does not disclose fixture roots or environment values`,
      !result.stdout.includes(source) && !result.stdout.includes(destination)
        && !result.stdout.includes("fixture-environment-value"));

    if (expected.documentCount !== undefined) {
      check(`${fixtureCase.id}: reports the cataloged document count`,
        output?.result?.documentCount === expected.documentCount
          && output?.result?.documents?.length === expected.documentCount);
    }
    if (expected.inspection) {
      check(`${fixtureCase.id}: reports the cataloged inspection size`,
        output?.result?.inspection?.resources?.length === expected.inspection.resourceCount
          && output?.result?.inspection?.references?.length === expected.inspection.referenceCount);
    }
    if (expected.graph) {
      const graph = output?.result?.graph;
      const edges = Array.isArray(graph?.edges) ? graph.edges : [];
      const statuses = Object.fromEntries([...new Set(edges.map(({ status }) => status))]
        .sort().map((status) => [status, edges.filter((edge) => edge.status === status).length]));
      check(`${fixtureCase.id}: reports the cataloged static graph`,
        graph?.nodeCount === expected.graph.nodeCount && graph?.nodes?.length === expected.graph.nodeCount
          && graph?.edgeCount === expected.graph.edgeCount && edges.length === expected.graph.edgeCount
          && sameValues(statuses, expected.graph.statuses));
    }

    const after = await snapshot(destination);
    if (expected.mutation === "none") {
      check(`${fixtureCase.id}: leaves its copied input byte-for-byte unchanged`, sameValues(after, before));
    } else {
      const created = output?.result?.files
        ?.filter(({ status }) => status === "created").map(({ file }) => file).sort();
      check(`${fixtureCase.id}: creates exactly the cataloged starter files`,
        sameValues(created, expected.createdFiles)
          && sameValues(await filesIn(destination), [...expected.createdFiles, ...expected.preservedFiles].sort()));
      const validation = run("validate", destination, []);
      let validationOutput;
      try { validationOutput = JSON.parse(validation.stdout); } catch { /* Reported by the next check. */ }
      check(`${fixtureCase.id}: generated starter is structurally valid`,
        validation.status === 0 && validateOutput(validationOutput)
          && validationOutput?.checks.discovery === "passed" && validationOutput?.checks.schema === "passed");
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

check("source fixture corpus remains unchanged", sameValues(await snapshot(fixtureRoot), sourceBefore));

if (failures.length > 0) {
  console.error(`CLI fixture checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI fixture checks passed for ${registry.cases.length} cataloged cases and ${checkCount} assertions.`);
  console.log("Verified successful commands, bounded initialization, stable failures, JSON contracts, and input mutation boundaries.");
  console.log("This is repository prototype evidence, not reference CLI conformance or runtime behavior.");
}
