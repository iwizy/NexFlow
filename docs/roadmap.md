# Roadmap

NexFlow is specification-first. Runtime work starts only after the core model is coherent.

## Milestone 1: Draft Specification

- Define core concepts.
- Document manifest semantics.
- Add draft schemas.
- Add examples.
- Create governance and RFC process.

Status: in progress.

## Milestone 2: Community Review

- Collect feedback from agent tool builders, open-source maintainers, startups, enterprises, and researchers.
- Refine terminology.
- Identify missing safety and compatibility rules.

## Milestone 3: Schema Hardening

- Improve cross-manifest consistency.
- Add schema examples and negative cases.
- Define conformance expectations for validators.
- Refine draft conformance levels for manifests, validators, CLIs, runtimes, and extensions.

## Milestone 4: Runtime Architecture Decision

- Compare implementation languages.
- Define reference CLI scope.
- Define security and extension loading boundaries.
- Decide packaging and conformance test strategy.

This milestone must happen before runtime implementation begins.

## Milestone 5: Reference CLI

Possible commands:

- `nexflow init`
- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`

The CLI should validate and inspect manifests only. It should not orchestrate real work.

## Milestone 6: Runtime Prototype

- Interpret workflows.
- Enforce approval gates.
- Emit audit events.
- Integrate with provider abstractions.
- Keep provider-specific logic isolated.

## Milestone 7: Ecosystem Split

Evaluate splitting into:

- NexFlow Spec
- NexFlow Runtime
- NexFlow Desktop
- NexFlow Cloud
