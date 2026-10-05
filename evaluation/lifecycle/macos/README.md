# macOS ARM64 Evaluation Lifecycle

NF-056-13 packages four unchanged validation-only candidate payloads from the
hash-verified [NF-056-11 supply-chain builds](../../supply-chain/README.md).
These are private, revision-versioned source-layout evaluation capsules, not
NexFlow product packages, supported installed entry points or releases.

The [fresh prerequisite receipt](prerequisites.json) verifies merged
NF-056-02/04/05/06/07/08/11 PRs and successful CI on exact heads. macOS does not
depend on Linux or Windows lifecycle tasks. Source revisions, candidate locks,
specification, corpus, catalog, oracle and earlier failures remain unchanged.

## Collection Method

The [collector](../../../scripts/runtime-macos-lifecycle.mjs) requires native
macOS ARM64 and Node 22.23.2, reviewed source checkouts, exact external runtimes,
the hash-locked wheelhouse and independent synthetic canary. A private JSON
configuration supplies absolute paths; it must not be committed. Candidate
commands are fixed by the collector, never selected by manifests.

The capsule version combines the exact candidate source revision, architecture
and immutable collector revision. Archive SHA-256, byte size and every unpacked
file bind installation to the observed artifact. Packaging reuses the verified
native NF-056-11 payloads; it is not a fresh clean/cached build or reproducibility
measurement. TypeScript runtime packages are provisioned offline from its lock
with lifecycle scripts disabled. Python bundles hash-locked native wheels and
creates a new venv in the clean install prefix. A venv is not an OS sandbox.

Extraction and dependency installation are trusted temporary setup, not
OS-sandboxed installation. Installed execution is different: the reviewed
Seatbelt template denies network, writes, fork/exec effects and source-checkout
schema reads. Positive/denied controls run before candidate commands. Every
unchanged shared CLI case runs twice from the new prefix with source schemas
inaccessible. Actual outputs, errors, digests, repeated-order results and
immutability are retained. Uninstall removes only the task-owned prefix and
verifies the archive, outside canary and original runtime/payload are preserved.

Native Mach-O slices and dynamic linkage are inspected with read-only
`lipo`, `otool` and `codesign -dvvv --entitlements :-`. Existing ad-hoc
signatures are not Developer ID approval or notarization. There is no signing
operation, keychain change, borrowed certificate, ticket validation or Apple
submission. The applicable future path requires a separately authorized
Developer ID identity, hardened-runtime/entitlement review for the actual
payload, signing verification, notarization submission and ticket/policy
validation. None of those distribution gates is inferred from a checksum or
successful local invocation.

## Open Gates

The catalog query found 59 artifacts: environment receipts and four Linux
capsules, but no previous macOS candidate capsule. Reviewed local NF-056-10/11
build directories are source-build payloads, not earlier installable evaluation
packages. Upgrade and rollback therefore stay `not-tested`. No synthetic
product version or duplicate artifact is invented as a predecessor.

The available native macOS environment differs from the frozen macos-15
fingerprint. Local observations are supplemental/drift, not a matched image,
common benchmark cohort or target-support approval. Exact OS/build/CPU/memory,
translation state and drift fields are retained. Archive files are task-local
temporary artifacts with no durable hosting or retention guarantee.

External Node/CPython and native system dependencies remain prerequisites.
Prior supply-chain advisory matches, unknown licenses and native/runtime
closure remain open; no dependency or relocation repair is included. Every
distribution gate remains partial and outcome not-ready. Full fidelity and
independent architecture review are not promoted by lifecycle collection.

## Reproduce And Verify

After reviewing and provisioning the private configuration, run on native ARM64:

~~~sh
node scripts/runtime-macos-lifecycle.mjs typescript /tmp/private-config.json /tmp/lifecycle.json /tmp/evaluation-capsules
npm run runtime-macos-lifecycle-smoke
~~~

Use the exact Node version and committed collector source, not an ambient
runtime. The smoke check validates stored evidence and rejection controls
offline; it does not rerun lifecycle operations or approve candidate gates.
CI fixture consistency and source-checkout invocations do not substitute for
the recorded native installed executions.

## Actual Observations — 2026-10-05

Collector revision `7dcfcdb8beed08d0f0329dc83f1bd9add54d6625` ran on
native macOS 27.0.1 (26A434), Apple M4 Pro ARM64, without translation.
This differs from frozen macOS 15.7.9 (24G830), the macos-15 image, virtual M1,
CPU count and memory. Every record marks supplemental drift; no benchmark
comparison or frozen cohort update is made.

| Candidate record | Capsule bytes | Package / clean install | Shared cases passed / failed | Installed offline use | Scoped uninstall |
| --- | ---: | --- | ---: | --- | --- |
| [TypeScript](typescript.json) | 586042 | passed / passed | 11 / 0 | passed | passed |
| [Python](python.json) | 3927933 | passed / passed | 11 / 0 | passed | passed |
| [Rust](rust.json) | 4391879 | passed / passed | 1 / 10 | failed | passed |
| [Go](go.json) | 3507675 | passed / passed | 11 / 0 | passed | passed |

Each case ran twice: 88 installed process invocations, 68 satisfying unchanged
expectations and 20 failing. Rust's ten failures return exit 4 and
`NEXFLOW-PROTOTYPE-INTERNAL` when its compiled-in source schemas are inaccessible.
Only the rejection of `run` passes. Packaging the unchanged executable and
schemas does not repair its source-bound schema lookup. No candidate code,
locks or common expectations were changed.

Every exact profile passed seven paired controls before candidate invocation:
unrestricted synthetic operations succeeded; sandboxed read/write/connect/bind/
fork/spawn/self-spawn returned EPERM. An additional paired read of the original
source schema succeeded unrestricted and failed with EPERM under that profile.
Input/candidate source/locks and installed payload, including Python venv
content and link-target digests, remained unchanged. The external runtimes and
outside canary remained present after the isolated install-prefix removal.

[Independent archive verification](archive-verification.json) re-extracted
all four capsules and checked SHA-256, byte sizes and all 957 manifest files.
This was not an extra candidate invocation or a reproducible-build test.
[Collection attempts](collection-attempts.json) preserve the initial TypeScript
collector failure on an unused npm-generated symlink wrapper. A forward
packaging-only change removes those wrappers from the temporary capsule;
candidate source, locks and compiled TypeScript bytes are unchanged.

Read-only native inspection found ARM64 slices in every inspected executable
and both installed Python native modules. CPython, the two Python modules,
Rust and Go have existing ad-hoc signatures. External Node has an existing
identity-bearing signature, which is not authorization to sign these capsules.
No identity/keychain inventory, signature rewrite, credential reuse, Apple
upload, notarization or trust-policy change was performed.

Upgrade, rollback, authorized signing and notarization remain not-tested for
all four records. Native/system dependency closure, disclosed supply-chain
advisories, frozen target eligibility, complete security/fidelity and independent
review remain open. Four bounded evidence deliverables do not close those gates.
