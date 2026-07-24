# Roadmap

NexFlow is specification-first. Runtime work starts only after the core model is coherent.

For version-by-version readiness criteria from `0.1` draft through `1.0`, see the [Release Plan](release-plan.md).

For the first candidate review, see the [0.1 Readiness Checklist](readiness-checklist.md).

## Current Checkpoint: `0.1` Candidate Preparation

Status: preparation in progress. No `0.1` candidate tag has been published.

The repository currently provides the following candidate evidence:

- a documented draft specification and manifest reference
- practical JSON Schemas for 17 manifest kinds plus common definitions
- 7 maintained project examples containing 113 schema-backed manifests
- reproducible schema syntax, structural validation, and semantic reference
  smoke commands
- explicit conformance vocabulary and a current compatibility matrix
- a public readiness checklist, release plan, known limitations, and governance
  process
- a cross-RFC review for the Actor Model, Effective Agent Configuration, Typed
  References, and Core Profile proposals
- an initial ActorSet schema and Minimal Team migration using shared typed
  reference contracts
- a compact AgentSet migration with legacy compatibility checks
- an explicit fail-closed human override policy, audit vocabulary, and focused
  schema checks without runtime enforcement

Before publishing a candidate, maintainers still need to:

1. Run the readiness checklist against one exact candidate commit.
2. Record the candidate label, commit hash, validation results, compatibility
   notes, known limitations, and unresolved RFCs or blockers.
3. Classify the outcome as Ready, Ready with notes, or Blocked.
4. Confirm that the README, changelog, schemas, examples, and support claims
   describe the same repository state.
5. Confirm that draft RFC proposals are either intentionally deferred or
   represented by synchronized specification changes and migration guidance.

The candidate boundary is deliberately narrow:

- manifest `specVersion` remains `"0.1"` unless a separate version decision is
  approved
- a repository candidate tag identifies one tested artifact snapshot; it does
  not create runtime conformance or an independent schema package version
- no reference CLI, runtime, provider adapter, live integration, workflow
  execution, policy enforcement, or deployment capability is implied
- post-`0.1` validation and conformance hardening begins only after the candidate
  decision is recorded

Relevant evidence: [Compatibility Matrix](compatibility-matrix.md),
[0.1 Readiness Checklist](readiness-checklist.md), [Release Plan](release-plan.md),
and [Foundational Model Cross-RFC Review](../rfcs/reviews/2026-07-foundational-model-review.md).

## Milestone 1: Draft Specification

- Define core concepts.
- Document manifest semantics.
- Add draft schemas.
- Add examples.
- Create governance and RFC process.

Status: candidate preparation; release decision pending.

Relevant docs: [Concepts](concepts.md), [Glossary](glossary.md), [Manifest Reference](manifest-reference.md), [Actor Model](actor-model.md), [Actor Model Migration](actor-model-migration.md), [Agent Identity Migration](agent-identity-migration.md), [Agent Definitions](agent-definitions.md), [Human Override](human-override.md), [Context Model](context-model.md), [Memory Model](memory-model.md), [Approval Gates](approval-gates.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md).

Agent definition authority checkpoint: implemented for the Minimal Team
reference path. The unique unscoped active definition owns requested behavior;
schemas and repository checks enforce active completeness and ambiguity
boundaries. A derived Agent Assembly inspection view remains the next
foundational slice.

## Milestone 2: Community Review

- Collect feedback from agent tool builders, open-source maintainers, startups, enterprises, and researchers.
- Refine terminology.
- Identify missing safety and compatibility rules.
- Review approval gate semantics with maintainers and runtime implementers.
- Review RFC-0007 approval request, decision, evidence, scope, expiry, revocation, and enforcement boundary semantics.
- Review context source taxonomy, freshness rules, web boundaries, and MCP context/tool separation.
- Review memory sensitivity, ownership, allowed consumers, and cross-scope promotion rules.
- Review RFC-0008 memory retention, ownership, visibility, allowed consumers, allowed writers, correction, deletion, expiry, and audit expectations.
- Review RFC-0009 event envelope identity, actor, subject, correlation, causation, payload, audit, redaction, ordering, and extension expectations.
- Review model profile selection modes, pinned and floating references, constraints, fallback, and audit expectations.
- Review RFC-0010 provider preference, constraint, fallback, explainability, and runtime audit semantics.
- Review prompt set identifiers, revisions, source references, safety review status, and compatibility impact.
- Review retrieval source references, index versions, chunking, freshness, citations, sensitivity, and audit expectations.
- Review agent definition component references, lifecycle status, activation criteria, autonomy, and audit expectations.
- Review human override authority, interruption boundaries, fail-closed behavior, resume gates, and audit expectations.
- Review extension namespace ownership, lifecycle transitions, registry expectations, and unsupported-extension behavior.

Relevant docs: [Security Model](security-model.md), [Capability Model](capability-model.md), [Autonomy Model](autonomy-model.md), [Provider Abstraction](provider-abstraction.md), [Agent Assembly](agent-assembly.md), [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md), [Extension Model](extensions.md), [Integrations](integrations.md).

## Milestone 3: Schema Hardening

- Improve cross-manifest consistency.
- Document validation workflow and current validation limits.
- Review RFC-0005 validation strategy for syntax, schema, semantic, diagnostic, and runtime preflight boundaries.
- Add schema examples and negative cases.
- Review the initial ActorSet boundary cases before migrating another example.
- Review compact AgentSet and human override boundary cases before broader migration.
- Review active agent definition authority and derived Agent Assembly inspection
  evidence before broader migration.
- Define conformance expectations for validators.
- Refine draft conformance levels for manifests, validators, CLIs, runtimes, and extensions.

Relevant docs: [Validation](validation.md), [Conformance](conformance.md), [Compatibility](compatibility.md), [Schema Guide](../schemas/README.md), [Examples Guide](../examples/README.md).

## Milestone 4: Runtime Architecture Decision

- Compare implementation languages.
- Define reference CLI scope.
- Review RFC-0011 validation-only reference CLI command boundaries.
- Define security and extension loading boundaries.
- Decide packaging and conformance test strategy.

This milestone must happen before runtime implementation begins.

Relevant docs: [Architecture](architecture.md), [Runtime Options](runtime-options.md), [Provider Abstraction](provider-abstraction.md), [Security Model](security-model.md).

## Milestone 5: Reference CLI

Possible commands:

- `nexflow init`
- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`

The CLI should validate and inspect manifests only. It should not orchestrate real work.

Relevant docs: [Validation](validation.md), [Conformance](conformance.md), [Compatibility](compatibility.md).

## Milestone 6: Runtime Prototype

- Interpret workflows.
- Enforce approval gates.
- Emit audit events.
- Integrate with provider abstractions.
- Keep provider-specific logic isolated.

Relevant docs: [Architecture](architecture.md), [Autonomy Model](autonomy-model.md), [Approval Gates](approval-gates.md), [Event Model](events.md), [Integrations](integrations.md).

## Milestone 7: Ecosystem Split

Evaluate splitting into:

- NexFlow Spec
- NexFlow Runtime
- NexFlow Desktop
- NexFlow Cloud
