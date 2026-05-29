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

## Audit Requirements

Events related to approvals, destructive actions, production actions, credential access, and memory updates SHOULD be retained according to project policy.
