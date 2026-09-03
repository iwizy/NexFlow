#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

import { runCliPrototype } from "./lib/cli-prototype.mjs";
import { graphManifestInspection } from "./lib/manifest-graph.mjs";
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
    stdout: { write: (value) => { stdout += value; } },
    stderr: { write: (value) => { stderr += value; } },
    validate: (assembly) => validateManifestAssembly(assembly, registry),
    ...overrides
  });
  return { code, stdout, stderr };
}

function run(args, cwd = root) {
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd, encoding: "utf8", timeout: 10000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NEXFLOW_GRAPH_CANARY: "private-test-environment" }
  });
  return { ...result, code: result.status };
}

function envelope(name, result) {
  let output;
  try { output = JSON.parse(result.stdout); } catch { /* Report invalid JSON below. */ }
  check(`${name}: schema-valid envelope and matching exit code`, Boolean(output)
    && validateOutput(output) && result.code === output.exitCode && result.stderr === "");
  check(`${name}: no semantic or runtime claim`, output?.executionAuthorized === false
    && ["coreProfile", "semantic", "extensionProfiles"].every((key) => output?.checks[key] === "not-run"));
  return output;
}

for (const [args, expected] of [
  [["graph"], 2], [["graph", "--help"], 0], [["graph", "--root", ""], 2],
  [["graph", "--root", fixture, "--file", "project.yaml", "--project", "project.yaml"], 2],
  [["graph", "--root", fixture, "extra"], 2], [["init"], 3]
]) {
  let calls = 0;
  const forbidden = async () => { calls += 1; throw new Error("private-test-must-not-run"); };
  const output = envelope("no-read graph dispatch", await capture([...args, "--format=json"], {
    discover: forbidden, validate: forbidden, inspect: forbidden, graph: forbidden
  }));
  check("help, usage errors, and reserved commands perform no work", calls === 0 && output?.exitCode === expected);
}

let exampleCount = 0;
for (const entry of (await readdir(path.join(root, "examples"), { withFileTypes: true })).filter((item) => item.isDirectory())) {
  const output = envelope(entry.name, run(["graph", "--root", path.join(root, "examples", entry.name), "--format=json"]));
  const graph = output?.result.graph;
  check(`${entry.name}: graph is schema-first and count-consistent`, output?.exitCode === 0
    && output?.checks.discovery === "passed" && output?.checks.schema === "passed"
    && graph.nodeCount === graph.nodes.length && graph.edgeCount === graph.edges.length
    && graph.nodes.every((node, index) => node.id === `n${index}`)
    && graph.edges.every((edge, index) => edge.id === `e${index}`));
  exampleCount += 1;
}
check("all seven maintained projects graph successfully", exampleCount === 7);

const args = ["graph", "--root", minimalRoot, "--format=json"];
const minimalResult = run(args);
const minimal = envelope("Minimal Team graph", minimalResult);
check("Minimal Team graph resolves its two selected references", minimal?.result.graph.nodeCount === 4
  && minimal?.result.graph.edgeCount === 2
  && minimal?.result.graph.edges.every((edge) => edge.status === "resolved" && edge.to !== null)
  && minimal?.result.graph.edges.some((edge) => edge.relation === "maintainers"));
check("graph output is deterministic across working directories", minimalResult.stdout === run(args, tmpdir()).stdout
  && !minimalResult.stdout.includes(minimalRoot) && !minimalResult.stdout.includes("private-test-environment"));
const text = run(["graph", "--root", minimalRoot]);
check("text graph states its static non-authoritative boundary", text.code === 0 && text.stderr === ""
  && text.stdout.includes("Graphed 4 node(s) and 2 edge(s)")
  && text.stdout.includes("(resolved)") && text.stdout.includes("no execution is authorized"));
check("explicit text preserves default", text.stdout === run(["graph", "--root", minimalRoot, "--format=text"]).stdout);

const directoryArgs = ["graph", "--root", fixture, "--format=json"];
const directory = envelope("multiple workflow graph", run(directoryArgs));
const hints = envelope("Project-hint graph", run([...directoryArgs, "--project", "project.yaml"]));
check("directory and Project-hint graph modes agree", JSON.stringify(directory?.result) === JSON.stringify(hints?.result));
const stepNodes = directory?.result.graph.nodes.filter((node) => node.kind === "workflow-step");
const stepEdges = directory?.result.graph.edges.filter((edge) => edge.target.kind === "workflow-step");
check("same step IDs remain scoped to their workflows", new Set(stepNodes.map((node) => node.scope.id)).size === 2
  && stepEdges.every((edge) => edge.status === "resolved" && edge.target.scope?.kind === "workflow"));

for (const command of ["discover", "validate", "inspect"]) {
  let calls = 0;
  const output = envelope(`unchanged ${command}`, await capture([command, "--root", minimalRoot, "--format=json"], {
    graph: async () => { calls += 1; throw new Error("must not graph"); }
  }));
  check("existing commands never build or expose a graph", output?.exitCode === 0 && calls === 0
    && !Object.hasOwn(output.result, "graph"));
}

const projected = {
  mode: "declared-only", referencesResolved: false, referenceCoverage: "selected-fields",
  resources: [
    { file: "project.yaml", path: "/project", kind: "project", id: "sample", scope: null },
    { file: "tasks.yaml", path: "/tasks/0", kind: "task", id: "duplicate", scope: null },
    { file: "tasks.yaml", path: "/tasks/1", kind: "task", id: "duplicate", scope: null },
    { file: "tasks.yaml", path: "/tasks/2", kind: "task", id: "consumer", scope: null }
  ],
  references: [
    { file: "tasks.yaml", path: "/tasks/2/dependsOn/0", kind: "task", id: "duplicate", scope: null },
    { file: "tasks.yaml", path: "/tasks/2/dependsOn/1", kind: "task", id: "missing", scope: null },
    { file: "tasks.yaml", path: "/tasks/2/dependsOn/2", kind: "task", id: "<redacted-id>", scope: null }
  ]
};
const before = JSON.stringify(projected);
const derived = graphManifestInspection(projected);
check("pure graph labels duplicate, missing, and redacted targets", JSON.stringify(derived.edges.map((edge) => edge.status))
  === JSON.stringify(["ambiguous", "unresolved", "redacted"])
  && derived.edges[0].candidates.length === 2 && derived.edges.slice(1).every((edge) => edge.to === null)
  && JSON.stringify(projected) === before);

let graphCalls = 0;
const hidden = await capture(args, { graph: (inspection) => {
  graphCalls += 1;
  const graph = graphManifestInspection(inspection);
  graph.privateField = "private-test-hidden";
  graph.nodes[0].privateField = "private-test-hidden";
  return graph;
} });
const hiddenOutput = envelope("closed graph projection", hidden);
check("output projection omits helper-private fields", graphCalls === 1 && hiddenOutput?.exitCode === 0
  && !hidden.stdout.includes("private-test-hidden"));

const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-cli-graph-"));
try {
  await writeFile(path.join(temporary, "project.yaml"), "specVersion: '0.1'\nkind: Project\nproject: {}\n");
  let calls = 0;
  const invalid = envelope("schema-invalid graph", await capture(["graph", "--root", temporary, "--format=json"], {
    inspect: () => { calls += 1; throw new Error("must not inspect"); },
    graph: () => { calls += 1; throw new Error("must not graph"); }
  }));
  check("schema failure suppresses graph construction and partial results", invalid?.exitCode === 1
    && invalid?.result === null && calls === 0);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const old = structuredClone(minimal);
old.formatVersion = "0.2-draft";
check("output schema rejects prior format version", !validateOutput(old));
const missing = structuredClone(minimal);
delete missing.result.graph;
check("output schema requires graph only for successful graph", !validateOutput(missing));
const wrongCommand = structuredClone(minimal);
wrongCommand.command = "inspect";
check("output schema rejects graph on other commands", !validateOutput(wrongCommand));

if (failures.length > 0) {
  console.error(`CLI graph checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI graph checks passed for ${checkCount} cases.`);
  console.log("Verified static nodes, selected reference edges, scoped resolution, safe output, and no execution.");
  console.log("This is repository prototype evidence, not full semantic, reference CLI, or runtime conformance.");
}
