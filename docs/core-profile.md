# Core Profile

The NexFlow Core Profile is the minimum useful, fail-closed project
description. It identifies one project and one authoritative participant
inventory without requiring empty workflow, policy, provider, memory, event, or
extension manifests.

The profile is an authoring and validation contract. It does not execute work,
grant authority, select a provider, activate an integration, or establish
`NF-RUNTIME` conformance.

Machine-readable source: [`profiles/core.yaml`](../profiles/core.yaml).
Definition schema:
[`profiles/core-profile.schema.json`](../profiles/core-profile.schema.json).
Design source: [RFC-0016](../rfcs/RFC-0016-core-profile-and-discovery.md).

## Required Slots

| Slot | Requirement | Resolution |
| --- | --- | --- |
| Project | Exactly one `Project` document. | More than one or none is incomplete. |
| Participant inventory | One authoritative participant source. | Use `ActorSet` when present; otherwise use `AgentSet` as the `0.1` legacy fallback. |

`ActorSet` and `AgentSet` may both be present. In that migrated shape,
`ActorSet` owns participant identity and `AgentSet` supplies stable AI identity
for explicit agent references. Equal IDs do not create an implicit bridge.

A core-only assembly describes identity and responsibility. It declares:

- no task or workflow
- no action authorization
- no external context source
- no memory scope
- no provider availability
- no event contract
- no extension behavior

## Project Source Hints

`Project.manifests` is optional in the current `0.1` draft. When present, it is
a map of loading hints. Its paths are not resource IDs, do not grant behavior,
and do not replace validation of each loaded document's `kind`, project
association, or references.

The previous schema required paths for every historical module. Existing
complete maps remain valid. Reduced projects may omit the map or list only
adopted modules.

The map now accepts either the existing singular `workflow` hint or a
non-empty, unique `workflows` list. The forms cannot coexist. The focused
[Manifest Discovery](manifest-discovery.md) slice resolves these hints within
one explicit local root, verifies expected kinds and project association, and
retains every unique workflow by `workflow.id`.

This additive compatibility change entered `specVersion: "0.1"` before
`v0.1.0-rc.1` and remains part of `v0.1.0`. It broadens authoring compatibility
without invalidating complete projects.

## Optional Module Qualifiers

Optional modules can be added in any order when their dependencies are
satisfied.

| Qualifier | Minimum manifest kinds | Purpose |
| --- | --- | --- |
| `policy` | `CapabilitySet`, `PermissionSet` | Action vocabulary and authorization policy. |
| `work-planning` | `TaskSet` | Tasks, ownership, dependencies, artifacts, and acceptance criteria. |
| `workflow` | `Workflow` | Inspectable stages, steps, dependencies, and gates. |
| `handoff` | `HandoffSet` | Responsibility and artifact transfer. |
| `context` | `ContextSet` | Information sources and access boundaries. |
| `memory` | `MemorySet` | Retention, ownership, visibility, and reuse boundaries. |
| `agent-behavior` | `AgentDefinitionSet` | Versioned behavior; referenced model, prompt, retrieval, policy, context, memory, and extension resources become required through dependency closure. |
| `provider-inventory` | `ProviderSet` | Provider-neutral availability and constraints. |
| `events-audit` | `EventSet` | Event type and audit declarations. |
| `extensions` | `ExtensionSet` | Namespaced integration declarations. |

A manifest may be added before the project claims its broader qualifier. For
example, `CapabilitySet` can be introduced before `PermissionSet`. The assembly
may still satisfy `core`, but it must not claim the `policy` qualifier until
both minimum kinds are present.

## Profile Conformance

A normalized assembly satisfies the Core Profile only when:

1. Every present supported document is structurally valid for `specVersion`.
2. Exactly one `Project` is present.
3. `ActorSet` or the legacy `AgentSet` fallback supplies participant inventory.
4. Every requested profile qualifier has its minimum manifest kinds.
5. Every authored reference resolves to a declaration in its target module or
   required slot.
6. Reference and semantic dependencies are closed transitively.
7. No required dependency is unsupported by the validating tool's claim.
8. Unknown modules contribute no core semantics or authority.

Profile checks should distinguish:

- `conformant` - required slots, requested qualifiers, and dependencies pass
- `incomplete` - a required slot, qualifier kind, or dependency is missing
- `unsupported` - a required module is outside the tool's declared support

Passing `core` does not establish complete `NF-MANIFEST`, `NF-SCHEMA`, or
`NF-SEMANTIC` conformance unless those broader checks are also claimed and
evidenced.

## Dependency Closure

Optionality ends when a resource is referenced. A task capability reference
requires `CapabilitySet`; a workflow task binding requires `TaskSet`; an agent
definition component requires its owning profile or policy manifest.

Dependency closure is transitive. If a present agent definition references a
model profile and that model profile references a provider, both
`ModelProfileSet` and `ProviderSet` are required.

Missing targets are errors. Validators must not synthesize empty manifests,
guess by file name, or treat an absent policy as unrestricted access.

The machine-readable dependency table in `profiles/core.yaml` records the
current major field-to-module edges. Exact target namespaces remain governed by
the manifest reference and semantic reference inventory.

## Safe Incremental Adoption

A project can grow through small, reviewable changes:

1. Add `Project` and participant inventory.
2. Add capabilities, permissions, and approval gates before claiming action
   authorization.
3. Add tasks, then workflows or handoffs as needed.
4. Add context and memory independently with explicit access and retention
   boundaries.
5. Add versioned agent behavior and only the components it references.
6. Add providers, events, and extensions when the corresponding declarations
   are needed.

The sequence is guidance, not a mandatory lifecycle. Dependency closure and
fail-closed omission apply at every stage.

## Implemented Boundary

The repository currently provides:

- the machine-readable Core Profile definition and schema
- a Project schema that accepts reduced source-hint maps
- focused conformance and dependency-closure fixtures
- focused explicit-file and Project source-hint discovery with multiple unique
  Workflow documents
- one reduced maintained Core Profile example and six complete examples that
  remain backward-compatible

The repository does not yet provide directory scanning, a separate project
index, bundle discovery, stable CLI diagnostics, complete dependency closure
over discovered documents, a reference CLI, or runtime preflight. Those remain
separate specification and tooling work.
