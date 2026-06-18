# RFC-0008: Memory Retention

## Status

Draft

## Summary

This RFC proposes the initial NexFlow memory retention model.

The proposal defines:

- memory scope semantics
- retention expectations
- ownership and visibility rules
- allowed consumers and writers
- update modes
- sensitivity and prohibited content expectations
- cross-scope promotion boundaries
- correction, deletion, and expiry expectations
- audit and approval expectations
- validation and future runtime boundaries

The goal is to make memory useful without letting retained information silently become broader, more durable, or more sensitive than the project intended.

## Motivation

Memory is different from context.

Context is information an actor may read from declared sources during work. Memory is information a system may retain and reuse after it has been observed, summarized, corrected, or produced.

That makes memory higher risk.

Risks include:

- retaining secrets or credential values
- retaining personal, customer, security, or incident details longer than intended
- reusing stale assumptions
- promoting task-local information into project or organization memory
- storing private user preferences in shared team memory
- mixing sensitivity levels without preserving the stricter classification
- letting provider defaults, caches, or extensions create hidden memory
- making deletion or correction unclear

NexFlow needs a shared memory retention model before future runtimes or tools start reading, writing, promoting, correcting, or deleting memory.

## Proposal

NexFlow should treat memory as declared retention policy, not hidden runtime behavior.

Current `memory.yaml` files declare memory scopes. They do not store actual memory entries.

Future memory entries, memory stores, runtimes, or CLIs should interpret those scopes conservatively.

## Memory Scope Model

NexFlow defines six draft memory scopes.

| Scope | Intended boundary | Default posture |
| --- | --- | --- |
| `ephemeral` | Current interaction, session, or active execution context. | May update automatically and should be discarded after use. |
| `task` | One task or task lifecycle. | May be updated during task work; durable promotion should be reviewed. |
| `project` | One project or repository. | Durable writes should be reviewed or approved. |
| `team` | A declared team across one or more workstreams. | Cross-project reuse requires governance. |
| `user` | One human user's preferences or memory. | User-owned, explicit, narrow visibility. |
| `organization` | Organization-level policy, evidence, or reusable knowledge. | Approval, auditability, and strict retention required. |

These scopes are boundaries. They are not storage backends.

## Retention

Every memory scope should describe retention.

Retention may be:

- a concrete duration
- a task lifecycle rule
- a project policy reference
- a user-controlled setting
- an organization retention policy
- a deletion or expiry trigger

Examples:

- `Session only.`
- `Until task completion plus project audit window.`
- `Project policy.`
- `User controlled.`
- `Organization retention policy.`

Retention SHOULD NOT default to forever.

If retention is unclear, future validators should warn and future runtimes should choose the shorter safe interpretation.

## Ownership

Ownership defines who controls memory policy.

Ownership is not the same as the actor that wrote the memory.

Examples:

- task notes may be written by an implementation agent but owned by the project
- user preference memory may be written by an assistant but owned by the user
- organization incident memory may be written by a security reviewer but owned by the organization

Owners should control:

- retention policy
- allowed consumers
- allowed writers
- correction rights
- deletion rights
- promotion rules
- audit expectations

## Visibility And Allowed Consumers

Visibility describes who may inspect or receive memory.

`allowedConsumers` declares concrete actors that may read or reuse memory from a scope.

Future runtimes should use the narrower interpretation when visibility and `allowedConsumers` disagree.

An actor should not receive memory unless:

- the memory scope exists
- the actor has declared memory access
- the actor is listed as an allowed consumer or is covered by explicit project policy
- sensitivity and project policy allow the read
- any approval gate required for the read or promotion is satisfied

## Allowed Writers And Update Modes

`allowedWriters` declares who may write or update a memory scope.

`updateMode` summarizes how updates may happen.

| Mode | Meaning |
| --- | --- |
| `automatic` | Runtime may update memory during active work within the declared scope. |
| `actor_requested` | An allowed actor may request or perform the update. |
| `review_required` | A reviewer must inspect the update before it becomes durable. |
| `approval_required` | A declared approval gate must be satisfied before the write is accepted. |
| `prohibited` | Writes to the scope are not allowed by this manifest. |

`automatic` should be rare outside `ephemeral`.

`approval_required` should be preferred for durable, sensitive, user-owned, team-wide, or organization-wide memory.

The update mode does not override permissions, approval gates, ownership, visibility, or sensitivity.

## Sensitivity

Memory sensitivity should be at least as strict as the source information used to produce it.

If memory combines sources with different classifications, the memory should use the strictest classification unless project policy defines a stricter rule.

Recommended posture:

| Sensitivity | Memory posture |
| --- | --- |
| `public` | Safe for public disclosure, but still respect license, attribution, and source policy. |
| `internal` | Project or team use only. |
| `confidential` | Narrow consumers, review for durable writes, careful evidence handling. |
| `restricted` | Minimal retention, explicit approval, audit events, narrow consumers, and deletion/correction paths. |

Lowering memory sensitivity should be treated as safety-significant and may be breaking.

## Prohibited Content

Memory scopes may list prohibited content categories.

Common categories include:

- `raw_secrets`
- `credential_values`
- `personal_data`
- `customer_identifiers`
- `security_exploit_details`
- `production_incident_details`
- `unreviewed_external_claims`
- `provider_private_outputs`

Future runtimes should reject obvious prohibited content when they can detect it.

This field is not a complete data-loss-prevention system. It is a declared policy signal for validators, runtimes, reviewers, and auditors.

## Cross-Scope Promotion

Memory promotion moves retained information from one scope to another.

Examples:

- `ephemeral` to `task`
- `task` to `project`
- `project` to `team`
- `team` to `organization`
- `task` to `user`

Promotion is sensitive because it often increases retention, visibility, or reuse.

Future runtimes should not promote memory automatically from narrower scopes to broader scopes.

Promotion should require:

- declared source scope
- declared destination scope
- compatible sensitivity
- allowed source path through `allowedSourceScopes`
- allowed writer for the destination scope
- approval or review when required
- audit event when meaningful

If `allowedSourceScopes` is absent, promotion should be treated as sensitive and require explicit project policy or approval.

Promotion MUST NOT be used to launder restricted or confidential memory into a lower-sensitivity scope.

## Correction, Deletion, And Expiry

Memory should be correctable and deletable according to ownership and policy.

Future memory systems should support:

- correction of stale or incorrect memory
- deletion when retention expires
- deletion when owner policy requires it
- deletion or redaction when prohibited content is discovered
- audit events for meaningful correction, deletion, or expiry

User-owned memory should have clear user correction and deletion paths.

Organization memory should follow organization retention and audit policy.

## Audit Events

Meaningful memory operations should be auditable.

Current event vocabulary includes:

- `memory.written`
- `memory.corrected`
- `memory.deleted`
- `memory.promoted`

Future event payloads should prefer:

- memory scope
- actor
- owner
- allowed consumers
- sensitivity
- source scope, when promoted
- destination scope, when promoted
- approval gate reference
- evidence references
- retention policy reference
- reason for write, correction, deletion, or promotion

Events should not contain raw secrets, credential values, or unnecessary sensitive content.

## Approval Expectations

Memory writes should require approval when they are:

- durable
- sensitive
- cross-scope
- user-owned
- organization-owned
- derived from restricted context
- reused beyond the original task

Approval gates should identify:

- what is being retained
- why retention is needed
- who owns the memory
- who may consume it
- how long it may be retained
- what evidence was reviewed

See [RFC-0007](RFC-0007-approval-gates.md) for approval gate semantics.

## Validation Expectations

Future semantic validators should check:

- agent memory access references declared memory scopes
- `allowedConsumers` and `allowedWriters` reference declared actors, roles, teams, or policy authorities
- `approvalGate` references declared gates
- `auditEvents` reference declared events
- durable sensitive scopes use review or approval update modes
- `user` and `organization` memory are not broadly writable
- `allowedSourceScopes` do not promote to broader lower-sensitivity scopes
- `prohibitedContent` categories are recognized by project policy
- `updateMode` is compatible with scope and sensitivity
- visibility is not broader than allowed consumers

Validators should report warnings separately from hard errors when policy requires human judgment.

## Runtime Boundaries

This RFC does not implement memory storage.

A future runtime that claims memory support should:

- reject writes to undeclared memory scopes
- reject reads by actors outside allowed consumers
- reject writes by actors outside allowed writers when writers are declared
- preserve separation between context and memory
- preserve separation between memory scopes
- prevent implicit cross-scope promotion
- honor retention, correction, deletion, and expiry policy
- emit audit events for meaningful writes, corrections, deletions, and promotions
- avoid hidden provider memory, hidden caches, or extension-created memory that bypasses declarations
- fail closed when memory policy is unsupported

## Compatibility Impact

This RFC does not change manifest structure.

If accepted, it may guide:

- future `docs/memory-model.md` updates
- future event payload guidance for memory events
- future semantic validation checks
- future runtime conformance requirements
- future schema additions for memory entry, correction, deletion, or expiry metadata

No existing schema, example, or manifest needs migration because of this RFC.

Changing memory retention, visibility, sensitivity, allowed consumers, allowed writers, promotion paths, or approval requirements can affect `NF-SEMANTIC`, `NF-RUNTIME`, privacy, audit, and safety compatibility.

## Security and Safety Impact

This RFC improves safety by making memory retention boundaries explicit.

It reduces the risk that:

- secrets or credential values are retained
- personal, customer, security, or incident details are retained too broadly
- task-local context becomes durable project memory without review
- user-owned memory becomes team-visible
- organization memory is written without governance
- stale memory is reused after policy changes
- hidden provider memory bypasses project policy

Memory remains a specification model until a future runtime enforces it.

## Alternatives Considered

### No Memory Model

NexFlow could avoid memory declarations entirely.

This would leave a major AI-team behavior outside the specification and would make audits incomplete.

### Runtime-Specific Memory

NexFlow could let every runtime define memory behavior independently.

This would reduce portability and make memory safety difficult to compare across tools.

### Unlimited Project Memory

NexFlow could treat all retained information as project memory.

This is too broad. It would erase task, user, team, and organization boundaries.

### User Memory By Default

NexFlow could treat remembered preferences as user memory by default.

This may be appropriate in personal assistants, but NexFlow targets software teams and projects. User memory should be explicit and owner-controlled.

### Schema-Only Memory Safety

NexFlow could rely on JSON Schema to make memory safe.

This is insufficient because memory safety depends on actors, sensitivity, approvals, source scopes, retention policy, and runtime behavior.

## Open Questions

- Should future versions define first-class memory entry manifests or keep entries runtime-owned?
- Should `retention` become structured rather than human-readable?
- Should `prohibitedContent` have a standard vocabulary before `1.0`?
- Should memory correction and deletion require dedicated approval events?
- Should memory stores support signed deletion or correction receipts?
- How should private user memory be represented in public open-source repositories?
- Which memory changes require a new `specVersion` before `1.0`?
