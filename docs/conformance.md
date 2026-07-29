# Conformance

Conformance describes what it means for a manifest set, validator, CLI, runtime, or extension to support NexFlow.

This draft is intentionally lightweight. It gives implementers a shared vocabulary without pretending that a production runtime exists today.

Related RFCs:

- [RFC-0003: Conformance Levels](../rfcs/RFC-0003-conformance-levels.md)
- [RFC-0005: Validation Strategy](../rfcs/RFC-0005-validation-strategy.md)
- [RFC-0006: Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md)
- [RFC-0007: Approval Gates](../rfcs/RFC-0007-approval-gates.md)
- [RFC-0008: Memory Retention](../rfcs/RFC-0008-memory-retention.md)
- [RFC-0009: Event Envelope](../rfcs/RFC-0009-event-envelope.md)
- [RFC-0010: Provider Selection](../rfcs/RFC-0010-provider-selection.md)
- [RFC-0011: Reference CLI Scope](../rfcs/RFC-0011-reference-cli-scope.md)

See the [Compatibility Matrix](compatibility-matrix.md) for the repository's current evidence-backed support claims.

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

- agent definition permission references resolve to existing permission IDs
- deprecated AgentSet behavior fields do not broaden effective configuration
- permission capabilities reference existing capability IDs
- approval gate targets resolve by their declared kind and required scope
- tasks reference existing owners and dependencies
- workflow steps reference existing tasks
- handoffs reference existing actors and artifacts
- events referenced by workflows are declared

Complete semantic validation is planned future work. The repository includes limited semantic reference smoke checks for maintained examples, but they do not establish `NF-SEMANTIC` conformance.

The [Semantic Reference Inventory](semantic-reference-inventory.md) defines the
recommended P0-P3 implementation order, target namespaces, current coverage,
known gaps, and fields that remain unsafe to resolve generically.

### Typed Reference Support

The repository implements shared typed-reference shapes and focused structural
checks. This evidence supports the schema definitions described in
[Typed References](typed-references.md), including the closed approval target
contract described in [Approval Gate Targets](approval-gate-targets.md); it does not establish
`NF-SEMANTIC` conformance.

A tool claiming complete typed-reference support MUST cover:

- every reference field contract included in the claim
- allowed target kinds and effective scope
- exact target resolution and uniqueness
- duplicate, missing, wrong-kind, and ambiguous outcomes
- version-specific scalar-to-object migration behavior
- diagnostics required by the claimed specification version

Parsing a valid `{kind, id, scope}` object is not sufficient for a semantic
support claim.

### Work Reference Namespace Support

The repository implements workflow-wide step and assembly-wide task artifact
namespace checks described in
[Work Reference Namespaces](work-reference-namespaces.md).

A tool claiming this support MUST:

- reject duplicate stage IDs within one workflow
- reject duplicate step IDs across all stages in one workflow
- resolve step dependencies only in the containing workflow
- reject duplicate task artifact IDs across the logical assembly
- resolve handoff artifact IDs only in the assembly artifact namespace
- avoid file-order, nearest-container, or cross-workflow fallback

This support does not establish workflow graph correctness, artifact provenance,
policy enforcement, or complete `NF-SEMANTIC` conformance.

### Provider Feature Support

The repository implements the closed provider feature vocabulary described in
[Provider Features](provider-features.md).

A tool claiming this support MUST:

- keep provider features separate from `CapabilitySet` action identifiers
- reject unknown, duplicate, and empty feature declarations
- reject simultaneous `features` and legacy `capabilities`
- treat legacy provider `capabilities` as migration data, not references
- avoid inferring permission, tool access, network access, or provider
  availability from a feature

This support does not establish provider selection, live model capability,
provider availability, authorization, or runtime conformance.

### Agent Assembly Inspection

Agent Assembly is a derived projection of Effective Agent Configuration, not a
manifest or independent conformance target in the current draft. No repository
tool currently computes or serializes the complete view.

A future tool claiming Agent Assembly inspection support MUST:

- preserve the authority of authored manifests and domain policies
- derive values deterministically without generic merging or file-order rules
- expose provenance, unresolved facts, and blockers
- fail closed on ambiguity and unsupported required semantics
- redact sensitive content without hiding blocker existence
- avoid treating exported output as a grant, override, or resolution input

Such a claim would require appropriate `NF-SEMANTIC` behavior and, when exposed
through a command, an `NF-CLI` output compatibility contract.

### Reference CLI

A future reference CLI may support commands such as:

- `nexflow init`
- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`

An initial conforming CLI SHOULD focus on validation and inspection. It MUST NOT imply orchestration behavior unless that behavior is specified.

[RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) proposes the initial validation-only reference CLI scope for `validate`, `inspect`, `graph`, and `init`.

### Runtime

A runtime interprets NexFlow manifests and coordinates work.

Runtime conformance is planned future work. A future conforming runtime MUST enforce:

- supported `specVersion`
- declared capabilities
- permissions
- approval gates
- human override blocking, revocation, failure, and resume requirements
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

Tools SHOULD publish explicit, versioned conformance claims. NexFlow provides a
[machine-readable schema and YAML template](../conformance/README.md) plus a
matching [human-readable template](../conformance/CONFORMANCE-CLAIM.template.md).
The complete contract is documented in
[Conformance Claims](conformance-claims.md).

Every claim identifies:

- one exact subject version
- supported NexFlow `specVersion` values
- supported manifest kinds
- supported extension namespaces
- a status for every current conformance level
- validation behavior and enforcement behavior
- evidence and limitations
- a responsible party

Level status is one of `supported`, `partial`, `unsupported`,
`not-applicable`, or `not-evaluated`. `supported` and `partial` require evidence.
`partial` also requires explicit limitations. Missing or unevaluated support MUST
NOT be inferred as compatibility.

Claims are self-declared compatibility statements. They are not NexFlow
certification, permission grants, approvals, or proof of runtime safety.

Conformance claims are compatibility claims. A change can affect one conformance
level without affecting another. For example, an optional schema field may
preserve `NF-SCHEMA`, while a change to approval gate meaning may affect
`NF-RUNTIME`.

## Non-Conforming Behavior

The following behavior is non-conforming:

- treating capability declarations as permissions
- granting access through an extension by presence alone
- ignoring approval gates for high-risk actions
- ignoring a valid human override or resuming automatically after one
- using undeclared context sources
- writing memory outside declared scopes
- treating provider preferences or provider availability as permission to call a provider
- emitting audit events that omit required envelope metadata while claiming complete runtime audit conformance
- executing workflows while claiming validation-only behavior
- a reference CLI calling providers, executing commands, writing memory, or mutating remote systems while claiming validation-only `NF-CLI` behavior
- silently accepting unsupported spec versions

## Current Repository Status

This repository currently provides:

- `NF-MANIFEST` draft documentation
- `NF-SCHEMA` draft schemas
- reference examples
- full schema validation for maintained examples
- standalone machine-readable and human-readable conformance claim templates
- limited semantic reference smoke checks that do not establish complete `NF-SEMANTIC` conformance
- validation guidance

It does not currently provide:

- semantic validation tooling
- reference CLI
- runtime enforcement
- provider integrations
