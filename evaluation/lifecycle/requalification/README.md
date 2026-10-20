# NF-102-03: Current Native Lifecycle Requalification

Status: evidence-collected-acceptance-blocked; architecture remains Draft/not-ready.
Missing genuine predecessor packages and permitted project signing are explicit
acceptance blockers, not waived requirements. The maintainer confirmed both
are unavailable on 2026-10-20 and authorized publishing/merging this work.

## Scope And Authority

The [new cohort contract](contract.json) records explicit maintainer approval
for current standard `ubuntu-24.04`, `macos-15` and `windows-2025` environments.
The [original contract](../../environment-contract.json) and all historical
NF-056 lifecycle records remain unchanged. A single native job captures its
exact OS/build/image/CPU/memory/architecture snapshot before all four candidates
and verifies it again afterwards. No cross-target performance ranking follows.

[Preflight](preflight.json) binds merged NF-102-01/02 and their successful main
CI. The three probe records preserve current access and old-contract drift;
they do not establish candidate lifecycle success. Actual build/run cohorts
are separately recorded and need not reproduce a rolling probe's hardware.

Candidate/package source remains
`23e576efd0dda0f00f5462eda9295c1ae4ec8fee`; current repaired locks and versions
are unchanged. Collector revisions and source hashes are independent. No
candidate implementation, frozen schema/corpus/catalog/oracle, product version
or previous report is changed. Build/provisioning tools are trusted evaluation
inputs, not candidate runtime/provider/credential capabilities.

## Method

The [native workflow](../../../.github/workflows/native-lifecycle.yml) uses
existing standard public-repository runners and read-only repository access.
It provisions exact repaired tools/dependency caches separately. If setup-python
lacks CPython 3.12.15, the [native runtime pins](python-runtimes.json) select the
same exact version from verified upstream release assets. Hashes are checked
before extraction/execution. Missing exact tools stay failed; there is no
fallback to a different interpreter/compiler version.
Windows provisioning preserves only the required system environment and a
native path delimiter rather than imposing Unix PATH semantics.

Each successful native build produces a revision-versioned `.tar.gz` capsule
containing reviewed source/lock/schema inputs and its actual executable or
interpreter payload. Node/CPython remain exact external prerequisites; Python
contains nine hash-locked runtime wheels and no pip/build tools in its venv.
Archive hashes, regular-file manifests and native binary architecture are
recorded. Capsules are retained as evaluation artifacts for 90 days, not product
releases or published installable packages.

Installation first extracts into a clean ASCII staging directory, checks every
file, then uses native filesystem rename into the final Unicode-space prefix.
Execution occurs from that final prefix with Unicode-space input paths; there
is no successful ASCII execution fallback hiding a failed Unicode install.
The disposable checkout's schema directory is hidden and restored in `finally`.
All eleven unchanged shared CLI cases run twice, preserving real diagnostics,
exit statuses, repeatability and input/payload hashes. A `run` rejection is one
case, not proof of successful validation.

Linux network namespaces and macOS Seatbelt have independent paired positive
and denied loopback controls before candidate runs. Failed controls cannot
promote ordinary execution to offline success. These controls are network-only,
not the complete filesystem/process/credential security boundary of NF-102-04.
No qualified Windows OS-denial harness is introduced by this work; ordinary
native Windows CLI success remains separate from `offlineUse: not-tested`.

Uninstall deletes only the newly created installation prefix and checks that
the capsule, external runtime and outside canary survive. Existing signature
inspection is read-only: Mach-O architecture/codesign state or PE architecture/
Authenticode observation. Ad-hoc/upstream signatures do not authorize project
signing or notarization. No keychain/certificate-store inventory or mutation,
borrowed keys, signing-service submission or production change occurs.

## What Cannot Be Accepted Yet

- No real previous evaluation package is available: upgrade and rollback remain
  not-tested. A second identical capsule, source checkout or invented product
  release is not substituted as history.
- No permitted project signing/notarization identity is available: these stages
  remain not-tested even if a compiler/runtime already has an upstream signature.
- Windows OS network denial remains not-tested. All twelve current native
  installation/execution records passed their tested stages; earlier collection
  and Windows Python installation failures remain in [attempts](attempts.json).
- CI success means the observations and consumers ran, not full lifecycle,
  architecture, security, distribution, signing or release acceptance.

The newly retained current packages can become genuine predecessors for a later
real candidate update; this work does not manufacture that update to get a pass.
Different collector revisions of the same unchanged candidate are not claimed
as a genuine version upgrade or rollback test.
NF-102-03 remains open until its original criteria are actually satisfied.

## Observed Results On 2026-10-20

The [native run](https://github.com/iwizy/NexFlow/actions/runs/39406341776)
captured collector revision `3cbbd1bc02da0768c9c116a18f56dab9a3ef3cb6`.
The [summary](summary.json) retains each original criterion and candidate result;
[runner receipts](runner-receipts.json) bind exact job/artifact IDs and expiry.

| Native cohort | Candidates | Build/package/install | Installed validate/inspect | OS-denied offline | Scoped uninstall |
| --- | --- | --- | --- | --- | --- |
| [Linux AMD64](linux-amd64/cohort.json) | All four | Passed | Passed | Passed | Passed |
| [macOS ARM64](macos-arm64/cohort.json) | All four | Passed | Passed | Passed | Passed |
| [Windows AMD64](windows-amd64/cohort.json) | All four | Passed | Passed | Not-tested | Passed |

All 12 capsules were independently extracted and all 2,907 regular files matched
their recorded manifests; see [archive verification](archive-verification.json).
The eleven shared command cases ran twice per candidate/target: 264 invocations,
including expected invalid-input/unsupported-command results, not 264 successful
validations. Rust installed execution passed without checkout schema access on
all three targets. Windows Python passed from its final Unicode-space prefix
after a fixed UTF-8 provisioning correction, without changing candidate locks.

The [local checks](checks.json) are repository/evidence-consumer regressions, not
substitutes for these native observations. Signing inspection remained read-only;
existing ad-hoc/upstream signatures were not accepted as project signing.
The current capsules expire after 90 days unless separately retained; expired
CI storage is not a durable historical package archive.

## Evidence Consumers

`node scripts/runtime-native-lifecycle-smoke.mjs` checks source/collector Git
bindings, common cohorts, actual outputs, stage boundaries and nine fail-closed
controls. Zero stored records during the initial capture is explicitly not a
native acceptance result. Once records exist, all twelve and all three cohorts
are required. `runtime-native-lifecycle-import.mjs` independently verifies every
retained capsule's hash, size and extracted file inventory before recording it.
Unchanged source-bound native records are reused rather than rerun just because
an evidence document or PR integration commit changed.
The reuse path first provisions the same pinned maintenance-only dependency
graph in its fresh checkout; it does not provision or rebuild candidate tools.
