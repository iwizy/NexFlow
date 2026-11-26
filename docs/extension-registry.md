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
- [Unsupported Extension Compatibility](0.7/extension-compatibility.md)

The machine-readable draft accepts `0.1-draft` and `0.2-draft` in
[`extensions/registry.schema.json`](../extensions/registry.schema.json). The
[fictional `0.2-draft` example](../extensions/registry.example.yaml) shows a
revoked profile beside its separately pinned successor. The
[legacy example](../fixtures/extension-registry/legacy.yaml) remains valid.

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
- whether the registry record is a draft, published, deprecated, withdrawn, or revoked

A registry record is metadata. It is not proof that an extension is safe,
installed, supported by a runtime, compatible with a project, or authorized to
perform an action.

## Non-Goals

This draft does not:

- create a central NexFlow extension registry
- require public registration for private or `local.*` namespaces
- operate a DNS, repository, organization, or individual verification service
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

Each snapshot is immutable, identified by registry source repository and exact
revision. A publisher issues a new revision for any changed snapshot. Readers
compare successive pinned snapshots of the same registry and scope. An old
snapshot cannot establish that a current claim is clear or a revocation has
been lifted.

## Entry Identity

In `0.2-draft`, identify a record by `(namespace, profile.version)`. Entries
MUST be unique by that pair and sorted by namespace, then version, in ASCII
order. This ordering conveys no version preference. Use lowercase reverse-DNS
identifiers with at least two dot-separated labels and internal hyphens or
underscores. `local.*` belongs in private snapshots only. `io.nexflow` and its
descendants require project governance evidence. Record position and owner
display name carry no identity.

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
| `disputed` | Competing or insufficient ownership evidence requires a recorded decision. Hold selection for the namespace and retain the dispute reference. |

Verification is registry-scoped evidence, not universal authority. It does not
prove code safety, namespace support, artifact integrity, or permission to act.
Consumers must display the verification state and must not collapse
`self_asserted` into `registry_verified`.

Reserved namespace ownership remains governed by the NexFlow project process.
A third-party registry cannot make an `io.nexflow.*` namespace official merely
by marking it verified.

An applicant may cite a domain, repository or public delegation scoped to the
requested namespace. The publisher reviews the incumbent claim and competing
evidence, records the method and a safe evidence reference, and publishes a new
snapshot. During a dispute, keep one recorded identity with status `disputed`
across all nonterminal versions and pause their selection. Order of arrival,
owner display name, namespace spelling and a second registry's assertion
cannot settle the dispute. Use the configured trust policy when registries
disagree. If it cannot resolve the disagreement, keep the namespace unavailable
in that consumer. A transfer or reaffirmation needs a distinct resolution
record after the dispute, plus local review before any reliance. Keep previous
records and avoid putting private claim details in public evidence.

New records begin as drafts and require a verified owner to advance to
`published`. An already published record can show `disputed` during review.
That status suspends selection while the metadata stays visible.
A newly discovered withdrawn or revoked pin can enter as a terminal record
so its unavailability is recorded without offering it for selection.

## Profile And Source Pinning

The `profile` block describes one exact policy profile:

- `version` is the extension profile version
- `status` is the registry's assessment of the pinned profile, with values
  `draft`, `stable`, `deprecated`, and `removed`
- `specification` is the human-readable profile document
- `source.repository`, `source.revision`, and `source.path` identify the exact
  reviewed source
- `source.sha256` identifies the bytes of the machine-readable profile asset

The source revision is an exact 40-character Git commit and the digest is a
lowercase SHA-256 value. Mutable branches, tags without a resolved commit,
`latest`, ambient package names, and filesystem search results are not valid
activation identities.

Bind the exact version to the source repository, commit, path and digest for
the life of the registry record, including after retirement. Reuse of a version
with different bytes, a different pin, compatibility entries or requirements
is an error. Changes to those inputs need a new version and explicit review.
Review a profile's schema from its pinned revision, with its own exact path and
expected bytes. Registry lifecycle metadata can evolve in a new snapshot while
the profile bytes and old snapshots remain retrievable.

This source block still does not identify executable implementation code. A
future runtime support record and deployment-controlled implementation lock
remain separate artifacts under the Extension Loading Boundary.

## Compatibility Description

The `compatibility` block records the entry author's declared surface:

- supported manifest `specVersions`
- the exact profile version represented by the entry, repeated as the sole
  `profileVersions` member in `0.2-draft`
- attachment areas from `ExtensionSet.appliesTo`
- optional conformance levels that the publisher claims to discuss

These values are inputs to compatibility review. They are not evaluated
conformance claims. A real support claim must use the versioned conformance
claim format, identify a subject and evidence, and state limitations.

Match the requested namespace, exact profile version, source pin, exact
manifest `specVersion` and attachment area. Runtime/API versions and artifact
identity belong to separate deployment records. Version labels are exact and
carry no implicit range or forward compatibility. Unknown or unsupported pairs
remain inert. A compatible registry claim still requires independent support,
installation and operation decisions.

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
| `deprecated` | Registry retains the record and points to the reason, migration, effective date and support window. |
| `withdrawn` | Stop selection under this registry policy. Keep the exact prior pin and a dated reason and evidence reference. |
| `revoked` | Security or trust decision supersedes reliance on the exact pin. Keep a dated reason and evidence reference. A newer snapshot cannot silently re-enable that version. |

An extension may be `experimental` inside a published registry record. Record
publication means the metadata was published, not that the extension became
stable.

Publication advances from `draft` to `published` to `deprecated`. Any of those
states may move directly to `withdrawn` or `revoked`. `withdrawn` may move to
`revoked`. Retain terminal entries so that older or competing records cannot
fill their place silently. Within a trusted consumer's policy, stop further
use of a known revoked pin, including rollback to it. Handling in-flight
operations belongs to the runtime. Unavailable fresh evidence cannot clear
a known dispute or revocation.

The extension lifecycle advances `experimental` → `stable` → `deprecated` →
`removed`, with direct experimental deprecation allowed. Align the assessed
profile status `draft` to `experimental` and remaining statuses by name.
For deprecation, `supportEndsAt: null` means a cutoff has yet to be committed.
It can be filled once in a later snapshot without changing the other notice
fields. Preserve the first announced cutoff after it is set.
Ordinary removal requires a documented elapsed cutoff and a withdrawal record.
An emergency revocation can precede ordinary deprecation or sunset. A suggested
`deprecation.replacement` identifies an exact namespace and version for review.
A consumer must separately select, verify and approve any replacement.

## Consumer Rules

A registry consumer MUST:

1. validate the snapshot before interpreting it
2. enforce unique, ordered identities for its format and check known history
3. preserve the exact registry and profile version domains
4. display ownership verification and lifecycle without upgrading either
5. treat URLs as references, not automatic fetch or install instructions
6. keep unknown, disputed, withdrawn and revoked entries inert
7. fail closed when a required profile, version or trust decision is unavailable
8. avoid turning registry metadata into capabilities, permissions, approvals,
   credentials, network access, or runtime support

A consumer MAY operate entirely offline against a pinned snapshot, with local
policy defining required freshness and the treatment of unknown facts. Network
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

## Migration From `0.1-draft`

Continue reading existing snapshots with their one-row-per-namespace shape.
Treat their legacy ownership and compatibility fields as discovery metadata.
To migrate, create a new snapshot with one row per exact profile version. Pin
each row to verified source bytes, use the exact version in compatibility,
move a legacy `replacedBy` reference to a reviewed `deprecation.replacement`
when a concrete replacement is known, and fill the preservation notices for
deprecated, withdrawn or revoked records. Resolve conflicting claims before
relying on an entry. Preserve the original snapshot as a historical record.
Never infer a version, rewrite a previous snapshot or fall back to `0.1-draft`
after recording a newer snapshot. `ExtensionSet`, manifest `specVersion: "0.1"`,
profile bytes and loader behavior require no migration for this registry change.

`npm run extension-registry-smoke` exercises both formats, known snapshot history
and the [offline consistency checks](../extensions/registry-policy.mjs).
Ownership verification, live lookups and selection belong to separate scopes.

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
- maintained GitHub, MCP, and A2A policy profiles that are not registry entries

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
