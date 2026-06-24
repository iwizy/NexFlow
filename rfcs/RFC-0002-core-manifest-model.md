# RFC-0002: Core Manifest Model

## Status

Accepted

## Summary

NexFlow defines a set of YAML manifests for project identity, agents, workflows, tasks, handoffs, permissions, capabilities, context, memory, providers, events, and extensions.

## Motivation

AI developer teams need a reviewable configuration surface that separates responsibilities, access, context, memory, and workflow state.

## Proposal

The initial manifest set is:

- `project.yaml`
- `agents.yaml`
- `workflow.yaml`
- `tasks.yaml`
- `handoffs.yaml`
- `permissions.yaml`
- `capabilities.yaml`
- `context.yaml`
- `memory.yaml`
- `providers.yaml`
- `events.yaml`
- `extensions.yaml`

Every manifest includes:

```yaml
specVersion: "0.1"
kind: ManifestKind
```

Schemas should validate useful structure without attempting to encode every semantic rule.

## Compatibility Impact

This creates the initial draft compatibility surface. Future breaking changes must update docs, schemas, examples, and changelog entries.

## Security and Safety Impact

The model separates capabilities from permissions and requires approval gates for sensitive actions. Context and memory are explicit rather than implicit.

## Alternatives Considered

- One large manifest file.
- Runtime-specific configuration.
- Provider-specific agent files.

Separate manifests were chosen because they make review, ownership, and future validation clearer.

## Open Questions

- Should future versions allow manifest bundling? See [RFC-0012](RFC-0012-manifest-bundling.md) for the current draft proposal.
- How should cross-file references be validated?
- Which capabilities should be standardized first?
