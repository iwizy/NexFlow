# Agent Definitions

Agent definitions describe versioned behavioral releases of agents.

They are specification metadata. They do not run agents, call providers, load prompts, retrieve context, grant permissions, grant context access, write memory, or bypass approval gates.

## Purpose

An agent identity explains who an agent is in a team. An agent definition explains which reviewed behavioral assembly is active for that agent.

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

Agent definitions are the assembly layer proposed in [RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md).

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
    status: draft
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
```

The schema is intentionally practical. It validates useful structure, but deeper checks such as whether referenced agents, profiles, permissions, capabilities, context sources, memory scopes, or extensions exist are semantic validation work.

## Agent Identity Versus Agent Definition

`agents.yaml` declares identity and standing team role:

- `id`
- display name
- role
- responsibilities
- skills
- declared context and memory access
- declared capabilities and permissions
- autonomy level
- provider preferences
- extensions

`agent-definitions.yaml` declares a versioned behavioral release for an agent identity.

The two layers should stay aligned, but they are not the same. An agent can keep the same `agentRef` while a new definition changes the model profile, prompt set, retrieval profile, permissions, memory scopes, autonomy, or extension configuration.

## Component References

Agent definitions should reference components instead of embedding all behavior directly.

Common component references include:

| Field | Purpose |
| --- | --- |
| `modelProfileRef` | Provider-neutral model selection, constraints, fallback, review triggers, and audit expectations. |
| `promptSetRef` | Versioned prompt material, prompt revisions, ownership, safety review, and compatibility impact. |
| `retrievalProfileRef` | Context source selection, index versions, chunking, freshness, citations, sensitivity, and audit expectations. |
| `permissionRefs` | Permissions that allow, deny, or approval-gate capabilities for the agent. |
| `capabilityRefs` | Technical actions the agent definition expects to use. |
| `contextSourceRefs` | Declared context sources expected by the definition. |
| `memoryScopes` | Memory scopes expected by the definition. |
| `extensionRefs` | Versioned or named extension configurations that may affect tools, context, or events. |

Component references do not grant access by themselves.

## Lifecycle

Agent definitions use a draft lifecycle:

| Status | Meaning |
| --- | --- |
| `draft` | Proposed and not yet approved for normal use. |
| `active` | Approved for use by the project. |
| `deprecated` | Still valid but expected to be replaced. |
| `retired` | No longer valid for new work. |

Projects SHOULD avoid more than one `active` definition for the same `agentRef` unless the difference is clearly scoped by workflow, environment, or extension policy.

## Review And Activation

Agent definitions SHOULD identify an owner and review requirements.

Review metadata SHOULD describe:

- whether review is required
- who may approve the definition
- which approval gate applies
- activation criteria
- review notes or evidence references when useful

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

Adding a new draft definition is usually additive.

Changing an active definition can be behavior-breaking even when manifests remain schema-valid.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add a new draft definition | Usually compatible. |
| Change display-only description text | Usually compatible. |
| Change `modelProfileRef` | Behavior-breaking. |
| Change `promptSetRef` | Behavior-breaking. |
| Change `retrievalProfileRef` | Behavior-breaking. |
| Add a high-risk capability | Runtime safety breaking. |
| Remove an approval-gated permission | Runtime compatibility breaking. |
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

## Relationship To Other Manifests

Agent definitions assemble existing manifest concepts. They do not replace them.

- `agents.yaml` declares agent identity and standing role.
- `model-profiles.yaml` declares model selection expectations.
- `prompt-sets.yaml` declares prompt material and revisions.
- `retrieval-profiles.yaml` declares context retrieval expectations.
- `permissions.yaml` declares allow, deny, or approval-gated policy.
- `capabilities.yaml` declares technical actions.
- `context.yaml` declares information sources and access boundaries.
- `memory.yaml` declares retention and reuse boundaries.
- `extensions.yaml` declares integration namespaces and lifecycle metadata.

Future semantic validation should check that component references are valid and consistent.

## Current Status

Agent definitions are draft specification vocabulary in `0.1`.

This repository provides documentation, schema, and examples only. It does not implement agent execution, provider calls, prompt loading, retrieval, memory persistence, permission enforcement, event emission, or runtime orchestration.
