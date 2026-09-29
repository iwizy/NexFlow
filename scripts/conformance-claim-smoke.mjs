#!/usr/bin/env node

import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "fixtures", "conformance");
const registryPath = path.join(fixtureRoot, "index.json");
const schema = JSON.parse(
  await readFile(path.join(root, "conformance", "conformance-claim.schema.json"), "utf8")
);
const humanTemplate = await readFile(
  path.join(root, "conformance", "CONFORMANCE-CLAIM.template.md"),
  "utf8"
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const failures = [];
let checkCount = 0;
const localHomePathPattern = /(?:^|[\s"'])\/(?:Users|home)\//u;
const privateKeyMarkerPattern = /BEGIN[ ][A-Z ]*PRIVATE[ ]KEY/u;

const levelNames = [
  "NF-MANIFEST",
  "NF-SCHEMA",
  "NF-SEMANTIC",
  "NF-CLI",
  "NF-RUNTIME",
  "NF-EXTENSION"
];
const requiredHeadings = [
  "## Claim Metadata",
  "## Subject",
  "## Evaluated Scope",
  "## Level Claims",
  "## Validation Behavior",
  "## Enforcement Behavior",
  "## Overall Limitations",
  "## Evidence",
  "## Attestation"
];

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

function sameValues(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function containedPath(parent, relative) {
  if (typeof relative !== "string" || relative.length === 0 || path.isAbsolute(relative)) return null;
  const normalized = relative.replaceAll("\\", "/");
  if (normalized.split("/").includes("..")) return null;
  const resolved = path.resolve(parent, relative);
  return resolved.startsWith(`${path.resolve(parent)}${path.sep}`) ? resolved : null;
}

function pointerSegments(pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/") || pointer === "/") {
    throw new Error("patch path must be a non-root JSON Pointer");
  }

  return pointer.slice(1).split("/").map((segment) => {
    if (/~(?:[^01]|$)/u.test(segment)) throw new Error("patch path contains an invalid JSON Pointer escape");
    const decoded = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    if (["__proto__", "prototype", "constructor"].includes(decoded)) {
      throw new Error("patch path contains a forbidden object key");
    }
    return decoded;
  });
}

function arrayIndex(token, length, allowEnd = false) {
  if (!/^(?:0|[1-9][0-9]*)$/u.test(token)) throw new Error("array path token must be an index");
  const index = Number(token);
  if (!Number.isSafeInteger(index) || index < 0 || index > length || (!allowEnd && index === length)) {
    throw new Error("array path index is outside the target");
  }
  return index;
}

function applyPatch(source, operations) {
  const result = structuredClone(source);

  for (const operation of operations) {
    const segments = pointerSegments(operation.path);
    const key = segments.at(-1);
    let parent = result;

    for (const segment of segments.slice(0, -1)) {
      if (Array.isArray(parent)) {
        parent = parent[arrayIndex(segment, parent.length)];
      } else if (parent && typeof parent === "object" && Object.hasOwn(parent, segment)) {
        parent = parent[segment];
      } else {
        throw new Error("patch path does not resolve to an existing parent");
      }
    }

    if (!parent || typeof parent !== "object") {
      throw new Error("patch parent is not an object or array");
    }

    if (Array.isArray(parent)) {
      if (operation.op === "add") {
        if (key === "-") parent.push(structuredClone(operation.value));
        else parent.splice(arrayIndex(key, parent.length, true), 0, structuredClone(operation.value));
      } else {
        const index = arrayIndex(key, parent.length);
        if (operation.op === "replace") parent[index] = structuredClone(operation.value);
        else parent.splice(index, 1);
      }
      continue;
    }

    if (operation.op === "add") {
      parent[key] = structuredClone(operation.value);
    } else {
      if (!Object.hasOwn(parent, key)) throw new Error("patch target property does not exist");
      if (operation.op === "replace") parent[key] = structuredClone(operation.value);
      else delete parent[key];
    }
  }

  return result;
}

function matchesExpectedError(error, expected) {
  if (error.keyword !== expected.keyword || error.instancePath !== expected.instancePath) return false;
  return Object.entries(expected.params ?? {}).every(
    ([name, value]) => sameValues(error.params?.[name], value)
  );
}

async function fixtureFiles(directory) {
  const files = [];

  async function visit(current, relative = "") {
    for (const entry of (await readdir(current, { withFileTypes: true }))
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(path.join(current, entry.name), childRelative);
      else if (/\.ya?ml$/u.test(entry.name)) files.push(childRelative);
    }
  }

  await visit(directory);
  return files;
}

let registry;
try {
  registry = JSON.parse(await readFile(registryPath, "utf8"));
} catch (error) {
  console.error(`Unable to read conformance fixture catalog: ${error.message}`);
  process.exit(1);
}

check("fixture registry has the supported draft format", registry.formatVersion === "0.1-draft");
check("fixture registry has a non-empty case list", Array.isArray(registry.cases) && registry.cases.length > 0);
check("fixture registry fields are closed",
  sameValues(Object.keys(registry).sort(), ["cases", "formatVersion"]));

const caseFields = ["base", "description", "expected", "id", "patch"];
const caseIds = new Set();
const referencedBases = new Set();

for (const fixtureCase of registry.cases ?? []) {
  const caseId = fixtureCase.id ?? "<missing-id>";
  const expected = fixtureCase.expected ?? {};
  const expectedFields = expected.valid === true
    ? ["valid"]
    : ["instancePath", "keyword", "params", "valid"].filter(
      (field) => field !== "params" || Object.hasOwn(expected, "params")
    );

  check(`${caseId}: case fields are closed`,
    sameValues(Object.keys(fixtureCase).sort(), caseFields));
  check(`${caseId}: id is stable and unique`,
    typeof fixtureCase.id === "string"
      && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(fixtureCase.id)
      && !caseIds.has(fixtureCase.id));
  caseIds.add(fixtureCase.id);
  check(`${caseId}: description is public and useful`,
    typeof fixtureCase.description === "string" && fixtureCase.description.length >= 24);
  const serializedCase = JSON.stringify(fixtureCase);
  check(`${caseId}: catalog data contains no local path or private key marker`,
    !localHomePathPattern.test(serializedCase) && !privateKeyMarkerPattern.test(serializedCase));
  check(`${caseId}: expected result fields are closed`,
    sameValues(Object.keys(expected).sort(), expectedFields.sort()));
  check(`${caseId}: expected validity is explicit`, typeof expected.valid === "boolean");
  check(`${caseId}: valid cases do not mutate their base`,
    expected.valid !== true || (Array.isArray(fixtureCase.patch) && fixtureCase.patch.length === 0));
  check(`${caseId}: invalid cases declare an expected schema error`,
    expected.valid !== false
      || (typeof expected.keyword === "string" && typeof expected.instancePath === "string"
        && (!Object.hasOwn(expected, "params")
          || (expected.params && typeof expected.params === "object" && !Array.isArray(expected.params)))));

  const base = containedPath(fixtureRoot, fixtureCase.base);
  check(`${caseId}: base path is contained by the fixture corpus`,
    base !== null && /\.ya?ml$/u.test(fixtureCase.base ?? ""));
  if (base) referencedBases.add(fixtureCase.base);

  const patchSupported = Array.isArray(fixtureCase.patch) && fixtureCase.patch.every((operation) => {
    if (!operation || typeof operation !== "object" || !["add", "remove", "replace"].includes(operation.op)) {
      return false;
    }
    const fields = operation.op === "remove" ? ["op", "path"] : ["op", "path", "value"];
    try {
      pointerSegments(operation.path);
    } catch {
      return false;
    }
    return sameValues(Object.keys(operation).sort(), fields.sort());
  });
  check(`${caseId}: patch is a supported JSON Patch subset`, patchSupported);

  if (!base || !patchSupported || typeof expected.valid !== "boolean") continue;

  let source;
  try {
    check(`${caseId}: base fixture is a regular file`, (await lstat(base)).isFile());
    source = await readFile(base, "utf8");
  } catch {
    failures.push(`${caseId}: base fixture can be read`);
    continue;
  }

  check(`${caseId}: base fixture contains no local path or private key marker`,
    !localHomePathPattern.test(source) && !privateKeyMarkerPattern.test(source));

  const document = parseDocument(source, { maxAliasCount: 20, uniqueKeys: true });
  check(`${caseId}: base fixture is valid YAML`, document.errors.length === 0);
  if (document.errors.length > 0) continue;

  let claim;
  try {
    claim = applyPatch(document.toJS({ maxAliasCount: 20 }), fixtureCase.patch);
  } catch (error) {
    failures.push(`${caseId}: catalog patch applies cleanly (${error.message})`);
    continue;
  }

  const actual = validate(claim);
  const errors = validate.errors ?? [];
  check(`${caseId}: schema validity matches the catalog`, actual === expected.valid);
  if (expected.valid === false) {
    check(`${caseId}: rejection matches the cataloged schema boundary`,
      errors.some((error) => matchesExpectedError(error, expected)));
  }
}

for (const file of await fixtureFiles(fixtureRoot)) {
  check(`${file}: base fixture is represented in the catalog`, referencedBases.has(file));
}

const templateSource = await readFile(
  path.join(root, "conformance", "conformance-claim.template.yaml"),
  "utf8"
);
const templateDocument = parseDocument(templateSource, { maxAliasCount: 20, uniqueKeys: true });
check("maintained YAML template parses without errors", templateDocument.errors.length === 0);
if (templateDocument.errors.length === 0) {
  check("maintained YAML template satisfies the claim schema",
    validate(templateDocument.toJS({ maxAliasCount: 20 })));
}

for (const marker of [...requiredHeadings, ...levelNames]) {
  check(`human-readable template includes ${marker}`, humanTemplate.includes(marker));
}

const validatorClaimSource = await readFile(
  path.join(root, "conformance", "repository-validator-claim.yaml"),
  "utf8"
);
const validatorClaimMarkdown = await readFile(
  path.join(root, "conformance", "REPOSITORY-VALIDATOR-CLAIM.md"),
  "utf8"
);
const validatorClaimDocument = parseDocument(validatorClaimSource, {
  maxAliasCount: 0,
  uniqueKeys: true
});
check("repository-validator claim parses without errors", validatorClaimDocument.errors.length === 0);
check("repository-validator forms contain no local path or private key marker",
  !localHomePathPattern.test(validatorClaimSource + validatorClaimMarkdown)
    && !privateKeyMarkerPattern.test(validatorClaimSource + validatorClaimMarkdown));

if (validatorClaimDocument.errors.length === 0) {
  const claim = validatorClaimDocument.toJS({ maxAliasCount: 0 });
  const revision = claim.subject?.version;
  check("repository-validator claim satisfies the claim schema", validate(claim));
  check("repository-validator statement remains a draft about a validator",
    claim.metadata?.status === "draft" && claim.subject?.type === "validator");
  check("repository-validator subject is pinned to a full commit",
    typeof revision === "string" && /^[0-9a-f]{40}$/u.test(revision));
  check("repository-validator schema and evidence revisions match the subject",
    claim.scope?.schemaSnapshots?.length === 1
      && claim.scope.schemaSnapshots[0].revision === revision
      && claim.claims?.["NF-SCHEMA"]?.evidence?.length > 0
      && claim.claims["NF-SCHEMA"].evidence.every((item) => item.revision === revision));
  check("repository-validator claim is limited to partial structural support",
    claim.claims?.["NF-SCHEMA"]?.status === "partial"
      && claim.claims?.["NF-SEMANTIC"]?.status === "unsupported"
      && claim.claims?.["NF-CLI"]?.status === "unsupported"
      && claim.claims?.["NF-RUNTIME"]?.status === "not-applicable");

  for (const value of [claim.claimVersion, claim.metadata?.id, claim.metadata?.issuedAt,
    claim.metadata?.status, claim.subject?.name, revision]) {
    check(`repository-validator Markdown includes ${value}`,
      typeof value === "string" && validatorClaimMarkdown.includes(value));
  }
  for (const kind of claim.scope?.manifestKinds ?? []) {
    check(`repository-validator Markdown includes manifest kind ${kind}`,
      validatorClaimMarkdown.includes(`\`${kind}\``));
  }
  for (const item of claim.claims?.["NF-SCHEMA"]?.evidence ?? []) {
    check(`repository-validator Markdown includes evidence URI ${item.uri}`,
      typeof item.uri === "string" && validatorClaimMarkdown.includes(item.uri));
  }
  check("repository-validator Markdown states the empty profile and extension scope",
    claim.scope?.profiles?.length === 0
      && claim.scope?.extensionNamespaces?.length === 0
      && validatorClaimMarkdown.includes("**Profiles:** none claimed")
      && validatorClaimMarkdown.includes("**Extension namespaces:** none claimed"));
  for (const marker of requiredHeadings) {
    check(`repository-validator Markdown includes ${marker}`,
      validatorClaimMarkdown.includes(marker));
  }
  for (const level of levelNames) {
    check(`repository-validator Markdown matches ${level} status`,
      validatorClaimMarkdown.includes(`| \`${level}\` | \`${claim.claims?.[level]?.status}\` |`));
  }
}

if (failures.length > 0) {
  console.error(`Conformance claim checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Conformance claim checks passed for ${registry.cases.length} cataloged fixture cases and ${checkCount} assertions.`
  );
  console.log(
    `Maintained templates and the draft validator statement include ${requiredHeadings.length} required sections and ${levelNames.length} conformance levels.`
  );
  console.log(
    "These checks validate claim structure and cataloged rejection boundaries, not external evidence or implementation conformance."
  );
}
