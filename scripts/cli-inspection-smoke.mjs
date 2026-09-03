#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";

import { runCliPrototype } from "./lib/cli-prototype.mjs";
import { discoverFromDirectory, SUPPORTED_MANIFEST_KINDS } from "./lib/manifest-discovery.mjs";
import { inspectManifestAssembly, INSPECTION_MANIFEST_KINDS, MAX_INSPECTION_RESOURCES, MAX_INSPECTION_REFERENCES } from "./lib/manifest-inspection.mjs";
import { loadRepositorySchemaRegistry, validateManifestAssembly } from "./lib/schema-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const minimalRoot = path.join(root, "examples", "minimal-team");
const fixture = path.join(root, "fixtures", "discovery", "multi-workflow");
const schema = JSON.parse(await readFile(new URL("./contracts/cli-output.schema.json", import.meta.url), "utf8"));
const validateOutput = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const registry = await loadRepositorySchemaRegistry();
const failures = [];
let checkCount = 0;
const check = (name, condition) => { checkCount += 1; if (!condition) failures.push(name); };

async function capture(args, overrides = {}) {
  let stdout = "";
  let stderr = "";
  const code = await runCliPrototype(args, {
    stdout: { write: (text) => { stdout += text; } }, stderr: { write: (text) => { stderr += text; } },
    validate: (assembly) => validateManifestAssembly(assembly, registry), ...overrides
  });
  return { code, stdout, stderr };
}

function run(args, cwd = root) {
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd, encoding: "utf8", timeout: 10000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NEXFLOW_INSPECT_CANARY: "private-test-environment" }
  });
  return { ...result, code: result.status };
}

function envelope(name, result) {
  let output;
  try { output = JSON.parse(result.stdout); } catch { /* Report invalid JSON below. */ }
  check(`${name}: schema-valid envelope and matching exit code`, Boolean(output) && validateOutput(output)
    && result.code === output.exitCode && result.stderr === "");
  check(`${name}: no semantic or runtime claim`, output?.executionAuthorized === false
    && ["coreProfile", "semantic", "extensionProfiles"].every((key) => output?.checks[key] === "not-run"));
  return output;
}

check("all supported manifest kinds have an inspection path", JSON.stringify([...INSPECTION_MANIFEST_KINDS].sort())
  === JSON.stringify([...SUPPORTED_MANIFEST_KINDS].sort()));
check("inspection limits match the output schema", schema.$defs.inspection.properties.resources.maxItems === MAX_INSPECTION_RESOURCES
  && schema.$defs.inspection.properties.references.maxItems === MAX_INSPECTION_REFERENCES);

for (const [args, expected] of [
  [["inspect"], 2], [["inspect", "--help"], 0], [["inspect", "--root", ""], 2],
  [["inspect", "--root", fixture, "--file", "project.yaml", "--project", "project.yaml"], 2],
  [["inspect", "--root", fixture, "--root", fixture], 2],
  [["inspect", "--root", fixture, "--agent", "private-test-agent"], 2],
  [["inspect", "--root", fixture, "extra"], 2], [["graph"], 2], [["init"], 3]
]) {
  let calls = 0;
  const forbidden = async () => { calls += 1; throw new Error("private-test-must-not-run"); };
  const output = envelope("no-read dispatch", await capture([...args, "--format=json"], {
    discover: forbidden, validate: forbidden, inspect: forbidden
  }));
  check("help and invalid usage perform no loading or inspection", calls === 0 && output?.exitCode === expected);
}

let exampleCount = 0;
const coveredKinds = new Set();
for (const entry of (await readdir(path.join(root, "examples"), { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
  const exampleRoot = path.join(root, "examples", entry.name);
  const discovered = await discoverFromDirectory({ root: exampleRoot });
  check(`${entry.name}: inspection precondition is schema-validated input`, discovered.valid
    && validateManifestAssembly(discovered.assembly, registry).valid);
  const before = JSON.stringify(discovered.assembly);
  const result = inspectManifestAssembly(discovered.assembly);
  const output = envelope(entry.name, run(["inspect", "--root", exampleRoot, "--format=json"]));
  check(`${entry.name}: pure projection and schema-gated command agree`, result.valid && output?.exitCode === 0
    && output?.checks.discovery === "passed" && output?.checks.schema === "passed"
    && JSON.stringify(result.inspection) === JSON.stringify(output?.result.inspection)
    && JSON.stringify(discovered.assembly) === before);
  const inspection = output?.result.inspection;
  check(`${entry.name}: summary counts actual declarations and documents`, inspection.summary.reduce((sum, row) => sum + row.resourceCount, 0) === inspection.resources.length
    && inspection.summary.reduce((sum, row) => sum + row.documentCount, 0) === output.result.documentCount
    && inspection.referencesResolved === false && inspection.referenceCoverage === "selected-fields");
  for (const row of inspection.summary) coveredKinds.add(row.kind);
  exampleCount += 1;
}
check("all eight projects and 17 manifest kinds inspected", exampleCount === 8 && coveredKinds.size === 17);

const args = ["inspect", "--root", minimalRoot, "--format=json"];
const minimalResult = run(args);
const minimal = envelope("Minimal Team", minimalResult);
check("minimal inspection contains only adopted modules and explicit bridge", minimal?.result.documentCount === 3
  && minimal?.result.inspection.resources.length === 4 && minimal?.result.inspection.references.length === 2
  && minimal?.result.inspection.references.some((entry) => entry.path === "/actors/1/agentRef/id" && entry.id === "docs-agent")
  && !minimal?.result.inspection.summary.some((entry) => entry.kind === "ProviderSet"));
check("deterministic output independent of cwd, with no absolute root or environment", minimalResult.stdout === run(args, tmpdir()).stdout
  && !minimalResult.stdout.includes(minimalRoot) && !minimalResult.stdout.includes("private-test-environment"));
const text = run(["inspect", "--root", minimalRoot]);
check("human-readable inspect states the actual boundary", text.code === 0 && text.stderr === ""
  && text.stdout.includes("Inspected 3 manifest(s)") && text.stdout.includes('actor "human-maintainer"')
  && text.stdout.includes("Selected references (not resolved)") && text.stdout.includes("no execution is authorized"));
check("explicit text mode preserves default", text.stdout === run(["inspect", "--root", minimalRoot, "--format=text"]).stdout);
const inspectionGuide = await readFile(path.join(root, "docs", "cli-inspection.md"), "utf8");
check("documented minimal inspection matches actual output", inspectionGuide.match(/```text\n([\s\S]*?)```/u)?.[1] === text.stdout);

const directoryArgs = ["inspect", "--root", fixture, "--format=json"];
const directory = envelope("multiple workflows", run(directoryArgs));
const hints = envelope("Project hints", run([...directoryArgs, "--project", "project.yaml"]));
check("Project modes produce the same inspection", JSON.stringify(directory?.result) === JSON.stringify(hints?.result));
const forward = run([...directoryArgs, "--file", "project.yaml", "--file", "people/team.yml"]);
const reverse = run([...directoryArgs, "--file", "people/team.yml", "--file", "project.yaml"]);
const explicit = envelope("explicit list", forward);
check("explicit files ignore hints and preserve deterministic order", forward.stdout === reverse.stdout
  && explicit?.result.documentCount === 2 && !explicit?.result.inspection.resources.some((entry) => entry.kind === "workflow"));
const steps = directory?.result.inspection.resources.filter((entry) => entry.kind === "workflow-step");
check("multi-workflow step identities keep workflow scope", new Set(steps.map((step) => step.scope.id)).size === 2);

for (const command of ["discover", "validate"]) {
  let calls = 0;
  const output = envelope(`unchanged ${command}`, await capture([command, "--root", minimalRoot, "--format=json"], {
    inspect: async () => { calls += 1; throw new Error("must not inspect"); }
  }));
  check("existing commands do not gain inspection or expose IDs", output?.exitCode === 0 && calls === 0
    && !Object.hasOwn(output.result, "inspection") && !JSON.stringify(output.result).includes("docs-agent"));
}

const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-cli-inspection-"));
const project = () => ({
  specVersion: "0.1", kind: "Project", metadata: { project: "inspection-fixture" },
  project: { id: "inspection-fixture", displayName: "Inspection Fixture", description: "Inspection check." }
});
const manifest = (kind, fields) => ({ specVersion: "0.1", kind, metadata: { project: "inspection-fixture" }, ...fields });
const write = (name, value) => writeFile(path.join(temporary, name), JSON.stringify(value));
const selected = ["inspect", "--root", temporary, "--file", "project.yaml", "--format=json"];
try {
  await write("project.yaml", project());
  for (const [name, contents, code] of [
    ["schema failure", { ...project(), project: { id: "inspection-fixture", displayName: "Incomplete" } }, 1],
    ["unsupported version", { ...project(), specVersion: "private-test-version" }, 3],
    ["unsupported kind", { ...project(), kind: "private-test-kind" }, 3],
    ["parser failure", "kind: [private-test-parser\n", 1]
  ]) {
    if (typeof contents === "string") await writeFile(path.join(temporary, "project.yaml"), contents);
    else await write("project.yaml", contents);
    let calls = 0;
    const result = await capture(selected, { inspect: () => { calls += 1; throw new Error("must not inspect"); } });
    const output = envelope(name, result);
    check(`${name}: no partial inventory or input leakage`, output?.exitCode === code && output?.result === null
      && calls === 0 && !result.stdout.includes("private-test-"));
  }
  await write("project.yaml", project());
  for (const stage of ["discover", "validate", "inspect"]) {
    const output = envelope(`${stage} internal failure`, await capture(selected, {
      [stage]: () => { throw new Error("private-test-internal"); }
    }));
    check("internal failures remain exit 4 without partial output", output?.exitCode === 4 && output?.result === null
      && !JSON.stringify(output).includes("private-test-internal"));
  }

  const task = { id: "draft", title: "Draft", status: "ready", owner: "missing-person", acceptanceCriteria: [], dependsOn: ["missing-task"] };
  await write("tasks.yaml", manifest("TaskSet", { tasks: [task, task] }));
  const unresolved = envelope("unresolved references and duplicate declarations", await capture([...selected, "--file", "tasks.yaml"]));
  check("inspection never deduplicates declarations or claims resolution", unresolved?.exitCode === 0
    && unresolved?.result.inspection.resources.filter((entry) => entry.kind === "task" && entry.id === "draft").length === 2
    && unresolved?.result.inspection.references.some((entry) => entry.id === "missing-task")
    && unresolved?.result.inspection.referencesResolved === false);

  const workflow = (id) => manifest("Workflow", { workflow: { id, displayName: "Workflow", stages: [{
    id: "stage", displayName: "Stage", steps: [{ id: "shared-step", task: "draft", dependsOn: ["shared-step"] }]
  }], dependencies: [{ from: "shared-step", to: "shared-step" }] } });
  await write("one.yaml", workflow("one"));
  await write("two.yaml", workflow("two"));
  const scoped = envelope("overlapping step IDs", await capture([...selected, "--file", "one.yaml", "--file", "two.yaml"]));
  const scopedResources = scoped?.result.inspection.resources.filter((entry) => entry.kind === "workflow-step");
  const scopedReferences = scoped?.result.inspection.references.filter((entry) => entry.kind === "workflow-step");
  check("overlapping workflow step IDs do not collapse", scopedResources.length === 2 && new Set(scopedResources.map((entry) => entry.scope.id)).size === 2
    && scopedReferences.length === 6 && new Set(scopedReferences.map((entry) => entry.scope.id)).size === 2);

  await write("tasks.yaml", manifest("TaskSet", { tasks: [{ ...task, artifacts: [{ id: "patch", type: "private-test-artifact-type", uri: "private-test-uri" }] }] }));
  await write("handoffs.yaml", manifest("HandoffSet", { handoffs: [{
    id: "review", from: ["author"], to: ["reviewer"], reason: "private-test-reason", status: "pending", nextAction: "Review", artifacts: ["patch"]
  }] }));
  const artifactResult = await capture([...selected, "--file", "tasks.yaml", "--file", "handoffs.yaml"]);
  const artifacts = envelope("artifact namespace", artifactResult);
  check("artifacts keep assembly scope without URI or content", artifacts?.result.inspection.resources.some((entry) => entry.kind === "artifact" && entry.scope === null)
    && artifacts?.result.inspection.references.some((entry) => entry.kind === "artifact" && entry.id === "patch" && entry.scope === null)
    && !artifactResult.stdout.includes("private-test-"));

  const atLimit = Array.from({ length: MAX_INSPECTION_RESOURCES - 1 }, (_, i) => ({ id: `cap-${i}`, description: "Cap", risk: "low" }));
  await write("caps.yaml", manifest("CapabilitySet", { capabilities: atLimit }));
  const boundedArgs = [...selected, "--file", "caps.yaml"];
  check("resource budget exact boundary passes", envelope("resource limit boundary", await capture(boundedArgs))?.exitCode === 0);
  atLimit.push({ id: "cap-over", description: "Cap", risk: "low" });
  await write("caps.yaml", manifest("CapabilitySet", { capabilities: atLimit }));
  const overflow = envelope("resource limit exceeded", await capture(boundedArgs));
  check("resource overflow is explicit failure with no partial inspection", overflow?.exitCode === 1 && overflow?.result === null
    && overflow?.diagnostics[0].code === "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT");
  const consumers = Array.from({ length: MAX_INSPECTION_REFERENCES }, (_, i) => `person-${i}`);
  await write("permissions.yaml", manifest("PermissionSet", { permissions: [{
    id: "read", description: "Read", subjects: consumers, capabilities: [], effect: "deny"
  }] }));
  const referenceArgs = [...selected, "--file", "permissions.yaml"];
  check("reference budget exact boundary passes", envelope("reference limit boundary", await capture(referenceArgs))?.exitCode === 0);
  consumers.push("person-over");
  await write("permissions.yaml", manifest("PermissionSet", { permissions: [{
    id: "read", description: "Read", subjects: consumers, capabilities: [], effect: "deny"
  }] }));
  check("reference overflow fails without partial output", envelope("reference limit exceeded", await capture(referenceArgs))?.result === null);
  const overflowText = await capture(referenceArgs.filter((arg) => arg !== "--format=json"));
  check("text limit error does not print success inventory", overflowText.code === 1 && overflowText.stdout === ""
    && overflowText.stderr.includes("No partial inspection"));

  const events = manifest("EventSet", { events: [{ type: `event.${"a".repeat(140)}`, description: "Event", payload: {} }] });
  await write("events.yaml", events);
  const eventOutput = envelope("overlong event identity", await capture([...selected, "--file", "events.yaml"]));
  check("overlong inspection identifier is redacted without losing location", eventOutput?.result.inspection.resources.some((entry) => entry.kind === "event"
    && entry.id === "<redacted-id>" && entry.path === "/events/0"));

  const controlName = "source-\u001b\u202e.yaml";
  await write(controlName, manifest("CapabilitySet", { capabilities: [] }));
  const controlArgs = [...selected, "--file", controlName];
  for (const output of [await capture(controlArgs), await capture(controlArgs.filter((arg) => arg !== "--format=json"))]) {
    check("inspection locators are escaped for terminals", output.code === 0 && !/[\u001b\u202e]/u.test(output.stdout));
  }
  for (const locator of ["../private-test-escape.yaml", "/private-test-absolute.yaml", "https://example.invalid/private-test-remote.yaml"]) {
    const output = await capture([...selected, "--file", locator]);
    check("unsafe source rejection is unchanged", envelope("unsafe inspect source", output)?.result === null
      && !output.stdout.includes("private-test-"));
  }

  const software = path.join(temporary, "software");
  await cp(path.join(root, "examples", "software-team"), software, { recursive: true });
  const mutations = {
    "project.yaml": (m) => { m.project.displayName = "private-test-name"; m.project.description = "private-test-description"; m.project.maintainers[0].contact = "private-test-contact"; },
    "prompt-sets.yaml": (m) => { m.promptSets[0].prompts[0].inline = "private-test-prompt"; m.promptSets[0].prompts[0].sourceRef = "private-test-prompt-source"; },
    "context.yaml": (m) => { m.contextSources[0].uri = "private-test-context-uri"; },
    "providers.yaml": (m) => { m.providers[0].credentials = "private-test-token"; m.providers[0].description = "private-test-provider"; }
  };
  const snapshots = new Map();
  for (const [name, mutate] of Object.entries(mutations)) {
    const target = path.join(software, name);
    const manifest = parse(await readFile(target, "utf8"));
    mutate(manifest);
    manifest.notes = { agentRef: "private-test-hidden-reference" };
    manifest.command = "private-test-never-run";
    const contents = JSON.stringify(manifest);
    await writeFile(target, contents);
    snapshots.set(target, contents);
  }
  const namesBefore = JSON.stringify((await readdir(software)).sort());
  for (const format of ["text", "json"]) {
    const result = run(["inspect", "--root", software, "--format", format]);
    check(`${format}: free text, metadata, prompts, URIs, and credentials are omitted`, result.code === 0
      && !result.stdout.includes("private-test-") && !result.stdout.includes(software));
  }
  let unchanged = true;
  for (const [file, contents] of snapshots) unchanged &&= await readFile(file, "utf8") === contents;
  check("inspection does not rewrite sources or create files", unchanged && namesBefore === JSON.stringify((await readdir(software)).sort()));
} finally {
  await rm(temporary, { recursive: true, force: true });
}

for (const [name, mutate] of [
  ["old output version", (value) => { value.formatVersion = "0.1-draft"; }],
  ["missing inspection", (value) => { delete value.result.inspection; }],
  ["claimed resolution", (value) => { value.result.inspection.referencesResolved = true; }],
  ["unvalidated inspection", (value) => { value.checks.schema = "not-run"; }],
  ["raw manifest field", (value) => { value.result.inspection.resources[0].raw = {}; }],
  ["inspection in validate output", (value) => { value.command = "validate"; }]
]) {
  const value = structuredClone(minimal);
  mutate(value);
  check(`output schema rejects ${name}`, !validateOutput(value));
}

if (failures.length > 0) {
  console.error(`CLI inspection checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI inspection checks passed for ${checkCount} cases.`);
  console.log("Verified schema-gated inspection, source locations, scoped references, bounded output, redaction, and no mutation.");
  console.log("Declared resources and selected references only; no effective configuration, Agent Assembly, or runtime resolution.");
}
