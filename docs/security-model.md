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

Approval gates are described in [Approval Gates](approval-gates.md). They should be scoped, auditable, and human-owned for high-risk actions.

[RFC-0007](../rfcs/RFC-0007-approval-gates.md) proposes draft approval semantics for declarations, requests, decisions, evidence, scope, expiry, revocation, and future runtime enforcement boundaries.

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

### Context Boundaries

Context sources should be classified conservatively and should not be expanded through provider defaults, extensions, cached data, or MCP tools. Web context should define freshness and domain boundaries where possible.

### Memory Boundaries

Memory writes are higher risk than context reads because they can persist and reuse information after the task ends. Durable or sensitive memory should declare ownership, visibility, allowed consumers, allowed writers, prohibited content, promotion paths, audit events, and approval gates where needed.

[RFC-0008](../rfcs/RFC-0008-memory-retention.md) proposes draft memory retention semantics for scopes, ownership, visibility, consumers, writers, sensitivity, promotion, correction, deletion, expiry, audit, and future runtime boundaries.

### Prompt Boundaries

Prompt sets can contain sensitive operational guidance even when they do not contain credentials. Public manifests should prefer prompt source references, revisions, digests, ownership, and review metadata over raw prompt text when disclosure would expose internal controls, private workflows, or sensitive escalation rules.

Raw prompt text must not contain secrets, tokens, passwords, private keys, raw personal data, or sensitive regulated details.

### Retrieval Boundaries

Retrieval profiles can combine context from multiple sources. Future runtimes should treat assembled context as at least the strictest classification among retrieved sources unless project policy explicitly defines a stricter rule.

Retrieval profiles should not broaden context access. They should reference declared context sources, respect freshness and citation requirements, avoid silent cross-scope reuse, and preserve approval gates for restricted or tool-backed sources.

### Agent Definition Boundaries

Agent definitions assemble model, prompt, retrieval, permission, capability, context, memory, autonomy, and extension references. A future runtime must not treat an agent definition reference as granting access by itself.

Safety-significant definition changes, such as broader context access, broader memory scopes, higher autonomy, new high-risk capabilities, or less restrictive approval gates, should require review before activation.

### Human Override

Humans must be able to stop or override future runtime activity.

## Unsafe Defaults to Avoid

- global repository write access
- treating capabilities as permissions
- implicit command execution
- implicit access through integrations or extensions
- provider access to all context
- unbounded memory writes
- automatic cross-scope memory promotion
- retaining secrets or credential values in memory
- storing sensitive raw prompt text in public manifests
- retrieving undeclared sources or silently broadening retrieval scope
- using stale context without citation or warning when freshness matters
- activating broader agent definitions without review
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
