# 0.7 Integration And Extension Hardening Review

NF-118 records **ready-with-notes** for a repository source milestone proposed
as `v0.7.0`. The evaluated implementation is
`58c1897eb47fae92f73d9a0681bb58e9e277eb57` on `develop`.
The [readiness record](record.json), [evidence index](evidence.json),
[source check results](source-checks.json) and
[retained compatibility report](compatibility-results.json) bind the review.
Documentation corrections in this review have separate file digests in the index.

## Release Plan Criteria

| [0.7 criterion](../../docs/release-plan.md#07-integration-and-extension-hardening) | Evidence and disposition |
| --- | --- |
| Extension namespace ownership rules are clear | NF-115 binds each namespace and exact profile version to source identity, ownership evidence and lifecycle. Reserved/private namespaces, disputed ownership and duplicate rows have offline checks. The fictional registry provides metadata for review. Ownership verification remains external. |
| Lifecycle states support safe preservation | Registry `0.2-draft` retains revoked profiles beside separately pinned successors, immutable profile identity and snapshot-history constraints. The 91 registry assertions cover retirement/history and the retained `0.1-draft` fixture. Authored ExtensionSet lifecycle and registry publication state have separate meanings. |
| Integration metadata expectations are documented | NF-116 pins four `0.1-draft` profiles and separates provenance, source versions and external claims from local support/authority decisions. Its 108 synthetic cases cover unsupported versions, stale evidence, denied local controls and input preservation. |
| MCP authority boundaries are explicit | MCP schema cases and integration fixtures distinguish context from action surfaces, action capabilities, permission, approval, network, credentials and audit. Schema/fixture passes establish the policy profile and offline expectations. Transport and real server behavior require separate qualification. |
| A2A authority boundaries are explicit | A2A schema cases and integration fixtures preserve Agent Cards, remote skill/identity claims, messages, tasks and artifacts as external input. Import provenance and local approval remain independently checked. Live protocol bindings and identity authentication require separate qualification. |
| Compatibility is represented in conformance language | NF-117's 17 shared cases and 51 installed CLI invocations verify preservation, structural diagnostics and inert outcomes. The compatibility matrix distinguishes schema validation, fixture compatibility, implemented support and admission. Conformance claim checks retain 37 cases and 622 assertions. |

All ten workflows on the evaluated merge revision passed. Prerequisite PRs
[#151](https://github.com/iwizy/NexFlow/pull/151),
[#152](https://github.com/iwizy/NexFlow/pull/152) and
[#153](https://github.com/iwizy/NexFlow/pull/153) are merged into `develop`.
The index retains their exact heads/merges and CI revisions. The previous
milestone [v0.6.0](https://github.com/iwizy/NexFlow/releases/tag/v0.6.0)
was published on 2026-11-15 at `22364e3235e2ac273466318255d67331b49f47db`.

## Versions, Compatibility And Migration

| Surface | Exact version and implemented boundary |
| --- | --- |
| Manifest and schema snapshot | Manifest `specVersion: "0.1"`, 18 schema files and 17 kinds; 109 maintained example manifests pass structural validation. |
| Maintained profiles | `io.nexflow.github`, `io.nexflow.issue_tracker`, `io.nexflow.mcp` and `io.nexflow.a2a` at `0.1-draft`, with individual SHA-256 pins. The compatibility fixtures use a separate fictional `com.example` catalog. |
| Registry | `0.1-draft` and `0.2-draft` standalone formats, independent of the manifest dialect. Migration preserves the old snapshot and exact source/version identity. A previously observed newer snapshot prevents legacy downgrade. Self-asserted ownership stays self-asserted. |
| Published validator | `@nexflow/validation` `0.5.0-alpha.1`, API `validation-api-v1-preview`, exact public archive digest in the index. Parsed opaque metadata and caller inputs are preserved. |
| Published CLI | `@nexflow/cli` `0.5.0-alpha.1`, output `0.5-preview.1`, Node.js 26.13.1 and npm 11.20.0. Unknown structurally valid profiles still return schema success with `extensionProfiles: not-run`, `runtime: not-run` and `executionAuthorized: false`. Unsupported manifest dialect returns exit 3; invalid core lifecycle returns exit 1. |
| Fixture host | Source-only v0.6 host, interface `host-preflight-v1-preview`, one explicit synthetic offline operation. Its four-manifest input contract excludes ExtensionSet admission. Prototype, package, schema, lock and native-fixture workflow bytes match the published v0.6 revision. |

The [observed support matrix](../../docs/0.7/extension-compatibility.md) names
the public CLI diagnostics and the separate offline fixture reasons.
An extension compatibility result grants no execution authority. A revoked
profile stays inert with a successor present. Replacement requires an explicit
new reference and review. Existing core manifests need no format migration.
The [registry migration procedure](../../docs/extension-registry.md#migration-from-01-draft)
and [migration route catalog](../../docs/migration-guide.md#current-migration-routes)
describe applicable metadata transitions and rollback boundaries.

## Security, Distribution And Support

The source milestone carries the repository MIT license. The four declarative
profiles and fictional registry add no executable integration artifact or
redistributed runtime/toolchain. Published CLI/library archives retain their
own provenance, MIT notices and bundled dependency licenses. The evidence
index pins their public bytes independently of current-source CI packages.

The evaluated source's November 20 security report returned
`qualified-with-bounded-tooling-risks` with zero unresolved inputs. It retains
four root maintenance advisory instances and 19 npm-tool instances with their
existing scoped dispositions. Delivered CLI/library and validation-build
graphs had zero matches. The withdrawn picomatch advisory retains its dated
response hashes and source-based applicability review. The report is dated
evidence; the current review CI performs the current-source dependency scan.
Refresh release and advisory inputs again before an eventual publication cut.

The offered distribution is source, policy fixtures, documentation and review
evidence. Native installer lifecycle and Developer ID/notarization or
Authenticode acceptance do not apply to this offered format. Source commit
identity and SHA-256 provide traceability. Publisher signature, OS sandbox,
live extension loader, hosted registry, external identity verification,
protocol transport and real service authorization remain unsupported.
Existing fixture-host failures, unsupported cases and earlier evaluation gaps
keep their original scope. This review carries no NF-EXTENSION, NF-CLI,
NF-RUNTIME or independent implementation-conformance claim.

The review uses the adopted single-maintainer process with specification/data
and dependency/distribution lenses. Alexander Agafonov retains the established
best-effort maintenance, security triage, correction and withdrawal roles.
No fixed SLA, support window, backup responder or independent sign-off is
claimed. Feedback should include exact source/archive identity, commands,
environment and synthetic reproduction. Security reports use the route in
[SECURITY.md](../../SECURITY.md).

## Publication Cut

The [proposed notes](release-notes.md) and readiness result are review material.
The maintainer separately decides promotion from `develop` to `main`, the exact
release cut, tag and source publication. Compare the cut's source/fixture/lock
inputs to the evidence index and run its applicable CI. Material changes need
affected requalification. Published `0.5` archives keep their existing identities.

After a separately authorized publication, download the actual public source
archives, record SHA-256 and compare their paths and payloads to the exact tag.
Verify the documented offline checks from those bytes and retain target/run
identities. The downloadable-byte check is pending publication. Readiness and
actual publication are distinct records.
