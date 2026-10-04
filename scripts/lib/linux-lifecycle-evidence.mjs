import { baseline, compareOutput, digest } from "./runtime-evaluation.mjs";
export const lifecycleStages = ["build", "install", "validateInspect", "offlineUse", "upgrade", "rollback", "uninstall", "signing"];
export function lifecycleErrors(record, pins) {
  const errors = [];
  const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
  if (record.task !== "NF-056-12" || !pins.candidates[record.candidate]) return ["invalid-identity"];
  if (record.sourceRevision !== pins.candidates[record.candidate].sourceRevision
    || record.specificationRevision !== pins.specificationRevision || record.corpusSha256 !== pins.corpusSha256) errors.push("source-drift");
  if (record.target !== "linux/amd64" || record.environment?.platform !== "linux" || record.environment?.architecture !== "x64"
    || record.environment?.translated !== false || record.environment?.runnerLabel !== "ubuntu-24.04") errors.push("not-native-target");
  if (!sha(record.artifact?.sha256) || !(record.artifact?.bytes > 0) || !sha(record.artifact?.manifestSha256)) errors.push("missing-artifact");
  if (!record.artifact?.files?.length || record.artifact.files.some(f => !sha(f.sha256) || !Number.isInteger(f.bytes) || f.bytes < 0)
    || digest(JSON.stringify(record.artifact.files)) !== record.artifact.manifestSha256) errors.push("artifact-manifest-mismatch");
  if (!record.lockfiles?.length || record.lockfiles.some(f => !sha(f.sha256))) errors.push("missing-locks");
  if (!sha(record.supplyChain?.inventorySha256) || record.supplyChain?.revision !== "fed105367da915347a92896eb67c0446d9e9b2d7") errors.push("missing-supply-chain");
  if (!/^[0-9a-f]{40}$/u.test(record.collectorRevision ?? "") || !record.collectorSources?.length
    || record.collectorSources.some(s => !sha(s.sha256))) errors.push("missing-collector");
  for (const stage of lifecycleStages) if (!["passed", "failed", "not-tested"].includes(record.stages?.[stage]?.status)
    || !record.stages[stage].evidence?.length) errors.push("missing-stage:" + stage);
  if (record.previousArtifact !== null || record.stages?.upgrade?.status !== "not-tested" || record.stages?.rollback?.status !== "not-tested") errors.push("fabricated-history");
  if (record.stages?.signing?.status !== "not-tested" || record.outcome !== "not-ready" || record.distributionGate !== "partial") errors.push("false-approval");
  if (record.isolation?.network?.status !== "passed" || record.isolation?.inputReadOnly?.status !== "passed"
    || record.isolation?.buildSchemasHidden !== true || record.isolation?.unprivileged !== true) errors.push("missing-isolation");
  const cases = record.execution?.cases;
  if (!Array.isArray(cases) || cases.length !== 11 || new Set(cases.map(c => c.id)).size !== 11
    || cases.some(c => c.attempts?.length !== 2 || !["passed", "failed"].includes(c.status)
      || c.attempts.some(a => !sha(a.stdoutSha256) || !sha(a.stderrSha256) || !Number.isInteger(a.exitCode)))) errors.push("incomplete-cases");
  const failed = cases?.some(c => c.status === "failed");
  if (Array.isArray(cases) && cases.length === baseline.cases.length) {
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i], expected = baseline.cases[i];
      if (c.id !== expected.id) errors.push("case-order-drift");
      if (c.status === "passed" && (c.errors?.length || c.attempts.some(a => !a.output
        || compareOutput(expected, a.output, a.exitCode, a.stderr ?? "").length || a.error || a.signal)
        || c.attempts[0].stdoutSha256 !== c.attempts[1].stdoutSha256)) errors.push("forged-case-pass");
      if (c.status === "failed" && !c.errors?.length) errors.push("unexplained-case-failure");
    }
  }
  if (cases && record.stages?.validateInspect?.status !== (failed ? "failed" : "passed")) errors.push("concealed-execution-failure");
  if (record.stages?.offlineUse?.status !== record.stages?.validateInspect?.status) errors.push("concealed-offline-failure");
  if (!record.immutability?.sources || !record.immutability?.locks || !record.immutability?.corpus) errors.push("mutation");
  if (/\/Users\/[^/]|\/home\/runner|\/private\/tmp\/|hostname|machineId|access_token|Authorization:/iu.test(JSON.stringify(record))) errors.push("private-data");
  return errors;
}
