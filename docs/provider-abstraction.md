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

## Provider Rules

Provider configuration MUST NOT bypass permissions, autonomy levels, context boundaries, or approval gates.

Provider-specific extensions should be namespaced and optional.

## Future Runtime Expectations

A future runtime should make provider selection explainable:

- selected provider
- reason for selection
- policy constraints applied
- context shared
- memory scopes used
