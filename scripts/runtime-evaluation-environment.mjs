#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import { checkEnvironment } from "./lib/evaluation-environment.mjs";

function command(executable, args) {
  return execFileSync(executable, args, { encoding: "utf8", timeout: 10000, stdio: ["ignore", "pipe", "pipe"] }).trim();
}

try {
  const target = process.argv[2];
  const contract = JSON.parse(readFileSync("evaluation/environment-contract.json", "utf8"));
  const selected = contract.targets.find(entry => entry.id === target);
  if (!selected || !process.env.GITHUB_ACTIONS || !process.env.ImageVersion || !process.env.ImageOS) throw new Error("missing-hosted-context");
  const snapshot = {
    target, platform: process.platform, architecture: process.arch,
    runnerLabel: selected.runnerLabel, imageOS: process.env.ImageOS, imageVersion: process.env.ImageVersion,
    osVersion: "", osBuild: "", osCaption: "", kernel: os.release(), libc: null,
    cpuModel: os.cpus()[0]?.model ?? "", cpuCount: os.cpus().length, memoryBytes: os.totalmem(), translated: false
  };
  if (process.platform === "linux") {
    const release = readFileSync("/etc/os-release", "utf8");
    snapshot.osVersion = release.match(/^VERSION_ID="?([^"\n]+)/mu)?.[1] ?? "";
    snapshot.osCaption = release.match(/^PRETTY_NAME="?([^"\n]+)/mu)?.[1] ?? "";
    snapshot.osBuild = snapshot.kernel;
    snapshot.libc = command("getconf", ["GNU_LIBC_VERSION"]);
  } else if (process.platform === "darwin") {
    snapshot.osVersion = command("sw_vers", ["-productVersion"]);
    snapshot.osBuild = command("sw_vers", ["-buildVersion"]);
    snapshot.osCaption = "macOS " + snapshot.osVersion;
    if (command("sysctl", ["-n", "hw.optional.arm64"]) !== "1") throw new Error("not-native-arm64");
    // Native ARM processes may have no translation key; sysctl -i leaves it empty.
    snapshot.translated = command("sysctl", ["-in", "sysctl.proc_translated"]) === "1";
  } else if (process.platform === "win32") {
    const record = JSON.parse(command("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$record = Get-CimInstance Win32_OperatingSystem; @{version=$record.Version; build=$record.BuildNumber; caption=$record.Caption} | ConvertTo-Json -Compress"]));
    snapshot.osVersion = record.version;
    snapshot.osBuild = record.build;
    snapshot.osCaption = record.caption;
  }
  const errors = checkEnvironment(contract, snapshot, false);
  if (errors.length) throw new Error(errors.join(","));
  const comparisonErrors = checkEnvironment(contract, snapshot);
  process.stdout.write(JSON.stringify({ ...snapshot,
    cohortCheck: { fingerprint: comparisonErrors.length ? "not-matched" : "matched", blockers: comparisonErrors,
      candidateEvaluation: "not-tested" }
  }, null, 2) + "\n");
} catch {
  console.error("Environment probe failed; no compatible target evidence was produced.");
  process.exitCode = 1;
}
