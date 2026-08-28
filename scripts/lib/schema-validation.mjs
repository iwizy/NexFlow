import { readdir, readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { SUPPORTED_MANIFEST_KINDS } from "./manifest-discovery.mjs";

export const MAX_SCHEMA_DIAGNOSTICS = 200;
const schemaDirectory = new URL("../../schemas/", import.meta.url);
const supportedKinds = new Set(SUPPORTED_MANIFEST_KINDS);
const messages = new Map([
  ["required", "Required field is missing."],
  ["type", "Field has an invalid type."],
  ["enum", "Field must use a supported value."],
  ["const", "Field does not match the required value."],
  ["pattern", "Field does not match the required pattern."],
  ["format", "Field does not match the required format."],
  ["additionalProperties", "An undeclared field is not allowed here."],
  ["minLength", "Field is too short."],
  ["maxLength", "Field is too long."],
  ["minItems", "Array has too few items."],
  ["maxItems", "Array has too many items."],
  ["uniqueItems", "Array items must be unique."],
  ["minimum", "Number is below the allowed minimum."],
  ["maximum", "Number exceeds the allowed maximum."],
  ["oneOf", "Field must match exactly one allowed shape."],
  ["anyOf", "Field must match an allowed shape."],
  ["not", "Field uses a disallowed shape."],
  ["if", "Field does not satisfy a conditional rule."]
]);

function collectPropertyNames(value, names) {
  if (value === null || typeof value !== "object") return;
  for (const name of Object.keys(value.properties ?? {})) names.add(name);
  for (const child of Object.values(value)) collectPropertyNames(child, names);
}

// Only repository-owned schemas enter this registry; manifest $schema values are inert.
export function compileSchemaRegistry(schemas) {
  const ajv = new Ajv2020({
    allErrors: true, strict: false, ownProperties: true,
    coerceTypes: false, useDefaults: false, removeAdditional: false
  });
  addFormats(ajv);
  const ids = new Set();
  const schemaByKind = new Map();
  const propertyNames = new Set();
  for (const schema of schemas) {
    if (typeof schema?.$id !== "string" || !schema.$id.trim() || ids.has(schema.$id)) {
      throw new Error("Invalid local schema identity");
    }
    ids.add(schema.$id);
    ajv.addSchema(schema);
    collectPropertyNames(schema, propertyNames);
    const kind = schema.properties?.kind?.const;
    if (kind === undefined) continue;
    if (!supportedKinds.has(kind) || schemaByKind.has(kind)) throw new Error("Invalid local schema kind");
    schemaByKind.set(kind, schema.$id);
  }
  if (schemaByKind.size !== supportedKinds.size) throw new Error("Incomplete local schema registry");
  const validators = new Map();
  for (const id of ids) {
    const validator = ajv.getSchema(id);
    if (typeof validator !== "function" || validator.$async) throw new Error("Invalid local schema validator");
    validators.set(id, validator);
  }
  return {
    byKind: new Map([...schemaByKind].map(([kind, id]) => [kind, validators.get(id)])),
    propertyNames
  };
}

export async function loadRepositorySchemaRegistry() {
  const entries = await readdir(schemaDirectory, { withFileTypes: true });
  const names = entries.filter((entry) => entry.name.endsWith(".schema.json"));
  if (names.some((entry) => !entry.isFile())) throw new Error("Unsafe local schema entry");
  const schemas = [];
  for (const name of names.map((entry) => entry.name).sort()) {
    schemas.push(JSON.parse(await readFile(new URL(name, schemaDirectory), "utf8")));
  }
  return compileSchemaRegistry(schemas);
}

function fieldPath(error, manifest, propertyNames) {
  const segments = error.instancePath === "" ? [] : error.instancePath.slice(1).split("/");
  let value = manifest;
  const safe = segments.map((segment) => {
    const name = segment.replace(/~1/gu, "/").replace(/~0/gu, "~");
    const allowed = Array.isArray(value) ? /^(0|[1-9][0-9]*)$/u.test(name) : propertyNames.has(name);
    value = value !== null && typeof value === "object" && Object.hasOwn(value, name) ? value[name] : undefined;
    return allowed ? name : "<redacted>";
  });
  if (error.keyword === "required") {
    const name = error.params.missingProperty;
    safe.push(propertyNames.has(name) ? name : "<redacted>");
  } else if (error.keyword === "additionalProperties") {
    safe.push("<redacted>");
  }
  const pointer = safe.map((segment) => `/${segment.replace(/~/gu, "~0").replace(/\//gu, "~1")}`).join("");
  return pointer.length > 512 ? "<redacted-field>" : pointer;
}

export function validateManifestAssembly(assembly, registry) {
  if (!assembly?.loadedDocuments?.length || assembly.specVersion !== "0.1") {
    throw new Error("A discovered assembly is required");
  }
  const diagnostics = [];
  let valid = true;
  let truncated = false;
  for (const { source, manifest } of assembly.loadedDocuments) {
    const validate = registry.byKind.get(manifest.kind);
    if (!validate) throw new Error("Missing local schema validator");
    if (validate(manifest)) continue;
    valid = false;
    if (!validate.errors?.length) throw new Error("Missing schema failure details");
    for (const error of validate.errors) {
      if (diagnostics.length === MAX_SCHEMA_DIAGNOSTICS) {
        truncated = true;
        break;
      }
      const keyword = messages.has(error.keyword) ? error.keyword : "schema";
      diagnostics.push({
        code: "NF-SCHEMA", severity: "error", source, kind: manifest.kind,
        instancePath: fieldPath(error, manifest, registry.propertyNames), keyword,
        message: messages.get(keyword) ?? "Field does not satisfy a schema constraint."
      });
    }
  }
  return { valid, diagnostics, truncated, documentCount: assembly.loadedDocuments.length };
}
