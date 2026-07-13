# Runtime Options

NexFlow does not choose a runtime language yet.

A runtime architecture decision must happen before implementation begins.

Language-specific repository maintenance tooling, including schema validation dependencies, does not constitute a runtime implementation or a Runtime Architecture Decision.

Reference CLI scope is a separate planning step. See [RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) for the draft validation-only CLI boundary.

## Evaluation Criteria

Candidate runtimes should be evaluated on:

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

## Python

Strengths:

- strong scripting and automation ecosystem
- accessible to researchers and infrastructure teams
- mature YAML and validation libraries

Risks:

- packaging fragmentation
- runtime environment drift
- slower startup for some CLI use cases

## Rust

Strengths:

- strong safety and performance
- excellent single-binary distribution
- good for policy enforcement and CLIs

Risks:

- higher contribution barrier
- slower iteration for some teams
- integration ecosystem may require more work

## Go

Strengths:

- simple deployment model
- strong CLI and server ecosystem
- good concurrency and portability

Risks:

- less expressive schema modeling than some alternatives
- dependency ergonomics vary by integration domain

## Required Milestone

Before any runtime implementation, the project should complete an RFC named **Runtime Architecture Decision**.

That RFC should choose:

- initial implementation language
- packaging strategy
- validation scope
- security model
- extension loading model
- conformance test strategy
