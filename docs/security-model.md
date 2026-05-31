# Security Model

NexFlow treats safety as part of the specification, not an implementation afterthought.

## Principles

### Least Privilege

Actors receive only the capabilities, permissions, context, and memory access needed for their responsibilities.

### Explicit Permissions

Capabilities do not authorize action. Permissions decide whether a capability is allowed, denied, or gated.

Future runtimes should evaluate permission rules before using any capability. A declared capability without a matching permission should be treated as unavailable for that actor.

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
- treating capabilities as permissions
- implicit command execution
- implicit access through integrations or extensions
- provider access to all context
- unbounded memory writes
- silent network access
- automatic deployment
- destructive actions without approval

## Permission Evaluation Expectations

Future runtimes should use conservative permission evaluation.

Recommended behavior:

1. Confirm the actor has the requested capability declared.
2. Find permission rules that apply to the actor, role, workflow, or project scope.
3. Treat explicit `deny` as strongest.
4. Treat `approval_required` as blocked until the approval gate is satisfied.
5. Treat `allow` as valid only inside the declared scope and conditions.
6. Reject the action if no applicable permission exists.
7. Emit audit events for high-risk or approval-gated actions.

This order prevents broad allow rules from accidentally bypassing narrower deny or approval-gated rules.

## Example Safety Cases

### Read Access Without Write Access

An agent may have `read_repository` allowed while `write_repository` is absent or denied. A runtime should let the actor inspect files but reject file writes.

### Tool Access Without Command Execution

An MCP integration may expose tools, but `access_mcp` does not automatically imply `execute_command`. These capabilities should be granted or gated separately.

### Pull Request Creation With Review

An implementation agent may draft changes but require approval before `create_pull_request`. The review gate should be visible in permissions, tasks, or workflow steps.

### Deployment Requires Human Authority

`deploy_application` should be denied or gated for agents by default. Approval should come from a declared human authority or release policy.

## Future Runtime Security Requirements

A conforming runtime should:

- enforce capability and permission checks
- enforce approval gates
- isolate credentials
- log approval decisions
- log sensitive events
- reject unsupported manifest versions
- clearly report unsupported extension behavior
