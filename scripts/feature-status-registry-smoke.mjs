#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = "docs/feature-status-registry.md";
const markdown = readFileSync(registryPath, "utf8");
const lifecycles = new Set(["Accepted", "Draft", "Experimental", "Deprecated", "Planned"]);
const expected = new Map();
const rfcStages = new Map();
const slug = (value) => value.replace(/([a-z])([A-Z])/gu, "$1-$2").toLowerCase();

function expect(id, lifecycle, citation, annotation = null) {
  assert(!expected.has(id), `Duplicate derived inventory identity: ${id}`);
  expected.set(id, { lifecycle, citation, annotation });
}

function walkDeprecations(value, pointer, file) {
  if (!value || typeof value !== "object") return;
  if (value.deprecated === true) {
    const field = pointer.split("/").at(-1);
    expect(`legacy:${file.replace(".schema.json", "")}-${slug(field)}`,
      "Deprecated", `../schemas/${file}`, `${file}#${pointer}`);
  }
  for (const [key, child] of Object.entries(value)) {
    const token = key.replaceAll("~", "~0").replaceAll("/", "~1");
    walkDeprecations(child, `${pointer}/${token}`, file);
  }
}

for (const file of readdirSync("schemas").filter((name) => name.endsWith(".schema.json")).sort()) {
  const schema = JSON.parse(readFileSync(`schemas/${file}`, "utf8"));
  const kind = schema.properties?.kind?.const;
  // The current 0.1 kind contracts are draft, independently of accepted foundations.
  if (kind) expect(`kind:${kind}`, "Draft", `../schemas/${file}`);
  walkDeprecations(schema, "", file);
}

for (const file of readdirSync("rfcs").filter((name) => /^RFC-\d{4}-.+\.md$/u.test(name)).sort()) {
  const source = readFileSync(`rfcs/${file}`, "utf8");
  const id = file.match(/^RFC-\d{4}/u)[0];
  const stage = source.match(/^## Status\s+([A-Za-z]+)/mu)?.[1];
  assert(["Accepted", "Draft"].includes(stage), `${id}: a changed RFC stage needs explicit lifecycle review`);
  rfcStages.set(id, stage);
  expect(`rfc:${id}`, stage, `../rfcs/${file}`);
}

expect("experiment:repository-cli", "Experimental", "cli-prototype.md");
for (const entry of readdirSync("evaluation/prototypes", { withFileTypes: true })) {
  if (entry.isDirectory()) expect(`experiment:candidate-${entry.name}`, "Experimental",
    `../evaluation/prototypes/${entry.name}/README.md`);
}
for (const entry of readdirSync("extensions", { withFileTypes: true })) {
  if (entry.isDirectory()) expect(`experiment:extension-${entry.name}`, "Experimental",
    `../extensions/${entry.name}/README.md`);
}

const planned = {
  "reference-cli": "reference-cli.md",
  runtime: "runtime-options.md",
  "provider-adapters": "provider-adapter-boundary.md",
  "extension-loading": "extension-loading-boundary.md",
  "schema-artifact": "schema-bundle-publication.md",
  "manifest-bundles": "../rfcs/RFC-0012-manifest-bundling.md",
  "agent-assembly": "agent-assembly.md",
  "full-semantic-validation": "semantic-reference-inventory.md"
};
for (const [id, citation] of Object.entries(planned)) expect(`planned:${id}`, "Planned", citation);

function verifyRegistry(text, index = readFileSync("rfcs/README.md", "utf8")) {
  const errors = [];
  const seen = new Set();
  for (const line of text.split("\n").filter((row) => row.startsWith("| `"))) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = cells[0]?.match(/^`([^`]+)`$/u)?.[1];
    if (cells.length !== 4 || !id || !cells[1] || !cells[3]) {
      errors.push("Malformed row or missing scope/evidence boundary.");
      continue;
    }
    if (seen.has(id)) errors.push(`Duplicate row: ${id}`);
    seen.add(id);
    const record = expected.get(id);
    if (!record) { errors.push(`Unknown row: ${id}`); continue; }
    if (!lifecycles.has(cells[2])) errors.push(`Unknown lifecycle: ${id}`);
    if (cells[2] !== record.lifecycle) errors.push(`Lifecycle disagrees with owning evidence: ${id}`);
    const citations = [...cells[3].matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/gu)].map((match) => match[1]);
    if (!citations.includes(record.citation)) errors.push(`Missing owning source: ${id}`);
    if (record.annotation && !cells[3].includes(`\`${record.annotation}\``)) {
      errors.push(`Missing explicit deprecation annotation: ${id}`);
    }
    for (const citation of citations) {
      if (path.isAbsolute(citation) || /^[a-z][a-z\d+.-]*:/iu.test(citation)) {
        errors.push(`Owning evidence must be a local relative source: ${id}`);
        continue;
      }
      const target = path.resolve(root, "docs", citation.split("#", 1)[0]);
      const relative = path.relative(root, target);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || !existsSync(target)) {
        errors.push(`Missing or escaping source: ${id}`);
      }
    }
  }
  for (const id of expected.keys()) if (!seen.has(id)) errors.push(`Missing row: ${id}`);

  const indexed = new Set();
  for (const match of index.matchAll(/^\| \[(RFC-\d{4})\]\([^)]+\) \| [^|]+ \| ([A-Za-z]+)/gmu)) {
    const [, id, stage] = match;
    if (indexed.has(id) || !rfcStages.has(id)) errors.push(`Duplicate or unknown indexed RFC: ${id}`);
    indexed.add(id);
    if (rfcStages.get(id) !== stage) errors.push(`RFC index disagrees with source stage: ${id}`);
  }
  for (const id of rfcStages.keys()) if (!indexed.has(id)) errors.push(`Unindexed RFC: ${id}`);
  return errors;
}

assert.deepEqual(verifyRegistry(markdown), [], "Registry consistency");
const row = (id) => markdown.split("\n").find((line) => line.startsWith(`| \`${id}\` |`));
const remove = (id) => markdown.replace(`${row(id)}\n`, "");
const status = (id, from, to) => markdown.replace(row(id), row(id).replace(` | ${from} | `, ` | ${to} | `));
const firstKind = [...expected.keys()].find((id) => id.startsWith("kind:"));
const firstLegacy = [...expected.keys()].find((id) => id.startsWith("legacy:"));
const firstCandidate = [...expected.keys()].find((id) => id.startsWith("experiment:candidate-"));
const firstProfile = [...expected.keys()].find((id) => id.startsWith("experiment:extension-"));
const negatives = [
  remove(firstKind),
  `${markdown}\n${row(firstKind)}`,
  markdown.replace(row(firstKind), row(firstKind).replace(firstKind, "kind:UnknownKind")),
  status(firstKind, "Draft", "Stable"),
  status(firstKind, "Draft", "Accepted"),
  status("rfc:RFC-0003", "Draft", "Accepted"),
  status("rfc:RFC-0001", "Accepted", "Draft"),
  remove("rfc:RFC-0022"),
  remove(firstLegacy),
  status(firstLegacy, "Deprecated", "Accepted"),
  markdown.replace(expected.get(firstLegacy).annotation, "invented-deprecation"),
  status("planned:runtime", "Planned", "Experimental"),
  status("experiment:repository-cli", "Experimental", "Accepted"),
  remove(firstCandidate),
  remove(firstProfile),
  markdown.replace(row("rfc:RFC-0003"), row("rfc:RFC-0003").replace(expected.get("rfc:RFC-0003").citation, expected.get("rfc:RFC-0001").citation)),
  markdown.replace(row(firstKind), row(firstKind).replace(expected.get(firstKind).citation, "https://example.invalid/evidence")),
  markdown.replace(row(firstKind), `| \`${firstKind}\` | contract | Draft | |`)
];
for (const [i, invalid] of negatives.entries()) assert(verifyRegistry(invalid).length > 0, `Negative case ${i + 1}`);
const rfcIndex = readFileSync("rfcs/README.md", "utf8");
assert(verifyRegistry(markdown, rfcIndex.replace(/^(\| \[RFC-0003\].*\| )Draft/mu, "$1Accepted")).length > 0);
assert(verifyRegistry(markdown, rfcIndex.replace(/^\| \[RFC-0022\].*\n/mu, "")).length > 0);

for (const hub of ["README.md", "rfcs/README.md", "docs/compatibility-matrix.md", "docs/index.md"]) {
  assert(readFileSync(hub, "utf8").includes("feature-status-registry.md"), `Missing registry navigation: ${hub}`);
}
for (const phrase of ["does not accept an RFC", "not a support matrix", "sets no removal date", "separate axes"]) {
  assert(markdown.includes(phrase), `Missing claim boundary: ${phrase}`);
}
const count = (prefix) => [...expected.keys()].filter((id) => id.startsWith(prefix)).length;
console.log(`Feature registry passed: ${count("kind:")} kinds, ${count("rfc:")} RFCs, ${count("experiment:")} experiments, ${count("legacy:")} deprecated fields, ${count("planned:")} planned implementations.`);
console.log(`${negatives.length + 2} rejection cases passed; lifecycle consistency does not grant support, acceptance or release approval.`);
