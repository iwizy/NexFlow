# Architecture Alternatives And Ownership Proposal

Status: **proposal; not-ready for decision**. Task: NF-056-16, recorded
2026-10-09. No language, layout, package name, owner or support promise is
accepted here. This is input to the later candidate report and Draft decision
bundle, not the Runtime Architecture Decision RFC or its acceptance record.

The [machine-readable proposal](alternatives.json) binds this document to exact
inputs and retained failures. Its check verifies stored facts and dependency
direction, not runtime enforcement or reviewer consent.

## Evidence Baseline

The source snapshot is
`58eabb804be45f3ef4cc3dde677a3a4bb4fd90a1`. The frozen specification is
`1d1fa238ab5729a79bee9389d5c66cfd20a61256`; the common evaluation package is
`a8301a7478587c59502dfb2e6bd548489c14ee2b`. The 176-file corpus digest is
`01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`;
the 352-case catalog digest is
`f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.
These domains are distinct: updating this proposal does not move candidate
sources, the specification, locks, catalog or oracle.

Prerequisite delivery was rechecked on 2026-10-09:

| Deliverable | Published head | Merge into main | CI |
| --- | --- | --- | --- |
| [NF-056-09, PR #101](https://github.com/iwizy/NexFlow/pull/101) | `1c9aa13c46175255d989edda5f6e677d1a723952` | `a357309c7737d94b13330513da3deb20eef2b8f8` | 7 successful checks |
| [NF-056-10, PR #103](https://github.com/iwizy/NexFlow/pull/103) | `72db0be4b32ac0069979abeeedc8870b4d987e3d` | `d344bb6db7008f5d332a8be453b0dd849259e3de` | 9 successful checks |
| [NF-056-11, PR #104](https://github.com/iwizy/NexFlow/pull/104) | `5290b74aa8af3f0d8051ae18c419c49c47df7c08` | `e91b5e13fb829aeae4c23a4fcc9a762f1eec5f6b` | 9 successful checks |

The proposal record preserves the exact CI job URLs. These integration heads
are not the original experiment or collector revisions; the underlying
[fidelity](../fidelity/README.md), [isolation](../isolation/README.md) and
[supply-chain](../supply-chain/README.md) records retain those pins separately.
Successful publication/CI proves prerequisite delivery, not hard-gate closure.

| Candidate | Exact prototype revision |
| --- | --- |
| TypeScript | `19ff4889542fe486d95eb2ae868560f5aa966df2` |
| Python | `76141dfbeae265cb636d99a6164b097ce5d3019a` |
| Rust | `4fdf0cc8e69e050600d0a5d8f7f1f42987f68203` |
| Go | `737396b6488a9f10b179061366b9f1d02591fb9f` |

All four have 128 passed, zero tested failures and **224 not-tested** library
cases (211 semantic fragments and 13 namespace cases). Specification fidelity
is **failed** and full deterministic diagnostics are **not-tested**. Agreement
on unsupported work is not validation success. No weighted score is assigned.

The isolation evidence is bounded to a supplemental native macOS cohort, not
all agreed targets or complete credential/IPC/race/resource controls. Scoped
offline operation passed there; security remains partial. Supply-chain evidence
is dated **2026-10-04**, not a fresh scan on this proposal's date. Its Python and
Go advisory matches remain unremediated, reachability not-tested, unknown
licenses/native closure/provenance unresolved. No matches for TypeScript/Rust
does not mean safe. No candidate locks or code are repaired here.

Additional published [lifecycle](../lifecycle/linux/README.md),
[macOS](../lifecycle/macos/README.md), [Windows](../lifecycle/windows/README.md)
and [measurement](../measurements/README.md) evidence constrains delivery claims:
Rust installed execution has a schema relocation defect; the exact Windows
Python capsule could not be built; true predecessor artifacts and permitted
signing are absent; cohort drift and Windows offline denial gaps remain.
The 84 measurement cells have no comparable samples. These are retained
limitations, not new prerequisite requirements for preparing alternatives.

## Three Mandatory Layouts

Arrows below mean **imports/depends on**, not authority or runtime startup.
Boxes are conceptual modules, not chosen product/package names. None of these
layouts was implemented or benchmarked by the validation-only prototypes.

### A. Same Language, Shared Packages

```text
CLI -> input boundary -> pure validation <- runtime host
CLI ------------------> pure validation
runtime host -> authority boundary -> effect ports
```

One language and coordinated package group could reuse data models, schema
selection, diagnostics and static semantics without serialization bridges.
This reduces duplicate implementation work *if* the shared layer remains pure.
It also couples dependency resolution and release review: a transitive runtime
SDK, initializer or optional extra entering the CLI closure would violate the
boundary even when no runtime command is selected. Sharing a repository,
package or binary proves neither isolation nor small deployment size.

Proposal: publish a distinct validation-only entry surface; enforce an import
allowlist and test the installed CLI with runtime configuration, secret
canaries and denied effects. If one binary is considered, dispatch must happen
before runtime imports/constructors; a linker, static initializer or import-time
side effect cannot be dismissed as harmless packaging. Otherwise reject that
binary arrangement. Coordinated releases may pin exact sibling versions, but
each version domain still has a separate compatibility meaning.

Evidence gap: current structural/library reuse is partial; there is no shared
CLI/runtime artifact, import-closure test or startup proof. Language ecosystem
convenience is a hypothesis, not a passing score.

### B. Same Language, Separate CLI And Runtime Packages

```text
CLI artifact -> input boundary -> pure validation package
CLI artifact ------------------> pure validation package
runtime artifact --------------> pure validation package
runtime artifact -> authority boundary -> effect ports
```

The CLI can have its own install closure, dependencies, release cadence and
validation support policy while runtime packages depend inward on the same
pure library API. This makes absence of runtime packages inspectable and
permits a CLI security update without automatically releasing a future runtime.
It costs a reviewed API, compatibility ranges, multiple provenance/signing
records, and skew tests. A separate package does not by itself deny network,
ambient credentials or unsafe parsing.

Proposal: CLI and runtime never import each other; neither is a dependency of
pure validation. Pin approved library/schema pairs in artifact manifests;
reject unsupported pairings rather than fetch a schema or silently fall back.
Test supported old/new pairs independently of manifest dialect changes.
Separate release artifacts must each carry inventories, checksums, migration
and rollback evidence. The artifact distribution path remains undecided.

Evidence gap: no complete stable library API, supported compatibility window,
independent release artifacts or maintenance consent exists. This is a viable
alternative to review, not a recommended winner.

### C. Different CLI And Runtime Languages

```text
CLI language     -> input boundary -> CLI pure validation
runtime language -> runtime validation -> same pinned specification/fixtures
runtime language -> authority boundary -> effect ports
CLI pure validation -------------> same pinned specification/fixtures
```

Separate languages can keep each deployment closure independently bounded and
allow different implementation constraints. They add two toolchains and
maintainer skill sets, duplicate semantics/diagnostic maintenance or an explicit
interop boundary, and greater compatibility/release coordination cost. Two
independent implementations can agree on the same omission, as the current
224 unsupported cases demonstrate. Diversity is not automatic conformance.

Proposal: initially evaluate native implementations against the same full
fixtures and normalized diagnostic contract. If a process/FFI bridge is later
proposed, define and version its bytes, bounds, cancellation, error mapping and
authority separately. A validation CLI may not spawn a runtime backend or
initialize executable extensions to obtain validation. FFI shares address-space
risk; IPC adds process authority and serialization risk. Neither is approved
here. A shared serialized *static report* conveys facts, not authorization to
execute, and cannot replace runtime revalidation of changed inputs/state.

Evidence gap: no mixed-language boundary, full semantic parity, interop costs or
supported cross-language release matrix has been tested. No language pair is
selected. Implementing a bridge requires its own approved scope.

## Pure Interfaces And Startup Boundary

Proposed language-neutral contracts below are design sketches, not public APIs
or new schemas. An input adapter owns bounded discovery and filesystem reads;
pure functions receive immutable bytes and explicit metadata, never ambient
filesystem access, environment, clock, keychain, network or subprocess handles.

```text
InputSnapshot = selected relative source IDs + bytes + digests
SchemaSnapshot = dialect + schema bytes + explicit local-reference map + digest
ValidationPolicy = supported kinds/versions + resource limits + check selection

parse(InputSnapshot, ValidationPolicy) -> Parsed | bounded Diagnostics
checkStructure(Parsed, SchemaSnapshot) -> Findings
checkStaticSemantics(ParsedSet, explicitNamespaceIndex) -> Findings | Unsupported
projectInventory/Graph(ParsedSet) -> declared static projection
normalizeAndRedact(Findings, explicitPolicy) -> ordered DiagnosticReport
```

Resource limits must cover input bytes, alias expansion, nesting, reference
resolution and diagnostic volume. Duplicate keys, root escape, ambiguous
discovery, unsupported dialects and missing local references fail closed with
bounded diagnostics. Determinism requires stable source IDs/order and no
timestamps/random identifiers in canonical output. Redaction happens before
output buffering; source excerpts and secret values are excluded. Pure
signatures do not prove that parser/dependency internals are safe: closure
review, negative fixtures and denied-effect execution remain required.

Proposed startup ordering:

```text
parse command + explicit static options
  -> validate/inspect/graph: bounded reads -> pure checks -> declared output
  -> init: explicit destination writer only, no install/discovery of services
  -> future runtime entry: separate authority preflight -> authorized effects
```

The static path must not construct runtime policy engines, credential clients,
provider SDKs, extension loaders, stores, schedulers or telemetry clients.
Unknown/execution commands are rejected without initializing them. Static
success never grants runtime authority. Installed artifact tests must deny
network, secret-store access, subprocesses and out-of-scope writes before
calling static commands; source inspection and fixture CI alone do not prove
that startup property. The current four candidates expose only validate and
inspect; graph/init sketches do not expand their measured command coverage.

## Proposed Runtime Mechanisms, Mapped To Existing Contracts

The following are candidate mechanisms for future review, **not implemented
enforcement**. Exact transport, store, schema and isolation choices remain
open. Language/layout selection cannot weaken the owning contracts.

| Concern / owning contract | Proposed mechanism and fail-closed point | Required evidence still missing |
| --- | --- | --- |
| [Credentials](../../docs/credential-handling.md) | Host-owned resolver maps opaque requirement refs to operation-scoped leases. A lease is a bounded transport capability, never serialized secret material. Intersect permissions, approvals, autonomy, context, network and credential scope; missing/expired/denied binding rejects before invocation. No environment/keychain/default-profile fallback; renewal reauthorizes. | Fake resolver denial/expiry/revocation tests, transport containment, redaction before output/queue, target secret-store and race tests. |
| [Extension loading](../../docs/extension-loading-boundary.md) | Deployment-owned exact catalog/lock/digest; separate declared, recognized, resolved, verified, enabled, loaded and active states. CLI only inspects declarations. Runtime verifies identity/integrity/support and authorizes each operation before loading/invocation; unresolved/ambiguous/tampered/unapproved implementation stays unavailable. | Catalog verification/update/rollback, dependency closure, isolation and negative loader tests; no ambient plugin discovery or package hooks. |
| [Provider selection](../../docs/provider-adapter-boundary.md) | Host selects one exact eligible target and bounded operation envelope. Adapter translates/invokes only that envelope using mediated network/credential ports. Retries consume explicit budgets; substitution/fallback or SDK auxiliary effects require separate authorization. Missing target or unknown outcome is explicit, not silent success. | No-fallback/retry/redirect/SDK-extra tests, response bounds, cancellation and unknown-outcome reconciliation. |
| [Event/audit storage](../../docs/event-audit-storage-boundary.md) | Separate immutable event instances, audit records, evidence references and projections. Classify/redact before buffering/persistence/export. Required durable pre-effect receipt gates execution; receipt failure blocks before effect. Post-effect loss records unknown/gap and reconciliation, never retroactive denial/success. Stable IDs with scoped ordering and collision detection, not global exactly-once. | Store/interface choice, retention/deletion/access/integrity/recovery ownership, durability crash tests, redaction queue tests, backpressure and gap reconciliation. |
| [CLI/runtime separation](../../docs/cli-runtime-boundary.md) | Import graph and startup factory separation in all layouts. Pure validation returns facts/unsupported coverage only; future host owns authorization and repeats state-dependent preflight immediately before effect. | Installed import/startup audits, adversarial TOCTOU and denied-effect tests, no authority handles crossing static APIs. |

The conceptual runtime interface is `authorize(OperationEnvelope, CurrentState)
-> Denied | ScopedGrant`, followed by `invoke(ScopedGrant, mediatedPorts)` and
`record(RedactedAuditRecord) -> DurableReceipt | Gap`. A grant is bound to the
exact action, resource, input revision, expiry and applicable policy state; it
must not be reused after changed state. Atomicity, revocation and crash behavior
are unresolved implementation obligations, not claims of these signatures.

## Independent Version Domains And Compatibility

| Domain | Proposed owner role and compatibility responsibility |
| --- | --- |
| Manifest dialect | Specification maintainers; existing `specVersion` is not a product release number. |
| Schema snapshot | Specification/validation owners; immutable revision/digest and local reference closure. |
| Pure validation API | Validation library owner; types, error/unsupported meanings, bounded-input semantics and supported schema pairs. |
| CLI artifact | CLI/release owners; command/effect budget, supported targets, install/update/rollback lifecycle. |
| Diagnostic/output contract | CLI/validation owners; category/code/path/severity/meaning, ordering and redaction compatibility. |
| Runtime host | Future runtime owner; authority preflight, adapters, stored-state and operational compatibility. |
| Adapter/extension artifact | Extension/security owners; exact catalog identity, host API ranges, permissions and update/rollback. |
| Cross-boundary protocol | Both endpoint owners; explicit wire/FFI version only if such a bridge is separately proposed. |
| Stored event/audit state | Runtime/storage/security owners; data migration, downgrade/rollback, retention and integrity. |

The [versioning policy](../../docs/versioning.md) remains authoritative. A
repository tag, manifest dialect, schema digest and implementation artifact do
not advance together. No versions change now. A future compatibility matrix
must pin supported combinations and reject all others offline. Migration tests
must cover old/new library consumers, diagnostic meaning, package split/join,
catalog updates and stored-state rollback; none is assumed from a source build.

## Ownership, Release And Maintenance Proposal

All rows are **pending proposals**, not named assignments or consent. NF-101
must record actual people, independence, capabilities and support commitments.

| Proposed role | Responsibility | Acceptance needed |
| --- | --- | --- |
| CLI maintainer | Static dispatch, discovery/output, target artifacts and command compatibility. | Named owner, backup, supported target/window and review availability. |
| Validation library maintainer | Frozen fixtures, full semantics, diagnostics, resource limits and compatibility matrix. | Named owner, API/update policy and fixture review capacity. |
| Runtime maintainer | Future host, preflight/enforcement, state and operational incident handling. | Separate implementation approval plus named owner; no runtime/on-call promise now. |
| Security/dependency owner | Advisory/license/native closure review, credential boundaries, coordinated incident/repair routing. | Named owner and triage/update/exception policy; disclosed matches remain open. |
| Release/CI owner | Reproducible builds, provenance, target cohort, checksums, compatibility and rollback evidence. | Named owner, release authority, target access and review capacity. |
| Signing/distribution owner | Permitted keys, artifact signatures/notarization and revocation/recovery. | Explicit signing authority and certificate custody; ad-hoc signing is insufficient. |

Proposed initial support scope is validation-only tooling, limited to targets
that actually pass the reviewed lifecycle and dependency gates. It is **not** a
current support declaration or a dated SLA. Propose dependency triage before
each release and on a relevant advisory, with exact locked repairs evaluated in
separate approved changes; offline verification must not fetch updates. Support
windows, triage deadlines, backups and incident response remain unconfirmed.
An owner may cover several roles if they consent; this cannot create a second
independent reviewer.

Two reviewer profiles are proposed: (1) architecture/validation/compatibility,
and (2) security/dependencies/isolation/distribution. Each must be independent
of the evaluated authorship, use the same pinned reports, score separately
before reconciliation, disclose conflicts and sign exact revisions. No people
have been appointed in this proposal and no independent review has occurred.

## Conformance And Maintenance Evidence Plan

Specification/fixture owners retain the common full catalog and explicit
negative cases. Validation owners maintain library structural, semantic,
diagnostic and resource-limit tests; CLI owners separately maintain installed
dispatch/discovery/output/denied-effect tests. Runtime owners would own
preflight/effect/state/audit tests; adapter owners would own provider/extension
contract fixtures. Security/release owners would own deny controls, dependency
inventories and cross-target installed lifecycle tests. These are proposed
responsibilities and future test obligations, not completed tests.

Structural/schema, semantic, CLI, runtime and extension claims must remain
separate under the [conformance model](../../docs/conformance.md). Every claim
needs exact source/artifact/specification/fixture revisions, target and test
scope. Unsupported cases and skipped tests are explicit. A source checkout's
pass, a static report or agreement between implementations cannot become an
installed `NF-CLI`, `NF-RUNTIME` or provider enforcement claim.

## Blocking Questions And Next Handoff

| Blocker | Required decision/evidence before architecture acceptance |
| --- | --- |
| `fidelity-coverage` | Implement/evaluate all required semantic/namespace cases in separately authorized repair scope; preserve failed current evidence. |
| `full-diagnostics` | Complete normalized full-catalog diagnostic/repeatability/redaction evidence, not just the supported subset. |
| `security-isolation` | Target-native deny controls and credential/IPC/inheritance/race/resource evidence with explicit residual risks. |
| `supply-chain-closure` | Review dated advisory matches, unknown licenses, native/runtime closure and provenance; new repair scope if needed. |
| `installed-lifecycle` | Fix/retest authorized relocation/build/path gaps, real predecessor upgrade/rollback and permitted signing on each proposed target. |
| `comparable-measurements` | Common target cohorts, equivalent supported workloads and all seven metrics with raw repetitions; fast failed exits are not validation timings. |
| `boundary-enforcement` | Choose and prove startup/import, authorization, extension/provider and durable audit mechanisms; sketches are not enforcement. |
| `version-compatibility` | Select layout/API/artifact domains and prove supported pair/migration/rollback behavior. |
| `independent-review` | Appoint two actual independent people, obtain separate evidence-linked scores and record reconciliation. |
| `owner-consent` | Confirm named support/release/security/signing responsibilities and capabilities; leave missing consent pending. |

NF-056-17 assembles actual four-candidate bundles and empty independent review
forms. NF-056-18 prepares the Draft decision RFC and maps all eleven mandatory
[review gates](../../rfcs/reviews/runtime-architecture-decision-review.md).
NF-101 resolves people/consent separately. Publishing or merging preparatory
documents does not close the blockers, select a winner, authorize runtime
implementation or accept an architecture.

## Verify This Proposal

```sh
npm run runtime-architecture-alternatives-smoke
npm run documentation-navigation-smoke
```

The first check uses local Git history and stored records only. It checks exact
source bindings, retained failures, all three acyclic inward dependency graphs,
version/contract/role coverage, and rejection of promoted decision/ownership
claims. It does not rerun candidates, refresh advisory scans, measure targets,
contact providers or substitute for human review.
