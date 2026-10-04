#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { readFileSync } from "node:fs";
import { cp, lstat, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseline, compareOutput, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { controlsPass, seatbeltProfile } from "./lib/isolation-evidence.mjs";

const pins = JSON.parse(readFileSync(path.join(repositoryRoot, "evaluation/fidelity/source-pins.json"), "utf8"));
async function snapshot(directory) {
  const inventory = [];
  async function visit(current, prefix = "") {
    for (const name of (await readdir(current)).sort()) {
      const file = path.join(current, name), relative = prefix ? prefix + "/" + name : name;
      const stat = await lstat(file);
      if (stat.isDirectory()) { inventory.push([relative, "directory"]); await visit(file, relative); }
      else if (stat.isSymbolicLink()) inventory.push([relative, "symlink"]);
      else inventory.push([relative, digest(await readFile(file))]);
    }
  }
  await visit(directory);
  return digest(JSON.stringify(inventory));
}
const shellFreeRun = (command, args, cwd, env) => spawnSync(command[0], [...command.slice(1), ...args],
  { cwd, env, encoding: "utf8", shell: false, timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
export async function runIsolation(id, configuration) {
  assert.equal(process.platform, "darwin");
  assert.equal(process.arch, "arm64");
  assert.equal(process.version, "v22.23.2");
  const pin = pins.candidates[id];
  assert(pin, "Reviewed candidate required");
  const root = await realpath(configuration.sources[id]), canary = await realpath(configuration.canary);
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  assert.equal(git("rev-parse", "HEAD"), pin.sourceRevision);
  assert.equal(git("status", "--porcelain", "--untracked-files=no"), "");
  assert.deepEqual(verifyCorpus(), []);
  assert.deepEqual(verifyCorpus(baseline, file => readFileSync(path.join(root, file))), []);
  assert.equal(digest(readFileSync(path.join(root, "evaluation/library-cases.json"))), pins.catalogSha256);
  const native = suffix => path.join(root, "evaluation/prototypes/" + id, suffix);
  const commands = {
    typescript: [process.execPath, native("dist/cli.js")],
    python: [configuration.python, "-I", "-B", native("cli.py")],
    rust: [path.join(configuration.rustBinaries, "nexflow-rust-evaluation")],
    go: [native("bin/nexflow-go-evaluation")]
  };
  const command = commands[id];
  // Keep the invocation spelling for Python's venv selection, but bind the
  // OS executable exception to the actual reviewed executable.
  const executable = await realpath(command[0]);
  const runtimeRoots = (configuration.runtimeRoots[id] ?? []).map(value => path.resolve(value));
  const temporary = await realpath(await mkdtemp(path.join(tmpdir(), "nexflow-isolation-")));
  const fixtures = path.join(temporary, "fixtures"), secret = path.join(temporary, "synthetic-credential");
  const outside = path.join(temporary, "outside-write"), marker = "nf056-synthetic-secret-canary";
  const server = createServer(socket => socket.destroy());
  const env = { PATH: "/usr/bin:/bin", HOME: path.join(temporary, "unavailable-home"),
    TMPDIR: path.join(temporary, "unavailable-tmp"), LANG: "C", LC_ALL: "C", PYTHONDONTWRITEBYTECODE: "1" };
  const results = [];
  try {
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), fixtures, { recursive: true });
    await writeFile(secret, marker);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const readable = [root, fixtures, canary, command[0], executable, ...runtimeRoots];
    const profile = seatbeltProfile({ executable, canary, readable });
    const controlArgs = [secret, outside, String(server.address().port)];
    const positiveRun = shellFreeRun([canary], controlArgs, root, env);
    const deniedRun = shellFreeRun(["/usr/bin/sandbox-exec", "-p", profile, canary], controlArgs, root, env);
    assert.equal(positiveRun.status, 0); assert.equal(deniedRun.status, 0);
    assert.equal(positiveRun.stderr, ""); assert.equal(deniedRun.stderr, "");
    const positive = JSON.parse(positiveRun.stdout), denied = JSON.parse(deniedRun.stdout);
    assert(controlsPass(positive, denied), "Independent positive/negative controls must pass before candidate");
    assert.equal(await readFile(secret, "utf8"), marker);
    assert.equal(await readFile(outside, "utf8"), "synthetic-write");
    const beforeOutside = digest(await readFile(outside));
    const denyCommand = ["/usr/bin/sandbox-exec", "-p", profile, ...command];
    async function experiment(item, fixture, extra = {}) {
      const before = await snapshot(fixtures), errors = [];
      const runs = [0, 1].map(() => shellFreeRun(denyCommand,
        [item.command, "--root", fixture, ...(item.args ?? []), "--format", "json"], root, env));
      if (runs[0].stdout !== runs[1].stdout || runs[0].status !== runs[1].status) errors.push("non-repeatable");
      for (const observed of runs) {
        if (observed.error || observed.signal || observed.stderr !== "") errors.push("candidate-process-failure");
        if ([temporary, root, repositoryRoot, marker].some(value => observed.stdout?.includes(value) || observed.stderr?.includes(value))) errors.push("redaction-or-path-leak");
        try {
          const value = JSON.parse(observed.stdout);
          if (item.expected) errors.push(...compareOutput(item, value, observed.status, observed.stderr));
          else {
            if (observed.status !== item.exitCode || value.exitCode !== item.exitCode) errors.push("wrong-exit");
            if (value.executionAuthorized !== false) errors.push("execution-authority");
            if (extra.code && !value.diagnostics.some(entry => entry.code === extra.code)) errors.push("wrong-diagnostic");
          }
        } catch { errors.push("invalid-json-output"); }
      }
      if (await snapshot(fixtures) !== before || digest(await readFile(outside)) !== beforeOutside ||
        await readFile(secret, "utf8") !== marker) errors.push("input-or-outside-mutation");
      results.push({ id: item.id, result: errors.length ? "failed" : "passed", errors: [...new Set(errors)],
        processRuns: 2, exitCode: runs[0].status, stdoutSha256: digest(runs[0].stdout ?? "") });
    }
    for (const item of baseline.cases) {
      const fixture = path.join(fixtures, item.id);
      await cp(path.join(root, item.root), fixture, { recursive: true });
      if (item.append) await appendFile(path.join(fixture, item.append.file), item.append.text);
      await experiment(item, fixture);
    }
    const minimal = path.join(fixtures, "supplemental");
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), minimal, { recursive: true });
    await experiment({ id: "absolute-file", command: "validate", args: ["--file", secret], exitCode: 1 }, minimal);
    await experiment({ id: "parent-traversal-file", command: "validate", args: ["--file", "../../../synthetic-credential"], exitCode: 1 }, minimal);
    await experiment({ id: "remote-file-locator", command: "validate", args: ["--file", "https://example.invalid/manifest.yaml"], exitCode: 1 }, minimal);
    await symlink(secret, path.join(minimal, "linked.yaml"));
    await experiment({ id: "file-symlink", command: "validate", args: ["--file", "linked.yaml"], exitCode: 1 }, minimal);
    await symlink(minimal, path.join(fixtures, "root-link"));
    await experiment({ id: "root-symlink-reviewed-alias", command: "validate", exitCode: 0 }, path.join(fixtures, "root-link"));
    const protectedRoot = path.join(temporary, "protected-root");
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), protectedRoot, { recursive: true });
    await symlink(protectedRoot, path.join(fixtures, "protected-root-link"));
    await experiment({ id: "root-symlink-protected-directory", command: "validate", exitCode: 1 }, path.join(fixtures, "protected-root-link"));
    await experiment({ id: "unknown-effect-command", command: "run", exitCode: 2 }, minimal,
      { code: "NEXFLOW-PROTOTYPE-USAGE" });
    const inert = path.join(fixtures, "inert-declarations");
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), inert, { recursive: true });
    await appendFile(path.join(inert, "project.yaml"),
      "\nx-test-inert:\n  command: /usr/bin/true\n  remoteLocator: https://example.invalid/never-fetched\n  credentialFile: " + marker + "\n");
    await experiment({ id: "inert-command-remote-credential-declarations", command: "validate", exitCode: 0 }, inert);
    await experiment({ id: "inert-inspection", command: "inspect", exitCode: 0 }, inert);
    const redaction = path.join(fixtures, "redaction");
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), redaction, { recursive: true });
    const source = await readFile(path.join(redaction, "project.yaml"), "utf8");
    await writeFile(path.join(redaction, "project.yaml"), source.replace(/^  description:.*$/mu,
      "  description: {sensitiveField: " + marker + "}"));
    await experiment({ id: "synthetic-value-redaction", command: "validate", exitCode: 1 }, redaction,
      { code: "NF-SCHEMA" });
    assert.deepEqual(verifyCorpus(), []);
    assert.deepEqual(verifyCorpus(baseline, file => readFileSync(path.join(root, file))), []);
    assert.equal(git("status", "--porcelain", "--untracked-files=no"), "");
    return {
      formatVersion: "0.1-draft", task: "NF-056-10", candidate: id, recordedAt: new Date().toISOString(),
      harnessRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
      prototypeRevision: pin.sourceRevision, publishedHead: pin.publishedHead,
      prerequisite: { pullRequest: "https://github.com/iwizy/NexFlow/pull/" + pin.pullRequest, ciRun: pin.ciRun },
      specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision,
      corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
      environment: { platform: process.platform, architecture: process.arch,
        osVersion: execFileSync("/usr/bin/sw_vers", ["-productVersion"], { encoding: "utf8" }).trim(),
        osBuild: execFileSync("/usr/bin/sw_vers", ["-buildVersion"], { encoding: "utf8" }).trim(),
        node: process.version, mode: "native-source-bound-os-deny", inheritedEnvironment: "allowlisted",
        inheritedDescriptors: "stdio-only-by-spawn-contract" },
      targetContractMatch: false,
      controls: { positive, denied, result: "passed", beforeCandidate: true,
        scope: "synthetic file read, outside write, loopback connect/bind, fork, spawn, self-spawn" },
      artifacts: { executableSha256: digest(await readFile(command[0])),
        ...(id === "typescript" || id === "python" ? { entrySha256: digest(await readFile(command.at(-1))) } : {}),
        canarySha256: digest(await readFile(canary)), profileSha256: digest(profile),
        profileTemplateSha256: digest(readFileSync(path.join(repositoryRoot, "scripts/lib/isolation-evidence.mjs"))),
        runnerSourceSha256: digest(readFileSync(path.join(repositoryRoot, "scripts/runtime-isolation-run.mjs"))),
        canarySourceSha256: digest(readFileSync(path.join(repositoryRoot, "evaluation/isolation/deny-canary.c"))) },
      toolchain: pin.toolchain, results, corpusAfter: "unchanged", sourceAfter: "unchanged",
      offlineOperation: { status: results.some(row => row.result === "failed") ? "failed" : "passed",
        scope: "21 CLI scenarios twice after separate cached provisioning with active OS network denial" },
      securityBoundary: { status: "partial", scope: "tested deny controls and bounded CLI scenarios, not complete architecture security approval" },
      otherTargets: [{ target: "linux/amd64", status: "not-tested" }, { target: "windows/amd64", status: "not-tested" }],
      outcome: "not-ready", selection: null,
      limitations: [
        "Local macOS 27 ARM64 is supplemental, not the frozen macos-15 CI image/cohort; no target lifecycle or performance evidence.",
        "Seatbelt profile starts allow-default then denies network/process/file effects; system reads, parent-directory enumeration and global file metadata remain allowed.",
        "Mach IPC, keychain brokers, inherited OS facilities, replacement races, devices, resource exhaustion and every possible secret channel are not fully tested.",
        "Synthetic canaries are not real credentials; redaction checks cover only declared scenarios and do not establish a general secret detector.",
        "Compiled source artifacts and separate pinned caches are not signed provenance, release artifacts or supply-chain acceptance.",
        "Original candidate scorecards and all failed fidelity/unsupported semantic gates remain unchanged."
      ]
    };
  } finally {
    server.close();
    await rm(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 4);
    const report = await runIsolation(process.argv[2], JSON.parse(process.argv[3]));
    process.stdout.write(JSON.stringify(report) + "\n");
    process.exitCode = report.results.some(row => row.result === "failed") ? 1 : 0;
  } catch {
    process.stderr.write("Isolation run unavailable or failed independent controls; no candidate pass report.\n");
    process.exitCode = 1;
  }
}
