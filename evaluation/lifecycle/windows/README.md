# Windows AMD64 Evaluation Lifecycle

NF-056-14 uses the existing `windows-2025` native AMD64 hosted runner for four
unchanged validation-only candidates. This task is independent of the macOS PR.
No product package, release, version update, candidate repair or architecture
acceptance is introduced.

The [prerequisite receipt](prerequisites.json) binds merged NF-056-02/04/05/06/07/08/11
heads, merge revisions and successful CI. Actual supply-chain inventories at
`fed105367da915347a92896eb67c0446d9e9b2d7` remain partial; existing advisory,
license and runtime/native closure risks are not repaired or declared passed.

## Method and limits

The [workflow](../../../.github/workflows/windows-lifecycle.yml) provisions exact
reviewed compilers and locked dependency caches online in separate disposable
jobs. The trusted collector verifies frozen source/package/specification/corpus/
catalog pins, inventories sources and locks, and creates source-revision plus
collector-revision `.tar.gz` evaluation capsules. Setup/build failures produce
honest blocked records, not substituted compiler versions or success claims.

Node 22.23.2 and CPython 3.12.14 remain external prerequisites. Python carries
only hash-approved binary wheels and installs the full 15-package locked graph
into a fresh venv with pip 26.2.1. Rust requires native MSVC tooling; Go builds
with cgo disabled. PE headers of runtimes, candidate binaries and installed Python
native modules must identify AMD64. Native dependency closure remains partial.

Installation extracts a checksum-verified capsule into a clean task-owned prefix
containing spaces and Unicode. The disposable build-checkout schemas are hidden
and restored in `finally`. All 11 unchanged shared CLI cases run twice from the
installed capsule with UTF-8 output. Diagnostics, exit status, repeatability,
path disclosure and input checksums retain actual failures. The known Rust
schema relocation defect is not fixed. Uninstall removes only the temporary
installed prefix, preserving the capsule, external runtimes and build caches.
If Unicode-prefix archive extraction fails, that failure stays visible and the
same capsule is extracted into an ASCII-space prefix for supplemental CLI runs
against Unicode-space input paths. Such a fallback does not approve Unicode
installation or silently alter the target contract.

A fresh VM, venv, package-manager offline flags or clean prefix is **not** a
verified OS denial boundary. This experiment does not introduce firewall,
account or credential changes or certify a Windows sandbox. `offlineUse` and
filesystem/network/credential isolation remain `not-tested` until a scoped,
validated Windows denial harness with independent negative controls is authorized
and run. Native ordinary execution is never relabeled offline.

No previous genuine Windows evaluation package was found in retained repository
artifacts. Upgrade and rollback stay `not-tested`; a second identical capsule or
a macOS/Linux/source artifact is not fabricated as Windows history. Signing stays
`not-tested` without specific publisher/certificate authority. Read-only PE
Authenticode observations are not approved signed delivery; no foreign keys,
certificate store enumeration or signing service is accessed.

Records include actual OS/image/CPU/toolchain fingerprints. Frozen-cohort drift
is supplemental evidence, not a target update or performance measurement. Four
honest records complete the bounded preparatory deliverable, not hard gates.

## Reproduce

After reviewed provisioning, on native Windows AMD64 only:

~~~powershell
node scripts/runtime-windows-lifecycle.mjs typescript "$env:RUNNER_TEMP/lifecycle.json" "$env:RUNNER_TEMP/capsules"
npm run runtime-windows-lifecycle-smoke
~~~

The smoke check validates stored receipts and rejection controls. Fixture checks,
cross-compilation, Wine, macOS and Linux are not native Windows evidence.
