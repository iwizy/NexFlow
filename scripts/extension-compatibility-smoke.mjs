#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";
import { registryPolicyErrors } from "../extensions/registry-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = file => readFileSync(path.join(root, file), "utf8");
function yaml(source) {
  const document = parseDocument(source, { uniqueKeys: true });
  assert.deepEqual(document.errors, []);
  return document.toJS({ maxAliasCount: 0 });
}

const fixture = yaml(read("fixtures/extension-registry/compatibility.yaml"));
const current = yaml(read("extensions/registry.example.yaml"));
const legacy = yaml(read("fixtures/extension-registry/legacy.yaml"));
const [cliArchive, validationArchive] = process.argv.slice(2);
assert.ok(cliArchive && validationArchive, "Supply the two published v0.5.0-alpha.1 tarballs");
const packages = {
  cli: "82644c14ac1f7f7d28e7bee8938f11899299dbabf75694c7ba9f0c6e405deb09",
  validation: "07e3966c54bf3c15345811396b84f47677cdfeed99fef4e357676eb306d9f1e1",
};
for (const [archive, digest] of [[cliArchive, packages.cli], [validationArchive, packages.validation]]) {
  assert.equal(createHash("sha256").update(readFileSync(archive)).digest("hex"), digest, path.basename(archive));
}
assert.equal(process.versions.node, "26.13.1");

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(JSON.parse(read("schemas/common.schema.json")));
const validateManifestSchema = ajv.compile(JSON.parse(read("schemas/extensions.schema.json")));
const validateRegistry = ajv.compile(JSON.parse(read("extensions/registry.schema.json")));

function snapshot(variant) {
  if (variant === "legacy") return structuredClone(legacy);
  if (variant === "migrated") {
    const migrated = structuredClone(legacy);
    migrated.registryFormatVersion = "0.2-draft";
    migrated.metadata.source.revision = "2".repeat(40);
    // The legacy draft already uses an exact single version. No owner
    // verification or publication decision is inferred by the migration.
    return migrated;
  }

  const registry = structuredClone(current);
  const entry = registry.entries[1];
  switch (variant) {
    case undefined:
      break;
    case "unknown-profile":
      entry.namespace = "com.example.unrecognized";
      break;
    case "other-spec":
      entry.compatibility.specVersions = ["0.2"];
      break;
    case "changed-pin":
      entry.profile.source.sha256 = "2".repeat(64);
      break;
    case "withdrawn":
      entry.publication.status = "withdrawn";
      entry.withdrawal = structuredClone(registry.entries[0].withdrawal);
      break;
    case "disputed":
      entry.owner.verification.status = "disputed";
      break;
    case "invalid-source":
      entry.profile.source.revision = "main";
      break;
    case "duplicate":
      registry.entries.push(structuredClone(entry));
      break;
    default:
      assert.fail("Unknown fixture registry variant");
  }
  return registry;
}

// Offline conformance oracle for this fixture. It never resolves external
// sources or admits an operation, even if registry metadata is compatible.
function disposition(registry, selection, previous) {
  if (!validateRegistry(registry)) return "invalid-registry";
  if (registryPolicyErrors(registry, previous).length) return "inconsistent-registry";
  if (registry.registryFormatVersion === "0.1-draft") return "legacy-registry";
  const rows = registry.entries.filter(row => row.namespace === selection.namespace);
  if (!rows.length) return "unsupported-namespace";
  const entry = rows.find(row => row.profile.version === selection.profileVersion);
  if (!entry) return "unsupported-profile-version";
  if (entry.publication.status === "revoked") return "revoked-profile";
  if (entry.publication.status === "withdrawn") return "withdrawn-profile";
  if (entry.owner.verification.status === "disputed") return "disputed-ownership";
  if (entry.publication.status === "draft") return "unpublished-profile";

  const pin = fixture.catalog.find(row =>
    row.namespace === selection.namespace && row.profileVersion === selection.profileVersion);
  if (!pin) return "unsupported-profile";
  if (!isDeepStrictEqual(entry.profile.source, pin.source)) return "profile-pin-mismatch";
  if (!entry.compatibility.specVersions.includes(selection.specVersion) ||
      !entry.compatibility.attachmentAreas.includes(selection.attachmentArea)) return "incompatible-pair";
  return "compatible-metadata";
}

const scratch = realpathSync(mkdtempSync(path.join(tmpdir(), "nexflow-extension-fixture-")));
const syntheticPrivate = "NF117_SYNTHETIC_PRIVATE_CANARY";
const npm = path.resolve(path.dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js");
const network = path.join(root, "scripts/test/package-network-deny.mjs");
const deny = path.join(root, "scripts/test/no-runtime-deny.mjs");
const readGuard = path.join(root, "scripts/test/reference-cli-read-guard.mjs");
const env = {
  PATH: [path.dirname(process.execPath), "/usr/bin", "/bin"].join(path.delimiter),
  HOME: path.join(scratch, "home"), LANG: "C.UTF-8", LC_ALL: "C.UTF-8", TMPDIR: scratch,
};
const commands = ["validate", "inspect", "graph"];

function install(name, archive) {
  const customer = path.join(scratch, name);
  mkdirSync(customer);
  const cache = path.join(customer, "cache");
  const config = path.join(customer, "empty.npmrc");
  writeFileSync(config, "");
  const installed = spawnSync(process.execPath, ["--import", network, npm, "install", "--prefix", customer,
    "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--no-save", "--no-package-lock",
    "--update-notifier=false", "--cache", cache, "--userconfig", config, path.resolve(archive)],
  { cwd: scratch, env, encoding: "utf8", timeout: 60000 });
  assert.equal(installed.status, 0, String(installed.error ?? installed.stderr));
  assert.equal(installed.stderr, "");
  return path.join(customer, "node_modules");
}

const outcomes = [];
try {
  mkdirSync(env.HOME);
  const cliModules = install("cli", cliArchive);
  const validationModules = install("validation", validationArchive);
  const library = await import(pathToFileURL(path.join(validationModules, "@nexflow/validation/dist/index.js")));
  const validator = library.createValidator();
  const cli = realpathSync(path.join(cliModules, ".bin/nexflow"));

  assert.equal(library.apiVersion, "validation-api-v1-preview");
  for (const example of fixture.cases) {
    const selection = { ...fixture.selection, ...example.selection };
    const registry = snapshot(example.registry);
    const originalRegistry = structuredClone(registry);
    const decision = {
      diagnostic: disposition(registry, selection, example.compareHistory ? current : undefined),
      executionAuthorized: false,
    };
    assert.deepEqual(decision, { diagnostic: example.expected, executionAuthorized: false }, example.id);
    assert.deepEqual(registry, originalRegistry);
    if (example.registry === "migrated") {
      assert.deepEqual(registry.entries, legacy.entries);
      assert.equal(registry.entries[0].owner.verification.status, "self_asserted");
    }

    const project = {
      kind: "Project", specVersion: "0.1", metadata: { project: "fixture-project" },
      project: { id: "fixture-project", displayName: "Fixture", description: "Synthetic extension fixture" },
      manifests: { extensions: "extensions.yaml" },
    };
    const manifest = {
      kind: "ExtensionSet", specVersion: selection.specVersion, metadata: { project: "fixture-project" },
      extensions: [{
        id: "fixture-extension", displayName: "Fixture", namespace: selection.namespace,
        lifecycle: example.lifecycle ?? "experimental", appliesTo: [selection.attachmentArea],
        fixtureMetadata: { requestedVersion: selection.profileVersion, opaque: syntheticPrivate },
      }],
    };
    const before = structuredClone(manifest);
    const status = example.static ?? "valid";
    assert.equal(validateManifestSchema(manifest), status === "valid", example.id);
    const check = validator.validateManifest(manifest, "extensions.yaml");
    const expectedCodes = example.diagnostics ?? [];
    assert.equal(check.status, status, example.id);
    assert.deepEqual(check.diagnostics.map(({ code }) => code), expectedCodes, example.id);
    assert.equal(check.executionAuthorized, false);
    assert.equal(check.checks.extensionProfiles, "not-run");
    assert.equal(check.checks.runtime, "not-run");
    assert.deepEqual(manifest, before);
    if (status === "valid") {
      assert.deepEqual(library.parseSource("extensions.yaml", JSON.stringify(manifest)).document.value, before);
    }

    const workspace = path.join(scratch, example.id);
    mkdirSync(workspace);
    const projectPath = path.join(workspace, "project.yaml");
    const projectSource = JSON.stringify(project);
    writeFileSync(projectPath, projectSource);
    const manifestPath = path.join(workspace, "extensions.yaml");
    const manifestSource = JSON.stringify(manifest);
    writeFileSync(manifestPath, manifestSource);
    const exit = status === "valid" ? 0 : status === "invalid" ? 1 : 3;
    for (const command of commands) {
      const run = spawnSync(process.execPath, ["--import", deny, "--import", readGuard, cli,
        command, "--root", workspace, "--format=json"], {
        cwd: scratch,
        env: { ...env, NEXFLOW_TEST_MODULE_ROOT: cliModules, NEXFLOW_TEST_READ_ROOT: workspace },
        encoding: "utf8", timeout: 10000,
      });
      assert.equal(run.status, exit, `${example.id} ${command}: ${run.error ?? run.stderr}`);
      assert.equal(run.stderr, "");
      assert.ok(!run.stdout.includes(syntheticPrivate));
      const output = JSON.parse(run.stdout);
      assert.equal(output.formatVersion, "0.5-preview.1");
      assert.equal(output.exitCode, exit);
      assert.equal(output.executionAuthorized, false);
      assert.equal(output.checks.extensionProfiles, "not-run");
      assert.equal(output.checks.runtime, "not-run");
      assert.deepEqual(output.diagnostics.map(({ code }) => code), expectedCodes, `${example.id} ${command}`);
      if (command === "inspect" && status === "valid") {
        assert.ok(output.result.inspection.resources.some(row => row.kind === "extension" && row.id === "fixture-extension"));
      }
    }
    assert.equal(readFileSync(projectPath, "utf8"), projectSource);
    assert.equal(readFileSync(manifestPath, "utf8"), manifestSource);
    outcomes.push({ case: example.id, compatibility: decision.diagnostic, manifest: status, cliExit: exit,
      cliDiagnostics: expectedCodes, extensionProfiles: "not-run", executionAuthorized: false });
  }
  console.log(JSON.stringify({ revision: process.env.GITHUB_SHA ?? null, release: "v0.5.0-alpha.1", packages,
    cases: outcomes.length, commands, platform: process.platform, arch: process.arch,
    node: process.versions.node, outcomes }, null, 2));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
