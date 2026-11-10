import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyPackage } from "../packages/cli/distribution/verify-package.mjs";
import { checked, cleanEnvironment, fileSha, json, run, sha, writeRecord } from "./qualification/common.mjs";

const tag = "v0.5.0-alpha.1";
const version = tag.slice(1);
const { GITHUB_REPOSITORY: repository, RUNNER_TEMP: temp, NEXFLOW_TARGET: target,
  NEXFLOW_RELEASE_SHA: releaseSha, NEXFLOW_CHECKSUMS_SHA256: checksumsSha } = process.env;
assert.match(repository ?? "", /^[\w.-]+\/[\w.-]+$/u);
assert.match(releaseSha ?? "", /^[a-f0-9]{40}$/u);
assert.match(checksumsSha ?? "", /^[a-f0-9]{64}$/u);
const contract = json(new URL("../qualification/reference-lifecycle/contract.json", import.meta.url));
const platform = contract.targets.find(item => item.id === target);
assert.ok(platform, "Unknown release verification target");
const output = path.join(temp ?? os.tmpdir(), "reference-public-release");
mkdirSync(output);
const downloads = path.join(output, "downloads");
mkdirSync(downloads);
const scratch = realpathSync(mkdtempSync(path.join(temp ?? os.tmpdir(), "nexflow-public-consumer-")));
const record = {
  tag, target, releaseSha, checksumsSha, repository, status: "failed",
  observedAt: new Date().toISOString(),
  workflow: { revision: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT },
  environment: { platform: process.platform, architecture: process.arch, os: os.version(), kernel: os.release(),
    image: process.env.ImageOS, imageVersion: process.env.ImageVersion, node: process.versions.node,
    nodeBinarySha256: fileSha(process.execPath) },
  assets: [], checks: []
};

const api = `https://api.github.com/repos/${repository}`;
const publicBase = `https://github.com/${repository}/releases/download/${tag}/`;
const cliFile = `nexflow-cli-${version}.tgz`;
const libraryFile = `nexflow-validation-${version}.tgz`;
const fileNames = ["ASSESSMENT.json", "ASSET-INVENTORY.json", "CANDIDATE-SHA256SUMS", "PROVENANCE.json",
  "PUBLICATION.md", "RELEASE-NOTES.md", "REVIEW.md", "SHA256SUMS", "candidate-readiness.json",
  `nexflow-${version}-evidence.tgz`, cliFile, libraryFile,
  cliFile.replace(".tgz", ".schemas.json"), libraryFile.replace(".tgz", ".schemas.json")].sort();

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.ok(response.ok, `HTTP ${response.status} for ${url}`);
  assert.equal(new URL(response.url).protocol, "https:");
  return response;
}

async function getJson(endpoint) {
  return (await request(api + endpoint)).json();
}

async function download(asset, expectedSha) {
  assert.ok(Number.isSafeInteger(asset.size) && asset.size > 0 && asset.size <= 32 * 1024 * 1024);
  assert.equal(asset.digest, `sha256:${expectedSha}`, `Release API digest for ${asset.name}`);
  const url = publicBase + asset.name;
  assert.equal(asset.browser_download_url, url);
  const bytes = Buffer.from(await (await request(url)).arrayBuffer());
  assert.equal(bytes.length, asset.size, `Download size for ${asset.name}`);
  assert.equal(sha(bytes), expectedSha, `Downloaded digest for ${asset.name}`);
  writeFileSync(path.join(downloads, asset.name), bytes, { flag: "wx" });
  record.assets.push({ name: asset.name, id: asset.id, bytes: bytes.length, sha256: expectedSha });
  return bytes;
}

function execute(label, command, args, options, expected = 0) {
  const result = run(command, args, { timeout: 60000, maxBuffer: 1024 * 1024, ...options });
  record.checks.push({ label, ...result });
  assert.equal(result.error, null, label);
  assert.equal(result.exitCode, expected, label);
  return result.stdout;
}

try {
  assert.equal(process.platform, platform.platform);
  assert.equal(process.arch, platform.architecture);
  const release = await getJson(`/releases/tags/${tag}`);
  assert.equal(release.tag_name, tag);
  assert.equal(release.draft, false);
  assert.equal(release.prerelease, true);
  const latest = await getJson("/releases/latest");
  assert.notEqual(latest.id, release.id, "Preview replaced the latest stable release");
  const ref = await getJson(`/git/ref/tags/${tag}`);
  let object = ref.object;
  for (let depth = 0; object.type === "tag" && depth < 5; depth++) {
    assert.match(object.sha, /^[a-f0-9]{40}$/u);
    object = (await getJson(`/git/tags/${object.sha}`)).object;
  }
  assert.equal(object.type, "commit");
  assert.equal(object.sha, releaseSha, "Tag points to a different release commit");
  record.release = { id: release.id, publishedAt: release.published_at, refObject: ref.object, latestStableTag: latest.tag_name };
  assert.deepEqual(release.assets.map(asset => asset.name).sort(), fileNames);
  const assets = new Map(release.assets.map(asset => [asset.name, asset]));
  const checksums = await download(assets.get("SHA256SUMS"), checksumsSha);
  const sums = new Map();
  for (const line of checksums.toString("utf8").trimEnd().split(/\r?\n/u)) {
    const entry = /^([a-f0-9]{64})  ([a-zA-Z0-9._-]+)$/u.exec(line);
    assert.ok(entry, "Invalid SHA256SUMS entry");
    assert.ok(!sums.has(entry[2]), "Duplicate SHA256SUMS entry");
    sums.set(entry[2], entry[1]);
  }
  assert.deepEqual([...sums.keys()].sort(), fileNames.filter(name => name !== "SHA256SUMS"));
  for (const [name, digest] of sums) await download(assets.get(name), digest);
  const inventory = json(path.join(downloads, "ASSET-INVENTORY.json"));
  const provenance = json(path.join(downloads, "PROVENANCE.json"));
  assert.equal(inventory.proposedTag, tag);
  assert.match(provenance.sourceRevision, /^[a-f0-9]{40}$/u);
  assert.equal(inventory.selectedPackageRevision, provenance.sourceRevision);
  assert.deepEqual(inventory.assets.map(asset => asset.file).sort(),
    fileNames.filter(name => name !== "SHA256SUMS" && name !== "ASSET-INVENTORY.json"));
  for (const asset of inventory.assets) {
    assert.equal(asset.sha256, sums.get(asset.file));
    assert.equal(asset.bytes, assets.get(asset.file).size);
  }
  record.packageSource = provenance.sourceRevision;
  record.reviewSource = inventory.reviewProducerRevision;
  assert.equal(process.versions.node, provenance.node);

  const windows = process.platform === "win32";
  const node = process.execPath;
  const sdkBin = path.dirname(node);
  const npm = path.resolve(sdkBin, windows ? "node_modules/npm/bin/npm-cli.js" : "../lib/node_modules/npm/bin/npm-cli.js");
  const pwsh = windows ? checked("where.exe", ["pwsh.exe"]).split(/\r?\n/u)[0] : null;
  const env = cleanEnvironment(scratch);
  env.PATH = sdkBin + path.delimiter + env.PATH;
  env.USERPROFILE = env.HOME;
  mkdirSync(env.HOME);
  mkdirSync(env.TMPDIR);
  if (windows) Object.assign(env, { COMSPEC: path.join(env.SystemRoot, "System32/cmd.exe"), PATHEXT: ".COM;.EXE;.BAT;.CMD" });
  const options = { cwd: scratch, env };
  const npmVersion = execute("npm version", node, [npm, "--version"], options).trim();
  assert.equal(npmVersion, provenance.npm);
  record.environment.npm = npmVersion;
  const config = path.join(env.HOME, "empty.npmrc");
  writeFileSync(config, "");
  const networkGuard = new URL("./test/package-network-deny.mjs", import.meta.url).href;
  const effectsGuard = new URL("./test/no-runtime-deny.mjs", import.meta.url).href;
  const npmOptions = ["--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--update-notifier=false", "--userconfig", config];

  async function install(name, file) {
    const artifact = provenance.artifacts.find(item => item.name === `@nexflow/${name}`);
    assert.ok(artifact);
    const index = file.replace(".tgz", ".schemas.json");
    assert.equal(artifact.file, file);
    assert.equal(artifact.sha256, sums.get(file));
    assert.equal(artifact.bytes, assets.get(file).size);
    assert.equal(artifact.schemaIndex, index);
    assert.equal(artifact.schemaIndexSha256, sums.get(index));
    const consumer = path.join(scratch, name);
    const cache = path.join(scratch, `${name}-cache`);
    mkdirSync(consumer);
    writeFileSync(path.join(consumer, "package.json"), '{"private":true,"type":"module"}\n');
    execute(`install ${name}`, node, ["--import", networkGuard, npm, "install", "--prefix", consumer,
      "--cache", cache, ...npmOptions, path.join(downloads, file)], options);
    const root = path.join(consumer, "node_modules", "@nexflow", name);
    const verified = await verifyPackage(root);
    assert.equal(verified.sourceRevision, provenance.sourceRevision);
    assert.equal(fileSha(path.join(root, "schema-bundle.json")), sums.get(index));
    assert.equal(fileSha(path.join(root, "package-inventory.json")), artifact.inventorySha256);
    record.checks.push({ label: `verify ${name}`, ...verified });
    return { consumer, root, cache, name };
  }

  const cli = await install("cli", cliFile);
  const library = await install("validation", libraryFile);
  const require = createRequire(pathToFileURL(path.join(library.root, "package.json")));
  const Ajv = require("ajv/dist/2020.js");
  const validateOutput = new Ajv({ strict: false }).compile(json(path.join(cli.root, "contracts/output.schema.json")));
  const project = path.join(scratch, "quick start");
  mkdirSync(project);
  const input = path.join(project, "project.yaml");
  const guide = readFileSync(new URL("../docs/reference-cli-installation.md", import.meta.url), "utf8");
  const sample = guide.match(/```yaml\r?\n([\s\S]*?)```/u)?.[1];
  assert.ok(sample, "Missing documented quick-start project");
  writeFileSync(input, sample);
  const originalInput = fileSha(input);
  const bin = path.join(cli.consumer, "node_modules", ".bin", windows ? "nexflow.cmd" : "nexflow");
  function quickstart(command, root, expected = 0) {
    const args = root ? [command, "--root", root, "--format=json"] : [command, "--format=json"];
    const commandEnv = { ...env, NODE_OPTIONS: `--import=${effectsGuard}` };
    const stdout = windows
      ? execute(command, pwsh, ["-NoProfile", "-NonInteractive", "-Command", root
        ? "& $env:NEXFLOW_BIN $env:NEXFLOW_COMMAND --root $env:NEXFLOW_ROOT --format=json; exit $LASTEXITCODE"
        : "& $env:NEXFLOW_BIN $env:NEXFLOW_COMMAND --format=json; exit $LASTEXITCODE"],
      { ...options, env: { ...commandEnv, NEXFLOW_BIN: bin, NEXFLOW_COMMAND: command, NEXFLOW_ROOT: root ?? "" } }, expected)
      : execute(command, bin, args, { ...options, env: commandEnv }, expected);
    const result = JSON.parse(stdout);
    assert.ok(validateOutput(result), JSON.stringify(validateOutput.errors));
    assert.equal(result.tool.version, version);
    assert.equal(result.exitCode, expected);
    assert.equal(result.success, expected === 0);
    assert.equal(result.executionAuthorized, false);
  }
  for (const command of ["--help", "--version"]) quickstart(command);
  for (const command of ["validate", "inspect", "graph"]) quickstart(command, project);
  assert.equal(fileSha(input), originalInput);
  writeFileSync(input, "kind: Project\nkind: Project\n");
  quickstart("validate", project, 1);
  writeFileSync(input, sample);

  const pureImport = 'import { createValidator } from "@nexflow/validation"; console.log(JSON.stringify(createValidator().validateDocuments([]).executionAuthorized));';
  assert.equal(execute("pure validation import", node, ["--import", effectsGuard, "--input-type=module", "-e", pureImport],
    { ...options, cwd: library.consumer }).trim(), "false");
  for (const { consumer, root, cache, name } of [cli, library]) {
    execute(`uninstall ${name}`, node, ["--import", networkGuard, npm, "uninstall", "--prefix", consumer,
      "--cache", cache, ...npmOptions, `@nexflow/${name}`], options);
    assert.ok(!existsSync(root), `Scoped uninstall left ${name} installed`);
  }
  assert.equal(fileSha(input), originalInput);
  for (const asset of record.assets) assert.equal(fileSha(path.join(downloads, asset.name)), asset.sha256);
  record.status = "passed";
} catch (error) {
  record.failure = error.message;
  process.exitCode = 1;
} finally {
  writeRecord(path.join(output, "receipt.json"), record, [scratch, output, process.cwd()]);
  rmSync(scratch, { recursive: true, force: true });
  console.log(`Public release verification ${record.status} for ${target}`);
}
