# Event Model

Events describe auditable state transitions.

## Event Naming

Event names use dotted lowercase names:

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
- `workflow.started`
- `workflow.completed`
- `memory.written`
- `memory.corrected`
- `memory.deleted`
- `memory.promoted`

## Common Payload Fields

```yaml
event:
  type: task.completed
  occurredAt: "2026-05-29T10:00:00Z"
  actor: docs-architect
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

- `type`
- `occurredAt`
- `actor`
- `subject`
- `correlationId`
- `payload`

Future runtimes SHOULD also record:

- manifest version
- runtime version
- agent definition reference
- model profile reference
- resolved provider and model, when safe and available
- model selection reason
- whether model fallback was used
- approval references
- context sources used
- memory scopes read or written

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

## Audit Requirements

Events related to approvals, destructive actions, production actions, credential access, and memory updates SHOULD be retained according to project policy.

See [Approval Gates](approval-gates.md) for how approval decisions relate to review events and future approval-specific events.
