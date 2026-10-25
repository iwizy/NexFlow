# Comparable Eligible Candidate Measurements

NF-102-05 uses actual native Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows
Server 2025 AMD64 cohorts, with one shared host for both eligible candidates on
each target. TypeScript/Python must first pass the published lifecycle and
security evidence. Current Rust/Go candidates remain rejected after actual
Windows failures. This explicitly amended evaluation preserves all 84 cells:
42 eligible cells require measurements and 42 rejected cells carry no successful
value or score. The original all-four-success criterion remains unsatisfied.

The [method amendment](../../scripts/qualification/measurement-method.json)
preserves the frozen complete 352-case catalog, 11 CLI scenarios, repetitions,
warmups, individual deadlines and cache disclosures. Only the outer job window
is extended to 120 minutes. A library sample calls the unchanged native API with
one warmup batch then a measured batch of 1/10/100 full corpus passes. The caller
receives no oracle; the outer consumer checks every result with the frozen
oracle. Startup/schema initialization is outside that API clock. The combined
warmup+sample process has a 240s outer deadline; each batch retains its 120s limit.

Cold start and native peak RSS/working-set use fresh CLI processes, ten samples
for each unchanged scenario. Successful scenarios and expected rejections are
separate. OS filesystem caches are uncontrolled. Unix instrumentation uses native
monotonic clock and wait4 ru_maxrss; Windows uses external monotonic parent time
and native PeakWorkingSetSize. Interpreter and launcher costs are disclosed;
there is no separate aggregation of simultaneous descendants or cross-OS ranking.
All raw observations, errors, samples and nearest-rank p95 dispersion are kept.

Clean build: five runs with project output removed, provisioned dependencies,
OS-denied network. Cached build: one warmup then five unchanged-output runs.
TypeScript uses the pinned nonincremental compiler and must reproduce the exact
qualified distribution files. Python compileall checked-hash caches are build
validation only, excluded from its shipped source/wheel capsule. Artifact bytes
refer to the exact retained qualified v2 archive; runtime/installed footprints
are separate. Archive timestamp reproducibility is not claimed.

CI cost is explicitly three candidate pipeline lanes inside the same native
Actions job, rather than three differently provisioned VMs. Each lane records
provision checks, fresh build, complete catalog test and an actual upload of the
genuine complete capsule. Upload plus step handoff is measured, not fabricated
as a pure network duration; queue/shared job bootstrap is excluded and is not
attributed to a language. Source-bound capture CI is reused only while all
producer hashes match. Zero native records means no performance acceptance.

Run `node scripts/qualification/verify-measurements.mjs` to verify counts,
equivalent results, immutable sources/artifacts/cohorts and every numeric cell.
No winner, product release or architecture acceptance is inferred by this task.
