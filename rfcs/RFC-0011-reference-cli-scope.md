# RFC-0011: Reference CLI Scope

## Status

Draft

## Summary

This RFC proposes the initial scope for a future NexFlow reference CLI.

The proposal defines:

- why a reference CLI is useful
- which commands are in scope for an initial CLI
- which behaviors are explicitly out of scope
- validation, inspection, graph, and initialization boundaries
- output and diagnostic expectations
- safety rules that prevent the CLI from becoming a runtime
- conformance expectations for `NF-CLI`

The goal is to make NexFlow manifests easier to author and review without implementing orchestration behavior before the specification is ready.

## Motivation

NexFlow is specification-first.

The repository already provides:

- documentation
- JSON Schemas
- examples
- RFCs
- validation guidance

Those assets are useful, but contributors still need a repeatable way to:

- parse manifest sets
- validate schema shape
- inspect project structure
- visualize references
- initialize a minimal manifest set
- report errors consistently

A reference CLI can improve developer experience, but it must not accidentally become a runtime.

If the CLI starts executing workflows, calling providers, writing memory, invoking tools, or enforcing permissions, it would cross from validation into orchestration. That would violate the current project direction and make runtime decisions before the runtime architecture RFC is complete.

## Proposal

The initial reference CLI should be validation and inspection only.

Possible command names:

- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`
- `nexflow init`

The CLI should help humans understand manifests. It should not coordinate work.

## Non-Goals

The initial reference CLI must not:

- run agents
- call model providers
- call embedding providers
- execute shell commands from manifests
- execute workflows
- perform handoffs
- create pull requests
- install dependencies
- deploy applications
- write long-term memory
- read undeclared context sources
- connect to live third-party APIs by default
- enforce runtime permissions as if execution were happening
- become a background daemon
- require a hosted service

The CLI may validate that such behavior is declared correctly. It must not perform the behavior.

## Command Scope

### `nexflow validate`

`nexflow validate` should check manifest structure and report diagnostics.

Initial scope:

- discover a manifest set
- parse YAML safely
- validate JSON-compatible data against schemas
- report unsupported `specVersion`
- report unsupported `kind`
- report schema errors with file and path
- optionally perform semantic checks when implemented
- produce human-readable output
- optionally produce machine-readable output

Out of scope:

- live provider checks
- live GitHub, Linear, Jira, Figma, or MCP checks
- workflow execution
- command execution
- automatic fixes unless a future RFC defines them

Example:

```sh
nexflow validate examples/minimal-team
```

Example output:

```text
ok examples/minimal-team/project.yaml Project
ok examples/minimal-team/agents.yaml AgentSet
warning examples/minimal-team/tasks.yaml tasks[0].approvalGates: semantic validation not implemented
```

### `nexflow inspect`

`nexflow inspect` should summarize a manifest set.

Initial scope:

- list manifest files
- list manifest kinds
- show project metadata
- summarize agents, workflows, tasks, handoffs, permissions, capabilities, context sources, memory scopes, providers, model profiles, prompt sets, retrieval profiles, events, and extensions
- show references where possible
- report unsupported manifests clearly

Out of scope:

- reading external systems
- resolving provider-native resources
- loading prompt content from private sources
- exposing secrets
- executing anything

Example:

```sh
nexflow inspect examples/software-team
```

### `nexflow graph`

`nexflow graph` should produce a static relationship graph from manifests.

Initial graph views may include:

- task dependencies
- workflow stages and steps
- handoffs
- agent to permission references
- permission to capability references
- agent definition component references
- context and memory access references
- model profile, prompt set, and retrieval profile references

Output formats may include:

- text summary
- Mermaid
- DOT
- JSON

Out of scope:

- dynamic runtime state
- live task board state
- live pull request state
- event replay
- workflow scheduling
- orchestration decisions

Example:

```sh
nexflow graph examples/product-delivery-team --format mermaid
```

### `nexflow init`

`nexflow init` should create a minimal manifest set.

Initial scope:

- write starter YAML files
- choose from templates such as minimal team or software team
- include `specVersion: "0.1"`
- include safe defaults
- avoid provider-specific assumptions
- avoid autonomous execution defaults
- include approval gates for risky capabilities
- explain generated files after creation

Out of scope:

- installing runtime dependencies
- creating remote repositories
- generating secrets
- configuring provider accounts
- setting up cloud services
- creating live integrations
- running workflows

Example:

```sh
nexflow init --template minimal-team
```

## Manifest Discovery

The CLI should support explicit paths.

Example:

```sh
nexflow validate examples/minimal-team
```

Future discovery may support:

- current directory
- a `project.yaml` path
- a directory containing manifests
- a manifest bundle if a future RFC accepts bundling

Discovery should be deterministic and visible.

The CLI should not scan unrelated parent directories indefinitely.

## Diagnostics

Diagnostics should be precise and stable enough for editors and CI.

Each diagnostic should include:

- severity
- code
- message
- file path
- manifest kind when known
- JSON/YAML path when known
- related references when useful

Severity levels:

- `error`: invalid or unsupported input
- `warning`: likely issue or unimplemented semantic check
- `info`: useful context

Example machine-readable diagnostic:

```json
{
  "severity": "error",
  "code": "NF-SCHEMA-REQUIRED",
  "file": "examples/minimal-team/agents.yaml",
  "kind": "AgentSet",
  "path": "$.agents[0].id",
  "message": "Required field is missing."
}
```

Diagnostic codes should be stable once the CLI is public enough for CI usage.

## Output Modes

The CLI should support human-readable output first.

Future output modes may include:

- `text`
- `json`
- `sarif`
- `mermaid`
- `dot`

Machine-readable formats should avoid unstable prose where structured fields are available.

## Exit Codes

Suggested exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Success, no errors. |
| `1` | Validation or semantic errors found. |
| `2` | CLI usage error. |
| `3` | Unsupported spec version, manifest kind, or feature. |
| `4` | Internal CLI error. |

Warnings alone should not necessarily produce a non-zero exit code unless a strict mode is enabled.

## Configuration

The initial CLI should avoid complex configuration.

Possible future configuration:

- strict mode
- output format
- schema path override
- manifest include/exclude paths
- extension namespace allowlist
- semantic validation level

Configuration must not contain secrets.

## Extension Handling

The CLI should preserve provider and extension neutrality.

For unknown extensions, initial behavior should be:

- preserve metadata during inspection
- report that semantics are unsupported
- do not treat extension presence as granting permission
- do not call extension services

Future extension-aware validation should require explicit extension support and documentation.

## Safety Boundaries

The CLI must maintain clear safety boundaries.

It should not:

- execute manifest-described actions
- run shell commands declared in manifests
- call providers to check availability
- fetch remote context by default
- write memory
- resolve credentials
- create network side effects
- mutate remote systems
- approve changes
- deploy applications

This keeps the CLI usable in CI and review environments without granting it runtime authority.

## Relationship To Validation Strategy

The CLI should implement the layers proposed in [RFC-0005](RFC-0005-validation-strategy.md) incrementally.

Initial support may include:

- syntax checks
- schema validation
- manifest inventory

Future support may include:

- semantic validation
- diagnostic codes
- graph output
- extension-aware checks

Runtime preflight checks remain out of scope until runtime behavior is specified.

## Relationship To Conformance

A CLI may claim `NF-CLI` conformance only for supported commands and spec versions.

Example claim:

```text
Supports: NF-MANIFEST, NF-SCHEMA, NF-CLI
Partial: NF-SEMANTIC
Does not support: NF-RUNTIME
Spec versions: 0.1
Commands: validate, inspect
```

The CLI must not claim `NF-RUNTIME` conformance unless it actually implements runtime enforcement under a future accepted runtime specification.

## Relationship To Runtime Architecture

This RFC does not choose the runtime implementation language.

The reference CLI may later share libraries with a runtime, but the initial CLI scope should be decided before runtime implementation begins.

The future Runtime Architecture Decision RFC should evaluate whether CLI and runtime code should share:

- manifest parsers
- schema validation
- semantic validation
- graph builders
- conformance tests
- extension loading boundaries

## Compatibility Impact

This RFC is additive and planning-oriented.

It does not change existing manifest requirements.

Future breaking changes may include:

- changing command names after public adoption
- changing exit code meanings
- changing diagnostic code meanings
- changing machine-readable output formats
- making previously optional semantic checks mandatory
- changing `nexflow init` generated manifest defaults in unsafe ways

Compatibility notes should identify whether changes affect `NF-CLI`, `NF-SCHEMA`, `NF-SEMANTIC`, or future `NF-RUNTIME` behavior.

## Security And Safety Impact

The primary safety benefit is preventing the reference CLI from becoming an accidental runtime.

Security-sensitive points:

- `init` should not generate secrets
- `inspect` should not expose private prompt content or credentials
- `validate` should not call external systems by default
- `graph` should not include sensitive raw data unless explicitly present in manifests
- extension metadata should not grant access
- network access should be explicit and avoid side effects

The CLI should be safe to run in local development and CI with read access to repository files.

## Alternatives Considered

### Build Runtime First

NexFlow could skip a validation-only CLI and implement orchestration directly.

This would conflict with the specification-first principle and risk embedding runtime behavior before the spec is coherent.

### No Reference CLI

NexFlow could rely only on docs and schemas.

This keeps the project simple, but makes contributor experience weaker and leaves validation behavior fragmented across third-party tools.

### Full Semantic Validator Immediately

NexFlow could require full semantic validation before the first CLI.

This is likely too large for an initial step. The CLI should support schema validation and grow toward semantic validation through documented milestones.

### Provider-Aware CLI

NexFlow could let the CLI call providers or integration APIs for validation.

This would introduce credentials, network side effects, provider assumptions, and safety risk. Live checks should require a future RFC.

## Open Questions

- Should `nexflow validate` be the first implemented command?
- Should `nexflow init` generate all core manifests or a smaller starter subset?
- Should diagnostic code namespaces be standardized before implementation?
- Should JSON output be stable from the first release?
- Should SARIF output be part of the first CLI milestone?
- Should `nexflow graph` produce Mermaid, DOT, JSON, or all three initially?
- Should extension-aware validation be plugin-based or built into the CLI?
- Should the CLI live in this repository or a future `NexFlow Runtime`/`NexFlow Tools` repository?
