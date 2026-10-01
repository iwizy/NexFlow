#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { appendFile, cp, lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { baseline, compareOutput, digest, repositoryRoot, verifyCorpus } from "./lib/runtime-evaluation.mjs";

async function snapshot(directory) {
  const result = [];
  async function visit(current, prefix = "") {
    for (const name of (await readdir(current)).sort()) {
      const file = path.join(current, name);
      const relative = prefix ? prefix + "/" + name : name;
      const stat = await lstat(file);
      if (stat.isDirectory()) {
        result.push([relative, "directory"]);
        await visit(file, relative);
      } else if (stat.isFile()) result.push([relative, digest(await readFile(file))]);
      else result.push([relative, "non-regular"]);
    }
  }
  await visit(directory);
  return JSON.stringify(result);
}

async function main() {
  if (process.argv.length !== 4 || process.argv[2] !== "--command") throw new Error("usage");
  const command = JSON.parse(process.argv[3]);
  if (!Array.isArray(command) || command.length === 0
    || !command.every(value => typeof value === "string" && value.length > 0)) throw new Error("usage");
  if (verifyCorpus().length) throw new Error("baseline-mismatch");
  const temporary = await mkdtemp(path.join(tmpdir(), "nexflow-evaluation-"));
  const results = [];
  try {
    for (const item of baseline.cases) {
      const fixture = path.join(temporary, item.id);
      await cp(path.join(repositoryRoot, item.root), fixture, { recursive: true });
      if (item.append) await appendFile(path.join(fixture, item.append.file), item.append.text);
      const before = await snapshot(fixture);
      let previous = null;
      const errors = [];
      for (let repeat = 0; repeat < 2; repeat += 1) {
        const run = spawnSync(command[0], [...command.slice(1), item.command, "--root", fixture,
          ...item.args, "--format", "json"], {
          cwd: repositoryRoot, encoding: "utf8", timeout: 10000, maxBuffer: 4 * 1024 * 1024, shell: false
        });
        let output;
        try { output = JSON.parse(run.stdout); } catch { errors.push("invalid-json-output"); }
        if (run.error || run.signal) errors.push("process-failure");
        if (output !== undefined) errors.push(...compareOutput(item, output, run.status, run.stderr));
        if (previous !== null && previous !== run.stdout) errors.push("nondeterministic-output");
        previous = run.stdout;
        if (run.stdout?.includes(fixture) || run.stderr?.includes(fixture)) errors.push("absolute-path-disclosure");
        if (await snapshot(fixture) !== before) errors.push("input-mutation");
      }
      results.push({ id: item.id, result: errors.length ? "failed" : "passed", errors: [...new Set(errors)] });
    }
    if (verifyCorpus().length) throw new Error("baseline-changed-during-run");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  console.log(JSON.stringify({
    baselineId: baseline.baselineId, specificationRevision: baseline.specificationRevision,
    scope: "structural-and-declared-inspection-smoke", results,
    untested: ["os-sandbox", "offline-enforcement", "semantic-port", "distribution", "supply-chain", "performance", "review"]
  }, null, 2));
  if (results.some(result => result.result !== "passed")) process.exitCode = 1;
}

try { await main(); } catch {
  console.error("Evaluation smoke failed: invalid invocation, unavailable process or changed baseline.");
  process.exitCode = 1;
}
