# Minimal Team Example

A tiny project with one human maintainer and one documentation-focused agent.

This example shows the smallest useful NexFlow shape: explicit capabilities, gated documentation writes, project context, task memory, workflow dependencies, and a review handoff.

## What This Example Teaches

Use this example to learn the core NexFlow pattern without enterprise policy, multi-agent coordination, external issue trackers, or release gates.

It demonstrates:

- one human actor as the final authority
- one AI agent with review-gated documentation responsibilities
- separate capability and permission declarations
- one approval gate reused across project policy, permissions, tasks, workflow, and agent definition review
- explicit context sources for repository and documentation access
- ephemeral, task, and project memory boundaries
- provider-neutral model, prompt, and retrieval references
- a two-step workflow with one handoff from agent to human

## Reading Path

Read the files in this order:

1. `project.yaml` defines the project, maintainer, default autonomy, policies, approval gate, and manifest file map.
2. `agents.yaml` introduces the human maintainer and the docs agent.
3. `capabilities.yaml` defines what actors can technically do.
4. `permissions.yaml` decides which capabilities are allowed or approval-gated.
5. `agent-definitions.yaml` assembles the docs agent's model, prompt, retrieval, permission, context, memory, autonomy, and extension references into a reviewable behavioral release.
6. `tasks.yaml` shows the work units and required capabilities.
7. `workflow.yaml` orders the draft and review tasks.
8. `handoffs.yaml` transfers responsibility from the docs agent to the maintainer.
9. `events.yaml` declares the audit events expected around tasks, reviews, and handoffs.
10. `context.yaml`, `retrieval-profiles.yaml`, and `memory.yaml` explain what the agent may read, cite, and retain.
11. `providers.yaml`, `model-profiles.yaml`, `prompt-sets.yaml`, and `extensions.yaml` show provider-neutral configuration references without implementing provider calls or integrations.

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
| Human authority | `human-maintainer` | `project.yaml`, `agents.yaml`, `permissions.yaml`, `tasks.yaml`, `handoffs.yaml` |
| AI participant | `docs-agent` | `agents.yaml`, `agent-definitions.yaml`, `tasks.yaml`, `handoffs.yaml` |
| Approval gate | `human_review` | `project.yaml`, `permissions.yaml`, `tasks.yaml`, `workflow.yaml`, `agent-definitions.yaml` |
| Documentation task | `draft-doc-update` | `tasks.yaml`, `workflow.yaml` |
| Review task | `review-doc-update` | `tasks.yaml`, `workflow.yaml` |
| Handoff | `docs-to-maintainer` | `handoffs.yaml` |
| Behavioral release | `docs_agent_2026_06` | `agent-definitions.yaml` |
| Model profile | `docs_agent_balanced` | `model-profiles.yaml`, `agent-definitions.yaml` |
| Prompt set | `docs_agent_prompts` | `prompt-sets.yaml`, `agent-definitions.yaml` |
| Retrieval profile | `docs_agent_retrieval` | `retrieval-profiles.yaml`, `agent-definitions.yaml` |

## Safety Notes

- `read_repository` is allowed for the maintainer and available to the docs agent through review-gated documentation work.
- `modify_documentation` is approval-gated for the docs agent.
- `approve_changes` belongs to the human maintainer.
- Network access is disabled unless a task explicitly requests approval.
- Destructive and production actions are not part of this example.
- Raw secrets, credentials, and private prompt text are not stored in manifests.

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
