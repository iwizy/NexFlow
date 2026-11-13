import { createHash } from "node:crypto";
import { createValidator, apiVersion, schemaSnapshot } from "@nexflow/validation";
import {
  hostApi, fixtureOperation, type AttemptResult, type AttemptScope, type HostFacts, type Preflight, type Reason, type Receipt,
} from "../../host-contracts/src/index.js";
import { matches, readInput, validateAssembly } from "./input.js";
import { checkFacts, checkPolicy, type Authority } from "./policy.js";

const validationSchema = "0acf66575ad6907b3dc88149ff3d5842a6a76853d79fcf6492a3fe7f8336ff5e";
export const compatibility = Object.freeze({
  host: hostApi, validation: "0.5.0-alpha.1", validationApi: "validation-api-v1-preview",
  specVersion: "0.1", schemaSnapshotSha256: validationSchema,
});

interface FixtureHostOptions {
  compatibility: typeof compatibility;
  readFacts: () => HostFacts;
  // Trusted harness only. Request data cannot supply these controls.
  onIntent?: () => void;
  failAdapter?: boolean;
  failOutcome?: boolean;
}

type Assessment =
  | { state: "ready"; scope: AttemptScope; authority: Authority }
  | Exclude<Preflight, { state: "ready" }>;

export function createFixtureHost(options: FixtureHostOptions) {
  const { readFacts, onIntent, failAdapter, failOutcome } = options;
  const actualSchema = createHash("sha256").update(JSON.stringify(schemaSnapshot)).digest("hex");
  const compatible = matches(options.compatibility, compatibility) &&
    apiVersion === compatibility.validationApi && actualSchema === validationSchema;
  const validator = compatible ? createValidator() : null;
  const attempts = new Map<string, string>();
  const journal: Receipt[] = [];
  const outcomeGaps: Extract<Receipt, { decision: "outcome-unknown" }>[] = [];
  const maxAttempts = 100;
  const maxReceipts = maxAttempts * 2;
  let adapterCalls = 0;
  let busy = false;

  function assess(request: unknown): Assessment {
    if (!validator) return { state: "unsupported", reason: "version-unsupported" };
    const input = readInput(request);
    if ("reason" in input) return input;
    const { scope } = input;
    const assembly = validateAssembly(input.files, validator);
    if ("reason" in assembly) return { ...assembly, scope };
    const policy = checkPolicy(assembly.documents);
    if (policy) return { state: policy === "policy-unsupported" ? "unsupported" : "blocked", reason: policy, scope };
    const authority = checkFacts(readFacts, scope);
    return typeof authority === "string"
      ? { state: "blocked", reason: authority, scope }
      : { state: "ready", scope, authority };
  }

  function preflight(request: unknown): Preflight {
    const assessment = assess(request);
    return assessment.state === "ready" ? { state: "ready", scope: assessment.scope } : assessment;
  }

  function deny(reason: Reason, scope?: AttemptScope, policyEpoch: number | null = null, record = true): AttemptResult {
    const receipt = { stage: "admission", decision: "denied", reason, ...(scope && { scope }), policyEpoch } as const;
    if (record && journal.length < maxReceipts) journal.push(structuredClone(receipt));
    return { state: "denied", admission: "denied", receipt };
  }

  function readFixture(resource: typeof fixtureOperation.resource): "sample record" {
    adapterCalls++;
    if (failAdapter || resource !== fixtureOperation.resource) throw new Error("Fixture adapter outcome unavailable");
    return "sample record";
  }

  function runFixture(request: unknown): AttemptResult {
    if (busy) return deny("host-busy", undefined, null, false);
    busy = true;
    try {
      const assessment = assess(request);
      const { scope } = assessment;
      if (scope && attempts.has(scope.attemptId)) {
        return deny(attempts.get(scope.attemptId) === scope.assembly ? "attempt-duplicate" : "attempt-conflict", scope);
      }
      if (!scope) return deny(assessment.state === "ready" ? "input-invalid" : assessment.reason);
      if (attempts.size >= maxAttempts || journal.length > maxReceipts - 2) {
        return deny("attempt-limit", scope);
      }
      attempts.set(scope.attemptId, scope.assembly);
      if (assessment.state !== "ready") return deny(assessment.reason, scope);

      const { scope: readyScope, authority } = assessment;
      try {
        onIntent?.();
        journal.push(structuredClone({ stage: "intent", decision: "pending", scope: readyScope, policyEpoch: authority.policyEpoch }));
      } catch {
        return deny("intent-unavailable", readyScope, authority.policyEpoch);
      }

      const current = checkFacts(readFacts, readyScope);
      if (typeof current === "string") return deny(current, readyScope, authority.policyEpoch);
      if (current.policyEpoch !== authority.policyEpoch || current.approvalId !== authority.approvalId ||
          current.expiresAt !== authority.expiresAt) return deny("authority-changed", readyScope, authority.policyEpoch);

      let value: "sample record";
      try {
        value = readFixture(readyScope.operation.resource);
      } catch {
        const receipt = { stage: "outcome", decision: "outcome-unknown", reason: "adapter-outcome-unknown",
          scope: readyScope, policyEpoch: authority.policyEpoch } as const;
        journal.push(structuredClone(receipt));
        return { state: "outcome-unknown", admission: "admitted", receipt };
      }
      if (failOutcome) {
        const receipt = {
          stage: "outcome", decision: "outcome-unknown", reason: "outcome-unavailable",
          scope: readyScope, policyEpoch: authority.policyEpoch,
        } as const;
        outcomeGaps.push(structuredClone(receipt));
        return { state: "outcome-unknown", admission: "admitted", receipt };
      }
      const receipt = { stage: "outcome", decision: "completed", scope: readyScope, policyEpoch: authority.policyEpoch } as const;
      journal.push(structuredClone(receipt));
      return { state: "completed", admission: "admitted", value, receipt };
    } finally {
      busy = false;
    }
  }

  return Object.freeze({
    preflight,
    runFixture,
    evidence: () => ({ adapterCalls, receipts: structuredClone(journal), outcomeGaps: structuredClone(outcomeGaps) }),
  });
}
