# Security Model

NexFlow treats safety as part of the specification, not an implementation afterthought.

## Principles

### Least Privilege

Actors receive only the capabilities, permissions, context, and memory access needed for their responsibilities.

### Explicit Permissions

Capabilities do not authorize action. Permissions decide whether a capability is allowed, denied, or gated.

### Approval Gates

Sensitive actions should require explicit approval.

### Auditability

Important state changes should emit events and preserve enough context for later review.

### Credential Handling

Credentials must never be implied by context access. Future runtimes must isolate secrets and avoid exposing them to agents unless explicitly authorized.

### Secret Management

Secret references should be indirect. Manifests should not contain raw secrets.

### Destructive Operations

Destructive operations require human approval and audit events.

### Network Access

Network access should be declared and scoped by policy, source, or domain where possible.

### Human Override

Humans must be able to stop or override future runtime activity.

## Unsafe Defaults to Avoid

- global repository write access
- implicit command execution
- provider access to all context
- unbounded memory writes
- silent network access
- automatic deployment
- destructive actions without approval

## Future Runtime Security Requirements

A conforming runtime should:

- enforce capability and permission checks
- enforce approval gates
- isolate credentials
- log approval decisions
- log sensitive events
- reject unsupported manifest versions
- clearly report unsupported extension behavior
