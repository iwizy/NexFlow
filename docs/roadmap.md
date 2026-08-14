# Roadmap

NexFlow is specification-first. Runtime work starts only after the core model is coherent.

For version-by-version readiness criteria from `0.1` draft through `1.0`, see the [Release Plan](release-plan.md).

For the first candidate review, see the [0.1 Readiness Checklist](readiness-checklist.md).

The exact feature boundary is frozen in the
[0.1 Candidate Scope](0.1-scope.md).

## Current Checkpoint: `0.1` Candidate Preparation

Status: preparation in progress. No `0.1` candidate tag has been published.

The repository currently provides the following candidate evidence:

- a documented draft specification and manifest reference
- practical JSON Schemas for 17 manifest kinds plus common definitions
- 7 maintained project examples containing 113 schema-backed manifests
- reproducible schema syntax, structural validation, and semantic reference
  smoke commands
- a prioritized semantic reference inventory with explicit current coverage,
  gaps, and deferred ambiguous fields
- explicit conformance vocabulary, standalone claim templates, and a current
  compatibility matrix
- a public readiness checklist, release plan, known limitations, and governance
  process
- a cross-RFC review for the Actor Model, Effective Agent Configuration, Typed
  References, and Core Profile proposals
- an initial ActorSet schema and Minimal Team migration using shared typed
  reference contracts
- a compact AgentSet migration with legacy compatibility checks
- an explicit fail-closed human override policy, audit vocabulary, and focused
  schema checks without runtime enforcement

Scope is frozen, but candidate readiness remains blocked. Maintainers still
need to select an exact commit and tag, evaluate the readiness record, capture
the complete check set against that commit, complete the cross-surface review,
and publish a concrete private vulnerability reporting path. The blocker IDs
and closure evidence are maintained in the
[0.1 Candidate Scope](0.1-scope.md).

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
[0.1 Candidate Scope](0.1-scope.md),
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
boundaries.

Agent Assembly checkpoint: its documentation now defines a derived inspection
projection with authority, provenance, blocker, serialization, security, and
conformance boundaries. A resolver and machine-readable output remain future
tooling.

Typed reference primitive checkpoint: shared generic, scoped, transitional, and
kind-specific shapes now have lexical rules, migration guidance, and 53 focused
structural cases. Deliberate field normalization and complete semantic
resolution remain the next foundational slices.

Work reference namespace checkpoint: workflow steps now resolve in one
workflow-wide namespace across stages, while task artifacts resolve in one
assembly-wide namespace across tasks. Thirteen focused cases and repository
semantic smoke checks cover duplicate and unresolved references; graph and
provenance validation remain future work.

Core Profile checkpoint: the minimum Project and participant slots, ActorSet
authority with AgentSet fallback, optional module qualifiers, transitive
dependency policy, fail-closed omission, reduced Project source hints, and 16
focused cases are implemented.

Manifest discovery checkpoint: explicit local files and Project source hints,
the plural `manifests.workflows` shape, conservative document cardinality,
multiple unique Workflow inventory, workflow-local step namespaces, and 24
focused cases are implemented. Directory scanning, general source indexes,
bundle equivalence, stable CLI diagnostics, complete dependency closure, and
runtime loading remain future work.

## Milestone 2: Community Review

- Collect feedback from agent tool builders, open-source maintainers, startups, enterprises, and researchers.
- Refine terminology.
- Identify missing safety and compatibility rules.
- Review approval gate semantics with maintainers and runtime implementers.
- Review RFC-0007 approval request, decision, evidence, scope, expiry, revocation, and enforcement boundary semantics.
- Review context source taxonomy, freshness rules, web boundaries, and MCP context/tool separation.
- Review MCP/A2A protocol ownership, remote identity, task correlation,
  artifact provenance, callback, and transitive-authority boundaries.
- Review memory sensitivity, ownership, allowed consumers, and cross-scope promotion rules.
- Review RFC-0008 memory retention, ownership, visibility, allowed consumers, allowed writers, correction, deletion, expiry, and audit expectations.
- Review RFC-0009 event envelope identity, actor, subject, correlation,
  causation, payload, audit, redaction, ordering, extension expectations, and
  CloudEvents and OpenTelemetry mapping profiles.
- Review model profile selection modes, pinned and floating references, constraints, fallback, and audit expectations.
- Review RFC-0010 provider preference, constraint, fallback, explainability, and runtime audit semantics.
- Review structured provider constraint composition, legacy training-use
  migration, unknown-fact handling, and static-versus-live evidence boundaries.
- Maintain the closed provider feature vocabulary and its separation from
  project action capabilities as provider selection evolves.
- Review prompt set identifiers, revisions, source references, safety review status, and compatibility impact.
- Review retrieval source references, index versions, chunking, freshness, citations, sensitivity, and audit expectations.
- Review agent definition component references, lifecycle status, activation criteria, autonomy, and audit expectations.
- Review human override authority, interruption boundaries, fail-closed behavior, resume gates, and audit expectations.
- Review extension namespace ownership, lifecycle transitions, registry expectations, and unsupported-extension behavior.
- Review RFC-0018 MCP context/action mapping, allow-lists, protocol-version
  claims, network transports, and failure behavior without implementing MCP.
- Review RFC-0019 A2A external identity, skill, message, task, artifact,
  network, credential, and conformance boundaries without implementing A2A.

Relevant docs: [Security Model](security-model.md), [Capability Model](capability-model.md), [Autonomy Model](autonomy-model.md), [Provider Abstraction](provider-abstraction.md), [Agent Assembly](agent-assembly.md), [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md), [Extension Model](extensions.md), [MCP And A2A Boundaries](mcp-a2a-boundaries.md), [Integrations](integrations.md).

## Milestone 3: Schema Hardening

- Improve cross-manifest consistency.
- Document validation workflow and current validation limits.
- Review RFC-0005 validation strategy for syntax, schema, semantic, diagnostic, and runtime preflight boundaries.
- Maintain cataloged negative schema fixtures and add positive schema fixtures.
- Review the initial ActorSet boundary cases before migrating another example.
- Review compact AgentSet and human override boundary cases before broader migration.
- Review active agent definition authority and the documented Agent Assembly
  projection before standardizing machine-readable inspection output.
- Maintain the P0-P3 semantic reference inventory as fields are normalized and
  smoke coverage expands.
- Maintain focused typed-reference primitive checks and migrate fields only
  after their target-kind, scope, and compatibility contracts are explicit.
- Keep approval gate target kinds, workflow scope, migration diagnostics, and
  semantic resolution aligned with broader approval coverage work.
- Keep workflow step and artifact namespace checks aligned with discovery,
  graph, handoff, and migration decisions.
- Define conformance expectations for validators.
- Refine draft conformance levels for manifests, validators, CLIs, runtimes, and extensions.
- Maintain the versioned machine-readable and human-readable conformance claim
  templates as validation behavior becomes more precise.

Relevant docs: [Validation](validation.md), [Conformance](conformance.md),
[Conformance Claims](conformance-claims.md),
[Approval Gate Targets](approval-gate-targets.md),
[Compatibility](compatibility.md), [Schema Guide](../schemas/README.md),
[Examples Guide](../examples/README.md).

## Milestone 4: Runtime Architecture Decision

- Compare TypeScript, Python, Rust, and Go through identical validation-only
  prototypes, hard gates, weighted criteria, and reviewable evidence.
- Define reference CLI scope.
- Review RFC-0011 validation-only reference CLI command boundaries.
- Define security and extension loading boundaries.
- Decide packaging and conformance test strategy.

This milestone must happen before runtime implementation begins.

Relevant docs: [Architecture](architecture.md), [Runtime Options](runtime-options.md),
[Runtime Language Evaluation Matrix](language-evaluation-matrix.md),
[Extension Loading Boundary](extension-loading-boundary.md),
[Provider Abstraction](provider-abstraction.md), [Security Model](security-model.md).

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
