#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  assertCliEffectBudget,
  CLI_EFFECT_BUDGETS,
  CLI_OPERATION_COMMANDS
} from "./lib/cli-boundary.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const denyHarness = pathToFileURL(path.join(root, "scripts", "test", "no-runtime-deny.mjs")).href;
const fixture = path.join(root, "fixtures", "discovery", "multi-workflow");
const failures = [];
let checkCount = 0;

const expectedImports = new Map([
  ["scripts/cli-prototype.mjs", ["./lib/cli-prototype.mjs"]],
  ["scripts/lib/cli-boundary.mjs", []],
  ["scripts/lib/cli-output.mjs", ["node:path"]],
  ["scripts/lib/cli-prototype.mjs", [
    "./cli-boundary.mjs", "./cli-output.mjs", "./manifest-discovery.mjs",
    "./manifest-graph.mjs", "./manifest-inspection.mjs", "./project-init.mjs",
    "./schema-validation.mjs", "node:util"
  ]],
  ["scripts/lib/manifest-discovery.mjs", ["node:fs", "node:fs/promises", "node:path", "yaml"]],
  ["scripts/lib/manifest-graph.mjs", []],
  ["scripts/lib/manifest-inspection.mjs", []],
  ["scripts/lib/project-init.mjs", ["node:fs/promises", "node:path", "yaml"]],
  ["scripts/lib/schema-validation.mjs", [
    "./manifest-discovery.mjs", "ajv-formats", "ajv/dist/2020.js", "node:fs/promises"
  ]]
]);

const prohibitedSourcePatterns = new Map([
  ["ambient environment access", /\bprocess\.env\b/gu],
  ["CommonJS loading", /\b(?:createRequire|require)\s*\(/gu],
  ["code evaluation", /\b(?:eval|Function)\s*\(/gu],
  ["global network client", /\b(?:fetch|WebSocket)\s*\(?/gu],
  ["native module loading", /\bprocess\.(?:binding|dlopen)\b/gu]
]);

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

function importSpecifiers(source) {
  const specifiers = [];
  for (const match of source.matchAll(/\bfrom\s+["']([^"']+)["']/gu)) specifiers.push(match[1]);
  for (const match of source.matchAll(/^\s*import\s*["']([^"']+)["']/gmu)) specifiers.push(match[1]);
  const dynamic = [...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu)];
  specifiers.push(...dynamic.map((match) => match[1]));
  return { dynamicCount: dynamic.length, specifiers: [...new Set(specifiers)].sort() };
}

function run(args, cwd = root, { writeRoot } = {}) {
  return spawnSync(process.execPath, ["--import", denyHarness, entrypoint, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    env: {
      HOME: cwd,
      PATH: process.env.PATH ?? "",
      NEXFLOW_TEST_CREDENTIAL: "private-test-credential-value",
      OPENAI_API_KEY: "private-test-provider-key",
      AWS_ACCESS_KEY_ID: "private-test-cloud-key",
      ...(writeRoot ? { NEXFLOW_TEST_WRITE_ROOT: writeRoot } : {})
    }
  });
}

function probe(source, cwd) {
  return spawnSync(process.execPath, ["--import", denyHarness, "--input-type=module", "--eval", source], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    env: { HOME: cwd, PATH: process.env.PATH ?? "" }
  });
}

async function snapshot(directory) {
  const records = [];
  async function visit(current, relative) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const entryRelative = path.posix.join(relative, entry.name);
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        records.push([entryRelative, "directory"]);
        await visit(entryPath, entryRelative);
      } else if (entry.isFile()) {
        records.push([entryRelative, "file", await readFile(entryPath, "utf8")]);
      } else {
        records.push([entryRelative, "other"]);
      }
    }
  }
  await visit(directory, "");
  return JSON.stringify(records);
}

const expectedCommands = ["discover", "validate", "inspect", "graph", "init"];
check("operation command inventory is exact", JSON.stringify(CLI_OPERATION_COMMANDS) === JSON.stringify(expectedCommands));
check("effect budgets cover informational and operation commands", JSON.stringify(Object.keys(CLI_EFFECT_BUDGETS).sort())
  === JSON.stringify(["discover", "graph", "help", "init", "inspect", "validate", "version"]));
for (const command of Object.keys(CLI_EFFECT_BUDGETS)) {
  const budget = assertCliEffectBudget(command);
  check(`${command} effect budget is immutable`, Object.isFrozen(budget));
  check(`${command} has every runtime effect disabled`, [
    "network", "processExecution", "credentialAccess", "providerCalls",
    "extensionLoading", "runtimePreflight", "workflowExecution", "backgroundWork"
  ].every((effect) => budget[effect] === false));
}
check("only init has a project write budget", Object.entries(CLI_EFFECT_BUDGETS)
  .every(([command, budget]) => budget.projectWrite === (command === "init" ? "fixed-starter-files" : "none")));
let unknownBudgetRejected = false;
try { assertCliEffectBudget("execute"); } catch { unknownBudgetRejected = true; }
check("unknown commands have no effect budget", unknownBudgetRejected);

for (const [relative, expected] of expectedImports) {
  const source = await readFile(path.join(root, relative), "utf8");
  const imports = importSpecifiers(source);
  const dynamicSyntaxCount = [...source.matchAll(/\bimport\s*\(/gu)].length;
  check(`${relative} uses only literal dynamic imports`, dynamicSyntaxCount === imports.dynamicCount);
  check(`${relative} module dependencies match the reviewed CLI graph`, JSON.stringify(imports.specifiers) === JSON.stringify([...expected].sort()));
  for (const [name, pattern] of prohibitedSourcePatterns) {
    check(`${relative} does not use ${name}`, !pattern.test(source));
    pattern.lastIndex = 0;
  }
  for (const specifier of imports.specifiers.filter((value) => value.startsWith("."))) {
    const dependency = path.relative(root, path.resolve(root, path.dirname(relative), specifier)).split(path.sep).join("/");
    check(`${relative} local dependency stays in the reviewed graph`, expectedImports.has(dependency));
  }
}

const parent = await mkdtemp(path.join(tmpdir(), "nexflow-cli-no-runtime-"));
try {
  const probes = [
    ["network", 'await fetch("https://example.invalid/")', "fetch"],
    ["subprocess", 'const { spawnSync } = await import("node:child_process"); spawnSync("never-run")', "spawnSync"],
    [
      "filesystem mutation",
      `const { writeFile } = await import("node:fs/promises"); await writeFile(${JSON.stringify(path.join(parent, "forbidden-write"))}, "never")`,
      "writeFile"
    ]
  ];
  for (const [name, source, effect] of probes) {
    const result = probe(source, parent);
    check(`${name} deny harness is active`, result.status !== 0
      && result.stderr.includes(`NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT:${effect}`));
  }

  for (const args of [["--help"], ["--version"]]) {
    const result = run(args, parent);
    check(`${args[0]} succeeds with runtime effects denied`, result.status === 0
      && !result.stderr.includes("NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT")
      && !result.stdout.includes("private-test-"));
  }

  const project = path.join(parent, "project");
  await cp(fixture, project, { recursive: true });
  const initialSnapshot = await snapshot(project);
  for (const command of ["discover", "validate", "inspect", "graph"]) {
    const result = run([command, "--root", project, "--format", "json"], parent);
    check(`${command} succeeds with runtime effects denied`, result.status === 0
      && !result.stderr.includes("NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT"));
    check(`${command} does not read ambient credential values into output`, !result.stdout.includes("private-test-"));
    check(`${command} does not mutate the selected project`, await snapshot(project) === initialSnapshot);
    let output;
    try { output = JSON.parse(result.stdout); } catch { /* Reported by the check below. */ }
    check(`${command} reports no execution authority`, output?.executionAuthorized === false);
  }

  const projectManifest = path.join(project, "project.yaml");
  await writeFile(projectManifest, `${await readFile(projectManifest, "utf8")}\ncommand: private-test-never-execute\nendpoint: https://example.invalid/private-test\n`);
  const inertSnapshot = await snapshot(project);
  const inert = run(["discover", "--root", project], parent);
  check("manifest-selected commands and remote locators remain inert", inert.status === 0
    && !inert.stdout.includes("private-test-") && !inert.stderr.includes("NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT")
    && await snapshot(project) === inertSnapshot);

  for (const command of [
    "run", "execute", "preflight", "start", "serve", "watch", "deploy",
    "provider", "mcp", "a2a", "install", "update", "login", "auth"
  ]) {
    const before = await snapshot(project);
    const result = run([command, "--root", project], parent);
    check(`${command} runtime-like command is rejected without effects`, result.status === 2
      && result.stdout === "" && result.stderr.startsWith("Invalid prototype usage.")
      && !result.stderr.includes("NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT")
      && await snapshot(project) === before);
  }

  const destination = path.join(parent, "initialized");
  await mkdir(destination);
  await writeFile(path.join(destination, "keep.txt"), "unchanged\n");
  const initialized = run(
    ["init", "--root", destination, "--id", "guarded-project", "--format", "json"],
    parent,
    { writeRoot: destination }
  );
  check("init succeeds while network and process effects are denied", initialized.status === 0
    && !initialized.stderr.includes("NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT"));
  check("init stays inside its fixed write budget", JSON.stringify((await readdir(destination)).sort())
    === JSON.stringify(["actors.yaml", "agents.yaml", "keep.txt", "project.yaml"]));
  check("init preserves unrelated files and ambient credentials", await readFile(path.join(destination, "keep.txt"), "utf8") === "unchanged\n"
    && !initialized.stdout.includes("private-test-"));
  let initOutput;
  try { initOutput = JSON.parse(initialized.stdout); } catch { /* Reported by the check below. */ }
  check("init reports review and no execution authority", initOutput?.executionAuthorized === false
    && initOutput?.result?.reviewRequired === true);
} finally {
  await rm(parent, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`CLI no-runtime guardrail checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI no-runtime guardrail checks passed for ${checkCount} cases.`);
  console.log("Verified fixed effect budgets, reviewed imports, denied runtime APIs, inert manifest content, and bounded writes.");
  console.log("This is repository prototype evidence, not an operating-system sandbox or runtime conformance claim.");
}
