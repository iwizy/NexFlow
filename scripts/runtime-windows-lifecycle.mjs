#!/usr/bin/env node
// Trusted native evaluation harness; no command is selected by a manifest.
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync, renameSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { baseline, compareOutput, digest, repositoryRoot as root, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { peMachine, windowsErrors, windowsCollectorFiles } from "./lib/windows-lifecycle-evidence.mjs";
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const temp = mkdtempSync(path.join(os.tmpdir(), "nexflow-windows-"));
const scrub = value => String(value).split(root).join("<source-checkout>").split(temp).join("<evaluation>")
  .replace(/[A-Z]:[\\/][^\r\n"<>]+/giu, "<evaluation-path>");
function run(command, args, cwd = root, timeout = 600000, extraEnv = {}) {
  const permitted = ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA",
    "PSModulePath", "ProgramFiles", "ProgramFiles(x86)", "ProgramW6432", "CARGO_HOME", "RUSTUP_HOME", "GOPATH", "GOCACHE", "INCLUDE", "LIB", "LIBPATH"];
  const clean = Object.fromEntries(permitted.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
  const r = spawnSync(command, args, { cwd, env: { ...clean, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8", GOTOOLCHAIN: "local", GOPROXY: "off", CGO_ENABLED: "0", ...extraEnv },
    encoding: "utf8", timeout, maxBuffer: 32 * 1024 * 1024, shell: false });
  return { exitCode: r.status ?? -1, error: r.error?.code ?? null, signal: r.signal ?? null, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
function checked(cmd, args, cwd) { const r = run(cmd, args, cwd); assert.equal(r.exitCode, 0, scrub(r.stderr.slice(-1500)) || "command-failed"); return r.stdout.trim(); }
function manifest(directory) {
  const rows = [];
  function visit(dir, prefix = "") { for (const name of readdirSync(dir).sort()) {
    const file = path.join(dir, name), rel = prefix ? prefix + "/" + name : name, stat = lstatSync(file);
    if (stat.isDirectory()) visit(file, rel); else if (stat.isFile()) rows.push({ path: rel, bytes: stat.size, sha256: digest(readFileSync(file)) });
    else throw new Error("nonregular-artifact-file");
  } }
  visit(directory); return rows;
}
function copy(source, dest) { mkdirSync(path.dirname(dest), { recursive: true }); cpSync(source, dest, { recursive: true, dereference: true }); }
const npmCli = path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const npm = args => [process.execPath, [npmCli, ...args]];
async function main(candidate, output, artifactDir) {
  assert.equal(process.platform, "win32", "native Windows required"); assert.equal(process.arch, "x64", "native AMD64 required");
  assert.ok(pins.candidates[candidate]); assert.deepEqual(verifyCorpus(), []); assert.equal(git(["status", "--porcelain", "--untracked-files=no"]), "");
  const collectorRevision = git(["rev-parse", "HEAD"]), sourceRevision = pins.candidates[candidate].sourceRevision;
  const sourceManifest = git(["ls-tree", "-r", "--name-only", sourceRevision, "evaluation/prototypes/" + candidate]).split("\n").filter(f => !f.endsWith("README.md"))
    .map(file => { const bytes = readFileSync(path.join(root, file)); assert.equal(digest(bytes), digest(execFileSync("git", ["show", sourceRevision + ":" + file], { cwd: root })));
      return { path: file, sha256: digest(bytes) }; });
  const inventoryBytes = readFileSync(path.join(root, "evaluation/supply-chain", candidate, "inventory.json"));
  assert.equal(JSON.parse(inventoryBytes).sourceRevision, sourceRevision);
  // The fixed, read-only OS probe uses the hosted context; candidates never inherit its credential-bearing environment.
  const environment = JSON.parse(execFileSync(process.execPath, ["scripts/runtime-evaluation-environment.mjs", "windows/amd64"], { cwd: root, encoding: "utf8", timeout: 60000 }));
  const proto = path.join(root, "evaluation/prototypes", candidate), bundle = path.join(temp, "bundle");
  let installed = path.join(temp, "installed space юникод");
  mkdirSync(bundle); const commands = [], nativeBinaries = [], toolchain = { node: process.version };
  const stage = (status, evidence) => ({ status, evidence: [evidence] });
  const stages = Object.fromEntries(["build", "install", "validateInspect", "offlineUse", "upgrade", "rollback", "uninstall", "signing"].map(k => [k, stage("not-tested", "Not reached or unavailable; not evidence of a pass.")]));
  const blockers = ["No verified Windows OS network/filesystem/credential denial harness in this authorized experiment; offline use and security isolation are not-tested.",
    "No genuine previous Windows evaluation capsule in the retained artifact inventory; upgrade and rollback require one.",
    "No specifically authorized signing certificate or publisher identity; Authenticode observation is not approved package signing."];
  let artifact = null, cases = [], buildSchemasHidden = false, installedPrefixVerified = false, installCommands = [], signatures = [];
  function command(cmd, args, cwd = root) {
    const r = run(cmd, args, cwd); commands.push({ command: scrub([cmd, ...args].join(" ")), exitCode: r.exitCode, error: r.error,
      stdoutSha256: digest(r.stdout), stderrSha256: digest(r.stderr), stderrTail: scrub(r.stderr.slice(-1600)) });
    assert.equal(r.exitCode, 0, scrub(r.stderr.slice(-1200)) || "build-command-failed"); return r.stdout.trim();
  }
  function binary(file, role) { const bytes = readFileSync(file), machine = peMachine(bytes); assert.equal(machine, 0x8664, "not-amd64-PE"); nativeBinaries.push({ role, machine, sha256: digest(bytes) }); }
  try {
    assert.equal(toolchain.node, "v22.23.2"); toolchain.npm = checked(...npm(["--version"])); assert.equal(toolchain.npm, "10.9.8"); binary(process.execPath, "external-node-runtime");
    for (const f of baseline.corpus.files.filter(f => f.path.startsWith("schemas/"))) copy(path.join(root, f.path), path.join(bundle, f.path));
    const dest = path.join(bundle, "evaluation/prototypes", candidate);
    if (candidate === "typescript") {
      command(...npm(["run", "build"]), proto);
      for (const file of ["dist", "package.json", "package-lock.json"]) copy(path.join(proto, file), path.join(dest, file));
      command(...npm(["ci", "--omit=dev", "--ignore-scripts", "--offline", "--no-audit", "--fund=false"]), dest);
      rmSync(path.join(dest, "node_modules/.bin"), { recursive: true, force: true });
      toolchain.compiler = checked(process.execPath, [path.join(proto, "node_modules/typescript/lib/tsc.js"), "--version"]);
      assert.equal(toolchain.compiler, "Version 7.0.2");
    } else if (candidate === "python") {
      toolchain.python = checked("python", ["--version"]); assert.equal(toolchain.python, "Python 3.12.14");
      toolchain.pythonArchitecture = checked("python", ["-I", "-c", "import struct; print(struct.calcsize('P') * 8)"]); assert.equal(toolchain.pythonArchitecture, "64");
      binary(checked("python", ["-I", "-c", "import sys; print(sys.executable)"]), "external-cpython-runtime");
      for (const row of sourceManifest) copy(path.join(root, row.path), path.join(bundle, row.path));
      copy(path.join(root, "wheelhouse"), path.join(bundle, "wheelhouse"));
      const hashes = new Set(readFileSync(path.join(proto, "requirements.lock"), "utf8").match(/(?<=sha256:)[0-9a-f]{64}/gu));
      assert.ok(manifest(path.join(bundle, "wheelhouse")).every(w => w.path.endsWith(".whl") && hashes.has(w.sha256)));
      assert.equal(manifest(path.join(bundle, "wheelhouse")).length, 15);
      command("python", ["-I", "-m", "compileall", "-q", proto]);
    } else if (candidate === "rust") {
      toolchain.rust = checked("rustc", ["+1.99.0", "--version"]); toolchain.cargo = checked("cargo", ["+1.99.0", "--version"]);
      assert.ok(toolchain.rust.startsWith("rustc 1.99.0 ")); assert.ok(toolchain.cargo.startsWith("cargo 1.99.0 "));
      toolchain.target = checked("rustc", ["+1.99.0", "-vV"]).split("\n").find(l => l.startsWith("host:")); assert.equal(toolchain.target, "host: x86_64-pc-windows-msvc");
      command("cargo", ["+1.99.0", "build", "--release", "--frozen", "--manifest-path", path.join(proto, "Cargo.toml")]);
      const exe = path.join(proto, "target/release/nexflow-rust-evaluation.exe"); binary(exe, "candidate-executable"); copy(exe, path.join(dest, "bin/nexflow-rust-evaluation.exe"));
    } else {
      toolchain.go = checked("go", ["version"]); assert.ok(toolchain.go.includes("go1.27.1 windows/amd64"));
      command("go", ["build", "-mod=readonly", "-trimpath", "-buildvcs=false", "-o", "bin/nexflow-go-evaluation.exe", "./cmd/cli"], proto);
      const exe = path.join(proto, "bin/nexflow-go-evaluation.exe"); binary(exe, "candidate-executable"); copy(exe, path.join(dest, "bin/nexflow-go-evaluation.exe"));
    }
    const files = manifest(bundle), version = sourceRevision + ".windows.amd64." + collectorRevision;
    mkdirSync(artifactDir, { recursive: true }); const archive = path.resolve(artifactDir, candidate + "-" + version + ".tar.gz");
    command("tar.exe", ["-czf", archive, "-C", bundle, "."]);
    artifact = { version, filename: path.basename(archive), bytes: readFileSync(archive).length, sha256: digest(readFileSync(archive)), files,
      manifestSha256: digest(JSON.stringify(files)), format: "private source-layout evaluation capsule; not product package", signing: "not-tested" };
    stages.build = stage("passed", "Native Windows build and PE AMD64 inspection; package-manager offline flags do not prove OS network denial.");
    try {
      mkdirSync(installed); const extraction = run("tar.exe", ["-xzf", archive, "-C", installed]);
      installCommands.push({ command: "tar -xzf <verified-capsule> -C <unicode-space-prefix>", exitCode: extraction.exitCode, error: extraction.error, stderr: scrub(extraction.stderr) });
      if (extraction.exitCode !== 0) {
        // Preserve the real Unicode extraction failure, then test the same capsule in an ASCII-space prefix as supplemental evidence.
        rmSync(installed, { recursive: true }); installed = path.join(temp, "installed space ascii"); mkdirSync(installed);
        const fallback = run("tar.exe", ["-xzf", archive, "-C", installed]);
        installCommands.push({ command: "tar -xzf <same-verified-capsule> -C <ascii-space-prefix> (supplemental)", exitCode: fallback.exitCode, error: fallback.error, stderr: scrub(fallback.stderr) });
        assert.equal(fallback.exitCode, 0, scrub(fallback.stderr));
        blockers.push("Unicode-prefix archive extraction failed; successful ASCII-space extraction does not turn that path/encoding failure into a pass.");
      }
      assert.deepEqual(manifest(installed), files);
      const entry = path.join(installed, "evaluation/prototypes", candidate);
      let cli;
      if (candidate === "python") {
        const venv = path.join(installed, "venv"), python = path.join(venv, "Scripts/python.exe");
        const a = run("python", ["-I", "-m", "venv", "--without-pip", venv]); installCommands.push({ command: "CPython 3.12.14 -I -m venv --without-pip <installed-venv>", exitCode: a.exitCode }); assert.equal(a.exitCode, 0);
        const builder = path.join(root, ".venv/Scripts/python.exe");
        const b = run(builder, ["-I", "-m", "pip", "--isolated", "--python", python, "install", "--no-cache-dir", "--no-index", "--find-links", path.join(installed, "wheelhouse"), "--require-hashes", "--only-binary=:all:", "-r", path.join(entry, "requirements.lock")]);
        installCommands.push({ command: "pip 26.2.1 --python <installed-python> install --no-index --require-hashes --only-binary=:all: <locked-wheels>", exitCode: b.exitCode, stderr: scrub(b.stderr) }); assert.equal(b.exitCode, 0);
        assert.equal(checked(python, ["-I", "-m", "pip", "--version"]).split(" ")[1], "26.2.1"); checked(python, ["-I", "-m", "pip", "check"]);
        for (const f of manifest(venv).filter(f => /\.pyd$/iu.test(f.path))) binary(path.join(venv, f.path), "installed-native-wheel:" + f.path);
        cli = [python, "-I", "-B", path.join(entry, "cli.py")];
      } else cli = candidate === "typescript" ? [process.execPath, path.join(entry, "dist/cli.js")] : [path.join(entry, "bin/nexflow-" + candidate + "-evaluation.exe")];
      installedPrefixVerified = true;
      stages.install = stage(extraction.exitCode === 0 ? "passed" : "failed", extraction.exitCode === 0
        ? "Checksum-verified capsule extracted into Unicode-space prefix; exact external runtime retained."
        : "Unicode extraction failed; the same checksum-verified capsule was installed into a clean ASCII-space prefix for supplemental native CLI runs.");
      // Hide only this disposable checkout's schema directory, restoring it in finally.
      const originalSchemas = path.join(root, "schemas"), hiddenSchemas = path.join(temp, "hidden-build-schemas");
      renameSync(originalSchemas, hiddenSchemas); buildSchemasHidden = true;
      try {
        for (const item of baseline.cases) {
          const input = path.join(temp, "inputs space юникод", item.id); copy(path.join(root, item.root), input);
          if (item.append) { const f = path.join(input, item.append.file); writeFileSync(f, readFileSync(f, "utf8") + item.append.text); }
          const before = digest(JSON.stringify(manifest(input))), attempts = [], errors = []; let previous;
          for (let n = 0; n < 2; n++) {
            const result = run(cli[0], [...cli.slice(1), item.command, "--root", input, ...item.args, "--format", "json"], temp, 10000);
            let output; try { output = JSON.parse(result.stdout); } catch { errors.push("invalid-json-output"); }
            if (output) errors.push(...compareOutput(item, output, result.exitCode, result.stderr));
            if (result.error || result.signal) errors.push("process-failure");
            if (previous !== undefined && previous !== result.stdout) errors.push("nondeterministic-output"); previous = result.stdout;
            if ([input, input.replaceAll("\\", "/")].some(s => result.stdout.includes(s) || result.stderr.includes(s))) errors.push("absolute-path-disclosure");
            if (digest(JSON.stringify(manifest(input))) !== before) errors.push("input-mutation");
            attempts.push({ exitCode: result.exitCode, error: result.error, signal: result.signal, stdoutSha256: digest(result.stdout), stderrSha256: digest(result.stderr),
              output: output ? JSON.parse(scrub(JSON.stringify(output))) : null, stderr: scrub(result.stderr) });
          }
          cases.push({ id: item.id, status: errors.length ? "failed" : "passed", errors: [...new Set(errors)], attempts });
        }
      } finally { renameSync(hiddenSchemas, originalSchemas); }
      stages.validateInspect = stage(cases.every(c => c.status === "passed") ? "passed" : "failed", "All 11 unchanged CLI cases twice from installed capsule with source-checkout schemas hidden; UTF-8, spaces and Unicode paths exercised.");
      if (cases.some(c => c.status === "failed")) blockers.push("Installed CLI fidelity/relocation failures retained; candidate sources and locks were not repaired.");
      if (candidate !== "python") assert.deepEqual(manifest(installed), files, "installed-payload-mutation");
      if (["rust", "go"].includes(candidate)) {
        const signature = run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$s=Get-AuthenticodeSignature -LiteralPath $env:TASK_SIGNATURE_FILE; @{status=[string]$s.Status; signatureType=[string]$s.SignatureType} | ConvertTo-Json -Compress"], installed, 10000, { TASK_SIGNATURE_FILE: cli[0] });
        let observation; try { observation = JSON.parse(signature.stdout); } catch { observation = null; }
        signatures.push({ scope: "read-only candidate PE Authenticode observation; not publisher approval", exitCode: signature.exitCode, observation });
      } else signatures.push({ scope: "source-layout interpreter capsule", status: "not-tested", reason: "No signed package identity or authorized signing path." });
    } catch (error) { if (!installedPrefixVerified) stages.install = stage("failed", scrub(error.message));
      else stages.validateInspect = stage("failed", scrub(error.message)); blockers.push("Installation/execution blocker: " + scrub(error.message)); }
    finally { const before = digest(readFileSync(archive)); if (existsSync(installed)) rmSync(installed, { recursive: true });
      stages.uninstall = stage(!existsSync(installed) && digest(readFileSync(archive)) === before ? "passed" : "failed", "Removed only task-owned installed prefix; capsule, external runtimes and build caches retained."); }
  } catch (error) { stages.build = stage("failed", scrub(error.message)); blockers.push("Native toolchain/provisioning/build blocker: " + scrub(error.message)); }
  assert.deepEqual(verifyCorpus(), []); for (const f of sourceManifest) assert.equal(digest(readFileSync(path.join(root, f.path))), f.sha256);
  for (const k of ["offlineUse", "upgrade", "rollback", "signing"]) stages[k] = stage("not-tested", blockers[k === "offlineUse" ? 0 : ["upgrade", "rollback"].includes(k) ? 1 : 2]);
  const record = { task: "NF-056-14", recordedAt: new Date().toISOString(), candidate, target: "windows/amd64", sourceRevision,
    specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
    collectorRevision, collectorSources: windowsCollectorFiles.map(f => ({ path: f, sha256: digest(readFileSync(path.join(root, f))) })), environment, toolchain,
    sourceManifest, sourceManifestSha256: digest(JSON.stringify(sourceManifest)), lockfiles: sourceManifest.filter(f => /(?:package(?:-lock)?\.json|requirements\.lock|Cargo\.(?:toml|lock)|go\.(?:mod|sum))$/u.test(f.path)),
    supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: digest(inventoryBytes), status: "partial", remediation: "none" },
    buildCommands: commands, nativeBinaries, artifact, previousArtifact: null, installation: { commands: installCommands, installedPrefixVerified, scope: "private evaluation prefix only; ASCII fallback is supplemental, not a Unicode path pass" },
    isolation: { network: "not-tested", filesystem: "not-tested", credential: "not-tested", buildSchemasHidden, scope: "Fresh hosted VM and clean temporary prefix are not an OS sandbox." },
    execution: { cases }, signatures, stages, blockers, immutability: { sources: true, locks: true, corpus: true }, distributionGate: "partial", outcome: "not-ready",
    limitations: ["No product lifecycle or stable system-wide installed command; no support or architecture acceptance.", "Frozen fingerprint drift is supplemental, not a target-contract change.", "Existing advisory/license risks remain open; interpreter/MSVC/native prerequisites are not bundled closure.", "Native execution is not performance evidence or full 352-case library parity."] };
  assert.deepEqual(windowsErrors(record, pins), []); mkdirSync(path.dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(record, null, 2) + "\n");
  rmSync(temp, { recursive: true }); console.log(JSON.stringify({ candidate, build: stages.build.status, installedExecution: stages.validateInspect.status, outcome: record.outcome }));
}
try { assert.equal(process.argv.length, 5); await main(process.argv[2], process.argv[3], process.argv[4]); }
catch (error) { console.error("Windows lifecycle collection failed: " + scrub(error.message)); process.exitCode = 1; }
