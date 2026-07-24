# Agent Identity Migration

This guide describes the `0.1` migration from duplicated effective
configuration in `AgentSet` to a compact stable AI identity.

The maintained [Minimal Team](../examples/minimal-team/) example is the first
migrated reference path. Other examples remain valid in legacy compatibility
form until they are migrated deliberately.

## Target Boundary

`AgentSet` answers who the AI agent is:

- `id`
- `displayName`
- `role`
- `description`
- `responsibilities`
- `skills`

It does not define the effective model, prompt, retrieval, permission, context,
memory, autonomy, provider, or extension configuration.

Those behavior-specific requests belong to `AgentDefinitionSet` and the
resources it references. Authorization and data policy remain authoritative in
their owning manifests.

## Simplified Shape

```yaml
specVersion: "0.1"
kind: AgentSet
metadata:
  project: minimal-team
agents:
  - id: docs-agent
    displayName: Docs Agent
    role: technical_writer
    description: Drafts documentation updates for maintainer review.
    responsibilities:
      - Keep docs aligned with examples.
      - Flag underspecified behavior.
    skills:
      - specification_writing
      - schema_review
```

In a project with `ActorSet`, an agent actor links to this identity explicitly:

```yaml
kind: agent
id: docs-agent
agentRef:
  kind: agent
  id: docs-agent
```

Equal IDs remain a readability convention, not an implicit relationship.

## Deprecated Compatibility Fields

The following `AgentSet` fields remain schema-valid for existing `0.1`
manifests but are deprecated:

- `permissions`
- `capabilities`
- `contextAccess`
- `memoryAccess`
- `autonomyLevel`
- `providerPreferences`
- `extensions`

They remain structurally validated so older examples and tools do not break
without a migration window. New or migrated AgentSet entries should omit them.

Deprecated fields:

- do not grant access
- do not select an agent definition
- do not activate a provider or extension
- do not override deny or approval-required policy
- must not be unioned with an agent definition to broaden behavior

## Behavior Source

The matching `AgentDefinitionSet` entry carries versioned requested behavior:

```yaml
agentDefinitions:
  - id: docs_agent_2026_06
    agentRef: docs-agent
    definitionVersion: "2026.06.0"
    status: draft
    components:
      modelProfileRef: docs_agent_balanced
      promptSetRef: docs_agent_prompts
      retrievalProfileRef: docs_agent_retrieval
      permissionRefs:
        - docs_write_with_review
      capabilityRefs:
        - read_repository
        - modify_documentation
      contextSourceRefs:
        - repository
        - docs
      memoryScopes:
        - ephemeral
        - task
    autonomyLevel: ask_before_changes
```

This migration does not make a draft definition active. Definition selection,
activation, effective configuration, and runtime enforcement remain separate
work.

## Migration Procedure

1. Confirm the entry represents an AI agent. Move human, automation, service,
   and authority identities to `ActorSet`.
2. Preserve the stable agent `id`, display name, role, description,
   responsibilities, and skills.
3. Confirm an `AgentDefinitionSet` entry references the agent identity.
4. Move model, prompt, retrieval, permission, capability, context, memory,
   autonomy, provider, and extension requests to the definition or its
   referenced resources.
5. Remove the deprecated duplicates from the migrated AgentSet entry.
6. Keep permission effects, context policy, memory policy, provider inventory,
   and extension lifecycle in their owning manifests.
7. Validate identity, component references, compatibility notes, and review
   requirements.

Do not infer an active definition from declaration order, file name, version
string, modification time, or provider availability.

## Compatibility Modes

| Shape | Status | Meaning |
| --- | --- | --- |
| Compact AI identity | Preferred migrated form | Identity only; behavior is requested elsewhere. |
| AI identity with deprecated fields | Supported compatibility form | Structurally valid during migration; no implicit broadening. |
| Mixed human and AI AgentSet without ActorSet | Supported legacy form | Transitional participant inventory for unmigrated projects. |
| Non-agent AgentSet entry with ActorSet | Invalid migrated identity model | Non-agent participants belong in ActorSet. |

## Version Decision

The migration remains in `specVersion: "0.1"` because:

- previously valid AgentSet fields remain accepted
- required fields are relaxed, not expanded
- only projects that migrate their own entries change authored shape
- no runtime behavior is activated

Removing deprecated fields from the schema, rejecting legacy mixed AgentSet
entries, or assigning new effective meaning to identity fields would require a
later explicit version and migration decision.

## Validation

Run:

```sh
npm run agent-identity-schema-smoke
npm run validate
npm run semantic-smoke
```

These checks validate identity shape, legacy compatibility, ActorSet bridges,
and selected component references. They do not select a definition or compute
effective behavior.

## Related Documents

- [Actor Model](actor-model.md)
- [Actor Model Migration](actor-model-migration.md)
- [Agent Definitions](agent-definitions.md)
- [Agent Assembly](agent-assembly.md)
- [Compatibility](compatibility.md)
- [Versioning](versioning.md)
- [RFC-0014: Effective Agent Configuration](../rfcs/RFC-0014-effective-agent-configuration.md)
