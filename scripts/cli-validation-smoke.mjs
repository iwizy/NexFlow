#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import { runCliPrototype } from "./lib/cli-prototype.mjs";
import { discoverFromDirectory, SUPPORTED_MANIFEST_KINDS } from "./lib/manifest-discovery.mjs";
import {
  compileSchemaRegistry, loadRepositorySchemaRegistry, MAX_SCHEMA_DIAGNOSTICS, validateManifestAssembly
} from "./lib/schema-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const fixture = path.join(root, "fixtures", "discovery", "multi-workflow");
const failures = [];
let checkCount = 0;

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

function rejects(action) {
  try { action(); return false; } catch { return true; }
}

async function capture(args, overrides = {}) {
  let stdout = "";
  let stderr = "";
  const code = await runCliPrototype(args, {
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    ...overrides
  });
  return { code, stdout, stderr };
}

function run(args, cwd = root) {
  return spawnSync(process.execPath, [entrypoint, ...args], {
    cwd, encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024
  });
}

function project() {
  return {
    specVersion: "0.1", kind: "Project", metadata: { project: "validation-fixture" },
    project: { id: "validation-fixture", displayName: "Validation Fixture", description: "Structural validation check." }
  };
}

function manifest(kind, fields) {
  return { specVersion: "0.1", kind, metadata: { project: "validation-fixture" }, ...fields };
}

const registry = await loadRepositorySchemaRegistry();
check("every supported kind has a compiled local schema", registry.byKind.size === SUPPORTED_MANIFEST_KINDS.length
  && SUPPORTED_MANIFEST_KINDS.every((kind) => registry.byKind.has(kind)));
const schemas = [];
for (const name of (await readdir(path.join(root, "schemas"))).filter((name) => name.endsWith(".schema.json")).sort()) {
  schemas.push(JSON.parse(await readFile(path.join(root, "schemas", name), "utf8")));
}
check("missing manifest schema fails closed", rejects(() => compileSchemaRegistry(schemas.filter((s) => s.properties?.kind?.const !== "Project"))));
check("unresolved common references fail closed", rejects(() => compileSchemaRegistry(schemas.filter((s) => !s.$id.endsWith("/common.schema.json")))));
check("duplicate schema identity fails closed", rejects(() => compileSchemaRegistry([...schemas, schemas[0]])));
check("duplicate kind fails closed", rejects(() => compileSchemaRegistry([...schemas, { ...schemas[0], $id: "https://example.invalid/duplicate.schema.json" }])));
check("missing schema identity fails closed", rejects(() => compileSchemaRegistry([...schemas, {}])));
check("empty schema registry fails closed", rejects(() => compileSchemaRegistry([])));
const broken = { $id: "https://example.invalid/broken.schema.json", $ref: "https://example.invalid/not-fetched.schema.json" };
check("unused broken schema is also compiled and rejected", rejects(() => compileSchemaRegistry([...schemas, broken])));
check("empty assembly cannot report success", rejects(() => validateManifestAssembly({ specVersion: "0.1", loadedDocuments: [] }, registry)));

const noValidationCases = [
  [[], 0], [["--help"], 0], [["validate", "--help"], 0], [["--version"], 0],
  [["validate"], 2], [["validate", "extra", "--root", fixture], 2],
  [["validate", "--root", fixture, "--project", "project.yaml", "--file", "project.yaml"], 2],
  [["validate", "--root", fixture, "--root", fixture], 2],
  [["validate", "--root", fixture, "--format", "yaml"], 2],
  [["validate", "--root", fixture, "--schema", "untrusted.json"], 2],
  [["inspect"], 2], [["discover", "--root", fixture], 0],
  [["validate", "--root", fixture, "--file", "missing.yaml"], 1],
  [["validate", "--root", fixture, "--file", "people/team.yml"], 1]
];
for (const [args, expected] of noValidationCases) {
  let calls = 0;
  const result = await capture(args, { validate: async () => { calls += 1; throw new Error("must not validate"); } });
  check(`no schema load before valid discovery: ${JSON.stringify(args)}`, result.code === expected && calls === 0);
}
const internal = await capture(["validate", "--root", fixture], {
  validate: async () => { throw new Error("private-test-schema-error"); }
});
check("schema setup failure is internal, not validation success", internal.code === 4 && internal.stdout === ""
  && !internal.stderr.includes("private-test-schema-error"));

let exampleCount = 0;
let manifestCount = 0;
for (const entry of (await readdir(path.join(root, "examples"), { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
  const exampleRoot = path.join(root, "examples", entry.name);
  const discovered = await discoverFromDirectory({ root: exampleRoot });
  check(`${entry.name}: discovery succeeds`, discovered.valid);
  if (!discovered.valid) continue;
  const before = JSON.stringify(discovered.assembly);
  const result = validateManifestAssembly(discovered.assembly, registry);
  check(`${entry.name}: every selected document passes schema validation`, result.valid && result.diagnostics.length === 0);
  check(`${entry.name}: validation does not mutate data`, JSON.stringify(discovered.assembly) === before);
  const executable = run(["validate", "--root", exampleRoot]);
  check(`${entry.name}: real command succeeds with accurate count`, executable.status === 0 && executable.stderr === ""
    && executable.stdout.includes(`Validated ${result.documentCount} manifest(s)`));
  exampleCount += 1;
  manifestCount += result.documentCount;
}
check("all maintained example sets exercised", exampleCount === 8 && manifestCount === 109);

const directory = run(["validate", "--root", fixture]);
const hinted = run(["validate", "--root", fixture, "--project", "project.yaml"]);
check("directory validation", directory.status === 0 && directory.stdout.includes("Validated 5 manifest(s)"));
check("Project hint validation", hinted.status === 0 && hinted.stdout.includes("project-source-hints"));
check("successful output states limits", directory.stdout.includes("Core Profile and full semantic validation were not performed")
  && directory.stdout.includes("no execution is authorized"));
check("working directory does not select schemas", run(["validate", "--root", fixture], tmpdir()).stdout === directory.stdout);
const forwardArgs = ["validate", "--root", fixture, "--file", "project.yaml", "--file", "people/team.yml"];
const reverseArgs = ["validate", "--root", fixture, "--file", "people/team.yml", "--file", "project.yaml"];
const forward = run(forwardArgs);
check("explicit files do not follow hints", forward.status === 0 && forward.stdout.includes("Validated 2 manifest(s)"));
check("success is independent of file order", forward.stdout === run(reverseArgs).stdout);

const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-cli-validation-"));
const writeManifest = (name, value) => writeFile(path.join(temporary, name), JSON.stringify(value, null, 2));
const selected = ["validate", "--root", temporary, "--file", "project.yaml"];
try {
  await writeManifest("project.yaml", project());
  await writeFile(path.join(temporary, "unlisted.yaml"), "invalid: [\n");
  await mkdir(path.join(temporary, "schemas"));
  await writeFile(path.join(temporary, "schemas", "project.schema.json"), "false");
  check("selected root cannot replace repository schemas or expand discovery", (await capture(selected)).code === 0);

  const negativeDirectory = path.join(root, "fixtures", "schema", "invalid");
  for (const [name, pointer, keyword] of [
    ["missing-required-field", "/project/description", "required"],
    ["invalid-enum", "/permissions/0/effect", "enum"],
    ["invalid-id", "/agents/0/id", "pattern"]
  ]) {
    const invalid = parse(await readFile(path.join(negativeDirectory, `${name}.yaml`), "utf8"));
    invalid.metadata.project = "validation-fixture";
    const isProject = invalid.kind === "Project";
    if (isProject) invalid.project.id = "validation-fixture";
    await writeManifest("project.yaml", isProject ? invalid : project());
    await writeManifest("invalid.yaml", invalid);
    const result = await capture([...selected, ...(isProject ? [] : ["--file", "invalid.yaml"])]);
    check(`${name}: existing negative fixture rejected`, result.code === 1 && result.stdout === ""
      && result.stderr.includes(`NF-SCHEMA "${isProject ? "project.yaml" : "invalid.yaml"}" ${invalid.kind}`)
      && result.stderr.includes(`"${pointer}" [${keyword}]`));
  }

  const invalidProject = project();
  delete invalidProject.project.description;
  invalidProject.project.policies = { requireReview: "true" };
  await writeManifest("project.yaml", invalidProject);
  check("discovery is not misreported as schema validation", (await capture(["discover", ...selected.slice(1)])).code === 0
    && (await capture(selected)).code === 1);
  const invalidTasks = manifest("TaskSet", { tasks: [{ id: "docs", title: "Docs", owner: "author", status: "private-test-status", acceptanceCriteria: [] }] });
  await writeManifest("tasks.yaml", invalidTasks);
  const first = await capture([...selected, "--file", "tasks.yaml"]);
  const reversed = await capture(["validate", "--root", temporary, "--file", "tasks.yaml", "--file", "project.yaml"]);
  check("multiple invalid files reported without success output", first.code === 1 && first.stdout === ""
    && first.stderr.includes('"/project/description" [required]')
    && first.stderr.includes('"/project/policies/requireReview" [type]')
    && first.stderr.includes('"tasks.yaml" TaskSet "/tasks/0/status" [enum]'));
  check("failure output is deterministic", first.stderr === reversed.stderr);
  check("invalid values not echoed", !first.stderr.includes("private-test-status"));
  const discoveredInvalid = await discoverFromDirectory({ root: temporary });
  const beforeValidation = JSON.stringify(discoveredInvalid.assembly);
  check("schema failure does not coerce or fill fields", !validateManifestAssembly(discoveredInvalid.assembly, registry).valid
    && JSON.stringify(discoveredInvalid.assembly) === beforeValidation);

  await writeManifest("project.yaml", project());
  const context = manifest("ContextSet", {
    contextSources: [{
      id: "repository", type: "local_files", description: "Local repository.",
      access: { default: "read" }, classification: "internal",
      freshness: { lastReviewed: "private-test-date" }
    }]
  });
  await writeManifest("context.yaml", context);
  const date = await capture([...selected, "--file", "context.yaml"]);
  check("format validation is enabled", date.code === 1
    && date.stderr.includes('"/contextSources/0/freshness/lastReviewed" [format]') && !date.stderr.includes("private-test-date"));

  const canary = "private-test-key/~\u001b\u009b\u202e";
  const sensitive = project();
  sensitive.manifests = { [canary]: 42, "1234567890": false };
  sensitive.project.approvalGates = [{ id: "review", description: "Review", targets: [{ kind: "task", id: "docs", [canary]: "private-test-value" }] }];
  await writeManifest("project.yaml", sensitive);
  const redacted = await capture(selected);
  check("unknown JSON Pointer segments redacted", redacted.code === 1 && redacted.stderr.includes('"/manifests/<redacted>" [type]')
    && !redacted.stderr.includes("private-test") && !redacted.stderr.includes("1234567890"));
  check("additional property names redacted", redacted.stderr.includes('"/project/approvalGates/0/targets/0/<redacted>" [additionalProperties]'));
  check("diagnostics contain no raw terminal controls or absolute roots", !/[\u001b\u009b\u202e]/u.test(redacted.stderr)
    && !redacted.stderr.includes(temporary));

  const unsafeInputs = [
    ["duplicate keys", 'specVersion: "0.1"\nspecVersion: "0.1"\nkind: TaskSet\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["custom tags", 'specVersion: "0.1"\nkind: TaskSet\nnotes: !private-test-tag value\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["cycle", 'specVersion: "0.1"\nkind: TaskSet\nnotes: &loop [*loop]\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["multiple documents", 'specVersion: "0.1"\nkind: TaskSet\n---\nprivate-test-document\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["malformed YAML", 'notes: [private-test-value\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["unsupported kind", 'specVersion: "0.1"\nkind: private-test-kind\n', 3, "NF-DISCOVERY-UNSUPPORTED-KIND"],
    ["unsupported version", 'specVersion: "private-test-version"\nkind: TaskSet\n', 3, "NF-DISCOVERY-UNSUPPORTED-VERSION"]
  ];
  await writeManifest("project.yaml", project());
  for (const [name, contents, expected, code] of unsafeInputs) {
    await writeFile(path.join(temporary, "invalid.yaml"), contents);
    let calls = 0;
    const result = await capture([...selected, "--file", "invalid.yaml"], { validate: async () => { calls += 1; throw new Error("not reached"); } });
    check(`${name}: rejected before schema validation`, result.code === expected && calls === 0 && result.stdout === ""
      && result.stderr.includes(code) && !result.stderr.includes("private-test"));
  }

  const oversized = manifest("TaskSet", { tasks: Array.from({ length: MAX_SCHEMA_DIAGNOSTICS + 10 }, () => ({})) });
  await writeManifest("tasks.yaml", oversized);
  const bounded = await capture([...selected, "--file", "tasks.yaml"]);
  check("bounded diagnostics remain a failure", bounded.code === 1 && bounded.stdout === ""
    && bounded.stderr.split("\n").filter((line) => line.startsWith("NF-SCHEMA ")).length === MAX_SCHEMA_DIAGNOSTICS
    && bounded.stderr.includes("Additional schema diagnostics omitted; validation failed."));

  const inert = project();
  inert.$schema = "https://example.invalid/private-test-schema.json";
  inert.command = "never-execute-this-command";
  inert.notes = "private-test-prompt-content";
  await writeManifest("project.yaml", inert);
  const before = await readFile(path.join(temporary, "project.yaml"), "utf8");
  const namesBefore = JSON.stringify((await readdir(temporary)).sort());
  const inertResult = run(selected);
  check("manifest schema URL and command stay inert", inertResult.status === 0 && inertResult.stderr === ""
    && !inertResult.stdout.includes("private-test") && !inertResult.stdout.includes("never-execute"));
  check("command creates no output files and leaves input unchanged", await readFile(path.join(temporary, "project.yaml"), "utf8") === before
    && JSON.stringify((await readdir(temporary)).sort()) === namesBefore);

  const unresolved = manifest("TaskSet", { tasks: [{ id: "docs", title: "Docs", owner: "missing-actor", status: "ready", dependsOn: ["missing-task"], acceptanceCriteria: [] }] });
  await writeManifest("tasks.yaml", unresolved);
  const schemaOnly = await capture([...selected, "--file", "tasks.yaml"]);
  check("structural pass does not claim reference resolution", schemaOnly.code === 0
    && schemaOnly.stdout.includes("full semantic validation were not performed"));
} finally {
  await rm(temporary, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`CLI validation checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI validation checks passed for ${checkCount} cases, including ${manifestCount} manifests in ${exampleCount} example sets.`);
  console.log("Verified local schema selection, structural validation, failure status, redaction, and non-mutating behavior.");
  console.log("This is repository prototype evidence, not reference CLI or runtime conformance.");
}
