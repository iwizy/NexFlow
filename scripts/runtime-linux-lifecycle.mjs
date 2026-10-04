#!/usr/bin/env node
// Trusted, disposable native evaluation tooling; no manifest-selected commands.
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { baseline, compareOutput, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { lifecycleErrors } from "./lib/linux-lifecycle-evidence.mjs";

const root = repositoryRoot;
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const sources = ["scripts/runtime-linux-lifecycle.mjs", "scripts/runtime-linux-isolate.sh", "scripts/lib/linux-lifecycle-evidence.mjs"];
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
function manifest(directory, excluded = []) {
  const rows = [];
  function visit(current, prefix = "") {
    for (const name of readdirSync(current).sort()) {
      const file = path.join(current, name), relative = prefix ? prefix + "/" + name : name;
      if (excluded.some(part => relative === part || relative.startsWith(part + "/"))) continue;
      const stat = lstatSync(file);
      if (stat.isDirectory()) visit(file, relative);
      else if (stat.isFile()) rows.push({ path: relative, bytes: stat.size, sha256: digest(readFileSync(file)) });
      else if (stat.isSymbolicLink()) throw new Error("unexpected-artifact-symlink");
      else throw new Error("nonregular-artifact-file");
    }
  }
  visit(directory); return rows;
}
function scrub(value, replacements = []) {
  let text = typeof value === "string" ? value : JSON.stringify(value);
  for (const [from, to] of replacements.sort((a, b) => b[0].length - a[0].length)) text = text.split(from).join(to);
  text = text.replace(/\/(?:home\/runner|opt\/hostedtoolcache|tmp|private\/tmp)\/[A-Za-z0-9_./+-]+/gu, "<evaluation-path>");
  return typeof value === "string" ? text : JSON.parse(text);
}
function run(command, args, cwd, env = process.env, timeout = 600000) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", timeout, maxBuffer: 32 * 1024 * 1024, shell: false });
  return { exitCode: result.status ?? -1, signal: result.signal ?? null, error: result.error?.code ?? null,
    stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
function checked(command, args, cwd = root, env) {
  const result = run(command, args, cwd, env);
  if (result.exitCode !== 0) throw new Error(scrub(result.stderr.slice(-1500)) || "command-failed");
  return result.stdout.trim();
}
function offline(command, args, cwd = root) {
  const extra = { PATH: process.env.PATH, LANG: "C.UTF-8", TZ: "UTC", CARGO_HOME: process.env.CARGO_HOME ?? path.join(os.homedir(), ".cargo"),
    RUSTUP_HOME: process.env.RUSTUP_HOME ?? path.join(os.homedir(), ".rustup"), GOPATH: process.env.GOPATH ?? path.join(os.homedir(), "go"),
    GOCACHE: process.env.GOCACHE ?? path.join(os.homedir(), ".cache/go-build"), GOPROXY: "off", GOTOOLCHAIN: "local", CGO_ENABLED: "0" };
  return run("sudo", ["unshare", "--net", "setpriv", "--reuid", String(process.getuid()), "--regid", String(process.getgid()),
    "--clear-groups", "--bounding-set=-all", "env", "-i", ...Object.entries(extra).map(([k, v]) => k + "=" + v), command, ...args], cwd);
}
function copy(file, dest) { mkdirSync(path.dirname(dest), { recursive: true }); cpSync(file, dest, { recursive: true, dereference: true }); }
function commandFor(candidate, installed) {
  const proto = path.join(installed, "evaluation/prototypes", candidate);
  return candidate === "typescript" ? [process.execPath, path.join(proto, "dist/cli.js")]
    : candidate === "python" ? [path.join(installed, "venv/bin/python"), "-I", "-B", path.join(proto, "cli.py")]
      : [path.join(proto, "bin", "nexflow-" + candidate + "-evaluation")];
}
async function inside(config) {
  assert.equal(process.platform, "linux"); assert.equal(process.arch, "x64"); assert.ok(process.getuid() > 0);
  assert.equal(readdirSync(path.join(root, "schemas")).length, 0);
  const routes = readFileSync("/proc/net/route", "utf8").trim().split("\n").slice(1);
  assert.equal(routes.length, 0);
  const networkError = await new Promise(resolve => {
    const socket = net.connect({ host: "198.18.0.1", port: 9 });
    socket.setTimeout(1000, () => { socket.destroy(); resolve("timeout"); });
    socket.once("error", e => resolve(e.code)); socket.once("connect", () => { socket.destroy(); resolve("unexpected-connect"); });
  });
  assert.ok(["ENETUNREACH", "EHOSTUNREACH"].includes(networkError));
  let writeError; try { writeFileSync(path.join(config.inputs, "write-canary"), "fictional"); } catch (e) { writeError = e.code; }
  assert.equal(writeError, "EROFS");
  const installed = path.join(config.temporary, "installed"); mkdirSync(installed);
  const extraction = run("tar", ["-xzf", config.archive, "-C", installed], config.temporary);
  const installCommands = [{ command: "tar -xzf <verified-artifact> -C <clean-prefix>", exitCode: extraction.exitCode }];
  if (config.candidate === "python" && extraction.exitCode === 0) {
    const venv = run(config.python, ["-I", "-m", "venv", "--without-pip", path.join(installed, "venv")], installed);
    installCommands.push({ command: "CPython 3.12.14 -I -m venv --without-pip <clean-prefix>/venv", exitCode: venv.exitCode });
    const pip = run(config.builderPython, ["-I", "-m", "pip", "--isolated", "--python", path.join(installed, "venv/bin/python"),
      "install", "--no-cache-dir", "--no-index", "--find-links", path.join(installed, "wheelhouse"), "--require-hashes", "--only-binary=:all:",
      "-r", path.join(installed, "evaluation/prototypes/python/requirements.lock")], installed);
    installCommands.push({ command: "pip 26.2.1 --python <installed-python> install --no-index --require-hashes --only-binary=:all: <locked-wheels>",
      exitCode: pip.exitCode, stderr: scrub(pip.stderr, [[config.temporary, "<evaluation>"]]) });
    const dependencyCheck = run(path.join(installed, "venv/bin/python"), ["-I", "-m", "pip", "check"], installed);
    installCommands.push({ command: "<installed-python> -I -m pip check", exitCode: dependencyCheck.exitCode });
  }
  const installPassed = installCommands.every(c => c.exitCode === 0);
  const installedManifest = installPassed ? manifest(installed, ["venv"]) : [];
  const command = commandFor(config.candidate, installed), results = [];
  for (const item of baseline.cases) {
    const fixture = path.join(config.inputs, item.id), before = digest(JSON.stringify(manifest(fixture))), attempts = [], errors = [];
    let previous;
    for (let n = 0; n < 2; n++) {
      const result = run(command[0], [...command.slice(1), item.command, "--root", fixture, ...item.args, "--format", "json"], config.temporary, process.env, 10000);
      let output; try { output = JSON.parse(result.stdout); } catch { errors.push("invalid-json-output"); }
      if (output) errors.push(...compareOutput(item, output, result.exitCode, result.stderr));
      if (result.error || result.signal) errors.push("process-failure");
      if (previous !== undefined && previous !== result.stdout) errors.push("nondeterministic-output"); previous = result.stdout;
      if (result.stdout.includes(fixture) || result.stderr.includes(fixture)) errors.push("absolute-path-disclosure");
      if (digest(JSON.stringify(manifest(fixture))) !== before) errors.push("input-mutation");
      attempts.push({ exitCode: result.exitCode, signal: result.signal, error: result.error, stdoutSha256: digest(result.stdout),
        stderrSha256: digest(result.stderr), output: output ? scrub(output, [[config.temporary, "<evaluation>"], [root, "<source-checkout>"]]) : null,
        stderr: scrub(result.stderr, [[config.temporary, "<evaluation>"], [root, "<source-checkout>"]]) });
    }
    results.push({ id: item.id, status: errors.length ? "failed" : "passed", errors: [...new Set(errors)], attempts });
  }
  const installedBefore = existsSync(installed), archiveBefore = digest(readFileSync(config.archive));
  assert.equal(digest(JSON.stringify(manifest(installed, ["venv"]))), digest(JSON.stringify(installedManifest)), "installed-content-mutation");
  rmSync(installed, { recursive: true });
  const uninstall = installedBefore && !existsSync(installed) && digest(readFileSync(config.archive)) === archiveBefore;
  return { installation: { status: installPassed ? "passed" : "failed", commands: installCommands,
      installedManifestSha256: digest(JSON.stringify(installedManifest)), layout: "private-source-layout-capsule", systemInstall: "not-tested" },
    isolation: { network: { status: "passed", routeCount: routes.length, negativeControl: networkError },
      inputReadOnly: { status: "passed", negativeControl: writeError }, buildSchemasHidden: true, unprivileged: true,
      scope: "fresh hosted VM; private mount/network/IPC/PID namespaces; dropped capabilities and clean environment; not complete security certification" },
    execution: { cases: results }, uninstall: { status: uninstall ? "passed" : "failed", archivePreserved: true,
      scope: "only this task-owned temporary installation prefix; external compiler/interpreter and caches remain" } };
}
async function main(candidate, outputFile, artifactDir) {
  assert.equal(process.platform, "linux", "native Linux required"); assert.equal(process.arch, "x64", "native AMD64 required");
  assert.ok(pins.candidates[candidate]); assert.deepEqual(verifyCorpus(), []); assert.ok(!git(["status", "--porcelain", "--untracked-files=no"]));
  const collectorRevision = git(["rev-parse", "HEAD"]), sourceRevision = pins.candidates[candidate].sourceRevision;
  const sourceManifest = git(["ls-tree", "-r", "--name-only", sourceRevision, "evaluation/prototypes/" + candidate]).split("\n")
    .filter(f => !f.endsWith("README.md")).map(file => { const bytes = readFileSync(path.join(root, file));
      assert.equal(digest(bytes), digest(execFileSync("git", ["show", sourceRevision + ":" + file], { cwd: root })));
      return { path: file, sha256: digest(bytes) }; });
  const supplyPath = "evaluation/supply-chain/" + candidate + "/inventory.json", supplyBytes = readFileSync(path.join(root, supplyPath));
  const supply = JSON.parse(supplyBytes); assert.equal(supply.sourceRevision, sourceRevision);
  const temporary = mkdtempSync(path.join(os.tmpdir(), "nexflow-linux-"));
  const proto = path.join(root, "evaluation/prototypes", candidate), bundle = path.join(temporary, "bundle"), inputs = path.join(temporary, "inputs");
  mkdirSync(bundle); mkdirSync(inputs); mkdirSync(path.join(temporary, "empty"));
  const buildCommands = [], toolchain = { node: checked(process.execPath, ["--version"]), npm: checked("npm", ["--version"]) };
  assert.equal(toolchain.node, "v22.23.2"); assert.equal(toolchain.npm, "10.9.8");
  function build(cmd, args, cwd = root) { const result = offline(cmd, args, cwd); buildCommands.push({ command: scrub([cmd, ...args].join(" "), [[root, "<source-checkout>"], [temporary, "<evaluation>"]]),
    exitCode: result.exitCode, stdoutSha256: digest(result.stdout), stderrSha256: digest(result.stderr), stderrTail: scrub(result.stderr.slice(-1200)) });
    assert.equal(result.exitCode, 0, "offline-build-failed"); }
  for (const file of baseline.corpus.files.filter(f => f.path.startsWith("schemas/"))) copy(path.join(root, file.path), path.join(bundle, file.path));
  if (candidate === "typescript") {
    build("npm", ["run", "build"], proto); const dest = path.join(bundle, "evaluation/prototypes/typescript");
    for (const file of ["dist", "package.json", "package-lock.json"]) copy(path.join(proto, file), path.join(dest, file));
    build("npm", ["ci", "--omit=dev", "--ignore-scripts", "--offline", "--no-audit", "--fund=false"], dest);
    // Runtime package .bin links are not required by this CLI; bundle regular reviewed bytes only.
    rmSync(path.join(dest, "node_modules/.bin"), { recursive: true, force: true });
    toolchain.compiler = checked(path.join(proto, "node_modules/.bin/tsc"), ["--version"]);
  } else if (candidate === "python") {
    toolchain.python = checked("python", ["--version"]); assert.equal(toolchain.python, "Python 3.12.14");
    build(path.join(root, ".venv/bin/python"), ["-I", "-m", "compileall", "-q", proto]);
    for (const row of sourceManifest) copy(path.join(root, row.path), path.join(bundle, row.path));
    const wheels = process.env.TASK_WHEELHOUSE; assert.ok(wheels);
    copy(wheels, path.join(bundle, "wheelhouse"));
    const allowed = new Set(readFileSync(path.join(proto, "requirements.lock"), "utf8").match(/(?<=sha256:)[0-9a-f]{64}/gu));
    assert.ok(manifest(path.join(bundle, "wheelhouse")).every(w => w.path.endsWith(".whl") && allowed.has(w.sha256)));
  } else if (candidate === "rust") {
    toolchain.rust = checked("rustc", ["+1.99.0", "--version"]); toolchain.cargo = checked("cargo", ["+1.99.0", "--version"]);
    assert.ok(toolchain.rust.startsWith("rustc 1.99.0 ")); assert.ok(toolchain.cargo.startsWith("cargo 1.99.0 "));
    build("cargo", ["+1.99.0", "build", "--release", "--frozen", "--manifest-path", path.join(proto, "Cargo.toml")]);
    copy(path.join(proto, "target/release/nexflow-rust-evaluation"), path.join(bundle, "evaluation/prototypes/rust/bin/nexflow-rust-evaluation"));
  } else {
    toolchain.go = checked("go", ["version"]); assert.ok(toolchain.go.includes("go1.27.1 linux/amd64"));
    build("go", ["build", "-mod=readonly", "-trimpath", "-buildvcs=false", "-o", "bin/nexflow-go-evaluation", "./cmd/cli"], proto);
    copy(path.join(proto, "bin/nexflow-go-evaluation"), path.join(bundle, "evaluation/prototypes/go/bin/nexflow-go-evaluation"));
  }
  const files = manifest(bundle), version = sourceRevision + ".linux.amd64." + collectorRevision;
  mkdirSync(artifactDir, { recursive: true }); const archive = path.resolve(artifactDir, candidate + "-" + version + ".tar.gz");
  checked("tar", ["--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner", "-czf", archive, "-C", bundle, "."]);
  for (const item of baseline.cases) { const dest = path.join(inputs, item.id); copy(path.join(root, item.root), dest);
    if (item.append) { const file = path.join(dest, item.append.file); writeFileSync(file, readFileSync(file, "utf8") + item.append.text); } }
  const config = { candidate, temporary, inputs, archive, python: candidate === "python" ? checked("which", ["python"]) : null, builderPython: path.join(root, ".venv/bin/python") };
  const configFile = path.join(temporary, "config.json"); writeFileSync(configFile, JSON.stringify(config));
  const child = run("sudo", ["unshare", "--mount", "--net", "--ipc", "--pid", "--fork", "--mount-proc", "/bin/sh", path.join(root, "scripts/runtime-linux-isolate.sh"),
    String(process.getuid()), String(process.getgid()), path.join(temporary, "empty"), path.join(root, "schemas"), inputs, process.env.PATH,
    root, process.execPath, path.join(root, "scripts/runtime-linux-lifecycle.mjs"), "--inside", configFile], root, process.env, 240000);
  assert.equal(child.exitCode, 0, scrub(child.stderr)); const observation = JSON.parse(child.stdout);
  assert.deepEqual(verifyCorpus(), []); for (const row of sourceManifest) assert.equal(digest(readFileSync(path.join(root, row.path))), row.sha256);
  const environment = JSON.parse(checked(process.execPath, ["scripts/runtime-evaluation-environment.mjs", "linux/amd64"]));
  const executionPassed = observation.execution.cases.every(c => c.status === "passed"), stage = (status, evidence) => ({ status, evidence: [evidence] });
  const record = { task: "NF-056-12", recordedAt: new Date().toISOString(), candidate, target: "linux/amd64", sourceRevision,
    specificationRevision: pins.specificationRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
    collectorRevision, collectorSources: sources.map(file => ({ path: file, sha256: digest(readFileSync(path.join(root, file))) })),
    environment, sourceManifest, sourceManifestSha256: digest(JSON.stringify(sourceManifest)), toolchain, buildCommands,
    lockfiles: sourceManifest.filter(f => /(?:package(?:-lock)?\.json|requirements\.lock|Cargo\.(?:toml|lock)|go\.(?:mod|sum))$/u.test(f.path)),
    supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: digest(supplyBytes), status: "partial", remediation: "none" },
    artifact: { version, filename: path.basename(archive), bytes: readFileSync(archive).length, sha256: digest(readFileSync(archive)),
      manifestSha256: digest(JSON.stringify(files)), files, format: "private evaluation capsule, not a product package", signing: "not-tested" },
    previousArtifact: null, ...observation,
    stages: { build: stage("passed", "offline network-namespace buildCommands; pinned native compiler"),
      install: stage(observation.installation.status, "verified archive extracted into clean task prefix; Python hash-locked offline venv where applicable"),
      validateInspect: stage(executionPassed ? "passed" : "failed", "all 11 unchanged shared CLI cases twice with build schemas hidden"),
      offlineUse: stage(executionPassed ? "passed" : "failed", "same installed invocations; empty network routes and failed synthetic TCP control"),
      upgrade: stage("not-tested", "no previous candidate evaluation artifact found; environment-only receipts are not packages"),
      rollback: stage("not-tested", "no previous versioned candidate artifact; no simulated product release"),
      uninstall: stage(observation.uninstall.status, "task-owned install prefix removed; archive preserved; external runtimes/caches not removed"),
      signing: stage("not-tested", "no signing keys or signature verification authority") },
    immutability: { sources: true, locks: true, corpus: true }, distributionGate: "partial", outcome: "not-ready",
    limitations: ["Source-layout capsule only; no stable installed entry point or support claim.", "External exact interpreter/runtime and native system libraries are prerequisites.",
      "Build schema masking tests relocatability; it does not certify complete filesystem/credential isolation.", "Frozen measurement cohort may drift; no performance comparison or target contract update.",
      "Supply-chain advisories and unknown licenses remain unremediated; target-specific license/provenance closure is not approved.",
      "Previous artifact, upgrade, rollback and signing remain not-tested."] };
  assert.deepEqual(lifecycleErrors(record, pins), []);
  writeFileSync(outputFile, JSON.stringify(record, null, 2) + "\n");
  console.log(JSON.stringify({ candidate, artifactSha256: record.artifact.sha256, installedExecution: record.stages.validateInspect.status, outcome: record.outcome }));
  rmSync(temporary, { recursive: true });
}
try {
  if (process.argv[2] === "--inside") console.log(JSON.stringify(await inside(JSON.parse(readFileSync(process.argv[3])))));
  else { assert.equal(process.argv.length, 5); await main(process.argv[2], process.argv[3], process.argv[4]); }
} catch (error) { console.error("Linux lifecycle collection failed: " + scrub(String(error.message))); process.exitCode = 1; }
