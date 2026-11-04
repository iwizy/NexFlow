# Reference Native Lifecycle

NF-109 qualifies the actual private CLI and library archives from the bounded
[preview contract](0.5-cli-contract.md) on Ubuntu 24.04 AMD64, macOS 15 ARM64
and Windows Server 2025 AMD64, with exact external Node **26.13.0** and npm
**11.20.0**. The [native workflow](../.github/workflows/reference-lifecycle.yml)
uses existing hosted runners. Each result records the actual OS/build/image,
CPU/architecture, runtime/component versions and exact candidate digests.
These are new target cohorts; historical evaluation images are not relabeled.

## Genuine Inputs And Installation

The [contract](../qualification/reference-lifecycle/contract.json) pins the real
NF-107 source `54facf50320168e099f2909f0e9ae65ae46fb6b3`, retained run/artifact
IDs and both original archive hashes. The workflow downloads that original
artifact; it never fabricates a prior preview version. Its initial archive ZIP
was previously verified, while each native run independently checks the actual
tarball and checksum/provenance bytes it receives.

The current candidate is built once from the exact PR head with the locked
compiler and the [existing package builder](../scripts/reference-packages.mjs).
All three native jobs consume those same archives. The separate package workflow
repeats installed security/dependency qualification for that same source/digest;
native acceptance must be matched to its exact archives, not an earlier scan.

The successor contains the NF-108 source-hint/URI repairs and Windows consumer
verification of exact npm-generated YAML wrappers. The original verifier knew
only the Unix symlink. Windows npm also generates shell, `.cmd` and `.ps1`
wrappers; the current verifier permits only the complete pinned npm 11.20.0 /
cmd-shim 8.0.0 bytes at those exact locations. Modified or unexpected scripts
still fail. The current trusted verifier can inspect the predecessor's installed
composition; this does not make its historical Unix-only verifier portable.
Versions remain private `0.5.0-alpha.1`; revision/digest identifies each genuine
candidate. No product tag or registry publication is involved.

Provision the external native Node archive from the official HTTPS distribution,
verify its SHA-256 against the same-origin `SHASUMS256.txt`, and match the actual
executing binary to that archive. Retain the archive/binary/license digests,
original combined license and embedded component versions. This establishes
the selected upstream route and exact bytes, not independent publisher trust.
No Node runtime is redistributed in either product archive.

All installations use separate temporary consumers with spaces/Unicode in their
paths, fresh caches and empty user configuration. npm runs offline with lifecycle,
audit, funding and update lookup disabled, alongside an application network-deny
guard. No registry lookup or dependency backend from the source checkout is
needed. The installed CLI's own matching library and a separately installed
public library are checked at every stage.

## Native Checks And Controls

[`reference-lifecycle.mjs`](../scripts/reference-lifecycle.mjs) records:

- Genuine previous install, substantive upgrade, digest refusal before a
  corrupted update mutates the prefix, actual runtime refusal of incompatible
  installed metadata, restoration, genuine rollback, corrected reinstall and
  scoped npm uninstall of both packages.
- Installed help/version, validate/inspect/graph, all three selection forms,
  UTF-8 filenames and Unicode roots, positive and rejected inputs, usage and
  unsupported-version exits, JSON envelope validation, deterministic results,
  pure library import and the actual npm-created user wrapper.
- Application read/effect guards, redaction and unchanged input snapshots.
  Archives, external runtime and an outside synthetic canary survive uninstall;
  installed packages and user wrappers are removed.
- A real local TCP positive control, followed by the same probe in an OS network
  restriction: an unprivileged Linux network namespace with capabilities
  dropped, macOS `sandbox-exec` with `deny network*`, or a Windows AppContainer
  with zero capabilities. CLI/API checks run in that network-denied context.
  The actual npm user wrapper is also checked in the ordinary native shell;
  it is not reported as having inherited the direct-entry OS network profile.
- Exact before/after environment fingerprints, producer/helper/workflow source
  hashes, workflow/run identities, selected input provenance, per-stage outputs
  and failures. The record is written even on failure; failed setup or an absent
  runner is never counted as a successful target run.

On Windows, the existing scoped AppContainer launcher grants read access only
to task-owned runtime, consumers, fixtures and guard directories. Literal
ancestor metadata/traversal grants use the unique temporary profile SID and are
removed on cleanup. No global firewall rule, persistent user installation,
keychain, certificate or OS trust setting is changed.

The evidence artifacts are named `reference-lifecycle-<target>-<producer-sha>`
and retained for 90 days. Each contains `lifecycle.json`, original Node checksum
input and license. Download and checksum-verify them before expiry; retain the
selected current and previous archive sets together. The PR/card receipt must
state actual target outcomes and digests rather than infer success from this
procedure or a green fixture verifier.

## Acceptance Limits

Passing records qualify unsigned developer installation on the named exact
runtime/targets. They do not establish a general filesystem/process sandbox,
safe concurrent directory renames, protection against arbitrary executable
caller code, complete native/CPE/OS advisory coverage, independent auditing or
full semantic/Core/extension/runtime conformance. Network denial is evidenced
by its actual positive/negative controls; application hooks alone do not prove
an OS restriction.

The external-Node JavaScript/data preview provides no app/native installer to
notarize or sign. Developer ID/notarization, Authenticode and independent
publisher signatures remain explicitly unperformed under the adopted delivery
scope. A standalone binary or different runtime/distribution route requires
another assessment. NF-110 must review the exact final archives, current
security and all three native records before any publication decision.
