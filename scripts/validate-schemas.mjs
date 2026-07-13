import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = path.join(root, "schemas");
const examplesDirectory = path.join(root, "examples");
const diagnostics = [];

function relative(file) {
  return path.relative(root, file) || ".";
}

function report(file, code, message) {
  diagnostics.push({ file: relative(file), code, message });
}

async function filesUnder(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(entryPath, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

const schemaFiles = await filesUnder(schemaDirectory, (name) => name.endsWith(".schema.json"));
const manifestFiles = await filesUnder(examplesDirectory, (name) => /\.ya?ml$/u.test(name));
const schemas = [];

for (const file of schemaFiles) {
  try {
    const schema = JSON.parse(await readFile(file, "utf8"));
    if (typeof schema.$id !== "string" || schema.$id.length === 0) {
      report(file, "NF-SCHEMA", "schema must declare a non-empty $id");
      continue;
    }
    schemas.push({ file, schema });
  } catch (error) {
    report(file, "NF-SYNTAX", `invalid JSON: ${error.message}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schemaByKind = new Map();
const validatorBySchemaId = new Map();

for (const { file, schema } of schemas) {
  try {
    ajv.addSchema(schema);
  } catch (error) {
    report(file, "NF-SCHEMA", `schema registration failed: ${error.message}`);
    continue;
  }

  const kind = schema.properties?.kind?.const;
  if (typeof kind !== "string") continue;

  if (schemaByKind.has(kind)) {
    report(file, "NF-SCHEMA", `duplicate schema declaration for manifest kind ${JSON.stringify(kind)}`);
  } else {
    schemaByKind.set(kind, { file, schemaId: schema.$id });
  }
}

for (const { file, schema } of schemas) {
  try {
    const validate = ajv.getSchema(schema.$id);
    if (!validate) {
      report(file, "NF-SCHEMA", `schema could not be compiled for $id ${JSON.stringify(schema.$id)}`);
    } else {
      validatorBySchemaId.set(schema.$id, validate);
    }
  } catch (error) {
    report(file, "NF-SCHEMA", `schema compilation failed: ${error.message}`);
  }
}

let validatedManifests = 0;

for (const file of manifestFiles) {
  let manifest;

  try {
    const document = parseDocument(await readFile(file, "utf8"), {
      maxAliasCount: 100,
      uniqueKeys: true
    });

    if (document.errors.length > 0) {
      for (const error of document.errors) {
        report(file, "NF-SYNTAX", error.message.split("\n", 1)[0]);
      }
      continue;
    }

    manifest = document.toJS({ maxAliasCount: 100 });
  } catch (error) {
    report(file, "NF-SYNTAX", `invalid YAML: ${error.message}`);
    continue;
  }

  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    report(file, "NF-SYNTAX", "manifest root must be a mapping");
    continue;
  }

  const kind = manifest.kind;
  if (typeof kind !== "string" || kind.length === 0) {
    report(file, "NF-SCHEMA", "manifest must declare a non-empty string kind");
    continue;
  }

  const schemaEntry = schemaByKind.get(kind);
  if (!schemaEntry) {
    report(file, "NF-SCHEMA", `no schema declares manifest kind ${JSON.stringify(kind)}`);
    continue;
  }

  const validate = validatorBySchemaId.get(schemaEntry.schemaId);
  if (!validate) {
    report(file, "NF-SCHEMA", `schema for manifest kind ${JSON.stringify(kind)} is unavailable`);
    continue;
  }

  validatedManifests += 1;
  if (validate(manifest)) continue;

  for (const error of validate.errors ?? []) {
    const instancePath = error.instancePath || "/";
    const schemaPath = error.schemaPath ? ` [${error.schemaPath}]` : "";
    report(file, "NF-SCHEMA", `${instancePath} ${error.message ?? "is invalid"}${schemaPath}`);
  }
}

if (diagnostics.length > 0) {
  console.error(`NexFlow schema validation failed with ${diagnostics.length} diagnostic(s):`);
  for (const diagnostic of diagnostics) {
    console.error(`${diagnostic.file}\n  ${diagnostic.code}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${validatedManifests} manifests against ${schemaByKind.size} schemas.`);
  console.log("Schema validation passed. Semantic validation was not performed.");
}
