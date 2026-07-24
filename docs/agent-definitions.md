# Agent Definitions

Agent definitions describe versioned behavioral releases of agents. The unique
unscoped definition with `status: active` for an agent is authoritative for
that agent's requested behavior.

They are specification metadata. They do not run agents, call providers, load prompts, retrieve context, grant permissions, grant context access, write memory, or bypass approval gates.

## Purpose

An agent identity explains who an agent is in a team. An agent definition describes a versioned behavioral release. Agent assembly is the wider relationship and review checkpoint connecting that identity and definition to referenced components.

An agent definition can describe:

- stable definition identifiers
- agent identity references
- definition versions
- lifecycle status
- model profile references
- prompt set references
- retrieval profile references
- permission and capability references
- context source references
- memory scope access
- autonomy level
- extension references
- change summaries
- review and activation expectations
- compatibility impact
- audit metadata expected from a future runtime

Agent definitions are the versioned behavioral release resources used by agent
assembly and proposed in
[RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md). See
[Effective Agent Configuration](effective-agent-configuration.md) for
selection, authority, and policy composition.

## Manifest

Agent definitions may be declared in `agent-definitions.yaml`.

```yaml
specVersion: "0.1"
kind: AgentDefinitionSet
metadata:
  project: example-project
agentDefinitions:
  - id: backend_reviewer_2026_06
    agentRef: backend-reviewer
    definitionVersion: "2026.06.0"
    status: active
    owner: human-tech-lead
    description: Backend reviewer behavioral release for API and migration review.
    components:
      modelProfileRef: backend_reviewer_model
      promptSetRef: backend_reviewer_prompts
      retrievalProfileRef: backend_reviewer_retrieval
      permissionRefs:
        - backend_review_permissions
      capabilityRefs:
        - read_repository
        - read_context
        - approve_changes
      contextSourceRefs:
        - repository
        - docs
      memoryScopes:
        - ephemeral
        - task
      extensionRefs:
        - github_basic
    autonomyLevel: ask_before_changes
    changeSummary: Adds migration review retrieval profile and reviewed safety prompt set.
    review:
      required: true
      state: approved
      approvers:
        - human-tech-lead
      approvalGate: code_review
      activationCriteria:
        - Component references exist.
        - Prompt and retrieval changes are reviewed.
        - High-risk capabilities remain approval-gated.
    compatibility:
      impact: behavior_changing
      notes: Changes may alter review evidence, output style, and escalation behavior.
    audit:
      recordAgentDefinitionRef: true
      recordDefinitionVersion: true
      recordComponentRefs: true
      recordReviewState: true
      recordChangeSummary: true
      events:
        - agent.definition.selected
        - agent.definition.failed
```

The schema is intentionally practical. It validates useful structure and the
complete active-definition shape, but deeper checks such as whether referenced
agents, profiles, permissions, capabilities, context sources, memory scopes,
extensions, approval gates, or events exist are semantic validation work.

## Agent Identity Versus Agent Definition

`agents.yaml` declares identity and standing team role:

- `id`
- display name
- role
- description
- responsibilities
- skills

`agent-definitions.yaml` declares a versioned behavioral release for an agent identity.

Legacy AgentSet fields for permissions, capabilities, context, memory, autonomy,
provider preferences, and extensions remain schema-valid but deprecated. They
are compatibility data, not standing constraints, grants, or merge inputs. New
and migrated identities should omit them. See
[Agent Identity Migration](agent-identity-migration.md).

In a project with `ActorSet`, the participating actor links explicitly to the
stable `AgentSet` identity, and `AgentDefinitionSet.agentRef` continues to target
that agent identity. Equal actor and agent IDs do not create either link
implicitly.

The layers are not peers. An agent can keep the same `agentRef` while a new
definition changes the model profile, prompt set, retrieval profile,
permissions, memory scopes, autonomy, or extension configuration. Once that
definition is the unique active definition, its requests are authoritative.
Permission, capability, context, memory, provider, project, task, workflow,
human-control, and runtime policy may narrow those requests but never broaden
them.

## Component References

Agent definitions should reference components instead of embedding all behavior directly.

Common component references include:

| Field | Purpose |
| --- | --- |
| `modelProfileRef` | Provider-neutral model selection, constraints, fallback, review triggers, and audit expectations. |
| `promptSetRef` | Versioned prompt material, prompt revisions, ownership, safety review, and compatibility impact. |
| `retrievalProfileRef` | Context source selection, index versions, chunking, freshness, citations, sensitivity, and audit expectations. |
| `permissionRefs` | Permission rules with `allow`, `deny`, or `approval_required` effects for the agent. |
| `capabilityRefs` | Technical actions the agent definition expects to use. |
| `contextSourceRefs` | Declared context sources expected by the definition. |
| `memoryScopes` | Memory scopes expected by the definition. |
| `extensionRefs` | Versioned or named extension configurations that may affect tools, context, or events. |

Component references do not grant access by themselves.

## Lifecycle

Agent definitions use this lifecycle:

| Status | Meaning |
| --- | --- |
| `draft` | Proposed and not yet approved for normal use. |
| `active` | Approved and eligible for authoritative unscoped selection. |
| `deprecated` | Still valid but expected to be replaced. |
| `retired` | No longer valid for new work. |

In the current unscoped model, a project MUST NOT declare more than one active
definition for the same `agentRef`. Multiple active definitions are ambiguous
and fail selection. A project with no active definition remains valid for
authoring and review, but normal effective configuration selection cannot
proceed.

Selection MUST NOT use version order, declaration order, file names,
modification times, provider availability, or prior execution state. Scoped
activation is future work.

## Review And Activation

Agent definitions SHOULD identify an owner and review requirements. An active
definition MUST include:

- complete component reference lists, including an explicit empty
  `extensionRefs` list when no extension applies
- a change summary
- compatibility impact and notes
- review with `required: true` and `state: approved`
- at least one approver, approval gate, and activation criterion
- enabled audit flags for definition, version, components, review state, and
  change summary
- at least one audit event

An agent definition SHOULD require review before activation when it changes:

- model profile
- prompt set
- retrieval profile
- permissions
- capabilities
- context sources
- memory scopes
- autonomy level
- extensions

Broader access, broader autonomy, less restrictive approvals, sensitive retrieval, durable memory writes, and high-risk capabilities SHOULD be treated as safety-significant.

## Compatibility

Adding a new draft definition is usually additive. Activating a definition is
behavior-significant because it changes authoritative selection.

Changing an active definition can be behavior-breaking even when manifests remain schema-valid.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add a new draft definition | Usually compatible. |
| Activate the first complete definition | Behavior-significant; enables authoritative selection for future tools. |
| Activate a second definition for the same agent | Invalid ambiguity in the current unscoped model. |
| Change display-only description text | Usually compatible. |
| Change `modelProfileRef` | Behavior-breaking. |
| Change `promptSetRef` | Behavior-breaking. |
| Change `retrievalProfileRef` | Behavior-breaking. |
| Add a high-risk capability | Runtime safety breaking. |
| Change `approval_required` to `allow` | Runtime compatibility breaking. |
| Increase autonomy level | Safety-significant and may be breaking. |
| Broaden memory scopes | Privacy and safety breaking. |
| Broaden context source references | Privacy and correctness breaking. |
| Change extension references | Extension compatibility breaking. |

Compatibility notes should identify affected agents, workflows, tasks, handoffs, approval gates, context sources, memory scopes, events, and future runtime behavior when known.

## Audit Expectations

Future events involving an agent SHOULD be able to include agent definition metadata.

Example:

```yaml
agent:
  id: backend-reviewer
  definitionRef: backend_reviewer_2026_06
  definitionVersion: "2026.06.0"
  modelProfileRef: backend_reviewer_model
  promptSetRef: backend_reviewer_prompts
  retrievalProfileRef: backend_reviewer_retrieval
```

Future events should prefer definition references, versions, component refs, review state, and change summaries over embedding full component content.

Projects should declare `agent.definition.selected` and
`agent.definition.failed` when they expect selection audit. These event
declarations do not mean a runtime emits them today.

## Relationship To Other Manifests

Agent definitions assemble existing manifest concepts. They do not replace them.

- `agents.yaml` declares agent identity and standing role.
- `model-profiles.yaml` declares model selection expectations.
- `prompt-sets.yaml` declares prompt material and revisions.
- `retrieval-profiles.yaml` declares context retrieval expectations.
- `permissions.yaml` declares permission rules with `allow`, `deny`, or `approval_required` effects.
- `capabilities.yaml` declares technical actions.
- `context.yaml` declares information sources and access boundaries.
- `memory.yaml` declares retention and reuse boundaries.
- `extensions.yaml` declares integration namespaces and lifecycle metadata.

Maintained semantic smoke checks verify exact component references, no more than
one active definition per agent, active prompt and retrieval lifecycle, and
prompt safety review for the active Minimal Team definition. Broader policy
composition remains future semantic validation.

## Current Status

Agent definitions remain draft specification vocabulary in `0.1`, but the
unique-active authority slice is implemented in documentation, schema,
repository checks, and the Minimal Team example.

This repository provides documentation, schema, and examples only. It does not implement agent execution, provider calls, prompt loading, retrieval, memory persistence, permission enforcement, event emission, or runtime orchestration.
