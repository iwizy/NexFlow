# Minimal Team Example

A tiny project with one human maintainer and one documentation-focused agent.

This example shows the smallest useful NexFlow shape: explicit capabilities, gated documentation writes, project context, task memory, workflow dependencies, and a review handoff.

## What This Example Teaches

Use this example to learn the core NexFlow pattern without enterprise policy, multi-agent coordination, external issue trackers, or release gates.

It demonstrates:

- one human actor as the final authority
- one AI agent with approval-gated documentation responsibilities
- an authoritative `ActorSet` with an explicit typed actor-to-agent bridge
- a compact AgentSet that contains stable AI identity without duplicated behavior fields
- one complete active agent definition that is authoritative for requested
  behavior
- fail-closed human override with approval-gated resume and audit events
- separate capability and permission declarations
- one approval gate reused across project policy, permissions, tasks, workflow, and agent definition review
- explicit context sources for repository and documentation access
- ephemeral, task, and project memory boundaries
- provider-neutral model, prompt, and retrieval references
- a two-step workflow with one handoff from agent to human

## Reading Path

Read the files in this order:

1. `project.yaml` defines the project, maintainer, default autonomy, network and human override policies, approval gate, and manifest file map.
2. `actors.yaml` declares the human and agent participant identities.
3. `agents.yaml` declares the stable AI identity linked by the agent actor.
4. `capabilities.yaml` defines what actors can technically do.
5. `permissions.yaml` decides which capabilities are allowed or approval-gated.
6. `agent-definitions.yaml` selects the docs agent's unique active behavioral
   release and requests model, prompt, retrieval, permission, context, memory,
   autonomy, and extension components.
7. `tasks.yaml` shows the work units and required capabilities.
8. `workflow.yaml` orders the draft and review tasks.
9. `handoffs.yaml` transfers responsibility from the docs agent to the maintainer.
10. `events.yaml` declares the audit events expected around tasks, reviews, and handoffs.
11. `context.yaml`, `retrieval-profiles.yaml`, and `memory.yaml` explain what the agent may read, cite, and retain.
12. `providers.yaml`, `model-profiles.yaml`, `prompt-sets.yaml`, and `extensions.yaml` show provider-neutral configuration references without implementing provider calls or integrations.

## Smallest Useful Flow

```text
docs-agent drafts docs_patch
  -> human_review gate
  -> human-maintainer reviews
  -> review.completed event
```

The workflow is intentionally conservative. The docs agent can draft documentation work, but the human maintainer remains the authority for accepting changes.

## Key Reference Chain

| Concept | Example ID | Where It Appears |
| --- | --- | --- |
| Human authority | `human-maintainer` | `actors.yaml`, `project.yaml`, `permissions.yaml`, `tasks.yaml`, `handoffs.yaml` |
| AI participant | `docs-agent` | `actors.yaml`, `agents.yaml`, `agent-definitions.yaml`, `tasks.yaml`, `handoffs.yaml` |
| Approval gate | `human_review` | `project.yaml`, `permissions.yaml`, `tasks.yaml`, `workflow.yaml`, `agent-definitions.yaml` |
| Human override | `humanOverride` | `project.yaml`, `events.yaml` |
| Documentation task | `draft-doc-update` | `tasks.yaml`, `workflow.yaml` |
| Review task | `review-doc-update` | `tasks.yaml`, `workflow.yaml` |
| Handoff | `docs-to-maintainer` | `handoffs.yaml` |
| Behavioral release | `docs_agent_2026_06` | `agent-definitions.yaml` |
| Model profile | `docs_agent_balanced` | `model-profiles.yaml`, `agent-definitions.yaml` |
| Prompt set | `docs_agent_prompts` | `prompt-sets.yaml`, `agent-definitions.yaml` |
| Retrieval profile | `docs_agent_retrieval` | `retrieval-profiles.yaml`, `agent-definitions.yaml` |

## Safety Notes

- `read_repository` is allowed for the maintainer and available to the docs agent through approval-gated documentation work.
- `modify_documentation` is approval-gated for the docs agent.
- `approve_changes` belongs to the human maintainer.
- The active definition is authoritative for requested behavior but does not
  grant any capability, permission, context, memory, provider, or network
  access.
- The active prompt and retrieval profiles are reviewed lifecycle components;
  their status still does not execute or authorize them.
- Network access is disabled unless a task explicitly requests approval.
- Human override blocks new target actions, requests a stop for in-flight work, remains blocked on failure, and requires `human_review` plus a reason before resume.
- Destructive and production actions are not part of this example.
- Raw secrets, credentials, and private prompt text are not stored in manifests.

The active lifecycle demonstrates selection and validation semantics only. No
agent, provider, workflow, or event is executed by this repository.

## What Is Intentionally Omitted

This example does not model:

- pull request creation
- dependency installation
- deployment
- production access
- external issue trackers
- live provider resolution
- runtime orchestration
- long-term organization memory
- multi-agent review loops

Use the larger examples when those concerns matter.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/minimal-team/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
