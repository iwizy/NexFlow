#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCliPrototype } from "./lib/cli-prototype.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = path.join(root, "scripts", "cli-prototype.mjs");
const fixture = path.join(root, "fixtures", "discovery", "multi-workflow");
const failures = [];
let checkCount = 0;

function check(name, condition) {
  checkCount += 1;
  if (!condition) failures.push(name);
}

async function capture(args, discover) {
  let stdout = "";
  let stderr = "";
  const code = await runCliPrototype(args, {
    stdout: { write: (text) => { stdout += text; } },
    stderr: { write: (text) => { stderr += text; } },
    ...(discover ? { discover } : {})
  });
  return { code, stdout, stderr };
}

function run(args, cwd = root) {
  return spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, NEXFLOW_PROTOTYPE_CANARY: "private-test-environment-value" }
  });
}

const noReadCases = [
  [[], 0], [["--help"], 0], [["-h"], 0], [["discover", "--help"], 0], [["validate", "--help"], 0],
  [["--version"], 0], [["-v"], 0],
  [["unknown"], 2], [["discover"], 2], [["validate"], 2], [["discover", "extra", "--root", "."], 2],
  [["--root", "."], 2], [["discover", "--root", ""], 2],
  [["discover", "--root", ".", "--project", ""], 2],
  [["discover", "--root", ".", "--file", ""], 2],
  [["discover", "--root", ".", "--root", "."], 2],
  [["discover", "--root", ".", "--project", "a.yml", "--project", "b.yml"], 2],
  [["discover", "--root", ".", "--project", "a.yml", "--file", "b.yml"], 2],
  [["discover", "--root", ".", "--format", "yaml"], 2],
  [["--help", "--version"], 2], [["--help", "--root", "."], 2],
  [["--help", "--help"], 2], [["discover", "--version"], 2],
  [["inspect"], 2], [["inspect", "--help"], 0],
  ...["graph", "init"].map((command) => [[command, "--root", "not-read"], 3])
];
for (const [args, expected] of noReadCases) {
  let reads = 0;
  const result = await capture(args, async () => { reads += 1; throw new Error("must not read"); });
  check(`dispatch without discovery: ${JSON.stringify(args)}`, result.code === expected && reads === 0);
}

const version = await capture(["--version"]);
check("version is not a borrowed specification release", version.stdout.includes("unreleased") && !version.stdout.includes("v0.1.0"));
const internal = await capture(["discover", "--root", "."], async () => { throw new Error("private-test-error-value"); });
check("internal failure has safe exit and no stack", internal.code === 4 && internal.stdout === ""
  && !internal.stderr.includes("private-test-error-value"));

const directory = run(["discover", "--root", fixture]);
const hinted = run(["discover", "--root", fixture, "--project", "project.yaml"]);
check("real executable directory discovery", directory.status === 0 && directory.stderr === ""
  && directory.stdout.includes("Discovered 5 manifest(s) (directory-project)"));
check("explicit Project mode", hinted.status === 0 && hinted.stdout.includes("project-source-hints"));
check("output does not expose absolute root or environment", !directory.stdout.includes(fixture)
  && !directory.stdout.includes("private-test-environment-value"));
check("output distinguishes inventory from validation", directory.stdout.includes("Schema and semantic validation were not performed"));
check("working directory independent entry point", run(["discover", "--root", fixture], tmpdir()).stdout === directory.stdout);

const forward = run(["discover", "--root", fixture, "--file", "project.yaml", "--file", "people/team.yml"]);
const reverse = run(["discover", "--root", fixture, "--file", "people/team.yml", "--file", "project.yaml"]);
check("explicit file mode only loads requested files", forward.status === 0 && forward.stdout.includes("Discovered 2 manifest(s)"));
check("explicit file order does not affect output", forward.stdout === reverse.stdout);
const duplicate = run(["discover", "--root", fixture, "--file", "project.yaml", "--file", "./project.yaml"]);
check("discovery failures suppress success inventory", duplicate.status === 1 && duplicate.stdout === ""
  && duplicate.stderr.includes("NF-DISCOVERY-DUPLICATE-SOURCE"));

for (const locator of ["/private-test-absolute.yaml", "../private-test-escape.yaml", "https://example.invalid/private-test-remote.yaml", "C:\\private-test-windows.yaml"]) {
  const result = run(["discover", "--root", fixture, "--file", "project.yaml", "--file", locator]);
  check(`rejected locator redacted: ${locator}`, result.status === 1 && result.stdout === ""
    && result.stderr.includes("NF-DISCOVERY-OUTSIDE-ROOT") && !result.stderr.includes("private-test-"));
}
const missingRoot = run(["discover", "--root", path.join(fixture, "private-test-missing-root")]);
check("missing root path redacted", missingRoot.status === 1 && !missingRoot.stderr.includes("private-test-missing-root"));
const longLocator = `private-test-long-${"x".repeat(520)}.yaml`;
const longResult = run(["discover", "--root", fixture, "--file", "project.yaml", "--file", longLocator]);
check("overlong source label redacted", longResult.status === 1 && !longResult.stderr.includes("private-test-long"));
const controlLocator = "missing-\u001b\u009b\u202e.yaml";
const controlResult = run(["discover", "--root", fixture, "--file", "project.yaml", "--file", controlLocator]);
check("terminal and direction controls escaped", controlResult.status === 1
  && !/[\u001b\u009b\u202e]/u.test(controlResult.stderr));

const parent = await mkdtemp(path.join(tmpdir(), "nexflow-cli-prototype-"));
const temporary = path.join(parent, "project");
try {
  await cp(fixture, temporary, { recursive: true });
  const before = await readFile(path.join(temporary, "project.yaml"), "utf8");
  await writeFile(path.join(temporary, "unlisted.yaml"), "invalid: [\n");
  const unchanged = run(["discover", "--root", temporary]);
  check("discovery does not modify manifests or read unrelated YAML", unchanged.status === 0
    && await readFile(path.join(temporary, "project.yaml"), "utf8") === before);

  const secretInputs = [
    ["unknown kind", 'specVersion: "0.1"\nkind: private-test-kind-value\n', 3, "NF-DISCOVERY-UNSUPPORTED-KIND"],
    ["unknown version", 'specVersion: private-test-version-value\nkind: Project\n', 3, "NF-DISCOVERY-UNSUPPORTED-VERSION"],
    ["parser failure", 'kind: [private-test-parser-value\n', 1, "NF-DISCOVERY-UNSAFE-SOURCE"],
    ["unknown hint", `${before}\nmanifests:\n  private-test-hint-value: x.yaml\n`, 1, "NF-DISCOVERY-UNSAFE-SOURCE"]
  ];
  for (const [name, contents, status, code] of secretInputs) {
    await writeFile(path.join(temporary, "input.yaml"), contents);
    const result = run(["discover", "--root", temporary, "--file", "project.yaml", "--file", "input.yaml"]);
    check(`safe diagnostic: ${name}`, result.status === status && result.stdout === ""
      && result.stderr.includes(code) && !result.stderr.includes("private-test-"));
  }
  const unknownHint = before.replace("  agents: people/team.yml", "  private-test-hint-value: missing.yaml");
  check("unknown hint test alters fixture", unknownHint !== before);
  await writeFile(path.join(temporary, "project.yaml"), unknownHint);
  const unsupportedHint = run(["discover", "--root", temporary]);
  check("unknown hint rejected without following it", unsupportedHint.status === 3 && unsupportedHint.stdout === ""
    && unsupportedHint.stderr.includes("NF-DISCOVERY-UNSUPPORTED-HINT")
    && !unsupportedHint.stderr.includes("private-test-hint-value") && !unsupportedHint.stderr.includes("missing.yaml"));

  await writeFile(path.join(temporary, "project.yaml"), `${before}\nnotes: private-test-content-value\ncommand: never-run-this\n`);
  const inert = run(["discover", "--root", temporary]);
  check("manifest content not executed or printed", inert.status === 0 && !inert.stdout.includes("private-test-content-value")
    && !inert.stdout.includes("never-run-this"));
} finally {
  await rm(parent, { recursive: true, force: true });
}

const packageManifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
check("repository tooling stays non-distributable with no nexflow bin", packageManifest.private === true && !packageManifest.bin);

if (failures.length > 0) {
  console.error(`CLI prototype checks failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`CLI prototype checks passed for ${checkCount} cases.`);
  console.log("Verified command dispatch, bounded discovery, failure status, deterministic inventory, and redaction.");
  console.log("This is repository prototype evidence, not reference CLI or runtime conformance.");
}
