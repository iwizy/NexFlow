# NexFlow Schemas

This directory contains draft JSON Schemas for NexFlow manifests.

The schemas are practical validation aids. They are not a complete formal semantics for NexFlow.

## Current Scope

The schemas currently target `specVersion: "0.1"` and use JSON Schema draft 2020-12.

| Schema | Manifest `kind` | Purpose |
| --- | --- | --- |
| `project.schema.json` | `Project` | Project identity, policies, maintainers, approval gates, and manifest locations. |
| `agents.schema.json` | `AgentSet` | Agent identities, roles, skills, capabilities, permissions, context, memory, and autonomy. |
| `agent-definitions.schema.json` | `AgentDefinitionSet` | Versioned agent behavioral releases assembled from model, prompt, retrieval, permission, context, memory, autonomy, and extension references. |
| `workflow.schema.json` | `Workflow` | Workflow stages, steps, dependencies, gates, and emitted events. |
| `tasks.schema.json` | `TaskSet` | Tasks, owners, dependencies, artifacts, required capabilities, and acceptance criteria. |
| `handoffs.schema.json` | `HandoffSet` | Responsibility transfers between actors. |
| `permissions.schema.json` | `PermissionSet` | Allow, deny, and approval-required rules for capabilities. |
| `capabilities.schema.json` | `CapabilitySet` | Capability vocabulary, categories, risk levels, and audit guidance. |
| `context.schema.json` | `ContextSet` | Context sources, access modes, classifications, freshness, web boundaries, and MCP metadata. |
| `memory.schema.json` | `MemorySet` | Memory scopes, retention, ownership, visibility, sensitivity, consumers, writers, update modes, audit events, and promotion boundaries. |
| `providers.schema.json` | `ProviderSet` | Provider abstractions, selection constraints, and optional explainability hints. |
| `model-profiles.schema.json` | `ModelProfileSet` | Provider-neutral model profiles, selection modes, constraints, fallback rules, review triggers, and audit expectations. |
| `prompt-sets.schema.json` | `PromptSet` | Versioned prompt material, prompt revisions, source references, safety review status, compatibility impact, and audit expectations. |
| `retrieval-profiles.schema.json` | `RetrievalProfileSet` | Retrieval profiles for context source selection, index versions, chunking, freshness, citations, sensitivity, review triggers, and audit expectations. |
| `events.schema.json` | `EventSet` | Event names, optional envelope expectations, payload expectations, retention, and audit requirements. |
| `extensions.schema.json` | `ExtensionSet` | Extension namespaces, lifecycle state, and required capabilities. |
| `common.schema.json` | Shared definitions | IDs, metadata, autonomy levels, risk levels, artifacts, approval gates, and common enums. |

## Design Rules

Schemas SHOULD:

- validate required top-level fields
- reject unsupported `specVersion` values
- reject unsupported manifest `kind` values
- encode stable enums when the draft spec defines them
- reuse definitions from `common.schema.json`
- allow extension metadata where the spec intentionally leaves room
- stay readable enough for contributors to review

Schemas SHOULD NOT:

- encode runtime behavior
- grant permissions
- imply that validation is enforcement
- hard-code provider-specific behavior into core schemas
- attempt complex graph validation better handled by semantic tooling

## Update Rules

When changing a manifest shape:

1. Update the relevant documentation in `docs/`.
2. Update the matching schema in this directory.
3. Update at least one example under `examples/`.
4. Update `CHANGELOG.md` for user-visible changes.
5. Consider whether an RFC is required.

Breaking schema changes require migration guidance and should be routed through the RFC process.

## Common Definitions

Use `common.schema.json` for shared concepts:

- IDs
- metadata
- autonomy levels
- permission effects
- task and handoff statuses
- risk levels
- access modes
- classifications
- memory scopes
- artifacts
- approval gates
- extension attachments

Prefer adding shared definitions once rather than duplicating shapes across schemas.

## What JSON Schema Can Check

JSON Schema is useful for:

- required fields
- field types
- enum values
- simple patterns
- nested object shapes
- array item structure
- obvious authoring errors

## What JSON Schema Cannot Fully Check

JSON Schema does not fully validate project meaning.

Examples of future semantic checks:

- referenced agent IDs exist
- agent definitions reference existing agents and component manifests
- agent definition autonomy, permissions, memory, context, and review gates are compatible
- referenced permission IDs exist
- referenced capability IDs exist
- workflow dependencies form a coherent graph
- task owners have required permissions
- approval gates cover high-risk capabilities
- handoff artifacts are produced by previous tasks
- memory access is consistent with project policy
- memory writers, prohibited content, and promotion paths are consistent with sensitivity
- referenced provider IDs in model profiles exist
- model profile references in agent definitions exist
- prompt source references exist
- prompt set owners and approvers exist
- prompt content digests match referenced prompt material
- prompt set references in agent definitions exist
- retrieval profile context source references exist
- retrieval profile index versions and source digests match referenced corpora
- retrieval profile freshness, citation, and sensitivity rules satisfy project policy
- retrieval profile references in agent definitions exist
- extension requirements are satisfied

See [Validation](../docs/validation.md) for the current validation model.

See [RFC-0005](../rfcs/RFC-0005-validation-strategy.md) for the draft validation strategy covering syntax checks, schema validation, manifest inventory, semantic validation, diagnostics, and safety boundaries.

See [RFC-0008](../rfcs/RFC-0008-memory-retention.md) for draft memory retention semantics beyond schema shape.

See [RFC-0009](../rfcs/RFC-0009-event-envelope.md) for draft event envelope semantics beyond schema shape.

See [RFC-0010](../rfcs/RFC-0010-provider-selection.md) for draft provider selection semantics beyond schema shape.

## Local Smoke Checks

Check schema JSON syntax:

```sh
python3 - <<'PY'
import json
from pathlib import Path

for path in sorted(Path("schemas").glob("*.schema.json")):
    with path.open(encoding="utf-8") as handle:
        json.load(handle)
    print(f"ok {path}")
PY
```

Check example YAML syntax:

```sh
ruby -ryaml -e 'Dir["examples/**/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

## Extension Policy

Core schemas allow some `additionalProperties` intentionally. This lets projects attach future or private metadata without immediately breaking validation.

Custom behavior should still be documented under an extension namespace. Unknown extension fields MUST NOT be treated as granting additional access.

## Stability

The `0.1` schemas are draft schemas. They may change before NexFlow reaches `1.0`.

Contributors should prefer additive changes when possible and document migration paths for incompatible changes.
