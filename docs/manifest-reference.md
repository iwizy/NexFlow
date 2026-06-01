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

### `workflow.yaml`

Declares workflow stages, steps, dependencies, and approval gates.

### `tasks.yaml`

Declares units of work, owners, dependencies, artifacts, status, and acceptance criteria.

### `handoffs.yaml`

Declares transfers of responsibility between actors.

### `permissions.yaml`

Declares allow, deny, and approval-gated rules for capabilities.

### `capabilities.yaml`

Declares known capabilities, descriptions, risk levels, and expected approval behavior.

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

### `providers.yaml`

Declares provider abstractions and preferences without binding the spec to a vendor.

### `events.yaml`

Declares event types, payload expectations, retention, and audit requirements.

### `extensions.yaml`

Declares integration namespaces and extension lifecycle state.

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

See [Approval Gates](approval-gates.md) for approval gate semantics beyond the compact schema shape.
