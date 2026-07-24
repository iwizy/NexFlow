# Release Plan

NexFlow is specification-first. Releases describe specification maturity, validation coverage, examples, governance, and future implementation boundaries. They do not imply that a runtime engine exists.

This plan is public guidance for contributors and implementers. It is not a private work schedule, release calendar, or promise of delivery dates.

## Release Principles

- The specification is the product until a runtime architecture decision is accepted.
- Runtime behavior must not appear before the corresponding specification text, schema expectations, and compatibility notes exist.
- Releases should improve interoperability, auditability, and safety rather than add implementation surface prematurely.
- Draft releases may change names, fields, and semantics when that improves the model.
- Breaking changes require migration notes and an RFC when they materially affect manifests, schemas, runtime expectations, or conformance claims.
- Provider neutrality and runtime neutrality must remain intact across every release.

## Version Line

NexFlow uses `0.x` releases while the specification is still stabilizing. The `1.0` release should mean that the core manifest model is stable enough for independent validators, CLIs, and runtimes to implement without guessing.

| Version | Theme | Expected Outcome |
| --- | --- | --- |
| `0.1` | Draft specification foundation | Core vocabulary, draft manifests, schemas, examples, governance, and validation workflow are understandable and reviewable. |
| `0.2` | Validation and conformance | Validators can check manifests consistently, report useful diagnostics, and describe support levels. |
| `0.3` | Semantic consistency | Cross-manifest references, approval gates, memory, events, provider selection, and agent assembly semantics are clearer and testable. |
| `0.4` | Runtime decision readiness | Runtime language, packaging, security boundary, extension loading, and CLI scope decisions are ready for implementation planning. |
| `0.5` | Reference tooling preview | A validation-focused reference CLI can inspect manifests without orchestrating real work. |
| `0.6` | Runtime prototype boundary | A prototype runtime boundary can be explored while preserving provider neutrality and explicit human approval rules. |
| `0.7` | Integration and extension hardening | Extension namespaces, integration metadata, registry expectations, and unsupported-extension behavior are ready for early implementers. |
| `0.8` | Interoperability review | Multiple example teams, validators, and implementation experiments can compare behavior against shared conformance language. |
| `0.9` | Stabilization candidate | Remaining breaking changes are identified, migration guidance is written, and `1.0` compatibility expectations are explicit. |
| `1.0` | Stable core specification | Core manifests, schemas, conformance levels, compatibility policy, and safety requirements are stable enough for independent adoption. |

## `0.1` Draft Foundation

The `0.1` line establishes the shape of the project.

Use the [0.1 Readiness Checklist](readiness-checklist.md) when reviewing whether the draft is ready for a candidate tag.

Release readiness:

- core domain vocabulary is documented
- YAML manifest families are described
- practical JSON Schemas exist for core manifests
- reference examples validate structurally
- governance and RFC process are documented
- security, approval, context, memory, handoff, event, provider, extension, and runtime option docs exist
- repository checks can parse schemas and examples reproducibly

`0.1` remains a draft. It can add clarifications, examples, and compatible draft vocabulary without bumping the manifest `specVersion`.

## `0.2` Validation and Conformance

The `0.2` line should make validation behavior more predictable.

Release readiness:

- validation commands are documented and reproducible
- schema compilation and example validation run in CI
- focused ActorSet, agent identity, and human override schema boundaries are covered
- diagnostic categories are stable enough for early tooling
- manifest inventory expectations are explicit
- conformance levels are clear enough for validators and CLIs
- compatibility impact notes are included for validation-affecting changes

Non-goals:

- no orchestration engine
- no provider calls
- no automatic approval enforcement

## `0.3` Semantic Consistency

The `0.3` line should make cross-manifest meaning easier to test.

Release readiness:

- reference resolution rules are documented and covered by checks
- approval gate semantics are detailed enough for preflight validation
- human override authority, gate, event, and fail-closed relationships are testable
- memory retention and visibility semantics have testable expectations
- event envelope requirements are aligned across docs, schemas, and examples
- provider selection and fallback semantics are explainable without provider-specific assumptions
- unique active agent definition selection and authority are deterministic and
  testable
- the derived agent assembly relationship is clear across agent definitions,
  model profiles, prompt sets, retrieval profiles, permissions, context, memory,
  autonomy, and extensions

Non-goals:

- no runtime execution
- no provider-specific SDK contract
- no hidden tool permission inference

## `0.4` Runtime Decision Readiness

The `0.4` line should prepare the project for a runtime architecture decision without choosing a language too early.

Release readiness:

- runtime evaluation criteria are complete
- reference CLI scope is accepted or clearly bounded
- extension loading and sandbox expectations are documented
- security boundaries for network, filesystem, credentials, and destructive actions are explicit
- packaging and distribution criteria are documented
- conformance test strategy is described

Non-goals:

- no final runtime language recommendation unless the decision process has completed
- no runtime engine implementation

## `0.5` Reference Tooling Preview

The `0.5` line may introduce validation-focused tooling if the runtime decision process supports it.

Release readiness:

- a reference CLI can validate and inspect manifests
- `nexflow validate` behavior is aligned with the validation model
- `nexflow inspect` output is useful for humans and future machine consumers
- `nexflow graph` remains explanatory and does not orchestrate work
- CLI diagnostics are documented and compatible with conformance language

Non-goals:

- no task execution
- no LLM calls
- no autonomous workflow execution
- no deployment or production action support

## `0.6` Runtime Prototype Boundary

The `0.6` line may define how a runtime prototype can be explored safely.

Release readiness:

- runtime preflight checks are defined
- approval gate enforcement boundaries are explicit
- event emission requirements are documented
- provider abstraction is mapped to runtime responsibilities without binding the spec to one provider
- credential, network, and filesystem policies are described before any dangerous action is possible

Non-goals:

- no claim that the prototype is production-ready
- no default autonomous write, deploy, or destructive behavior

## `0.7` Integration and Extension Hardening

The `0.7` line should make extensions safer for independent tools.

Release readiness:

- extension namespace ownership rules are clear
- lifecycle states are stable enough for tools to preserve unsupported extensions safely
- integration metadata expectations are documented
- MCP-like context and tool surfaces remain separated
- extension compatibility expectations are represented in conformance language

## `0.8` Interoperability Review

The `0.8` line should test whether independent implementations can interpret NexFlow consistently.

Release readiness:

- examples cover small, startup, enterprise, product, open-source, and research workflows without overfitting to one tool
- validators can compare results across common fixture sets
- runtime experiments can report limitations using shared conformance terms
- migration notes exist for known draft-era changes

## `0.9` Stabilization Candidate

The `0.9` line should reduce surprise before `1.0`.

Release readiness:

- remaining breaking changes are listed
- deprecations have migration notes
- schemas, docs, examples, RFCs, and changelog are synchronized
- security and human-approval expectations are reviewed
- version support and compatibility policy are ready for stable release

## `1.0` Stable Core Specification

The `1.0` release should mean that the core NexFlow specification can be adopted with confidence by projects, validators, CLIs, and runtimes.

Release readiness:

- core manifest semantics are stable
- required fields and reference rules are stable
- conformance vocabulary is stable
- validation behavior is documented
- compatibility and migration policy are clear
- security model and approval gate requirements are normative
- provider and runtime neutrality are preserved

After `1.0`, breaking changes should move to a major version and include migration guidance.

## Release Checklist

Before tagging a release, maintainers should verify:

- docs, schemas, examples, RFCs, and changelog are synchronized
- examples validate against the intended schemas
- compatibility impact is documented
- migration notes exist for breaking or behavior-significant changes
- runtime and provider claims match implemented reality
- release notes clearly separate implemented behavior, specified behavior, and planned behavior

For the `0.1` line, use the more detailed [0.1 Readiness Checklist](readiness-checklist.md).

## Relationship to Project Planning

This document intentionally does not publish delivery dates, contributor availability, task calendars, or scheduling commitments. Public release planning should describe readiness criteria and project direction.
