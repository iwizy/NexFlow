# Cross-Target Measurement Evidence

Status: NF-056-15 bounded gap-bearing deliverable; full measurements and the
architecture decision remain **not-ready**. No candidate was executed or timed
in this pass. There is no performance ranking, score, or winner.

The four [TypeScript](typescript.json), [Python](python.json),
[Rust](rust.json) and [Go](go.json) records cover all seven metrics on Linux
AMD64, macOS ARM64 and Windows AMD64: **84 explicit not-tested metric records**.
Empty samples, zero sample count and null statistics mean missing evidence,
not zero elapsed time or zero memory. Eleven existing capsule byte observations
are kept separately as historical, non-comparable evidence; Windows Python
has no artifact.

## Exact Inputs And Readiness

[prerequisites.json](prerequisites.json) retains the fresh 2026-10-05 exact-head
PR/CI receipts for NF-056-02/09/12/13/14 and the SHA-256 of every source record.
All five bounded deliverables were published with successful CI before this
task began. PR #90/#101/#105 were merged; #107/#108 were open. This PR is based
on main `3ffe720c5844212e5eea7f84f11d0f5bd150b7c7`, not stacked code from
those open PRs. It reads their immutable published heads; it does not merge or
copy their implementation changes. CI success means evidence consistency,
not successful candidate lifecycle or performance.

The common specification, package, 176-file corpus and entire 352-case catalog
remain those in [source-pins.json](../fidelity/source-pins.json). Every case ID,
operation and retained result is reconciled, not reduced to the supported
subset. Each candidate retains 128 passed / 0 tested failures / **224
unsupported** library cases (211 semantic, eight workflow namespace and five
artifact namespace). Specification fidelity stays failed and full deterministic
diagnostics stay not-tested. Schema-negative cases and expected CLI refusals
are correctness experiments, not successful-input throughput.

## Why No Comparable Timing Was Started

| Target | Actual retained evidence | Measurement blocker |
| --- | --- | --- |
| Linux AMD64 | Native Ubuntu 24.04, image 20260927.320.1; mixed AMD/Intel hardware snapshots across candidate jobs | Image differs from frozen 20260920.314.1; CPU/memory differ for some jobs. There is no fresh common candidate cohort. |
| macOS ARM64 | Native macOS 27.0.1 / 26A434, Apple M4 Pro; all four source-layout capsules packaged from previous builds | Supplemental, not frozen macOS 15.7.9 / 24G830 / Apple M1 Virtual. Packaging-only observations are not clean/cached build timings. |
| Windows AMD64 | Native Server 2025 / 26100, image 20260925.250.1; TypeScript/Rust match, Python/Go CPU drift | No all-four common cohort; exact CPython 3.12.14 unavailable in performed provisioning, fallback 3.12.10 refused and no Python capsule. Unicode install failed; OS offline denial not-tested. |

Installed Rust validation fails on all three targets because schemas remain
bound to the build checkout. Ten of eleven CLI cases fail, twice; a quick
internal-error exit cannot become a successful-validation sample. Unicode
Windows extraction and input staging failures remain distinct from supplemental
ASCII-space CLI runs. No lifecycle elapsed time, workflow duration, source-build
duration, maintenance check or local process memory is relabeled as a metric.

Missing prior evaluation artifacts, upgrade/rollback, signing/notarization,
runtime/native dependency closure, supply-chain risks and security residuals
remain retained lifecycle/architecture blockers. They are not all prerequisites
for measuring an isolated byte count, but none is waived by that observation.
Existing runner access is not missing; exact comparable cohort and workloads
are. Additional target-access probes cannot repair unsupported library behavior
or the missing Windows interpreter and are not candidate benchmarks.

## Frozen Method And Unperformed Instrumentation

The unchanged [environment contract](../environment-contract.json) owns runs,
warmups, cache rules, units and limits. Record envelopes carry the candidate,
target, specification/package/prototype revisions and corpus hashes; individual
metrics inherit those fields. All remaining required raw-record fields are
explicit, including missing measuredAt, order, cache state, actual warmups,
instrument/version, timeout and exit status. Null actual fields are distinct
from the separately declared required settings.

| Metric | Unit | Runs / warmups | Required boundary |
| --- | --- | --- | --- |
| coldStartMs | ms | 10 / 0 | Fresh process; provisioned dependencies; disclose uncontrolled OS file cache |
| validationMs | ms | 30 / 1 | Warm native library; exclude startup/provisioning; identical corpus batches |
| peakMemoryBytes | bytes | 10 / 0 | External native OS peak resident memory including interpreter and disclosed child accounting |
| artifactBytes | bytes | 1 / 0 | Exact hashed capsule; installed/runtime footprint separately disclosed |
| cleanBuildMs | ms | 5 / 0 | Empty project build cache; provisioned dependency cache; verified network denial |
| cachedBuildMs | ms | 5 / 1 | Populated project build cache; unchanged source; verified network denial |
| ciMs | ms | 3 / 0 | Exclude queue; separate provisioning/build/test/upload phases and cache hits |

The full workload is the same 11 CLI cases, 109 maintained manifests, four
schema-negative fixtures and all 352 library cases, with 1/10/100 immutable
corpus passes. Candidate order rotates each repetition on one reverified
target cohort. Native instrument and version must be fixed identically for all
four before running; neither an unselected facility nor an unperformed method
is called tested. Raw run identities, every sample/error/timeout and actual
order must be retained. Dispersion is count/median/min/max/nearest-rank p95,
with no outlier removal.

Error/rejection benchmarks have a separate empty record, not success timings.
No different OS, hardware, semantic coverage or packaging/runtime closure can
be used as a direct language ranking. The historical capsule observations
disclose exact SHA-256, revision, timestamp, compressed bytes and the sum of
manifest file bytes. That sum excludes filesystem overhead, Python venv
expansion, external Node/CPython and native dependencies: it is not a complete
installed or runtime footprint. These observations are not new artifactBytes
samples from an eligible NF-056-15 cohort.

## Required Follow-Up, Not Automatic Repair

1. Review an exact common cohort contract if frozen images/hardware cannot be
   reacquired; do not silently change this contract. Rerun all four on each
   affected target, not mixed historical jobs.
2. Separately authorize missing semantic/namespace implementation and Rust
   relocation remediation, preserving the catalog/oracle and retaining failed
   old revisions. A supported-subset experiment must be labeled separately.
3. Provide approved exact native Windows Python provisioning and separately
   review any necessary shared dependency-lock repair; do not choose a fallback
   interpreter or add dependencies in this task. Close Windows path/isolation
   and remaining lifecycle/signing gates under their own authority.
4. Fix native instrumentation/version, child accounting, phase and cache
   controls, then run the unchanged repetitions and preserve raw evidence.

No new infrastructure, paid resources, signing authority, candidate repair,
release, version change or architecture acceptance is granted by this record.

## Verification And Reproduction

Fetch immutable public prerequisite objects if they are absent locally:

```sh
git fetch --no-tags https://github.com/iwizy/NexFlow.git eb3088e53765be0562d3ba9770f451c83e50b83b 166ea9e79959c9620e7a6777f95c923b79fb3ec2
npm ci --ignore-scripts
node scripts/runtime-comparable-measurements.mjs --verify
npm run runtime-comparable-measurements-smoke
```

The verification is offline once Git objects and maintenance dependencies are
provisioned. It fails closed when exact objects or their recorded digests are
missing; it never downloads or runs a candidate. `--write` regenerates only
the four fixed gap records from those sources. Positive/rejection checks
protect metric/target completeness, revisions, units, null-vs-zero semantics,
retained failures/drift and non-selection. This is evidence validation, not a
benchmark harness, certification or hard-gate pass.
