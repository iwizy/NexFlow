# Event Model

Events describe auditable state transitions.

Related RFC: [RFC-0009: Event Envelope](../rfcs/RFC-0009-event-envelope.md).
See [Event Interoperability](event-interoperability.md) for the draft
CloudEvents and OpenTelemetry mappings.
See [Event And Audit Storage Boundary](event-audit-storage-boundary.md) for
future persistence, redaction, ordering, retention, access, integrity, and
failure responsibilities.

`events.yaml` declares event types, payload expectations, retention, and audit requirements. It is not an event log. Future runtimes may emit event instances that follow the common envelope model.

## Event Naming

Event types use dotted lowercase values:

- `task.created`
- `task.updated`
- `task.completed`
- `task.blocked`
- `task.unblocked`
- `handoff.created`
- `handoff.accepted`
- `handoff.rejected`
- `review.requested`
- `review.completed`
- `agent.started`
- `agent.stopped`
- `agent.failed`
- `agent.definition.selected`
- `agent.definition.failed`
- `workflow.started`
- `workflow.completed`
- `memory.written`
- `memory.corrected`
- `memory.deleted`
- `memory.promoted`
- `network.decision`
- `credential.decision`
- `override.requested`
- `override.applied`
- `override.failed`
- `override.resumed`

Event types are not entity IDs. They use their own dotted namespace and MUST be referenced exactly from fields such as `emits`, `auditEvents`, audit `events` lists, and event-driven `triggers`. A non-event trigger such as `manual` is not an event type.

Within a project manifest set, every event type reference MUST resolve to exactly one `events[].type` declaration in that project's `events.yaml`. Event declarations MAY remain unused when they describe supported transitions that the current workflow does not emit. Duplicate declarations and references to undeclared event types are semantic validation errors.

## Common Event Envelope

```yaml
event:
  specVersion: "0.1"
  eventId: evt_task_completed_001
  type: task.completed
  occurredAt: "2026-05-29T10:00:00Z"
  recordedAt: "2026-05-29T10:00:02Z"
  source:
    kind: runtime
    id: reference-runtime
  actor:
    kind: agent
    id: docs-architect
  subject:
    kind: task
    id: write-manifest-reference
  correlationId: workflow-docs-refresh-001
  payload:
    outcome: completed
    artifacts:
      - docs/manifest-reference.md
```

## Required Event Metadata

Events SHOULD include:

- `specVersion`
- `eventId`
- `type`
- `occurredAt`
- `actor`
- `subject`
- `correlationId`
- `payload`

Future runtimes SHOULD also record:

- `recordedAt`
- source runtime, CLI, integration, or validator
- causation ID when known
- sequence when useful
- severity or outcome when useful
- manifest version
- runtime version
- agent definition reference
- agent definition version
- model profile reference
- prompt set reference
- prompt revisions or content digests, when safe and available
- retrieval profile reference
- retrieval source IDs, index versions, freshness decisions, and citation metadata when safe and available
- resolved provider and model, when safe and available
- model selection reason
- provider selection constraints applied
- provider policy decision reference, when safe and available
- whether model fallback was used
- approval references
- context sources used
- memory scopes read or written
- redaction status and retention policy for audit-sensitive events

See [RFC-0009](../rfcs/RFC-0009-event-envelope.md) for event identity, correlation, causation, payload, audit, redaction, ordering, and extension guidance.

## Event And Audit Storage

An event instance and a durably retained audit record are related but distinct.
The runtime constructs and authorizes event meaning; a storage component may
preserve an already classified, minimized, redacted, and validated record. The
store does not grant permission, approve an action, transition project state,
or turn a received external record into local authority.

`occurredAt`, `recordedAt`, source-scoped sequence, causation, sink acceptance
time, and transport offset represent different ordering facts. A future runtime
must preserve those differences, stable event identity, duplicates, gaps,
partial writes, and storage uncertainty. See
[Event And Audit Storage Boundary](event-audit-storage-boundary.md).

## External Protocol State

An MCP task transition or A2A Task status update is external protocol state. It
does not emit a NexFlow event instance or transition a local TaskSet task,
Workflow, Handoff, Actor, or artifact automatically.

A future adapter must preserve the external protocol, integration, task or
artifact identifier, source ordering, correlation, and provenance, then apply
an accepted event mapping before recording local state. External messages and
logs are supporting evidence, not proof that a NexFlow transition occurred.

See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Interoperability Summary

NexFlow-defined event types use `dev.nexflow.<type>` when projected into
CloudEvents `type` or OpenTelemetry `EventName`. For example,
`task.completed` becomes `dev.nexflow.task.completed`.

| NexFlow concept | CloudEvents | OpenTelemetry EventRecord |
| --- | --- | --- |
| `eventId` | `id` | `dev.nexflow.event.id` attribute |
| `type` | Reverse-DNS `type` | `EventName` |
| `occurredAt` | `time` | `Timestamp` |
| `recordedAt` | `nexflowrecordedat` extension | Preserved attribute; not automatically `ObservedTimestamp` |
| `correlationId` | `nexflowcorrelationid` extension | `dev.nexflow.event.correlation_id` attribute |
| `causationId` | `nexflowcausationid` extension | `dev.nexflow.event.causation_id` attribute |
| Structured source, Actor, subject, payload, and audit data | `data.nexflow` | Complex `dev.nexflow.event.data` attribute or protected data reference |

`correlationId` is not a trace ID, `causationId` is not a span ID, and an
incoming CloudEvent or telemetry record is not automatic authority for a local
state transition. The complete mappings, severity normalization, import rules,
conformance expectations, and transport boundary are defined in
[Event Interoperability](event-interoperability.md).

## Event Payload Examples

### `task.blocked`

```yaml
type: task.blocked
payload:
  reason: Waiting for security approval.
  blockingIssues:
    - approve-network-access
```

### `handoff.created`

```yaml
type: handoff.created
payload:
  from:
    - implementation-agent
  to:
    - reviewer
  reason: Implementation complete and ready for review.
  artifacts:
    - pull-request-42
```

### `review.completed`

```yaml
type: review.completed
payload:
  result: changes_requested
  findings:
    - Missing approval gate for deployment.
```

### `memory.promoted`

```yaml
type: memory.promoted
payload:
  fromScope: task
  toScope: project
  approvalGate: code_review
  retainedBecause: Reusable implementation decision accepted by reviewer.
```

See [RFC-0008](../rfcs/RFC-0008-memory-retention.md) for memory write, correction, deletion, promotion, retention, and audit expectations.

### `network.decision`

```yaml
type: network.decision
payload:
  actor: implementation-agent
  purpose: context_read
  decision: approval_required
  ruleIds:
    - approved_project_services
  logicalDestination:
    contextSource: repository
  redactionApplied: true
```

Network decision events should identify the result and rules applied without
storing authorization headers, cookies, tokens, secret query values, request
bodies, or response bodies. Destination details remain subject to project audit
and classification policy. See
[Network Access Policy](network-access-policy.md).

### `credential.decision`

```yaml
type: credential.decision
payload:
  actor: implementation-agent
  credentialRef: coding-provider-access
  purpose: provider_request
  target:
    provider: coding_reasoning
  decision: approval_required
  ruleIds:
    - coding-provider-credential
  redactionApplied: true
```

Credential decision events record policy outcomes, not credential material.
They should omit raw or derived values, broker paths, authorization headers,
account identifiers, request payloads, and authentication responses. See
[Credential Handling](credential-handling.md).

### Human override events

```yaml
type: override.applied
payload:
  authority:
    kind: actor
    id: human-maintainer
  operation: stop_agent
  target:
    kind: actor
    id: docs-agent
  outcome: blocked
  reason: Human-reviewed safety intervention.
```

`override.requested`, `override.applied`, `override.failed`, and
`override.resumed` should identify authority, operation, target, reason, and
outcome as applicable. A failed override leaves the target blocked; it is not a
continue decision.

Record references and redacted summaries rather than credentials, tokens, raw
prompts, raw context, raw memory, or sensitive incident details. See
[Human Override](human-override.md).

### Model profile audit fields

Future events that involve model-backed agent behavior may include model profile metadata:

```yaml
type: agent.started
payload:
  agent:
    id: docs-agent
    definitionRef: docs-agent-2026-06
  model:
    profileRef: docs-agent-balanced
    selectionMode: policy
    providerRef: general_reasoning
    resolvedModel: approved-general-reasoning
    fallbackUsed: false
```

Resolved provider and model details should be recorded only when safe and available. Provider-specific fields should remain extension-scoped or runtime-scoped.

### Agent definition audit fields

Future events that involve an agent may include agent definition metadata:

```yaml
type: agent.started
payload:
  agent:
    id: implementation-agent
    definitionRef: implementation_agent_2026_06
    definitionVersion: "2026.06.0"
    modelProfileRef: implementation_agent_coding
    promptSetRef: implementation_review_prompts
    retrievalProfileRef: implementation_review_retrieval
```

Events should prefer definition references, versions, component references, review state, and change summaries over embedding full component content.

### Agent definition selection

```yaml
type: agent.definition.selected
payload:
  agentId: docs-agent
  agentDefinitionRef: docs_agent_2026_06
  definitionVersion: "2026.06.0"
  selectionReason: unique_active_definition
```

```yaml
type: agent.definition.failed
payload:
  agentId: docs-agent
  reason: multiple_active_definitions
  candidateDefinitionRefs:
    - docs_agent_2026_06
    - docs_agent_2026_07
```

Selection events should identify references and reasons without embedding raw
prompt material, context, memory, credentials, or approval evidence. Declaring
these types does not mean this repository emits them.

### Prompt set audit fields

Future events that involve model-backed agent behavior may include prompt set metadata:

```yaml
type: agent.started
payload:
  agent:
    id: docs-agent
    definitionRef: docs-agent-2026-06
  promptSet:
    ref: docs_agent_prompts
    version: "2026.06.0"
    promptRevisions:
      docs_agent_system: "1"
      docs_agent_review: "1"
    safetyReviewStatus: approved
    contentDigestsRecorded: true
```

Events should prefer prompt set references, revisions, and digests over raw prompt content. Prompt content should be recorded only when project policy allows it.

### Retrieval profile audit fields

Future events that involve context retrieval may include retrieval profile metadata:

```yaml
type: agent.started
payload:
  agent:
    id: implementation-agent
    definitionRef: implementation-agent-2026-06
  retrieval:
    profileRef: implementation_review_retrieval
    version: "2026.06.0"
    contextSources:
      - repository
      - issue_tracker
      - docs
    corpusRef: software-team-review-corpus
    corpusVersion: "2026-06-10"
    staleAllowed: false
    citationsRequired: true
```

Events should prefer retrieval profile references, context source IDs, corpus versions, freshness decisions, and citation metadata over raw retrieved content.

## Audit Requirements

Events related to approvals, human override, destructive actions, production
actions, credential access, and memory updates SHOULD be retained according to
project policy.

Retention guidance in `events.yaml` does not configure a store or prove that a
record was durably written, redacted, protected, expired, or deleted. Future
runtimes must identify the designated audit store, enforce classification and
redaction before persistence or export, and report storage failures without
silently continuing through a weaker sink.

See [Approval Gates](approval-gates.md) for how approval decisions relate to review events and future approval-specific events.

See [RFC-0007](../rfcs/RFC-0007-approval-gates.md) for the draft approval gate event and audit model.
