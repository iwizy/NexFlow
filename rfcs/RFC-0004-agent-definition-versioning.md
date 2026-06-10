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

Future manifests may represent this as a dedicated manifest such as `agent-definitions.yaml`, or as a named section in an existing agent manifest. This RFC does not require a final manifest shape.

A draft agent definition should include:

```yaml
id: backend-reviewer-2026-06
agentRef: backend-reviewer
definitionVersion: "2026.06.0"
status: draft
description: Backend reviewer profile for API, migration, and pull request review work.
modelProfileRef: model-profile.backend-reviewer.v1
promptSetRef: prompt-set.backend-reviewer.v3
retrievalProfileRef: retrieval-profile.backend-reviewer.v2
permissionSetRef: permission-set.backend-reviewer.v1
memoryPolicyRef: memory-policy.project-reviewer.v1
autonomyLevel: ask_before_changes
extensionRefs:
  - github.review.v1
  - mcp.repository-context.v1
changeSummary: Adds migration review prompts and narrows production deployment permissions.
replaces: backend-reviewer-2026-05
review:
  required: true
  approvers:
    - human.tech-lead
```

### Versioned References

Agent definitions should reference versioned components instead of embedding every detail directly.

Recommended references include:

| Reference | Purpose |
| --- | --- |
| `modelProfileRef` | Provider-neutral model selection, constraints, and audit expectations. |
| `promptSetRef` | System, role, workflow, and task prompt revisions. |
| `retrievalProfileRef` | Context source, index, chunking, freshness, and citation expectations. |
| `permissionSetRef` | Permission grants, denies, and approval-required actions. |
| `memoryPolicyRef` | Allowed memory scopes, retention, writers, readers, and sensitivity rules. |
| `extensionRefs` | Versioned extension configuration that may affect tools, context, or events. |

These references do not grant access by themselves. Permissions and approval gates remain authoritative.

### Model Profile Versioning

A model profile should be provider-neutral and should avoid making provider-specific behavior part of core NexFlow semantics.

NF-007 adds draft [Model Profiles](../docs/model-profiles.md) guidance and a practical `ModelProfileSet` schema for this vocabulary.

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

NF-008 adds draft [Prompt Sets](../docs/prompt-sets.md) guidance and a practical `PromptSet` schema for this vocabulary.

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

NF-009 adds draft [Retrieval Profiles](../docs/retrieval-profiles.md) guidance and a practical `RetrievalProfileSet` schema for this vocabulary.

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

### Memory Policy Versioning

A memory policy should define which memory scopes an agent definition may read or write.

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
  definitionRef: backend-reviewer-2026-06
  definitionVersion: "2026.06.0"
  modelProfileRef: model-profile.backend-reviewer.v1
  promptSetRef: prompt-set.backend-reviewer.v3
  retrievalProfileRef: retrieval-profile.backend-reviewer.v2
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

This RFC does not change current manifest schemas.

If accepted, later work may add new manifests or fields for agent definitions and versioned references.

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

- Should agent definitions live in a dedicated `agent-definitions.yaml` manifest?
- Should tasks and workflows reference agent identity, agent definition, or both?
- Should NexFlow define lockfiles for resolved model, prompt, retrieval, and extension versions?
- Which digest formats should be recommended for prompt and retrieval artifacts?
- Which agent definition changes should require an RFC versus a normal pull request?
- Should `active` agent definitions require an explicit approval gate in the manifest?
- How should private prompt references be represented in public open-source repositories?
