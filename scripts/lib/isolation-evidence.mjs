import path from "node:path";
import { homedir } from "node:os";

export const effects = ["read", "write", "connect", "bind", "fork", "spawn", "spawnSelf"];
export const supplementalIds = ["absolute-file", "parent-traversal-file", "remote-file-locator",
  "file-symlink", "root-symlink-reviewed-alias", "root-symlink-protected-directory",
  "unknown-effect-command", "inert-command-remote-credential-declarations", "inert-inspection", "synthetic-value-redaction"];
export function controlsPass(positive, denied) {
  return effects.every(key => positive?.[key] === 0 && [1, 13].includes(denied?.[key]));
}
const quoted = value => JSON.stringify(value);
export function seatbeltProfile({ executable, canary, readable }) {
  if (![executable, canary, ...readable].every(value => path.isAbsolute(value) && !/[\r\n]/u.test(value))) {
    throw new Error("Absolute reviewed profile paths required");
  }
  if (readable.some(value => [path.parse(value).root, homedir(), "/Users", "/private", "/private/tmp"].includes(path.resolve(value)))) {
    throw new Error("Broad runtime/data read grants forbidden");
  }
  const parents = new Set(["/"]);
  for (const value of readable) {
    for (let parent = path.dirname(value); parent !== "/"; parent = path.dirname(parent)) parents.add(parent);
  }
  return [
    "(version 1)", "(allow default)", "(deny network*)", "(deny process-fork)",
    "(deny process-exec)", `(allow process-exec (literal ${quoted(executable)}) (literal ${quoted(canary)}))`,
    "(deny file-read*)", "(allow file-read-metadata)",
    ...[...parents].sort().map(value => `(allow file-read* (literal ${quoted(value)}))`),
    ...readable.map(value => `(allow file-read* (subpath ${quoted(value)}))`),
    '(allow file-read* (subpath "/System") (subpath "/usr/lib") (subpath "/usr/share"))',
    '(allow file-read* (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random"))',
    "(deny file-write*)",
    '(allow file-write-data (literal "/dev/null"))'
  ].join("\n");
}
export function recordErrors(report, pins, expectedIds) {
  const errors = [];
  const pin = pins.candidates[report?.candidate];
  if (!pin || report.prototypeRevision !== pin.sourceRevision) errors.push("wrong-source");
  if (report?.task !== "NF-056-10" || report?.formatVersion !== "0.1-draft") errors.push("wrong-report-contract");
  if (pin && (report.publishedHead !== pin.publishedHead ||
    report.prerequisite?.pullRequest !== "https://github.com/iwizy/NexFlow/pull/" + pin.pullRequest ||
    report.prerequisite?.ciRun !== pin.ciRun || report.toolchain !== pin.toolchain)) errors.push("wrong-prerequisite");
  for (const key of ["specificationRevision", "evaluationPackageRevision", "corpusSha256", "catalogSha256"]) {
    if (report?.[key] !== pins[key]) errors.push("wrong-" + key);
  }
  if (!/^[a-f0-9]{40}$/u.test(report?.harnessRevision ?? "")) errors.push("uncommitted-harness");
  if (!controlsPass(report?.controls?.positive, report?.controls?.denied)) errors.push("inactive-deny-harness");
  if (report?.controls?.beforeCandidate !== true || report?.controls?.result !== "passed") errors.push("unordered-controls");
  if (report?.environment?.platform !== "darwin" || report?.environment?.architecture !== "arm64") errors.push("wrong-native-environment");
  if (!report?.results?.length || report.results.some(row => !["passed", "failed"].includes(row.result))) errors.push("invalid-candidate-results");
  if (expectedIds && JSON.stringify(report?.results?.map(row => row.id)) !== JSON.stringify(expectedIds)) errors.push("wrong-case-inventory");
  if (report?.results?.some(row => row.processRuns !== 2 || !Array.isArray(row.errors) ||
    (row.result === "passed") !== (row.errors.length === 0) ||
    !/^[a-f0-9]{64}$/u.test(row.stdoutSha256 ?? ""))) errors.push("invalid-case-evidence");
  const requiredHashes = ["executableSha256", "canarySha256", "profileSha256", "profileTemplateSha256", "canarySourceSha256", "runnerSourceSha256"];
  if (requiredHashes.some(key => !/^[a-f0-9]{64}$/u.test(report?.artifacts?.[key] ?? ""))) errors.push("missing-artifact-binding");
  if (report?.corpusAfter !== "unchanged" || report?.sourceAfter !== "unchanged") errors.push("input-mutation");
  const expectedOffline = report?.results?.some(row => row.result === "failed") ? "failed" : "passed";
  if (report?.offlineOperation?.status !== expectedOffline || report?.securityBoundary?.status !== "partial") errors.push("unsupported-gate-promotion");
  if (report?.outcome !== "not-ready" || report?.selection !== null) errors.push("architecture-promotion");
  if (report?.targetContractMatch !== false ||
    JSON.stringify(report?.otherTargets) !== JSON.stringify([{ target: "linux/amd64", status: "not-tested" }, { target: "windows/amd64", status: "not-tested" }])) errors.push("target-promotion");
  if (!Array.isArray(report?.limitations) || report.limitations.length < 6) errors.push("missing-limitations");
  if (/(\/Users\/|\/private\/tmp\/|\/var\/folders\/|nf056-synthetic-secret-canary)/iu.test(JSON.stringify(report))) errors.push("private-path-or-canary-leak");
  return errors;
}
