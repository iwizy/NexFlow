# Reference Preview Compatibility And Support

This guide applies to the exact private `0.5.0-alpha.1` archives selected by the
[release review](../release/0.5-preview-review.md). Publication is pending a
separate instruction. Package/repository tag, manifest `0.1`, embedded schema
snapshot and `0.5-preview.1` output are independent version domains.

## Supported Slice

| Surface | Qualified boundary |
| --- | --- |
| Native prerequisites | Node 26.13.1/npm 11.20.0; Ubuntu 24.04 AMD64, macOS 15 ARM64, Windows Server 2025 AMD64; exact observed images/fingerprints stay in the records. |
| Commands | Help/version, explicit-root `validate`, declared-only `inspect`, explanatory static `graph`; directory/Project/explicit-file modes. `init`, recursive discovery, remote schema/bundle sources and execution are unsupported. |
| Inputs | UTF-8 local `.yaml`/`.yml`, exact manifest `0.1`, 17 kinds and 18 embedded schema files; no independent schema publication. |
| Validation | Parsing/discovery association/schema; inspection/graph are bounded projections. Complete semantic/Core/extension/runtime layers are `not-run`. |
| Machine output | `0.5-preview.1`, safe bounded diagnostics, clean JSON streams, deterministic ordering and exits 0/1/2/3/4. |
| Claims | No `NF-CLI`, complete `NF-SCHEMA`/`NF-SEMANTIC`, Core/extension or runtime conformance claim. [Explicit non-claim](../conformance/REFERENCE-CLI-PREVIEW-NON-CLAIM.md). |
| Trust | Unsigned JavaScript/data with separately verified external Node; no general OS sandbox, publisher signature, Developer ID/notarization or Authenticode claim. |

## From Historical Tools

`scripts/cli-prototype.mjs` and the four evaluation candidates remain historical
maintenance/evaluation surfaces. Their `0.4-draft` or
`nf-validation-diagnostics-v1` outputs are not the preview envelope. Consumers
must explicitly recognize `0.5-preview.1`, the tool/package identity and check
states; do not silently reinterpret old JSON as current output. An old schema
success is not a new semantic/runtime result. Prototype `init` has no preview
replacement yet; preserve existing manifests and edit explicitly when needed.

Manifest syntax is unchanged. Copy projects only for testing, preserve source
bytes and inspect diagnostics rather than applying automatic rewrites. Existing
`specVersion: "0.1"` projects use the same frozen schema snapshot. Other versions
fail with exit 3. A mismatched CLI/library pair or runtime fails with exit 4
before project reads. Public API changes require separate compatibility evidence.

## Exact Archive Upgrade And Rollback

Keep previous and current archives with their own provenance/checksum sets.
Internal candidates may share `0.5.0-alpha.1`; their immutable source/digests,
not a filename or version alone, distinguish them. Native qualification uses a
genuine retained predecessor and a substantively corrected successor. It never
manufactures history by relabeling identical code.

Before upgrade, verify the new trusted digest and runtime/target/profile mapping.
Reject an altered, unknown or mismatched set without installing it. Install the
exact new local tarball with the [offline, scripts-disabled flags](reference-cli-installation.md),
verify the installed package and its `build-info.json` revision, and run the
same project checks. Preserve application input snapshots and unrelated files.
npm is the installation tool; this preview does not supply an atomic updater.

To roll back, select the **genuine** retained prior archive and repeat the same
scoped offline install, verification and quick start. A passing lifecycle test
is not a recommendation to restore an older affected package: review its security
record first. If no permitted predecessor is safe/available, remove the scoped
consumer and stop; do not invent a rollback or disable integrity checks.

Public immutable assets must not be overwritten under the same filename/tag to
hide a defect. After a future publication, corrections need a new preview
identifier, new candidate evidence and migration notes. Known bad assets must
be identified explicitly; withdrawal must explain impact, replacement and
whether previously downloaded bytes are affected. Published 0.1–0.4 tags and
their evidence are preserved. Package/version changes are separately reviewed.

## Maintainer And Feedback

Alexander Agafonov holds the seven bounded pre-release roles in the adopted
[ownership record](../rfcs/reviews/2026-10-11-single-maintainer-ownership.md),
including security/dependencies and release/CI. Review uses the adopted
single-maintainer policy with separate technical lenses; it does not imply a
second person or independent assurance. Support is best effort during this
preview: no fixed support lifetime, response SLA, backup or on-call is promised.
Record the exact tag/source/archive digest, runtime/OS, command and synthetic
reproduction when filing a non-security issue through the repository templates.

Use [private vulnerability reporting](../SECURITY.md#reporting-security-issues)
for security issues. The maintainer owns triage, correction, withdrawal and
incident follow-up under the existing policy; vulnerable versions remain visible
until their specific disposition/repair. Do not post credentials or private
manifests in public issues. No provider account is needed to use the CLI.
