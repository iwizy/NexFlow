# RFC-0007: Approval Gates

## Status

Draft

## Summary

This RFC proposes the initial NexFlow approval gate semantics.

The proposal defines:

- approval gate declarations
- approval request instances
- approval decisions
- evidence expectations
- approval scope
- expiry and revocation
- permission evaluation order
- event and audit expectations
- future runtime enforcement boundaries

The goal is to keep human authority explicit while preserving a clear boundary between specification metadata, validation, and future runtime enforcement.

## Motivation

NexFlow separates capabilities from permissions. A capability says an actor or integration can technically perform an action. A permission says whether the action is allowed, denied, or approval-gated.

Approval gates are the mechanism that makes sensitive actions reviewable before they happen.

Sensitive actions include:

- file writes
- source code changes
- command execution
- dependency installation
- pull request creation
- network access
- credential access
- durable or sensitive memory writes
- production actions
- deployments
- destructive operations
- activation of broader agent definitions
- use of high-risk extensions or tools

Without shared approval semantics, tools could interpret approval gates inconsistently. One tool might treat a gate as documentation only, another might treat it as a permanent authorization, and another might let agents approve their own high-risk actions.

NexFlow needs a shared approval model before any runtime attempts to enforce approvals.

## Proposal

NexFlow should distinguish three approval concepts:

| Concept | Meaning |
| --- | --- |
| Approval gate declaration | A reusable policy object declared in manifests. |
| Approval request | A concrete request to approve a specific gated action in a specific scope. |
| Approval decision | A recorded decision about an approval request. |

Current manifests define compact approval gate declarations. Future validators, CLIs, and runtimes may define richer approval request and decision records, but this repository does not implement them today.

## Approval Gate Declaration

An approval gate declaration describes the reusable policy.

Example:

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

The declaration should identify:

- stable gate ID
- plain-language purpose
- required approvers or approver roles
- capabilities, tasks, workflow steps, memory scopes, or actions it applies to
- events expected for audit

An approval gate declaration is not an approval decision. It does not authorize an action by itself.

## Approval Request

An approval request is a concrete request to satisfy a gate for a specific action.

A future approval request record should include:

- gate ID
- requester
- actor that will perform the action
- requested capability or workflow transition
- task, workflow step, memory scope, context source, or artifact involved
- target system or environment
- requested scope
- evidence
- requested time
- expiry expectation, if known

Example:

```yaml
approval:
  gate: code_review
  requestedBy: implementation-agent
  actionActor: implementation-agent
  capability: create_pull_request
  task: implement-api-change
  scope:
    branch: feature/api-change
    pullRequestDraft: true
  evidence:
    summary: API change implemented and tests passed.
    artifacts:
      - branch:feature/api-change
      - test-report:api-tests
```

This RFC does not require a final manifest shape for approval requests.

## Approval Decision

Approval decisions should use explicit states.

| State | Meaning |
| --- | --- |
| `requested` | Approval has been requested but not decided. |
| `approved` | The gated action may proceed within the approved scope. |
| `rejected` | The gated action may not proceed. |
| `changes_requested` | The actor must revise work before approval can continue. |
| `expired` | A previous approval is no longer valid. |
| `revoked` | A previous approval was withdrawn. |
| `superseded` | A newer decision replaced the older one. |

Decision records should include:

- decision state
- approver
- decision time
- scope approved or rejected
- evidence reviewed
- conditions or notes
- expiry
- revocation reason, when relevant

An `approved` decision should never apply beyond its declared scope.

## Approval Scope

Approval scope should be narrow by default.

Good scopes include:

- one task
- one workflow step
- one branch
- one pull request
- one command
- one dependency change
- one deployment target
- one memory write or promotion
- one context source use
- one production action

Broad approval scopes should be exceptional and should explain why narrower scope is not practical.

An approval scoped to one action MUST NOT be reused for a materially different action.

For example:

- approval to create a pull request does not approve deployment
- approval to run tests does not approve arbitrary command execution
- approval to write task memory does not approve organization memory promotion
- approval to use one context source does not approve unrestricted web access

## Evidence

Approval evidence should help an approver decide safely.

Useful evidence includes:

- task ID
- requester
- actor performing the action
- capability or transition requested
- affected files, branches, pull requests, artifacts, or environments
- context sources used
- memory scopes read or written
- risk summary
- validation or test output
- dependency or network changes
- rollout, rollback, or recovery notes
- links to human-readable review material

Evidence MUST NOT include raw secrets, tokens, passwords, private keys, credential values, or unnecessary personal data.

Sensitive evidence may be referenced rather than embedded in public manifests or public events.

## Permission Evaluation

Approval gates work with permissions and capabilities.

Recommended evaluation order:

1. Confirm the actor has the requested capability declared.
2. Find permission rules that apply to the actor, role, team, workflow, task, or project scope.
3. Treat explicit `deny` as strongest.
4. Treat `allow` as valid only inside its declared scope and conditions.
5. If permission is `approval_required`, locate the referenced approval gate.
6. Confirm the approval gate declaration exists.
7. Confirm an approval decision exists for the requested action.
8. Confirm the decision is `approved`.
9. Confirm the approver is authorized for that gate.
10. Confirm the approval is valid for the requested scope.
11. Confirm the approval is not expired, revoked, or superseded.
12. Emit or require audit events for high-risk or approval-gated actions.

An approval gate MUST NOT turn a denied action into an allowed action.

If a runtime cannot verify approval state for a gated action, it should fail closed.

## Approver Authority

Approvers should be declared human actors, roles, teams, or policy authorities.

Agents may:

- prepare evidence
- summarize risks
- request approval
- route approval requests
- detect missing approvals

Agents SHOULD NOT self-approve high-risk actions.

Automated policy approval may be acceptable for low-risk actions only when project policy explicitly defines the policy authority and scope.

## Expiry And Revocation

Approvals should not be permanent by default.

Future runtimes should support expiry based on:

- time window
- task completion
- workflow step completion
- artifact change
- branch update
- dependency update
- policy change
- environment change
- revocation by authorized human

Approvals should become invalid when their evidence or scope materially changes.

Revocation should identify:

- who revoked the approval
- when it was revoked
- why it was revoked
- which actions are now blocked

## Event And Audit Expectations

Approval-related activity should be auditable.

Current NexFlow event vocabulary supports review-oriented events such as:

- `review.requested`
- `review.completed`
- `task.blocked`
- `task.unblocked`

Future event vocabulary may add approval-specific events:

- `approval.requested`
- `approval.approved`
- `approval.rejected`
- `approval.changes_requested`
- `approval.revoked`
- `approval.expired`
- `approval.superseded`

Approval event payloads should include:

- gate ID
- request ID, when available
- decision state
- requester
- approver
- subject action or artifact
- scope
- evidence references
- expiry
- correlation ID

Events should prefer references to sensitive evidence over raw sensitive content.

## Runtime Enforcement Boundaries

This RFC does not implement runtime enforcement.

A future runtime that claims approval enforcement should:

- block gated actions until approval is valid
- make blocking reasons visible
- show which gate applies
- show who may approve
- preserve approval evidence
- reject approvals outside declared scope
- reject expired, revoked, or superseded approvals
- prevent agents from self-approving high-risk actions unless policy explicitly allows it
- log approval decisions and gated action outcomes
- preserve human override and revocation

Unsupported approval behavior MUST NOT be treated as allowed behavior.

## Validation Expectations

Future semantic validators should check:

- referenced approval gates exist
- required approvers reference declared actors, roles, teams, or policy authorities
- permissions with `approval_required` include an approval gate
- high-risk capabilities have explicit deny or approval gates
- memory scopes with `approval_required` reference a gate
- workflow and task gates reference declared gates
- events referenced by gates are declared or documented
- active agent definitions that broaden risky access have review or approval metadata
- approval gates do not imply access where permissions deny access

Validators should report warnings separately from hard errors when project policy allows judgment.

## Compatibility Impact

This RFC does not change manifest structure.

If accepted, it may guide:

- future `docs/approval-gates.md` updates
- future event vocabulary for approval-specific events
- future semantic validation checks
- future runtime conformance requirements
- future schema additions for richer approval request or decision metadata

No existing schema, example, or manifest needs migration because of this RFC.

Future changes to approval meaning can affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility.

## Security and Safety Impact

This RFC improves safety by making approval semantics explicit.

It reduces the risk that:

- capabilities are treated as approvals
- approval gates override explicit deny rules
- approvals become unlimited or permanent by accident
- agents self-approve high-risk work
- stale approvals authorize changed artifacts
- sensitive evidence leaks through events or public manifests
- gated actions happen without auditability

Approval gates remain a specification mechanism until a future runtime enforces them.

## Alternatives Considered

### Permissions Only

NexFlow could rely only on `allow` and `deny`.

This is too coarse for human-in-the-loop software delivery, where many actions should be possible only after review.

### Runtime-Specific Approvals

NexFlow could leave approval behavior entirely to each runtime.

This would make manifests less portable and would make approval meaning inconsistent across tools.

### Permanent Approval Tokens

NexFlow could model approvals as reusable tokens.

This is risky because approvals are usually scoped to evidence, artifacts, actors, and time. Reusable approval tokens can become stale or overbroad.

### Agent Self-Approval By Default

NexFlow could allow agents to approve their own actions when they hold `approve_changes`.

This would weaken human authority and make high-risk autonomy harder to audit. Self-approval should require explicit low-risk policy, not be the default.

## Open Questions

- Should NexFlow define first-class `approval.*` events in `0.1` or wait for the event envelope RFC?
- Should approval request and decision records become their own manifest kind?
- Should approval gates support quorum, delegation, or separation-of-duty fields in the schema?
- Should approvals be represented as artifacts that tasks and handoffs can cite?
- Should future validators distinguish missing approval gates from weak approval scopes?
- How should private approval evidence be referenced from public open-source repositories?
- Which approval changes should require a new spec version before `1.0`?
