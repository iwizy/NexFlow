#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { runCliPrototype } from "./lib/cli-prototype.mjs";
import { CLI_OUTPUT_VERSION, MAX_JSON_DIAGNOSTICS } from "./lib/cli-output.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const fixture = path.join(root, "fixtures", "discovery", "multi-workflow");
const outputSchema = JSON.parse(await readFile(new URL("./contracts/cli-output.schema.json", import.meta.url), "utf8"));
const validateOutput = new Ajv2020({ allErrors: true, strict: false }).compile(outputSchema);
const failures = [];
let checkCount = 0;

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
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
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd, encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024,
    env: { ...process.env, NEXFLOW_PROTOTYPE_CANARY: "private-test-environment-value" }
  });
  return { ...result, code: result.status };
}

function envelope(name, result) {
  let output;
  try { output = JSON.parse(result.stdout); } catch { /* Report malformed output through the shared check. */ }
  check(`${name}: one schema-valid JSON result with matching exit status`, Boolean(output)
    && validateOutput(output) && output.exitCode === result.code && output.success === (result.code === 0));
  check(`${name}: stdout only and no unsupported validation claims`, result.stderr === ""
    && output?.executionAuthorized === false
    && ["coreProfile", "semantic", "extensionProfiles"].every((key) => output?.checks[key] === "not-run"));
  return output;
}

check("output format and diagnostic cap match their schema", outputSchema.properties.formatVersion.const === CLI_OUTPUT_VERSION
  && outputSchema.properties.diagnostics.maxItems === MAX_JSON_DIAGNOSTICS);

const noReadCases = [
  [["--help"], 0, "help"], [["--version"], 0, "version"], [["validate", "--help"], 0, "help"],
  ...["inspect", "graph", "init"].map((command) => [[command, "--root", "not-read"], 3, command]),
  [["validate"], 2, null], [["unknown-private-test-command"], 2, null],
  [["validate", "--root", fixture, "--unknown-private-test-option"], 2, null],
  [["validate", "--root", fixture, "extra-private-test-value"], 2, null],
  [["validate", "--root", fixture, "--root", fixture], 2, null],
  [["validate", "--root", fixture, "--file", "project.yaml", "--project", "project.yaml"], 2, null],
  [["--help", "--version"], 2, null], [["--help", "--root", fixture], 2, null],
  [["--version", "--format", "text"], 2, null],
  [["--version", "--format", "json"], 2, null],
  [["validate", "--root"], 2, null]
];
for (const [args, expected, command] of noReadCases) {
  let reads = 0;
  const forbidden = async () => { reads += 1; throw new Error("private-test-no-read"); };
  const result = await capture(["--format=json", ...args], { discover: forbidden, validate: forbidden });
  const output = envelope(`no-read ${JSON.stringify(args)}`, result);
  check("usage, help, version, and reserved commands never load input", reads === 0 && result.code === expected
    && output?.command === command && output?.checks.discovery === "not-run" && output?.checks.schema === "not-run"
    && !result.stdout.includes("private-test-") && !result.stdout.includes(fixture));
}

for (const args of [
  ["--format", "yaml"], ["--format"], ["--", "--format=json"],
  ["--root", "--format=json"], ["--file=--format=json"]
]) {
  const result = await capture(["validate", ...args]);
  check("unknown formats and option values do not silently select JSON", result.code === 2 && result.stdout === ""
    && result.stderr.startsWith("Invalid prototype usage."));
}
const normalVersion = await capture(["--version"]);
check("explicit text mode preserves default output", (await capture(["--version", "--format", "text"])).stdout === normalVersion.stdout);
const jsonVersion = envelope("JSON version", run(["--format=json", "--version"]));
check("tool and output versions are separate from manifest specVersion", jsonVersion?.tool.version === "unreleased"
  && jsonVersion?.formatVersion === "0.1-draft" && jsonVersion?.supportedSpecVersions.join() === "0.1"
  && jsonVersion?.result.text === normalVersion.stdout);

let exampleCount = 0;
for (const entry of (await readdir(path.join(root, "examples"), { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
  const exampleRoot = path.join(root, "examples", entry.name);
  for (const command of ["discover", "validate"]) {
    const output = envelope(`${entry.name} ${command}`, run([command, "--root", exampleRoot, "--format", "json"]));
    check("successful inventory exposes only source and kind", output?.result.documents.length === output?.result.documentCount
      && output?.result.documents.every((document) => Object.keys(document).join() === "file,kind")
      && output?.checks.discovery === "passed" && output?.checks.schema === (command === "validate" ? "passed" : "not-run"));
  }
  exampleCount += 1;
}
check("all seven maintained examples exercised in both JSON commands", exampleCount === 7);

const directoryArgs = ["validate", "--root", fixture, "--format=json"];
const directory = run(directoryArgs);
envelope("directory selection", directory);
check("output is independent of cwd and does not contain absolute root or environment", directory.stdout === run(directoryArgs, tmpdir()).stdout
  && !directory.stdout.includes(fixture) && !directory.stdout.includes("private-test-environment-value"));
const hinted = envelope("Project hints", run([...directoryArgs, "--project", "project.yaml"]));
check("hint input mode reported", hinted?.inputMode === "project-source-hints");
const forward = run([...directoryArgs, "--file", "project.yaml", "--file", "people/team.yml"]);
const reverse = run([...directoryArgs, "--file", "people/team.yml", "--file", "project.yaml"]);
const selected = envelope("explicit files", forward);
check("explicit inventory is deterministic and does not follow hints", forward.stdout === reverse.stdout
  && selected?.inputMode === "explicit-file-list" && selected?.result.documentCount === 2);
const duplicate = envelope("duplicate source", run([...directoryArgs, "--file", "project.yaml", "--file", "./project.yaml"]));
check("discovery error preserves related sources and suppresses inventory", duplicate?.result === null
  && duplicate?.checks.discovery === "failed" && duplicate?.checks.schema === "not-run"
  && duplicate?.diagnostics.some((entry) => entry.code === "NF-DISCOVERY-DUPLICATE-SOURCE"
    && entry.related.some((related) => related.file === "project.yaml")));
const duplicateUnsafeResult = run([...directoryArgs, "--file", "../private-test-escape.yaml", "--file", "../private-test-escape.yaml"]);
const duplicateUnsafe = envelope("unsafe related source", duplicateUnsafeResult);
check("related source redaction matches primary source redaction", !duplicateUnsafeResult.stdout.includes("private-test-")
  && duplicateUnsafe?.diagnostics.some((entry) => entry.related.some((related) => related.file === "<redacted-source>")));

for (const locator of ["/private-test-absolute.yaml", "../private-test-escape.yaml", "https://example.invalid/private-test-remote.yaml", "C:\\private-test-windows.yaml", `private-test-${"x".repeat(520)}.yaml`]) {
  const result = run([...directoryArgs, "--file", "project.yaml", "--file", locator]);
  envelope("redacted locator", result);
  check("unsafe and overlong locators stay redacted in JSON", result.code === 1 && !result.stdout.includes("private-test-"));
}
const missingRoot = run(["validate", "--root", path.join(fixture, "private-test-missing-root"), "--format=json"]);
envelope("missing root", missingRoot);
check("root value not disclosed", missingRoot.code === 1 && !missingRoot.stdout.includes("private-test-missing-root"));
for (const locator of ["missing-\u001b\u009b\u202e.yaml", "<missing-\u001b.yaml", "missing-\u00e9.yaml"]) {
  const result = run([...directoryArgs, "--file", "project.yaml", "--file", locator]);
  const output = envelope("escaped filename", result);
  check("JSON escaping preserves usable decoded locator", result.code === 1 && /^[\x09\x0a\x0d\x20-\x7e]*$/u.test(result.stdout)
    && output?.diagnostics.some((entry) => entry.file === locator));
  const textResult = run(["validate", "--root", fixture, "--file", "project.yaml", "--file", locator]);
  check("text filenames remain safely escaped", !/[\u001b\u009b\u202e\u00e9]/u.test(textResult.stderr));
}

for (const stage of ["discover", "validate"]) {
  const output = envelope(`${stage} internal failure`, await capture(directoryArgs, {
    [stage]: async () => { throw new Error("private-test-internal-error"); }
  }));
  check("internal failures have no partial result or raw exception", output?.exitCode === 4 && output?.result === null
    && output?.diagnostics[0].code === "NEXFLOW-PROTOTYPE-INTERNAL"
    && output?.checks[stage === "discover" ? "discovery" : "schema"] === "unavailable"
    && !JSON.stringify(output).includes("private-test-internal-error"));
}

const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-cli-diagnostics-"));
const project = () => ({
  specVersion: "0.1", kind: "Project", metadata: { project: "diagnostics-fixture" },
  project: { id: "diagnostics-fixture", displayName: "Diagnostics Fixture", description: "Diagnostic check." }
});
const writeProject = (value) => writeFile(path.join(temporary, "project.yaml"), JSON.stringify(value, null, 2));
const args = ["validate", "--root", temporary, "--format", "json"];
try {
  const invalid = project();
  delete invalid.project.description;
  invalid.project.policies = { requireReview: "private-test-value" };
  invalid["private-test-property"] = "private-test-content";
  invalid.project.approvalGates = [{
    id: "review", description: "Review", targets: [{ kind: "task", id: "docs", "private-test-property/~\u001b\u202e": true }]
  }];
  await writeProject(invalid);
  const before = await readFile(path.join(temporary, "project.yaml"), "utf8");
  const result = run(args);
  const output = envelope("schema diagnostics", result);
  check("schema fields are structured and no manifest values or keys leak", output?.checks.schema === "failed"
    && output?.result === null && !result.stdout.includes("private-test-")
    && output?.diagnostics.some((entry) => entry.code === "NF-SCHEMA" && entry.kind === "Project"
      && entry.file === "project.yaml" && entry.path === "/project/description" && entry.keyword === "required")
    && output?.diagnostics.some((entry) => entry.path === "/project/approvalGates/0/targets/0/<redacted>" && entry.keyword === "additionalProperties"));
  check("JSON mode is non-mutating", before === await readFile(path.join(temporary, "project.yaml"), "utf8"));
  check("invalid output is byte-for-byte deterministic", result.stdout === run(args).stdout);

  for (const [name, contents, exitCode, code] of [
    ["unsupported version", { ...project(), specVersion: "private-test-version" }, 3, "NF-DISCOVERY-UNSUPPORTED-VERSION"],
    ["unsupported kind", { ...project(), kind: "private-test-kind" }, 3, "NF-DISCOVERY-UNSUPPORTED-KIND"],
    ["unknown hint", { ...project(), manifests: { "private-test-hint": "not-read.yaml" } }, 3, "NF-DISCOVERY-UNSUPPORTED-HINT"],
    ["YAML parse failure", "kind: [private-test-parser-value\n", 1, "NF-DISCOVERY-UNSAFE-SOURCE"]
  ]) {
    if (typeof contents === "string") await writeFile(path.join(temporary, "project.yaml"), contents);
    else await writeProject(contents);
    const result = run(args);
    const output = envelope(name, result);
    check(`${name}: preserved code and no unsupported value leakage`, result.code === exitCode
      && output?.diagnostics.some((entry) => entry.code === code) && output?.result === null
      && output?.checks.schema === "not-run" && !result.stdout.includes("private-test-"));
  }

  const hints = project();
  hints.manifests = Object.fromEntries(Array.from({ length: MAX_JSON_DIAGNOSTICS + 5 }, (_, index) => [`unknown${index}`, "not-read.yaml"]));
  await writeProject(hints);
  const manyHints = envelope("bounded discovery errors", run(args));
  check("discovery truncation does not imply success", manyHints?.exitCode === 3 && manyHints?.truncated === true
    && manyHints?.diagnostics.length === MAX_JSON_DIAGNOSTICS && manyHints?.result === null);

  const manyErrors = project();
  manyErrors.project.approvalGates = Array.from({ length: MAX_JSON_DIAGNOSTICS + 5 }, () => ({}));
  await writeProject(manyErrors);
  const capped = envelope("bounded schema errors", run(args));
  check("schema truncation remains visible and unsuccessful", capped?.exitCode === 1 && capped?.truncated === true
    && capped?.diagnostics.length === MAX_JSON_DIAGNOSTICS && capped?.result === null);

  await writeProject(invalid);
  await writeFile(path.join(temporary, "other.yaml"), JSON.stringify({
    specVersion: "0.1", kind: "AgentSet", metadata: { project: "diagnostics-fixture" }, agents: [{}]
  }));
  const ordered = run([...args, "--file", "project.yaml", "--file", "other.yaml"]);
  const unordered = run([...args, "--file", "other.yaml", "--file", "project.yaml"]);
  const multi = envelope("multiple invalid files", ordered);
  const keys = multi?.diagnostics.map((entry) => [entry.file, entry.path, entry.severity, entry.code, entry.kind, entry.keyword, entry.message].map((v) => v ?? "").join("\u0000"));
  check("diagnostics sort by file, pointer, severity, code, kind, keyword, and message", ordered.stdout === unordered.stdout
    && JSON.stringify(keys) === JSON.stringify([...keys].sort()));

  const missingFile = run([...args, "--file", "project.yaml", "--file", "second.yaml"]);
  // A missing source must not expose a discovered Project as a partial success.
  check("mixed discovery failure does not carry a success result", envelope("missing selected file", missingFile)?.result === null);

  await writeProject(project());
  for (const name of ["a.yaml", "b.yaml"]) await writeFile(path.join(temporary, name), JSON.stringify(project()));
  const multiple = envelope("multiple Projects", run([...args, "--file", "project.yaml", "--file", "b.yaml", "--file", "a.yaml"]));
  check("related locations are sorted", multiple?.diagnostics.some((entry) => entry.code === "NF-DISCOVERY-MULTIPLE-PROJECTS"
    && JSON.stringify(entry.related) === JSON.stringify([{ file: "b.yaml" }, { file: "project.yaml" }])));

  const inert = project();
  inert.$schema = "https://example.invalid/private-test-schema";
  inert.command = "private-test-never-run";
  inert.notes = "private-test-prompt-content";
  await writeProject(inert);
  const namesBefore = JSON.stringify((await readdir(temporary)).sort());
  const inertOutput = run(args);
  envelope("inert manifest fields", inertOutput);
  check("JSON success exposes no raw values and creates no files", inertOutput.code === 0 && !inertOutput.stdout.includes("private-test-")
    && namesBefore === JSON.stringify((await readdir(temporary)).sort()));
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const successful = JSON.parse(directory.stdout);
for (const [name, mutate] of [
  ["unknown output version", (value) => { value.formatVersion = "unknown"; }],
  ["unknown field", (value) => { value.rawManifest = {}; }],
  ["runtime authority claim", (value) => { value.executionAuthorized = true; }],
  ["semantic pass claim", (value) => { value.checks.semantic = "passed"; }],
  ["schema validation skipped on success", (value) => { value.checks.schema = "not-run"; }],
  ["discovery incomplete on success", (value) => { value.checks.discovery = "failed"; }],
  ["success inventory missing", (value) => { value.result = { text: "not an inventory" }; }],
  ["exit status mismatch", (value) => { value.success = false; }],
  ["success marked truncated", (value) => { value.truncated = true; }],
  ["failure with success result", (value) => { value.exitCode = 1; value.success = false; }]
]) {
  const invalid = structuredClone(successful);
  mutate(invalid);
  check(`output schema rejects ${name}`, !validateOutput(invalid));
}

const guide = await readFile(new URL("../docs/cli-diagnostics.md", import.meta.url), "utf8");
const documented = JSON.parse(guide.match(/```json\n([\s\S]*?)\n```/u)[1]);
const actual = envelope("documented negative fixture", run([
  "validate", "--root", path.join(root, "fixtures", "schema", "invalid"),
  "--file", "missing-required-field.yaml", "--format", "json"
]));
check("documented complete result matches the real command", validateOutput(documented)
  && JSON.stringify(documented) === JSON.stringify(actual));

if (failures.length > 0) {
  console.error(`CLI diagnostics checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI diagnostics checks passed for ${checkCount} cases.`);
  console.log("Verified JSON envelopes, stream and exit contracts, deterministic diagnostics, redaction, truncation, and unchanged text mode.");
  console.log("This is experimental output evidence, not stable diagnostic or reference CLI conformance.");
}
