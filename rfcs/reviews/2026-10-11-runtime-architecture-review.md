# NF-102: Single-Maintainer Runtime Architecture Review — 2026-10-11

## Outcome And Review Authority

**Outcome: not-ready. The evidence-analysis pass is complete; NF-102's
Accepted-decision objective remains open. RFC-0023 stays Draft.**

This review was directed by Alexander Agafonov under the explicitly adopted
[single-maintainer policy](../../docs/single-maintainer-governance.md), after
merging [NF-101 / PR #116](https://github.com/iwizy/NexFlow/pull/116). It records
delegated technical analysis for the one assigned maintainer, not another
person's review, a fabricated signature or final human architecture acceptance.
Authorship/conflicts: sole maintainer reviewing own project materials;
**self-review, no independent assurance**. Both lenses use the identical pinned
inputs below. No independent reviewer, external dissent or acceptance vote is
invented. Separate exact-revision human acceptance is still required after all
technical blockers close.

The review is of the versioned Draft, not a claim that its historical text has
already incorporated subsequent repair and governance decisions. Corrections
below go forward into a revised proposal; the archived Draft is unchanged.

## Exact Inputs And Verification Boundary

- Reviewed RFC/evidence snapshot: `1c5a4c6806e029a20245fa8d3110c3a1a23b43d1`.
- Adopted policy: `2cd3b442d4549f0e5c1cd4c4363f9449796010df`.
- Specification: `1d1fa238ab5729a79bee9389d5c66cfd20a61256`.
- Original evaluation package: `a8301a7478587c59502dfb2e6bd548489c14ee2b`.
- Repaired candidate source: `9e13a54311735a36398eb89c4a39ff2949998998`.
- Corpus digest: `01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`.
- Catalog digest: `f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.

The [machine-readable review](2026-10-11-runtime-architecture-review.json)
indexes **74 Git-blob hashes** at the reviewed snapshot, with evidence paths for
each gate, original and repaired sources, twelve historical target records,
retained metric gaps and six owned remediation cards. Its immutable base URL
plus a relative path resolves each indexed input. Original report assembly,
prototype sources, repair sources and the current integration revision are
different domains, not interchangeable commit labels.

[Fresh prerequisite receipts](2026-10-11-runtime-review-prerequisites.json)
confirm merged #114/#115/#116 at their exact heads and merge revisions, with
32 successful PR CI jobs. Main after #116 also passed its four workflows.
These receipts establish delivery/check consistency, not target acceptance.

No candidate was newly executed, repaired, timed, signed or scanned against a
live advisory database by this review. Per-case diagnostic comparison below is
new analysis of committed raw results, not a new native experiment. Current
source/hash, corpus and historical consistency checks are reproducible offline.

## Architecture Lens

### Recognize The Repair Without Overclaiming

[PR #114](https://github.com/iwizy/NexFlow/pull/114) supplies four source-bound
[repair records](../../evaluation/repairs/README.md). Each has **352/352 frozen
library cases, 224/224 renamed cases and 14/14 supplemental cases passed**, twice
per case, plus eleven structural validate/inspect cases. All four native
implementations now cover the seven library operations. The old 224 unsupported
cases are not a current function-coverage blocker at this repaired revision.
The Rust supplemental native macOS relocation test also passed with network and
source-schema reads denied. Do not repeat these repairs based solely on old text.

These are supplemental macOS ARM64 observations, not a replacement frozen target
cohort, complete project semantic/Core Profile/extension conformance, graph/init
coverage or cross-target installed lifecycle qualification. The unchanged
historical assessor still returns `ineligible` for the old reports. This review
does **not** apply that old failure verdict to new sources: current full-gate
qualification is **not established**, so no candidate is eligible for scoring.

### Diagnostic Mapping Needs An Explicit Contract

The repair runner uses `compareLibraryResult`, which compares the expected
subset of each result, not all diagnostic fields. Comparing the saved results
with object-key ordering normalized but array order retained gives:

| Compared with TypeScript | Raw different cases | Reason |
| --- | ---: | --- |
| Python | 0 | Saved result objects agree. |
| Rust | 1 | `draft-2020-prefixitems-rejected` adds native diagnostic `falseSchema` at `/1`. |
| Go | 1 | The same case adds native diagnostic category empty at `/0`. |

All four agree on the oracle's public subset for that case: `NF-SCHEMA`, `items`,
empty `instancePath`, rejection. Additional native details are **not a proven
validation failure**. They do show that raw equality and the subset pass are
different claims. Some library schema diagnostics omit severity/message fields;
the CLI/library-to-public normalization, meaning, native-detail exposure,
ordering and redaction contract needs explicit qualification. Do not remove
the case, weaken the oracle or silently strip fields to obtain a favorable number.
This is [NF-102-01](nf-102-remediation.md#nf-102-01).

### Layout Review

| Alternative | Useful property | Constraint before selection |
| --- | --- | --- |
| A: same language/shared packages | Reuse models and diagnostics without a bridge. | Prove runtime transitive dependencies and import-time constructors cannot enter static CLI startup; coordinated release is not one compatibility domain. |
| B: same language/separate packages | Inspectable CLI closure and independent release cadence. | Specify pure API/schema pairs, skew rejection, multiple artifact/provenance/signing paths and maintenance cost. Separation alone is not isolation. |
| C: different languages | Independent implementation/deployment constraints. | Quantify duplicate semantics/toolchains or bounded versioned FFI/IPC, including error mapping and authority. The CLI must not spawn a runtime backend for validation. |

The inward dependency graphs are appropriate design constraints. No implemented
CLI/runtime layout, compatible package matrix or comparable cost evidence selects
one. There is no defensible language ranking yet. Preserve all three alternatives;
do not select by ecosystem reputation, maintenance script language or one fast exit.

## Security Lens

The archived isolation experiment has real paired controls and 21 macOS
scenarios, but binds original prototype sources and a supplemental cohort.
Repair resource/redaction fixtures and the Rust relocation test narrow specific
gaps; they do not requalify all repaired artifacts for native filesystem/network/
process/credential denial on Linux/macOS/Windows. IPC/inheritance, secret-store
brokers, races, revocation and complete resource limits remain unproven.

Supply-chain evidence is dated **2026-10-04**, not refreshed here. It records
Python's 16 advisory entries and Go's one match, with reachability/remediation
unresolved; zero TypeScript/Rust matches is not approval. Unchanged dependency
locks do not supply current artifact provenance, interpreter/compiler/native
closure or independent license conclusions. [NF-102-02](nf-102-remediation.md#nf-102-02)
must bind new evidence to the actual repaired builds before acceptance.

All twelve archived lifecycle records use original prototype revisions. Linux
image/CPU drift, supplemental macOS hardware and Windows interpreter/Unicode/
offline gaps cannot be erased. Conversely, a historical Rust failure cannot be
asserted as a new-source failure after its macOS repair test passes. The current
repaired lifecycle is **not retested** on the required target matrix. Real old
capsules may become predecessors only after their availability, identity and
compatibility are verified; previous missing-predecessor records are not proof
that no usable predecessor can exist now. Signing/notarization still requires
specific authority, not ownership of coordination.

The frozen environment contract remains unchanged. All **84 comparable metric
cells** still have no real samples. New library coverage removes the old
unsupported-workload argument for those fragments, not the missing common
cohort, installed artifact, instrumentation or measurements. No cross-OS/hardware
ranking or failed-exit performance claim is justified.

For future mechanisms, host-owned grants/catalog/fallback and pre-effect durable
receipt/post-effect gap separation are sensible requirements, not implemented
enforcement. Specify concrete pure contracts, store/recovery behavior and inert
negative/failure models in the revised proposal; this review does not authorize a
runtime, provider calls, production access or credential/signing operations.

## Eleven Mandatory Gate Dispositions

Every row remains **blocked for acceptance**, with narrowed/resolved subsets
recognized above. The JSON record binds each row to exact evidence paths.

| # | Gate | Remaining correction / owned card |
| --- | --- | --- |
| 1 | Proposal completeness | No proposed language/layout/product matrix; revise after qualification. NF-102-06. |
| 2 | Integrity/comparability | Hashes resolve; current reports/cohorts/metrics are incomplete. The two-person rule is removed, not replaced by invented scores. NF-102-01/03/05. |
| 3 | Candidate eligibility | Repaired fragment passes do not establish all current hard gates. NF-102-01/02/03/04. |
| 4 | Dependency direction | Select/prove package closure, pure APIs, startup and version pairs. NF-102-06. |
| 5 | CLI/runtime separation | Structural subset passes; full installed command/effect budgets remain unqualified. NF-102-01/04/06. |
| 6 | Security/authority | Current native denial, supply-chain closure and authority/failure models incomplete. NF-102-02/04/06. |
| 7 | Extension/provider | Selected catalog/isolation/mediation/fallback contracts and negative tests absent. NF-102-06. |
| 8 | Event/audit/state | Concrete store, retention/access/recovery/durability and failure evidence absent. NF-102-06. |
| 9 | Packaging/operations | NF-101 ownership is resolved; actual repaired lifecycle/signing/provenance is not. NF-102-02/03. |
| 10 | Conformance/compatibility | Supported pairs, public diagnostics, migration and scoped claim evidence incomplete. NF-102-01/06. |
| 11 | Rationale/governance | Policy and roles adopted; no eligible ranking, selected rationale, closed gates or separate acceptance. NF-102-06 after all blockers. |

No blocker is downgraded to an accepted condition or non-blocking follow-up.
The [six remediation cards](nf-102-remediation.md) have Alexander as owner,
dependencies, concrete acceptance evidence and authority limits. They close
current gaps; they do not reopen already completed preparation/repair work.

## Written Review Summary And Confidence

Both lenses agree on **not-ready**. High confidence: saved repair counts,
hash/source binding, diagnostic-record differences, adopted policy and seven
bounded roles. No independent dissent was received. Uncertainty: unperformed
current-target, full diagnostic/conformance, license/advisory closure and
comparable performance evidence; no confidence number substitutes for those
missing tests. No numerical scores or zero-filled scorecards are manufactured.
Original ten criteria/weights are retained in JSON for later eligible candidates.

NF-101's organizational work and scoped repair results are recognized as done.
NF-102 remains blocked for its Accepted-RFC goal, with this review pass and
remediation plan delivered. NF-103/release readiness remains separate. A new
exact revised proposal and verified blocker closure are required before the
maintainer can make a separate acceptance decision. No new PR merge, release,
tag, package, version bump or runtime implementation is authorized here.

## Reproduction

`npm run runtime-architecture-review-smoke` verifies this forward-only review,
all indexed Git bytes, source-bound conclusions, gate-to-card mapping, original
weights, prerequisite receipts and rejection controls. Run the full relevant
suite and exact-source repair verifier as well. Checks validate records and
analysis, not a human signature, native rerun or product acceptance.
