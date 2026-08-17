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

[RFC-0009](../rfcs/RFC-0009-event-envelope.md) proposes draft event envelope semantics for event identity, actor, subject, correlation, causation, payload, audit metadata, redaction, ordering, and future runtime boundaries.

[Event Interoperability](event-interoperability.md) defines how those fields may
be projected to CloudEvents and OpenTelemetry while keeping external records
non-authoritative and transport, collectors, and storage out of scope.

[Event And Audit Storage Boundary](event-audit-storage-boundary.md) requires
classification, minimization, and redaction before persistence or export;
separates audit records from telemetry and evidence; and makes ordering,
retention, deletion, access, integrity, durability, and failure claims explicit.
Audit persistence never grants authority for the recorded action.

### Credential Handling

Credentials must never be implied by context access. Future runtimes must isolate secrets and avoid exposing them to agents unless explicitly authorized.

### Secret Management

Secret references should be indirect. Manifests should not contain raw secrets.

### Destructive Operations

Destructive operations require human approval and audit events.

### Network Access

Outbound network access must be fail-closed, declared, and scoped by actor,
purpose, destination, transport, data classification, permission, and approval.

The structured [Network Access Policy](network-access-policy.md) uses an explicit
deny default and deterministic rules. Context sources, provider declarations,
extensions, capabilities, permissions, and approvals remain independent policy
layers; none grants connectivity by reference or presence alone.

Legacy free-text `networkAccess` values remain advisory during the `0.1` draft
migration. A future runtime must not parse them into allow rules.

### Provider Selection

Provider preferences and provider declarations do not grant access. Future runtimes should apply project policy, permissions, approval gates, context boundaries, memory boundaries, model profile constraints, and fallback rules before calling a provider.

[RFC-0010](../rfcs/RFC-0010-provider-selection.md) proposes draft provider selection semantics for preferences, constraints, fallback, explainability, audit, and future runtime boundaries.

Selection does not authorize invocation. The future
[Provider Adapter Boundary](provider-adapter-boundary.md) keeps provider-specific
translation subordinate to host policy, requires mediated credential and
network handles, forbids adapter-local fallback and direct tool execution, and
requires normalized redacted audit evidence.

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

The unique unscoped active agent definition is authoritative for requested
model, prompt, retrieval, permission, capability, context, memory, autonomy, and
extension references. A future runtime must not treat those requests as grants.
Permission, context, memory, provider, project, task, workflow, human-control,
and runtime policy can only narrow the request.

Safety-significant definition changes, such as broader context access, broader
memory scopes, higher autonomy, new high-risk capabilities, or less restrictive
approval gates, require a complete approved active definition. Missing or
ambiguous active selection must fail closed.

### Extension Loading Boundaries

Extension declarations and maintained profiles are data, not trusted executable
code. Future runtimes must separate project declaration discovery from
implementation discovery, resolve implementations only from explicit
runtime-owned sources, verify immutable artifact identity, reject ambiguity,
and isolate loaded code from ambient filesystem, network, process, credential,
context, memory, and provider access.

Installation, enablement, loading, and activation do not grant authority. Every
extension operation must still satisfy capability, permission, approval,
autonomy, context, memory, network, credential, and human-override policy.
Unsupported behavior must remain inert and fail closed. See
[Extension Loading Boundary](extension-loading-boundary.md).

### Human Override

Humans must be able to stop or override future runtime activity through an
explicit, fail-closed policy.

The structured [Human Override](human-override.md) model declares
human-controlled authorities, supported pause, stop, cancel, block, and
revocation operations, in-flight response, approval-gated resume, and audit
events. Override can only narrow behavior. It cannot grant access, approve an
action, erase a deny, or raise autonomy.

[RFC-0017](../rfcs/RFC-0017-human-override.md) records the broader proposal and
remaining runtime questions.

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
- automatic resume after a human override or failed interruption
- allowing agents, automations, or services to act as human override authorities
- silent network access
- treating context, provider, extension, DNS, redirect, or proxy metadata as an implicit network grant
- discovering executable extensions through ambient paths or installing them because a namespace is declared
- treating an extension signature, installation, enablement, or activation as an action grant
- following redirects or resolved private addresses without re-evaluating policy
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

The initial [MCP Extension Draft](../extensions/mcp/README.md) additionally
requires an allow-list and approval posture for action-bearing surfaces. A
networked MCP transport must satisfy network policy separately, and credentials
must remain outside manifests.

### Remote Agent Metadata Without Local Authority

An A2A Agent Card may advertise agents, skills, authentication requirements,
and protocol capabilities, but none of that metadata grants local authority.
The [A2A Extension Draft](../extensions/a2a/README.md) requires explicit local
identity binding, `access_a2a`, action-specific capabilities, permissions,
approvals, network policy, external credentials, provenance, and audit.

Remote tasks cannot transition local work automatically. Remote artifacts must
not enter the NexFlow artifact namespace without explicit classification,
integrity checks, provenance-preserving import, and collision handling. A2A
push callbacks remain unsupported until an inbound network policy is defined.

See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

### Pull Request Creation With Review

An implementation agent may draft changes but require approval before `create_pull_request`. The review gate should be visible in permissions, tasks, or workflow steps.

### Deployment Requires Human Authority

`deploy_application` should be denied or gated for agents by default. Approval should come from a declared human authority or release policy.

## Future Runtime Security Requirements

A conforming runtime should:

- enforce capability and permission checks
- enforce approval gates
- honor declared human override blocking and fail-closed resume requirements
- isolate credentials
- log approval decisions
- log sensitive events
- reject unsupported manifest versions
- clearly report unsupported extension behavior
- resolve extension implementations from explicit sources, verify immutable artifacts, isolate loaded code, and authorize every operation independently
- keep provider selection host-owned, constrain adapters to one authorized target, and route fallback through a fresh policy decision
- classify, minimize, redact, and validate audit records before persistence or export, and fail closed when required pre-effect audit cannot be recorded
- distinguish designated audit storage from queues, indexes, telemetry, archives, and evidence stores, with explicit ordering, retention, deletion, access, integrity, and gap behavior
- deny outbound requests that lack a matching structured network policy rule
- re-evaluate DNS results and redirects against private-network, loopback, scheme, port, and destination constraints
- redact credentials, headers, query data, and payloads from network audit records
