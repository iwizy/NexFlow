# RFC-0017: Human Override

## Status

Draft

## Implementation Note

The current `0.1` repository implements the first additive policy slice
described by this RFC: structured project policy, typed authority references,
fail-closed response, approval-gated resume, audit event references, one
maintained example, and focused validation checks.

This implementation does not accept the full RFC automatically and does not
claim runtime interruption or enforcement.

## Summary

This RFC defines a provider-neutral and runtime-neutral human override policy
for AI developer teams.

The policy declares:

- which human-controlled actors may request an override
- which narrowing operations are supported
- how new and in-flight actions are handled
- how failures remain blocked
- how work may resume
- which audit evidence and events are required

The central rule is:

> Human override may stop or narrow behavior. It never grants behavior.

## Motivation

NexFlow already states that humans remain the final authority, but a prose
statement is not enough for interoperable manifests.

Without a structured contract, tools may disagree about:

- who can issue a stop or pause request
- whether an agent or automation may issue the same control
- whether new actions can start while an override is unresolved
- what happens when interruption fails
- whether work resumes automatically
- which approval and audit records are required
- whether override can bypass ordinary policy

A common declaration makes those assumptions visible before a future runtime
exists.

## Goals

- preserve explicit human authority
- support pause, stop, cancel, block, and revocation semantics
- fail closed on ambiguity or control failure
- require approval before resume
- preserve auditability without storing secrets
- compose safely with actors, permissions, approvals, autonomy, tasks,
  workflows, and effective agent configuration
- remain language, provider, and runtime neutral

## Non-Goals

This RFC does not:

- implement process interruption
- authenticate a human
- define operating-system signals or emergency hardware
- guarantee hard real-time stop latency
- grant permissions or capabilities
- define incident response procedures
- store credentials or authentication factors
- mutate source manifests
- define a universal user interface

## Placement

Human override is a project policy under:

```yaml
project.policies.humanOverride
```

It is not a new manifest kind. Override is a project-wide safety constraint
that composes with existing actor, approval, event, task, workflow, permission,
and autonomy declarations.

## Proposed Shape

```yaml
humanOverride:
  authorities:
    - kind: actor
      id: human-maintainer
  operations:
    - pause_agent
    - stop_agent
    - pause_workflow
    - stop_workflow
    - cancel_task
    - block_action
    - revoke_approval
    - revoke_authorization
  response:
    blockNewActions: true
    inFlightActions: request_stop
    onFailure: remain_blocked
  resume:
    mode: approval_required
    approvalGate: human_review
    requireReason: true
  audit:
    events:
      - override.requested
      - override.applied
      - override.failed
      - override.resumed
    recordAuthority: true
    recordReason: true
    recordTarget: true
    recordOutcome: true
```

## Authority Resolution

The policy requires typed actor references and therefore requires `ActorSet`.

An authority is eligible only when it resolves to:

- a human actor; or
- an authority actor whose complete representation chain is human-controlled.

Agent, automation, and service actors are not eligible. Role labels, project
maintainer entries, ID equality, and previous approvals do not imply override
authority.

Concrete authentication remains a runtime responsibility.

## Operations

The initial closed operation vocabulary is:

- `pause_agent`
- `stop_agent`
- `pause_workflow`
- `stop_workflow`
- `cancel_task`
- `block_action`
- `revoke_approval`
- `revoke_authorization`

Operation support is a declared implementation claim. An implementation must
not advertise an operation it cannot honor at the documented safety boundary.

## Response

`blockNewActions` is fixed to `true`.

`inFlightActions` may be:

- `request_stop`
- `allow_safe_completion`

The runtime must document its safe completion or interruption boundary.

`onFailure` is fixed to `remain_blocked`. Failure to authenticate, resolve,
apply, or record the override does not authorize continued work.

## Resume

Resume requires:

- `mode: approval_required`
- one declared approval gate
- a reason

Resume is scoped to the identified target. It does not restore revoked
approvals or authorization, erase policy denials, or approve the interrupted
action.

## Evaluation

A conforming future implementation should:

1. validate policy shape
2. resolve and authenticate the authority
3. resolve the operation and target
4. block new target actions
5. apply the in-flight policy
6. record the outcome
7. remain blocked on failure
8. require the declared resume gate and reason

Declaration order, file order, runtime preference, or prior activity must not
change this order.

## Events

The initial event vocabulary is:

- `override.requested`
- `override.applied`
- `override.failed`
- `override.resumed`

Events should record references and redacted summaries. They must not embed
credentials, tokens, private keys, raw prompts, raw context, raw memory, or
other unnecessary sensitive content.

## Relationship To Permissions And Approval

Override is independent of action authorization.

- An override may invalidate an approval but cannot create one.
- An override may revoke a runtime authorization but cannot grant one.
- Resume approval removes only the override block for the identified target.
- Explicit deny and approval-required effects remain authoritative.

## Relationship To Autonomy

Human override is a narrowing constraint above any requested autonomy level.
No autonomy declaration, agent definition, task, workflow, provider, extension,
or runtime default may disable it when an implementation claims support.

## Validation

Structural validation should check:

- non-empty typed authorities
- closed non-empty operation set
- new-action blocking
- supported in-flight behavior
- fail-closed failure state
- approval-gated resume and required reason
- mandatory audit settings and valid event syntax

Semantic validation should check:

- ActorSet presence
- authority existence and human control
- approval gate existence
- event declaration existence
- target and operation support when evaluating a concrete request

Validation does not prove runtime enforcement.

## Compatibility Impact

Adding the optional policy is additive for `specVersion: "0.1"`.

Potentially breaking changes include:

- requiring the policy
- broadening eligible authority kinds
- allowing automatic resume
- changing operation meaning
- weakening blocking or audit requirements
- treating override as a permission grant

Any such change requires a version decision, migration notes, schemas, examples,
tests, and compatibility documentation.

## Security And Safety Impact

The model reduces risk from:

- runaway or unintended activity
- ambiguous stop authority
- automatic recovery after failed interruption
- agent self-override
- hidden approval restoration
- unaudited revocation or resume

The model does not remove implementation risks such as unavailable control
channels, delayed safe boundaries, compromised identities, or incomplete
credential revocation.

## Privacy Impact

Override evidence may contain incident context and human attribution. Projects
should minimize personal data, use project-local actor IDs, redact reasons when
needed, and apply explicit retention policy.

## Alternatives Considered

### Prose-Only Security Guidance

Prose cannot be validated or referenced consistently by tools.

### Approval Gate Only

Approval gates decide whether an action may proceed. They do not describe stop,
pause, cancellation, in-flight response, or resume behavior.

### Agent Capability

Making override an agent capability would confuse technical ability with final
human authority and could permit self-override.

### Automatic Resume

Automatic resume weakens the safety boundary and hides whether the original
problem was reviewed.

## Open Questions

- Should future versions support scoped authority sets per operation?
- Should stop-latency claims become a separate runtime conformance surface?
- How should distributed runtimes confirm that every worker applied an
  override?
- Should resume require separation of duty for critical targets?
