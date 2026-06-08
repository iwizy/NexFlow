# Provider Abstraction

NexFlow is provider neutral.

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
```

## Provider Preferences

Agents may express preferences:

```yaml
providerPreferences:
  - provider: general-reasoning
    priority: preferred
    reason: Requires strong reasoning and code review capability.
```

Preferences are not hard requirements unless project policy says so.

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
