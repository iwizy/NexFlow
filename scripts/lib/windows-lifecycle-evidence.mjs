import { baseline, compareOutput, digest, safeRelative } from "./runtime-evaluation.mjs";
export const windowsStages = ["build", "install", "validateInspect", "offlineUse", "upgrade", "rollback", "uninstall", "signing"];
export const windowsCollectorFiles = ["scripts/runtime-windows-lifecycle.mjs", "scripts/lib/windows-lifecycle-evidence.mjs", ".github/workflows/windows-lifecycle.yml"];
export function peMachine(bytes) {
  if (bytes.length < 64 || bytes.toString("ascii", 0, 2) !== "MZ") return null;
  const offset = bytes.readUInt32LE(60);
  if (offset + 6 > bytes.length || bytes.toString("ascii", offset, offset + 4) !== "PE\0\0") return null;
  return bytes.readUInt16LE(offset + 4);
}
export function windowsErrors(r, pins) {
  const errors = [], sha = s => /^[0-9a-f]{64}$/u.test(s ?? "");
  if (r.task !== "NF-056-14" || !pins.candidates[r.candidate]) return ["identity"];
  if (r.sourceRevision !== pins.candidates[r.candidate].sourceRevision || r.specificationRevision !== pins.specificationRevision
    || r.evaluationPackageRevision !== pins.evaluationPackageRevision || r.corpusSha256 !== pins.corpusSha256
    || r.catalogSha256 !== pins.catalogSha256) errors.push("input-drift");
  if (r.target !== "windows/amd64" || r.environment?.platform !== "win32" || r.environment?.architecture !== "x64"
    || r.environment?.runnerLabel !== "windows-2025" || r.environment?.translated !== false
    || !r.environment?.imageVersion || !r.environment?.cpuModel || !r.environment?.osBuild
    || !["matched", "not-matched"].includes(r.environment?.cohortCheck?.fingerprint)) errors.push("native-fingerprint");
  if (!/^[0-9a-f]{40}$/u.test(r.collectorRevision ?? "")
    || JSON.stringify(r.collectorSources?.map(s => s.path)) !== JSON.stringify(windowsCollectorFiles)
    || r.collectorSources?.some(s => !sha(s.sha256))) errors.push("collector-binding");
  if (!r.sourceManifest?.length || r.sourceManifest.some(s => !safeRelative(s.path) || !sha(s.sha256))
    || digest(JSON.stringify(r.sourceManifest)) !== r.sourceManifestSha256 || !r.lockfiles?.length
    || r.lockfiles.some(s => !r.sourceManifest.some(f => f.path === s.path && f.sha256 === s.sha256))) errors.push("source-binding");
  if (r.supplyChain?.revision !== "fed105367da915347a92896eb67c0446d9e9b2d7" || !sha(r.supplyChain?.inventorySha256)
    || r.supplyChain?.remediation !== "none") errors.push("supply-chain-binding");
  for (const key of windowsStages) if (!["passed", "failed", "not-tested"].includes(r.stages?.[key]?.status)
    || !r.stages[key].evidence?.length) errors.push("stage:" + key);
  if (r.previousArtifact !== null || ["upgrade", "rollback", "signing", "offlineUse"].some(k => r.stages?.[k]?.status !== "not-tested")
    || r.outcome !== "not-ready" || r.distributionGate !== "partial" || !r.blockers?.length) errors.push("false-approval");
  if (r.isolation?.network !== "not-tested" || r.isolation?.filesystem !== "not-tested" || r.isolation?.credential !== "not-tested") errors.push("false-isolation");
  if (r.stages?.build?.status === "passed") {
    const a = r.artifact;
    if (!sha(a?.sha256) || !(a?.bytes > 0) || !a?.files?.length || a.files.some(f => !safeRelative(f.path) || !sha(f.sha256) || !Number.isInteger(f.bytes))
      || digest(JSON.stringify(a.files)) !== a.manifestSha256 || a.version !== r.sourceRevision + ".windows.amd64." + r.collectorRevision) errors.push("artifact-binding");
    if (!r.nativeBinaries?.length || r.nativeBinaries.some(b => b.machine !== 0x8664 || !sha(b.sha256))) errors.push("not-amd64-pe");
    const cases = r.execution?.cases;
    if (r.stages?.install?.status === "passed") {
      if (r.isolation.buildSchemasHidden !== true || !Array.isArray(cases) || cases.length !== baseline.cases.length) errors.push("missing-relocated-cases");
      else for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        if (c.id !== baseline.cases[i].id || c.attempts?.length !== 2 || !["passed", "failed"].includes(c.status)
          || c.attempts.some(a => !sha(a.stdoutSha256) || !sha(a.stderrSha256) || !Number.isInteger(a.exitCode))) errors.push("case-shape");
        else if (c.status === "passed" && (c.errors?.length || c.attempts.some(a => !a.output || a.error || a.signal
          || compareOutput(baseline.cases[i], a.output, a.exitCode, a.stderr).length)
          || c.attempts[0].stdoutSha256 !== c.attempts[1].stdoutSha256)) errors.push("forged-case-pass");
        else if (c.status === "failed" && !c.errors?.length) errors.push("unexplained-failure");
      }
      if (cases?.length === baseline.cases.length && r.stages.validateInspect.status !== (cases.some(c => c.status === "failed") ? "failed" : "passed")) errors.push("concealed-failure");
    } else if (r.stages?.validateInspect?.status !== "not-tested") errors.push("run-without-install");
  } else if (r.artifact !== null || ["install", "validateInspect", "uninstall"].some(k => r.stages?.[k]?.status !== "not-tested")) errors.push("fabricated-build");
  if (!r.immutability?.sources || !r.immutability?.locks || !r.immutability?.corpus) errors.push("mutation");
  if (/\/Users\/[^/]|\/home\/runner|\/private\/tmp\/|[A-Z]:(?:\\{1,2}|\/)(?:Users|a|hostedtoolcache|actions)(?:\\{1,2}|\/)|access_token|Authorization:/iu.test(JSON.stringify(r))) errors.push("private-path");
  return [...new Set(errors)];
}
