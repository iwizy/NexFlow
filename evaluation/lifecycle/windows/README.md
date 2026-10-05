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
Unicode input staging failures likewise remain separate failed path probes;
the unchanged CLI cases can use verified ASCII-space fixtures as supplemental
native evidence without asserting Unicode compatibility.

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

## Actual native results — 2026-10-05

Collector `fd80b4b0aad9369ead64f1b94aefb3ce9097fc15` ran in
[native run 37305959172](https://github.com/iwizy/NexFlow/actions/runs/37305959172).
[Runner receipts](runner-receipts.json) retain exact jobs and provisioning
failures; green collector CI means evidence capture, not successful lifecycle.
[Independent archive verification](archive-verification.json) checked three
capsules and all 867 unpacked files; Python has no fabricated capsule.

| Record | Build | Unicode install / ASCII-space fallback | Shared CLI passed / failed (twice each) | Scoped uninstall |
| --- | --- | --- | --- | --- |
| [TypeScript](typescript.json) | passed | failed / passed | 11 / 0 | passed |
| [Python](python.json) | failed | not-tested / not-tested | not-tested | not-tested |
| [Rust](rust.json) | passed | failed / passed | 1 / 10 | passed |
| [Go](go.json) | passed | failed / passed | 11 / 0 | passed |

Three native candidates produced 66 invocations: 46 satisfied unchanged CLI
expectations, 20 Rust invocations failed (exit 4, internal diagnostics after
build-schema masking). Only Rust's refusal to execute `run` passed. None of
these results repair the pre-existing full-library semantic/fidelity failures.

All three native `tar.exe` extractions failed on the Unicode prefix with
`could not chdir` and replacement characters. Same-archive ASCII-space installs
succeeded and content remained unchanged. All 33 Unicode input staging probes
failed in this native harness; unchanged cases used verified ASCII-space inputs
as supplemental evidence. This is not a Unicode compatibility pass. Original
[four early records](attempts/10253c7/typescript.json) and
[early archive checks](initial-archive-verification.json) retain the previous
no-CLI extraction failures; later collector rejections remain linked in receipts.

Existing setup could not provision CPython 3.12.14 for Windows AMD64. The
collector observed and refused 3.12.10; no alternate version was accepted.
Hash-locked wheel provisioning also refused the Windows conditional `colorama`
dependency of `build==1.3.0`, absent from the frozen lock. A specifically approved
native CPython provisioning path and scoped shared-lock repair are required
before a valid Python Windows artifact/run, not a silent version fallback.

All jobs used Windows Server 2025 build 26100, image `20260925.250.1`.
TypeScript/Rust matched the frozen fingerprint; Python/Go recorded CPU drift.
Those records are supplemental, not one matched four-candidate benchmark cohort.
Rust/Go Authenticode queries returned empty fields, so signatures remain
unavailable/not-tested, not verified. Offline OS denial, previous-artifact
upgrade/rollback, signing, native closure, advisory/license remediation and
architecture gates remain open. Capsules made during this task are not invented
as historical upgrade predecessors. Temporary CI capsules have seven-day
retention; tracked receipts are durable, not a package publication.
