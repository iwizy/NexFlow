#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

const schema = JSON.parse(
  await readFile("extensions/registry.schema.json", "utf8")
);
const source = await readFile("extensions/registry.example.yaml", "utf8");
const document = parseDocument(source, { maxAliasCount: 20, uniqueKeys: true });

if (document.errors.length > 0) {
  console.error("Extension registry example is not valid YAML.");
  console.error(document.errors.map((error) => error.message).join("\n"));
  process.exit(1);
}

const example = document.toJS({ maxAliasCount: 20 });
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const failures = [];
let assertionCount = 0;

function check(name, condition) {
  assertionCount += 1;
  if (!condition) failures.push(name);
}

function clone(value) {
  return structuredClone(value);
}

function schemaCase(name, mutate, expected) {
  const value = clone(example);
  mutate(value);
  const actual = validate(value);
  check(`${name}: expected schema validity ${expected}`, actual === expected);
}

function semanticErrors(registry) {
  const errors = [];
  const namespaces = registry.entries.map((entry) => entry.namespace);
  const unique = new Set(namespaces);
  if (unique.size !== namespaces.length) errors.push("duplicate namespace");

  const sorted = [...namespaces].sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(namespaces) !== JSON.stringify(sorted)) {
    errors.push("entries are not ordered lexically by namespace");
  }

  for (const entry of registry.entries) {
    if (entry.namespace.startsWith("io.nexflow.") && entry.owner.type !== "project") {
      errors.push(`${entry.namespace} does not identify project ownership`);
    }
  }
  return errors;
}

check("fictional registry example passes its schema", validate(example));
check("fictional registry example passes semantic ordering checks",
  semanticErrors(example).length === 0);
check("example stays visibly fictional",
  example.metadata.registryId.startsWith("example-")
    && example.entries.every((entry) => entry.namespace.startsWith("com.example.")));

const serialized = JSON.stringify(example);
check("example contains no local home path", !/(?:^|[\s"'])\/(?:Users|home)\//u.test(serialized));
check("example contains no private key marker", !/BEGIN[ ][A-Z ]*PRIVATE[ ]KEY/u.test(serialized));
check("example contains no credential value field",
  !/(?:token|password|secret|privateKey)(?:Value)?/iu.test(serialized));

schemaCase("unknown top-level field", (value) => {
  value.install = "npm install unsafe-package";
}, false);
schemaCase("unknown entry field", (value) => {
  value.entries[0].package = "unsafe-package";
}, false);
schemaCase("invalid namespace", (value) => {
  value.entries[0].namespace = "Issue Tracker";
}, false);
schemaCase("mutable profile revision", (value) => {
  value.entries[0].profile.source.revision = "main";
}, false);
schemaCase("unsafe profile path", (value) => {
  value.entries[0].profile.source.path = "../profile.yaml";
}, false);
schemaCase("invalid profile digest", (value) => {
  value.entries[0].profile.source.sha256 = "sha256:unknown";
}, false);
schemaCase("empty supported spec versions", (value) => {
  value.entries[0].compatibility.specVersions = [];
}, false);
schemaCase("stable lifecycle with draft profile", (value) => {
  value.entries[0].lifecycle = "stable";
}, false);
schemaCase("published entry without publication time", (value) => {
  value.entries[0].publication.status = "published";
}, false);
schemaCase("verified owner without evidence", (value) => {
  value.entries[0].owner.verification.status = "registry_verified";
}, false);
schemaCase("published entry with publication time", (value) => {
  value.entries[0].publication = {
    status: "published",
    publishedAt: "2026-09-20T00:00:00Z"
  };
}, true);
schemaCase("verified owner with method and evidence", (value) => {
  value.entries[0].owner.verification = {
    status: "registry_verified",
    method: "repository",
    evidence: "https://example.invalid/verification/issue-tracker"
  };
}, true);

const duplicateRegistry = clone(example);
duplicateRegistry.entries.push(clone(duplicateRegistry.entries[0]));
check("schema alone does not claim namespace uniqueness", validate(duplicateRegistry));
check("semantic check rejects duplicate namespaces",
  semanticErrors(duplicateRegistry).includes("duplicate namespace"));

const unorderedRegistry = clone(example);
const earlierEntry = clone(unorderedRegistry.entries[0]);
earlierEntry.namespace = "com.example.aaa";
unorderedRegistry.entries.push(earlierEntry);
check("schema accepts independently valid unordered entries", validate(unorderedRegistry));
check("semantic check rejects unordered entries",
  semanticErrors(unorderedRegistry).includes("entries are not ordered lexically by namespace"));

const reservedNamespaceRegistry = clone(example);
reservedNamespaceRegistry.entries[0].namespace = "io.nexflow.example";
check("reserved namespace is structurally representable", validate(reservedNamespaceRegistry));
check("reserved namespace needs project ownership evidence",
  semanticErrors(reservedNamespaceRegistry).includes(
    "io.nexflow.example does not identify project ownership"
  ));

if (failures.length > 0) {
  console.error("Extension registry smoke checks failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Extension registry smoke checks passed (${assertionCount} assertions).`);
