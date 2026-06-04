# RFC-0003: Conformance Levels

## Status

Draft

## Summary

This RFC proposes the initial NexFlow conformance vocabulary for manifest sets, schema validators, semantic validators, CLIs, runtimes, and extensions.

The goal is to let tools make precise support claims without implying that NexFlow already includes a production runtime.

## Motivation

NexFlow is specification-first. Different tools may support different parts of the specification at different times:

- a repository may publish valid manifests
- a validator may check JSON Schemas
- a future validator may check cross-manifest references
- a future CLI may inspect manifests
- a future runtime may enforce permissions and approval gates
- an extension may add namespaced integration metadata

Without a shared conformance vocabulary, these tools could all claim to "support NexFlow" while supporting very different behavior.

Conformance levels make partial support honest, reviewable, and safer.

## Proposal

NexFlow should define six draft conformance levels.

| Level | Target | Meaning |
| --- | --- | --- |
| `NF-MANIFEST` | Manifest set | The project uses documented manifest shapes, required metadata, and `specVersion`. |
| `NF-SCHEMA` | Schema validator | The tool validates supported manifests against published JSON Schemas. |
| `NF-SEMANTIC` | Semantic validator | The tool validates cross-manifest references and policy relationships. |
| `NF-CLI` | Reference or compatible CLI | The tool validates, inspects, or graphs manifests without hidden orchestration behavior. |
| `NF-RUNTIME` | Runtime | The runtime enforces declared permissions, approvals, autonomy, context, memory, and events. |
| `NF-EXTENSION` | Extension | The extension is namespaced, lifecycle-aware, and transparent about capability and permission impact. |

### Conformance Claims

A tool or project claiming NexFlow support should publish:

- supported conformance levels
- supported `specVersion` values
- supported manifest kinds
- unsupported fields or known limitations
- supported extension namespaces
- validation behavior
- enforcement behavior, if any

Example:

```text
Supports: NF-MANIFEST, NF-SCHEMA
Does not support: NF-SEMANTIC, NF-CLI, NF-RUNTIME
Spec versions: 0.1
Manifest kinds: Project, AgentSet, Workflow, TaskSet
Limitations: no cross-manifest reference validation
```

### Required Boundaries

Conformance claims must distinguish validation from enforcement.

Passing `NF-SCHEMA` does not mean:

- a manifest set is semantically complete
- approval gates are enforceable
- permissions are enforced
- context access is isolated
- memory retention is implemented
- provider behavior is safe

Claiming `NF-RUNTIME` should require actual enforcement of safety-critical semantics, including:

- supported `specVersion`
- declared capabilities
- permissions
- approval gates
- autonomy levels
- context source boundaries
- memory scope boundaries
- audit event expectations

### Compatibility Levels

Conformance levels are compatibility claims, not product tiers.

A change that preserves `NF-SCHEMA` may still affect `NF-SEMANTIC` or `NF-RUNTIME` behavior. For example:

- adding an optional field may be schema-compatible
- changing approval gate meaning may be runtime-breaking
- changing memory visibility may be safety-breaking
- changing extension namespace rules may be extension-breaking

Future compatibility notes should identify which conformance levels are affected.

### Non-Conforming Claims

The following claims should be considered non-conforming:

- claiming runtime support while only parsing manifests
- treating capabilities as permissions
- granting access because an extension is present
- ignoring required approval gates for high-risk actions
- silently accepting unsupported `specVersion` values
- executing commands while presenting itself as validation-only

## Compatibility Impact

This RFC does not change manifest structure.

If accepted, future compatibility notes should identify impacted conformance levels when a change affects validators, CLIs, runtimes, or extensions.

## Security and Safety Impact

This RFC improves safety by requiring precise support claims.

It prevents a validation-only tool from being confused with a runtime that enforces permissions, approval gates, context access, memory boundaries, and audit expectations.

## Alternatives Considered

### Single Support Claim

NexFlow could use one support label, such as "NexFlow-compatible".

This is too vague because schema validation, semantic validation, CLI inspection, runtime enforcement, and extension support are materially different.

### Runtime-First Conformance

NexFlow could define conformance only for runtimes.

This does not fit the current project stage. The specification, schemas, and examples should provide value before any runtime exists.

### Provider-Specific Conformance

NexFlow could define conformance by provider support.

This would violate provider neutrality and would make provider behavior part of the core compatibility surface.

## Open Questions

- Should future versions add a formal conformance test suite?
- Should conformance claims have a machine-readable manifest?
- Should extension conformance require a public namespace registry?
- Should `NF-CLI` be split into validation, inspection, and graph sublevels?
- What evidence should be required before a tool can claim `NF-RUNTIME`?
