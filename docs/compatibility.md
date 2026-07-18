# Compatibility

NexFlow compatibility is about preserving the meaning of manifests across tools and time.

For the current supported combinations and explicit implementation gaps, see the [Compatibility Matrix](compatibility-matrix.md).

## Compatibility Goals

- A manifest should mean the same thing across runtimes.
- A runtime should reject unsupported versions clearly.
- A schema should validate common structural errors.
- Examples should remain valid for the spec version they target.
- Extensions should not change core semantics silently.

## Compatibility Classes

### Compatible Changes

- adding optional fields
- clarifying documentation
- adding new event types
- adding new capabilities
- adding examples
- tightening unsafe language without changing manifest meaning

### Potentially Breaking Changes

- renaming fields
- changing default approval behavior
- changing memory visibility semantics
- changing capability meaning
- changing an active agent definition component reference
- increasing agent definition autonomy
- broadening agent definition context, memory, permission, capability, or extension references
- changing a pinned model reference
- changing a floating model alias policy
- changing provider preference precedence, provider selection constraints, fallback eligibility, or provider selection explainability expectations
- broadening provider eligibility, training use, or tool use in a model profile
- changing a prompt revision used by an active agent definition
- changing safety prompt material
- changing required prompt variables used by runtime assembly
- lowering prompt classification incorrectly
- disclosing sensitive prompt text in public manifests
- changing retrieval source sets used by an active agent definition
- changing retrieval index or corpus versions
- changing chunking or retriever strategy
- disabling required citations
- allowing stale context where it was previously prohibited
- broadening retrieval classification or cross-scope reuse
- changing memory retention, visibility, sensitivity, allowed consumers, allowed writers, or promotion paths
- changing event envelope identity, actor, subject, correlation, causation, payload, audit, or redaction semantics
- changing reference CLI command names, exit code meanings, diagnostic code meanings, or machine-readable output formats
- removing fields
- changing required fields
- changing event payload structure

## Extension Compatibility

Extensions MUST declare a namespace and lifecycle state. A runtime that does not understand an extension SHOULD preserve it when possible and MUST NOT treat it as granting additional permission.

[RFC-0006](../rfcs/RFC-0006-extension-namespaces.md) proposes namespace ownership, lifecycle transition, registry, and compatibility expectations for extensions.

## Runtime Compatibility

Future runtimes should publish:

- supported spec versions
- supported manifest kinds
- supported extension namespaces
- validation behavior
- enforcement limitations

See [Conformance](conformance.md) for draft vocabulary that tools can use when describing support levels.

[RFC-0007](../rfcs/RFC-0007-approval-gates.md) proposes approval semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility when approval meaning changes.

[RFC-0008](../rfcs/RFC-0008-memory-retention.md) proposes memory retention semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, privacy, audit, and safety compatibility.

[RFC-0009](../rfcs/RFC-0009-event-envelope.md) proposes event envelope semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, traceability, privacy, and safety compatibility.

[RFC-0010](../rfcs/RFC-0010-provider-selection.md) proposes provider selection semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, privacy, cost, safety, and compatibility.

[RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) proposes validation-only reference CLI scope that may affect `NF-CLI`, `NF-SCHEMA`, `NF-SEMANTIC`, diagnostics, and developer workflow compatibility.

## Conformance Impact

Compatibility notes should identify which conformance levels are affected when possible.

Examples:

| Change | Likely Impact |
| --- | --- |
| Add optional schema field | May preserve `NF-SCHEMA`; may require docs and examples updates. |
| Rename required manifest field | Breaks `NF-MANIFEST` and `NF-SCHEMA`. |
| Change approval gate meaning | May break `NF-RUNTIME` safety expectations. |
| Change memory retention, visibility, sensitivity, consumers, writers, or promotion paths | May affect `NF-SEMANTIC`, `NF-RUNTIME`, privacy, audit, and safety compatibility. |
| Change event envelope identity, actor, subject, correlation, causation, payload, audit, or redaction semantics | May affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, traceability, privacy, and safety compatibility. |
| Change provider selection precedence, constraints, fallback, or explainability expectations | May affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, privacy, cost, safety, and compatibility. |
| Change reference CLI command names, exit codes, diagnostic codes, or output formats | May affect `NF-CLI`, CI workflows, editor integrations, and developer tooling compatibility. |
| Add semantic cross-reference rule | May affect `NF-SEMANTIC` validators. |
| Change extension namespace lifecycle | May affect `NF-EXTENSION` compatibility. |
| Change active agent definition components or autonomy | May affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility. |
| Change model profile selection or constraints | May affect `NF-SEMANTIC`, `NF-RUNTIME`, and audit compatibility. |
| Change prompt set revisions or safety review status | May affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility. |
| Change retrieval sources, index versions, freshness, or citation rules | May affect `NF-SEMANTIC`, `NF-RUNTIME`, context safety, and audit compatibility. |

## Compatibility Promise

Until `1.0`, NexFlow prioritizes learning and correctness over strict stability. Breaking changes are allowed with documentation and migration guidance.
