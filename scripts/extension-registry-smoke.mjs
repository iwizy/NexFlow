#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";
import { registryPolicyErrors as semanticErrors } from "../extensions/registry-policy.mjs";

const schema = JSON.parse(
  await readFile("extensions/registry.schema.json", "utf8")
);
async function readFixture(file) {
  const document = parseDocument(await readFile(file, "utf8"), { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw Error(file + ": " + document.errors.map(error => error.message).join("\n"));
  }
  return document.toJS({ maxAliasCount: 0 });
}

const example = await readFixture("fixtures/extension-registry/legacy.yaml");
const current = await readFixture("extensions/registry.example.yaml");
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

function schemaCase(name, mutate, expected, fixture = example) {
  const value = clone(fixture);
  mutate(value);
  const actual = validate(value);
  check(`${name}: expected schema validity ${expected}`, actual === expected);
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

check("current fixture has two distinct revisions for the same namespace", validate(current) &&
  semanticErrors(current).length === 0 && current.entries.length === 2 &&
  current.entries[0].namespace === current.entries[1].namespace &&
  current.entries[0].profile.version !== current.entries[1].profile.version);
check("current fixture retains the revoked row beside a separate successor",
  current.entries[0].publication.status === "revoked" && current.entries[1].publication.status === "published");

for (const [name, mutate] of [
  ["revocation without evidence", value => { delete value.entries[0].withdrawal.evidence; }],
  ["disputed claim without evidence", value => {
    value.entries[1].owner.verification = { status: "disputed", method: "manual" };
  }],
  ["registry format downgrade", value => { value.registryFormatVersion = "0.1-draft"; }],
  ["unrecognized format", value => { value.registryFormatVersion = "0.3-draft"; }],
  ["removed lifecycle without notices", value => { value.entries[1].lifecycle = "removed"; }],
  ["deprecated publication without notice", value => { value.entries[1].publication.status = "deprecated"; }],
  ["moving version alias", value => { value.entries[1].profile.version = "latest"; }],
  ["path alias", value => { value.entries[1].profile.source.path = "profiles/./profile.yaml"; }],
  ["duplicate path separator", value => { value.entries[1].profile.source.path = "profiles//profile.yaml"; }],
  ["non reverse-DNS public name", value => { value.entries[1].namespace = "issue_tracker"; }],
  ["an unverified compatible version range", value => { value.entries[1].compatibility.profileVersions = ["0.1-draft", "0.2-draft"]; }],
  ["authored permission grant", value => { value.entries[1].requirements.networkGrant = true; }],
]) schemaCase(name, mutate, false, current);

function policyCase(name, mutate, expected, previous) {
  const value = clone(previous ?? current);
  if (previous) value.metadata.source.revision = "a".repeat(40);
  mutate(value);
  const schemaValid = validate(value);
  check(name + " passes schema", schemaValid);
  if (!schemaValid) return;
  const errors = semanticErrors(value, previous);
  check(name + ": " + errors.join(", "), expected ? errors.some(error => error.includes(expected)) : errors.length === 0);
}

const deprecation = {
  reason: "Migrate the fictional profile.",
  migration: "https://example.invalid/migration",
  effectiveAt: current.metadata.generatedAt,
  supportEndsAt: "2026-09-21T00:00:00Z",
};
const withdrawal = {
  reason: "Retire the fictional profile.",
  effectiveAt: current.metadata.generatedAt,
  evidence: "https://example.invalid/withdrawal",
};
const dispute = { status: "disputed", method: "manual", evidence: "https://example.invalid/dispute" };
const verified = { status: "registry_verified", method: "manual", evidence: "https://example.invalid/resolution" };

policyCase("duplicate namespace-version", value => value.entries.push(clone(value.entries[1])), "duplicate namespace/profile version");
policyCase("publication order is bytewise by namespace and version", value => value.entries.reverse(), "not ordered");
policyCase("local namespace cannot be public", value => { value.entries[1].namespace = "local.issue_tracker"; }, "local namespace in public");
policyCase("private catalog can include local namespaces", value => {
  value.metadata.scope = "private";
  value.entries[1].namespace = "local.issue_tracker";
}, null);
policyCase("reserved namespace cannot be reassigned by type assertion", value => { value.entries[1].namespace = "io.nexflow"; }, "does not identify project ownership");
policyCase("registry compatibility must name the exact pinned version", value => {
  value.entries[1].compatibility.profileVersions = ["0.1-draft"];
}, "omits exact profile version");
policyCase("registry lifecycle must match assessed profile status", value => { value.entries[1].profile.status = "removed"; }, "disagrees with lifecycle");
policyCase("self-asserted record stays draft", value => { value.entries[1].owner.verification = { status: "self_asserted" }; }, "verified owner decision");
policyCase("conflicting active revisions", value => {
  value.entries[0].publication.status = "published";
  delete value.entries[0].withdrawal;
  value.entries[0].owner.verification = dispute;
}, "conflicting owner decisions");
policyCase("existing published metadata can record an open dispute", value => {
  value.entries[1].owner.verification = dispute;
}, null, current);
const draftSnapshot = clone(current);
draftSnapshot.entries[1].publication = { status: "draft" };
policyCase("a disputed draft cannot be published", value => {
  value.entries[1].publication = { status: "published", publishedAt: value.metadata.generatedAt };
  value.entries[1].owner.verification = dispute;
}, "cannot publish", draftSnapshot);
policyCase("profile digest cannot change under the same version", value => {
  value.entries[1].profile.source.sha256 = "b".repeat(64);
}, "profile version reused", current);
policyCase("compatibility requirements cannot change under the same version", value => {
  value.entries[1].compatibility.specVersions.push("0.2");
}, "profile version reused", current);
policyCase("snapshot revision cannot be reused", value => {
  value.metadata.source.revision = current.metadata.source.revision;
  value.metadata.displayName = "Edited snapshot";
}, "same revision", current);
policyCase("revoked row cannot disappear", value => { value.entries.shift(); }, "record missing", current);
policyCase("new profile starts as a draft when history is available", value => {
  const entry = clone(value.entries[1]);
  entry.profile.version = "0.3-draft";
  entry.compatibility.profileVersions = [entry.profile.version];
  value.entries.push(entry);
}, "skipped draft", current);
policyCase("revoked profile cannot return to published", value => {
  value.entries[0].publication.status = "published";
  delete value.entries[0].withdrawal;
}, "invalid publication transition", current);
policyCase("emergency revocation skips ordinary deprecation", value => {
  value.entries[1].publication.status = "revoked";
  value.entries[1].withdrawal = withdrawal;
}, null, current);
policyCase("published profile can be deprecated with a same-namespace replacement", value => {
  const [old, successor] = value.entries;
  successor.lifecycle = "deprecated";
  successor.profile.status = "deprecated";
  successor.publication.status = "deprecated";
  successor.deprecation = { ...deprecation, replacement: { namespace: old.namespace, version: "0.3-draft" } };
}, null, current);
policyCase("replacement must identify a different exact profile", value => {
  value.entries[1].deprecation = { ...deprecation, replacement: { namespace: value.entries[1].namespace, version: "0.2-draft" } };
}, "replacement points to the same profile");
policyCase("ordinary withdrawal cannot mark a profile removed before its sunset", value => {
  const entry = value.entries[1];
  entry.lifecycle = entry.profile.status = "removed";
  entry.publication.status = "withdrawn";
  entry.deprecation = deprecation;
  entry.withdrawal = withdrawal;
}, "support window");
const deprecatedSnapshot = clone(current);
const deprecatedEntry = deprecatedSnapshot.entries[1];
deprecatedEntry.lifecycle = deprecatedEntry.profile.status = deprecatedEntry.publication.status = "deprecated";
deprecatedEntry.deprecation = { ...deprecation, supportEndsAt: null };
policyCase("previously unknown cutoff can be recorded", value => {
  value.entries[1].deprecation.supportEndsAt = deprecation.supportEndsAt;
}, null, deprecatedSnapshot);
const datedSnapshot = clone(deprecatedSnapshot);
datedSnapshot.entries[1].deprecation.supportEndsAt = deprecation.supportEndsAt;
policyCase("a cutoff cannot silently move", value => {
  value.entries[1].deprecation.supportEndsAt = "2026-09-22T00:00:00Z";
}, "deprecation record changed", datedSnapshot);
policyCase("ordinary removal retains its pin and notice after the cutoff", value => {
  value.metadata.generatedAt = deprecation.supportEndsAt;
  const entry = value.entries[1];
  entry.lifecycle = entry.profile.status = "removed";
  entry.publication.status = "withdrawn";
  entry.withdrawal = { ...withdrawal, effectiveAt: value.metadata.generatedAt };
}, null, datedSnapshot);
policyCase("silent ownership transfer is rejected", value => {
  value.entries[1].owner.identifier = "https://example.invalid/another-owner";
}, "owner changed", current);
const disputedSnapshot = clone(current);
disputedSnapshot.entries[1].owner.verification = dispute;
policyCase("ownership transfer records a distinct resolution", value => {
  value.entries[1].owner.identifier = "https://example.invalid/another-owner";
  value.entries[1].owner.verification = verified;
}, null, disputedSnapshot);
check("legacy snapshot cannot replace an already pinned current-format snapshot",
  semanticErrors(example, current).includes("registry format moved backwards"));

if (failures.length > 0) {
  console.error("Extension registry smoke checks failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Extension registry smoke checks passed (${assertionCount} assertions).`);
