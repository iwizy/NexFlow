export const hostApi = "host-preflight-v1-preview";

export const fixtureOperation = Object.freeze({
  project: "fixture-project",
  actor: "fixture-requester",
  capability: "read_fixture",
  resource: "sample-note",
} as const);

export const fixtureEffects = Object.freeze({
  reads: 1,
  filesystem: 0,
  writes: 0,
  network: 0,
  credentials: 0,
  subprocesses: 0,
  providers: 0,
  extensions: 0,
  destructive: 0,
} as const);

export interface FixtureRequest {
  attemptId: string;
  operation: typeof fixtureOperation;
  manifests: readonly { name: string; bytes: Uint8Array }[];
  effects: typeof fixtureEffects;
}

export type ApprovalState = "requested" | "approved" | "rejected" | "changes_requested"
  | "expired" | "revoked" | "superseded";

export interface Approval {
  id: string;
  state: ApprovalState;
  reviewer: string;
  gate: string;
  operation: typeof fixtureOperation;
  assembly: string;
  policyEpoch: number;
  expiresAt: number;
}

// Trusted synthetic host state. Null means the corresponding fact is unknown.
export interface HostFacts {
  now: number | null;
  policyEpoch: number | null;
  actor: string | null;
  capabilityAvailable: boolean | null;
  adapterAvailable: boolean | null;
  budgetAvailable: boolean | null;
  approval: Approval | null;
  override: "inactive" | "block_action" | "revoke_approval" | null;
}

export interface AttemptScope {
  attemptId: string;
  operation: typeof fixtureOperation;
  assembly: string;
}

export type Reason =
  | "input-invalid" | "manifest-invalid" | "version-unsupported" | "operation-unsupported"
  | "effects-unsupported" | "policy-unsupported" | "permission-denied" | "permission-missing"
  | "facts-unknown" | "clock-unknown" | "policy-unknown" | "actor-unknown" | "actor-mismatch"
  | "capability-unknown" | "capability-unavailable" | "adapter-unknown" | "adapter-unavailable"
  | "budget-unknown" | "budget-unavailable" | "override-unknown" | "override-block-action"
  | "override-revoke-approval" | "approval-unknown" | "approval-scope-mismatch"
  | "approval-requested" | "approval-rejected" | "approval-changes_requested"
  | "approval-expired" | "approval-revoked" | "approval-superseded"
  | "attempt-duplicate" | "attempt-conflict" | "host-busy" | "attempt-limit"
  | "intent-unavailable" | "authority-changed" | "adapter-outcome-unknown" | "outcome-unavailable";

export type Preflight =
  | { state: "ready"; scope: AttemptScope }
  | { state: "invalid" | "unsupported" | "blocked"; reason: Reason; scope?: AttemptScope };

export type Receipt =
  | { stage: "intent"; decision: "pending"; scope: AttemptScope; policyEpoch: number }
  | { stage: "admission"; decision: "denied"; reason: Reason; scope?: AttemptScope; policyEpoch: number | null }
  | { stage: "outcome"; decision: "completed"; scope: AttemptScope; policyEpoch: number }
  | { stage: "outcome"; decision: "outcome-unknown"; reason: Reason; scope: AttemptScope; policyEpoch: number };

export type AttemptResult =
  | { state: "denied"; admission: "denied"; receipt: Extract<Receipt, { stage: "admission" }> }
  | { state: "completed"; admission: "admitted"; value: "sample record"; receipt: Extract<Receipt, { decision: "completed" }> }
  | { state: "outcome-unknown"; admission: "admitted"; receipt: Extract<Receipt, { decision: "outcome-unknown" }> };
