# Manifest Reference

NexFlow manifests are YAML documents with a required `specVersion` field.

The current draft version is:

```yaml
specVersion: "0.1"
```

## Common Fields

Most manifests use:

```yaml
specVersion: "0.1"
kind: ManifestKind
metadata:
  project: example-project
  name: human-readable-name
  description: Optional description
```

## Core Manifests

The current `0.1` maintained examples use the existing complete manifest set.
`ActorSet` is an additive migration manifest and is currently present only in
the Minimal Team reference path. [RFC-0016: Core Profile And Logical Discovery](../rfcs/RFC-0016-core-profile-and-discovery.md) proposes a future minimum profile, optional modules, multiple workflows, and reference-driven dependency closure. Reduced profiles are not supported by the current schemas unless that RFC is accepted and implemented.

### `project.yaml`

Describes project identity, maintainers, policies, and manifest locations.

Key fields:

- `project.id`
- `project.displayName`
- `project.description`
- `project.license`
- `project.maintainers`
- `project.defaultAutonomy`
- `project.policies`
- `manifests`

`project.policies.networkAccess` accepts a structured, fail-closed outbound
network policy. Its `default` is `deny`; rules identify actors, purposes,
destinations, effects, transport constraints, audit expectations, and any
required approval gate. Its audit event references resolve through
`events.yaml`. Legacy free-text values remain schema-valid during the `0.1`
draft but are advisory only and MUST NOT grant connectivity.

`project.policies.humanOverride` declares typed human-controlled authorities, a
closed operation set, new-action and in-flight response, fail-closed behavior,
approval-gated resume, and required audit events. The policy requires
`ActorSet`, can only narrow behavior, and does not implement runtime
interruption.

The `manifests` map may include `actors: actors.yaml` for a migrated participant
inventory and draft versioning manifests such as
`agentDefinitions: agent-definitions.yaml`, `modelProfiles: model-profiles.yaml`,
`promptSets: prompt-sets.yaml`, and
`retrievalProfiles: retrieval-profiles.yaml`.

Related docs: [Project Policy](concepts.md#project-policy), [Human Override](human-override.md), [Network Access Policy](network-access-policy.md), [Autonomy Model](autonomy-model.md), [Approval Gates](approval-gates.md), [Versioning](versioning.md), [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md).

### `actors.yaml`

Declares first-class participant identity in the draft `ActorSet` shape.

Actor fields:

- `id`, `kind`, `displayName`, and `description`
- `roles` and `responsibilities`
- optional `skills` and namespaced `extensions`
- required typed `agentRef` for an `agent`
- required typed `operatedBy` references for an `automation` or `service`
- required typed `representedBy` references for an `authority`
- optional typed `integrationRef` for a `service`

When `ActorSet` is present, it is the authoritative participant namespace for
that manifest assembly. When absent, legacy `0.1` projects continue to resolve
participants from project maintainers and `AgentSet` during the migration
window.

Related docs: [Actor Model](actor-model.md), [Actor Model Migration](actor-model-migration.md), [Concepts](concepts.md), [Compatibility](compatibility.md), [RFC-0013](../rfcs/RFC-0013-actor-model.md), [RFC-0015](../rfcs/RFC-0015-typed-references.md).

### `agents.yaml`

Declares stable AI agent identity.
Legacy projects may still include human participant entries for compatibility; a
human entry is not an AI agent. Projects using `ActorSet` keep non-agent
participants out of `AgentSet` and connect each agent actor through explicit
`agentRef`.

Required identity fields:

- `id`
- `displayName`
- `role`
- `description`
- `responsibilities`
- `skills`

The legacy fields `permissions`, `capabilities`, `contextAccess`,
`memoryAccess`, `autonomyLevel`, `providerPreferences`, and `extensions` remain
schema-valid but deprecated for compatibility. New and migrated identities
should omit them. They do not grant access or select behavior.

Related docs: [Agent Identity Migration](agent-identity-migration.md), [Concepts](concepts.md), [Glossary](glossary.md), [Agent Definitions](agent-definitions.md), [Capability Model](capability-model.md), [Context Model](context-model.md), [Memory Model](memory-model.md), [Autonomy Model](autonomy-model.md), [Provider Abstraction](provider-abstraction.md), [Extension Model](extensions.md).

### `agent-definitions.yaml`

Declares versioned behavioral releases for agents.

Agent definitions define:

- `id`, `agentRef`, `definitionVersion`, `status`, `owner`, and `description`
- component references such as `modelProfileRef`, `promptSetRef`, and `retrievalProfileRef`
- permission, capability, context source, memory scope, and extension references
- autonomy level for the definition
- change summary and optional replacement metadata
- review requirements and activation criteria
- compatibility impact
- audit expectations for recording agent definition references, versions, components, review state, and change summaries

Agent definitions do not run agents, call providers, load prompts, retrieve context, grant permissions, or replace approval gates.

Related docs: [Agent Definitions](agent-definitions.md), [Versioning](versioning.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md), [Autonomy Model](autonomy-model.md), [Event Model](events.md), [Security Model](security-model.md), [Validation](validation.md).

### `workflow.yaml`

Declares workflow stages, steps, dependencies, and approval gates.

Related docs: [Handoff Protocol](handoff-protocol.md), [Approval Gates](approval-gates.md), [Event Model](events.md), [Validation](validation.md).

### `tasks.yaml`

Declares units of work, owners, dependencies, artifacts, status, and acceptance criteria.

Related docs: [Capability Model](capability-model.md), [Approval Gates](approval-gates.md), [Handoff Protocol](handoff-protocol.md), [Event Model](events.md).

### `handoffs.yaml`

Declares transfers of responsibility between actors.

Related docs: [Handoff Protocol](handoff-protocol.md), [Event Model](events.md), [Workflow](concepts.md#workflow).

### `permissions.yaml`

Declares permission rules with `allow`, `deny`, and `approval_required` effects for capabilities.

Related docs: [Capability Model](capability-model.md), [Security Model](security-model.md), [Approval Gates](approval-gates.md), [Autonomy Model](autonomy-model.md).

### `capabilities.yaml`

Declares known capabilities, descriptions, risk levels, and expected approval behavior.

Related docs: [Capability Model](capability-model.md), [Permissions](concepts.md#permission), [Security Model](security-model.md).

### `context.yaml`

Declares context sources and access policies.

Context sources define:

- `id`, `type`, and `description`
- optional `uri` and `contentTypes`
- `access.default`, `allowedActors`, and `deniedActors`
- `classification`
- optional `refreshPolicy` and `freshness`
- optional web boundaries such as `allowedDomains` and `disallowedDomains`
- optional `mcp` metadata for MCP servers that expose context, tools, or both
- optional `approvalGates` for sensitive source use

See [Context Model](context-model.md) for source taxonomy, freshness guidance, web context, and MCP behavior.

### `memory.yaml`

Declares memory scopes, retention, ownership, visibility, update rules, sensitivity, and allowed consumers.

Memory scopes define:

- `scope`, `retention`, `ownership`, `visibility`, `updateRules`, and `sensitivity`
- `allowedConsumers` for memory reads and reuse
- optional `updateMode` using `automatic`, `actor_requested`, `review_required`, `approval_required`, or `prohibited`
- optional `allowedWriters`
- optional `allowedSourceScopes` for explicit memory promotion paths
- optional `prohibitedContent`
- optional `auditEvents`
- optional `approvalGate` for durable or sensitive writes

See [Memory Model](memory-model.md) for sensitivity rules, ownership guidance, and cross-scope leakage prevention.

### `providers.yaml`

Declares provider abstractions and preferences without binding the spec to a vendor.

Related docs: [Provider Abstraction](provider-abstraction.md), [Runtime Options](runtime-options.md), [Security Model](security-model.md), [RFC-0010](../rfcs/RFC-0010-provider-selection.md).

### `model-profiles.yaml`

Declares provider-neutral model selection profiles for future agent definitions, workflows, or runtime events.

Model profiles define:

- `id`, `description`, and `modelClass`
- `selection.mode` as `pinned`, `floating`, or `policy`
- optional `providerRefs`, `pinnedModel`, `floatingAlias`, and `resolutionPolicy`
- optional constraints for training use, data residency, tool use, cost, latency, and sensitivity
- optional fallback behavior
- audit expectations for recording resolved providers, models, revisions, selection reasons, and fallback use
- optional audit expectations for recording constraints applied and policy decisions
- review requirements and review triggers for behavior-changing model updates

Model profiles do not select a provider by themselves and do not grant permissions, context access, tool access, or runtime autonomy.

Related docs: [Model Profiles](model-profiles.md), [Provider Abstraction](provider-abstraction.md), [Versioning](versioning.md), [Event Model](events.md), [Security Model](security-model.md), [RFC-0010](../rfcs/RFC-0010-provider-selection.md).

### `prompt-sets.yaml`

Declares versioned prompt material for future agent definitions, workflows, tasks, reviews, and safety checks.

Prompt sets define:

- `id`, `description`, `version`, `status`, and `owner`
- prompt entries with `id`, `kind`, `revision`, optional `sourceRef`, optional `contentDigest`, optional `variables`, and optional `classification`
- review requirements and safety review status
- compatibility impact and affected agents or workflows
- audit expectations for recording prompt set references, revisions, content digests, and review state
- intended agents or agent definitions through `recommendedFor`

Prompt sets do not execute prompts, load prompt files, call providers, grant permissions, or replace approval gates.

Related docs: [Prompt Sets](prompt-sets.md), [Versioning](versioning.md), [Event Model](events.md), [Security Model](security-model.md), [Validation](validation.md).

### `retrieval-profiles.yaml`

Declares retrieval expectations for selecting, indexing, assembling, citing, and auditing context from declared context sources.

Retrieval profiles define:

- `id`, `description`, `version`, `status`, and `owner`
- context source references, purpose, expected access mode, and maximum classification
- optional excluded sources
- optional index or corpus metadata, including version and update policy
- optional chunking policy
- optional retriever strategy, `topK`, score threshold, filters, and query rewrite expectations
- freshness and citation requirements
- sensitivity and redaction expectations
- review triggers for retrieval changes
- compatibility impact and affected agents or workflows
- audit expectations for recording retrieval profile references, context sources, index versions, freshness, citations, and retriever configuration

Retrieval profiles do not retrieve data, build indexes, call embedding providers, grant context access, grant tool access, or replace approval gates.

Related docs: [Retrieval Profiles](retrieval-profiles.md), [Context Model](context-model.md), [Versioning](versioning.md), [Event Model](events.md), [Security Model](security-model.md), [Validation](validation.md).

### `events.yaml`

Declares event types, payload expectations, retention, audit requirements, and optional event envelope expectations.

`events.yaml` is not an event log. It describes the event types and envelope expectations that future runtimes, validators, or audit exports may use.

Related docs: [Event Model](events.md), [Approval Gates](approval-gates.md), [Memory Model](memory-model.md), [Conformance](conformance.md), [RFC-0009](../rfcs/RFC-0009-event-envelope.md).

### `extensions.yaml`

Declares integration namespaces and extension lifecycle state.

Related docs: [Extension Model](extensions.md), [Integrations](integrations.md), [Provider Abstraction](provider-abstraction.md), [Security Model](security-model.md), [Conformance](conformance.md).

## Identifier Rules

An ID is a stable machine-readable name for a declared resource. It is not a display name, file path, URI, event type, or version string.

Every ID MUST:

- contain between 1 and 128 characters
- start with a lowercase ASCII letter
- contain only lowercase ASCII letters, digits, hyphens, and underscores
- use separators only between non-empty segments, so leading, trailing, or repeated separators are invalid
- remain stable while the declared resource keeps the same identity

Valid examples include `docs-agent`, `review-change`, `read_repository`, and `implementation_agent_2026_06`. Invalid examples include `DocsAgent`, `1-reviewer`, `docs--agent`, `docs_agent_`, and `task.completed`.

Naming guidance:

- Prefer kebab-case for project, actor, task, workflow, stage, step, and handoff identities.
- Prefer snake_case for capability, permission, approval gate, artifact, profile, and other policy vocabulary.
- Use one separator style within an ID. Different resource categories MAY use different styles.
- Avoid provider names unless the resource is intentionally provider-specific.
- Avoid mutable model names, dates, or versions in stable identities. An immutable, explicitly versioned resource MAY include a revision suffix.

IDs MUST be unique within the namespace from which references resolve:

- Top-level resource IDs MUST be unique within their declaring manifest collection.
- Workflow stage IDs MUST be unique within the workflow, and workflow step IDs MUST be unique across all stages because dependencies may cross stage boundaries.
- Task artifact IDs MUST be unique across the `TaskSet` while handoffs use unqualified artifact references.
- Other nested IDs MUST be unique within their immediate owning collection unless another field references them from a broader scope.

The same string MAY appear in distinct resource namespaces only when the reference field identifies exactly one target kind. Multi-kind reference fields, including the draft `approvalGate.appliesTo` field, MUST NOT resolve to more than one declared resource. Authors SHOULD avoid collisions across possible target kinds, and future semantic validators MUST reject ambiguous matches.

## Identifier References

Resource references use the authored form permitted by their field contract.
Existing deterministic fields continue to use exact scalar IDs:

```yaml
agentRef: docs-agent
capabilityRefs:
  - read_repository
  - modify_documentation
```

The first migrated Actor relationship fields and human override authorities
require typed objects:

```yaml
agentRef:
  kind: agent
  id: docs-agent
```

The common typed reference contains `kind`, `id`, and optional `scope`. A field
contract closes the allowed target kinds and determines whether scope or a
legacy scalar form is accepted. Actor relationship fields are assembly-scoped
and prohibit authored scope.

References are case-sensitive and MUST preserve declaration spelling and
separator style. Authors and tools MUST NOT silently lowercase, trim, rewrite
separators, infer aliases, or search unrelated target kinds. Compact strings
such as `agent:docs-agent` and path-like forms such as `agents/docs-agent` are
not accepted typed reference syntax.

For scalar references, the containing field identifies the target namespace.
For typed references, the field contract also verifies that the authored kind is
allowed. JSON Schema checks authored shape and closed kind constraints; semantic
validation checks uniqueness, existence, scope, ambiguity, and graph
consistency.

[RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md) remains Draft.
Only the common primitive, Actor relationship contracts documented in
[Actor Model](actor-model.md), and the human override authority contract are
implemented. Other fields retain their current forms until migrated
deliberately.

Event types are not IDs. They use a separate dotted lowercase form such as `task.completed` and are referenced from event-related fields such as `emits`, `auditEvents`, audit `events`, and event-driven `triggers`. A non-event trigger such as `manual` is not an event type.

An identifier reference never grants access or authority by itself. Capabilities, permissions, context policy, memory policy, autonomy, and approval gates remain authoritative.

Migration from earlier `0.1` drafts: replace IDs with leading, trailing, or repeated separators and update every reference to the exact replacement. Projects adopting ActorSet should follow [Actor Model Migration](actor-model-migration.md).

## Extension Fields

Custom fields should live under `extensions` or `x-` prefixed keys.

Example:

```yaml
extensions:
  - namespace: com.example.internal
    config:
      routingKey: docs-review
```

## Validation

Schemas live in `schemas/`. They are intentionally practical rather than exhaustive. Semantic validation, such as checking cross-file references, is future runtime or validation CLI work.

See [Validation](validation.md), [Conformance](conformance.md), and [Schema Guide](../schemas/README.md) for validation boundaries. See [Approval Gates](approval-gates.md) for approval gate semantics beyond the compact schema shape.
