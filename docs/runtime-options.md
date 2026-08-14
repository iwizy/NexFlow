# Runtime Options

NexFlow does not choose a runtime language yet.

A runtime architecture decision must happen before implementation begins.

Language-specific repository maintenance tooling, including schema validation dependencies, does not constitute a runtime implementation or a Runtime Architecture Decision.

Reference CLI scope is a separate planning step. See [RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) for the draft validation-only CLI boundary.

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
- security model
- extension loading model
- conformance test strategy

It should also publish the completed evidence records, hard-gate results,
weighted scorecards, target matrix, reviewer rationale, and any reason the
decision differs from the numerical ranking.

The extension loading model must satisfy the runtime-neutral
[Extension Loading Boundary](extension-loading-boundary.md). The architecture
decision still needs to choose the package, catalog, lock, integrity, host
interface, isolation, update, rollback, diagnostic, and audit mechanisms.
