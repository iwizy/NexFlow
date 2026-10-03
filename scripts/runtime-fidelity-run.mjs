#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { appendFile, cp, lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseline, compareOutput, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { catalogErrors } from "./lib/evaluation-library.mjs";
import { canonical, classifyLibrary, cliMeaning, counts, libraryMeaning, textMeaningErrors } from "./lib/fidelity-comparison.mjs";

const pins = JSON.parse(readFileSync(path.join(repositoryRoot, "evaluation/fidelity/source-pins.json")));
async function snapshot(directory) {
  const result = [];
  async function visit(current, prefix = "") {
    for (const name of (await readdir(current)).sort()) {
      const file = path.join(current, name), relative = prefix ? prefix + "/" + name : name, stat = await lstat(file);
      if (stat.isDirectory()) { result.push([relative, "directory"]); await visit(file, relative); }
      else result.push([relative, stat.isFile() ? digest(await readFile(file)) : "non-regular"]);
    }
  }
  await visit(directory);
  return JSON.stringify(result);
}
function run(command, args, cwd, input) {
  return spawnSync(command[0], [...command.slice(1), ...args], { cwd, input, encoding: "utf8", shell: false, timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
}
function leaked(run, forbidden) {
  return forbidden.some(value => run.stdout?.includes(value) || run.stderr?.includes(value));
}
export async function evaluateCandidate(id, configuration) {
  assert.ok(Object.hasOwn(pins.candidates, id));
  const pin = pins.candidates[id], root = path.resolve(configuration.sources[id]);
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  assert.equal(git("rev-parse", "HEAD"), pin.sourceRevision);
  assert.equal(git("status", "--porcelain", "--untracked-files=no"), "");
  assert.deepEqual(verifyCorpus(), []);
  assert.deepEqual(verifyCorpus(baseline, file => readFileSync(path.join(root, file))), []);
  assert.equal(digest(readFileSync(path.join(root, "evaluation/baseline.json"))), digest(readFileSync(path.join(repositoryRoot, "evaluation/baseline.json"))));
  const catalogBytes = readFileSync(path.join(repositoryRoot, "evaluation/library-cases.json")), catalog = JSON.parse(catalogBytes);
  assert.deepEqual(catalogErrors(catalog, baseline), []);
  assert.equal(digest(catalogBytes), pins.catalogSha256);
  assert.equal(digest(readFileSync(path.join(root, "evaluation/library-cases.json"))), pins.catalogSha256);
  assert.equal(process.version, "v22.23.2");
  const executable = suffix => path.join(root, "evaluation/prototypes/" + id, suffix);
  const commands = {
    typescript: { cli: [process.execPath, executable("dist/cli.js")], driver: [process.execPath, fileURLToPath(new URL("./runtime-fidelity-typescript-driver.mjs", import.meta.url))] },
    python: { cli: [configuration.python, "-I", "-B", executable("cli.py")], driver: [configuration.python, "-I", "-B", executable("library_driver.py")] },
    rust: { cli: [path.resolve(configuration.rustBinaries ?? executable("target/debug"), "nexflow-rust-evaluation")], driver: [path.resolve(configuration.rustBinaries ?? executable("target/debug"), "library-driver")] },
    go: { cli: [executable("bin/nexflow-go-evaluation")], driver: [executable("bin/library-driver")] }
  }[id];
  const input = JSON.stringify(catalog.cases.map(({ id, operation, input }) => ({ id, operation, input })));
  const first = run(commands.driver, [root], root, input), second = run(commands.driver, [root], root, input);
  const driverErrors = [];
  if (first.status !== 0 || second.status !== 0 || first.error || second.error || first.signal || second.signal) driverErrors.push("native-driver-failure");
  if (first.stderr !== "" || second.stderr !== "") driverErrors.push("unexpected-driver-stderr");
  if (first.stdout !== second.stdout) driverErrors.push("nondeterministic-library-output");
  if (leaked(first, [root, repositoryRoot]) || leaked(second, [root, repositoryRoot])) driverErrors.push("absolute-path-disclosure");
  let actual;
  try { actual = JSON.parse(first.stdout); } catch { driverErrors.push("invalid-library-json"); }
  if (!Array.isArray(actual) || actual.length !== 352) driverErrors.push("incomplete-library-output");
  const library = catalog.cases.map((entry, index) => {
    const value = actual?.[index], verdict = classifyLibrary(entry, value), errors = [...new Set([...driverErrors, ...verdict.errors])];
    return { id: entry.id, operation: entry.operation, result: errors.length ? "failed" : verdict.result, errors,
      normalized: value ? libraryMeaning(value) : null,
      ...(value?.diagnostics?.some(item => item.nativeDiagnostic) ? { nativeDiagnostics: value.diagnostics.filter(item => item.nativeDiagnostic).map(item => item.nativeDiagnostic) } : {}) };
  });
  const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-fidelity-"));
  const cli = [], supplemental = [];
  async function cliCase(item, fixture, canaries = []) {
    const before = await snapshot(fixture), errors = [], formats = {};
    let output;
    for (const format of ["json", "text"]) {
      const runs = [0, 1].map(() => run(commands.cli, [item.command, "--root", fixture, ...item.args, "--format", format], root));
      if (runs.some(run => run.error || run.signal)) errors.push("process-failure");
      if (runs[0].stdout !== runs[1].stdout || runs[0].status !== runs[1].status || runs[0].stderr !== runs[1].stderr) errors.push("nondeterministic-" + format + "-output");
      for (const observed of runs) {
        if (leaked(observed, [fixture, root, repositoryRoot, ...canaries])) errors.push("sensitive-or-absolute-path-disclosure");
        if (observed.stderr !== "") errors.push("unexpected-" + format + "-stderr");
        if (format === "json") {
          try { const value = JSON.parse(observed.stdout); errors.push(...compareOutput(item, value, observed.status, observed.stderr)); output ??= value; }
          catch { errors.push("invalid-json-output"); }
        } else if (output) {
          if (observed.status !== output.exitCode) errors.push("wrong-text-exit-code");
          errors.push(...textMeaningErrors(observed.stdout, output));
        }
        if (await snapshot(fixture) !== before) errors.push("input-mutation");
      }
      formats[format] = { processRuns: 2, stdoutSha256: digest(runs[0].stdout ?? ""), exitCode: runs[0].status, stderrEmpty: runs.every(item => item.stderr === "") };
      if (format === "text" && !errors.includes("sensitive-or-absolute-path-disclosure")) formats.text.rendered = runs[0].stdout;
    }
    return { id: item.id, result: errors.length ? "failed" : "passed", errors: [...new Set(errors)], normalized: cliMeaning(output), formats };
  }
  try {
    for (const item of baseline.cases) {
      const fixture = path.join(temporary, item.id);
      await cp(path.join(root, item.root), fixture, { recursive: true });
      if (item.append) await appendFile(path.join(fixture, item.append.file), item.append.text);
      cli.push(await cliCase(item, fixture));
    }
    const fixture = path.join(temporary, "schema-redaction-canary");
    await cp(path.join(root, "fixtures/cli/valid/minimal-project"), fixture, { recursive: true });
    const field = "nf056-sensitive-field-canary", value = "nf056-sensitive-value-canary";
    const projectFile = path.join(fixture, "project.yaml");
    const source = await readFile(projectFile, "utf8");
    assert.ok(/^  description:.*$/mu.test(source));
    await writeFile(projectFile, source.replace(/^  description:.*$/mu, "  description: {" + field + ": " + value + "}"));
    const item = { id: "schema-redaction-canary", command: "validate", args: [], expected: { exitCode: 1, reportedCommand: "validate", inputMode: "directory-project", discovery: "passed", schema: "failed", diagnosticCodes: ["NF-SCHEMA"], mutation: "none" } };
    supplemental.push(await cliCase(item, fixture, [field, value]));
  } finally { await rm(temporary, { recursive: true, force: true }); }
  assert.deepEqual(verifyCorpus(), []);
  assert.deepEqual(verifyCorpus(baseline, file => readFileSync(path.join(root, file))), []);
  assert.equal(digest(readFileSync(path.join(repositoryRoot, "evaluation/library-cases.json"))), pins.catalogSha256);
  assert.equal(git("status", "--porcelain", "--untracked-files=no"), "");
  const harnessRevision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim();
  const missing = library.filter(item => item.result === "not-tested").length;
  return { formatVersion: "0.1-draft", task: "NF-056-09", recordedAt: "2026-10-03", candidate: id,
    harnessRevision, prototypeRevision: pin.sourceRevision, publishedHead: pin.publishedHead,
    prerequisite: { pullRequest: "https://github.com/iwizy/NexFlow/pull/" + pin.pullRequest, successfulCiRun: "https://github.com/iwizy/NexFlow/actions/runs/" + pin.ciRun },
    specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision,
    corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
    environment: { os: process.platform, architecture: process.arch, mode: "native-source-bound-fidelity", node: process.version }, toolchain: pin.toolchain,
    library: { processRuns: 2, nativeEvaluationsPerCase: 4, inputIncludesOracle: false, inputMutationCheck: "native-driver-per-process", corpusAfter: "unchanged", counts: counts(library), results: library },
    cli: { formats: ["json", "text"], processRunsPerFormat: 2, corpusAfter: "unchanged", counts: counts(cli), results: cli },
    supplemental: { scope: "additional diagnostic redaction only; not part of the frozen catalog", counts: counts(supplemental), results: supplemental },
    gates: { specificationFidelity: { status: missing || library.some(item => item.result === "failed") ? "failed" : "not-tested", reason: missing + " mandatory semantic/namespace cases remain unsupported; partial schema success cannot close fidelity." }, deterministicDiagnostics: { status: "not-tested", reason: "Repeated supported diagnostics tested; full semantic/namespace diagnostics unavailable." } },
    outcome: "not-ready", selection: null,
    limitations: ["Library code/path/category are compared only where the frozen operation supplies them; library severity absent is not invented or treated as checked.", "Native driver checks cover JSON input objects, while corpus/CLI snapshots cover reviewed source files and copied fixture contents; no OS deny or global-write proof.", "One synthetic schema-field/value canary and absolute-root guards are not complete secret detection or OS isolation.", "No candidate code, common catalog, oracle, architecture scores, distribution or performance measurements changed."] };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 4);
    const result = await evaluateCandidate(process.argv[2], JSON.parse(process.argv[3]));
    process.stdout.write(JSON.stringify(canonical(result)) + "\n");
    process.exitCode = [...result.cli.results, ...result.library.results, ...result.supplemental.results].some(item => item.result === "failed") ? 1 : 0;
  } catch { process.stderr.write("Fidelity run failed: unavailable reviewed inputs or process; no complete report.\n"); process.exitCode = 1; }
}
