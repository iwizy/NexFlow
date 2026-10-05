#!/usr/bin/env node
// Trusted evaluation collection only; commands are never selected by manifests.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync, realpathSync, readlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "node:net";
import { baseline, compareOutput, digest, repositoryRoot as root, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { controlsPass, seatbeltProfile } from "./lib/isolation-evidence.mjs";
import { checkEnvironment } from "./lib/evaluation-environment.mjs";
import { macosLifecycleErrors } from "./lib/macos-lifecycle-evidence.mjs";
const pins = JSON.parse(readFileSync(path.join(root, "evaluation/fidelity/source-pins.json")));
const collectorSources = ["scripts/runtime-macos-lifecycle.mjs", "scripts/lib/macos-lifecycle-evidence.mjs",
  "scripts/lib/isolation-evidence.mjs", "scripts/lib/evaluation-environment.mjs", "scripts/lib/runtime-evaluation.mjs", "evaluation/isolation/deny-canary.c"];
const json = file => JSON.parse(readFileSync(file)), hash = file => digest(readFileSync(file));
const git = (args, cwd = root) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
function manifest(directory, exclude = [], allowLinks = false) {
  const rows = [];
  function visit(current, prefix = "") {
    for (const name of readdirSync(current).sort()) {
      const file = path.join(current, name), relative = prefix ? prefix + "/" + name : name;
      if (exclude.some(e => relative === e || relative.startsWith(e + "/"))) continue;
      const stat = lstatSync(file);
      if (stat.isDirectory()) visit(file, relative);
      else if (stat.isSymbolicLink() && allowLinks) rows.push({ path: relative, kind: "symlink", targetSha256: digest(readlinkSync(file)) });
      else { assert.ok(stat.isFile(), "nonregular-artifact-file"); rows.push({ path: relative, bytes: stat.size, sha256: hash(file) }); }
    }
  }
  visit(directory); return rows;
}
function copy(from, to) { mkdirSync(path.dirname(to), { recursive: true }); cpSync(from, to, { recursive: true, dereference: true }); }
function run(cmd, args, cwd, env = process.env, timeout = 120000) {
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8", shell: false, timeout, maxBuffer: 16 * 1024 * 1024 });
  return { exitCode: r.status ?? -1, signal: r.signal ?? null, error: r.error?.code ?? null, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
function checked(cmd, args, cwd = root) {
  const r = run(cmd, args, cwd); assert.equal(r.exitCode, 0, "reviewed-command-failed"); return r.stdout.trim();
}
function scrub(value, paths) {
  let text = typeof value === "string" ? value : JSON.stringify(value);
  for (const from of [...paths].sort((a,b) => b.length-a.length)) text = text.split(from).join("<evaluation-path>");
  text = text.replace(/\/(?:Users|private\/tmp|var\/folders)\/[^\s"'<>]+/gu, "<private-path>");
  return typeof value === "string" ? text : JSON.parse(text);
}
function inspectNative(file, label, paths) {
  const architectures = checked("/usr/bin/lipo", ["-archs", file]).split(/\s+/u);
  assert.ok(architectures.includes("arm64"));
  const linkage = checked("/usr/bin/otool", ["-L", file]).split("\n").slice(1).map(v => v.trim());
  const signature = run("/usr/bin/codesign", ["-dvvv", "--entitlements", ":-", file], root);
  const detail = scrub(signature.stderr, paths);
  return { file: label, sha256: hash(file), architectures, linkage: scrub(linkage, paths),
    codeSignature: { exitCode: signature.exitCode, kind: /Signature=adhoc/u.test(detail) ? "ad-hoc"
      : signature.exitCode !== 0 ? "unsigned-or-unavailable" : /Authority=/u.test(detail) ? "existing-identity-not-approved" : "present-unclassified",
      detail, developerIDAssessment: "not-tested", notarization: "not-tested" } };
}
async function collect(id, config, output, archiveDir) {
  assert.equal(process.platform, "darwin"); assert.equal(process.arch, "arm64"); assert.equal(process.version, "v22.23.2");
  const source = realpathSync(config.sources[id]), sourceRevision = git(["rev-parse", "HEAD"], source);
  assert.equal(sourceRevision, pins.candidates[id].sourceRevision);
  assert.equal(git(["status", "--porcelain", "--untracked-files=no"], source), "");
  assert.deepEqual(verifyCorpus(), []); assert.deepEqual(verifyCorpus(baseline, file => readFileSync(path.join(source, file))), []);
  assert.equal(hash(path.join(source, "evaluation/library-cases.json")), pins.catalogSha256);
  const collectorRevision = git(["rev-parse", "HEAD"]);
  for (const file of collectorSources) assert.equal(hash(path.join(root, file)), digest(execFileSync("git", ["show", collectorRevision + ":" + file], { cwd: root })));
  const supplyFile = path.join(root, "evaluation/supply-chain", id, "inventory.json"), supply = json(supplyFile);
  assert.equal(supply.sourceRevision, sourceRevision);
  const sourceManifest = git(["ls-files", "evaluation/prototypes/" + id], source).split("\n")
    .map(file => ({ path: file, bytes: lstatSync(path.join(source, file)).size, sha256: hash(path.join(source, file)) }));
  for (const file of sourceManifest) {
    assert.equal(file.sha256, supply.sourceManifest.find(s => s.file === file.path)?.sha256);
    assert.equal(file.sha256, digest(execFileSync("git", ["show", sourceRevision + ":" + file.path], { cwd: root })));
  }
  const work = realpathSync(mkdtempSync(path.join(os.tmpdir(), "nexflow-macos-lifecycle-"))), paths = [work, root, source,
    ...Object.values(config.sources), config.python, config.pythonBase, config.canary, config.rustBinary, config.node];
  const bundle = path.join(work, "bundle"), installed = path.join(work, "installed"), inputs = path.join(work, "inputs");
  const server = createServer(socket => socket.destroy());
  try {
    for (const dir of [bundle, installed, inputs]) mkdirSync(dir);
    for (const f of baseline.corpus.files.filter(f => f.path.startsWith("schemas/"))) copy(path.join(source, f.path), path.join(bundle, f.path));
    const proto = path.join(source, "evaluation/prototypes", id), dest = path.join(bundle, "evaluation/prototypes", id);
    for (const f of sourceManifest) copy(path.join(source, f.path), path.join(bundle, f.path));
    let payload;
    if (id === "typescript") {
      for (const f of supply.artifacts) { assert.equal(hash(path.join(proto, f.file)), f.sha256); copy(path.join(proto, f.file), path.join(dest, f.file)); }
      const locked = run(config.node, [config.npmCli, "ci", "--omit=dev", "--ignore-scripts", "--offline", "--no-audit", "--fund=false"], dest,
        { PATH: path.dirname(config.node) + ":/usr/bin:/bin", npm_config_cache: config.npmCache });
      assert.equal(locked.exitCode, 0, "offline-locked-runtime-provisioning-failed");
      const lock = json(path.join(proto, "package-lock.json"));
      for (const [key, pkg] of Object.entries(lock.packages).filter(([key,pkg]) => key && !pkg.dev))
        assert.equal(json(path.join(dest, key, "package.json")).version, pkg.version);
      // npm-generated command wrappers are unused by the fixed candidate entry.
      // Keep archives regular-file-only; do not follow wrapper symlinks.
      const wrappers = path.join(dest, "node_modules/.bin");
      if (existsSync(wrappers)) rmSync(wrappers, { recursive: true });
      payload = config.node; assert.equal(hash(payload), supply.runtime.executableSha256);
    } else if (id === "python") {
      const wheels = supply.wheels;
      assert.equal(wheels.length, 15);
      for (const f of wheels) { assert.equal(hash(path.join(config.wheelhouse, f.file)), f.sha256);
        assert.ok(readFileSync(path.join(proto, "requirements.lock"), "utf8").includes("sha256:" + f.sha256)); copy(path.join(config.wheelhouse, f.file), path.join(bundle, "wheelhouse", f.file)); }
      payload = config.pythonBase; assert.equal(hash(payload), supply.runtime.executableSha256);
      assert.equal(checked(payload, ["-I", "-c", "import sys; print('.'.join(map(str, sys.version_info[:3])))"]), "3.12.14");
    } else {
      payload = id === "rust" ? config.rustBinary : path.join(proto, "bin/nexflow-go-evaluation");
      assert.equal(hash(payload), supply.artifacts.find(a => a.file === "nexflow-" + id + "-evaluation").sha256);
      copy(payload, path.join(dest, "bin", "nexflow-" + id + "-evaluation"));
    }
    const files = manifest(bundle), version = sourceRevision + ".macos.arm64." + collectorRevision;
    mkdirSync(archiveDir, { recursive: true });
    const archive = path.resolve(archiveDir, id + "-" + version + ".tar.gz");
    checked("/usr/bin/tar", ["-czf", archive, "-C", bundle, "."], work);
    const archiveHash = hash(archive), installCommands = [];
    const extract = run("/usr/bin/tar", ["-xzf", archive, "-C", installed], work);
    installCommands.push({ command: "tar -xzf <verified-capsule> -C <clean-prefix>", exitCode: extract.exitCode });
    assert.equal(extract.exitCode, 0); assert.equal(hash(archive), archiveHash); assert.deepEqual(manifest(installed), files);
    if (id === "python") {
      const venv = run(config.pythonBase, ["-I", "-m", "venv", "--without-pip", path.join(installed, "venv")], work);
      installCommands.push({ command: "CPython 3.12.14 -I -m venv --without-pip <clean-prefix>/venv", exitCode: venv.exitCode }); assert.equal(venv.exitCode, 0);
      const pip = run(config.python, ["-I", "-m", "pip", "--isolated", "--python", path.join(installed, "venv/bin/python"),
        "install", "--no-cache-dir", "--no-index", "--find-links", path.join(installed, "wheelhouse"), "--require-hashes", "--only-binary=:all:",
        "-r", path.join(installed, "evaluation/prototypes/python/requirements.lock")], work);
      installCommands.push({ command: "pip 26.2.1 --python <installed-python> install --no-index --require-hashes --only-binary=:all: <locked-wheels>",
        exitCode: pip.exitCode, stderr: scrub(pip.stderr, paths) }); assert.equal(pip.exitCode, 0);
      const check = run(path.join(installed, "venv/bin/python"), ["-I", "-m", "pip", "check"], work);
      installCommands.push({ command: "<installed-python> -I -m pip check", exitCode: check.exitCode }); assert.equal(check.exitCode, 0);
    }
    const entry = path.join(installed, "evaluation/prototypes", id);
    const command = id === "typescript" ? [config.node, path.join(entry, "dist/cli.js")]
      : id === "python" ? [path.join(installed, "venv/bin/python"), "-I", "-B", path.join(entry, "cli.py")]
        : [path.join(entry, "bin", "nexflow-" + id + "-evaluation")];
    const executable = realpathSync(command[0]), runtimeRoots = id === "typescript" ? [path.dirname(path.dirname(config.node))]
      : id === "python" ? [path.dirname(path.dirname(config.pythonBase))] : [];
    const nativeInspections = [inspectNative(executable, id === "typescript" || id === "python" ? "external-exact-runtime" : "installed-native-payload", paths)];
    if (id === "python") for (const file of manifest(path.join(installed, "venv", "lib"))) if (file.path.endsWith(".so"))
      nativeInspections.push(inspectNative(path.join(installed, "venv", "lib", file.path), "venv/lib/" + file.path, paths));
    for (const item of baseline.cases) { const fixture = path.join(inputs, item.id); copy(path.join(source, item.root), fixture);
      if (item.append) { const f = path.join(fixture, item.append.file); writeFileSync(f, readFileSync(f, "utf8") + item.append.text); } }
    const secret = path.join(work, "synthetic-read"), outside = path.join(work, "outside-canary");
    writeFileSync(secret, "fictional-read-canary");
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const env = { PATH: "/usr/bin:/bin", HOME: path.join(work, "unavailable-home"), TMPDIR: path.join(work, "unavailable-tmp"),
      LANG: "C", LC_ALL: "C", PYTHONDONTWRITEBYTECODE: "1" };
    const canary = realpathSync(config.canary), profile = seatbeltProfile({ executable, canary, readable: [installed, inputs, executable, canary, ...runtimeRoots] });
    const ctl = file => [file, outside, String(server.address().port)];
    const positive = jsonResult(run(canary, ctl(secret), work, env)), denied = jsonResult(run("/usr/bin/sandbox-exec", ["-p", profile, canary, ...ctl(secret)], work, env));
    assert.ok(controlsPass(positive, denied));
    const schemaFile = path.join(source, "schemas/project.schema.json");
    const sourcePositive = jsonResult(run(canary, ctl(schemaFile), work, env));
    const sourceDenied = jsonResult(run("/usr/bin/sandbox-exec", ["-p", profile, canary, ...ctl(schemaFile)], work, env));
    assert.equal(sourcePositive.read, 0); assert.ok([1,13].includes(sourceDenied.read));
    const outsideBefore = hash(outside), payloadBefore = digest(JSON.stringify(manifest(installed, [], true))), cases = [];
    for (const item of baseline.cases) {
      const fixture = path.join(inputs, item.id), before = digest(JSON.stringify(manifest(fixture))), attempts = [], errors = []; let previous;
      for (let n = 0; n < 2; n++) {
        const result = run("/usr/bin/sandbox-exec", ["-p", profile, ...command, item.command, "--root", fixture, ...item.args, "--format", "json"], work, env, 30000);
        let output; try { output = JSON.parse(result.stdout); } catch { errors.push("invalid-json-output"); }
        if (output) errors.push(...compareOutput(item, output, result.exitCode, result.stderr));
        if (result.signal || result.error) errors.push("process-failure");
        if (previous !== undefined && previous !== result.stdout) errors.push("nondeterministic-output"); previous = result.stdout;
        if (paths.some(p => result.stdout.includes(p) || result.stderr.includes(p))) errors.push("absolute-path-disclosure");
        if (digest(JSON.stringify(manifest(fixture))) !== before) errors.push("input-mutation");
        attempts.push({ ...result, stdout: undefined, stdoutSha256: digest(result.stdout), stderrSha256: digest(result.stderr),
          stderr: scrub(result.stderr, paths), output: output ? scrub(output, paths) : null });
      }
      cases.push({ id: item.id, status: errors.length ? "failed" : "passed", errors: [...new Set(errors)], attempts });
    }
    assert.equal(digest(JSON.stringify(manifest(installed, [], true))), payloadBefore); assert.equal(hash(outside), outsideBefore);
    assert.equal(readFileSync(secret, "utf8"), "fictional-read-canary"); assert.deepEqual(verifyCorpus(), []);
    for (const f of sourceManifest) assert.equal(hash(path.join(source, f.path)), f.sha256);
    const runtimeHash = hash(executable);
    rmSync(installed, { recursive: true }); assert.equal(existsSync(installed), false); assert.equal(hash(archive), archiveHash);
    assert.equal(hash(outside), outsideBefore); assert.equal(hash(executable === command[0] && id !== "typescript" && id !== "python" ? payload : id === "python" ? config.pythonBase : id === "typescript" ? config.node : payload), runtimeHash);
    const environment = { target: "macos/arm64", platform: process.platform, architecture: process.arch, runnerLabel: "local-native",
      imageOS: null, imageVersion: null, osVersion: checked("/usr/bin/sw_vers", ["-productVersion"]), osBuild: checked("/usr/bin/sw_vers", ["-buildVersion"]),
      kernel: os.release(), cpuModel: os.cpus()[0].model, cpuCount: os.cpus().length, memoryBytes: os.totalmem(), libc: null,
      translated: checked("/usr/sbin/sysctl", ["-in", "sysctl.proc_translated"]) === "1", nativeArm64: checked("/usr/sbin/sysctl", ["-n", "hw.optional.arm64"]) === "1" };
    const failed = cases.some(c => c.status === "failed"), stage = (status, text) => ({ status, evidence: [text] });
    const record = { task: "NF-056-13", recordedAt: new Date().toISOString(), candidate: id, target: "macos/arm64", sourceRevision,
      specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
      collectorRevision, collectorSources: collectorSources.map(file => ({ path: file, sha256: hash(path.join(root, file)) })),
      sourceManifest, sourceManifestSha256: digest(JSON.stringify(sourceManifest)),
      lockfiles: sourceManifest.filter(f => /(?:package(?:-lock)?\.json|requirements\.lock|Cargo\.(?:toml|lock)|go\.(?:mod|sum))$/u.test(f.path)),
      prerequisitesSha256: hash(path.join(root, "evaluation/lifecycle/macos/prerequisites.json")),
      supplyChain: { revision: "fed105367da915347a92896eb67c0446d9e9b2d7", inventorySha256: hash(supplyFile), status: "partial", remediation: "none" },
      toolchain: pins.candidates[id].toolchain, runtime: { version: supply.runtime.version, executableSha256: runtimeHash, externalRequired: !!supply.runtime.requiredExternal },
      build: { mode: "reuse-hash-verified-NF-056-11-native-build", commands: supply.commands, freshBuild: "not-tested", supplyCollectorRevision: supply.collectorRevision },
      artifact: { version, filename: path.basename(archive), bytes: lstatSync(archive).size, sha256: archiveHash,
        files, manifestSha256: digest(JSON.stringify(files)), format: "private source-layout evaluation capsule", publicPublication: "none",
        retained: "task-local temporary archive; no durable package hosting or retention guarantee" },
      nativeInspections, environment, environmentSha256: digest(JSON.stringify(environment)),
      cohort: { matched: false, status: "supplemental-drift", blockers: checkEnvironment(json(path.join(root, "evaluation/environment-contract.json")), environment) },
      previousArtifact: null,
      installation: { status: "passed", archiveVerified: true, manifestVerified: true, commands: installCommands,
        networkBoundary: "extraction/venv/hash-locked no-index provisioning is separate trusted setup, not OS-sandboxed installation" },
      isolation: { positive, denied, beforeCandidate: true, sourceSchemaRead: { positive: sourcePositive.read, denied: sourceDenied.read },
        profileSha256: digest(profile), canarySha256: hash(canary), scope: "installed invocations only; OS network/file-write/process denial and source-schema read denial" },
      execution: { invocation: scrub(command, paths), cases },
      uninstall: { status: "passed", prefixAbsent: true, archivePreserved: true, outsidePreserved: true, externalRuntimePreserved: true },
      stages: { package: stage("passed", "unchanged native NF-056-11 payloads verified by hash, packaged with pinned source/locks/schemas; no fresh rebuild claim"),
        install: stage("passed", "clean extraction and complete capsule manifest verification; Python offline hash-locked venv"),
        validateInspect: stage(failed ? "failed" : "passed", "11 unchanged shared CLI cases twice from installed prefix with source schemas denied"),
        offlineUse: stage(failed ? "failed" : "passed", "same installed invocations after paired OS network controls"),
        upgrade: stage("not-tested", "no actual previous macOS candidate capsule in queried CI catalog or reviewed task-local evidence"),
        rollback: stage("not-tested", "no genuine previous macOS evaluation artifact; Linux capsules/source binaries are not a predecessor"),
        uninstall: stage("passed", "only task-owned install prefix removed; archive/outside canary/external executable unchanged"),
        signing: stage("not-tested", "read-only existing Mach-O signature/entitlement inspection; no authorized Developer ID identity or signing operation"),
        notarization: stage("not-tested", "no permitted Apple submission credentials/authority or ticket; no upload, keychain mutation or borrowed keys") },
      immutability: { sources: true, locks: true, corpus: true, installedPayload: true }, distributionGate: "partial", outcome: "not-ready",
      limitations: ["Native local macOS differs from frozen macos-15 image/CPU/memory; supplemental lifecycle only, not common benchmark cohort.",
        "Private source-layout evaluation capsule only; no stable installed entry point, public package, supported distribution or product release.",
        "Native payloads reuse verified supply-chain builds; new clean/cached build performance and reproducibility remain not-tested.",
        "External exact Node/CPython and system libraries remain prerequisites; native dependency closure, license and advisory risks stay open.",
        "Allow-default Seatbelt template tests bounded effects; metadata/system reads, Mach IPC, keychain brokers, inherited facilities and races are not completely isolated.",
        "Archive extraction and venv provisioning are trusted task-local setup, not OS-sandboxed installation or a complete offline installer.",
        "codesign inspection describes existing bytes only; ad-hoc signatures are not Developer ID approval/notarization. No signature policy or ticket lifecycle tested.",
        "No predecessor artifact, upgrade/rollback, authorized signing/notarization, architecture acceptance or full fidelity gate is claimed."] };
    assert.deepEqual(macosLifecycleErrors(record, pins), []);
    writeFileSync(output, JSON.stringify(record, null, 2) + "\n");
    console.log(JSON.stringify({ candidate: id, archiveSha256: archiveHash, casesPassed: cases.filter(c => c.status === "passed").length, casesFailed: cases.filter(c => c.status === "failed").length, cohort: record.cohort.status, outcome: record.outcome }));
  } finally { server.close(); rmSync(work, { recursive: true, force: true }); }
}
function jsonResult(r) { assert.equal(r.exitCode, 0); assert.equal(r.stderr, ""); return JSON.parse(r.stdout); }
try {
  assert.equal(process.argv.length, 6); assert.ok(pins.candidates[process.argv[2]]);
  await collect(process.argv[2], json(process.argv[3]), process.argv[4], process.argv[5]);
} catch (e) { console.error("macOS lifecycle collection failed: " + String(e.message).replace(/\/(?:Users|private\/tmp|var\/folders)\/[^\s]+/gu, "<private-path>").slice(0,1000)); process.exitCode = 1; }
