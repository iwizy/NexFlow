# Schema Design Notes

NexFlow schemas are practical validation aids for manifest authors and future tooling.

They are not a complete formal semantics for NexFlow, and they are not a runtime enforcement layer.

## Design Goals

Schemas should help people and tools catch common authoring mistakes before a manifest set is reviewed or used by a future validator.

The current schema design optimizes for:

- readable schemas that contributors can review
- predictable `specVersion` and `kind` routing
- required top-level manifest structure
- stable enum values where the draft specification defines them
- shared definitions for common IDs, metadata, statuses, risk levels, classifications, autonomy levels, approval gates, and typed references
- enough structure for early validators to produce useful diagnostics
- enough flexibility for extension metadata and draft iteration

## Non-Goals

Schemas do not:

- grant permissions
- enforce permissions
- execute workflows
- call providers
- inspect credentials
- prove that a workflow graph is safe
- prove that a manifest set is semantically complete
- decide whether an approval gate is sufficient for a real-world risk
- replace human review of safety, security, governance, or product intent

A manifest can pass schema validation while still being incomplete, unsafe, or semantically inconsistent.

## Validation Layers

NexFlow treats validation as a layered process.

| Layer | Current Status | Responsibility |
| --- | --- | --- |
| Syntax | Supported through local checks | Confirm JSON schemas parse and YAML manifests are readable. |
| Schema | Draft schemas exist | Check required fields, field types, enums, simple patterns, and manifest shape. |
| Manifest inventory | Future validation work | Confirm all expected manifest files are present and routed by `kind`. |
| Semantic validation | Partial repository smoke coverage | Check selected cross-manifest references, ActorSet bridges, active agent definition authority, human override authorities, graph consistency, permission coverage, memory boundaries, and extension requirements. Full semantic conformance remains future work. |
| Runtime preflight | Future runtime work | Check credentials, sandboxing, provider behavior, tool access, and execution safety before any runtime action. |

Schema validation is one layer. It should not pretend to cover the responsibilities of later layers.

## What Schemas Should Be Strict About

Schemas should be strict where the specification has stable structure:

- `specVersion`
- manifest `kind`
- required top-level sections
- field types
- stable enum values
- common object shapes
- required IDs for declared entities
- lexical form for IDs and event types
- common approval gate, artifact, memory, and extension attachment shapes
- typed reference structure and kind-specific ActorSet relationship boundaries
- compact AgentSet identity requiredness and deprecated compatibility fields
- complete review, compatibility, component, and audit shape for active agent
  definitions
- fail-closed human override policy shape

Strictness is useful when it prevents obvious mistakes without blocking legitimate extension or draft use.

## What Schemas Should Leave To Semantic Validators

Schemas should not try to fully validate meaning across files.

These checks belong to future semantic validation:

- referenced agent IDs exist
- no more than one active agent definition exists for each agent identity
- active agent definition components resolve and have eligible lifecycle state
- ActorSet identities are unique and agent actors bridge explicitly to AgentSet declarations
- ActorSet operator and representative relationships resolve and remain acyclic
- human override authorities are fully human-controlled and its gate and event references resolve
- declared IDs are unique in their owning collections
- identifier references resolve exactly, without case or separator normalization
- multi-kind references do not resolve ambiguously
- permission IDs referenced by agents exist
- capability IDs referenced by permissions exist
- workflow steps reference existing tasks
- dependency graphs are acyclic and reachable
- handoff artifacts were produced by relevant tasks
- task owners have matching permissions
- high-risk capabilities have sufficient approval gates
- context access matches declared source classifications
- memory consumers, writers, and promotion paths preserve sensitivity boundaries
- model profile provider references exist
- prompt set owners and approvers exist
- retrieval profiles reference declared context sources
- extension namespaces and required capabilities are compatible

Some of these checks are possible with advanced JSON Schema patterns, but encoding them there would make the schemas harder to read and harder to evolve.

`common.schema.json` defines the lexical boundary for IDs and dotted event types. The same ID pattern applies to declarations and references, while the containing field determines which resource kind a reference targets. Schemas do not infer aliases or prove that a referenced declaration exists.

[RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md) defines the broader proposed field-contract model. `common.schema.json` now implements the shared typed-reference primitive and scalar-compatible migration unions, while `ActorSet` uses strict typed references for `agentRef`, `operatedBy`, `representedBy`, and `integrationRef`. Existing manifest fields retain their unqualified `0.1` syntax until their own migration contracts are accepted and implemented.

## Extension Flexibility

Core schemas may intentionally allow some additional properties.

This flexibility exists so projects can attach namespaced extension metadata while the specification is still draft-level. Unknown fields must not be interpreted as granting access, permissions, runtime behavior, provider calls, or workflow execution.

Extension behavior should be documented under an explicit namespace and paired with declared capabilities, permissions, context sources, and approval gates where needed.

## Practical Schema Design Rules

When updating schemas:

1. Prefer small, reviewable schema changes.
2. Reuse `common.schema.json` for shared vocabulary.
3. Keep schema names aligned with manifest `kind` values.
4. Add strict enums only when the draft spec defines a stable vocabulary.
5. Keep extension points explicit.
6. Avoid encoding runtime assumptions in schemas.
7. Update docs, examples, and changelog entries for user-visible changes.
8. Add migration notes or an RFC for breaking manifest shape changes.

## Contributor Checklist

Before changing a schema, ask:

- Is this enforcing structure, or trying to enforce runtime behavior?
- Does the written specification already define this field or enum?
- Should this shape live in `common.schema.json`?
- Does at least one example demonstrate the shape?
- Would a validator author be able to produce a useful diagnostic from this schema?
- Does this change require semantic validation notes instead of schema complexity?
- Does this change affect compatibility or migration guidance?

## Relationship To Conformance

Schema validation supports draft conformance claims such as schema support and future validator support.

A tool that validates only JSON Schema conformance should not claim full NexFlow semantic conformance. Future conformance levels should distinguish schema validation, semantic validation, CLI behavior, runtime behavior, extension support, and audit behavior.

See [Conformance](conformance.md) and [Validation](validation.md) for the broader validation and support model.
