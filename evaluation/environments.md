# Common Environment And Measurement Contract

Status: infrastructure preparation, not candidate evidence or release support.

[environment-contract.json](environment-contract.json) defines one shared
contract for Linux AMD64, macOS ARM64 and Windows AMD64. The three native runner
selectors are `ubuntu-24.04`, `macos-15` and `windows-2025`; `*-latest`, translated
execution and cross-build-only results are not interchangeable targets.

## Exact Environment Freeze

The initial native probes passed on 2026-10-01 at source revision
`021079f2d086873d1c8d93244a6f0c8040b769cc` in
[run 36844655825](https://github.com/iwizy/NexFlow/actions/runs/36844655825).
The committed contract preserves the sanitized snapshots and per-target job
and included-software links even after short-lived artifacts expire.

A subsequent CI invocation exposed nonmatching Linux/Windows fingerprints.
The probe's capture mode reports current target access and records cohort
blockers separately. This does not relax the comparison helper's default:
measurement eligibility still requires exact frozen fingerprints. A fresh
capture with different hardware or software must not be scored as comparable.

| Target | Observed OS/build | Observed image version |
| --- | --- | --- |
| Linux AMD64 | Ubuntu 24.04.5, kernel 6.17.0-1022-azure, glibc 2.39 | 20260920.314.1 |
| macOS ARM64 | macOS 15.7.9, build 24G830, native Apple M1 | 20260907.0337.1 |
| Windows AMD64 | Windows Server 2025, build 26100 | 20260925.250.1 |

No target-access blocker remains from these probes. Signing/notarization and
candidate-specific native dependency or packaging availability are still
not-tested. Image/hardware rotation remains a reproducibility limitation.

The [probe workflow](../.github/workflows/evaluation-environments.yml) uses only
the existing standard hosted infrastructure, read-only repository access and
an exact maintenance Node version. It installs no candidate or system packages.
The public repository has Actions enabled and no registered self-hosted runners.
Standard hosted usage is free for public repositories according to the
[hosted runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
No larger, paid or newly registered runners are authorized.

Probe records contain only an allowlisted OS/image/hardware fingerprint, never
hostnames, usernames, paths, environment dumps, credentials or machine IDs.
They verify native process architecture, the OS family, and native ARM execution
on macOS. Successful probes establish infrastructure access only: no candidate,
isolation, signing or packaging gate becomes passed.

Runner labels are rolling selectors, not immutable image pins. Exact image
versions and OS builds must be copied from successful probe evidence into the
contract before comparing candidates. The immutable included-software manifest
is available through each job's setup log, as described by
[runner image documentation](https://github.com/actions/runner-images).
Missing probes remain `not-tested`. Native tools and system prerequisites come
from that image manifest; additional candidate dependencies and packaging
variants must be locked in NF-056-04.

Run `node scripts/runtime-evaluation-environment-smoke.mjs` to check the contract.
Before each actual candidate cohort, capture a fresh record and call
`checkEnvironment(contract, snapshot)` from the pure comparison helper. Its
default requires a frozen snapshot. Any image, OS/kernel/libc, architecture or
hardware drift blocks comparison. Hosted labels cannot restore an older image;
if it has rotated, review one new common contract and rerun all affected
candidates. Do not claim fully reproducible VM provisioning from a label.

## Common Workloads And Measurements

Use the 11 pinned CLI cases, all 109 maintained manifests, four schema-negative
fixtures and the shared NF-056-03 library inventory. Throughput uses 1, 10 and
100 passes over identical immutable corpus bytes, not merged duplicate resources.
Candidate order rotates each repetition on the same target. Never compare an
ARM/macOS number directly with an AMD64/Linux or Windows number.

The JSON contract gives exact repetitions, warmups, cache rules, time limits,
units and required raw-record fields for all seven report metrics. Cold means
a fresh process, not a cleared OS file cache. Provisioning is excluded from
offline invocation and build timing; dependency caches and project build caches
are separate. Measure memory externally using native OS facilities, including
the interpreter and disclosed child-process accounting. Fix and document the
same measurement tool/version within each target before any benchmark.

Retain raw samples, errors, timeouts and the order of candidates. Record exact
package/prototype/specification revisions, corpus and artifact hashes, snapshot
hash, workload, cache state and method. Summaries use count, median, minimum,
maximum and nearest-rank p95; no selective outlier removal. CI time excludes
queue wait and separates provisioning, build, test and upload phases.

The native lifecycle tasks must prepare two versioned evaluation artifacts for
upgrade/rollback, not product releases. Unavailable packaging, signing keys,
notarization, signature verification or measurement facilities stay explicit
blockers. No signing credential, package publication or release is authorized
by this environment contract.
