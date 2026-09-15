# Schema Bundle Publication

Status: publication contract specified; no schema bundle is currently
published.

This document defines how NexFlow may publish a portable, immutable snapshot of
its core JSON Schemas. The goal is to let validators and other tools consume an
exact schema set without cloning the repository, guessing file revisions, or
fetching dependencies at validation time.

A schema bundle contains schemas. It is not a NexFlow `ManifestBundle`, project
archive, template package, runtime package, extension package, or conformance
certificate. Manifest bundling remains a separate proposal in
[RFC-0012](../rfcs/RFC-0012-manifest-bundling.md).

## Current Status

The repository currently publishes schema source files under [`schemas/`](../schemas/)
and identifies reproducible snapshots by repository tag or commit. It does not
currently provide:

- a downloadable schema archive
- a schema bundle index
- an independent schema artifact version
- a stable hosted retrieval endpoint
- bundle checksums, signatures, or provenance
- a package-manager distribution
- a schema bundle compatibility or conformance claim

Documentation of this contract does not make any of those artifacts available.
Until a bundle is actually published and verified, consumers should pin the
repository release, tag, or commit from which they load schemas.

## Goals

A published bundle should be:

- **language-neutral**: ordinary JSON Schema files plus JSON metadata
- **runtime-neutral**: no executable installer, hooks, or generated code
- **offline-capable**: core `$ref` resolution stays inside the verified bundle
- **immutable**: one artifact version identifies one byte-for-byte snapshot
- **auditable**: source revision, inventory, digests, and build evidence are
  explicit
- **safe to unpack**: no links, duplicate paths, parent traversal, or special
  files
- **honest about scope**: structural schemas do not imply semantic validation,
  runtime enforcement, or certification

## Non-Goals

The initial publication contract does not:

- define a manifest transport or archive format
- bundle examples, fixtures, project profiles, or documentation as schemas
- include conformance, release-record, extension-profile, or CLI-output schemas
- choose npm, PyPI, crates.io, Go modules, OCI, or another language or package
  registry
- rewrite schema `$id` values for a package manager
- publish generated language bindings or validator code
- make `latest` a reproducible compatibility target
- implement semantic validation or runtime preflight
- grant an `NF-SCHEMA`, `NF-SEMANTIC`, `NF-CLI`, or `NF-RUNTIME` claim

Language-specific wrappers may be proposed later, but they must embed or depend
on the same immutable bundle and must not become the canonical schema source.

## Initial Bundle Scope

The initial bundle should contain exactly one supported manifest
`specVersion` and the core files from the repository's `schemas/` directory:

- one shared definitions schema
- one schema for every manifest kind supported by that snapshot
- one machine-readable bundle index
- the repository license
- a short bundle README containing verification and scope warnings

The current source set is 18 schema files: 17 manifest-kind schemas and
`common.schema.json`. Publication must derive the actual inventory from the
selected source revision rather than hard-coding this count into build logic.

The following are separate compatibility surfaces and are excluded from the
core bundle:

| Source area | Reason for exclusion |
| --- | --- |
| `profiles/` | Profiles have independent definitions and lifecycle. |
| `extensions/` | Extension namespaces and profile versions evolve independently. |
| `conformance/` | Claim records use `claimVersion`, not manifest `specVersion`. |
| `release/` | Release evidence uses `recordVersion` and is repository process data. |
| `scripts/contracts/` | Prototype output schemas are implementation evidence, not core manifests. |
| `examples/` and `fixtures/` | Validation evidence and learning material are not schema definitions. |

Future artifacts may publish those surfaces under distinct bundle identities
and version policies. They must not be inserted silently into a core bundle.

## Artifact Set

For an artifact version `<artifact-version>`, a publication should provide:

```text
nexflow-schemas-<artifact-version>.tar.gz
nexflow-schemas-<artifact-version>.zip
nexflow-schemas-<artifact-version>.index.json
SHA256SUMS
```

Both archives must expand to the same logical files and byte content. A
publisher may initially provide only one archive format if the supported
platform statement says so explicitly; the index and checksum file remain
required.

The archive root should be:

```text
nexflow-schemas-<artifact-version>/
  schema-bundle.json
  README.md
  LICENSE
  schemas/
    <spec-version>/
      common.schema.json
      project.schema.json
      ...
```

Versioning the schema directory keeps relative references such as
`common.schema.json#/$defs/id` local to one snapshot. The initial artifact must
contain one `specVersion` only because the current schema `$id` values are not
version-qualified. Combining multiple revisions with identical `$id` values in
one resolver would be ambiguous.

## Bundle Index

`schema-bundle.json` inside the archive and the detached
`nexflow-schemas-<artifact-version>.index.json` must contain identical bytes.
The proposed initial index shape is:

```json
{
  "bundleFormatVersion": "0.1",
  "kind": "NexFlowSchemaBundle",
  "artifactVersion": "<artifact-version>",
  "specVersion": "0.1",
  "jsonSchemaDialect": "https://json-schema.org/draft/2020-12/schema",
  "source": {
    "repository": "https://github.com/iwizy/NexFlow",
    "revision": "<exact-40-character-commit>"
  },
  "schemas": [
    {
      "path": "schemas/0.1/common.schema.json",
      "id": "https://nexflow.dev/schemas/common.schema.json",
      "role": "definitions",
      "sha256": "<64-lowercase-hex-characters>"
    },
    {
      "path": "schemas/0.1/project.schema.json",
      "id": "https://nexflow.dev/schemas/project.schema.json",
      "role": "manifest",
      "manifestKind": "Project",
      "sha256": "<64-lowercase-hex-characters>"
    }
  ]
}
```

This example defines the publication contract; no index schema or generated
index is implemented yet. Before the first bundle is released, the index shape
must receive its own JSON Schema and fixture coverage.

### Required Index Rules

- `bundleFormatVersion` versions the index contract independently.
- `artifactVersion` identifies the immutable distributed schema snapshot.
- `specVersion` identifies the manifest language accepted by the included
  schemas.
- `source.revision` pins the exact full commit used to build the artifact.
- `schemas` lists every bundled JSON Schema exactly once in lexical path order.
- `path` is a normalized relative POSIX path contained by the archive root.
- `id` exactly matches the schema's top-level `$id`.
- `role` is `definitions` or `manifest` for the initial core bundle.
- `manifestKind` is required only for `manifest` entries and matches the
  schema's top-level `properties.kind.const`.
- `sha256` covers the exact bytes stored in both archive representations.
- schema IDs, paths, manifest kinds, and digests are unique where applicable.

Unknown index fields must not be interpreted as authority, compatibility, or
execution instructions. The future index schema should be closed by default.

## Independent Version Domains

| Domain | Meaning | Change trigger |
| --- | --- | --- |
| Manifest `specVersion` | Version of authored NexFlow manifests | Manifest language compatibility decision |
| Schema artifact version | Version of the distributed core schema snapshot | Any published bundle content change |
| `bundleFormatVersion` | Version of the bundle index and layout contract | Incompatible metadata or layout change |
| Repository release/tag | Source and project release checkpoint | Repository release process |
| JSON Schema dialect | Meta-schema semantics used by schema processors | Explicit dialect migration |
| Validator version | Behavior of a consuming implementation | Validator's own release process |

No value is inferred from another. A patch to schema descriptions may require a
new artifact version without changing manifest `specVersion`; a new manifest
version may require a new artifact even when the index format remains `0.1`.

Before the first publication, maintainers must choose and document whether the
schema artifact version follows the repository release tag or has an
independent SemVer line. The mapping must be explicit and immutable once
published.

## Canonical IDs And Retrieval

Current schema `$id` values are stable logical identifiers. They are not a
promise that a validator can fetch those URLs today. Bundle consumers must
register the included schema bytes under their declared IDs and resolve local
references from the verified artifact without network access.

If hosted schema retrieval is added later:

- immutable versioned URLs must be the reproducible target
- mutable aliases such as `latest` may exist only as convenience pointers
- redirects must not change the selected schema snapshot silently
- hosted bytes, archive bytes, and index digests must match
- cache and integrity behavior must be documented
- availability of a URL must not replace signature or digest verification

Changing an existing `$id`, publishing different bytes under one immutable URL,
or reusing an artifact version for new content is a breaking publication error.

## Deterministic Assembly

A bundle builder must operate on a clean, exact source revision and:

1. Select one supported `specVersion` and enumerate core schema files from the
   repository source tree.
2. Parse every file as JSON and validate the declared JSON Schema dialect.
3. Require one unique `$id` per schema and one unique manifest kind per
   manifest schema.
4. Resolve every repository-local `$ref` inside the selected schema set without
   network access.
5. Run the complete repository schema, example, fixture, and focused boundary
   checks for that revision.
6. Copy exact schema bytes into the versioned archive path without rewriting
   IDs or references.
7. Generate a lexically sorted index and compute SHA-256 for every listed file.
8. Build archives with normalized paths, permissions, owners, and timestamps so
   repeated builds from the same revision produce identical bytes.
9. Reject symbolic links, hard links, devices, absolute paths, parent
   traversal, duplicate paths, unlisted schema files, and unexpected generated
   content.
10. Generate checksums for the detached index and every distributed archive.

Build tooling must fail closed. A partially assembled or non-reproducible
artifact must not be published under a release version.

## Consumer Verification

A consuming validator should:

1. Select an exact schema artifact version, never an unpinned moving alias.
2. Download the index, archive, and checksum record from the same publication.
3. Verify the detached index and archive digest before extraction.
4. Extract into a new bounded directory while rejecting links, duplicate paths,
   special files, absolute paths, parent traversal, and resource-limit excess.
5. Require the embedded and detached indexes to be byte-identical.
6. Reject unlisted files except the declared README and license.
7. Verify every schema digest, `$id`, role, manifest kind, dialect, and
   `specVersion` against the index.
8. Register schemas locally and resolve bundled references without remote
   access.
9. Report the artifact version and source revision in diagnostics and
   conformance evidence.

A valid digest proves byte identity with the published record. It does not
prove that the schemas are complete, semantically correct, safe for runtime
execution, or suitable for an unlisted manifest version.

## Publication Channels

The canonical contract is the artifact set, not a particular hosting provider.
A release may be distributed through a durable static HTTPS endpoint, release
attachment, artifact registry, or mirrored channels if every mirror preserves
the same bytes, filenames, index, and checksums.

Language-specific registries are optional secondary channels. Their package
metadata must point to the canonical artifact version and source revision, and
their installation process must not execute lifecycle scripts merely to expose
JSON files.

## Publication Workflow

1. Select the exact candidate commit and proposed artifact version.
2. Confirm the version mapping and supported `specVersion` in the release plan
   and compatibility matrix.
3. Run all required repository validation and security checks.
4. Build the artifact set twice in isolated environments and compare bytes.
5. Inspect the inventory, IDs, references, paths, kinds, and digests.
6. Record supported and unsupported surfaces, known limitations, and migration
   guidance.
7. Produce signatures or provenance attestations, or state explicitly that
   they are absent.
8. Review license inclusion and third-party notices.
9. Publish all artifacts atomically to the selected durable channel.
10. Download the published artifacts as a consumer and repeat integrity,
    extraction, registration, and schema-validation checks.
11. Link the immutable artifact and evidence from release notes and the
    compatibility matrix.

Failed or incomplete publication must not leave a mutable artifact version in
place. Corrected content receives a new artifact version and a documented
supersession notice.

## Publication Readiness

The first schema bundle remains blocked until:

- [ ] the artifact version relationship to repository releases is accepted
- [ ] the bundle index receives a versioned JSON Schema and fixtures
- [ ] deterministic assembly and archive safety checks are implemented
- [ ] local `$ref`, `$id`, kind, dialect, inventory, and digest checks pass
- [ ] reproducible archive output is demonstrated in CI
- [ ] at least one durable publication channel and owner are selected
- [ ] checksum, signing, provenance, retention, and supersession policies are
  recorded
- [ ] consumer verification is tested from downloaded artifacts
- [ ] compatibility, versioning, schema guide, release notes, and support status
  are synchronized to the exact candidate

Until every applicable item is complete, the supported distribution remains
the repository snapshot identified by a release, tag, or commit.

## Conformance Boundary

A bundle can be evidence for an `NF-SCHEMA` claim only when the claim names the
exact artifact version, manifest `specVersion`, schema inventory, validation
behavior, tests, and limitations. Bundle publication alone does not establish
`NF-SCHEMA`, and `NF-SCHEMA` does not imply `NF-SEMANTIC`, `NF-CLI`, or
`NF-RUNTIME` support.
