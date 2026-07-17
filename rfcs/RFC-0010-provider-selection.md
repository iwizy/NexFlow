# RFC-0010: Provider Selection

## Status

Draft

## Summary

This RFC proposes the initial NexFlow provider selection model.

The proposal defines:

- how provider preferences relate to model profiles
- how constraints should be applied during future provider resolution
- how pinned, floating, and policy-based model profile selection should be interpreted
- how fallback should be reviewed and explained
- what future runtimes should record for provider selection auditability
- what validators may check without calling providers
- which provider-specific details should remain extension-scoped

The goal is to make provider and model selection explainable without making NexFlow depend on any provider, runtime, or model registry.

## Motivation

NexFlow is provider neutral.

That neutrality is only useful if a project can still describe how model-backed behavior should be selected, constrained, reviewed, and audited.

Provider and model selection affects:

- output quality
- reproducibility
- safety behavior
- cost
- latency
- tool use
- training-use policy
- data residency
- context exposure
- memory exposure
- compliance and auditability

If provider selection is hidden inside runtime code, a human reviewer cannot tell why an agent used a provider, whether a fallback happened, what constraints were applied, or whether a broader model class was used than expected.

NexFlow needs a common provider selection model before future runtimes begin resolving model profiles into provider calls.

## Proposal

NexFlow should treat provider selection as a reviewable decision path.

Provider selection should be derived from declared manifests, not hidden defaults.

The main inputs are:

- `providers.yaml`: provider abstractions and project-level constraints
- `model-profiles.yaml`: model class, selection mode, constraints, fallback, review, and audit expectations
- `agent-definitions.yaml`: which model profile applies to an agent definition
- `permissions.yaml`: what actions the actor may perform
- `context.yaml`: what context may be shared
- `memory.yaml`: what memory may be read or written
- `project.yaml`: project policy and approval gates
- extensions: provider-specific or runtime-specific metadata under namespaces

The main output is a provider selection decision that a future runtime can explain and audit.

## Non-Goals

This RFC does not:

- implement provider calls
- choose a runtime language
- choose a model provider
- define a provider registry
- define a benchmark suite
- require a hosted service
- require a telemetry backend
- require provider-native traces
- make model selection automatic in this repository
- grant permissions through provider declarations

## Core Concepts

### Provider Declaration

A provider declaration describes an available provider abstraction or provider-specific integration.

Example:

```yaml
providers:
  - id: general_reasoning
    type: abstract
    description: Provider-neutral reasoning capability.
    capabilities:
      - text_generation
      - tool_reasoning
    constraints:
      allowTrainingUse: false
    selection:
      strategy: project_policy
      explainability:
        recordSelectionReason: true
        recordConstraintsApplied: true
```

Provider declarations do not grant access and do not call providers.

### Provider Preference

An agent or agent definition may express provider preferences.

Preferences are hints unless project policy or a model profile makes them binding.

Example:

```yaml
providerPreferences:
  - provider: general_reasoning
    priority: preferred
    reason: Requires strong reasoning and code review capability.
```

Preferences should not override:

- permissions
- approval gates
- context boundaries
- memory boundaries
- model profile constraints
- project policy
- organization policy

### Model Profile

A model profile describes provider-neutral model selection expectations for a behaviorally meaningful use.

Model profiles remain the main selection unit because they include:

- model class
- selection mode
- provider references
- pinned model references or floating aliases
- constraints
- fallback rules
- review triggers
- audit expectations

Provider declarations say what is available. Model profiles say what is acceptable for a specific purpose.

## Selection Inputs

A future runtime should evaluate provider selection from the following inputs when available:

| Input | Purpose |
| --- | --- |
| Agent definition | Determines which model profile and behavioral release are active. |
| Model profile | Defines model class, selection mode, constraints, fallback, review, and audit expectations. |
| Provider declaration | Defines provider abstraction, capabilities, and provider-level constraints. |
| Project policy | Adds organization or repository rules. |
| Permissions | Determines whether the actor may perform the requested action. |
| Approval gates | Determines whether selection, fallback, or sensitive data use needs approval. |
| Context policy | Determines what information may be shared with the selected provider. |
| Memory policy | Determines what retained memory may be used or written. |
| Extension metadata | Provides namespaced provider-specific details when needed. |

If required inputs are missing, a runtime should fail closed or ask for approval rather than silently selecting a broader provider.

## Selection Modes

### Pinned Selection

Pinned selection expects a specific provider-scoped model identifier or reviewed model revision.

Pinned selection is appropriate when:

- reproducibility matters
- compliance review depends on a reviewed model
- behavior must remain stable
- a sensitive workflow has been approved against a specific model
- cost and latency are predictable only for a known model

Future runtimes should record:

- model profile reference
- provider reference
- model ID
- revision or resolved build when available
- selection reason
- whether fallback was used
- constraints applied

Changing a pinned model reference is behavior-significant and should be reviewed.

### Floating Selection

Floating selection uses an alias or policy that may resolve to different models over time.

Floating selection is appropriate when:

- the project trusts an approved provider policy
- the project wants provider upgrades without frequent manifest edits
- exact reproducibility is less important than freshness or operational simplicity

Floating selection should still be auditable.

Future runtimes should record:

- floating alias
- provider reference
- resolved model
- resolved revision when available
- selection reason
- alias policy or policy reference
- constraints applied
- fallback use

Changing a floating alias policy can be behavior-significant even when the manifest does not change.

### Policy Selection

Policy selection delegates model resolution to a project or organization policy.

Policy selection is appropriate when:

- organizations centrally govern model access
- model choices are dynamic but controlled
- data residency or sensitivity rules vary by context
- model selection depends on approved model catalogs outside the repo

Policy selection should be explainable.

Future runtimes should record:

- policy reference
- candidate providers considered when safe
- selected provider
- selected model when safe
- constraints applied
- rejection reasons for disallowed candidates when safe
- fallback use

Policy selection must not become a hidden provider default.

## Selection Decision Path

A future runtime should use a conservative decision path.

[RFC-0014](RFC-0014-effective-agent-configuration.md) proposes the wider effective configuration process that selects the agent definition and constrains permissions, context, memory, autonomy, tasks, workflows, and runtime support before provider resolution completes.

Recommended order:

1. Identify the active actor and agent definition.
2. Resolve the referenced model profile.
3. Confirm the requested action is permitted.
4. Identify context and memory that may be shared.
5. Apply project and organization policy.
6. Apply model profile constraints.
7. Filter provider declarations by provider refs and capabilities.
8. Filter by training-use, data residency, tool-use, sensitivity, cost, and latency constraints.
9. Apply selection mode: pinned, floating, or policy.
10. If no candidate remains, use approved fallback only if allowed.
11. Check whether the selection or fallback requires approval.
12. Emit or prepare an audit event explaining the decision.

The order should be conservative. A broad provider preference should not override a narrower model profile constraint.

## Constraints

Provider selection constraints may include:

- training use
- data residency
- tool use
- maximum cost tier
- maximum latency class
- maximum sensitivity/classification
- provider availability
- offline or local-only requirements
- approval requirements
- fallback eligibility
- extension namespace requirements

Constraints should be explicit when the selected provider may see sensitive context, prompt material, memory, customer data, production data, or security-relevant information.

## Training Use

Training-use constraints describe whether project data may be used to improve provider models.

Recommended values:

- `prohibited`
- `allowed`
- `requires_approval`
- `unspecified`

If training use is unspecified and sensitive context may be shared, future runtimes should choose the safer interpretation or require approval.

## Data Residency

Data residency constraints describe where data may be processed or stored.

NexFlow should not define legal compliance rules itself.

Projects may use:

- `project_policy`
- `organization_policy`
- region names
- local-only requirements
- extension-scoped residency policies

Future runtimes should record which residency rule was applied when safe.

## Tool Use

Provider-native tool use can bypass project expectations if it is not declared.

Model profile constraints may describe:

- `none`
- `declared_tools_only`
- `provider_native_tools`
- `unspecified`

For high-risk actions, `provider_native_tools` should require explicit review and permission modeling.

Tool availability from a provider must not grant NexFlow capabilities by itself.

## Sensitivity

Provider selection should respect the strictest applicable sensitivity boundary among:

- model profile constraints
- context sources used
- memory scopes used
- prompt set classification
- project policy
- extension policy

Future runtimes should avoid selecting a provider that cannot process the required sensitivity level under project policy.

If the sensitivity level is unclear, selection should fail closed or request approval.

## Fallback

Fallback is behavior-changing.

Fallback may change:

- provider
- model class
- model quality
- cost
- latency
- training-use policy
- tool behavior
- safety behavior
- data residency
- audit availability

Model profiles should specify whether fallback is allowed and what candidates may be used.

Fallback should be denied unless declared.

Fallback should require approval when:

- the fallback is less reviewed than the preferred model
- the fallback broadens provider eligibility
- the fallback changes training-use policy
- the fallback changes tool-use policy
- the fallback changes data residency
- the fallback may process more sensitive data than previously approved

Future runtimes should record fallback use and fallback reason.

## Explainability

Future runtime explainability should answer:

- which model profile was used
- which provider declaration was selected
- which model was resolved, when safe
- which selection mode was used
- which constraints were applied
- which candidates were rejected, when safe
- why fallback was or was not used
- whether approval was required
- whether approval was granted
- what context and memory boundaries applied
- which event records capture the decision

Example event payload:

```yaml
type: provider.selected
payload:
  modelProfileRef: docs_agent_balanced
  selectionMode: policy
  providerRef: general_reasoning
  resolvedModel: approved-general-reasoning
  constraintsApplied:
    trainingUse: prohibited
    toolUse: declared_tools_only
    sensitivity: internal
  selectionReason: Project policy selected an approved general reasoning model.
  fallbackUsed: false
  approvalRequired: false
```

This RFC does not require `provider.selected` to become a core event type in `0.1`. It defines the information future events should preserve.

## Audit Expectations

Model profiles should be able to request audit fields such as:

- model profile reference
- resolved provider
- resolved model
- model revision
- selection reason
- constraints applied
- policy decision reference
- fallback use
- fallback reason

Provider selection audit should prefer references over raw provider traces.

Provider-native traces may contain private prompts, context, memory, tool outputs, or account metadata. They should remain extension-scoped and redacted when needed.

## Relationship To Event Envelope

Provider selection audit should use the common event envelope proposed in [RFC-0009](RFC-0009-event-envelope.md).

Event subjects may include:

- agent definition
- model profile
- provider selection decision
- workflow step
- task

Event payloads should include selection metadata only when safe and policy-compliant.

## Relationship To Approval Gates

Provider selection may require approval when it changes risk.

Approval may be needed for:

- broader provider eligibility
- fallback to an unreviewed model
- provider-native tools
- provider training use
- processing restricted context
- processing durable memory
- sending data to a different jurisdiction
- using a provider-specific extension that changes behavior

Approval decisions should reference the model profile and provider selection evidence.

See [RFC-0007](RFC-0007-approval-gates.md).

## Relationship To Memory And Context

Provider selection does not grant context or memory access.

Before selecting a provider, a future runtime should know what context and memory may be shared.

The selected provider must be compatible with those boundaries.

Examples:

- A provider that allows training use may be incompatible with confidential context.
- A cloud provider may be incompatible with local-only memory.
- A provider-native tool mode may be incompatible with declared tool-only access.
- A fallback model may be incompatible with restricted context even if it is acceptable for public documentation.

## Extension Boundaries

Provider-specific details should live under namespaced extensions.

Examples:

```yaml
extensions:
  org.example.provider:
    modelFamily: internal-reviewed-reasoning
    deploymentTier: private
```

Extensions may describe provider-specific metadata, but they must not redefine core selection semantics.

An extension must not turn a preference into permission, bypass approval gates, or silently broaden context or memory access.

## Event And Manifest Examples

Provider declaration:

```yaml
providers:
  - id: coding_reasoning
    type: abstract
    description: Provider-neutral coding and review model class.
    constraints:
      allowTrainingUse: false
      dataResidency: project_policy
    selection:
      strategy: project_policy
      explainability:
        recordSelectionReason: true
        recordConstraintsApplied: true
```

Model profile:

```yaml
modelProfiles:
  - id: implementation_agent_coding
    description: Coding model profile for implementation tasks.
    modelClass: coding
    selection:
      mode: floating
      providerRefs:
        - coding_reasoning
      floatingAlias: approved-coding-model
      resolutionPolicy: Project policy chooses an approved coding model.
    constraints:
      trainingUse: prohibited
      toolUse: declared_tools_only
      sensitivity: confidential
    fallback:
      allowed: true
      strategy: same_class_reviewed_provider
      requiresApproval: true
      requiresAuditEvent: true
    audit:
      recordModelProfileRef: true
      recordResolvedProvider: true
      recordResolvedModel: true
      recordSelectionReason: true
      recordConstraintsApplied: true
      recordPolicyDecision: true
      recordFallbackUsed: true
```

## Validation Expectations

JSON Schema can validate:

- provider declarations have required top-level fields
- model profiles have selection mode and audit objects
- optional explainability fields are structurally valid
- known selection modes use stable enum values

Future semantic validators may check:

- referenced provider IDs exist
- provider capabilities satisfy model profile expectations
- selection mode has enough metadata
- fallback candidates reference declared providers
- model profile constraints are compatible with project policy
- agent definitions reference existing model profiles
- event audit fields are requested for high-risk selection modes

Validators should not call provider APIs or resolve live model catalogs unless that behavior is explicitly specified.

## Future Runtime Boundaries

A future runtime may:

- resolve model profiles into provider calls
- explain provider selection decisions
- emit provider selection audit events
- enforce fallback restrictions
- require approval for risky provider changes
- preserve provider-specific metadata under extensions

A future runtime must not:

- call a provider based only on a provider preference
- grant capabilities through provider availability
- use provider-native tools unless declared and allowed
- silently use provider training when prohibited
- silently broaden context or memory exposure
- hide fallback from audit records
- require one vendor's provider model for core conformance

## Compatibility Impact

This RFC is additive and semantic.

It clarifies provider selection expectations without changing required manifest fields.

Adding optional explainability metadata is compatible with existing manifests.

Potentially breaking changes may include:

- changing the meaning of selection modes
- changing provider preference precedence
- broadening provider eligibility
- changing training-use interpretation
- changing data residency interpretation
- changing tool-use interpretation
- allowing fallback where it was previously denied
- weakening audit requirements for provider selection
- moving provider-specific fields into core semantics

These changes may affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, privacy, safety, and compatibility.

## Security And Safety Impact

Provider selection is a safety boundary.

Risks include:

- exposing confidential context to an unapproved provider
- allowing provider training on project data
- using provider-native tools outside declared permissions
- fallback to weaker or unreviewed models
- losing reproducibility after floating alias changes
- hiding provider-specific behavior inside extensions
- logging sensitive provider traces
- confusing provider capabilities with NexFlow permissions

This RFC reduces risk by requiring provider selection to be explainable, constrained, auditable, and subordinate to project policy, permissions, context boundaries, memory boundaries, and approval gates.

## Alternatives Considered

### Provider-Specific Core Manifests

NexFlow could define first-class manifests for each provider.

This would violate provider neutrality and make the core specification unstable as provider APIs change.

### Runtime-Only Provider Selection

NexFlow could leave provider selection entirely to runtimes.

This would be simple but would hide important safety, cost, privacy, and audit decisions from manifest reviewers.

### Provider Preferences As Requirements

NexFlow could treat agent `providerPreferences` as binding requirements.

This would make preferences too powerful and could conflict with model profiles, project policy, or approval gates.

### Strict Model Registry Now

NexFlow could define a canonical model registry.

This is premature and would likely become provider-specific. The current draft should describe selection semantics and leave registries to future extensions or tools.

## Open Questions

- Should `provider.selected` become a core event type in `0.1`?
- Should provider selection decisions have first-class IDs?
- Should model profile constraints use stricter enums for cost, latency, and residency?
- Should provider catalogs be standardized as a future manifest kind or extension?
- How should local model selection be represented when no external provider is used?
- Should provider fallback always require approval for high-autonomy agents?
- Should future CLIs validate provider selection paths without calling providers?
