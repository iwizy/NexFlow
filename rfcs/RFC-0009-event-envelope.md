# RFC-0009: Event Envelope

## Status

Draft

## Summary

This RFC proposes the initial NexFlow event envelope model.

The proposal defines:

- the difference between event type declarations and emitted event instances
- common event metadata
- event identity, time, source, actor, and subject fields
- correlation and causation fields
- payload shape expectations
- audit metadata expectations
- redaction and sensitivity rules
- idempotency, ordering, and replay guidance
- extension fields for runtime-specific metadata
- validation and future runtime boundaries

The goal is to make audit events useful across tools without turning NexFlow into a logging platform or binding the specification to one runtime.

## Motivation

NexFlow describes teams made of humans, agents, and automation systems.

Meaningful work in such systems creates state transitions:

- a task is created
- an agent starts work
- context is read
- memory is written
- an approval is requested
- a handoff is accepted
- a workflow completes
- a runtime fails

These transitions need a common envelope so humans, validators, future runtimes, integrations, and audit tools can reason about them consistently.

Without a shared envelope:

- every runtime may name metadata differently
- event payloads may become hard to compare
- approval and memory audit trails may be incomplete
- correlation between tasks, workflows, approvals, and handoffs may be lost
- sensitive payloads may be logged without redaction rules
- provider-specific or runtime-specific fields may leak into the core model
- compatibility claims may be unclear

NexFlow needs a provider-neutral and runtime-neutral event envelope before future runtimes begin emitting events.

## Proposal

NexFlow should define a common event envelope for emitted event instances.

The envelope is a semantic model. It does not require this repository to implement event storage, event streaming, event sinks, or a runtime.

Current `events.yaml` files declare event types, payload expectations, retention, and audit requirements. They are not event logs.

Future runtimes may emit event instances that follow the envelope described here.

## Event Type Declarations vs Event Instances

NexFlow uses two related but different concepts.

| Concept | Purpose | Example location |
| --- | --- | --- |
| Event type declaration | Describes an event type, expected payload shape, retention, and audit requirements. | `events.yaml` |
| Event instance | Records that a specific state transition happened at a specific time. | Future runtime audit log, event sink, exported trace, or test fixture |

An `EventSet` manifest may declare:

- known event types
- payload expectations
- retention expectations
- whether audit is required
- optional envelope expectations

An event instance should include:

- common envelope metadata
- a payload specific to the event type
- audit metadata when required
- extension metadata only under namespaced fields

## Envelope Shape

A future emitted event instance should follow this shape:

```yaml
event:
  specVersion: "0.1"
  eventId: evt_01j0example000000000000000
  type: task.completed
  occurredAt: "2026-06-19T08:00:00Z"
  recordedAt: "2026-06-19T08:00:02Z"
  source:
    kind: runtime
    id: nexflow-reference-runtime
    version: "0.1.0-draft"
  actor:
    kind: agent
    id: docs-agent
  subject:
    kind: task
    id: write-manifest-reference
  correlationId: workflow-docs-refresh-001
  causationId: evt_01j0previous000000000000
  sequence: 42
  severity: info
  payload:
    outcome: completed
    artifacts:
      - docs/manifest-reference.md
  audit:
    required: true
    retention: Project policy.
    redactionApplied: false
    approvalRefs: []
```

This shape is illustrative. Exact serialization may vary by runtime, but the field names and semantics should remain stable where possible.

## Required Envelope Fields

Future runtimes SHOULD include the following fields for every event instance:

| Field | Purpose |
| --- | --- |
| `specVersion` | NexFlow spec version used to interpret the event. |
| `eventId` | Stable unique event identifier. |
| `type` | Dotted lowercase event type. |
| `occurredAt` | Time the state transition occurred. |
| `actor` | Human, agent, runtime, integration, or policy actor responsible for the transition. |
| `subject` | Main resource affected by the event. |
| `correlationId` | Identifier shared by related events in the same workflow, task, request, or trace. |
| `payload` | Event-specific data. |

The envelope should remain useful even when a future runtime cannot provide every optional field.

If a runtime cannot provide a required field, it should report the limitation in its conformance claim and avoid overstating audit completeness.

## Recommended Envelope Fields

Future runtimes SHOULD include these fields when safe and available:

| Field | Purpose |
| --- | --- |
| `recordedAt` | Time the event was recorded by the runtime or sink. |
| `source` | Runtime, extension, integration, CLI, or validator that emitted the event. |
| `causationId` | Event that directly caused this event. |
| `sequence` | Monotonic sequence within a source or correlation. |
| `severity` | Severity such as `debug`, `info`, `warning`, `error`, or `critical`. |
| `outcome` | Short normalized result such as `requested`, `approved`, `rejected`, `completed`, or `failed`. |
| `audit` | Audit metadata such as retention, redaction, approval references, and evidence references. |
| `links` | Related tasks, handoffs, approvals, artifacts, issues, pull requests, or external records. |
| `extensions` | Namespaced runtime, provider, or integration metadata. |

Optional fields should not be used to bypass explicit manifests, permissions, approval gates, context boundaries, or memory boundaries.

## Event Identity

`eventId` should be:

- unique within the event store, trace, or exported event set
- stable after the event is emitted
- safe to expose in audit references
- free of secrets or private data

NexFlow does not require a specific ID format.

Acceptable approaches include:

- UUID
- ULID
- runtime-scoped monotonic IDs
- content-addressed IDs when payload sensitivity allows it
- external event IDs from an approved event sink

IDs should not encode private user data, secrets, provider account IDs, or raw production resource identifiers unless project policy permits it.

## Time Fields

`occurredAt` records when the transition happened.

`recordedAt` records when the event was persisted, exported, or accepted by an event sink.

Both should use ISO 8601 timestamps with timezone or `Z`.

When `occurredAt` and `recordedAt` differ significantly, audit tooling should preserve both. Delayed recording can matter for incident review, approval expiry, memory retention, and workflow ordering.

## Actor Model

`actor` identifies who or what initiated the state transition.

[RFC-0013](RFC-0013-actor-model.md) proposes canonical human, agent, automation, service, and authority actor kinds. If accepted, this envelope should align with that model; the `runtime` and `integration` examples below remain provisional hosting and connection identities rather than accepted additional actor kinds.

Actor examples:

```yaml
actor:
  kind: human
  id: maintainer
```

```yaml
actor:
  kind: agent
  id: implementation-agent
  definitionRef: implementation_agent_2026_06
  definitionVersion: "2026.06.0"
```

```yaml
actor:
  kind: runtime
  id: nexflow-validator
```

```yaml
actor:
  kind: integration
  id: github
  extensionNamespace: org.nexflow.github
```

Actor metadata should prefer declared NexFlow IDs and version references over provider-native identities.

Provider-native or integration-native IDs may appear under `extensions` when needed.

## Subject Model

`subject` identifies the primary object changed or observed.

Subject examples:

```yaml
subject:
  kind: task
  id: implement-login-flow
```

```yaml
subject:
  kind: approval
  id: approve-production-deploy
```

```yaml
subject:
  kind: memory
  scope: project
  id: project-decision-auth-boundary
```

```yaml
subject:
  kind: workflow
  id: feature-delivery
```

The subject should be narrow. Related objects should be placed in `links`.

## Correlation And Causation

`correlationId` groups events that belong to the same broader activity.

Examples:

- one workflow execution
- one task lifecycle
- one pull request review
- one approval request
- one incident response
- one validation run

`causationId` points to the event that directly caused the current event.

Example:

```yaml
event:
  eventId: evt_review_completed
  type: review.completed
  correlationId: pr-42-review
  causationId: evt_review_requested
```

Correlation is a grouping mechanism. Causation is a directed edge.

Runtimes should not invent precise causation when it is unknown. They may include only `correlationId`.

## Payload Shape

`payload` contains event-specific data.

Payloads SHOULD:

- be structured objects
- avoid raw secrets
- avoid large opaque blobs
- prefer IDs and references over copied content
- preserve enough information for audit review
- preserve compatibility when fields are added
- document required fields in `events.yaml`

Payloads SHOULD NOT:

- include raw credentials
- include private keys or tokens
- include complete prompt text when policy forbids it
- include raw sensitive context when a reference is enough
- include provider-specific fields at the top level
- rely on field ordering for meaning

Payload examples:

```yaml
type: approval.requested
payload:
  approvalGate: dependency_installation
  requestedAction: install_dependency
  riskLevel: high
  evidenceRefs:
    - task: update-test-runner
```

```yaml
type: memory.deleted
payload:
  scope: project
  memoryRef: project-decision-auth-boundary
  reason: retention_expired
  deletionMode: logical
```

```yaml
type: workflow.completed
payload:
  workflowId: release-readiness
  outcome: completed
  artifacts:
    - release-notes.md
```

## Audit Metadata

The optional `audit` block records review and retention metadata for the event itself.

Example:

```yaml
audit:
  required: true
  retention: Project policy.
  classification: internal
  redactionApplied: true
  redactionReason: Removed raw context excerpt.
  approvalRefs:
    - approve-network-access
  evidenceRefs:
    - pr-42
  policyRefs:
    - project.security.default
```

Audit metadata may include:

- whether audit retention is required
- retention policy or policy reference
- classification
- redaction status
- redaction reason
- approval references
- evidence references
- policy references
- runtime conformance claims
- export or sink references

Audit metadata should describe the event record. It should not grant access or approve the action by itself.

## Version And Component References

Events involving model-backed or agent-backed behavior should record version references when safe and available.

Recommended references include:

- manifest `specVersion`
- runtime version
- extension namespace and version
- agent definition reference and version
- model profile reference
- prompt set reference and prompt revisions
- retrieval profile reference and corpus or index versions
- approval gate reference
- memory scope and retention policy

Events should prefer references, versions, and digests over embedding raw model prompts, retrieved context, or memory content.

## Sensitivity And Redaction

Events are audit artifacts. They can become sensitive even when the original action was low risk.

Future runtimes should classify events conservatively.

Events MUST NOT contain:

- raw secrets
- access tokens
- private keys
- passwords
- credential material
- sensitive personal data unless explicitly allowed by policy
- sensitive medical, financial, or legal data unless explicitly allowed by policy

Events SHOULD avoid:

- raw prompt text in public logs
- raw context excerpts when references are enough
- raw memory content when a memory reference is enough
- provider-native trace dumps unless approved and redacted
- excessive environment details

When redaction is applied, the event should record that redaction happened and why.

## Approval Events

Approval-related events should use the common envelope.

Relevant event types may include:

- `approval.requested`
- `approval.granted`
- `approval.rejected`
- `approval.expired`
- `approval.revoked`

This RFC does not require those event types to be accepted in `0.1`. It defines how future approval events should be wrapped if they are emitted.

See [RFC-0007](RFC-0007-approval-gates.md) for approval gate semantics.

## Memory Events

Memory-related events should use the common envelope.

Relevant event types include:

- `memory.written`
- `memory.corrected`
- `memory.deleted`
- `memory.promoted`

Memory payloads should prefer memory references, scopes, update modes, approval references, and retention reasons over raw memory content.

See [RFC-0008](RFC-0008-memory-retention.md) for memory retention semantics.

## Provider And Runtime Events

Provider and runtime details should remain provider-neutral in the core envelope.

Core fields may record:

- model profile reference
- selection mode
- provider abstraction reference
- resolved provider and model when safe and available
- fallback use
- selection reason

Provider-native details should live under `extensions`.

Example:

```yaml
extensions:
  org.nexflow.provider.example:
    providerTraceRef: trace-123
    redacted: true
```

The core specification should not require any provider-native event format.

## Ordering, Replay, And Idempotency

Events may arrive out of order.

Future runtimes and event sinks should not assume that wall-clock order, sequence order, and causation order are always identical.

To support replay and audit:

- `eventId` should be stable
- duplicate events with the same `eventId` should be treated as duplicates, not new transitions
- `sequence` may be scoped to the emitter or correlation
- `occurredAt` and `recordedAt` should both be preserved when available
- causation should be explicit when known
- event consumers should tolerate unknown optional fields

This RFC does not define an event sourcing system.

## Extension Fields

Runtime-specific, provider-specific, integration-specific, or organization-specific metadata should use namespaced extension fields.

Recommended pattern:

```yaml
extensions:
  org.example.runtime:
    queue: audit-events
    sink: internal-log
```

Extensions MUST NOT redefine the meaning of core fields.

Extensions MUST NOT grant permissions, approval, context access, memory access, or autonomy by appearing in an event.

See [RFC-0006](RFC-0006-extension-namespaces.md) for extension namespace expectations.

## EventSet Manifest Guidance

`events.yaml` should remain a declaration manifest.

It may describe:

- the event types a project expects
- payload fields expected for each event type
- whether audit is required
- retention expectations
- optional envelope expectations

Example:

```yaml
specVersion: "0.1"
kind: EventSet
metadata:
  project: minimal-team
envelope:
  required:
    - specVersion
    - eventId
    - type
    - occurredAt
    - actor
    - subject
    - correlationId
    - payload
  auditRecommended:
    - recordedAt
    - source
    - causationId
    - audit
  redactionPolicy: Follow project security policy.
events:
  - type: task.completed
    description: A task is completed.
    retention: Project policy.
    auditRequired: true
    payload:
      required:
        - taskId
        - artifacts
```

`EventSet` manifests should not store historical event instances.

## Validation Expectations

JSON Schema can validate useful structure:

- `events.yaml` has `specVersion`
- `kind` is `EventSet`
- event types follow dotted lowercase syntax
- payload declarations are objects
- optional envelope declarations are structurally valid

Semantic validators may later check:

- emitted event types are declared
- required payload fields are present
- correlation IDs are present for auditable workflows
- approval events reference known approval gates
- memory events reference declared memory scopes
- extension fields use known namespaces
- event retention aligns with project policy

Validators should not call providers, inspect event sinks, or replay events unless that behavior is explicitly specified and approved.

## Future Runtime Boundaries

A future runtime may:

- emit event instances
- export event traces
- validate emitted events against declarations
- preserve audit retention metadata
- redact sensitive fields
- correlate workflow, task, approval, handoff, memory, and agent events

A future runtime must not:

- treat an event declaration as permission to perform an action
- store secrets in events
- bypass approval gates because an audit event will be emitted
- silently expand context or memory because an event sink supports it
- require a provider-specific event model for core conformance

## Compatibility Impact

This RFC is primarily semantic and additive.

It proposes optional envelope guidance for `EventSet` manifests and future emitted events.

Adding optional envelope declarations is compatible with existing manifests.

Potentially breaking changes may include:

- renaming core envelope fields
- changing required envelope field semantics
- changing event identity semantics
- changing actor or subject semantics
- changing correlation or causation semantics
- making optional envelope fields required without migration guidance
- changing payload compatibility expectations
- weakening redaction or audit requirements

Tools should identify whether changes affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, or `NF-RUNTIME`.

## Security And Safety Impact

This RFC improves safety by making audit expectations explicit.

Security-sensitive points:

- events can leak secrets if payloads are too broad
- raw prompts, raw context, and raw memory content may be sensitive
- provider-native traces may contain private data
- audit logs may become regulated records
- correlation IDs can reveal workflow or incident structure
- event sinks must not become implicit context sources or memory stores

Future runtimes should use least privilege for event sinks and should redact or reference sensitive data instead of copying it.

## Alternatives Considered

### Runtime-Specific Event Formats

NexFlow could let every runtime define its own event envelope.

This is flexible but weakens auditability, portability, validation, and cross-tool review.

### Event Sourcing As Core

NexFlow could define events as the source of truth for all project state.

This is out of scope. NexFlow is currently a specification for describing teams and workflows, not an event-sourced runtime.

### Provider-Native Trace Adoption

NexFlow could adopt one provider's trace format or telemetry model.

This would violate provider neutrality and make the core specification depend on vendor behavior.

### Fully Formal Event Schema Now

NexFlow could define strict schemas for every event type and payload.

This is premature. The current draft should define common envelope semantics and allow event types to mature through examples, RFCs, and future semantic validation.

## Open Questions

- Should `eventId` have a recommended format such as ULID?
- Should approval events become required core event types in `0.1`?
- Should event severity use a fixed enum or remain project-defined?
- Should event retention be inherited from `events.yaml`, project policy, or event sink policy when they differ?
- Should future CLIs support validating exported event traces?
- Should event envelopes support cryptographic signatures or hashes?
- Should event redaction require machine-readable reason codes?
- How should event ordering be represented across distributed runtimes?
