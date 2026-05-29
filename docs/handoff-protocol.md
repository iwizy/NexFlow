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

## Handoff Events

Handoffs should emit:

- `handoff.created`
- `handoff.accepted`
- `handoff.rejected`

Future runtimes may also emit `handoff.blocked` and `handoff.completed`.
