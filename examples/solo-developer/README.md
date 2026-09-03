# Solo Developer Example

This example describes one human developer working with one AI coding
assistant on a small local project. It is intentionally compact: ten manifests
show identity, capability, permission, work, context, handoff, and event
boundaries without adding provider, model, prompt, memory, extension, or runtime
configuration.

It is an authoring and review example, not an executable assistant. Declarations
do not connect a model, grant operating-system access, run commands, modify
files, or approve changes.

## Scenario

The solo maintainer defines a small change, an assistant drafts a patch and
validation report, and the maintainer reviews the evidence and makes the final
decision. The workflow keeps these responsibilities separate even though one
human owns the project.

The example demonstrates:

- ActorSet as the authoritative inventory for one human and one AI actor
- compact AgentSet identity with an explicit actor-to-agent bridge
- low-risk read capabilities separated from approval-gated writes and commands
- a three-task dependency chain and Workflow-scoped step graph
- an assistant-to-human handoff carrying patch and validation artifacts
- local repository context without network or provider declarations
- explicit events for completion, handoff, and review evidence

## Read And Validate

Read the files in this order:

1. [`project.yaml`](project.yaml), [`actors.yaml`](actors.yaml), and
   [`agents.yaml`](agents.yaml) establish human authority and AI identity.
2. [`capabilities.yaml`](capabilities.yaml) and
   [`permissions.yaml`](permissions.yaml) separate ability from policy.
3. [`context.yaml`](context.yaml) limits declared context to local project files.
4. [`tasks.yaml`](tasks.yaml), [`workflow.yaml`](workflow.yaml), and
   [`handoffs.yaml`](handoffs.yaml) describe reviewable work and responsibility.
5. [`events.yaml`](events.yaml) names the evidence-producing transitions.

From the repository root:

```sh
npm run cli-prototype -- validate --root examples/solo-developer
node scripts/cli-prototype.mjs inspect --root examples/solo-developer
node scripts/cli-prototype.mjs graph --root examples/solo-developer
```

These commands perform local structural checks and static projections only.
They do not perform complete semantic validation or execute the workflow.

## Safety Posture

The coding assistant can be described as reading the declared repository and
context. Repository writes and command execution are approval-gated. Network
access, dependency installation, deployment, secret access, destructive
actions, and production actions are not granted.

The permission declarations do not create an effective agent configuration.
This example intentionally omits AgentDefinitionSet and all model, prompt,
retrieval, provider, memory, and extension components. Add those modules only
when their references, lifecycle, compatibility, and safety policies can be
reviewed together.

Use [Minimal Team](../minimal-team/) for the three-manifest identity-only start.
Use [Software Team](../software-team/) when separate implementation, QA,
review, and documentation roles require a complete project composition.
