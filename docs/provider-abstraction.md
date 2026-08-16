# Provider Abstraction

NexFlow is provider neutral.

Related documents:

- [Provider Adapter Boundary](provider-adapter-boundary.md)
- [Provider Features](provider-features.md)
- [Provider Constraints](provider-constraints.md)
- [RFC-0010: Provider Selection](../rfcs/RFC-0010-provider-selection.md)

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
  trainingUse: prohibited
  toolUse: declared_tools_only
  maxSensitivity: internal
features:
  - text_generation
  - tool_reasoning
selection:
  strategy: project_policy
  explainability:
    recordSelectionReason: true
    recordConstraintsApplied: true
```

## Provider Features

Provider `features` describe model or provider support signals. They belong to a
closed provider feature vocabulary and are not references to project action
capabilities.

For example, `tool_reasoning` indicates a model class intended to reason about
tool requests and results. It does not expose a tool, grant `execute_command`,
authorize network access, or satisfy a permission.

Legacy provider `capabilities` remains structurally valid only for `0.1`
migration. It is deprecated, cannot coexist with `features`, and must never
resolve against `CapabilitySet`.

See [Provider Features](provider-features.md) for the vocabulary, namespace,
migration, and validation contract.

## Provider Constraints

Provider `constraints` describe static candidate eligibility and policy
boundaries. The current provider-neutral vocabulary covers training use, data
residency and regions, tool use, maximum sensitivity, cost and latency classes,
deployment, network posture, approval, and data retention.

Provider constraints are not the same as model-profile requirements. A provider
declaration says what a candidate advertises or permits; a model profile says
what a behavioral use requires. A future selector must intersect both with
project policy and fail closed on material conflicts or unresolved restrictive
facts.

Legacy `constraints.allowTrainingUse` remains schema-valid but deprecated for
the `0.1` migration window. New declarations use the explicit `trainingUse`
enum. See [Provider Constraints](provider-constraints.md) for the complete
vocabulary, composition rules, migration, and 17 focused checks.

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

Providers describe available provider abstractions, model support features, and
broad constraints. Model profiles describe how a project expects a model to be
selected for a behaviorally meaningful purpose, such as code review,
documentation drafting, summarization, or policy analysis.

A model profile may be:

- `pinned`: a specific provider-scoped model identifier or reviewed model revision is expected
- `floating`: an alias or policy may resolve to different models over time
- `policy`: project or organization policy chooses the model within declared constraints

Model profiles SHOULD remain provider-neutral in core NexFlow. Provider-specific details should be extension-scoped or runtime-scoped when they are not useful as common specification vocabulary.

See [Model Profiles](model-profiles.md).

## Provider Rules

Provider configuration MUST NOT bypass permissions, autonomy levels, context boundaries, or approval gates.

Provider-specific extensions should be namespaced and optional.

Provider constraints MUST NOT be interpreted as live availability, benchmark
evidence, current price, credentials, permission, approval, or network access.

Provider feature support MUST NOT be interpreted as an actor capability,
permission, integration connection, provider credential, or runtime grant.

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

Selection and invocation are separate. The runtime host selects and authorizes
one target; a future adapter may only translate that target, use mediated
credential and network handles, and return normalized output or failure.
Adapters must not choose hidden provider or model fallback. See
[Provider Adapter Boundary](provider-adapter-boundary.md).
