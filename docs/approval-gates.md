# Approval Gates

Approval gates define when human or policy approval is required before an actor may use a capability, complete a task, advance a workflow, write memory, or perform a sensitive action.

An approval gate is not a runtime by itself. It is a declarative policy object that future validators and runtimes can inspect and enforce.

Related RFC: [RFC-0007: Approval Gates](../rfcs/RFC-0007-approval-gates.md).

## Goals

- Keep human authority explicit.
- Make risky actions visible before they happen.
- Separate approval requirements from technical capability.
- Give reviewers enough evidence to make a decision.
- Produce audit-friendly events for important decisions.

## Where Approval Gates Appear

Approval gates can appear in several manifest areas:

| Location | Purpose |
| --- | --- |
| `project.approvalGates` | Declares reusable gates for the project. |
| `permissions[].approvalGate` | Gates the use of specific capabilities by subjects. |
| `tasks[].approvalGates` | Gates task execution or completion. |
| `workflow.stages[].steps[].approvalGates` | Gates workflow transitions or steps. |
| `memoryScopes[].approvalGate` | Gates durable or sensitive memory writes. |
| `project.policies.networkAccess.rules[].approvalGate` | Gates a matching outbound network purpose and destination. |

The same gate ID may be referenced by multiple manifests when the approval policy is shared.

## Gate Declaration

Current schemas support a compact approval gate shape:

```yaml
approvalGates:
  - id: code_review
    description: Reviewer approval required before merge.
    requiredApprovers:
      - reviewer
    appliesTo:
      - write_repository
      - create_pull_request
    events:
      - review.requested
      - review.completed
```

Future versions may add richer fields for quorum, expiry, revocation, evidence, and delegation.

## Approval Actors

An approver should be a declared human actor, role, team, or policy authority.

Examples:

- maintainer
- security reviewer
- release manager
- product owner
- compliance reviewer

Agents may prepare evidence, summarize risk, or request approval. Sensitive approvals should remain human-owned unless a project explicitly defines a low-risk automated policy gate.

## Decision States

Approval decisions should use explicit states.

| State | Meaning |
| --- | --- |
| `requested` | Approval has been requested but not decided. |
| `approved` | The gated action may proceed within the approved scope. |
| `rejected` | The gated action may not proceed. |
| `changes_requested` | The actor must revise work before approval can continue. |
| `expired` | A previous approval is no longer valid. |
| `revoked` | A previous approval was withdrawn. |
| `superseded` | A newer approval decision replaced the older one. |

The current event model includes `review.requested` and `review.completed`. Future event revisions may add more specific approval events.

## Evidence

Approval requests should include enough evidence for reviewers to make a decision.

Useful evidence includes:

- task ID
- actor requesting approval
- capability being used
- files or artifacts affected
- command or deployment target
- context sources used
- memory scopes read or written
- risk summary
- test or validation output
- rollback or recovery notes for production actions

Approval evidence should not include raw secrets.

## Scope

An approval should be scoped.

Good approval scopes:

- one task
- one workflow step
- one branch
- one pull request
- one command
- one deployment target
- one memory write
- one network purpose and destination set

Broad approvals, such as unlimited repository write access, should be avoided.

## Expiry and Revocation

Approval should not be treated as permanent unless the project explicitly says so.

Future runtimes should support:

- expiry after a time window
- expiry after task completion
- revocation by an authorized human
- invalidation when scope changes materially
- invalidation when a referenced artifact changes

For example, approval to create a pull request for one branch should not automatically approve deployment of that branch.

## Permission Interaction

Approval gates work with permissions.

Recommended evaluation order:

1. Confirm the actor has the requested capability declared.
2. Evaluate applicable permission rules.
3. Treat `deny` as strongest.
4. If permission is `approval_required`, locate and evaluate the approval gate.
5. Confirm the approval is valid for the requested action and scope.
6. Reject the action if approval is missing, expired, revoked, or out of scope.

An approval gate should never turn a denied action into an allowed action.

## Workflow Interaction

Workflow steps may require approval before they start, complete, or transition.

Examples:

- implementation cannot begin until product scope is approved
- review cannot complete until required reviewers decide
- release cannot start until quality and security gates pass

Workflow gates should emit review or approval events when meaningful state changes occur.

## Memory Interaction

Memory writes can require approval when they are durable, sensitive, or cross-scope.

Examples:

- writing project memory from task notes
- promoting task memory to team memory
- writing organization memory from a sensitive incident
- storing user preference memory

Approval gates for memory should identify ownership, visibility, sensitivity, and allowed consumers.

## Network Interaction

A network rule with `effect: approval_required` must reference a declared
project approval gate. The approval is valid only for the actors, purposes,
destinations, schemes, ports, classification, and time scope represented by the
request and decision.

Approval does not create network authority by itself. The actor must still have
the `access_network` capability, an effective permission, access to the selected
context, provider, or extension, and any required credentials. A deny rule or
transport restriction remains binding after approval.

See [Network Access Policy](network-access-policy.md).

## Event Expectations

Approval-related activity should be auditable.

Recommended events:

- `review.requested`
- `review.completed`
- `task.blocked`
- `task.unblocked`
- `workflow.started`
- `workflow.completed`

Future event model work may introduce:

- `approval.requested`
- `approval.approved`
- `approval.rejected`
- `approval.revoked`
- `approval.expired`

Until then, projects can model approval decisions through review events with clear payloads.

## Runtime Expectations

A future runtime should:

- block gated actions until approval is valid
- show the gate that blocked an action
- show who approved or rejected the action
- preserve approval evidence
- reject approvals outside their declared scope
- log high-risk approval decisions
- allow human override or revocation

## Non-Conforming Behavior

The following behavior should be treated as non-conforming:

- treating approval as implied by a capability
- treating approval as permanent without policy
- allowing an approval gate to override `deny`
- letting agents self-approve high-risk actions
- approving production actions without a human authority
- hiding approval evidence from reviewers
- performing gated actions without audit events
