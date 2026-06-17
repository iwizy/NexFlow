# Conformance

Conformance describes what it means for a manifest set, validator, CLI, runtime, or extension to support NexFlow.

This draft is intentionally lightweight. It gives implementers a shared vocabulary without pretending that a production runtime exists today.

Related RFCs:

- [RFC-0003: Conformance Levels](../rfcs/RFC-0003-conformance-levels.md)
- [RFC-0005: Validation Strategy](../rfcs/RFC-0005-validation-strategy.md)
- [RFC-0006: Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md)
- [RFC-0007: Approval Gates](../rfcs/RFC-0007-approval-gates.md)

## Goals

- Make compatibility claims precise.
- Separate documentation-only use from executable runtime behavior.
- Let validators and runtimes advertise partial support honestly.
- Keep provider-specific and runtime-specific behavior outside the core spec.
- Preserve safety requirements for permissions, approvals, context, and memory.

## Conformance Targets

### Manifest Set

A NexFlow manifest set is a collection of YAML manifests that describe a project.

A conforming manifest set MUST:

- include `specVersion`
- use documented `kind` values
- follow the core manifest model
- declare capabilities separately from permissions
- declare context and memory access explicitly
- avoid raw secrets

### Schema Validator

A schema validator checks manifest structure against JSON Schemas.

A conforming schema validator MUST:

- parse manifests into JSON-compatible data
- validate each supported manifest against the matching schema
- report unsupported `specVersion` values clearly
- report unsupported manifest `kind` values clearly

A schema validator SHOULD:

- produce file and path specific error messages
- validate all manifests in a project together when possible
- distinguish schema errors from semantic warnings

### Semantic Validator

A semantic validator checks relationships that JSON Schema cannot fully express.

Examples include:

- agent permissions reference existing permission IDs
- permission capabilities reference existing capability IDs
- tasks reference existing owners and dependencies
- workflow steps reference existing tasks
- handoffs reference existing actors and artifacts
- events referenced by workflows are declared

Semantic validation is planned future work.

### Reference CLI

A future reference CLI may support commands such as:

- `nexflow init`
- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`

An initial conforming CLI SHOULD focus on validation and inspection. It MUST NOT imply orchestration behavior unless that behavior is specified.

### Runtime

A runtime interprets NexFlow manifests and coordinates work.

Runtime conformance is planned future work. A future conforming runtime MUST enforce:

- supported `specVersion`
- declared capabilities
- permissions
- approval gates
- autonomy levels
- context access boundaries
- memory scope boundaries
- audit event expectations

Unsupported extension behavior MUST NOT silently grant additional access.

### Extension

An extension adds namespaced behavior for integrations or implementation-specific metadata.

A conforming extension MUST:

- declare a namespace
- declare lifecycle status
- document required capabilities
- document permission implications
- avoid redefining core semantics incompatibly

## Draft Conformance Levels

| Level | Name | Meaning |
| --- | --- | --- |
| `NF-MANIFEST` | Manifest Conformance | A project uses documented manifest shapes and required metadata. |
| `NF-SCHEMA` | Schema Conformance | Manifests pass the published JSON Schemas for their `specVersion`. |
| `NF-SEMANTIC` | Semantic Conformance | Cross-manifest references and policy relationships are validated. |
| `NF-CLI` | CLI Conformance | A CLI validates or inspects manifests without hidden orchestration behavior. |
| `NF-RUNTIME` | Runtime Conformance | A runtime enforces permissions, approvals, autonomy, context, memory, and events. |
| `NF-EXTENSION` | Extension Conformance | An extension is namespaced, lifecycle-aware, and permission-transparent. |

## Conformance Claims

Tools SHOULD state conformance claims explicitly.

Example:

```text
Supports: NF-MANIFEST, NF-SCHEMA
Does not support: NF-SEMANTIC, NF-RUNTIME
Spec versions: 0.1
```

Runtime or CLI documentation SHOULD also list:

- supported manifest kinds
- supported `specVersion` values
- unsupported fields
- supported extension namespaces
- validation limitations
- enforcement limitations

Conformance claims are compatibility claims. A change can affect one conformance level without affecting another. For example, an optional schema field may preserve `NF-SCHEMA`, while a change to approval gate meaning may affect `NF-RUNTIME`.

## Non-Conforming Behavior

The following behavior is non-conforming:

- treating capability declarations as permissions
- granting access through an extension by presence alone
- ignoring approval gates for high-risk actions
- using undeclared context sources
- writing memory outside declared scopes
- executing workflows while claiming validation-only behavior
- silently accepting unsupported spec versions

## Current Repository Status

This repository currently provides:

- `NF-MANIFEST` draft documentation
- `NF-SCHEMA` draft schemas
- reference examples
- validation guidance

It does not currently provide:

- semantic validation tooling
- reference CLI
- runtime enforcement
- provider integrations
