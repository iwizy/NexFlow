# Runtime Options

NexFlow does not choose a runtime language yet.

A runtime architecture decision must happen before implementation begins.

The decision must be evaluated against the
[Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md).
The current review outcome is `not-ready`: no decision RFC, common prototype
evidence, completed scorecards, or accepted implementation choice exists.

Language-specific repository maintenance tooling, including schema validation dependencies, does not constitute a runtime implementation or a Runtime Architecture Decision.

Reference CLI scope is a separate planning step. See
[RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) and the
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) for the
draft validation-only command, effect, and shared-library boundaries.

## Current Decision State

The architecture process has completed its neutral evaluation framework and
several runtime-independent boundary contracts. It has not completed the
evidence needed to select an implementation architecture.

Available inputs:

- language hard gates, weighted criteria, and a common prototype contract
- explicit CLI command effect budgets and runtime-preflight separation
- extension loading, provider adapter, and event and audit storage boundaries
- a mandatory review checklist and acceptance rule

Open decision blockers:

- no decision RFC proposes one language, architecture layout, package model,
  and exact target matrix
- no candidate has a completed comparable prototype, hard-gate record,
  scorecard, or distribution evidence
- package ownership and cross-package compatibility remain undecided
- runtime threat, credential, and conformance evidence is incomplete
- signing, provenance, install, upgrade, rollback, and maintenance ownership
  are not demonstrated for any candidate

The next step is evidence closure, not implementation. The project must draft
the decision proposal, complete the missing boundary inputs, freeze one common
specification revision, evaluate every candidate, and then record an explicit
review outcome. Existing JavaScript validation tooling gives no candidate a
presumptive advantage.

An `accepted` outcome permits only the implementation scope named by the RFC.
Any `not-ready`, `changes-requested`, `rejected`, or `superseded` outcome keeps
implementation blocked until the corresponding review path is completed. See
the [Roadmap](roadmap.md) for the ordered closure sequence.

## Evaluation Framework

The [Runtime Language Evaluation Matrix](language-evaluation-matrix.md) defines
hard gates, weighted criteria, a common validation-only prototype, evidence
records, target testing, and the decision procedure. No candidate has a score
until the same prototype and measurements have been completed for all four.

Candidate runtimes are evaluated on:

- specification fidelity
- JSON Schema and YAML support
- cross-platform distribution
- security and sandboxing options
- ecosystem fit for developer tooling
- integration support
- performance
- maintainability
- contributor accessibility
- packaging and upgrade story
- ability to remain provider neutral

Hard gates cover specification fidelity, deterministic diagnostics, offline
operation, reproducible dependencies, distribution targets, security
boundaries, supply-chain evidence, provider neutrality, and scope integrity.
Weighted scores cannot compensate for a failed hard gate.

## TypeScript

Strengths:

- strong ecosystem for developer tooling
- good JSON Schema support
- natural fit for web and editor integrations
- easy npm distribution

Risks:

- Node runtime assumptions
- supply chain complexity
- sandboxing requires care
- single-executable distribution requires explicit maturity and target review

## Python

Strengths:

- strong scripting and automation ecosystem
- accessible to researchers and infrastructure teams
- mature YAML and validation libraries

Risks:

- packaging fragmentation
- runtime environment drift
- slower startup for some CLI use cases
- virtual environments do not provide an application security sandbox

## Rust

Strengths:

- strong safety and performance
- excellent single-binary distribution
- good for policy enforcement and CLIs

Risks:

- higher contribution barrier
- slower iteration for some teams
- integration ecosystem may require more work
- build scripts, unsafe code, and native dependencies require separate review

## Go

Strengths:

- simple deployment model
- strong CLI and server ecosystem
- good concurrency and portability

Risks:

- less expressive schema modeling than some alternatives
- dependency ergonomics vary by integration domain
- cgo and native dependencies can change distribution and security assumptions

These strengths and risks are hypotheses for the common prototype. They are not
scores or a language recommendation.

## Required Milestone

Before any runtime implementation, the project should complete an RFC named **Runtime Architecture Decision**.

That RFC should choose:

- initial implementation language
- packaging strategy
- validation scope
- CLI and runtime responsibility split
- security model
- extension loading model
- provider adapter model
- event and audit storage model
- conformance test strategy

It should also publish the completed evidence records, hard-gate results,
weighted scorecards, target matrix, reviewer rationale, and any reason the
decision differs from the numerical ranking.

Acceptance requires every mandatory review gate to pass, every blocker to be
closed, and the reviewed RFC, specification baseline, prototype evidence, and
sign-off revisions to be pinned. A preferred language or the highest weighted
score is not sufficient by itself.

The extension loading model must satisfy the runtime-neutral
[Extension Loading Boundary](extension-loading-boundary.md). The architecture
decision still needs to choose the package, catalog, lock, integrity, host
interface, isolation, update, rollback, diagnostic, and audit mechanisms.

The CLI and runtime split must satisfy the
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md). The
architecture decision still needs to choose artifact and package ownership,
pure shared-library interfaces, command dispatch, privilege initialization,
offline enforcement, release versioning, and separate conformance evidence.

The provider adapter model must satisfy the runtime-neutral
[Provider Adapter Boundary](provider-adapter-boundary.md). The architecture
decision still needs to choose invocation and result interfaces, adapter
packaging, credential and network mediation, retry and fallback policy, error
normalization, and audit evidence formats.

The event and audit storage model must satisfy the runtime-neutral
[Event And Audit Storage Boundary](event-audit-storage-boundary.md). The
architecture decision still needs to choose event-instance interfaces, audit
store and evidence roles, redaction pipeline, ordering scopes, durability,
retention, deletion, access, integrity, gap handling, and conformance evidence.
