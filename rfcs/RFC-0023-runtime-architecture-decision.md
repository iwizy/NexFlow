# RFC-0023: Runtime Architecture Decision

## Status

Draft

Decision outcome: **not-ready**. Task: NF-056-18, 2026-10-09. No language,
layout, implementation, supported product target or owner is selected. This is
a versioned discussion packet, not a completed independent review or Accepted
architecture. All eleven mandatory acceptance gates remain blocked.

The [source-bound review bundle](reviews/runtime-architecture-decision-draft.json)
binds this RFC's bytes to an immutable evidence index, candidate assessments,
exact target contract, eleven-gate mapping and pending human decisions. Its RFC
revision field is deliberately null: a real reviewer must pin the published
assembly commit, verify the RFC hash and sign that exact revision separately.
Successful consistency checks do not sign or accept this RFC.

## Summary

Prepare a decision about the validation CLI, pure validation libraries and a
future effect-owning runtime host, keeping the specification independent of any
implementation language. Four standalone disposable candidates exist, but all
are ineligible under the unchanged assessor. Their failed and missing evidence
does not support a preferred language or package layout. Preserve all three
alternatives and the work needed to make a later choice defensible.

This RFC changes no manifest/schema, diagnostic contract, package version,
runtime behavior or release. It neither adopts historical JavaScript tooling
as the runtime nor promotes TypeScript, Python, Rust or Go from experimental
validation-only prototypes to supported implementations.

## Motivation

The project needs an inspectable choice rather than an implicit commitment
created by a prototype, a repository tag or shared tooling. Language, package
topology, command startup, authority and distribution are distinct decisions.
The [mandatory review framework](reviews/runtime-architecture-decision-review.md)
requires complete evidence, two independent reviews and actual maintainer
consent before acceptance. NF-066/NF-067 established evaluation/review machinery;
they did not accept the current architecture. Completing NF-056-01 through
NF-056-18 prepares inputs, not that decision.

## Proposal

### Decision Fields And Scope

`selectedCandidate = null`, `selectedLayout = null`, product support targets
empty, owner assignments pending, runtime implementation authorization false.
These are explicit acceptance blockers, not placeholders to fill by inference.
There is no ranking, weighted total, accepted exception or recorded dissent
from a review that has not occurred.

In scope for later review: static CLI dispatch and bounded input handling, pure
validation/diagnostics APIs, host-owned authority, mediated provider/extension
ports, event/audit persistence, independently versioned packages, target
artifacts and scoped conformance. Desktop/cloud application UX, hosting,
commercial service operation, production rollout, live integrations and a new
manifest dialect are outside this preparation.

### Evidence Index And Revision Domains

All inputs are pinned at assembly input snapshot
`cef48f83006eb7dd245268a717b27835b4512cd9`; the review bundle lists each Git-blob
SHA-256 and immutable URL. That snapshot is not a candidate source revision or
the later RFC assembly commit. The specification is
`1d1fa238ab5729a79bee9389d5c66cfd20a61256`, evaluation package
`a8301a7478587c59502dfb2e6bd548489c14ee2b`, corpus digest
`01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`, and full
352-case catalog digest
`f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.
No specification, corpus, oracle, candidate source/lock or prior result changes.

| Input | Owning evidence and limits |
| --- | --- |
| Common inputs and target freeze | [Baseline](../evaluation/baseline.json), [catalog](../evaluation/library-cases.json), [environment contract](../evaluation/environment-contract.json). Target access is not lifecycle support or comparable measurements. |
| Four actual reports | [TypeScript](../evaluation/reports/typescript/candidate.json), [Python](../evaluation/reports/python/candidate.json), [Rust](../evaluation/reports/rust/candidate.json), [Go](../evaluation/reports/go/candidate.json), with scope-bearing companions in the [report index](../evaluation/reports/README.md). Schema-valid; assessor outcome ineligible for each. |
| Alternatives and boundary sketches | [Architecture proposal](../evaluation/architecture/alternatives.md) and its [record](../evaluation/architecture/alternatives.json). Three unselected layouts; design sketches are not implemented enforcement. |
| Candidate experiments | Immutable fidelity/isolation/SBOM/advisory/lifecycle/measurement sources are bound by each companion, including original experiment and collector revisions. Integration heads do not replace those pins. |
| Independent review materials | [Blank A](../evaluation/reports/review/reviewer-a.json), [blank B](../evaluation/reports/review/reviewer-b.json), [blank reconciliation](../evaluation/reports/review/reconciliation.json). Identical report hashes/original weights; no real scores, appointments or consent. |
| Current prerequisite delivery | [Fresh receipt](reviews/runtime-architecture-prerequisites.json): NF-056-16 / PR #110 exact dfa11b50dcde79154a066c41983b708190b05643 and NF-056-17 / PR #111 exact cef48f83006eb7dd245268a717b27835b4512cd9, ten successful CI checks each. Both open at preflight. |

The decision is explicitly stacked above NF-056-17, which is stacked above
NF-056-16. Each task has its own commit and PR. This publishing topology is not
an architecture alternative or permission to merge. No merge occurs before
actual NF-101 completion and the separately authorized final stage.

### Candidate Eligibility And Actual Gaps

| Candidate | Prototype revision | Full catalog | Assessor |
| --- | --- | --- | --- |
| TypeScript | `19ff4889542fe486d95eb2ae868560f5aa966df2` | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Python | `76141dfbeae265cb636d99a6164b097ce5d3019a` | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Rust | `4fdf0cc8e69e050600d0a5d8f7f1f42987f68203` | 128 passed / 0 tested failures / 224 not-tested | ineligible |
| Go | `737396b6488a9f10b179061366b9f1d02591fb9f` | 128 passed / 0 tested failures / 224 not-tested | ineligible |

All four fail specification fidelity: 211 semantic fragments, eight workflow
namespace and five artifact namespace cases are unsupported. Full normalized
diagnostics remain not-tested. Agreement on unsupported work is not a pass.
The schema lacks `partial`; companions preserve scoped partial results while
full report gates remain not-tested, and known failures remain failed.

Isolation is supplemental macOS evidence, not a universal sandbox. Dependency
evidence is dated 2026-10-04, not refreshed: Python has 16 advisory records /
eight unique CVE aliases, Go one match; reachability and remediation remain
unresolved. Zero TypeScript/Rust matches is not security approval. Unknown
licenses, native/runtime closure and reproducible provenance remain open.

All 84 comparable metric cells are not-tested with no samples and null medians.
Eleven historical capsule byte observations are not comparable performance or
installed-runtime footprint metrics. There is no language ranking from a fast
failed exit, a single CLI invocation or unequal semantic coverage.

### Exact Target Matrix: Evaluation, Not Product Support

The [contract](../evaluation/environment-contract.json) fixes complete OS,
image, kernel/libc, native architecture, CPU/count and memory fingerprints; the
bundle retains those exact objects and all twelve candidate/target observed
fingerprints and lifecycle stages. Runner labels alone do not reproduce them.

| Evaluation target | Frozen native fingerprint | Retained evidence and blockers |
| --- | --- | --- |
| Linux AMD64 | ubuntu-24.04; Ubuntu 24.04.5, kernel 6.17.0-1022-azure, glibc2.39; image20260920.314.1; AMD EPYC9V45, 4CPU, 16766414848 bytes | Later image20260927.320.1 and hardware drift; TS/Python/Go installed CLI subset passed, Rust validation/offline failed. No all-four matching benchmark cohort. |
| macOS ARM64 | macos-15; 15.7.9/build24G830/kernel24.6.0; image20260907.0337.1; Apple M1 Virtual, 3CPU, 7516192768 bytes | Supplemental27.0.1/build26A434/M4 Pro, not frozen cohort. TS/Python/Go subset passed; Rust validation/offline failed. Ad-hoc inspection is not Developer ID/notarization authority. |
| Windows AMD64 | windows-2025; Server2025/build26100/kernel10.0.26100; image20260925.250.1; AMD EPYC7763, 4CPU, 17174360064 bytes | TS/Rust fingerprint matched; Python/Go CPU drift. Python exact CPython3.12.14 build failed, no capsule; Unicode install failed for TS/Rust/Go. Supplemental ASCII CLI passed TS/Go, Rust validation failed. OS-denied offline use not-tested. |

Upgrade/rollback require real earlier evaluation artifacts, absent on all three
targets. Signing/notarization, applicable verification/revocation and full
native dependency closure remain not-tested. Cross-build, emulation, source
checkout execution and fixture CI do not supply native lifecycle passes.
Proposed **product support remains empty**, not silently reduced to one easy
target. Human approval must choose a reviewed common replacement cohort or
provide the frozen target, then rerun every affected candidate equivalently.

### Component, Package, Startup And Authority Boundaries

Conceptual imports, independent of packaging and selected language:

```text
CLI -> bounded input adapter -> pure validation <- future runtime host
CLI ------------------------> pure validation
future runtime host -> authority boundary -> mediated effect ports
```

Specification models and pure checks never import the CLI, runtime, provider
SDKs, stores, credential clients or executable extensions. Proposed pure
interfaces receive immutable byte snapshots, explicit schema/ref maps, policy
limits and namespace indices; they return ordered/redacted findings or explicit
unsupported coverage. No ambient filesystem/environment/clock/network handles.
Parser/dependency review and denied-effect tests must prove this, not signatures
or process topology alone. Concrete names/APIs remain proposals.

Static command parsing precedes runtime imports/constructors. validate/inspect/
graph perform bounded reads and declared output; init writes only an explicit
destination. The four candidates measured only validate/inspect, not graph/init.
Unknown execution commands reject before initialization. Future runtime startup
is separate: fresh host policy/preflight -> scoped grant -> mediated effects ->
redacted receipt/gap. Static success is never authorization to execute.

Host-owned permission/capability/autonomy/approval/network/context/memory/override
decisions intersect; an adapter or transport cannot broaden them. Credentials
use explicit operation-scoped resolver leases, never ambient profiles or public
values. Extension declaration/discovery/resolution/verification/loading/
activation/invocation remain separate; deployment-owned immutable catalog and
per-operation authority are required. Provider selection/fallback stays with
the host; retries/redirects/SDK auxiliary effects require explicit budgets and
authorization. MCP/A2A metadata imports no local identity or authority.

Event declarations, runtime events, audit records, projections and evidence are
distinct. Classify/redact before buffering/persistence/export; required durable
pre-effect receipt failure blocks the effect. Post-effect audit loss is a gap
and unknown outcome requiring reconciliation, not retroactive success or blind
replay. Retention/deletion/access/integrity/order/duplicate/gap/recovery/durability
ownership and concrete store behavior remain blockers, not an exactly-once
promise. These are the [NF-056-16 mechanisms](../evaluation/architecture/alternatives.md#proposed-runtime-mechanisms-mapped-to-existing-contracts), not runtime implementation.

## Alternatives Considered

| Layout | Reason to consider | Cost / acceptance evidence still missing |
| --- | --- | --- |
| A: same language/shared packages | Reuse models, schema/semantics and diagnostics without a bridge. | Runtime transitive dependencies or import-time initialization can contaminate CLI closure; prove pure entry and dispatch-before-runtime imports. Coordinated releases still need separate version meanings. |
| B: same language/separate packages | Independently inspectable CLI closure and release cadence with shared pure APIs. | Compatibility windows, version skew, multiple artifact/provenance/signing paths and actual support capacity; package separation alone is not isolation. |
| C: different CLI/runtime languages | Independent deployment closures and implementation constraints. | Duplicate semantics/toolchains/maintainer skills or separately reviewed bounded FFI/IPC; full parity/diagnostics and cross-language cost unproven. No runtime backend may supply validation CLI checks. |

All three complete dependency graphs and tradeoffs remain in the pinned
architecture proposal. None was implemented or benchmarked as a runtime layout.
No candidate or alternative is rejected by reputation, scored from missing
evidence, or selected despite failed hard gates.

## Compatibility Impact

No existing authored shape, `specVersion: "0.1"`, schema/profile/claim version,
CLI output, package version or stored data changes in this Draft. No migration
or product release is executed. Proposed independent domains: manifest dialect,
schema snapshot, pure validation API, CLI artifact, diagnostic/output contract,
runtime host, adapter/extension artifact, cross-boundary protocol, stored state.
The [versioning policy](../docs/versioning.md) remains authoritative.

Later selection must specify exact supported schema/library/CLI/runtime/
adapter/protocol combinations and reject unsupported pairs offline, without
fetch/fallback. Before an accepted breaking change: classify semantics even
when fields are unchanged, publish migration/version mapping, preserve old/new
fixtures and test diagnostics, package split/join, catalog updates and state
rollback. No persistent runtime store exists to migrate now; this is an
obligation for a future approved implementation, not completed migration proof.

Conformance remains independently scoped NF-SCHEMA, NF-SEMANTIC, NF-CLI,
NF-RUNTIME and extension claims. Proposed spec/fixture owners maintain frozen
positive/negative inputs; validation owners semantic/diagnostic/limit tests;
CLI owners installed dispatch/effect/output tests; future runtime/storage and
adapter owners policy/effect/audit/contract tests; release/security owners target
lifecycle/deny/dependency tests. Every claim pins source/artifact/spec/fixture,
target, supported scope and real results. No implementation is certified here.

## Security and Safety Impact

Untrusted manifests/files, parser/dependencies, extensions/providers/transports,
remote responses, credentials and audit data cross separate trust boundaries.
Malformed/ambiguous discovery, duplicate keys, root escape, unsafe local refs,
unbounded YAML/schema/diagnostics, stale grants, missing approvals, secret leaks,
unapproved fallback, uncertain effects and audit loss must fail closed at their
own boundary. Resource limits, revocation/TOCTOU, IPC/keychain/inheritance/races,
native denial and redaction before every queue/store/export need tests.

Residual risks remain explicit: unsupported semantics/diagnostics, disclosed
dated advisory matches, unknown licenses/runtime closure, Rust relocation,
Windows provisioning/Unicode paths, mismatched cohorts, missing previous
artifacts/signing and no independent review or accepted support commitments.
Dependency installation/update is outside validation command authority; any
repair/new scan/provisioning/signing needs separate scope. No real secrets,
foreign keys, paid infrastructure or production data/actions are used here.

## Mandatory Review Gate Mapping

All rows are **blocked** acceptance gates, not negative judgments about the
preparation's completeness. Full source IDs/hashes/URLs are in the bundle.

| # / gate | Available evidence | Blocker before acceptance |
| --- | --- | --- |
| 1 Proposal Completeness | This Draft, three alternatives, component/version/target proposals. | Language/layout, exact product targets and named ownership deliberately unselected. |
| 2 Evidence Integrity And Comparability | Frozen corpus/catalog/pins, four hashed bundles, blank scorecards. | Full equivalent semantic scope, comparable metrics and two independent scores/reconciliation absent. |
| 3 Candidate Eligibility | Four unchanged schema/assessor results and all nine hard-gate mappings. | All four ineligible; failed fidelity/target stages and missing full gates cannot be waived. |
| 4 Architecture And Dependency Direction | Three inward graphs, pure interfaces and startup sketches. | Selected package/import closure, concrete boundary/API/version tests absent. |
| 5 CLI And Runtime Separation | Responsibility contract and bounded validate/inspect experiments. | Full installed static-command effect budgets, denied credentials/process/extensions across targets unproven. |
| 6 Security And Authority Boundaries | Security/credential contracts, partial isolation, SBOM/advisories. | Full native threat/authority/redaction/revocation/resource evidence and supply-chain closure missing. |
| 7 Extension And Provider Boundaries | Loading/provider/MCP-A2A contracts and host-owned mechanism proposals. | Selected catalog/isolation/mediation/fallback mechanisms and negative invocation tests absent. |
| 8 Event, Audit, And State Boundaries | Storage contract and pre-receipt/post-gap sketch. | Concrete stores, ownership, retention/access/recovery/durability and crash/export tests unselected. |
| 9 Packaging, Distribution, And Operations | Twelve actual target records, inventories/checksums and frozen matrix. | Native failures/drift, predecessor/upgrade/rollback/signing, closure and support consent unresolved. |
| 10 Conformance, Compatibility, And Migration | Separate claims, version domains and proposed fixture/compatibility plan. | Supported combination matrix, owner acceptance and migration/rollback/conformance evidence incomplete. |
| 11 Rationale, Governance, And Ownership | Alternatives, risks, pending role proposals and governance. | No defensible winner, completed independent review/reconciliation, dissent record or named maintainer sign-off. |

Every mandatory gate must pass at one reviewed RFC revision, all blockers close,
two independent people review, and maintainers accept obligations through normal
governance. Do not downgrade a blocker to a condition/follow-up to accept early.
Merge/publication, preparatory CI and historical NF-066/067 are not acceptance.

## Open Questions

Human decisions, separately from completed preparation:

- `reviewers`: appoint two independent people, disclose conflicts and availability;
  obtain separate reviews of one exact RFC/report set before reconciliation.
- `owners`: obtain named CLI/validation/runtime/security-dependency/release-CI
  owner and backup consent, support windows, update/incident responsibilities.
- `signing`: identify permitted distribution/signing owners, certificate custody,
  notarization/revocation/recovery capability; no borrowed credentials.
- `targets`: confirm frozen access or review one new common native cohort per
  target and exact proposed product support, without changing history.
- `remediation`: authorize separately bounded semantic/diagnostic, Rust relocation,
  Windows interpreter/lock/Unicode, dependency/license and isolation repairs.
- `architecture`: after eligibility/comparable evidence, review language/layout,
  concrete API/store/authority mechanisms and compatibility/migration obligations.
- `acceptance`: preserve exact reviewed revision, gate closure, actual scores,
  dissent and sign-offs before any Accepted transition or runtime scope.

NF-101 resolves real appointments/consent, NF-102 actual independent decision
review, NF-103 release readiness. None is closed by these blank materials.
The parent NF-056 remains blocked/not-ready despite all 18 preparation outputs.

## Verification And Handoff

Run `npm run runtime-decision-bundle-smoke` and the full relevant repository
checks. The new check reconciles pinned inputs, report assessor outcomes, exact
target observations, eleven gates and pending decisions; rejection controls
prevent fabricated review, support, selection or implementation authorization.
It does not execute candidates, refresh vulnerabilities, benchmark, contact a
provider or grant signing/release authority. Copy blank forms into a new human
review record, pin the published RFC/report assembly revisions and verify hashes;
do not repurpose historical blank templates as completed reviews.
