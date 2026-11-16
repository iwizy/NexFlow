# RFC-0006: Extension Namespaces

## Status

Draft

## Summary

This RFC proposes the initial NexFlow extension namespace model.

The model defines:

- namespace ownership expectations
- reserved namespace families
- custom and private namespace guidance
- extension lifecycle rules
- future registry expectations
- compatibility and safety boundaries for extension behavior

The goal is to let NexFlow grow through integrations and private extensions without letting extensions silently redefine core semantics, grant access, or create ambiguous compatibility claims.

## Motivation

NexFlow is provider-neutral and runtime-neutral. It cannot put every integration, provider, tool, event sink, task system, context source, or organization-specific policy into the core specification.

Extensions give the ecosystem room to grow, but they introduce risks:

- two extensions may use the same namespace for different behavior
- a runtime may treat an unknown extension as permission to perform actions
- extension lifecycle may be unclear
- provider-specific or integration-specific behavior may leak into core semantics
- private organizations may need local extensions without publishing internal details
- future tools may claim extension support without saying which namespaces or versions they support

The extension namespace model should make extension ownership, lifecycle, and safety implications explicit before a runtime or registry exists.

The runtime-neutral
[Extension Loading Boundary](../docs/extension-loading-boundary.md) builds on
this RFC by separating declaration discovery from implementation discovery,
verification, enablement, isolation, activation, and per-operation
authorization. It does not implement a loader or change this RFC's Draft state.

## Proposal

NexFlow should treat extension namespaces as stable identifiers for non-core behavior.

An extension namespace identifies the semantic owner of extension behavior. It is not the same as a project-local extension `id`.

Example:

```yaml
specVersion: "0.1"
kind: ExtensionSet
metadata:
  project: example-project
extensions:
  - id: github_basic
    namespace: io.nexflow.github
    displayName: GitHub Basic
    description: Source control and pull request integration.
    lifecycle: experimental
    appliesTo:
      - context
      - workflow
      - events
    requiredCapabilities:
      - read_repository
      - create_pull_request
    documentation: docs/integrations/github.md
```

The `id` is local to the manifest set. The `namespace` is the extension identity that future tools, validators, runtimes, registries, and documentation may use for compatibility claims.

## Namespace Format

Extension namespaces SHOULD use reverse-DNS style names.

Examples:

- `io.nexflow.github`
- `io.nexflow.mcp`
- `io.nexflow.a2a`
- `com.example.platform`
- `org.example.research_lab`

Namespaces SHOULD:

- be stable over time
- identify an owner or governing community
- use lowercase ASCII letters, numbers, dots, hyphens, or underscores
- avoid embedding secrets, account IDs, tenant IDs, private URLs, or credentials
- avoid names that imply official NexFlow ownership when none exists

Namespaces SHOULD NOT be renamed casually. Renaming a namespace can break extension compatibility even when schemas still validate.

## Reserved Namespace Families

NexFlow should reserve namespace families for different ownership models.

| Namespace family | Owner expectation | Use |
| --- | --- | --- |
| `io.nexflow.*` | NexFlow maintainers or accepted ecosystem governance | Shared extension drafts and future public extension specifications. |
| `com.*`, `org.*`, `dev.*`, `net.*` | Domain or organization owner | Public, company, community, or research extensions. |
| `local.*` | Repository or local project owner | Local-only experiments that should not claim ecosystem compatibility. |

A reverse-DNS name is a naming convention. External ownership is a scoped
claim that a registry publisher or private deployment operator reviews against
an identified namespace. The reserved `io.nexflow` family requires NexFlow
governance evidence, and `local.*` stays private. A transfer or competing claim
requires a recorded decision. While unresolved, keep the disputed namespace
inert under the relying trust policy. See the [registry ownership model](../docs/extension-registry.md#ownership-and-verification).

## Namespace Ownership

The owner of a namespace is responsible for documenting:

- semantic meaning
- supported lifecycle state
- supported `specVersion` values
- required capabilities
- permission implications
- context sources exposed
- event types emitted
- credential and network behavior
- compatibility promises
- security contact or reporting path when appropriate

Ownership does not grant authority to redefine core NexFlow concepts.

For example, an extension may define GitHub-specific pull request metadata, but it must not redefine what `approval_required`, `read_repository`, `task.completed`, or `restricted` means in core NexFlow.

## Lifecycle

Extension lifecycle states remain:

| Lifecycle | Meaning |
| --- | --- |
| `experimental` | Design may change and compatibility is not guaranteed. |
| `stable` | Intended for broad use with documented compatibility expectations. |
| `deprecated` | Still recognized for compatibility, but not recommended for new manifests. |
| `removed` | No longer supported by the target spec version or tool. |

An extension normally advances from experimental to stable, deprecated and then
removed. Experimental profiles may go directly to deprecated. Stable support
requires published compatibility limits, policy and security expectations,
and reviewed evidence. Deprecation records a reason, migration route and
support cutoff, with an explicit unknown cutoff until one is committed.
Removal after that cutoff retains history and reports the profile as
unsupported. Emergency security revocation can block the exact pin immediately
without waiting for the ordinary sunset. Rollback must respect the same block.
Registry record publication and runtime deployment state have separate
transitions. See the [registry publication lifecycle](../docs/extension-registry.md#publication-lifecycle).

## Future Registry Expectations

This RFC does not create a central extension registry.

The repository now includes a draft
[Extension Registry Model](../docs/extension-registry.md) with a standalone
schema, fictional example, and focused validation evidence. The model refines
the metadata shape proposed here; it still does not create a registry service,
perform ownership verification, authorize installation, or imply runtime
support.

The repository now carries maintained experimental `io.nexflow.github`,
`io.nexflow.mcp`, and `io.nexflow.a2a` profiles under
[RFC-0020](RFC-0020-github-extension-profile.md),
[RFC-0018](RFC-0018-mcp-extension-profile.md) and
[RFC-0019](RFC-0019-mcp-a2a-boundaries.md). These profiles are evidence that
the namespace model can express policy mappings; they do not create a general
registry or imply runtime integration support.

A future registry may be useful after extension usage grows. It should be optional at first and should not block private extensions.

The `0.2-draft` registry format records one entry per exact namespace and
profile version, inclusive of retired and revoked pins. Each record binds
profile version, source repository, exact commit, path and SHA-256. The same
version cannot be reassigned to different bytes, changed compatibility or
requirements. A replacement is a new version with its own review, pin and
lifecycle. Older snapshots retain their original meaning.

Authored metadata expresses a project's requested namespace and behavior.
Registry assertions describe publisher-reviewed discovery evidence. Installed
implementation identity and support are deployment-owned and apply to exact
artifacts. Execution authority is host-owned and evaluated for each operation
under the project's policy. Ownership, publication, an installed artifact and
compatibility each carry zero authority to access credentials, use the
network or satisfy approval requirements.

## Extension Compatibility

A consumer checks the exact profile version and pin, manifest `specVersion`
and attachment area. Compatibility needs a separate implemented support
record. Do not infer compatibility from a shared namespace, approximate
version, newer manifest dialect or replacement recommendation.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add an unused experimental extension | Usually additive. |
| Add documentation for an existing extension | Usually compatible. |
| Change an extension display name | Usually compatible. |
| Rename a namespace | Breaking for `NF-EXTENSION` consumers. |
| Add required capabilities | May be safety or runtime breaking. |
| Broaden context exposed by an extension | Privacy or safety breaking. |
| Add event payload fields | Usually additive if consumers tolerate unknown fields. |
| Change event payload meaning | Runtime or audit breaking. |
| Change lifecycle from stable to deprecated | Compatible but should warn. |
| Change lifecycle from deprecated to removed | Breaking unless consumers no longer reference it. |

Compatibility notes should identify affected manifests, conformance levels, validators, runtimes, examples, and migration paths when known.

## Safety Boundaries

Extensions must preserve human authority and least privilege.

An extension MUST NOT:

- grant permissions by presence alone
- treat required capabilities as approved capabilities
- bypass approval gates
- read credentials implicitly
- execute commands implicitly
- call providers implicitly
- access undeclared context sources
- write memory outside declared scopes
- redefine core event types incompatibly
- weaken core classification, autonomy, permission, or approval semantics

An extension SHOULD:

- document required capabilities
- document permission implications
- document context and memory implications
- document credential and network expectations
- emit or require audit events for sensitive operations
- fail closed when a runtime does not support the namespace

Unknown extensions should be preserved by tools when possible, but unsupported extension behavior must not be executed or treated as authorized.

## Extension-Scoped Metadata

Extension-specific metadata should stay clearly scoped.

Future manifest shapes may define a convention for extension-owned metadata blocks. Until then, tools should treat unknown extension-specific fields as metadata only.

Unknown fields MUST NOT grant access, satisfy approvals, override denials, or change core behavior unless a supporting tool explicitly documents that namespace and behavior.

## Validation Expectations

Future semantic validators should check:

- namespace syntax
- duplicate namespace declarations
- lifecycle values
- required capabilities exist
- extension `appliesTo` values are compatible with referenced manifests
- deprecated or removed extension usage is reported
- permission implications are documented for high-risk capabilities
- extension namespaces do not conflict with reserved families

Validation should distinguish:

- unsupported extension namespace
- supported namespace with unsupported lifecycle
- supported namespace with unsupported version or behavior
- extension metadata preserved but not interpreted

## Relationship To Conformance

This RFC refines the `NF-EXTENSION` conformance level proposed in [RFC-0003](RFC-0003-conformance-levels.md).

An extension conformance claim should include:

- supported namespaces
- supported lifecycle states
- supported `specVersion` values
- supported manifest kinds
- supported validation checks
- enforcement limitations
- unsupported behavior

A tool should not claim broad "NexFlow extension support" without listing namespaces and limits.

## Compatibility Impact

Manifest `specVersion: "0.1"`, the `ExtensionSet` schema and existing profile
assets are preserved. The standalone `0.2-draft` registry adds exact version
records, disputes, deprecation and revocation metadata. Existing `0.1-draft`
snapshots remain readable as discovery data. The
[migration instructions](../docs/extension-registry.md#migration-from-01-draft)
preserve historical records while reviewing fresh pins and notices.

## Security and Safety Impact

This RFC improves safety by making extension ownership and boundaries explicit.

It reduces the risk that:

- unsupported extensions are executed accidentally
- integrations silently grant permissions
- extension fields override core safety semantics
- private extensions leak sensitive operational details into public manifests
- future runtimes blur context, tool, credential, memory, and approval boundaries

The RFC does not implement extension loading, registry lookup, credential handling, provider calls, or runtime behavior.

## Alternatives Considered

### No Namespace Rules

NexFlow could allow any extension namespace without guidance.

This is flexible, but it makes collisions and compatibility claims harder to review.

### Mandatory Central Registry

NexFlow could require every extension namespace to be registered before use.

This would be too heavy for private projects and early draft experimentation.

### Fixed Built-In Extension List

NexFlow could define only official extensions for known tools.

This would limit ecosystem growth and push private behavior into undocumented fields.

### Provider-Specific Extension Model

NexFlow could organize extensions around model or API providers.

This would violate provider neutrality and would not cover task systems, design tools, documentation systems, event sinks, approval surfaces, or custom organizational policy.

## Open Questions

- Should NexFlow define a stricter namespace grammar before `1.0`?
- Should extension manifests include optional `owner`, `version`, `securityContact`, or `registry` fields in `0.1`?
- Should extension-specific event types use a namespace prefix?
- Should a future registry support signed extension metadata?
- Should `local.*` namespaces be valid in shared examples, or only in private projects?
- How should runtimes report unsupported but preserved extension metadata?
