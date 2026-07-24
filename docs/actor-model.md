# Actor Model

The Actor model gives every project participant a first-class identity without
calling humans, automations, services, or governance authorities AI agents.

This page is the normative source for the implemented `ActorSet` slice of the
current `0.1` draft. [RFC-0013](../rfcs/RFC-0013-actor-model.md) remains Draft;
features not represented here, in the schema, and in the maintained migration
example remain proposals.

## Scope

An actor identifies who or what participates in project work. An actor may own
a task, send or receive a handoff, be the subject of a permission, appear in a
context or memory boundary, request or decide an approval, or be attributed in
an event.

Actor identity does not grant:

- capabilities or permissions
- context or memory access
- autonomy or approval authority
- network access
- credentials or secret material
- provider, model, prompt, retrieval, or integration access

Those boundaries remain in their owning manifests and policies.

## Actor Kinds

The initial model defines five closed actor kinds.

| Kind | Represents | Kind-specific relationship |
| --- | --- | --- |
| `human` | A natural person participating under a project-local identity. | None. |
| `agent` | An AI participant with a separate stable `AgentSet` identity. | Required `agentRef`. |
| `automation` | A job, rule, schedule, pipeline, or deterministic process. | Required `operatedBy`. |
| `service` | A continuing software principal such as an API application or controller. | Required `operatedBy`; optional `integrationRef`. |
| `authority` | A governance, approval, or accountability principal. | Required `representedBy`. |

Actor kind is not a role, trust level, authentication method, permission, or
security clearance. Changing an existing actor's kind is behavior-significant
and requires compatibility review.

## Manifest

Actors are declared in an optional `actors.yaml` manifest with kind `ActorSet`.

```yaml
specVersion: "0.1"
kind: ActorSet
metadata:
  project: example-project
actors:
  - id: human-maintainer
    kind: human
    displayName: Human Maintainer
    description: Final human authority for accepted project changes.
    roles:
      - maintainer
    responsibilities:
      - Review proposed changes.

  - id: docs-agent
    kind: agent
    displayName: Docs Agent
    description: AI participant that drafts documentation updates.
    roles:
      - technical_writer
    responsibilities:
      - Keep specification documentation consistent.
    agentRef:
      kind: agent
      id: docs-agent
```

When present, the project manifest locates the actor inventory:

```yaml
manifests:
  actors: actors.yaml
  agents: agents.yaml
```

File names are authoring conventions. Manifest `kind`, project association, and
the project manifest map determine the logical resource.

## Common Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable, project-local actor identity. |
| `kind` | Yes | One of the five actor kinds. |
| `displayName` | Yes | Human-readable project label. |
| `description` | Yes | Purpose and identity boundary. |
| `roles` | Yes | One or more functional roles. Roles do not grant authority. |
| `responsibilities` | Yes | One or more expected responsibilities. |
| `skills` | No | Declared competence or suitability labels. |
| `agentRef` | For `agent` | Typed reference to one `AgentSet` identity. |
| `operatedBy` | For `automation` and `service` | Typed references to responsible actors. |
| `representedBy` | For `authority` | Typed references to concrete representing actors. |
| `integrationRef` | For `service`, when applicable | Typed reference to an `ExtensionSet` integration surface. |
| `extensions` | No | Namespaced actor metadata that cannot alter core semantics. |

Capabilities, permissions, context, memory, autonomy, provider preferences, and
behavioral components are intentionally absent from the common actor record.
Their owning manifests remain authoritative. This avoids turning identity into
a second effective-configuration source.

## Kind-Specific Rules

### Human

A human actor does not use `agentRef`, `operatedBy`, `representedBy`, or
`integrationRef`. Projects should prefer project-local or role-based identity
labels when a legal name is unnecessary.

### Agent

An agent actor requires exactly one explicit `agentRef` to a stable AI identity
in `AgentSet`.

```yaml
agentRef:
  kind: agent
  id: docs-agent
```

Actor ID and agent ID may be equal for readability, but equality never creates
an implicit link. Two actor declarations must not reference the same agent
identity in one manifest assembly.

The actor identifies the participant. `AgentSet` retains the current stable AI
identity declaration during migration, and `AgentDefinitionSet` describes
versioned requested behavior. The compact AgentSet migration keeps identity,
role, description, responsibilities, and skills while deprecating duplicated
behavior fields without changing the explicit bridge.

### Automation

An automation actor requires at least one `operatedBy` actor reference. It must
not use an AI agent kind to hide model-backed behavior, and it does not inherit
the operator's credentials, permissions, context, or memory.

### Service

A service actor requires at least one `operatedBy` actor reference. It may use
`integrationRef` to identify a declared extension surface. The extension does
not grant the service access or credentials.

### Authority

An authority actor requires at least one `representedBy` actor reference. An
authority owns governance responsibility; a representing human, automation, or
service remains visible in approvals and audit records. Authority kind alone
does not make an approval valid.

## Typed Reference Contracts

Actor relationships use the shared typed-reference object introduced in
`common.schema.json`.

```yaml
kind: actor
id: human-maintainer
```

The common logical tuple contains `kind`, `id`, and optional `scope`. Actor model
relationships are assembly-scoped, so authored `scope` is prohibited in the
initial fields.

The shared schema also provides scalar-compatible reference unions for future
field-by-field migrations. A field must opt into that union explicitly. The new
Actor relationship fields do not opt in and therefore require typed objects
from their first authored version.

| Field | Cardinality | Allowed target kind | Scope | Scalar form |
| --- | --- | --- | --- | --- |
| `actors[].agentRef` | One | `agent` | Manifest assembly | Not accepted. |
| `actors[].operatedBy[]` | One or more | `actor` | Manifest assembly | Not accepted. |
| `actors[].representedBy[]` | One or more | `actor` | Manifest assembly | Not accepted. |
| `actors[].integrationRef` | Zero or one | `extension` | Manifest assembly | Not accepted. |

These contracts are closed. A wrong kind, unresolved ID, duplicate bridge, or
relationship cycle is invalid. Reference resolution does not authorize the
selected resource.

Existing participant fields such as task `owner`, permission `subjects`, and
handoff endpoints retain their scalar IDs during this migration because their
effective target is deterministic once the project identity mode is known.

## Identity Resolution Modes

The `0.1` draft supports two explicit modes during migration.

### ActorSet Mode

When an `ActorSet` is present in the project assembly:

- `ActorSet` is the authoritative participant identity namespace
- participant references resolve only to declared actors
- `Project.project.maintainers[]` must also resolve to actors
- every `AgentSet` identity must have one explicit agent actor bridge
- legacy participant inference from maintainers or `AgentSet` is disabled

This fail-closed rule prevents a missing actor declaration from being repaired
silently by a legacy identity with the same ID.

### Legacy Mode

When no `ActorSet` is present, current `0.1` manifests remain valid. Repository
semantic checks continue to treat project maintainers and `AgentSet` entries as
the transitional participant inventory.

Legacy mode exists for migration compatibility. It does not make human entries
AI agents and should not be used as the design target for new participant kinds.

## Safety And Privacy

- Actor kind, role, responsibility, skill, or relationship never grants access.
- Raw credentials, tokens, account secrets, and private identity-provider IDs
  do not belong in actor manifests.
- Humans should not need personal email addresses or legal names in public
  manifests.
- Automations and services do not inherit an operator's authority or context.
- Authorities must preserve concrete attribution and must not hide self-approval.
- Unsupported kinds and unresolved relationships fail validation.
- Runtime authentication and declared-to-concrete identity binding remain
  outside the public specification manifest.

## Validation Boundaries

JSON Schema validates:

- required actor identity fields
- the closed actor kind vocabulary
- required and prohibited kind-specific fields
- typed reference shape, target kind, and assembly scope
- non-empty role, responsibility, operator, and representative lists

The repository semantic smoke additionally checks:

- unique actor IDs
- project maintainer resolution in ActorSet mode
- agent, operator, representative, and extension references
- one actor bridge for each declared AI agent
- duplicate agent bridges
- actor relationship cycles
- existing task, handoff, permission, approval, context, and memory references
  against the selected identity mode

Validation does not authenticate a person or service, evaluate full delegation
policy, establish approval sufficiency, or enforce runtime authorization.

## Compatibility

Adding an optional `ActorSet` and typed-reference primitives is additive within
the current `0.1` draft. A project changes its participant resolution behavior
only when it explicitly declares an `ActorSet`.

Removing legacy mode, requiring `ActorSet`, changing actor kind, or changing an
existing participant field to require typed object syntax would be breaking and
requires a later explicit version and migration decision.

See [Actor Model Migration](actor-model-migration.md) for the maintained staged
path.

## Related Models

- [Concepts](concepts.md)
- [Agent Definitions](agent-definitions.md)
- [Manifest Reference](manifest-reference.md)
- [Capability Model](capability-model.md)
- [Approval Gates](approval-gates.md)
- [Event Model](events.md)
- [Compatibility](compatibility.md)
- [RFC-0013: Actor Model](../rfcs/RFC-0013-actor-model.md)
- [RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md)
