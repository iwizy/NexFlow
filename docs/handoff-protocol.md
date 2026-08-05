# Handoff Protocol

Handoffs transfer responsibility between actors.

## Supported Forms

NexFlow supports:

- one-to-one handoffs
- one-to-many handoffs
- many-to-many handoffs

## Handoff Fields

```yaml
id: implementation-to-review
from:
  - implementation-agent
to:
  - reviewer
reason: Implementation is ready for review.
status: pending
artifacts:
  - pull-request-42
notes:
  - Tests pass locally.
blockingIssues: []
acceptanceCriteria:
  - Reviewer confirms permissions remain explicit.
nextAction: Review pull request and either approve or request changes.
```

## Status Values

- `pending`
- `accepted`
- `rejected`
- `blocked`
- `cancelled`
- `completed`

## Required Semantics

A handoff SHOULD explain:

- why responsibility is moving
- what artifacts are involved
- what remains blocked
- what acceptance criteria apply
- what the next action is

Artifact IDs resolve in the assembly-wide task artifact namespace. See
[Work Reference Namespaces](work-reference-namespaces.md) for duplicate,
resolution, and compatibility rules.

An A2A Message, remote Task transition, or returned Artifact does not create,
accept, reject, or complete a NexFlow Handoff automatically. A future adapter
may transport handoff content through A2A, but the authored local Handoff
remains authoritative and external artifacts require explicit provenance-
preserving import. See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Handoff Events

Handoffs should emit:

- `handoff.created`
- `handoff.accepted`
- `handoff.rejected`

Future runtimes may also emit `handoff.blocked` and `handoff.completed`.
