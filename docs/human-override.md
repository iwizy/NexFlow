# Human Override Model

Human override is the project-level safety policy that lets explicitly declared
human-controlled authorities pause, stop, cancel, block, or revoke future
runtime activity.

This page is the normative source for the implemented `humanOverride` policy
slice in the current `0.1` draft. It defines manifest semantics and validation
boundaries. NexFlow does not yet provide a runtime that can interrupt work or
enforce this policy.

Related proposal: [RFC-0017: Human Override](../rfcs/RFC-0017-human-override.md).

## Core Rule

Human override can only narrow effective behavior.

It cannot:

- grant a capability or permission
- approve an action
- bypass a deny rule or approval gate
- broaden context, memory, network, provider, or extension access
- raise autonomy
- rewrite a manifest
- hide the authority, reason, target, or outcome from audit

An override request is a safety control, not a privileged execution channel.

## Project Policy

The policy is declared under `project.policies.humanOverride`.

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

The policy requires an `ActorSet`. Typed authority references must resolve
against the project actor inventory.

## Authorities

Each authority must resolve to either:

- an actor with `kind: human`; or
- an actor with `kind: authority` whose complete representation chain resolves
  only to human or human-represented authority actors.

An agent, automation, or service cannot become a human override authority.
Actor role, maintainer status, or matching ID does not imply authority.

Authority authentication and the binding between a declared actor and a
concrete runtime identity remain future runtime responsibilities.

## Operations

| Operation | Meaning |
| --- | --- |
| `pause_agent` | Prevent an agent from beginning further actions until approved resume. |
| `stop_agent` | Request that an agent stop current work and prevent further actions. |
| `pause_workflow` | Prevent further workflow progress until approved resume. |
| `stop_workflow` | Request workflow termination and prevent further progress. |
| `cancel_task` | Mark a task as no longer eligible to proceed. |
| `block_action` | Deny a specific pending or proposed action. |
| `revoke_approval` | Invalidate a previously valid approval for future evaluation. |
| `revoke_authorization` | Invalidate a runtime authorization or binding without editing the source manifest. |

The declaration lists operations a future implementation claims it can honor.
It does not prove that interruption, cancellation, or revocation is technically
available.

## Response Semantics

`blockNewActions` is always `true`. Once a valid override request is accepted
for evaluation, the target must not begin new actions while the outcome is
unresolved.

`inFlightActions` has two supported values:

- `request_stop`: request termination at the earliest safe implementation
  boundary
- `allow_safe_completion`: allow only the currently executing action to reach a
  declared safe completion boundary

Neither value promises hard real-time interruption. A runtime must explain what
its safe boundary means and must not claim stronger control than it implements.

`onFailure` is always `remain_blocked`. Authentication failure, unavailable
control infrastructure, ambiguous targets, unsupported operations, or missing
audit storage must not silently resume work.

## Resume

Resume is never automatic.

The policy requires:

- `mode: approval_required`
- a declared approval gate
- a recorded reason

The resume approval satisfies only the resume gate for the identified target.
It does not restore expired approvals, erase deny rules, grant missing access,
or authorize the action that was interrupted.

## Evaluation Order

A future implementation should evaluate an override request in this order:

1. Parse and validate the project policy.
2. Resolve the authority through `ActorSet`.
3. Authenticate the concrete requester as that declared authority.
4. Confirm the requested operation is declared.
5. Resolve the target without ambiguity.
6. Block new target actions.
7. Apply the in-flight action policy.
8. Record the outcome or failure.
9. Keep the target blocked until the resume gate and reason are valid.

Failure at any step leaves the target blocked when the implementation has
already accepted the request.

## Events And Audit

The policy references declared event types. The maintained example uses:

- `override.requested`
- `override.applied`
- `override.failed`
- `override.resumed`

Audit evidence must identify the authority, operation, target, reason, and
outcome. It should use stable references and redacted summaries rather than raw
credentials, prompts, context, memory, tokens, or sensitive payloads.

An `override.failed` event is not permission to continue. It records that the
requested control did not complete and that the fail-closed block remains.

## Relationship To Other Models

- [Actor Model](actor-model.md) defines who may be referenced as an authority.
- [Approval Gates](approval-gates.md) defines the gate required to resume.
- [Autonomy Model](autonomy-model.md) treats human override as a stricter
  constraint than any requested autonomy level.
- [Event Model](events.md) defines audit event declarations and envelopes.
- [Security Model](security-model.md) requires human authority and fail-closed
  handling.
- [Effective Agent Configuration](../rfcs/RFC-0014-effective-agent-configuration.md)
  treats human control as a narrowing constraint.

## Validation Boundaries

JSON Schema checks:

- at least one typed authority
- a non-empty closed operation set
- new-action blocking
- the in-flight action policy
- fail-closed failure behavior
- approval-gated resume with a reason
- mandatory audit fields and event syntax

The repository semantic smoke additionally checks:

- `ActorSet` is present
- authority references resolve
- each authority is human or fully human-represented
- the resume approval gate exists
- audit event references exist

Validation does not authenticate a human, interrupt a process, revoke a live
credential, persist an event, or enforce a runtime block.

## Compatibility And Versioning

The policy is optional and additive in `specVersion: "0.1"`. Projects that do
not declare it remain schema-valid, but omission must not be interpreted as a
claim that human override is supported.

Breaking changes include:

- making the policy required
- allowing non-human-controlled authorities
- allowing automatic resume
- weakening fail-closed response requirements
- changing operation meaning
- treating override as a grant

Those changes require an explicit version decision and migration guidance.

## Privacy And Secret Handling

Do not store authentication factors, session tokens, private keys, personal
contact details, or raw incident content in this policy. Audit records should
minimize personal data and apply project retention and redaction requirements.
