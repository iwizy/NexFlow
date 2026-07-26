# Typed References

Typed references identify one NexFlow resource by target kind, exact ID, and,
when required by a field contract, owner scope.

The current `0.1` draft implements the shared authored shapes in
`schemas/common.schema.json` and uses strict typed references for ActorSet
relationships and human override authorities. Other manifest fields keep their
existing scalar syntax until each field contract is migrated deliberately.

Typed references identify resources. They do not grant capabilities,
permissions, context, memory, autonomy, provider access, extension access, or
approval.

Related documents:

- [Manifest Reference](manifest-reference.md#identifier-references)
- [Semantic Reference Inventory](semantic-reference-inventory.md)
- [Actor Model](actor-model.md#typed-reference-contracts)
- [Actor Model Migration](actor-model-migration.md)
- [RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md)

## Accepted Primitive

The shared logical form is:

```yaml
kind: agent
id: docs-agent
```

A nested resource may include an explicit owner scope when its field contract
requires one:

```yaml
kind: workflow-step
id: publish-release
scope:
  kind: workflow
  id: release-workflow
```

| Field | Required | Meaning |
| --- | --- | --- |
| `kind` | Yes | Closed target-kind token from the selected specification version. |
| `id` | Yes | Exact, case-sensitive ID in the selected target namespace. |
| `scope` | Field-specific | Explicit owner namespace for a nested target. |
| `scope.kind` | With `scope` | Kind of the owning resource. |
| `scope.id` | With `scope` | Exact ID of the owning resource. |

The object is closed. It cannot contain aliases, fallback targets, file paths,
URLs, versions, credentials, provider preferences, or inline policy.

## Shared Schema Definitions

`common.schema.json` provides:

| Definition | Purpose |
| --- | --- |
| `referenceTargetKind` | Closed core target-kind vocabulary. |
| `typedReferenceScope` | Closed `kind` and `id` owner tuple. |
| `typedReference` | Generic `kind`, `id`, and optional `scope` object. |
| `resourceReference` | Transitional union of one scalar ID or typed object. |
| `resourceReferenceList` | Unique list of transitional scalar or typed references. |
| `actorReference` | Strict assembly-scoped reference with `kind: actor`. |
| `agentReference` | Strict assembly-scoped reference with `kind: agent`. |
| `extensionReference` | Strict assembly-scoped reference with `kind: extension`. |

The transitional unions are reusable building blocks, not permission for any
field to accept both forms. An owning schema must opt into a union explicitly
after its target-kind, scope, compatibility, and migration rules are accepted.

The three strict kind-specific definitions prohibit authored `scope` because
their current field contracts resolve in one manifest assembly.

## Target Kind Vocabulary

The common registry recognizes these core tokens:

| Namespace group | Target kinds |
| --- | --- |
| Project and participant | `project`, `project-maintainer`, `actor`, `agent` |
| Agent behavior | `agent-definition`, `model-profile`, `prompt-set`, `prompt`, `retrieval-profile` |
| Policy and access | `capability`, `permission`, `approval-gate`, `context-source`, `memory-scope`, `provider`, `extension` |
| Work and evidence | `task`, `workflow`, `workflow-stage`, `workflow-step`, `handoff`, `artifact` |

Recognizing a target-kind token does not make every field able to reference
that kind. The containing field contract remains authoritative for:

- allowed target kinds
- scalar or object authored form
- cardinality
- implicit or explicit scope
- compatibility behavior
- semantic resolution and diagnostics

An extension cannot add a core target kind or widen a core field contract
silently.

## Lexical Rules

Target IDs and scope IDs use the common NexFlow ID rule:

- start with a lowercase ASCII letter
- contain lowercase ASCII letters and digits
- use single hyphens or underscores only between non-empty segments
- contain at most 128 characters
- preserve exact case and separator style

Valid IDs:

```text
docs-agent
read_repository
release-workflow
implementation_agent_2026_06
```

Invalid IDs:

```text
DocsAgent
1-docs-agent
docs--agent
docs_agent_
agent.started
```

Target kinds are exact closed enum values such as `agent`,
`workflow-step`, and `context-source`. `Agent`, `workflow_step`, and unknown
kind names are invalid.

Tools MUST NOT:

- lowercase or trim IDs
- rewrite hyphens and underscores
- infer aliases
- search unrelated kinds or scopes
- resolve by file name, path, declaration order, lifecycle, or version
- interpret `agent:docs-agent` or `agents/docs-agent` as typed syntax

Event types such as `agent.started` use a separate dotted vocabulary and are not
resource IDs.

## Field Contracts

A field contract decides how the logical tuple is authored and resolved.

### Deterministic Scalar Field

A field with exactly one target kind and one deterministic scope may retain a
scalar ID:

```yaml
components:
  modelProfileRef: docs_agent_balanced
```

The containing field identifies `model-profile` as the target kind. No rewrite
is required merely to make the syntax visually uniform.

### Strict Typed Field

New multi-kind or identity-sensitive fields may require typed objects from
their first version:

```yaml
agentRef:
  kind: agent
  id: docs-agent
```

ActorSet `agentRef`, `operatedBy`, `representedBy`, and `integrationRef` use
strict typed contracts today. Human override `authorities` reuses the strict
actor reference.

### Transitional Field

A field migration may temporarily accept either:

```yaml
owner: release-manager
```

or:

```yaml
owner:
  kind: actor
  id: release-manager
```

This example illustrates `resourceReference`; it does not change the current
`owner` schema. A real migration must state the affected field, allowed kinds,
scope, warning behavior, removal version, and rollback path.

### Explicitly Scoped Field

Nested targets require scope only when the owner cannot be derived from the
containing field:

```yaml
kind: workflow-step
id: publish-release
scope:
  kind: workflow
  id: release-workflow
```

The generic primitive validates this shape. No current workflow or artifact
field is migrated by this document.

## Migration Rules

### Existing Single-Kind References

Keep exact scalar IDs when the field has one accepted kind and scope. Validators
may normalize them internally to a logical tuple, but ordinary validation must
not rewrite source manifests.

```yaml
capabilityRefs:
  - read_repository
  - modify_documentation
```

### ActorSet Adoption

Add explicit typed relationships while preserving stable IDs:

```yaml
actors:
  - id: docs-agent
    kind: agent
    displayName: Documentation Agent
    description: Maintains project documentation.
    roles:
      - technical_writer
    responsibilities:
      - Keep documentation consistent.
    agentRef:
      kind: agent
      id: docs-agent
```

Equal actor and agent IDs do not create an implicit bridge. The typed
`agentRef` is required.

### Multi-Kind References

Do not migrate a multi-kind scalar by searching all namespaces and choosing the
first match. A safe migration requires:

1. an accepted allowed-kind set
2. an accepted scope rule
3. exact lookup in allowed namespaces only
4. one unambiguous target
5. a documented compatibility window
6. negative fixtures for missing, ambiguous, wrong-kind, and invalid-scope
   inputs

Current approval gate targets remain unchanged until their field-specific
contract is accepted. The generic primitive alone does not make those scalar
values safe or typed.

### Rollback

A rollback must restore the exact authored form supported by the earlier field
contract and re-run schema plus semantic validation. It must not discard target
kind information when the earlier scalar form would be ambiguous.

## Resolution Contract

After schema validation, a semantic resolver should:

1. select the field contract for the source field and `specVersion`
2. determine allowed target kinds and effective scope
3. validate typed kind and scope against that contract
4. build exact declaration indexes from the logical manifest assembly
5. reject duplicate declarations at one canonical identity
6. resolve exact kind, ID, and scope
7. distinguish unresolved, ambiguous, wrong-kind, and invalid-scope failures
8. preserve authored values and source locations for diagnostics

A successful resolution creates an association only. Policy evaluation remains
separate.

## Validation Evidence

Run the focused primitive checks:

```sh
npm run typed-reference-schema-smoke
```

The command covers:

- every registered target-kind token
- required `kind` and `id`
- ID lexical boundaries
- closed object shapes
- optional scope structure
- rejection of compact and path-like strings
- transitional scalar and object unions
- list uniqueness
- strict actor, agent, and extension kind constraints
- prohibition of scope in current assembly-scoped contracts

ActorSet schema checks exercise the strict definitions in real manifest fields:

```sh
npm run actor-schema-smoke
```

Semantic smoke checks resolve current ActorSet relationships and selected
cross-manifest references:

```sh
npm run semantic-smoke
```

Schema checks do not prove target existence, uniqueness, eligibility, graph
consistency, or authorization. Semantic smoke remains partial repository
maintenance tooling and does not establish complete typed-reference
conformance.

## Compatibility And Conformance

Adding the common definitions and new strict ActorSet fields is additive inside
the unreleased `0.1` draft. Requiring typed objects in an existing scalar field,
changing its allowed kinds or scope, or removing a transitional scalar form may
be breaking.

A tool must not claim complete typed-reference support merely because it can
parse `kind` and `id`. Such a claim also requires field-contract coverage,
exact semantic resolution, duplicate and ambiguity handling, scope handling,
diagnostics, and migration behavior for the claimed specification version.

## Current Status

Implemented:

- common typed, scoped, transitional, and kind-specific schema definitions
- closed target-kind and ID lexical validation
- strict ActorSet relationship fields
- strict human override authority references
- focused primitive schema checks
- ActorSet structural and selected semantic reference checks
- migration guidance for the implemented slice

Specified but not fully implemented:

- complete target-kind symbol tables
- stable `NF-REF-*` diagnostics
- field-contract registry
- generic semantic resolver
- approval target normalization
- nested workflow and artifact scope migration
- complete typed-reference conformance fixtures

No runtime, reference CLI, provider integration, or orchestration behavior is
added by this model.
