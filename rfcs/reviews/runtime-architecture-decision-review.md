# Runtime Architecture Decision Review

## Status

Review framework published. No Runtime Architecture Decision has been accepted.

The current repository does not contain a complete decision RFC, common
candidate prototypes, completed scorecards, or the evidence required to select
an implementation language. The current review outcome is therefore **not
ready for decision**.

## Purpose

This document defines the review gates and acceptance criteria for the future
Runtime Architecture Decision RFC. It makes the decision process inspectable
without selecting TypeScript, Python, Rust, Go, a package layout, or a runtime
implementation prematurely.

The checklist is stricter than the general RFC checklist because a runtime
decision changes the project's implementation, distribution, security,
conformance, and long-term maintenance boundaries. Completing this document
does not accept the decision RFC by itself. Maintainers still accept or reject
the RFC through the normal governance process.

## Scope

The review covers the proposed architecture for:

- the validation-only reference CLI
- reusable specification and validation libraries
- the future runtime host and effect boundary
- provider adapters and extension implementations
- event and audit persistence interfaces
- packages, artifacts, releases, and supported targets
- conformance evidence and implementation support claims

Desktop and cloud products may consume the selected interfaces later, but
their application architecture, hosting model, commercial operation, and user
experience are outside this decision unless the RFC explicitly proposes a
shared contract that they require.

## Review Inputs

The review must use pinned, public, and reproducible inputs. At minimum, the
decision RFC must link to:

| Input | Required evidence |
| --- | --- |
| Decision proposal | One versioned RFC revision that identifies the proposed language, architecture layout, package ownership, supported targets, and non-goals. |
| Specification baseline | One 40-character commit SHA that fixes the schemas, examples, fixtures, semantic rules, and diagnostics used by every prototype. |
| Candidate evidence | Comparable TypeScript, Python, Rust, and Go reports produced from the common prototype and target matrix. |
| Hard-gate results | An explicit pass or fail for every gate in the Runtime Language Evaluation Matrix, with commands and artifacts. |
| Weighted scorecards | Evidence-linked scores from at least two reviewers, including reconciliation notes and confidence. |
| Architecture alternatives | At least the three single-language, separated-package, and split-language layouts required by the evaluation matrix. |
| Boundary contracts | The current CLI/runtime, extension loading, provider adapter, and event/audit storage boundaries. |
| Security evidence | Threat assumptions and tests for filesystem, network, subprocess, credential, extension, dependency, and destructive-operation controls. |
| Distribution evidence | Build, install, upgrade, rollback, uninstall, signing, checksum, provenance, and dependency inventory results for each proposed target. |
| Conformance plan | Fixture ownership, test layers, claim levels, version mapping, and evidence publication rules for the CLI and runtime separately. |
| Ownership plan | Named maintenance responsibilities, support windows, dependency update policy, incident ownership, and release ownership. |

Links to changing branch tips, unpinned tool output, private notes, or
unreproducible local experiments are not sufficient decision evidence.

## Decision Outcomes

The review records exactly one outcome:

| Outcome | Meaning |
| --- | --- |
| `not-ready` | Required proposal or evidence is absent, stale, incomparable, or blocked. No implementation is authorized. |
| `changes-requested` | A reviewable proposal exists, but specified corrections or additional evidence are required. |
| `accepted` | Every mandatory gate passes and maintainers accept the documented tradeoffs. |
| `rejected` | The proposal was reviewable but its risks, costs, or constraints are unacceptable. |
| `superseded` | A newer decision RFC replaces the reviewed proposal. |

`not-ready` is not a language judgment. It means the project cannot yet make a
source-grounded architecture choice.

## Mandatory Review Gates

Every gate below must be marked `passed` before the decision RFC can be
accepted. `partial`, `unknown`, `not-tested`, and an undocumented absence all
fail the acceptance rule.

### 1. Proposal Completeness

- [ ] The RFC identifies one proposed language and one architecture layout.
- [ ] Package and artifact ownership is explicit for the spec, shared
  libraries, CLI, runtime host, adapters, and extension implementations.
- [ ] Supported operating-system and architecture targets are exact.
- [ ] Runtime responsibilities, non-goals, and deferred work are explicit.
- [ ] The proposal distinguishes decisions made now from hypotheses that still
  require prototypes.
- [ ] The RFC contains compatibility, security, alternatives, and open-question
  sections required by governance.

Acceptance evidence: a stable RFC revision with no placeholder in a mandatory
decision field.

### 2. Evidence Integrity And Comparability

- [ ] Every candidate uses the same pinned specification and fixture revision.
- [ ] Prototype scope, commands, inputs, diagnostics, and measurements are
  equivalent across candidates.
- [ ] Toolchains and all direct and transitive dependencies are pinned.
- [ ] Commands, logs, inventories, checksums, and measurements are public and
  reproducible.
- [ ] At least two reviewers scored candidates independently before
  reconciliation.
- [ ] Missing evidence scores `0` and is not replaced by ecosystem reputation,
  preference, or an unsupported estimate.

Acceptance evidence: completed candidate records and a reviewer reconciliation
record that explains every material score difference.

### 3. Candidate Eligibility

- [ ] The selected candidate passes every hard gate in the
  [Runtime Language Evaluation Matrix](../../docs/language-evaluation-matrix.md).
- [ ] Failed gates for non-selected candidates remain visible.
- [ ] The selected candidate's evidence covers every proposed release target.
- [ ] Provider neutrality and validation-only prototype scope are demonstrated,
  not inferred from language or framework choice.
- [ ] Supply-chain and licensing evidence covers the actual dependency graph and
  produced artifacts.

Acceptance evidence: a complete hard-gate table with links to the owning test
or artifact for every result.

### 4. Architecture And Dependency Direction

- [ ] Dependency direction keeps specification models and pure validation
  libraries independent from runtime authority.
- [ ] Process startup and command dispatch do not initialize credentials,
  network clients, provider SDKs, executable extensions, schedulers, effect
  handlers, or audit stores for validation-only commands.
- [ ] Shared libraries have explicit pure interfaces and testable side-effect
  boundaries.
- [ ] The proposal explains why one process, multiple processes, one repository,
  or multiple repositories satisfies the boundary; topology alone is not used
  as proof of isolation.
- [ ] Version ownership and compatibility rules are defined for every shared
  package and cross-process protocol.

Acceptance evidence: package or component diagram, allowed dependency graph,
initialization sequence, interface inventory, and boundary tests.

### 5. CLI And Runtime Separation

- [ ] `validate`, `inspect`, `graph`, and `init` preserve their documented
  command effect budgets.
- [ ] Static validation is distinct from live runtime preflight and operation
  authorization in code ownership, APIs, diagnostics, and conformance claims.
- [ ] Validation-only commands work offline without credentials or executable
  extensions.
- [ ] `init` writes only to an explicit local destination and does not install,
  authenticate, initialize remote state, or enable execution.
- [ ] CLI and runtime support are reported through separate `NF-CLI` and
  `NF-RUNTIME` claims even when they share a release artifact.

Acceptance evidence: tests derived from the
[CLI And Runtime Responsibility Boundary](../../docs/cli-runtime-boundary.md),
including denied network, credential, process, extension, and out-of-scope
filesystem access.

### 6. Security And Authority Boundaries

- [ ] The RFC identifies trust boundaries and threat assumptions for authored
  manifests, local files, dependencies, extensions, providers, remote systems,
  credentials, memory, and audit data.
- [ ] Filesystem, network, subprocess, credential, destructive-action, and
  production-action controls fail closed.
- [ ] Permission, capability, autonomy, approval, network, context, memory, and
  human-override decisions remain host-owned and cannot be broadened by an
  adapter, extension, model, protocol, or transport.
- [ ] Secret material remains outside public manifests, diagnostics, caches,
  traces, and inspection output.
- [ ] Redaction happens before persistence or export, with fail-closed behavior
  when classification or redaction cannot complete.
- [ ] Dependency installation and update execution are outside validation
  command authority and have a separately reviewed supply-chain policy.

Acceptance evidence: a threat-boundary document, negative tests, redaction
tests, dependency inventory, vulnerability results, and documented residual
risks.

### 7. Extension And Provider Boundaries

- [ ] Extension declaration, implementation discovery, artifact resolution,
  verification, loading, activation, authorization, and invocation remain
  separate stages.
- [ ] Executable extension code is selected from a runtime-owned catalog, pinned
  immutably, verified, isolated, and denied implicit authority.
- [ ] Provider selection and fallback remain host-owned; an adapter receives one
  authorized target and cannot choose a hidden fallback.
- [ ] Credentials and network access are mediated per operation.
- [ ] Unsupported, ambiguous, unavailable, or unverifiable implementations fail
  closed with safe diagnostics.
- [ ] Protocol support such as MCP or A2A does not import external identity,
  permission, task, artifact, or context authority automatically.

Acceptance evidence: mechanism choices and tests mapped to the
[Extension Loading Boundary](../../docs/extension-loading-boundary.md),
[Provider Adapter Boundary](../../docs/provider-adapter-boundary.md), and
[MCP And A2A Boundaries](../../docs/mcp-a2a-boundaries.md).

### 8. Event, Audit, And State Boundaries

- [ ] Authored EventSet declarations remain separate from runtime event
  instances, audit records, evidence, projections, receipts, and telemetry.
- [ ] The RFC identifies authority, retention, deletion, access, integrity,
  ordering, duplicate, gap, recovery, and durability behavior for each store.
- [ ] Audit storage does not become permission, approval, workflow, memory, or
  human-override authority.
- [ ] Correlation, causation, actor identity, operation identity, policy
  decisions, and redaction provenance survive persistence and export.
- [ ] Storage or export failure behavior is explicit for security-relevant and
  non-security events.

Acceptance evidence: selected interfaces and failure tests mapped to the
[Event And Audit Storage Boundary](../../docs/event-audit-storage-boundary.md).

### 9. Packaging, Distribution, And Operations

- [ ] Artifact formats, package registries, checksums, signatures, provenance,
  and software bill of materials are specified.
- [ ] Clean install, offline-capable use, upgrade, rollback, and uninstall paths
  are tested on every supported target.
- [ ] Runtime prerequisites, native dependencies, build scripts, cgo, unsafe
  code, native addons, wheels, or embedded interpreters are identified where
  applicable.
- [ ] Release channels and compatibility between spec, CLI, runtime, adapters,
  and extensions are defined.
- [ ] Unsupported targets and degraded configurations are explicit and do not
  produce a false support claim.
- [ ] Operational costs, CI ownership, signing ownership, and incident response
  responsibilities are accepted by maintainers.

Acceptance evidence: target matrix, produced artifacts, install transcripts,
release design, and named ownership.

### 10. Conformance, Compatibility, And Migration

- [ ] The RFC maps tests and evidence to `NF-SCHEMA`, `NF-SEMANTIC`, `NF-CLI`,
  `NF-RUNTIME`, and relevant extension claims independently.
- [ ] Positive, negative, semantic, boundary, security, and target fixtures have
  clear ownership and version mapping.
- [ ] Machine-readable output and diagnostic compatibility are versioned.
- [ ] Spec, package, protocol, artifact, configuration, and stored-state
  compatibility rules are explicit.
- [ ] Migration and rollback paths exist for any accepted breaking boundary.
- [ ] The proposal does not imply that an accepted architecture makes the
  current repository a conforming runtime.

Acceptance evidence: conformance test plan, compatibility table, migration
notes, and draft support claims containing no untested status.

### 11. Rationale, Governance, And Ownership

- [ ] The RFC explains why the selected design is preferable to every evaluated
  architecture layout.
- [ ] Any deviation from the numerical ranking identifies the overriding
  constraint and supporting evidence.
- [ ] Material dissent, ties, confidence limits, residual risks, and rejected
  options are recorded accurately.
- [ ] Maintainers responsible for the CLI, runtime, security boundaries,
  releases, and dependencies acknowledge ownership.
- [ ] Remaining open questions are classified and do not hide an acceptance
  blocker.
- [ ] The final decision is recorded through the normal RFC process with the
  reviewed revision and review sign-off preserved.

Acceptance evidence: decision rationale, review record, maintainer sign-off,
and links to tracked follow-up work.

## Blockers, Conditions, And Follow-Ups

Review findings use three classes:

- **Blocker**: missing or failed evidence that can change safety, scope,
  candidate eligibility, package ownership, compatibility, distribution, or
  conformance. A blocker prevents acceptance.
- **Condition**: a bounded correction required before implementation begins.
  Conditions may accompany acceptance only when they cannot change the selected
  architecture or weaken a mandatory gate, have an owner, and have a completion
  criterion.
- **Follow-up**: non-blocking work that elaborates an already accepted boundary.
  A follow-up cannot be used to defer security, portability, rollback,
  conformance, or ownership evidence needed for the decision.

When classification is disputed, treat the finding as a blocker until the
review record explains why it is safe to narrow.

## Acceptance Rule

The Runtime Architecture Decision RFC may move from `Review` to `Accepted` only
when:

1. every mandatory gate is `passed`
2. every evidence link resolves to the reviewed revision or an immutable
   artifact
3. every blocker is closed and verified
4. conditions, if any, have owners and cannot alter the selected architecture
5. at least two reviewers have completed the technical evidence review
6. maintainers have accepted the security, maintenance, distribution, and
   compatibility obligations
7. the RFC and this review record identify the exact revisions being accepted

An acceptance vote, preferred language, prototype success on one machine, or
high weighted score cannot waive a failed mandatory gate.

## Review Record Template

The review may copy this non-normative template into a dated review file:

```yaml
reviewedRfc: RFC-number
reviewedRevision: 40-character-git-commit
specificationBaseline: 40-character-git-commit
reviewedAt: RFC-3339-timestamp
outcome: not-ready | changes-requested | accepted | rejected | superseded
reviewers:
  - reviewer-id
selectedCandidate: null
selectedLayout: null
gates:
  proposalCompleteness: not-evaluated
  evidenceIntegrity: not-evaluated
  candidateEligibility: not-evaluated
  architectureDependencies: not-evaluated
  cliRuntimeSeparation: not-evaluated
  securityAuthority: not-evaluated
  extensionProvider: not-evaluated
  eventAuditState: not-evaluated
  packagingOperations: not-evaluated
  conformanceCompatibility: not-evaluated
  rationaleGovernanceOwnership: not-evaluated
blockers: []
conditions: []
followUps: []
evidence: []
```

This is a review record format, not a NexFlow manifest, schema, or conformance
claim.

## Current Baseline Assessment

The repository has useful inputs for a future review:

- neutral language criteria, hard gates, weighted scoring, and a common
  validation-only prototype contract
- validation-only CLI commands and explicit effect budgets
- runtime-neutral extension loading and provider adapter boundaries
- runtime-neutral event and audit storage boundaries
- provider-neutral manifests and a specification-first roadmap

The decision is not ready for acceptance because:

- no Runtime Architecture Decision RFC currently proposes a language,
  architecture layout, package ownership, or exact targets
- no common candidate prototypes, completed hard-gate reports, scorecards, or
  reviewer reconciliation records are published
- package layout and cross-package version ownership are not selected
- the complete runtime credential and threat boundaries are not yet available
  as decision evidence
- the conformance test strategy for CLI, runtime, and extension claims is not
  complete
- no target artifacts, installation evidence, signing path, provenance, or
  maintenance ownership record exists

Until those blockers are resolved, no runtime language is selected, no runtime
implementation is authorized, and existing JavaScript maintenance tooling has
no architectural decision weight.

## Non-Goals

This review does not:

- choose or recommend a runtime language
- create a CLI, runtime, adapter, extension loader, or storage implementation
- change any manifest or schema
- make `NF-CLI` or `NF-RUNTIME` conformance claims
- promise a release date or implementation sequence
- treat future Desktop or Cloud products as part of the initial runtime
