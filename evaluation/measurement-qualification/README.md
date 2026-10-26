# Comparable Eligible Candidate Measurements

NF-102-05 uses actual native Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows
Server 2025 AMD64 cohorts, with one shared host for both eligible candidates on
each target. TypeScript/Python must first pass the published lifecycle and
security evidence. Current Rust/Go candidates remain rejected after actual
Windows failures. This explicitly amended evaluation preserves all 84 cells:
42 eligible cells require measurements and 42 rejected cells carry no successful
value or score. The original all-four-success criterion remains unsatisfied.

The final [summary](summary.json) verifies six complete native records and all
42 eligible cells. [Approved captures and job receipts](approved-captures.json)
bind macOS producer `83eaee46`, Windows `efbc1863` and Linux `a1d7ec4c` to their
actual successful jobs. The old macOS-containing workflow failed overall on
other targets; only its independently successful macOS job is approved here.
No partial/cancelled observation is pooled into a completed cohort.

Qualification-to-measurement drift is explicit in that allowlist: Linux/Windows
security hosts used EPYC 9V74 while measurements used EPYC 7763; Windows also
reports a small physical-memory difference from its lifecycle host. These are
separate declared cohorts, not claimed exact fingerprint matches. Each measured
TypeScript/Python pair shares its own actual host/image/CPU and unchanged inputs;
historical timings and hardware are never substituted or pooled.

The [method amendment](../../scripts/qualification/measurement-method.json)
preserves the frozen complete 352-case catalog, 11 CLI scenarios, repetitions,
warmups, individual deadlines and cache disclosures. Only the outer job window
is extended to 120 minutes for macOS. The explicit Windows-only
[sizing addendum](../../scripts/qualification/windows-orchestration.json) extends
its outer job window to 240 minutes: observed partial batches forecast more
than 128 minutes for the complete API matrix alone. That is capacity planning,
not an accepted performance number or a change to a measured workload/limit.
The [Linux sizing addendum](../../scripts/qualification/linux-orchestration.json)
also permits 240 minutes after the original job reached 89 of 90 library
samples per candidate before its 120-minute cancellation. The continuation
repeats the complete Linux cohort on one new native host; it never appends a
sample from another VM to the retained partial run. Individual limits and the
complete original matrix remain unchanged.
A library sample calls the unchanged native API with
one warmup batch then a measured batch of 1/10/100 full corpus passes. The caller
receives no oracle. For each sample, the outer consumer compares all 352 returned
last-pass result objects with the frozen oracle and verifies the aggregate
consumed valid/diagnostic-count checksum across every completed pass. The driver
also requires matching warmup/measured checksums and last-pass results. Full
intermediate-pass result objects are not exported; their call counts and consumed
checksum are retained. This does not claim an independent full-field oracle
comparison for each intermediate call.
Startup/schema initialization is outside that API clock. The combined
warmup+sample process has a 240s outer deadline; each batch retains its 120s limit.
The measurement-only Linux launcher derives from the unchanged NF-102-04 source
by one verified literal replacement: CPU 120/121 becomes 240/241 for the combined
two-batch process. Individual batch clocks still enforce 120s; no candidate,
filesystem/network/process policy or original security qualification changes.

Cold start and native peak RSS/working-set use fresh CLI processes, ten samples
for each unchanged scenario. Successful scenarios and expected rejections are
separate. OS filesystem caches are uncontrolled. Unix instrumentation uses native
monotonic clock and wait4 ru_maxrss; Windows uses external monotonic parent time
and native PeakWorkingSetSize. Interpreter and launcher costs are disclosed;
there is no separate aggregation of simultaneous descendants or cross-OS ranking.
All raw observations, errors, samples and nearest-rank p95 dispersion are kept.
Large raw records are stored losslessly as `.json.gz`; the import receipt binds
both original JSON and compressed hashes and verifies byte-for-byte decompression.
No sample, failed result or per-case output is removed to shrink the evidence.
The Unix process-group deadline/output watchdog surrounds the trusted wait4
instrument. Its sampled RSS is the instrument's RSS, not a candidate memory
limit or metric. Candidate peaks come only from wait4; the separate NF-102-04
memory-denial tests retain their own direct-entry watchdog evidence. Windows
uses the native process Job limit during measurement. These enforcement details
are disclosed per target and are the same for both candidates on that target.

macOS uses the complete pair of observations from producer
`83eaee46fc91da51a55f493290a44d2b3f6adead`. Windows continues from producer
`efbc18638f98592beb92cced213084d6973138a9` after a locally reproduced delayed-CRLF framing defect in the
measurement JSONL client. Its dedicated client uses `crlfDelay: Infinity`;
the already-qualified lifecycle/security clients and OS policies are unchanged.
The fixed method, native API drivers, candidate archives and full workloads do
not change. Each target pair stays in one actual native host/source cohort;
partial runs are never pooled. The final continuation captures Linux only with
the separate sizing addendum; it changes no evaluated API, source/lock or workload.
`approved-captures.json` pins the exact producer,
source inventory, run and successful job for each completed target. Consumers
verify those immutable Git blobs rather than pretending old observations were
executed by the latest collector. No comparison across OS/hardware is implied.

Clean build: five runs with project output removed, provisioned dependencies,
OS-denied network. Cached build: one warmup then five unchanged-output runs.
One explicitly separate recipe preflight catches build/packaging defects before
long timing batches; it is not a timed sample or a replacement for any repetition.
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
