# RFC-0004: Agent Definition Versioning

## Status

Draft

## Summary

This RFC proposes a draft model for versioning the effective definition of a NexFlow agent.

An agent definition is the versioned assembly of the parts that can materially change agent behavior, including:

- model profile
- prompt set
- retrieval profile
- context access
- memory policy
- permissions and capabilities
- autonomy level
- extension configuration

The proposal keeps NexFlow provider-neutral and runtime-neutral. It does not define a runtime, prompt registry, model registry, or retrieval engine.

## Motivation

NexFlow already requires every manifest to declare `specVersion`, but manifest versioning alone is not enough to audit how an individual agent changes over time.

In real AI developer teams, an agent may keep the same identity while its behavior changes because maintainers update:

- the model or model selection policy
- system and task prompts
- retrieval sources or index versions
- tool and extension access
- memory scope access
- approval requirements
- autonomy level

These changes can affect quality, cost, privacy, safety, and compatibility. A project should be able to say which version of an agent definition performed a task, created an artifact, requested a review, or crossed an approval gate.

This RFC gives maintainers vocabulary for versioned agent releases without requiring NexFlow to implement execution behavior.

## Proposal

NexFlow should distinguish agent identity from agent definition.

### Agent Identity

Agent identity describes who the agent is in the team model.

Identity fields include stable values such as:

- `id`
- `displayName`
- `role`
- `description`
- long-lived responsibilities

These values may still change, but they are not enough to describe the effective behavior of an AI agent.

### Agent Definition

An agent definition describes a versioned behavioral release of an agent.

This draft currently represents agent definitions as a dedicated `agent-definitions.yaml` manifest. The repository includes [Agent Definitions](../docs/agent-definitions.md) guidance and a practical `AgentDefinitionSet` schema, but this RFC does not require that draft shape to become final without review.

A draft agent definition should include:

```yaml
id: backend_reviewer_2026_06
agentRef: backend-reviewer
definitionVersion: "2026.06.0"
status: draft
owner: human-tech-lead
description: Backend reviewer profile for API, migration, and pull request review work.
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
changeSummary: Adds migration review prompts and narrows production deployment permissions.
replaces: backend_reviewer_2026_05
review:
  required: true
  approvers:
    - human-tech-lead
  approvalGate: code_review
audit:
  recordAgentDefinitionRef: true
  recordDefinitionVersion: true
  recordComponentRefs: true
```

### Versioned References

Agent definitions should reference versioned components instead of embedding every detail directly.

Recommended references include:

| Reference | Purpose |
| --- | --- |
| `modelProfileRef` | Provider-neutral model selection, constraints, and audit expectations. |
| `promptSetRef` | System, role, workflow, and task prompt revisions. |
| `retrievalProfileRef` | Context source, index, chunking, freshness, and citation expectations. |
| `permissionRefs` | Permission rules with `allow`, `deny`, or `approval_required` effects. |
| `capabilityRefs` | Technical actions expected by the behavioral release. |
| `contextSourceRefs` | Declared context sources expected by the behavioral release. |
| `memoryScopes` | Allowed memory scope references. |
| `memoryPolicyRef` | Optional reference to a versioned memory policy when a project defines one. |
| `extensionRefs` | Versioned extension configuration that may affect tools, context, or events. |

These references do not grant access by themselves. Permissions and approval gates remain authoritative.

### Model Profile Versioning

A model profile should be provider-neutral and should avoid making provider-specific behavior part of core NexFlow semantics.

The repository includes draft [Model Profiles](../docs/model-profiles.md) guidance and a practical `ModelProfileSet` schema for this vocabulary.

A future model profile may describe:

- intended model class
- provider constraints
- pinned provider model identifiers, when available
- allowed fallback policies
- data residency constraints
- training-use constraints
- cost or latency constraints
- tool-use constraints
- audit metadata captured by a runtime

Model profiles may support both pinned and floating selection styles:

- `pinned`: a specific provider model identifier or resolved model build is required.
- `floating`: a policy such as "latest approved small coding model" is allowed, but each runtime event should record the resolved model when available.

Floating selection is useful, but it can be behavior-changing. A change in the resolved model may require review if it affects safety, privacy, cost, or compatibility.

### Prompt Set Versioning

A prompt set should describe versioned prompt material without requiring every repository to publish raw prompt text.

The repository includes draft [Prompt Sets](../docs/prompt-sets.md) guidance and a practical `PromptSet` schema for this vocabulary.

A future prompt set may include:

- prompt identifiers
- prompt revisions
- prompt source references
- optional content digests
- owner or maintainer
- safety review status
- intended agent definitions
- compatibility notes

Prompt text can contain sensitive operational guidance. Projects may use references or digests when raw prompt contents should not be stored in public manifests.

Prompt changes can be behavior-breaking even when schemas do not change.

### Retrieval Profile Versioning

A retrieval profile should describe how external or project context is selected and assembled.

The repository includes draft [Retrieval Profiles](../docs/retrieval-profiles.md) guidance and a practical `RetrievalProfileSet` schema for this vocabulary.

A future retrieval profile may include:

- context source references
- index or corpus version
- chunking policy
- embedding model reference
- reranker reference
- freshness expectations
- citation policy
- excluded sources
- sensitivity classification
- audit expectations

Retrieval profile changes can affect correctness, privacy, and reproducibility. A task event should be able to identify which retrieval profile was active when context was used.

### Memory Scope And Policy Versioning

The `memoryScopes` component should identify which declared scopes an agent definition expects to use. Projects may also use `memoryPolicyRef` when they define a separate versioned memory policy.

Versioned memory policy references should preserve:

- allowed scopes
- retention expectations
- ownership
- visibility
- allowed writers
- allowed consumers
- sensitivity rules
- update modes

A broader memory policy should be treated as a safety-significant change.

### Permission and Autonomy Versioning

Agent definitions may refer to permissions, capabilities, and autonomy levels, but they must not bypass them.

The following changes should require review:

- adding a capability
- changing a denied action to an allowed action
- removing an approval gate
- increasing autonomy level
- broadening context access
- broadening memory access
- enabling a high-risk extension

An agent definition version that changes permissions or autonomy may be runtime-breaking even if all referenced manifests remain schema-valid.

### Event and Audit Expectations

Future events should be able to record the agent definition that participated in the event.

Event payloads may include:

```yaml
agent:
  id: backend-reviewer
  definitionRef: backend_reviewer_2026_06
  definitionVersion: "2026.06.0"
  modelProfileRef: backend_reviewer_model
  promptSetRef: backend_reviewer_prompts
  retrievalProfileRef: backend_reviewer_retrieval
```

A runtime may also record resolved provider details when available, but provider-specific fields should remain extension-scoped or runtime-scoped.

### Lifecycle

Agent definition versions should support a simple lifecycle:

| Status | Meaning |
| --- | --- |
| `draft` | Proposed and not yet approved for normal use. |
| `active` | Approved for use by the project. |
| `deprecated` | Still valid but expected to be replaced. |
| `retired` | No longer valid for new work. |

Deprecating or retiring an agent definition should identify the replacement when possible.

## Compatibility Impact

This RFC does not change current manifest schemas. The repository includes a draft schema and examples for `agent-definitions.yaml`, but this RFC remains draft until accepted through the governance process.

If accepted, later work may refine manifests or fields for agent definitions and versioned references.

Compatibility guidance:

- changing display text may be compatible
- changing a prompt set may be behavior-breaking
- changing model selection may be behavior-breaking
- changing retrieval sources may be behavior-breaking
- changing memory policy may be safety-breaking
- changing permissions or autonomy may be runtime-breaking
- changing extension access may be extension-breaking

Future compatibility notes should identify which conformance levels are affected, especially `NF-SEMANTIC`, `NF-RUNTIME`, and `NF-EXTENSION`.

## Security and Safety Impact

Agent definition versioning improves auditability by making behavioral changes explicit.

Security requirements:

- do not store secrets, tokens, private keys, or raw credentials in agent definitions
- do not treat an agent definition reference as permission to access a resource
- keep permission grants, approval gates, and autonomy levels explicit
- review broader memory and context access before activation
- record resolved provider/model details only when safe and available
- avoid public raw prompt disclosure when prompts contain sensitive information

Versioning is not a substitute for enforcement. A runtime that claims enforcement must still enforce declared permissions, approval gates, memory boundaries, context boundaries, and extension policies.

## Alternatives Considered

### Version Only `agents.yaml`

NexFlow could add a `version` field directly to each agent in `agents.yaml`.

This is too coarse because different behavioral components may change independently.

### Rely Only on Git History

Git history is useful, but it does not provide a portable, manifest-level reference that events, handoffs, reviews, and artifacts can cite.

### Embed Full Prompt, Model, Retrieval, and Permission Details in Each Agent

Embedding everything in the agent record would reduce indirection, but it would make manifests repetitive and harder to review.

### Provider-Specific Agent Versions

NexFlow could define agent versions around provider-native assistant, model, or project identifiers.

This would violate provider neutrality and make the core specification depend on vendor behavior.

## Open Questions

- Should the dedicated `agent-definitions.yaml` manifest remain the final shape or be revised before acceptance?
- Should tasks and workflows reference agent identity, agent definition, or both?
- Should NexFlow define lockfiles for resolved model, prompt, retrieval, and extension versions?
- Which digest formats should be recommended for prompt and retrieval artifacts?
- Which agent definition changes should require an RFC versus a normal pull request?
- Should `active` agent definitions require an explicit approval gate in the manifest?
- How should private prompt references be represented in public open-source repositories?
