#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = path.join(root, "schemas");
const fixtureDirectory = path.join(root, "fixtures", "schema", "invalid");
const catalogPath = path.join(fixtureDirectory, "index.json");
const diagnostics = [];

function report(caseId, message) {
  diagnostics.push({ caseId, message });
}

const schemaFiles = (await readdir(schemaDirectory))
  .filter((name) => name.endsWith(".schema.json"))
  .sort();
const fixtureFiles = (await readdir(fixtureDirectory))
  .filter((name) => /\.ya?ml$/u.test(name))
  .sort();

let catalog;

try {
  catalog = JSON.parse(await readFile(catalogPath, "utf8"));
} catch (error) {
  console.error(`Unable to read negative fixture catalog: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(catalog.cases) || catalog.cases.length === 0) {
  console.error("Negative fixture catalog must declare a non-empty cases array.");
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schemaByKind = new Map();

for (const name of schemaFiles) {
  const file = path.join(schemaDirectory, name);
  const schema = JSON.parse(await readFile(file, "utf8"));
  ajv.addSchema(schema);

  const kind = schema.properties?.kind?.const;
  if (typeof kind === "string") {
    schemaByKind.set(kind, schema.$id);
  }
}

const catalogFiles = new Set();
const caseIds = new Set();

for (const testCase of catalog.cases) {
  const caseId = testCase?.id ?? "<missing-id>";
  const fileName = testCase?.file;
  const expected = testCase?.expected;

  if (caseIds.has(caseId)) {
    report(caseId, "catalog contains a duplicate case ID");
  }
  caseIds.add(caseId);

  if (typeof fileName !== "string" || !fixtureFiles.includes(fileName)) {
    report(caseId, `catalog references missing fixture ${JSON.stringify(fileName)}`);
    continue;
  }
  if (catalogFiles.has(fileName)) {
    report(caseId, `fixture ${JSON.stringify(fileName)} is listed more than once`);
  }
  catalogFiles.add(fileName);

  if (!expected || expected.code !== "NF-SCHEMA") {
    report(caseId, "expected result must declare code NF-SCHEMA");
    continue;
  }

  const file = path.join(fixtureDirectory, fileName);
  const document = parseDocument(await readFile(file, "utf8"), {
    maxAliasCount: 100,
    uniqueKeys: true
  });

  if (document.errors.length > 0) {
    report(caseId, `fixture must be valid YAML: ${document.errors[0].message.split("\n", 1)[0]}`);
    continue;
  }

  const manifest = document.toJS({ maxAliasCount: 100 });
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    report(caseId, "fixture root must be a mapping");
    continue;
  }

  if (manifest.kind !== expected.kind) {
    report(
      caseId,
      `catalog expects kind ${JSON.stringify(expected.kind)}, fixture declares ${JSON.stringify(manifest.kind)}`
    );
    continue;
  }

  const schemaId = schemaByKind.get(manifest.kind);

  if (expected.reason === "unknown_kind") {
    if (schemaId) {
      report(caseId, `expected unknown kind, but schema ${JSON.stringify(schemaId)} now declares it`);
    }
    continue;
  }

  if (!schemaId) {
    report(caseId, `no schema declares expected kind ${JSON.stringify(manifest.kind)}`);
    continue;
  }

  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    report(caseId, `schema ${JSON.stringify(schemaId)} could not be compiled`);
    continue;
  }

  if (validate(manifest)) {
    report(caseId, "fixture unexpectedly passed schema validation");
    continue;
  }

  const matched = (validate.errors ?? []).some((error) => {
    if (error.keyword !== expected.keyword) return false;
    if (error.instancePath !== expected.instancePath) return false;
    if (
      typeof expected.missingProperty === "string"
      && error.params?.missingProperty !== expected.missingProperty
    ) {
      return false;
    }
    return true;
  });

  if (!matched) {
    report(
      caseId,
      `fixture failed for an unexpected reason: ${JSON.stringify(validate.errors ?? [])}`
    );
  }
}

for (const fileName of fixtureFiles) {
  if (!catalogFiles.has(fileName)) {
    report("<catalog>", `fixture ${JSON.stringify(fileName)} is not listed in index.json`);
  }
}

if (diagnostics.length > 0) {
  console.error(`Negative schema fixture checks failed with ${diagnostics.length} diagnostic(s):`);
  for (const diagnostic of diagnostics) {
    console.error(`${diagnostic.caseId}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
} else {
  const categories = new Set(catalog.cases.map((testCase) => testCase.category));
  console.log(
    `Negative schema fixture checks passed for ${catalog.cases.length} cases across ${categories.size} categories.`
  );
  console.log("Fixtures are intentionally invalid and are not reference examples.");
}
