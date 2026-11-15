import { createHash } from "node:crypto";
import { fixtureEffects, fixtureOperation } from "../dist/host-contracts/src/index.js";

const reviewer = "fixture-reviewer";
const gate = "fixture-review";
const resume = "fixture-resume";
const sourceHints = { actors: "actors.yaml", capabilities: "capabilities.yaml", permissions: "permissions.yaml" };

function manifest(kind, payload) {
  return { specVersion: "0.1", kind, metadata: { project: fixtureOperation.project }, ...payload };
}

export function fixtureDocuments() {
  return {
    "project.yaml": manifest("Project", {
      project: {
        id: fixtureOperation.project,
        displayName: "Fixture project",
        description: "Offline admission fixture",
        approvalGates: [
          {
            id: gate,
            description: "Approve the fixture read",
            requiredApprovers: [reviewer],
            targets: [{ kind: "capability", id: fixtureOperation.capability }],
          },
          { id: resume, description: "Approve resumption", requiredApprovers: [reviewer] },
        ],
        policies: {
          humanOverride: {
            authorities: [{ kind: "actor", id: reviewer }],
            operations: ["block_action", "revoke_approval"],
            response: { blockNewActions: true, inFlightActions: "request_stop", onFailure: "remain_blocked" },
            resume: { mode: "approval_required", approvalGate: resume, requireReason: true },
            audit: {
              events: ["override.requested", "override.applied", "override.failed", "override.resumed"],
              recordAuthority: true, recordReason: true, recordTarget: true, recordOutcome: true,
            },
          },
        },
      },
      manifests: { ...sourceHints },
    }),
    "actors.yaml": manifest("ActorSet", {
      actors: [fixtureOperation.actor, reviewer].map(id => ({
        id, kind: "human", displayName: id, description: "Synthetic fixture actor",
        roles: [id], responsibilities: ["Participate in the fixture"],
      })),
    }),
    "capabilities.yaml": manifest("CapabilitySet", {
      capabilities: [{
        id: fixtureOperation.capability, description: "Read one synthetic record",
        risk: "low", requiresApprovalByDefault: true,
      }],
    }),
    "permissions.yaml": manifest("PermissionSet", {
      permissions: [{
        id: "fixture-permission", description: "Require review of the fixture read",
        subjects: [fixtureOperation.actor], capabilities: [fixtureOperation.capability],
        effect: "approval_required", approvalGate: gate,
      }],
    }),
  };
}

export function fixtureRequest(id = 1, documents = fixtureDocuments()) {
  return {
    attemptId: "fixture-attempt-" + id,
    operation: { ...fixtureOperation },
    effects: { ...fixtureEffects },
    manifests: Object.entries(documents).map(([name, document]) => ({
      name, bytes: Buffer.from(JSON.stringify(document)),
    })),
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function fixtureFacts(request) {
  const assembly = sha256(JSON.stringify(
    request.manifests.map(({ name, bytes }) => [name, sha256(bytes)]).sort(),
  ));
  return {
    now: 100, policyEpoch: 1, actor: fixtureOperation.actor,
    capabilityAvailable: true, adapterAvailable: true, budgetAvailable: true, override: "inactive",
    approval: {
      id: "fixture-approval-1", state: "approved", reviewer, gate, operation: { ...fixtureOperation },
      assembly, policyEpoch: 1, expiresAt: 200,
    },
  };
}
