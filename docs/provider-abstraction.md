# Provider Abstraction

NexFlow is provider neutral.

Related RFC: [RFC-0010: Provider Selection](../rfcs/RFC-0010-provider-selection.md).

Providers may include:

- OpenAI
- Anthropic
- Google
- OpenRouter
- Ollama
- local models
- custom providers

No provider is implemented by this repository.

## Provider Declaration

```yaml
id: general-reasoning
type: abstract
description: Provider suitable for reasoning-heavy software design.
constraints:
  dataResidency: unspecified
  allowTrainingUse: false
capabilities:
  - text_generation
  - tool_reasoning
selection:
  strategy: project_policy
  explainability:
    recordSelectionReason: true
    recordConstraintsApplied: true
```

## Provider Selection Requests

Migrated agent identities do not carry provider preferences. An agent definition
references a model profile, and that profile declares provider-neutral
selection modes, eligible provider references, constraints, and fallback.

Legacy AgentSet `providerPreferences` remain schema-valid but deprecated during
the `0.1` migration window. They must not override model profile constraints,
permissions, approval gates, context boundaries, memory boundaries, network
policy, human override, or project policy.

## Model Profiles

Model profiles are a separate layer from provider declarations.

Providers describe available provider abstractions and broad constraints. Model profiles describe how a project expects a model to be selected for a behaviorally meaningful purpose, such as code review, documentation drafting, summarization, or policy analysis.

A model profile may be:

- `pinned`: a specific provider-scoped model identifier or reviewed model revision is expected
- `floating`: an alias or policy may resolve to different models over time
- `policy`: project or organization policy chooses the model within declared constraints

Model profiles SHOULD remain provider-neutral in core NexFlow. Provider-specific details should be extension-scoped or runtime-scoped when they are not useful as common specification vocabulary.

See [Model Profiles](model-profiles.md).

## Provider Rules

Provider configuration MUST NOT bypass permissions, autonomy levels, context boundaries, or approval gates.

Provider-specific extensions should be namespaced and optional.

Declaring or selecting a provider does not authorize a connection to it. A
provider request also requires the `access_network` capability, effective
permission, a matching structured
[Network Access Policy](network-access-policy.md) rule, and credentials supplied
through an appropriate secret-management boundary.

## Future Runtime Expectations

A future runtime should make provider selection explainable:

- selected provider
- model profile reference
- selection mode
- resolved model, when safe and available
- reason for selection
- fallback use
- policy constraints applied
- context shared
- memory scopes used

See [RFC-0010](../rfcs/RFC-0010-provider-selection.md) for the draft provider selection decision path, fallback expectations, and audit guidance.
