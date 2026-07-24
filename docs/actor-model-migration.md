# Actor Model Migration

This guide describes the supported staged migration from the mixed `AgentSet`
participant inventory to first-class `ActorSet` identity in the `0.1` draft.

The maintained [Minimal Team](../examples/minimal-team/) example is the
reference migration. Other examples intentionally remain in legacy mode until
the first path is reviewed.

## Migration Goal

The migration separates:

- common participant identity and actor kind in `ActorSet`
- stable AI identity in `AgentSet`
- versioned AI behavior in `AgentDefinitionSet`
- authorization and data boundaries in their existing policy manifests

IDs should be preserved so task, handoff, permission, approval, context, memory,
and event references remain stable.

## Before

A legacy `AgentSet` may contain both a human and an AI participant:

```yaml
kind: AgentSet
agents:
  - id: human-maintainer
    displayName: Human Maintainer
    role: maintainer
    description: Legacy human participant awaiting ActorSet migration.
    responsibilities:
      - Review project changes.
    skills:
      - specification_review
    autonomyLevel: manual_only
    # Human identity is mixed with AI-specific fields.

  - id: docs-agent
    displayName: Docs Agent
    role: technical_writer
    description: AI participant that drafts documentation updates.
    responsibilities:
      - Keep documentation consistent.
    skills:
      - specification_writing
    autonomyLevel: ask_before_changes
```

This remains schema-valid while no `ActorSet` is declared.

## After

The new actor inventory owns both participant identities:

```yaml
kind: ActorSet
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
      - Keep documentation consistent.
    agentRef:
      kind: agent
      id: docs-agent
```

`AgentSet` keeps only the AI identity during this transition:

```yaml
kind: AgentSet
agents:
  - id: docs-agent
    displayName: Docs Agent
    role: technical_writer
    description: AI participant that drafts documentation updates.
    responsibilities:
      - Keep documentation consistent.
    skills:
      - specification_writing
```

## Procedure

1. Inventory every current participant ID referenced by project maintainers,
   tasks, handoffs, permissions, approval gates, context, memory, events, agent
   definitions, and project policies.
2. Create one `ActorSet` entry for every participant. Preserve IDs unless a
   collision or incorrect identity boundary requires an explicit reviewed
   change.
3. Assign one actor kind based on what the participant represents, not where its
   process runs or which role it holds.
4. For every AI actor, keep its stable `AgentSet` declaration and add an explicit
   typed `agentRef`. Do not infer the bridge from equal IDs.
5. Move human, automation, service, and authority identities out of `AgentSet`.
6. Add required `operatedBy` or `representedBy` relationships. Add a service
   `integrationRef` only when a matching extension declaration exists.
7. Add `actors: actors.yaml` to the project manifest map.
8. Keep existing scalar participant references unchanged when their IDs were
   preserved.
9. Validate the complete manifest assembly before changing another project.

Adding the project manifest entry is the activation point. Once `ActorSet` is
present, participant references no longer fall back to maintainers or
`AgentSet`.

## Reference Preservation

The Minimal Team migration preserves these identities:

| Existing ID | New actor kind | Additional relationship | Existing references |
| --- | --- | --- | --- |
| `human-maintainer` | `human` | None | Unchanged. |
| `docs-agent` | `agent` | `agentRef` to `agent:docs-agent` | Unchanged. |

The actor and agent IDs are intentionally equal in this example. The authored
`agentRef` remains mandatory and is the only bridge.

## Compatibility Behavior

| Project state | Participant source | Result |
| --- | --- | --- |
| No `ActorSet` | Project maintainers plus legacy `AgentSet` entries | Supported transition mode. |
| Valid `ActorSet` declared | `ActorSet` only | Supported migrated mode. |
| `ActorSet` omits a referenced participant | No fallback | Semantic validation error. |
| Agent actor omits or mis-kinds `agentRef` | No inferred equal-ID bridge | Schema or semantic validation error. |
| Two actors reference one agent identity | Ambiguous bridge | Semantic validation error. |
| Operator or representative graph cycles | Invalid delegation relationship | Semantic validation error. |

ActorSet mode is intentionally fail-closed. A same-named maintainer or agent
does not repair a missing actor declaration.

## Version Decision

This migration remains in `specVersion: "0.1"` because it adds an optional
manifest kind and preserves all existing legacy manifests. The repository does
not silently reinterpret a project unless that project explicitly declares an
`ActorSet`.

A later decision is required before NexFlow can:

- require `ActorSet`
- reject human or non-agent entries in legacy `AgentSet`
- remove legacy participant fallback
- require typed object syntax in existing participant fields
- change the actor-to-agent bridge

Those changes would require synchronized schemas, examples, compatibility
notes, migration tooling, and release notes under the selected `specVersion`.

## Validation

Run from the repository root:

```sh
./scripts/schema-smoke
npm run validate
npm run actor-schema-smoke
npm run semantic-smoke
```

The checks cover schema discovery, structural validation, actor identity
resolution, explicit agent bridges, actor relationships, and selected existing
participant references. They do not prove authentication, delegation policy,
approval sufficiency, or runtime authorization.

## Rollback During Review

Before release, a migrated project can return to legacy mode by:

1. removing the `actors` manifest map entry
2. removing `actors.yaml`
3. restoring any non-agent participants to the legacy `AgentSet` shape
4. validating all preserved scalar references again

Rollback is an authoring migration, not a runtime state transition. Published
manifest snapshots should be identified by repository commit or release so
consumers do not mix identity modes accidentally.

## Privacy And Safety Checklist

- Use project-local IDs and role labels where personal names are unnecessary.
- Do not copy email addresses, directory IDs, tokens, or credentials into actor
  records.
- Do not assign authority based only on actor kind or role.
- Do not let automation or services inherit operator permissions or context.
- Keep concrete representatives visible for authority decisions.
- Review actor kind changes as behavior-significant changes.

See [Actor Model](actor-model.md), [Compatibility](compatibility.md), and
[Versioning](versioning.md) for the governing rules.
