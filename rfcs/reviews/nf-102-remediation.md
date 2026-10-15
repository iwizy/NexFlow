# NF-102: Owned Architecture Acceptance Blockers

Status: follow-up tracker from the [2026-10-11 review](2026-10-11-runtime-architecture-review.md). [NF-102 is closed as a completed review](2026-10-11-runtime-review-closure.md) with outcome not-ready by explicit maintainer scope amendment. NF-102-01's declared scope is complete; the other five cards remain open architecture-acceptance blockers. RFC-0023 remains Draft. Every card is owned by Alexander Agafonov under the bounded NF-101 roles; no new SLA, signing authority or paid resource is promised. Historical review dispositions remain unchanged.

These cards address gaps after completed preparation and scoped repairs. Do not repeat the old 224-case implementation or infer that a historical failure still occurs at the repaired revision. Each future change needs checks, neutral metadata, its own commit/push/PR and actual CI. Keep mandatory blockers before acceptance; do not relabel them optional.

## NF-102-01

Requalify repaired validation and public diagnostics.

Owner: Alexander Agafonov. Status: declared-scope-complete, see [closure](2026-10-13-nf-102-01-closure.md). Mandatory gates: 2, 3, 5, 10 are not all closed by this bounded task. Depends on: none.

Acceptance evidence:

- Bind new four-candidate reports to exact repaired sources, locks, specification, full catalog and actual results; keep historical reports unchanged.
- Define and verify the library-to-public diagnostic mapping, category/code/path/severity/meaning, ordering, repeatability, redaction and native-detail exposure; do not weaken the oracle.
- Cover the complete declared CLI/project scope, including explicit unsupported profiles/commands; the 352 fragment passes are not full project semantic conformance.

Authority limit: Evidence/report preparation only; candidate code or oracle changes require separately approved repair scope.

## NF-102-02

Close current supply-chain and provenance evidence.

Owner: Alexander Agafonov. Status: evidence-collected-acceptance-blocked, see [2026-10-15 evidence](../../evaluation/supply-chain/2026-10-15/README.md). Mandatory gates: 3, 6, 9. Depends on: none.

Current-source inventories, four SBOMs, fresh advisory/first-pass reachability and
license review, external file/native receipts and two clean offline builds are
recorded. Complete compiler/interpreter/native/license provenance, unresolved
build/provisioning advisory disposition and Rust byte reproducibility remain
unqualified. Public metadata/evidence authority was used; no dependencies,
candidate locks, frozen inputs or architecture gates were changed or waived.

Acceptance evidence:

- Inventory current built artifacts and complete compiler/interpreter/native/license closure, SBOM and provenance with exact hashes.
- Refresh dated vulnerability evidence for all four actual graphs and review reachability, unresolved matches and license uncertainties; root npm audit is not a substitute.
- Document reproducibility and offline provisioning; any necessary dependency repair remains separately authorized with new locks/evidence.

Authority limit: Public metadata scans and evidence collection only; no automatic fixes, credentials or new infrastructure.

## NF-102-03

Requalify native target cohorts and artifact lifecycle.

Owner: Alexander Agafonov. Status: planned-blocker. Mandatory gates: 2, 3, 9. Depends on: NF-102-01, NF-102-02.

Acceptance evidence:

- Approve one exact common native cohort per Linux AMD64, macOS ARM64 and Windows AMD64, or reacquire the frozen contract; no silent drift.
- Build revision-versioned repaired artifacts for all four, verify Windows interpreter/Unicode paths and Rust relocation on each target; old failures are retained, not presumed present or fixed at new revisions.
- Verify install, validate/inspect, OS-denied offline use, upgrade, rollback and scoped uninstall using a verified real predecessor artifact where available.
- Obtain specific permitted signing/notarization and verification authority; missing keys/target access remain blockers, not ownership passes.

Authority limit: Existing approved native environments only; contract changes, repair, signing, credentials and paid resources need their own authority.

## NF-102-04

Requalify denied effects and security boundaries.

Owner: Alexander Agafonov. Status: planned-blocker. Mandatory gates: 3, 5, 6. Depends on: NF-102-01.

Acceptance evidence:

- Run paired positive/negative OS controls on current exact artifacts for every target, not only archived macOS sources.
- Verify filesystem/network/process/credential/extension denial, redaction before queues/output, resource budgets and relevant inheritance/IPC/race/revocation assumptions.
- Preserve residual risks and unsupported controls; a virtual environment, static source audit or CI fixture is not a sandbox.

Authority limit: Synthetic data in scoped isolated environments; no real secrets, production actions or borrowed credentials.

## NF-102-05

Collect equivalent cross-target measurements.

Owner: Alexander Agafonov. Status: planned-blocker. Mandatory gates: 2, 3. Depends on: NF-102-01, NF-102-02, NF-102-03, NF-102-04.

Acceptance evidence:

- Collect all 84 target/candidate/metric cells on reviewed common cohorts and equivalent successful workloads, preserving the frozen run/cache/warmup method.
- Keep raw run IDs, tool/instrument versions, all samples/errors and dispersion; rejection/error runs are separate from successful validation.
- Do not mix OS/hardware classes, historical artifact sizes or unequal semantic coverage into a language ranking.

Authority limit: Existing permitted environments; no unapproved cohort change, paid infrastructure or product release.

## NF-102-06

Revise concrete architecture proposal and repeat decision review.

Owner: Alexander Agafonov. Status: planned-blocker. Mandatory gates: 1, 4, 5, 6, 7, 8, 10, 11. Depends on: NF-102-01, NF-102-02, NF-102-03, NF-102-04, NF-102-05.

Acceptance evidence:

- Propose a defensible language/layout only after candidate qualification; compare all three layouts and record one evidence-linked scorecard per eligible candidate with original weights.
- Specify package/import/startup/pure API/version ownership, exact target support, compatibility/migration/conformance and concrete credential/provider/extension/audit/state failure mechanisms.
- Verify proposed boundaries with inert fakes/contract models and failure/redaction/recovery tests without implementing a production runtime.
- Review one immutable revised RFC/evidence set through both single-maintainer lenses, close all eleven gates and obtain a separate explicit maintainer decision; no automatic acceptance.

Authority limit: Proposal and validation-only contract evidence; runtime implementation, publication and final architecture acceptance are separate.
