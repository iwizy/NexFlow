# RFC-0012: Manifest Bundling

## Status

Draft

## Summary

This RFC proposes a future optional manifest bundling model for NexFlow.

The proposal defines:

- why bundled manifests may be useful
- how bundles relate to the existing multi-file manifest set
- which bundle forms should be considered
- validation and expansion expectations
- compatibility rules for tools and future runtimes
- security rules for local files, remote references, secrets, and path handling
- non-goals that prevent bundling from becoming a package manager or runtime feature

The core position is that bundling should be a transport and authoring convenience. It must not change the meaning of NexFlow manifests.

## Motivation

NexFlow currently describes a project as a set of separate YAML manifests.

Separate manifests are useful because they make review, ownership, and focused validation easier. For example, a security reviewer can inspect permissions and approval gates without reading every task, while a documentation contributor can focus on context and workflow declarations.

However, some workflows may benefit from a bundled representation:

- sharing a minimal example as one file
- attaching a manifest set to an issue, RFC, or review
- importing or exporting manifests through a future CLI
- sending a complete team configuration between tools
- storing generated validation fixtures
- comparing complete manifest sets in tests
- distributing templates without requiring a directory layout

Bundling can improve portability, but it introduces risk if tools treat bundles as more authoritative than the manifests they contain.

This RFC proposes guardrails before any schema, CLI, or runtime behavior is added.

## Proposal

NexFlow should continue to treat the multi-file manifest set as the canonical authoring model for `0.1` draft.

A future version may define an optional `ManifestBundle` representation that packages a manifest set for transport, templates, test fixtures, import/export, or review.

A bundle should expand into the same logical manifest set that separate files would produce.

[RFC-0016](RFC-0016-core-profile-and-discovery.md) proposes the core profile, optional module, multiple workflow, and logical assembly rules that bundle expansion should preserve.

The bundle must not:

- override manifest semantics
- hide permissions
- grant capabilities
- create implicit context access
- change memory visibility
- change approval gate meaning
- execute workflows
- load external systems by default
- replace normal compatibility rules

## Design Principles

### Bundles Are Optional

Tools that support normal multi-file manifest sets should not be required to support bundles unless they claim a future bundle-specific conformance level.

Projects should be able to continue using:

```text
project.yaml
agents.yaml
workflow.yaml
tasks.yaml
handoffs.yaml
permissions.yaml
capabilities.yaml
context.yaml
memory.yaml
providers.yaml
events.yaml
extensions.yaml
```

without adopting a bundle format.

### Bundles Preserve Manifest Meaning

A bundled `agents.yaml` entry should mean the same thing as the same `agents.yaml` file outside a bundle.

Validation should conceptually work as:

1. Parse the bundle envelope.
2. Expand bundle entries into logical manifest files.
3. Parse each logical manifest.
4. Validate each manifest against its schema.
5. Validate cross-manifest references.
6. Report diagnostics using both bundle path and logical manifest path.

The bundle envelope should not change the meaning of the expanded manifests.

[RFC-0015](RFC-0015-typed-references.md) proposes that reference namespaces and symbol tables are built from the expanded logical manifest assembly, so bundle paths and entry order cannot change reference meaning.

### Bundles Must Be Inspectable

Humans and tools should be able to answer:

- which logical files are included
- which manifest kinds are included
- which `specVersion` each manifest uses
- whether entries are inline or referenced
- whether external references are present
- whether the bundle is complete or partial
- whether unsafe or unsupported features are present

Opaque archives are not sufficient as the only representation.

## Possible Bundle Forms

This RFC does not accept a final format. It identifies candidate forms for later schema work.

### Bundle Index

A bundle index references normal files.

Example:

```yaml
specVersion: "0.1"
kind: ManifestBundle
metadata:
  id: minimal-team-bundle
  name: Minimal Team Bundle
bundle:
  mode: referenced
  complete: true
manifests:
  - path: project.yaml
    kind: Project
    required: true
  - path: agents.yaml
    kind: AgentSet
    required: true
  - path: tasks.yaml
    kind: TaskSet
    required: false
```

This form is useful for inventory, validation planning, and deterministic discovery.

It is not a single-file transport format unless combined with an archive or export process.

### Embedded Bundle

An embedded bundle stores manifest content inside the bundle.

Example:

```yaml
specVersion: "0.1"
kind: ManifestBundle
metadata:
  id: minimal-team-bundle
bundle:
  mode: embedded
  complete: true
manifests:
  - path: project.yaml
    kind: Project
    content:
      specVersion: "0.1"
      kind: Project
      metadata:
        id: minimal-team
  - path: agents.yaml
    kind: AgentSet
    content:
      specVersion: "0.1"
      kind: AgentSet
      metadata:
        project: minimal-team
      agents: []
```

This form is useful for examples, fixtures, and import/export.

It can become hard to review if the embedded content grows too large.

### YAML Multi-Document Stream

A YAML multi-document stream stores multiple manifests in one file.

Example:

```yaml
---
specVersion: "0.1"
kind: Project
metadata:
  id: minimal-team
---
specVersion: "0.1"
kind: AgentSet
metadata:
  project: minimal-team
agents: []
```

This form is simple but lacks an explicit envelope unless a convention is defined.

It may be useful for small examples, but it is weaker for metadata, diagnostics, and completeness checks.

### Archive Bundle

An archive bundle stores a directory layout in a compressed file.

This RFC does not propose an archive format.

If archives are considered later, a future RFC should define:

- allowed archive formats
- path traversal protections
- maximum sizes
- duplicate path handling
- checksum expectations
- signature expectations, if any
- whether archives are allowed in public examples

Archives should not be required for the initial bundle model.

## Bundle Metadata

A future `ManifestBundle` should describe the bundle without changing manifest semantics.

Candidate fields:

| Field | Purpose |
| --- | --- |
| `specVersion` | NexFlow spec version for the bundle envelope. |
| `kind` | Expected to be `ManifestBundle` if accepted. |
| `metadata.id` | Stable bundle identifier. |
| `metadata.name` | Human-readable bundle name. |
| `metadata.description` | Short description of the bundle purpose. |
| `bundle.mode` | `referenced`, `embedded`, `multi_document`, or future values. |
| `bundle.complete` | Whether the bundle intends to include a complete manifest set. |
| `bundle.sourceRoot` | Optional logical root for referenced files. |
| `manifests[].path` | Logical manifest path used in diagnostics and references. |
| `manifests[].kind` | Expected manifest kind. |
| `manifests[].required` | Whether the entry is required for completeness. |
| `manifests[].content` | Embedded manifest object, when using embedded mode. |
| `manifests[].digest` | Optional digest for referenced or embedded content. |

The exact schema should be deferred until bundle behavior is accepted.

## Validation Expectations

Bundle-aware validators should separate bundle validation from manifest validation.

### Envelope Validation

Envelope validation checks the bundle shape.

Examples:

- supported bundle kind
- supported `specVersion`
- valid `bundle.mode`
- valid manifest entry list
- duplicate logical paths
- missing required metadata
- invalid path syntax
- unsupported external references

### Expansion Validation

Expansion validation turns the bundle into logical manifests.

Examples:

- each entry has exactly one source of content
- embedded content is an object
- referenced content resolves inside the allowed root
- logical paths are normalized
- no path escapes the project root
- no duplicate logical path wins silently

### Manifest Validation

After expansion, each manifest should be validated exactly like a normal manifest file.

Diagnostics should identify both the bundle and the logical manifest path.

Example diagnostic:

```json
{
  "severity": "error",
  "code": "NF-BUNDLE-DUPLICATE-PATH",
  "message": "Bundle declares the same logical manifest path more than once.",
  "file": "nexflow.bundle.yaml",
  "path": "manifests[2].path",
  "logicalPath": "agents.yaml"
}
```

## Compatibility Impact

This RFC is additive and planning-oriented.

It does not change current manifest requirements.

Existing multi-file manifest sets remain valid.

Compatibility rules:

- Adding optional bundle support is compatible.
- Requiring all projects to use bundles would be breaking.
- Changing normal manifest semantics inside bundles would be breaking.
- Changing bundle expansion rules after adoption may be breaking.
- Changing diagnostic path mapping may affect `NF-CLI` and editor integrations.
- Treating bundles as executable packages would require a separate RFC.
- Removing support for multi-file manifests would be breaking.

Bundle support should have its own compatibility claims or conformance vocabulary if accepted.

Possible future conformance label:

| Label | Meaning |
| --- | --- |
| `NF-BUNDLE` | Tool can parse, expand, validate, and inspect accepted manifest bundle formats without changing manifest semantics. |

## Security And Safety Impact

Bundling can concentrate sensitive material in one file.

Security requirements:

- Bundles must not require raw secrets.
- Bundles must not require raw private prompt text.
- Bundles must not fetch remote content by default.
- Referenced paths must not escape the allowed project root.
- Duplicate paths must be errors, not silent overrides.
- External references must be explicit and disabled by default.
- Tools should apply size limits before expanding bundles.
- Tools should avoid logging embedded sensitive content in diagnostics.
- Bundle metadata must not grant permissions or capabilities.
- Bundle expansion must not execute commands or templates.

The safest initial model is local, deterministic, read-only expansion.

## Relationship To Reference CLI

RFC-0011 leaves room for future manifest bundle discovery.

If this RFC advances, a reference CLI may eventually support:

```sh
nexflow validate nexflow.bundle.yaml
nexflow inspect nexflow.bundle.yaml
nexflow graph nexflow.bundle.yaml
```

The CLI should report that it is expanding a bundle and should show the logical manifest paths it derived.

The CLI must not treat a bundle as a runtime package.

## Relationship To Runtime Architecture

Bundles should not decide runtime architecture.

A runtime may eventually accept manifest bundles as input, but it should first expand and validate them under the same rules as normal manifests.

Runtime-specific package formats, signed deployment bundles, hosted registries, and template engines are out of scope for this RFC.

## Migration Guidance

No migration is required because no bundle format is currently accepted.

If a future bundle schema is accepted:

1. Keep existing multi-file examples valid.
2. Add bundle examples as optional fixtures.
3. Add schema validation for the bundle envelope.
4. Add semantic validation for expansion rules.
5. Document diagnostics for bundle path mapping.
6. Update compatibility notes for bundle-aware tools.

## Alternatives Considered

### Keep Only Multi-File Manifests

This is the current model.

It remains the safest default for review and ownership, but it may make import/export and example sharing more cumbersome.

### One Large Manifest

NexFlow could replace the manifest set with one large file.

This would reduce file count but make review, ownership, and focused validation harder. It would also conflict with RFC-0002's accepted preference for separate manifests.

### YAML Multi-Document Only

NexFlow could support only YAML multi-document streams.

This is simple, but it lacks explicit bundle metadata and makes diagnostics, completeness, and source mapping less clear.

### Archive Files

NexFlow could define a `.zip` or `.tar` bundle.

This may be useful later, but archives bring path traversal, size, duplicate path, inspection, and signature questions. They should not be the first bundle format.

### Runtime Package Format

NexFlow could make bundles deployable runtime packages.

This is out of scope. It would require runtime architecture decisions, signing, dependency handling, credential boundaries, and execution semantics.

## Open Questions

- Should `ManifestBundle` become a first-class manifest kind?
- Should the first accepted format be an index, an embedded bundle, or a YAML multi-document stream?
- Should bundle support be part of `NF-CLI` or a separate `NF-BUNDLE` conformance claim?
- Should bundle entries support digests from the first version?
- Should external references be forbidden entirely in `0.1` bundle drafts?
- Should public examples include bundles, or should bundles live only in tests and fixtures at first?
- Should bundle expansion preserve comments from YAML sources?
- Should bundle-aware diagnostics use logical paths, physical paths, or both?
