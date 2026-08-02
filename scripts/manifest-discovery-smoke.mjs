#!/usr/bin/env node

import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

import {
  discoverFromProjectHints,
  discoverManifestAssembly
} from "./lib/manifest-discovery.mjs";
import { validateWorkflowStepNamespace } from "./lib/work-reference-namespaces.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureSource = path.join(root, "fixtures", "discovery", "multi-workflow");
const schemaDirectory = path.join(root, "schemas");
const sourceList = [
  { path: "project.yaml", expectedKind: "Project" },
  { path: "people/team.yml", expectedKind: "AgentSet" },
  { path: "work/items.yml", expectedKind: "TaskSet" },
  { path: "flows/release.yml", expectedKind: "Workflow" },
  { path: "flows/documentation.yml", expectedKind: "Workflow" }
];

const failures = [];
let checkCount = 0;

function check(name, condition, detail = "") {
  checkCount += 1;
  if (condition) return;
  failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

function hasCode(result, code) {
  return result.diagnostics.some((entry) => entry.code === code);
}

function clone(value) {
  return structuredClone(value);
}

async function parseYaml(file) {
  const document = parseDocument(await readFile(file, "utf8"), {
    maxAliasCount: 100,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  return document.toJS({ maxAliasCount: 100 });
}

async function validatorsByKind() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schemas = [];

  for (const name of (await readdir(schemaDirectory)).filter((entry) => entry.endsWith(".schema.json")).sort()) {
    const schema = JSON.parse(await readFile(path.join(schemaDirectory, name), "utf8"));
    schemas.push(schema);
    ajv.addSchema(schema);
  }

  return new Map(schemas
    .filter((schema) => typeof schema.properties?.kind?.const === "string")
    .map((schema) => [schema.properties.kind.const, ajv.getSchema(schema.$id)]));
}

async function withFixture(run) {
  const temporaryParent = await mkdtemp(path.join(tmpdir(), "nexflow-discovery-"));
  const fixtureRoot = path.join(temporaryParent, "project");
  await cp(fixtureSource, fixtureRoot, { recursive: true });
  try {
    return await run(fixtureRoot);
  } finally {
    await rm(temporaryParent, { recursive: true, force: true });
  }
}

const projectSchema = JSON.parse(
  await readFile(path.join(schemaDirectory, "project.schema.json"), "utf8")
);
const commonSchema = JSON.parse(
  await readFile(path.join(schemaDirectory, "common.schema.json"), "utf8")
);
const projectAjv = new Ajv2020({ allErrors: true, strict: false });
addFormats(projectAjv);
projectAjv.addSchema(commonSchema);
const validateProject = projectAjv.compile(projectSchema);
const fixtureProject = await parseYaml(path.join(fixtureSource, "project.yaml"));

check("plural workflow source hints", validateProject(fixtureProject));

const singularProject = clone(fixtureProject);
singularProject.manifests.workflow = singularProject.manifests.workflows[0];
delete singularProject.manifests.workflows;
check("legacy singular workflow source hint", validateProject(singularProject));

const mixedProject = clone(fixtureProject);
mixedProject.manifests.workflow = "flows/documentation.yml";
check("singular and plural workflow hints conflict", !validateProject(mixedProject));

const emptyWorkflowHints = clone(fixtureProject);
emptyWorkflowHints.manifests.workflows = [];
check("empty plural workflow source hints", !validateProject(emptyWorkflowHints));

const duplicateWorkflowHints = clone(fixtureProject);
duplicateWorkflowHints.manifests.workflows = [
  "flows/documentation.yml",
  "flows/documentation.yml"
];
check("duplicate plural workflow source hints", !validateProject(duplicateWorkflowHints));

const discovered = await discoverFromProjectHints({
  root: fixtureSource,
  projectPath: "project.yaml"
});
check(
  "maintained discovery fixture",
  discovered.valid,
  JSON.stringify(discovered.diagnostics)
);
check(
  "all source-hint documents retained",
  discovered.assembly?.documents.length === 5
);
check(
  "multiple workflows retained by ID",
  JSON.stringify(discovered.assembly?.workflows.map((workflow) => workflow.id))
    === JSON.stringify(["docs-delivery", "release-review"])
);

const schemaValidators = await validatorsByKind();
const invalidDiscoveredDocuments = discovered.assembly?.loadedDocuments.filter(({ manifest }) => {
  const validate = schemaValidators.get(manifest.kind);
  return !validate || !validate(manifest);
}) ?? [];
check(
  "discovered fixture documents are schema-valid",
  invalidDiscoveredDocuments.length === 0,
  invalidDiscoveredDocuments.map((document) => document.source).join(", ")
);

const discoveredWorkflows = discovered.assembly?.loadedDocuments
  .filter(({ manifest }) => manifest.kind === "Workflow") ?? [];
const workflowNamespaceResults = discoveredWorkflows.map(({ manifest }) =>
  validateWorkflowStepNamespace(manifest.workflow));
check(
  "workflow-local step namespaces",
  workflowNamespaceResults.every((result) => result.diagnostics.length === 0)
    && workflowNamespaceResults.every((result) => result.ids.has("prepare") && result.ids.has("review"))
);

const forward = await discoverManifestAssembly({ root: fixtureSource, sources: sourceList });
const reverse = await discoverManifestAssembly({ root: fixtureSource, sources: [...sourceList].reverse() });
check(
  "source order has no semantic precedence",
  forward.valid
    && reverse.valid
    && JSON.stringify(forward.assembly?.documents) === JSON.stringify(reverse.assembly?.documents)
);

await withFixture(async (fixtureRoot) => {
  const releaseFile = path.join(fixtureRoot, "flows", "release.yml");
  const releaseSource = await readFile(releaseFile, "utf8");
  await writeFile(releaseFile, releaseSource.replace("id: release-review", "id: docs-delivery"));
  const result = await discoverFromProjectHints({ root: fixtureRoot });
  check("duplicate workflow ID", hasCode(result, "NF-DISCOVERY-DUPLICATE-WORKFLOW"));
});

await withFixture(async (fixtureRoot) => {
  const teamFile = path.join(fixtureRoot, "people", "team.yml");
  const teamSource = await readFile(teamFile, "utf8");
  await writeFile(teamFile, teamSource.replace("project: discovery-fixture", "project: foreign-project"));
  const result = await discoverFromProjectHints({ root: fixtureRoot });
  check("foreign project document", hasCode(result, "NF-DISCOVERY-PROJECT-MISMATCH"));
});

await withFixture(async (fixtureRoot) => {
  const workflowFile = path.join(fixtureRoot, "flows", "documentation.yml");
  const workflowSource = await readFile(workflowFile, "utf8");
  await writeFile(workflowFile, workflowSource.replace('specVersion: "0.1"', 'specVersion: "0.2"'));
  const result = await discoverFromProjectHints({ root: fixtureRoot });
  check("mixed manifest versions", hasCode(result, "NF-DISCOVERY-UNSUPPORTED-VERSION"));
});

const kindMismatch = await discoverManifestAssembly({
  root: fixtureSource,
  sources: [
    sourceList[0],
    { path: "people/team.yml", expectedKind: "TaskSet" }
  ]
});
check("source expected-kind mismatch", hasCode(kindMismatch, "NF-DISCOVERY-KIND-MISMATCH"));

await withFixture(async (fixtureRoot) => {
  await cp(
    path.join(fixtureRoot, "people", "team.yml"),
    path.join(fixtureRoot, "people", "second-team.yml")
  );
  const result = await discoverManifestAssembly({
    root: fixtureRoot,
    sources: [
      sourceList[0],
      sourceList[1],
      { path: "people/second-team.yml", expectedKind: "AgentSet" }
    ]
  });
  check("duplicate singleton document", hasCode(result, "NF-DISCOVERY-DUPLICATE-SINGLETON"));
});

await withFixture(async (fixtureRoot) => {
  await cp(
    path.join(fixtureRoot, "project.yaml"),
    path.join(fixtureRoot, "second-project.yaml")
  );
  const result = await discoverManifestAssembly({
    root: fixtureRoot,
    sources: [sourceList[0], { path: "second-project.yaml", expectedKind: "Project" }]
  });
  check("multiple Project documents", hasCode(result, "NF-DISCOVERY-MULTIPLE-PROJECTS"));
});

const noProject = await discoverManifestAssembly({
  root: fixtureSource,
  sources: [sourceList[1]]
});
check("missing Project document", hasCode(noProject, "NF-DISCOVERY-NO-PROJECT"));

const outsideRoot = await discoverManifestAssembly({
  root: fixtureSource,
  sources: [sourceList[0], "../outside.yaml"]
});
check("source outside root", hasCode(outsideRoot, "NF-DISCOVERY-OUTSIDE-ROOT"));

const remoteSource = await discoverManifestAssembly({
  root: fixtureSource,
  sources: [sourceList[0], "https://example.com/project.yaml"]
});
check("remote source disabled", hasCode(remoteSource, "NF-DISCOVERY-OUTSIDE-ROOT"));

await withFixture(async (fixtureRoot) => {
  await symlink(
    path.join(fixtureRoot, "people", "team.yml"),
    path.join(fixtureRoot, "people", "linked-team.yml")
  );
  const result = await discoverManifestAssembly({
    root: fixtureRoot,
    sources: [sourceList[0], { path: "people/linked-team.yml", expectedKind: "AgentSet" }]
  });
  check("symbolic-link source", hasCode(result, "NF-DISCOVERY-UNSAFE-SOURCE"));
});

await withFixture(async (fixtureRoot) => {
  await writeFile(path.join(fixtureRoot, "unknown.yaml"), [
    'specVersion: "0.1"',
    "kind: UnknownSet",
    "metadata:",
    "  project: discovery-fixture",
    "items: []",
    ""
  ].join("\n"));
  const result = await discoverManifestAssembly({
    root: fixtureRoot,
    sources: [sourceList[0], "unknown.yaml"]
  });
  check("unsupported manifest kind", hasCode(result, "NF-DISCOVERY-UNSUPPORTED-KIND"));
});

const limited = await discoverManifestAssembly({
  root: fixtureSource,
  sources: sourceList,
  limits: { maxDocuments: 2 }
});
check("document count limit", hasCode(limited, "NF-DISCOVERY-LIMIT-EXCEEDED"));

const duplicateSource = await discoverManifestAssembly({
  root: fixtureSource,
  sources: [sourceList[0], sourceList[0]]
});
check("duplicate source locator", hasCode(duplicateSource, "NF-DISCOVERY-DUPLICATE-SOURCE"));

if (failures.length > 0) {
  console.error(`Manifest discovery checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Manifest discovery checks passed for ${checkCount} cases.`);
  console.log("Validated explicit local source boundaries, project association, conservative cardinality, and two workflow-local namespaces.");
  console.log("These checks build a validation inventory only; they do not execute workflows or define cross-workflow runtime state.");
}
