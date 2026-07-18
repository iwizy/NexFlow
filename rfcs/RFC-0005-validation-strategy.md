# RFC-0005: Validation Strategy

## Status

Draft

## Summary

This RFC proposes the initial NexFlow validation strategy.

The strategy separates:

- syntax checks
- JSON Schema validation
- manifest set inventory
- future semantic validation
- future runtime preflight checks

The goal is to make validation useful before a runtime exists while avoiding the false impression that valid manifests are automatically safe to execute.

## Motivation

NexFlow is specification-first. The repository already contains draft schemas and examples, but teams and future tool authors need a clearer answer to a practical question: "What does it mean to validate a NexFlow project?"

JSON Schema validation is necessary, but it is not enough. It can check manifest shape, required fields, simple enums, and common object structure. It cannot fully check whether a full team configuration is coherent, safe, or executable.

Examples of checks outside JSON Schema include:

- whether task owners exist
- whether permission references point to declared permissions
- whether approval gates cover high-risk capabilities
- whether agent definitions reference existing model profiles, prompt sets, and retrieval profiles
- whether memory scope access is compatible with project policy
- whether workflow dependencies form a valid graph
- whether extension requirements are satisfied

Without a shared validation strategy, future validators could disagree about errors, warnings, output formats, or the boundary between validation and runtime enforcement.

## Proposal

NexFlow should define validation as a layered process.

Each layer should be explicit about what it checks, what it cannot check, and which conformance level it supports.

## Validation Layers

### 1. Syntax Checks

Syntax checks verify that files are readable before schema or semantic validation begins.

They include:

- JSON syntax checks for schema files
- YAML parsing for manifest files
- safe YAML loading
- rejection of YAML constructs that cannot be represented as JSON-compatible data

Syntax checks should report file paths and parser errors.

### 2. Schema Validation

Schema validation checks each manifest against the JSON Schema for its declared `kind`.

A schema validator should:

1. Load YAML safely.
2. Convert YAML into JSON-compatible values.
3. Require `specVersion`.
4. Require `kind`.
5. Select the matching schema for `kind`.
6. Reject unsupported `specVersion` values.
7. Report field paths for validation failures.

Schema validation supports the `NF-SCHEMA` conformance level from [RFC-0003](RFC-0003-conformance-levels.md).

Schema validation does not prove that referenced objects exist, policies are safe, workflows are executable, or future runtime behavior is enforceable.

### 3. Manifest Set Inventory

Before semantic validation, a validator should build an inventory of the project manifest set.

The inventory should record:

- manifest file paths
- manifest kinds
- manifest IDs where present
- declared agents, roles, tasks, workflows, handoffs, capabilities, permissions, context sources, memory scopes, providers, model profiles, prompt sets, retrieval profiles, events, and extensions
- duplicate IDs within the same manifest kind
- unsupported manifest kinds
- extension namespaces

The inventory is an internal validation artifact. It does not need to become a public manifest format in this RFC.

### 4. Semantic Validation

Semantic validation checks cross-manifest meaning.

It should be introduced incrementally and should report unsupported checks honestly.

Initial semantic validation should focus on:

| Area | Example checks |
| --- | --- |
| References | Referenced agents, tasks, permissions, capabilities, context sources, memory scopes, providers, profiles, and extensions exist. |
| Permissions | Permission rules reference declared capabilities and do not silently override deny rules. |
| Approval gates | High-risk actions, broad autonomy, deployments, destructive operations, and credential access have gates where required by project policy. |
| Agent assembly | Agent definitions reference existing model profiles, prompt sets, retrieval profiles, permissions, capabilities, context sources, memory scopes, and extensions. |
| Context | Context source classifications, freshness rules, web boundaries, and MCP context/tool separation are coherent. |
| Memory | Scope access, ownership, allowed writers, allowed consumers, retention, and promotion rules preserve sensitivity boundaries. |
| Workflows | Workflow steps, tasks, dependencies, handoffs, and emitted events form a coherent graph. |
| Providers | Provider references and model profile constraints are declared and compatible with project policy. |
| Prompts | Prompt set owners, approvers, source references, safety review status, classifications, and compatibility notes are coherent. |
| Retrieval | Retrieval profile sources, excluded sources, index metadata, freshness, citations, sensitivity, and review triggers are compatible with context policy. |
| Extensions | Extension namespaces, lifecycle state, required capabilities, and permission implications are declared. |

Semantic validation supports the future `NF-SEMANTIC` conformance level.

### 5. Runtime Preflight

Runtime preflight is a future layer for implementations that intend to execute or coordinate work.

It may check:

- runtime-supported `specVersion` values
- runtime-supported manifest kinds
- extension loading policy
- provider availability
- approval gate enforcement support
- credential isolation configuration
- context and memory backend availability
- event sink availability

Runtime preflight is not part of the current repository. It belongs to future runtime or CLI work and must not be implied by schema validation.

## Diagnostic Severity

Validators should classify diagnostics as:

| Severity | Meaning |
| --- | --- |
| `error` | Validation cannot continue or the manifest set violates a required rule. |
| `warning` | The manifest set may be valid, but a safety, compatibility, or completeness concern should be reviewed. |
| `info` | Useful context that does not affect validation success. |

A validation tool should exit unsuccessfully when it reports errors.

Warnings should be visible and machine-readable, but projects may decide whether warnings block CI.

## Diagnostic Codes

Future validators should use stable diagnostic code families.

Proposed families:

| Prefix | Purpose |
| --- | --- |
| `NF-SYNTAX` | Parser and JSON-compatible data errors. |
| `NF-SCHEMA` | JSON Schema validation failures. |
| `NF-REF` | Missing or invalid cross-manifest references. |
| `NF-POLICY` | Project policy, permission, approval, autonomy, context, or memory consistency issues. |
| `NF-GRAPH` | Workflow, task, dependency, and handoff graph issues. |
| `NF-SAFETY` | Sensitive operations, destructive actions, credential access, production actions, or high-risk autonomy issues. |
| `NF-EXT` | Extension namespace, lifecycle, capability, or compatibility issues. |
| `NF-AUDIT` | Missing or incomplete audit metadata expectations. |

This RFC does not require final numeric codes. A future RFC or CLI design may define exact codes.

[RFC-0015](RFC-0015-typed-references.md) proposes exact `NF-REF-*` codes for malformed, unresolved, ambiguous, duplicate, wrong-kind, and invalid-scope resource references.

## Validator Output

Validator output should be actionable for humans and stable enough for automation.

Human-readable output should include:

- file path
- manifest kind
- field path when available
- severity
- diagnostic code
- concise message
- suggested fix when practical

Machine-readable output may use JSON.

Example:

```json
{
  "version": "0.1",
  "conformance": ["NF-SCHEMA"],
  "diagnostics": [
    {
      "severity": "error",
      "code": "NF-SCHEMA-INVALID-AUTONOMY",
      "file": "examples/minimal-team/agents.yaml",
      "kind": "AgentSet",
      "path": "$.agents[0].autonomyLevel",
      "message": "autonomyLevel must be one of the documented values"
    }
  ]
}
```

Diagnostics should avoid printing secrets, raw credentials, private keys, sensitive prompt text, or unnecessary personal data.

## Safety Boundaries

A validator must not become a hidden runtime.

Validation should not:

- execute workflow steps
- execute commands declared in manifests
- call model providers
- install dependencies
- deploy applications
- mutate project files unless explicitly requested
- read undeclared external context sources by default
- expand permissions because an extension is present
- treat passing validation as approval to perform dangerous actions

Live checks against external systems, if introduced later, should be opt-in and clearly separated from offline validation.

## Relationship To Conformance

This RFC complements [RFC-0003](RFC-0003-conformance-levels.md).

Suggested mapping:

| Validation capability | Conformance level |
| --- | --- |
| YAML and JSON parsing | prerequisite for validation, not enough alone |
| Per-manifest JSON Schema validation | `NF-SCHEMA` |
| Cross-manifest reference and policy checks | `NF-SEMANTIC` |
| Validation-only CLI command | `NF-CLI` when scoped and documented |
| Runtime preflight before execution | part of future `NF-RUNTIME` support |

Tools should state which layers they support and which checks remain unsupported.

## Compatibility Impact

This RFC does not change manifest structure.

If accepted, it may guide:

- future `docs/validation.md` updates
- future `docs/conformance.md` updates
- future reference CLI behavior
- future diagnostic code registries
- future semantic validation test cases

No existing schema, example, or manifest needs migration because of this RFC.

Future changes that make a warning into an error should document compatibility impact because they can affect CI and contributor workflows.

## Security and Safety Impact

This RFC improves safety by making validation limits explicit.

It reduces the risk that:

- schema-valid manifests are treated as safe to execute
- validation-only tools perform hidden runtime actions
- unsupported `specVersion` or `kind` values are silently accepted
- sensitive data appears in diagnostics
- extensions grant access by presence alone

Validation remains a review aid. Runtime enforcement, credential isolation, sandboxing, provider controls, deployment controls, and human override behavior remain future runtime responsibilities.

## Alternatives Considered

### JSON Schema Only

NexFlow could treat JSON Schema validation as the complete validation story.

This is insufficient because many NexFlow rules are relational and policy-driven.

### Runtime-Only Validation

NexFlow could defer validation semantics until a runtime exists.

This would reduce the value of the specification-first repository and would make early tool support less consistent.

### Strict Semantic Validation From The Start

NexFlow could require all semantic checks before claiming validation support.

This is unrealistic for a draft specification. Semantic validation should grow incrementally and make unsupported checks explicit.

### Network-Backed Validation By Default

NexFlow could validate external systems such as GitHub, issue trackers, provider APIs, or knowledge bases during validation.

This would create privacy, credential, reliability, and reproducibility risks. Offline validation should be the default.

## Open Questions

- Should diagnostic codes be standardized in the specification or reserved for the reference CLI?
- Should a manifest set include an optional manifest inventory file?
- Should semantic validation have named profiles, such as `basic`, `safety`, and `strict`?
- Which warnings should become errors before `1.0`?
- Should future validators support SARIF output for code review tools?
- How should private extension validators publish conformance claims without exposing internal policy?
- Should validation fixtures include intentionally invalid examples?
