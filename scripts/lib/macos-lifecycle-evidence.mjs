import { baseline, compareOutput, digest, safeRelative } from "./runtime-evaluation.mjs";
import { controlsPass } from "./isolation-evidence.mjs";
export const macosStages = ["package", "install", "validateInspect", "offlineUse", "upgrade", "rollback", "uninstall", "signing", "notarization"];
export function macosLifecycleErrors(r, pins) {
  const errors = [], sha = v => /^[a-f0-9]{64}$/u.test(v ?? ""), revision = v => /^[a-f0-9]{40}$/u.test(v ?? "");
  if (r.task !== "NF-056-13" || !pins.candidates[r.candidate]) return ["invalid-identity"];
  for (const key of ["specificationRevision", "corpusSha256", "catalogSha256", "evaluationPackageRevision"])
    if (r[key] !== pins[key]) errors.push("drift:" + key);
  if (r.sourceRevision !== pins.candidates[r.candidate].sourceRevision) errors.push("source-drift");
  if (r.target !== "macos/arm64" || r.environment?.platform !== "darwin" || r.environment?.architecture !== "arm64"
    || r.environment?.translated !== false || r.environment?.nativeArm64 !== true) errors.push("not-native-arm64");
  if (!sha(r.environmentSha256) || digest(JSON.stringify(r.environment)) !== r.environmentSha256) errors.push("environment-binding");
  if (r.cohort?.status !== "supplemental-drift" || r.cohort?.matched !== false || !r.cohort?.blockers?.length) errors.push("false-cohort");
  if (!revision(r.collectorRevision) || !r.collectorSources?.length || r.collectorSources.some(s => !safeRelative(s.path) || !sha(s.sha256))) errors.push("missing-collector");
  if (!r.sourceManifest?.length || !sha(r.sourceManifestSha256) || digest(JSON.stringify(r.sourceManifest)) !== r.sourceManifestSha256) errors.push("missing-source-manifest");
  if (!r.lockfiles?.length || r.lockfiles.some(s => !sha(s.sha256))) errors.push("missing-locks");
  if (r.supplyChain?.revision !== "fed105367da915347a92896eb67c0446d9e9b2d7" || !sha(r.supplyChain?.inventorySha256)
    || r.supplyChain?.status !== "partial" || r.supplyChain?.remediation !== "none") errors.push("supply-chain-drift");
  if (!sha(r.prerequisitesSha256) || !sha(r.runtime?.executableSha256) || !r.runtime?.version || !r.toolchain) errors.push("missing-prerequisites");
  const a = r.artifact;
  if (!a?.files?.length || !sha(a.sha256) || !(a.bytes > 0) || !sha(a.manifestSha256)
    || digest(JSON.stringify(a.files)) !== a.manifestSha256 || a.files.some(f => !safeRelative(f.path) || !sha(f.sha256)
      || !Number.isInteger(f.bytes) || f.bytes < 0) || new Set(a.files.map(f => f.path)).size !== a.files.length) errors.push("artifact-binding");
  if (a?.version !== r.sourceRevision + ".macos.arm64." + r.collectorRevision || a?.format !== "private source-layout evaluation capsule") errors.push("artifact-identity");
  for (const key of macosStages) if (!["passed", "failed", "not-tested"].includes(r.stages?.[key]?.status) || !r.stages[key].evidence?.length) errors.push("missing-stage:" + key);
  if (r.previousArtifact !== null || r.stages?.upgrade?.status !== "not-tested" || r.stages?.rollback?.status !== "not-tested") errors.push("fabricated-history");
  if (r.stages?.signing?.status !== "not-tested" || r.stages?.notarization?.status !== "not-tested"
    || r.outcome !== "not-ready" || r.distributionGate !== "partial") errors.push("false-approval");
  if (!controlsPass(r.isolation?.positive, r.isolation?.denied) || r.isolation?.beforeCandidate !== true
    || r.isolation?.sourceSchemaRead?.positive !== 0 || ![1, 13].includes(r.isolation?.sourceSchemaRead?.denied)
    || !sha(r.isolation?.profileSha256) || !sha(r.isolation?.canarySha256)) errors.push("inactive-isolation");
  if (r.installation?.archiveVerified !== true || r.installation?.manifestVerified !== true || r.installation?.status !== "passed") errors.push("unverified-install");
  if (r.uninstall?.status !== "passed" || r.uninstall?.prefixAbsent !== true || r.uninstall?.archivePreserved !== true
    || r.uninstall?.outsidePreserved !== true || r.uninstall?.externalRuntimePreserved !== true) errors.push("unscoped-uninstall");
  const cases = r.execution?.cases;
  if (!Array.isArray(cases) || cases.length !== baseline.cases.length) errors.push("incomplete-cases");
  else for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (c.id !== baseline.cases[i].id || !["passed", "failed"].includes(c.status) || !Array.isArray(c.errors) || c.attempts?.length !== 2) { errors.push("invalid-case"); continue; }
    if (c.attempts.some(a => !sha(a.stdoutSha256) || !sha(a.stderrSha256) || !Number.isInteger(a.exitCode))) errors.push("missing-attempt");
    if (c.status === "passed" && (c.errors.length || c.attempts.some(a => !a.output || a.signal || a.error
      || compareOutput(baseline.cases[i], a.output, a.exitCode, a.stderr ?? "").length)
      || c.attempts[0].stdoutSha256 !== c.attempts[1].stdoutSha256)) errors.push("forged-case-pass");
    if (c.status === "failed" && !c.errors.length) errors.push("unexplained-failure");
  }
  const failed = cases?.some(c => c.status === "failed");
  if (r.stages?.validateInspect?.status !== (failed ? "failed" : "passed") || r.stages?.offlineUse?.status !== r.stages?.validateInspect?.status) errors.push("concealed-failure");
  if (!r.immutability?.sources || !r.immutability?.locks || !r.immutability?.corpus || !r.immutability?.installedPayload) errors.push("mutation");
  if (!r.nativeInspections?.length || r.nativeInspections.some(n => !sha(n.sha256) || !n.architectures?.includes("arm64") || !n.codeSignature?.kind)) errors.push("missing-native-inspection");
  if (!r.limitations?.length || /\/Users\/|\/private\/tmp\/|\/var\/folders\/|Authorization:|access_token|Co-authored-by|hostname/iu.test(JSON.stringify(r))) errors.push("private-data");
  return errors;
}
