# Extension Registry Model

Status: draft data model; no public registry, lookup service, or installation
workflow is implemented.

This document defines a portable metadata model for describing extension
namespaces. It gives public and private catalogs a common shape without making
any catalog authoritative for execution, ownership, installation, or access.

Related documents:

- [Extension Model](extensions.md)
- [Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md)
- [Extension Loading Boundary](extension-loading-boundary.md)
- [Conformance](conformance.md)
- [Compatibility Matrix](compatibility-matrix.md)

The machine-readable draft is
[`extensions/registry.schema.json`](../extensions/registry.schema.json). A
fictional, non-published example is provided in
[`extensions/registry.example.yaml`](../extensions/registry.example.yaml).

## Purpose

An extension registry can help authors and tools answer bounded discovery
questions:

- which namespace is being described
- who claims responsibility for its documentation
- which profile version and source revision the entry describes
- which NexFlow specification versions and attachment areas it targets
- which capabilities, network access, credentials, or executable behavior it
  may require
- where compatibility and security information can be reviewed
- whether the registry record is a draft, published, deprecated, or withdrawn

A registry record is metadata. It is not proof that an extension is safe,
installed, supported by a runtime, compatible with a project, or authorized to
perform an action.

## Non-Goals

This draft does not:

- create a central NexFlow extension registry
- require public registration for private or `local.*` namespaces
- verify DNS, repository, organization, or individual ownership
- define a package format, package manager, download URL, or install command
- discover, load, initialize, or execute extension code
- provide credentials, network access, context, memory, permissions, or
  approvals
- replace runtime support records or deployment lock data
- certify an extension or establish `NF-EXTENSION` conformance
- make registry availability a prerequisite for parsing a project

Private catalogs may use the same model offline. A project remains valid when a
registry is unavailable unless an external deployment policy explicitly
requires registry evidence.

## Registry Document

A registry snapshot has four top-level fields:

| Field | Meaning |
| --- | --- |
| `registryFormatVersion` | Version of this standalone registry format. It is independent of manifest `specVersion`. |
| `kind` | Fixed value `NexFlowExtensionRegistry`. |
| `metadata` | Registry identity, scope, generation time, and exact source revision. |
| `entries` | Deterministically ordered extension metadata records. |

The initial draft models an immutable snapshot. Mutable services may publish
new snapshots, but must not silently alter an already identified snapshot.

## Entry Identity

Each entry is identified by one extension `namespace`. Within a snapshot:

- namespaces MUST be unique
- entries MUST be sorted lexically by namespace
- the namespace MUST use the grammar defined by RFC-0006
- `io.nexflow.*` entries require NexFlow project governance; the schema cannot
  prove that governance decision
- registry-local numeric IDs or array positions MUST NOT be used as extension
  identity

The project-local `ExtensionSet.extensions[].id` remains separate. A registry
entry describes a namespace shared across projects; it does not allocate local
manifest IDs.

## Ownership And Verification

The `owner` block records a claim and its verification state:

| Status | Meaning |
| --- | --- |
| `unverified` | The registry has not validated the identity claim. |
| `self_asserted` | The named owner supplied or maintains the record, without independent registry verification. |
| `registry_verified` | The registry records a method and public evidence for its own verification decision. |

Verification is registry-scoped evidence, not universal authority. It does not
prove code safety, namespace support, artifact integrity, or permission to act.
Consumers must display the verification state and must not collapse
`self_asserted` into `registry_verified`.

Reserved namespace ownership remains governed by the NexFlow project process.
A third-party registry cannot make an `io.nexflow.*` namespace official merely
by marking it verified.

## Profile And Source Pinning

The `profile` block describes one exact policy profile:

- `version` is the extension profile version
- `status` is `draft`, `stable`, `deprecated`, or `removed`
- `specification` is the human-readable profile document
- `source.repository`, `source.revision`, and `source.path` identify the exact
  reviewed source
- `source.sha256` identifies the bytes of the machine-readable profile asset

The source revision is an exact 40-character Git commit and the digest is a
lowercase SHA-256 value. Mutable branches, tags without a resolved commit,
`latest`, ambient package names, and filesystem search results are not valid
activation identities.

This source block still does not identify executable implementation code. A
future runtime support record and deployment-controlled implementation lock
remain separate artifacts under the Extension Loading Boundary.

## Compatibility Description

The `compatibility` block records the entry author's declared surface:

- supported manifest `specVersions`
- profile versions represented by the entry
- attachment areas from `ExtensionSet.appliesTo`
- optional conformance levels that the publisher claims to discuss

These values are inputs to compatibility review. They are not evaluated
conformance claims. A real support claim must use the versioned conformance
claim format, identify a subject and evidence, and state limitations.

Unknown or unsupported versions remain inert. Consumers must not select a
nearby version or infer compatibility from namespace equality alone.

## Requirements And Risk Signals

The `requirements` block exposes review signals:

- action capabilities named by the profile
- whether network access is `none`, `optional`, or `required`
- whether credential mediation is `none`, `optional`, or `required`
- whether an implementation may contain executable code

These are requirements, not grants. For every operation, a future runtime must
still independently evaluate capabilities, permissions, approval gates,
network policy, credential policy, context and memory access, autonomy, and
human override.

An entry with `executableCode: false` is not automatically safe. Declarative
profiles can still expose sensitive context, request network access, or affect
policy interpretation. Conversely, `executableCode: true` does not authorize
download, installation, loading, or execution.

## Documentation And Security

Every entry requires HTTPS links for:

- the extension specification
- the security policy or reporting route

A homepage is optional. Registry documents MUST NOT contain credentials,
tokens, private keys, private vulnerability details, raw personal data, or
machine-local paths. A security URL is a routing reference, not permission to
publish sensitive reports.

## Publication Lifecycle

Registry record status is independent of extension lifecycle:

| Record status | Meaning |
| --- | --- |
| `draft` | Entry is reviewable but not published as registry metadata. |
| `published` | Entry belongs to an identified registry snapshot and includes `publishedAt`. |
| `deprecated` | Registry still serves the record but recommends a documented successor or migration. |
| `withdrawn` | Registry no longer endorses the record; historical snapshots may retain it. |

An extension may be `experimental` inside a published registry record. Record
publication means the metadata was published, not that the extension became
stable.

## Consumer Rules

A registry consumer MUST:

1. validate the snapshot before interpreting it
2. enforce unique, lexically ordered namespaces
3. preserve the exact registry and profile version domains
4. display ownership verification and lifecycle without upgrading either
5. treat URLs as references, not automatic fetch or install instructions
6. keep unknown entries inert
7. fail closed when a required profile or version is unsupported
8. avoid turning registry metadata into capabilities, permissions, approvals,
   credentials, network access, or runtime support

A consumer MAY operate entirely offline against a pinned snapshot. Network
retrieval, caching, mirrors, signatures, transparency logs, and revocation
distribution require separate contracts before they can become supported
behavior.

## Publisher Rules

A registry publisher SHOULD:

- publish immutable snapshots with an exact source revision
- review namespace ownership claims and preserve verification evidence
- require profile source and digest pinning
- keep entries sorted and reject duplicates
- retain historical lifecycle and replacement information
- document correction and withdrawal procedures
- separate registry metadata signing from implementation artifact signing
- provide a security reporting route

Before a real public registry exists, the project must define artifact
identity, snapshot digests, signing and provenance, mirror behavior,
revocation, correction ownership, privacy review, availability expectations,
and an explicit governance decision.

## Relationship To Other Artifacts

| Artifact | Relationship to registry metadata |
| --- | --- |
| `ExtensionSet` | Project request for a namespace; it does not embed or trust a registry entry. |
| Maintained extension profile | Versioned policy mapping described by an entry. |
| Conformance claim | Separate evidence-bearing support statement. |
| Runtime support record | Deployment-owned statement that one implementation is supported. |
| Implementation lock | Exact executable artifact selection and integrity record. |
| Registry snapshot | Discovery metadata only; no execution authority. |

No artifact in this table substitutes for another.

## Current Repository Evidence

The repository currently provides:

- the draft registry schema
- one fictional example snapshot
- focused structural and ordering checks through
  `npm run extension-registry-smoke`
- maintained MCP and A2A policy profiles that are not registry entries

The repository does not provide a registry service, a published registry
snapshot, namespace ownership verification, signed metadata, remote lookup,
installation, loading, or extension execution.

## Open Questions

- Should public snapshots require signatures or transparency-log inclusion?
- Which governance body may publish `io.nexflow.*` entries?
- How should ownership transfer and disputed namespaces be represented?
- Should revocation use a separate signed feed or replacement snapshots?
- Which metadata, if any, belongs in `ExtensionSet` rather than a registry?
- How should private registry snapshots avoid leaking internal namespaces and
  security contacts?
- When is the model mature enough for an independent artifact version rather
  than `0.1-draft`?
