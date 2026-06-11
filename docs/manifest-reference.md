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

## Required Core Manifests

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

The `manifests` map may include draft versioning manifests such as `agentDefinitions: agent-definitions.yaml`, `modelProfiles: model-profiles.yaml`, `promptSets: prompt-sets.yaml`, and `retrievalProfiles: retrieval-profiles.yaml`.

Related docs: [Project Policy](concepts.md#project-policy), [Autonomy Model](autonomy-model.md), [Approval Gates](approval-gates.md), [Versioning](versioning.md), [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md).

### `agents.yaml`

Declares agents and their roles.

Agent fields:

- `id`
- `displayName`
- `role`
- `description`
- `responsibilities`
- `skills`
- `permissions`
- `capabilities`
- `contextAccess`
- `memoryAccess`
- `autonomyLevel`
- `providerPreferences`
- `extensions`

Related docs: [Concepts](concepts.md), [Glossary](glossary.md), [Capability Model](capability-model.md), [Context Model](context-model.md), [Memory Model](memory-model.md), [Autonomy Model](autonomy-model.md), [Provider Abstraction](provider-abstraction.md), [Extension Model](extensions.md).

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

Declares allow, deny, and approval-gated rules for capabilities.

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
- optional `updateMode` for automatic, requested, reviewed, approval-gated, or prohibited writes
- optional `allowedWriters`
- optional `allowedSourceScopes` for explicit memory promotion paths
- optional `prohibitedContent`
- optional `auditEvents`
- optional `approvalGate` for durable or sensitive writes

See [Memory Model](memory-model.md) for sensitivity rules, ownership guidance, and cross-scope leakage prevention.

### `providers.yaml`

Declares provider abstractions and preferences without binding the spec to a vendor.

Related docs: [Provider Abstraction](provider-abstraction.md), [Runtime Options](runtime-options.md), [Security Model](security-model.md).

### `model-profiles.yaml`

Declares provider-neutral model selection profiles for future agent definitions, workflows, or runtime events.

Model profiles define:

- `id`, `description`, and `modelClass`
- `selection.mode` as `pinned`, `floating`, or `policy`
- optional `providerRefs`, `pinnedModel`, `floatingAlias`, and `resolutionPolicy`
- optional constraints for training use, data residency, tool use, cost, latency, and sensitivity
- optional fallback behavior
- audit expectations for recording resolved providers, models, revisions, selection reasons, and fallback use
- review requirements and review triggers for behavior-changing model updates

Model profiles do not select a provider by themselves and do not grant permissions, context access, tool access, or runtime autonomy.

Related docs: [Model Profiles](model-profiles.md), [Provider Abstraction](provider-abstraction.md), [Versioning](versioning.md), [Event Model](events.md), [Security Model](security-model.md).

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

Declares event types, payload expectations, retention, and audit requirements.

Related docs: [Event Model](events.md), [Approval Gates](approval-gates.md), [Memory Model](memory-model.md), [Conformance](conformance.md).

### `extensions.yaml`

Declares integration namespaces and extension lifecycle state.

Related docs: [Extension Model](extensions.md), [Integrations](integrations.md), [Provider Abstraction](provider-abstraction.md), [Security Model](security-model.md), [Conformance](conformance.md).

## Identifier Rules

IDs should:

- use lowercase letters, numbers, hyphens, and underscores
- be stable across commits
- avoid provider names unless the resource is provider-specific
- be unique within the manifest

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
