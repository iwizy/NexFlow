# Four-Candidate Report And Independent Review Packet

Status: **NF-056-17 preparation deliverable; decision not-ready**. Four actual
source-bound reports are assembled, not four approved implementations.
`assessReport` returns **ineligible** for every candidate because required hard
gates have failed. That result is preserved, not rewritten as a passing schema
check or averaged away. The decision packet remains not-ready; no candidate,
language, layout, owner, score or architecture is selected.

## Report Bundles

| Candidate | Schema-shaped report | Scope-bearing companion | Full catalog | Assessment |
| --- | --- | --- | --- | --- |
| TypeScript | [candidate.json](typescript/candidate.json) | [bundle.json](typescript/bundle.json) | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Python | [candidate.json](python/candidate.json) | [bundle.json](python/bundle.json) | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Rust | [candidate.json](rust/candidate.json) | [bundle.json](rust/bundle.json) | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Go | [candidate.json](go/candidate.json) | [bundle.json](go/bundle.json) | 128 passed / 0 tested failures / 224 not-tested | ineligible |

Each report validates against the unchanged
[candidate schema](../candidate-report.schema.json). It fixes the same
specification revision, 176-file corpus digest, evaluation package and exact
prototype revision as the published evidence. Prototype and lock references
are immutable public URLs, not branch tips or local paths. Build commands are
retained source instructions, not new builds performed by this assembly.

Each companion includes hashed Git-blob bindings for 16 archived inputs:
baseline, full catalog/inventory, source pins, report schema, architecture
proposal, initial candidate record, fidelity, isolation, dependency inventory,
SBOM, dated advisories, all three target lifecycle records and measurement gaps.
The complete 352 identities/operations are reconciled against the frozen catalog;
the 224 unsupported cases are not removed or counted as passes. Case-by-case
diagnostics, artifact manifests and original collector revisions remain in the
pinned source files rather than being replaced with summary counts.

The specification is `1d1fa238ab5729a79bee9389d5c66cfd20a61256`, the common
evaluation package is `a8301a7478587c59502dfb2e6bd548489c14ee2b`, and the
assembly input snapshot is `dfa11b50dcde79154a066c41983b708190b05643`.
These are distinct domains. The later report assembly commit does not move any
of them. Four prototype revisions remain those in
[source-pins.json](../fidelity/source-pins.json).

## Prerequisite Delivery And Stacked Publication

[prerequisites.json](prerequisites.json) records a fresh 2026-10-09 preflight of
NF-056-09/10/11/12/13/14/15/16: exact PR heads, merge revisions and all **80
successful CI checks**, with job URLs and completion times. PR #101/#103/#104/
#105/#107/#108/#109 are merged. NF-056-16 [PR #110](https://github.com/iwizy/NexFlow/pull/110)
is open with ten successful checks at exact head
`dfa11b50dcde79154a066c41983b708190b05643`; this report change is explicitly
stacked on its `nf-056-architecture-alternatives` branch, not mixed into its
commit. Fresh delivery/CI verification is not evidence that candidate hard gates,
target support, signing or human review passed.

The earlier [initial candidate records](../candidates/typescript.json) remain
historical prototype-stage snapshots, unchanged so their own checks and source
pins retain their meaning. Use the four reports above for the assembled current
evidence inventory; do not interpret the initial records' not-tested fields as
the absence of later published experiments.

## Failed, Partial And Not-Tested Are Different

The existing candidate schema deliberately has only `passed`, `failed` and
`not-tested`, not `partial`. This packet does not change that schema:

- Known failed mandatory cases or lifecycle stages map to `failed`.
- Partial results map to `not-tested` **for the full gate/target**, while the
  companion preserves the tested subset, original partial status, environment,
  scope and remaining blockers. This does not erase a scoped pass or failure.
- No global gate is promoted from a local source checkout or one supported
  subset. `providerNeutrality` and `scopeIntegrity` remain unreviewed full gates,
  not claims that provider effects occurred or runtime was implemented.

| Concern | Retained result and decision consequence |
| --- | --- |
| Specification fidelity | Failed for all four: 211 semantic fragments, eight workflow namespace and five artifact namespace cases unsupported. |
| Diagnostics | Supported subset repeated; full normalized semantic/namespace diagnostics not-tested. |
| Offline/security | Supplemental macOS scoped controls passed; security partial. Installed Rust offline validation fails on Linux/macOS; Windows OS denial not-tested. No universal sandbox or secret-store claim. |
| Dependencies/supply chain | Inventories, SBOMs and locks exist; native/runtime/compiler closure, independent license review, provenance and reproducibility incomplete. Advisory evidence is dated 2026-10-04, not refreshed. |
| Advisory matches | Python retains 16 advisory records / eight unique CVE aliases, Go one match. Unremediated, reachability not-tested. TypeScript/Rust zero matches is not security approval. |
| Distribution | Rust installed validation fails on all three targets. Windows Python exact build failed; no capsule invented. Windows Unicode installation failures remain failed, separate from supplemental ASCII-space CLI runs. All candidates retain a failed Windows target; partial Linux/macOS lifecycle is not full support. |
| Upgrade/rollback/signing | True prior evaluation artifacts and permitted signing authority unavailable; steps not-tested, macOS notarization also not-tested. |
| Measurements | 84 cells remain not-tested, zero samples and null medians. Eleven historical capsule byte observations remain non-comparable; Windows Python has no artifact. No fast failed exit is labeled validation performance. |
| Review/ownership | Two independent appointments, actual scores/reconciliation, named owner consent and support/signing commitments pending in NF-101. |

The schema permits only actual numeric observations with at least one run in
`measurements`. Therefore every report has an empty array, while its companion
and immutable measurement source retain all 21 target/metric gaps. Missing
values are **not zero-valued measurements**. Targets include observed fingerprints,
drift, actual toolchains and stage statuses; they are not mixed into a language
ranking. Existing maintenance dependency checks do not replace candidate graphs.

## Two Independent Blank Scorecards

[Reviewer A](review/reviewer-a.json) and [Reviewer B](review/reviewer-b.json)
are separate **unfilled templates**, not appointed people or completed reviews.
Each fixes the same four report and companion content hashes, the original ten
criteria and weights totaling 100, and the original `0..5` scale with
`weight * score / 5`. All scores, totals, rationale, confidence, names, dates and
signatures are null; independence is not confirmed. Null means unfilled, not a
reviewer's zero score. Missing evidence receives zero only in an actual review.

A failed hard gate makes the candidate ineligible for weighted scoring. A high
score cannot compensate for that failure. Any repaired candidate needs a new
exact source/evidence set and reevaluation, not altered historical results.

The [reconciliation form](review/reconciliation.json) is also blank. It requires
two actual independent reviews of the same pinned report set, preservation of
their initial scores and disagreements, reconciliation rationale and dissent.
Two test executions or two reviews by the same author do not constitute that
independence. A successful CI run supplies neither a reviewer nor a signature.

When reviewers are appointed, copy these templates into a separately reviewed
record, pin the **report assembly commit** in `reportSetRevision`, verify the
listed content hashes, disclose conflicts and work independently before
reconciliation. The input snapshot is not the later assembly commit. Do not
silently fill or repurpose these historical blank templates as completed review.

## Questions For Reviewers And Maintainers

1. Which separately authorized work will close the missing full semantic and
   namespace coverage and diagnostics without reducing the common oracle?
2. What repair/provisioning scope will address Rust relocation, exact Windows
   Python and Unicode delivery, and what target-native tests will close denial,
   predecessor lifecycle and signing gaps?
3. How will the dated advisory matches, unknown licenses and native/runtime
   dependency closure be reviewed? New scans or dependency changes need their
   own scope; archived results must remain visible.
4. Which exact common cohorts and instrumentation will supply the seven metrics
   for equivalent supported workloads? No comparable samples exist now.
5. Which of the three [architecture alternatives](../architecture/alternatives.md)
   can satisfy the CLI/startup, authority, credential, extension/provider and
   event/audit contracts? Those mechanisms are proposals, not runtime enforcement.
6. Who are the two independent reviewers, and which real people consent to CLI,
   validation, runtime, security/dependencies, release/CI and signing support?
   What windows, backups and incident/update authority can they actually supply?

NF-101 owns real appointments/consent; this packet cannot close it. NF-056-18
will prepare the Draft RFC and eleven-gate review mapping separately, without
automatic language selection, acceptance, implementation or release.

## Verify Or Reproduce The Assembly

Provision the pinned maintenance dependencies and the exact local Git history
separately; offline checks never download, run candidates or refresh advisories.

```sh
npm ci --ignore-scripts --offline
node scripts/runtime-candidate-report-bundles.mjs --verify
npm run runtime-candidate-report-bundles-smoke
npm run runtime-evaluation-report -- evaluation/reports/typescript/candidate.json
```

The final command intentionally exits **1** and prints `ineligible`; repeat for
the other three report paths for the same honest assessment. Schema validity is
checked separately. The focused smoke verifies all four assessor outputs and
their expected nonzero CLI exits, every pinned input/target/metric, original
weights and blank forms, plus **36 rejection controls**. Source-derived data
promotion, fake measurements, removed failures, changed revisions and invented
reviewers/signatures are rejected. CI runs these maintenance consistency checks,
not native experiments, independent review or architecture enforcement.

An initial oversized serialized assembly was truncated during preparation; the
exact-source verifier rejected a damaged reference. Records were regenerated
separately and verified before publication. Candidate source/evidence was not
changed to make that check pass. Frozen specification/corpus/catalog/oracle,
candidate sources/locks and all prior records remain unchanged. No repair,
runtime/provider/credential effects, product publication or version change.
