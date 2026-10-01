#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";
import { baseline, digest, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { catalogErrors, compareLibraryResult } from "./lib/evaluation-library.mjs";
import { validateArtifactNamespace, validateWorkflowStepNamespace } from "./lib/work-reference-namespaces.mjs";
import { discoverFromDirectory, discoverFromProjectHints, discoverManifestAssembly } from "./lib/manifest-discovery.mjs";

const catalog = JSON.parse(readFileSync("evaluation/library-cases.json", "utf8"));
const inventory = JSON.parse(readFileSync("evaluation/library-inventory.json", "utf8"));
assert.equal(inventory.catalogFile, "evaluation/library-cases.json");
assert.equal(inventory.catalogSha256, digest(readFileSync(inventory.catalogFile)));
assert.equal(inventory.caseCount, catalog.cases.length);
assert.equal(inventory.specificationRevision, catalog.specificationRevision);
assert.equal(inventory.sourceCorpusSha256, catalog.sourceCorpusSha256);
assert.deepEqual(inventory.operationCounts, Object.fromEntries([...new Set(catalog.cases.map(item => item.operation))]
  .map(operation => [operation, catalog.cases.filter(item => item.operation === operation).length])));
assert.deepEqual(verifyCorpus(), []);
assert.deepEqual(catalogErrors(catalog, baseline), []);
for (const file of catalog.files) assert.equal(digest(readFileSync(file.path)), file.sha256, file.path);

// Rehearse the reviewed pinned smoke functions, not a new semantic validator.
// Only function declarations are evaluated; traversal, CLI and imports are not.
const source = readFileSync("scripts/semantic-reference-smoke.mjs", "utf8");
const functionStart = source.indexOf("function asArray(value)");
const functionEnd = source.indexOf("const manifestFiles = await filesUnder");
assert.ok(functionStart > 0 && functionEnd > functionStart);
const functions = source.slice(functionStart, functionEnd);
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schemas = catalog.files.filter(file => /^schemas\/.*\.schema\.json$/u.test(file.path))
  .map(file => JSON.parse(readFileSync(file.path, "utf8")));
for (const schema of schemas) ajv.addSchema(schema);
const byKind = new Map(schemas.filter(schema => schema.properties?.kind?.const)
  .map(schema => [schema.properties.kind.const, ajv.getSchema(schema.$id)]));
const ruleDocuments = new Map();
for (const item of catalog.cases) {
  const file = item.specificationRule.path;
  if (!ruleDocuments.has(file)) ruleDocuments.set(file, execFileSync("git", ["show", baseline.specificationRevision + ":" + file], { encoding: "utf8" }));
  const headings = [...ruleDocuments.get(file).matchAll(/^#{1,6} (.+)$/gmu)].map(match => match[1].toLowerCase().replace(/[`]/gu, "").replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/gu, "-"));
  assert.ok(headings.includes(item.specificationRule.section), item.id + ": missing pinned rule section");
}

async function rehearse(item) {
  const input = item.input;
  if (item.operation === "semantic-fragment") {
    const diagnostics = [];
    const manifests = new Map(Object.entries(input.documents).map(([kind, data]) => [kind, { file: kind + ".yaml", data }]));
    vm.runInNewContext(functions + '; validateProjectSet("case", manifests);', {
      manifests, validateArtifactNamespace, validateWorkflowStepNamespace,
      report: (file, message) => diagnostics.push({ file, message })
    }, { timeout: 1000 });
    assert.equal(diagnostics.length, item.maintenanceOracle.diagnosticCount, item.id + ": " + JSON.stringify(diagnostics));
    for (const fragment of item.maintenanceOracle.messageIncludes) assert.ok(diagnostics.some(entry => entry.message.includes(fragment)), item.id + ": missing oracle property " + fragment);
    return diagnostics;
  }
  if (item.operation === "workflow-namespace" || item.operation === "artifact-namespace") {
    const results = item.operation === "workflow-namespace"
      ? input.workflows.map(validateWorkflowStepNamespace)
      : input.assemblies.map(assembly => validateArtifactNamespace(assembly.tasks, assembly.handoffs));
    const codes = results.flatMap(result => result.diagnostics.map(diagnostic => diagnostic.code)).sort();
    assert.deepEqual(codes, item.expected.diagnostics.map(diagnostic => diagnostic.category).sort(), item.id);
    return codes;
  }
  if (item.operation === "manifest-schema") {
    const document = parseDocument(readFileSync(input.file, "utf8"), { uniqueKeys: true });
    assert.equal(document.errors.length, 0, item.id);
    const manifest = document.toJS({ maxAliasCount: 100 });
    const validate = byKind.get(manifest.kind);
    if (!validate) {
      assert.equal(item.expected.diagnostics[0]?.category, "unknown-kind", item.id);
      return "unknown-kind";
    }
    assert.equal(validate(manifest), item.expected.valid, item.id);
    for (const expected of item.expected.diagnostics) assert.ok((validate.errors ?? []).some(error => error.keyword === expected.category && error.instancePath === expected.instancePath
      && (!expected.missingProperty || error.params.missingProperty === expected.missingProperty)), item.id);
    return validate.errors;
  }
  if (item.operation === "local-schema") {
    const local = new Ajv2020({ allErrors: true, strict: false });
    for (const schema of input.schemas) local.addSchema(schema);
    let validate;
    try { validate = local.getSchema(input.entryId); } catch {
      assert.equal(item.expected.diagnostics[0]?.category, "unresolved-local-schema", item.id);
      return "unresolved-local-schema";
    }
    assert.ok(validate, item.id);
    assert.equal(validate(input.value), item.expected.valid, item.id);
    for (const expected of item.expected.diagnostics) assert.ok(validate.errors?.some(error => error.keyword === expected.category && error.instancePath === expected.instancePath), item.id);
    return validate.errors;
  }
  if (item.operation === "yaml-parse") {
    const document = parseDocument(input.yaml, { uniqueKeys: true });
    assert.equal(document.errors.length === 0, item.expected.valid, item.id);
    if (item.expected.diagnostics[0]?.category === "duplicate-key") assert.ok(document.errors.some(error => error.code === "DUPLICATE_KEY"));
    return document.errors.map(error => error.code);
  }
  if (item.operation === "discovery") {
    const args = input.args;
    const projectIndex = args.indexOf("--project");
    const files = args.flatMap((arg, index) => arg === "--file" ? [args[index + 1]] : []);
    const result = projectIndex !== -1
      ? await discoverFromProjectHints({ root: input.root, projectPath: args[projectIndex + 1] })
      : files.length ? await discoverManifestAssembly({ root: input.root, sources: files })
        : await discoverFromDirectory({ root: input.root });
    assert.equal(result.valid, item.expected.valid, item.id);
    assert.deepEqual(result.diagnostics.map(entry => entry.code).sort(), item.expected.diagnostics.map(entry => entry.code).sort(), item.id);
    if (item.expected.documentCount) assert.equal(result.assembly?.documents.length, item.expected.documentCount, item.id);
    if (item.expected.workflowIds) assert.deepEqual(result.assembly?.workflows.map(workflow => workflow.id), item.expected.workflowIds, item.id);
    return { valid: result.valid, codes: result.diagnostics.map(entry => entry.code), documents: result.assembly?.documents };
  }
  throw new Error("Unsupported library experiment");
}

for (const item of catalog.cases) {
  const before = JSON.stringify(item.input);
  const first = await rehearse(item);
  const second = await rehearse(item);
  assert.deepEqual(first, second, item.id + ": nondeterministic rehearsal");
  assert.equal(JSON.stringify(item.input), before, item.id + ": mutated input");
  const synthetic = { ...structuredClone(item.expected), caseId: item.id, operation: item.operation, checks: { runtime: "not-run", extensions: "not-run" } };
  assert.deepEqual(compareLibraryResult(item, synthetic), []);
  assert.ok(compareLibraryResult(item, { ...synthetic, valid: !synthetic.valid }).length);
  assert.ok(compareLibraryResult(item, { ...synthetic, checks: { runtime: "passed", extensions: "not-run" } }).includes("expanded-authority"));
  if (synthetic.diagnostics.length) {
    const mismatch = structuredClone(synthetic);
    mismatch.diagnostics[0] = { category: "wrong" };
    assert.ok(compareLibraryResult(item, mismatch).length);
  }
}
for (const field of ["specificationRevision", "sourceCorpusSha256"]) {
  const changed = structuredClone(catalog);
  changed[field] = "0".repeat(field === "specificationRevision" ? 40 : 64);
  assert.ok(catalogErrors(changed, baseline).includes("stale-baseline"));
}
const duplicate = structuredClone(catalog);
duplicate.cases.push(duplicate.cases[0]);
assert.ok(catalogErrors(duplicate, baseline).includes("invalid-case-id"));
const unknown = structuredClone(catalog);
unknown.cases[0].operation = "runtime";
assert.ok(catalogErrors(unknown, baseline).includes("unsupported-operation"));
const alteredInput = structuredClone(catalog);
alteredInput.files[0].sha256 = "0".repeat(64);
assert.ok(catalogErrors(alteredInput, baseline).includes("invalid-source-file"));
const missing = structuredClone(catalog);
missing.cases = missing.cases.filter(item => !(item.operation === "manifest-schema" && item.expected.valid));
assert.ok(catalogErrors(missing, baseline).includes("missing-maintained-examples"));
assert.deepEqual(verifyCorpus(), []);
console.log(`Shared library packet rehearsal passed for ${catalog.cases.length} cases, twice, with unchanged inputs.`);
console.log("Historical maintenance-library evidence only; no candidate, full semantic validation or runtime authority is claimed.");
