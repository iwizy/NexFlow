# Model Profiles

Model profiles describe provider-neutral model selection expectations for agents, agent definitions, workflows, or future runtimes.

They are specification metadata. They do not call a provider, select a model at runtime, grant tool access, or bypass permissions.

## Purpose

A model profile makes model-related behavior reviewable without locking NexFlow to a vendor.

It can describe:

- intended model class
- allowed provider abstractions
- pinned model references, when a specific model is required
- floating aliases, when a policy may resolve to different models over time
- fallback rules
- data, training-use, cost, latency, and tool-use constraints
- audit metadata expected from a future runtime
- review triggers for behavior-changing model updates

Model profiles are versioned component vocabulary used by agent assembly and proposed in [RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md).

Provider selection semantics are proposed in [RFC-0010](../rfcs/RFC-0010-provider-selection.md).

## Manifest

Model profiles may be declared in `model-profiles.yaml`.

```yaml
specVersion: "0.1"
kind: ModelProfileSet
metadata:
  project: example-project
modelProfiles:
  - id: backend_reviewer_model
    description: Provider-neutral model expectations for backend code review.
    modelClass: coding
    selection:
      mode: pinned
      providerRefs:
        - coding_reasoning
      pinnedModel:
        providerRef: coding_reasoning
        modelId: approved-coding-review-model
        revision: "2026-06"
    constraints:
      trainingUse: prohibited
      dataResidency: project_policy
      toolUse: declared_tools_only
      maxCostTier: medium
      maxLatencyClass: interactive
    fallback:
      allowed: true
      strategy: same_class_reviewed_provider
      requiresAuditEvent: true
    audit:
      recordModelProfileRef: true
      recordResolvedProvider: true
      recordResolvedModel: true
      recordModelRevision: true
      recordSelectionReason: true
      recordConstraintsApplied: true
      recordPolicyDecision: true
      recordFallbackUsed: true
    review:
      required: true
      approvers:
        - human-tech-lead
      reviewTriggers:
        - pinned_model_change
        - floating_alias_policy_change
        - broader_training_use
        - broader_tool_use
    recommendedFor:
      - backend-reviewer
```

The schema is intentionally practical. It validates useful structure, but deeper checks such as whether referenced providers or agents exist are semantic validation work.

## Selection Modes

### `pinned`

A pinned profile expects a specific provider-scoped model identifier or reviewed model revision.

Pinned selection is useful when reproducibility, auditability, compliance, or regression control matters.

Pinned profiles SHOULD identify:

- the provider abstraction or provider namespace
- the model identifier known to the project
- the model revision or resolved build when available
- the review status of that model reference

Pinned identifiers MUST NOT contain credentials, API keys, account secrets, or private provider configuration.

### `floating`

A floating profile points to an alias or policy that may resolve to different models over time.

Examples:

- `latest-approved-small-coding-model`
- `current-low-latency-review-model`
- `approved-general-reasoning`

Floating selection is convenient, but it can change behavior without a manifest diff. Future runtimes SHOULD record the resolved provider and model when available, and projects SHOULD review changes that affect safety, privacy, cost, compatibility, or output quality.

### `policy`

A policy profile delegates selection to project or organization policy.

Policy selection is useful when the project wants to describe constraints without naming a specific provider model.

Policy mode SHOULD still declare audit expectations so future events can explain which model was actually used.

## Constraints

Model profile constraints are declarations, not enforcement by this repository.

Common constraints include:

- `trainingUse`: whether provider training on project data is allowed, prohibited, approval-gated, or unspecified
- `dataResidency`: residency or locality expectation
- `toolUse`: whether the model may use no tools, declared tools only, provider-native tools, or an unspecified tool mode
- `maxCostTier`: project-level cost ceiling such as `low`, `medium`, or `high`
- `maxLatencyClass`: expected interaction class such as `interactive`, `batch`, or `background`
- `sensitivity`: highest information classification expected to be shared with the model

Projects SHOULD avoid vague constraints when the model may see confidential or restricted information.

## Fallbacks

Fallbacks describe what should happen if the preferred model is unavailable.

Fallbacks SHOULD say:

- whether fallback is allowed
- which provider or model class may be used
- whether approval is required before fallback
- whether a runtime must emit an audit event

Fallbacks can be behavior-changing. A fallback from a reviewed pinned model to an unreviewed floating alias SHOULD be treated as safety-significant.

## Audit Expectations

Future events involving an agent definition SHOULD be able to include model profile metadata.

Example:

```yaml
agent:
  id: backend-reviewer
  definitionRef: backend_reviewer_2026_06
  modelProfileRef: backend_reviewer_model
model:
  profileRef: backend_reviewer_model
  selectionMode: pinned
  providerRef: coding_reasoning
  resolvedModel: approved-coding-review-model
  resolvedRevision: "2026-06"
  constraintsApplied:
    trainingUse: prohibited
    toolUse: declared_tools_only
  policyDecisionRef: project-policy-model-selection
  fallbackUsed: false
```

Provider-specific runtime details should remain extension-scoped or runtime-scoped when they do not belong in the core model.

Selection explanations should record why a provider and model were selected, which constraints were applied, whether fallback was used, and whether approval was required.

## Review Triggers

The following changes SHOULD be reviewed before a model profile becomes active:

- changing from `pinned` to `floating`
- changing a pinned model reference
- broadening provider eligibility
- allowing provider training where it was previously prohibited
- allowing broader tool use
- raising cost or latency ceilings
- changing fallback behavior
- allowing a model profile to process more sensitive context

Review requirements are especially important when model profiles are referenced by agent definitions with broader autonomy, sensitive context, durable memory access, or high-risk capabilities.

## Compatibility

Adding a model profile is usually additive.

Changing a model profile can be behavior-breaking even when manifests remain schema-valid.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add a new unused model profile | Usually compatible. |
| Change a description only | Usually compatible. |
| Change a pinned model reference | Behavior-breaking. |
| Change a floating alias resolution policy | Behavior-breaking. |
| Broaden provider eligibility | May be privacy or compliance breaking. |
| Allow broader training use | Safety and privacy breaking. |
| Broaden tool-use constraints | Runtime safety breaking. |

Compatibility notes should identify the affected agent definitions, workflows, and future audit events when known.

## Relationship To Providers

Providers describe available provider abstractions and project-level constraints.

Model profiles describe how a project expects a model to be selected for a behaviorally meaningful purpose.

Provider declarations and model profiles do not grant access. Capabilities, permissions, context access, memory access, autonomy, and approval gates remain separate and authoritative.

## Relationship To Agent Definitions

Agent definitions may reference model profiles through `modelProfileRef`.

`agent-definitions.yaml` is draft vocabulary. Until that vocabulary is accepted, `model-profiles.yaml` still provides independently reviewable model selection metadata for examples, RFCs, and future semantic validation.

## Current Status

Model profiles are draft specification vocabulary in `0.1`.

This repository provides documentation, schema, and examples only. It does not implement provider selection, model resolution, fallback behavior, event emission, or runtime enforcement.
