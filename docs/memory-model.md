# Memory Model

Memory describes retained information and reuse boundaries. It answers a different question than context:

- **Context** is information an actor may read from declared sources.
- **Memory** is information a system may retain and reuse after it has been observed, summarized, corrected, or produced.

Memory is therefore higher risk than ordinary context access. A runtime that can remember can accidentally preserve sensitive facts, reuse stale assumptions, or move information into a broader audience than originally intended.

Related RFC: [RFC-0008: Memory Retention](../rfcs/RFC-0008-memory-retention.md).

## Goals

- Make retention and reuse explicit.
- Keep ownership visible.
- Prevent accidental cross-scope leakage.
- Require stronger review for durable and sensitive memory writes.
- Give future runtimes enough policy to reject unsafe writes.
- Give auditors enough information to understand what was retained, why, and for whom.

## Memory Declaration

A memory scope declaration should describe retention, ownership, visibility, update rules, sensitivity, and allowed consumers.

```yaml
scope: project
retention: Maintainer policy.
ownership: Maintainers.
visibility: Maintainers and approved agents.
updateRules: Review required for durable updates.
sensitivity: internal
allowedConsumers:
  - reviewer
updateMode: approval_required
allowedWriters:
  - reviewer
allowedSourceScopes:
  - task
prohibitedContent:
  - raw_secrets
  - credential_values
auditEvents:
  - review.completed
approvalGate: code_review
```

## Memory Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `scope` | Yes | Memory boundary: `ephemeral`, `task`, `project`, `team`, `user`, or `organization`. |
| `retention` | Yes | Human-readable retention rule or policy reference. |
| `ownership` | Yes | Actor, role, team, user, or organization that owns the memory. |
| `visibility` | Yes | Who may inspect or receive memory from this scope. |
| `updateRules` | Yes | Rules for creating, updating, correcting, or deleting memory. |
| `sensitivity` | Yes | Classification of stored memory: `public`, `internal`, `confidential`, or `restricted`. |
| `allowedConsumers` | Yes | Actor IDs that may consume memory from the scope. |
| `updateMode` | No | Practical update posture for validators and future runtimes. |
| `allowedWriters` | No | Actor IDs allowed to write or update this memory scope. |
| `allowedSourceScopes` | No | Source memory scopes from which this scope may be derived or promoted. |
| `prohibitedContent` | No | Categories that must not be stored in this scope. |
| `auditEvents` | No | Event type references that should be emitted or retained for meaningful writes. |
| `approvalGate` | No | Approval gate required for sensitive or durable memory writes. |

Schemas validate only practical structure. Cross-file checks, such as whether `allowedConsumers` exist or an approval gate is declared in `project.yaml`, are future semantic validation work.

## Scopes

| Scope | Retention | Ownership | Visibility | Typical Sensitivity | Default Posture |
| --- | --- | --- | --- | --- | --- |
| `ephemeral` | Minutes, active session, or current interaction. | Runtime or current actor. | Current actor or task execution boundary. | Internal to confidential. | May update automatically, discarded after use. |
| `task` | Until task completion plus project policy. | Project or task owner. | Task participants and reviewers. | Internal to confidential. | May be updated during task work; durable promotion should be reviewed. |
| `project` | Project-defined retention. | Maintainers or project owner. | Declared project actors. | Internal by default. | Durable writes should be reviewed or approved. |
| `team` | Team-defined retention. | Team maintainers. | Team members and authorized agents. | Internal or confidential. | Cross-project reuse requires governance. |
| `user` | User-controlled or user-policy controlled. | Individual human. | User-approved actors only. | Confidential by default. | Writes should be explicit and user-owned. |
| `organization` | Organization policy. | Organization. | Explicitly authorized actors. | Confidential or restricted. | Writes require governance, auditability, and approval. |

## Update Modes

`updateMode` is an optional draft field that summarizes how memory may be changed.

| Mode | Meaning | Typical Scope |
| --- | --- | --- |
| `automatic` | Runtime may update memory during active work within the declared scope. | `ephemeral` |
| `actor_requested` | An allowed actor may request or perform the update. | `task` |
| `review_required` | A reviewer must inspect the update before it becomes durable. | `task`, `project` |
| `approval_required` | A declared approval gate must be satisfied before the write is accepted. | `project`, `team`, `user`, `organization` |
| `prohibited` | Writes to the scope are not allowed by this manifest. | Any reserved or disabled scope |

The update mode does not override permissions or approval gates. It is a compact policy hint for validators and future runtimes.

## Sensitivity

Memory sensitivity should be at least as strict as the source information that produced it.

| Sensitivity | Meaning | Examples | Guidance |
| --- | --- | --- | --- |
| `public` | Safe to disclose publicly. | Published docs summary, public issue label. | Still respect license and attribution. |
| `internal` | Intended for project or team use. | Implementation notes, task decisions, maintainer preferences. | Avoid sharing outside the project boundary. |
| `confidential` | Sensitive product, customer, security, user, or business information. | Customer research summary, unreleased roadmap, private design decision. | Narrow allowed consumers and require review for durable writes. |
| `restricted` | High-risk memory with strict handling requirements. | Incident facts, compliance evidence, security findings, credential metadata. | Require explicit approval, audit events, and minimal retention. |

If memory mixes different sensitivity levels, use the stricter classification or split memory into separate scopes.

## Ownership and Visibility

Ownership defines who controls memory policy. Visibility defines who may inspect or receive memory content.

Ownership should not be inferred from the actor that wrote the memory. For example, an implementation agent may write task notes, but the project still owns task memory. A user's preference memory should remain user-owned even if an agent records it.

Visibility should be narrower than or equal to the declared `allowedConsumers`. If the plain-language `visibility` field and `allowedConsumers` disagree, future validators should warn and runtimes should choose the narrower interpretation.

## Allowed Consumers and Writers

`allowedConsumers` declares who may read or reuse memory from a scope.

`allowedWriters` optionally declares who may create or update memory in that scope.

An actor using a memory scope requested by an agent definition should still
pass all of these checks:

- the target scope exists in `memory.yaml`
- the actor is an allowed consumer for reads
- the actor is an allowed writer for writes, if writers are declared
- the write mode permits the requested operation
- any approval gate is satisfied
- project policy and autonomy level allow the operation

## Cross-Scope Leakage

Cross-scope leakage happens when information retained for one boundary is reused in another boundary without explicit permission.

Examples:

- task notes become project memory without review
- project lessons become team memory without maintainer approval
- team conventions become user memory without user consent
- incident details become organization memory without compliance approval
- confidential context is summarized into internal memory

Future runtimes should not promote memory automatically from narrower scopes to broader scopes.

Use `allowedSourceScopes` to describe permitted promotion paths:

```yaml
scope: project
allowedSourceScopes:
  - task
updateMode: approval_required
approvalGate: code_review
```

If `allowedSourceScopes` is absent, future runtimes should treat promotion as a sensitive operation and require explicit policy or approval.

## Prohibited Content

`prohibitedContent` is a draft, project-defined list of categories that must not be retained in a scope.

Common categories:

- `raw_secrets`
- `credential_values`
- `personal_data`
- `customer_identifiers`
- `security_exploit_details`
- `production_incident_details`
- `unreviewed_external_claims`
- `provider_private_outputs`

This field is not a full data-loss-prevention system. It is a declaration that future runtimes, validators, and reviewers can use to reject obviously unsafe memory writes.

## Approval Gates

Memory writes should require approval when they are durable, sensitive, user-owned, organization-owned, or cross-scope.

Examples:

- writing project memory from task notes
- promoting task memory to team memory
- storing user preference memory
- retaining security findings after an incident
- retaining customer research summaries for future reuse

Approval gates for memory should identify ownership, visibility, sensitivity, allowed consumers, and evidence for the write.

See [Approval Gates](approval-gates.md) for gate states and runtime expectations.

## Runtime Expectations

Future runtimes should:

- reject writes to undeclared memory scopes
- reject reads by actors outside `allowedConsumers`
- reject writes by actors outside `allowedWriters` when writers are declared
- keep memory access separate from context access
- prevent implicit promotion between scopes
- require approval for durable sensitive writes when gates are declared
- emit audit events for meaningful memory writes, corrections, deletions, and promotions
- preserve enough evidence to explain why memory was retained
- support deletion or correction according to ownership and retention policy

Runtimes must not use provider defaults, hidden caches, or extension behavior to bypass memory declarations.

## Semantic Validation Candidates

Future validators may check:

- agent definition `components.memoryScopes` values exist in `memory.yaml`
- deprecated AgentSet `memoryAccess` values, when present for compatibility,
  do not grant memory access
- memory `allowedConsumers` and `allowedWriters` refer to declared actors
- sensitive scopes define approval gates or narrow consumers
- `organization` and `user` scopes are not writable without explicit policy
- `allowedSourceScopes` do not promote restricted memory into broader lower-sensitivity scopes
- `approvalGate` values reference declared project gates
- `auditEvents` reference declared events
- `prohibitedContent` uses project-recognized categories
- `updateMode` is compatible with scope sensitivity
