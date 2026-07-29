# Provider Features

Provider features describe model or provider support signals used during
provider-neutral selection and review.

They are not NexFlow action capabilities. They do not authorize an actor,
activate a tool, grant network access, satisfy a permission, or call a provider.

Related documents:

- [Provider Abstraction](provider-abstraction.md)
- [Capability Model](capability-model.md)
- [Model Profiles](model-profiles.md)
- [RFC-0010: Provider Selection](../rfcs/RFC-0010-provider-selection.md)

## Authored Shape

A provider declaration may list `features`:

```yaml
providers:
  - id: coding_reasoning
    type: abstract
    description: Provider-neutral coding and review model class.
    features:
      - text_generation
      - code_reasoning
      - tool_reasoning
    constraints:
      allowTrainingUse: false
    selection:
      strategy: project_policy
```

The field is optional. When present, it is a non-empty set of values from the
core provider feature vocabulary.

## Core Vocabulary

The current `0.1` draft defines:

| Feature | Meaning | Does Not Mean |
| --- | --- | --- |
| `text_generation` | The model class can produce or transform text. | Permission to read or write project files. |
| `code_reasoning` | The model class is intended for reasoning about source code. | Repository access, command execution, or code modification authority. |
| `tool_reasoning` | The model class can reason about declared tool requests and results. | Tool availability, tool execution, integration access, or permission to use a tool. |
| `visual_reasoning` | The model class can reason about visual inputs. | Figma access, image retrieval, or permission to disclose visual data. |
| `policy_reasoning` | The model class is intended for reasoning about policies and constraints. | Approval authority, policy enforcement, or permission to change policy. |

The vocabulary is closed so a project action capability such as
`read_repository`, `execute_command`, or `deploy_application` cannot be authored
as a core provider feature.

Provider-specific signals that do not belong in the common vocabulary should
use documented namespaced extension metadata. Tools must not silently promote
an extension feature into the core vocabulary.

## Separate Namespaces

NexFlow answers three different questions:

| Model | Question | Declaration |
| --- | --- | --- |
| Provider feature | What model or provider support signal is advertised? | `ProviderSet.providers[].features[]` |
| Action capability | What technical project action exists? | `CapabilitySet.capabilities[].id` |
| Permission | May an actor use an action capability? | `PermissionSet.permissions[]` |

These namespaces are independent.

A provider that advertises `tool_reasoning` does not expose
`execute_command`. A provider that advertises `code_reasoning` does not grant
`read_repository` or `write_repository`. A runtime must still evaluate active
agent configuration, action capabilities, permissions, approval gates, context,
memory, network policy, human override, and runtime support.

## Selection Boundary

Provider features may be used as static selection evidence when a future
accepted field contract declares explicit model requirements.

The current model profile schema does not define a `requiredFeatures` field.
Tools must not infer feature requirements from free text, task names, agent
skills, action capabilities, or provider IDs.

Feature matching, when specified later, must remain:

- provider-neutral
- deterministic
- subordinate to model profile constraints
- independent from actor authorization
- visible in selection explanations
- non-networked during static validation

Declaring a feature does not prove live availability, quality, benchmark
performance, model identity, or compatibility with a provider API.

## Legacy `capabilities`

Earlier `0.1` drafts used:

```yaml
capabilities:
  - text_generation
  - code_reasoning
```

That field name could be mistaken for references to
`CapabilitySet.capabilities[].id`. It remains structurally valid only as a
deprecated migration form.

Rules:

- `features` and legacy `capabilities` MUST NOT coexist on one provider.
- Maintained examples use `features`.
- Legacy values MUST NOT resolve against `CapabilitySet`.
- Semantic tools SHOULD report legacy values and request migration.
- Legacy values do not grant action capabilities or permissions.
- A future specification version may remove the legacy field after notice.

## Migration

Replace the field name while preserving intended feature values:

```yaml
# Before
capabilities:
  - text_generation
  - tool_reasoning

# After
features:
  - text_generation
  - tool_reasoning
```

Then:

1. Validate every value against the core provider feature vocabulary.
2. Move provider-specific values into documented extension metadata.
3. Confirm no permission, task, agent definition, or extension incorrectly
   references a provider feature as an action capability.
4. Confirm action capabilities still resolve only through `CapabilitySet`.
5. Remove the legacy field.

Migration changes vocabulary, not authority.

## Validation Evidence

Repository checks include:

```sh
npm run provider-feature-schema-smoke
npm run semantic-smoke
```

The focused command checks the core vocabulary, uniqueness, non-empty lists,
legacy coexistence, and rejection of project action capability IDs across 11
positive and negative cases.

The semantic smoke command reports deprecated provider `capabilities` values in
maintained project assemblies. It does not select providers or compare live
model support.

## Compatibility

`features` is additive inside the unreleased `specVersion: "0.1"` draft.
Maintained examples are migrated, while legacy `capabilities` remains
structurally valid and deprecated.

Removing the legacy field, changing a feature meaning, removing a core feature,
or treating feature support as an authorization signal requires an explicit
compatibility and version decision.
