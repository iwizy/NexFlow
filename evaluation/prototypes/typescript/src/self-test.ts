import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { jsonLine } from "./diagnostics.js";
import { LocalInputs } from "./files.js";
import { evaluate, evaluateLibraryCase, parseYaml, repositorySchemas } from "./library.js";
import { inspect, InspectionLimit } from "./inspection.js";
import { type Json, type Manifest } from "./model.js";

const repository = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = fileURLToPath(new URL("cli.js", import.meta.url));
const fixture = join(repository, "fixtures/cli/valid/minimal-project");
const scratch = (body: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), "nexflow-typescript-test-"));
  try { body(root); } finally { rmSync(root, { recursive: true, force: true }); }
};
const invoke = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", timeout: 5000 });

test("independent library validates and inspects with no runtime authority", () => {
  for (const command of ["validate", "inspect"] as const) {
    const output = evaluate(command, { root: fixture, project: "project.yaml" });
    assert.equal(output.exitCode, 0);
    assert.equal(output.checks.schema, "passed");
    assert.equal(output.executionAuthorized, false);
    assert.equal(output.checks.semantic, "not-run");
    assert.equal(output.checks.extensionProfiles, "not-run");
    assert.equal(output.result?.documentCount, 3);
  }
});
test("explicit files do not follow unselected project hints", () => {
  const output = evaluate("validate", { root: fixture, files: ["project.yaml"] });
  assert.equal(output.exitCode, 0);
  assert.equal(output.inputMode, "explicit-file-list");
  assert.equal(output.result?.documentCount, 1);
});
test("YAML rejects duplicate keys, multiple documents, cycles and non-JSON values", () => {
  for (const source of ["a: 1\na: 2\n", "a: [\n", "a: 1\n---\na: 2\n", "a: &loop [*loop]\n", "a: .inf\n", "? [a, b]\n: c\n", "a: !unknown secret\n"]) {
    assert.equal(parseYaml(source).valid, false);
  }
  assert.equal(parseYaml("a: 1\na: 2\n").category, "duplicate-key");
});
test("read-only input boundaries reject escape paths, symlinks, directories and excessive size", () => scratch(root => {
  const inputs = new LocalInputs(root);
  writeFileSync(join(root, "plain.yaml"), "a: 1\n");
  mkdirSync(join(root, "folder.yaml"));
  writeFileSync(join(root, "large.yaml"), "a".repeat(1024 * 1024 + 1));
  writeFileSync(join(root, "invalid.yaml"), Buffer.from([0xff]));
  symlinkSync(join(root, "plain.yaml"), join(root, "linked.yaml"));
  symlinkSync(root, join(root, "parent"), "dir");
  for (const locator of ["../outside.yaml", "/outside.yaml", "C:/outside.yaml", "folder/../plain.yaml", "a\\b.yaml", "a\0b.yaml", "linked.yaml", "parent/plain.yaml", "folder.yaml", "large.yaml", "invalid.yaml", "missing.yaml", "plain.json"]) {
    assert.throws(() => inputs.read(locator));
  }
  assert.equal(inputs.read("plain.yaml"), "a: 1\n");
}));
test("FIFO is rejected without waiting for a writer where available", { skip: process.platform === "win32" }, () => scratch(root => {
  const creation = spawnSync("mkfifo", [join(root, "pipe.yaml")], { timeout: 1000 });
  assert.equal(creation.status, 0);
  const result = invoke("validate", "--root", root, "--file", "pipe.yaml", "--format", "json");
  assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).diagnostics.some((item: { code: string }) => item.code === "NF-DISCOVERY-UNSAFE-SOURCE"));
}));
test("source failures do not echo root, unsafe locator or input values", () => scratch(root => {
  writeFileSync(join(root, "project.yaml"), "secret: PRIVATE_CANARY\nkind: [\n");
  const output = jsonLine(evaluate("validate", { root }));
  assert.equal(output.includes(root), false);
  assert.equal(output.includes("PRIVATE_CANARY"), false);
  const escaped = jsonLine(evaluate("validate", { root, files: ["/PRIVATE_CANARY.yaml"] }));
  assert.equal(escaped.includes("PRIVATE_CANARY"), false);
}));
test("unsupported commands and options fail before reading inputs", () => {
  const library = evaluate("run" as "validate", { root: "/PRIVATE_CANARY" });
  assert.equal(library.exitCode, 2);
  assert.equal(library.checks.discovery, "not-run");
  for (const args of [["run"], ["init"], ["graph"], ["validate", "--provider", "PRIVATE_CANARY"],
    ["validate", "--root", "/PRIVATE_CANARY", "--root", "/second"],
    ["validate", "--root", "/PRIVATE_CANARY", "--project", "p.yaml", "--file", "a.yaml"],
    ["validate", "--root", "/PRIVATE_CANARY", "--format", "xml"]]) {
    const result = invoke(...args, "--format", "json");
    assert.equal(result.status, 2);
    assert.equal(result.stderr, "");
    const output = JSON.parse(result.stdout);
    assert.equal(output.command, null);
    assert.equal(output.checks.discovery, "not-run");
    assert.equal(result.stdout.includes("PRIVATE_CANARY"), false);
  }
});
test("text and JSON preserve the same diagnostic code and exit status", () => {
  const args = ["validate", "--root", fixture, "--file", "missing.yaml"];
  const text = invoke(...args);
  const json = invoke(...args, "--format", "json");
  assert.equal(text.status, json.status);
  assert.equal(text.stderr, "");
  for (const issue of JSON.parse(json.stdout).diagnostics) assert.ok(text.stdout.includes(issue.code));
});
test("source count and duplicate selection are rejected", () => {
  for (const files of [["project.yaml", "project.yaml"], Array.from({ length: 129 }, (_, index) => `p${index}.yaml`)]) {
    assert.equal(evaluate("validate", { root: fixture, files }).success, false);
  }
});
test("schema diagnostics omit raw values and extra property names", () => scratch(root => {
  cpSync(fixture, root, { recursive: true });
  const file = join(root, "project.yaml");
  const value = JSON.parse(JSON.stringify(parseYaml(readFileSync(file, "utf8")).value));
  value.project.description = { PRIVATE_CANARY: "secret-value" };
  value.PRIVATE_CANARY = "secret-value";
  writeFileSync(file, JSON.stringify(value));
  const result = evaluate("validate", { root });
  assert.equal(result.checks.schema, "failed");
  assert.equal(jsonLine(result).includes("PRIVATE_CANARY"), false);
  assert.equal(jsonLine(result).includes("secret-value"), false);
}));
test("inspection has a finite declaration budget", () => {
  const document: Manifest = { file: "actors.yaml", kind: "ActorSet", value: {
    actors: Array.from({ length: 1001 }, (_, index) => ({ id: `actor-${index}` })),
  } };
  assert.throws(() => inspect([document]), InspectionLimit);
});
test("library entry reports unimplemented semantic and namespace cases honestly", () => {
  const schemas = repositorySchemas();
  for (const operation of ["semantic-fragment", "workflow-namespace", "artifact-namespace"]) {
    const result = evaluateLibraryCase({ id: "pending", operation, input: {} }, repository, schemas);
    assert.equal(result.valid, null);
    assert.equal(result.status, "not-implemented");
    assert.deepEqual(result.checks, { runtime: "not-run", extensions: "not-run" });
  }
});
test("candidate dependency graph matches the approved NF-056-04 graph", () => {
  const approved = JSON.parse(readFileSync(join(repository, "evaluation/toolchains/typescript/package-lock.json"), "utf8"));
  const candidate = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  for (const [name, entry] of Object.entries(candidate.packages) as [string, Json][]) {
    if (name) assert.deepEqual(entry, approved.packages[name]);
  }
  assert.equal(process.versions.node, "22.23.2");
});
