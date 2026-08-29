# Minimal Team Example

Minimal Team is the shortest maintained path into NexFlow. It describes one
project, one human maintainer, and one AI participant in three manifests:

```text
project.yaml -> actors.yaml -> agents.yaml
```

This is a Core Profile authoring example, not an executable team. It declares
identity and responsibility only. It grants no capability, permission,
context, memory, provider, extension, network access, or runtime authority.

## Start Here

From the repository root:

```sh
npm ci --ignore-scripts
npm run cli-prototype -- validate --root examples/minimal-team
```

The command performs bounded discovery and structural JSON Schema validation.
It does not perform complete semantic validation or execute the manifests.

Read the files in this order:

1. [`project.yaml`](project.yaml) names the project and its human maintainer,
   then points to the adopted participant manifests.
2. [`actors.yaml`](actors.yaml) is the authoritative participant inventory. It
   distinguishes the human from the AI actor and keeps final human authority
   visible.
3. [`agents.yaml`](agents.yaml) defines stable AI identity. The explicit
   `agentRef` in `actors.yaml` is the bridge; matching IDs alone are not.

That is enough to describe who participates and what each participant is
responsible for. Omitted modules stay absent and grant nothing.

## What To Change First

When adapting the example, choose a lowercase project ID and update it in:

- `project.id`
- every `metadata.project`
- the maintainer and participant IDs when their identities differ
- each explicit typed reference after an ID changes

Keep the actor-to-agent bridge explicit. Do not add empty manifests merely to
make the directory look complete.

## Grow In Layers

Add only the layer the project needs, and close every dependency introduced by
its references.

| Step | Add | Read first | What it does not imply |
| ---: | --- | --- | --- |
| 1 | `CapabilitySet` and `PermissionSet`, plus approval gates when needed | [Capability Model](../../docs/capability-model.md), [Approval Gates](../../docs/approval-gates.md) | A declared capability is not permission or execution. |
| 2 | `TaskSet`, then optional `Workflow` and `HandoffSet` | [Core Profile](../../docs/core-profile.md), [Handoff Protocol](../../docs/handoff-protocol.md) | Authored work is not scheduled or run. |
| 3 | `ContextSet` and `MemorySet` | [Context Model](../../docs/context-model.md), [Memory Model](../../docs/memory-model.md) | A source or scope is not live access or storage. |
| 4 | `AgentDefinitionSet` and every referenced policy, model, prompt, retrieval, context, memory, and extension component | [Agent Identity Migration](../../docs/agent-identity-migration.md), [Effective Agent Configuration](../../docs/effective-agent-configuration.md) | A definition requests behavior but grants no authority. |
| 5 | Providers, events, and extensions when they are actually adopted | [Provider Abstraction](../../docs/provider-abstraction.md), [Events](../../docs/events.md), [Extensions](../../docs/extensions.md) | Declarations do not connect to external systems. |

The [Core Profile](../../docs/core-profile.md) defines required slots, optional
qualifiers, and dependency closure. The sequence above is a learning path, not
a mandatory lifecycle.

## Advanced Agent Versioning

Do not begin onboarding by selecting models and prompts. First establish stable
actor and agent identity. Then add versioned behavior in this order:

1. Keep identity in `AgentSet` compact and stable.
2. Add one draft `AgentDefinitionSet` entry that references the agent.
3. Add only the component manifests referenced by that definition.
4. Review component lifecycle, compatibility impact, permissions, and data
   boundaries.
5. Mark exactly one unscoped definition active only after it satisfies the
   complete active-definition contract.

Use these documents for that transition:

- [Agent Identity Migration](../../docs/agent-identity-migration.md)
- [Agent Definitions](../../docs/agent-definitions.md)
- [Effective Agent Configuration](../../docs/effective-agent-configuration.md)
- [Model Profiles](../../docs/model-profiles.md)
- [Prompt Sets](../../docs/prompt-sets.md)
- [Retrieval Profiles](../../docs/retrieval-profiles.md)

Focused repository checks demonstrate active-definition completeness and
selection failures. Minimal Team intentionally stops before behavior selection
so the first useful example stays small.

## Next Example

Read [Software Team](../software-team/) when you need a complete project-level
composition with tasks, workflow, policy, context, memory, providers, events,
and extensions. Its agent definitions are draft declarations, not active
runtime configuration.

Use the [Example Matrix](../MATRIX.md) to choose a domain-specific example and
the [Example Consistency Checklist](../CHECKLIST.md) before changing a complete
example.
