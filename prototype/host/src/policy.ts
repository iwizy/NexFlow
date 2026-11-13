import type { Manifest } from "@nexflow/validation";
import { fixtureOperation, type AttemptScope, type HostFacts, type Reason } from "../../host-contracts/src/index.js";
import { dataRecord, fields, list, matches, type Fields } from "./input.js";

const reviewer = "fixture-reviewer";
const gate = "fixture-review";
const resume = "fixture-resume";
const operation = fixtureOperation;

const hasOnly = (value: Fields, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const unique = (records: Fields[]) => new Set(records.map(record => record.id)).size === records.length;
const payloads: Readonly<Record<string, readonly string[]>> = {
  Project: ["project", "manifests"], ActorSet: ["actors"],
  CapabilitySet: ["capabilities"], PermissionSet: ["permissions"],
};

export function checkPolicy(documents: Manifest[]): Reason | null {
  const [actorsDocument, capabilitiesDocument, permissionsDocument, projectDocument] = documents.map(doc => doc.value);
  const project = fields(projectDocument!.project);
  const policies = fields(project.policies);
  const actors = list(actorsDocument!.actors).map(fields);
  const capabilities = list(capabilitiesDocument!.capabilities).map(fields);
  const permissions = list(permissionsDocument!.permissions).map(fields);
  const gates = list(project.approvalGates).map(fields);
  const override = fields(policies.humanOverride);
  const auditEvents = list(fields(override.audit).events);

  if (project.id !== operation.project ||
      !hasOnly(project, ["id", "displayName", "description", "approvalGates", "policies"]) ||
      !hasOnly(policies, ["humanOverride"]) ||
      !documents.every(doc => hasOnly(doc.value, [
        "kind", "specVersion", "metadata",
        ...payloads[doc.kind]!,
      ]))) return "policy-unsupported";

  if (actors.length !== 2 || !unique(actors) || ![operation.actor, reviewer].every(id =>
    actors.some(actor => actor.id === id && actor.kind === "human" &&
      hasOnly(actor, ["id", "kind", "displayName", "description", "roles", "responsibilities", "skills"])))) {
    return "policy-unsupported";
  }

  const capability = capabilities.find(record => record.id === operation.capability);
  if (!capability) return "capability-unavailable";
  if (capabilities.length !== 1 || capability.risk !== "low" || capability.requiresApprovalByDefault !== true ||
      !hasOnly(capability, ["id", "description", "risk", "requiresApprovalByDefault"])) return "policy-unsupported";

  const approvalGate = gates.find(record => record.id === gate);
  const resumeGate = gates.find(record => record.id === resume);
  const targets = list(approvalGate?.targets);
  if (gates.length !== 2 || !approvalGate || !resumeGate ||
      !gates.every(record => hasOnly(record, ["id", "description", "requiredApprovers", "targets"]) &&
        list(record.requiredApprovers).length === 1 && list(record.requiredApprovers)[0] === reviewer) ||
      targets.length !== 1 || !matches(targets[0], { kind: "capability", id: operation.capability }) ||
      Object.hasOwn(resumeGate, "targets") ||
      list(override.authorities).length !== 1 ||
      !matches(list(override.authorities)[0], { kind: "actor", id: reviewer }) ||
      list(override.operations).length !== 2 ||
      !["block_action", "revoke_approval"].every(value => list(override.operations).includes(value)) ||
      auditEvents.length !== 4 ||
      !["requested", "applied", "failed", "resumed"].every(event => auditEvents.includes("override." + event)) ||
      !matches(override.resume, { mode: "approval_required", approvalGate: resume, requireReason: true }) ||
      !matches(override.response, { blockNewActions: true, inFlightActions: "request_stop", onFailure: "remain_blocked" })) {
    return "policy-unsupported";
  }

  const matching = permissions.filter(permission =>
    list(permission.subjects).includes(operation.actor) && list(permission.capabilities).includes(operation.capability));
  if (matching.some(permission => permission.effect === "deny")) return "permission-denied";
  if (!matching.length) return "permission-missing";
  if (permissions.length !== 1 || matching[0]!.effect !== "approval_required" ||
      matching[0]!.approvalGate !== gate || list(matching[0]!.subjects).length !== 1 ||
      list(matching[0]!.capabilities).length !== 1 ||
      !hasOnly(matching[0]!, ["id", "description", "subjects", "capabilities", "effect", "approvalGate"])) {
    return "policy-unsupported";
  }
  return null;
}

const approvalReasons = {
  requested: "approval-requested", rejected: "approval-rejected", changes_requested: "approval-changes_requested",
  expired: "approval-expired", revoked: "approval-revoked", superseded: "approval-superseded",
} as const;

const knownTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export interface Authority {
  policyEpoch: number;
  approvalId: string;
  expiresAt: number;
}

export function checkFacts(read: () => HostFacts, scope: AttemptScope): Reason | Authority {
  let value: unknown;
  try {
    value = read();
  } catch {
    return "facts-unknown";
  }
  const facts = dataRecord(value, [
    "now", "policyEpoch", "actor", "capabilityAvailable", "adapterAvailable", "budgetAvailable", "approval", "override",
  ]);
  if (!facts) return "facts-unknown";
  if (!knownTime(facts.now)) return "clock-unknown";
  if (!knownTime(facts.policyEpoch)) return "policy-unknown";
  if (typeof facts.actor !== "string") return "actor-unknown";
  if (facts.actor !== operation.actor) return "actor-mismatch";
  if (facts.override === "block_action") return "override-block-action";
  if (facts.override === "revoke_approval") return "override-revoke-approval";
  if (facts.override !== "inactive") return "override-unknown";
  if (typeof facts.capabilityAvailable !== "boolean") return "capability-unknown";
  if (!facts.capabilityAvailable) return "capability-unavailable";
  if (typeof facts.adapterAvailable !== "boolean") return "adapter-unknown";
  if (!facts.adapterAvailable) return "adapter-unavailable";
  if (typeof facts.budgetAvailable !== "boolean") return "budget-unknown";
  if (!facts.budgetAvailable) return "budget-unavailable";

  const approval = dataRecord(facts.approval, [
    "id", "state", "reviewer", "gate", "operation", "assembly", "policyEpoch", "expiresAt",
  ]);
  if (!approval || typeof approval.state !== "string") return "approval-unknown";
  if (approval.state !== "approved") {
    return Object.hasOwn(approvalReasons, approval.state)
      ? approvalReasons[approval.state as keyof typeof approvalReasons]
      : "approval-unknown";
  }
  if (typeof approval.id !== "string" || !/^fixture-approval-[0-9]{1,6}$/u.test(approval.id) ||
      approval.reviewer !== reviewer || approval.gate !== gate || !matches(approval.operation, operation) ||
      approval.assembly !== scope.assembly || approval.policyEpoch !== facts.policyEpoch) {
    return "approval-scope-mismatch";
  }
  if (!knownTime(approval.expiresAt)) return "approval-unknown";
  if (facts.now >= approval.expiresAt) return "approval-expired";
  return { policyEpoch: facts.policyEpoch, approvalId: approval.id, expiresAt: approval.expiresAt };
}
