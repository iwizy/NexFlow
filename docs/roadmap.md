# Roadmap

NexFlow is specification-first. Runtime work starts only after the core model is coherent.

For version-by-version readiness criteria from `0.1` draft through `1.0`, see the [Release Plan](release-plan.md).

For the first candidate review, see the [0.1 Readiness Checklist](readiness-checklist.md).

The exact feature boundary is frozen in the
[0.1 Candidate Scope](0.1-scope.md).

## Current Checkpoint: `v0.1.0`

Status: draft specification foundation released. Candidate review is complete;
`0.2` validation and conformance work is next.

The repository currently provides the following candidate evidence:

- a documented draft specification and manifest reference
- practical JSON Schemas for 17 manifest kinds plus common definitions
- a published `v0.1.0` baseline of 7 project examples containing 113
  schema-backed manifests; the Unreleased line reduces Minimal Team to a
  three-manifest Core Profile path and currently validates 99 manifests
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

Candidate readiness was evaluated against one exact commit. The completed
readiness record, command output, and cross-surface review are attached to the
[`v0.1.0` release](https://github.com/iwizy/NexFlow/releases/tag/v0.1.0).
The blocker IDs and closure evidence are maintained in the
[0.1 Candidate Scope](0.1-scope.md). Candidate publication does not resolve the
separate Runtime Architecture Decision, whose current outcome remains
`not-ready`.

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

Status: `v0.1.0` released; post-release corrections follow the published
compatibility and migration rules.

Relevant docs: [Concepts](concepts.md), [Glossary](glossary.md), [Manifest Reference](manifest-reference.md), [Actor Model](actor-model.md), [Actor Model Migration](actor-model-migration.md), [Agent Identity Migration](agent-identity-migration.md), [Agent Definitions](agent-definitions.md), [Human Override](human-override.md), [Context Model](context-model.md), [Memory Model](memory-model.md), [Approval Gates](approval-gates.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md).

Agent definition authority checkpoint: implemented in documentation, schemas,
and focused repository checks. The unique unscoped active definition owns
requested behavior; Minimal Team remains a smaller identity-first onboarding
path and points to the versioning sequence.

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

Manifest discovery checkpoint: explicit local files, Project source hints,
bounded selection of one root `project.yaml` or `project.yml`,
the plural `manifests.workflows` shape, conservative document cardinality,
multiple unique Workflow inventory, workflow-local step namespaces, and
focused cases are implemented. Directory scanning, general source indexes,
bundle equivalence, stable CLI diagnostics, complete dependency closure, and
runtime loading remain future work.

A [disposable repository CLI prototype](cli-prototype.md) exercises command
dispatch, discovery inventory, and local JSON Schema validation. It is not a
reference CLI alpha or a completed language-evaluation candidate; the architecture decision is still
`not-ready`, and no runtime or package layout has been selected.

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
- Maintain the diagnostic code catalog as draft codes gain fixtures,
  structured details, implementation evidence, and compatibility status.
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
[Diagnostic Code Catalog](diagnostic-code-catalog.md),
[Conformance Claims](conformance-claims.md),
[Approval Gate Targets](approval-gate-targets.md),
[Compatibility](compatibility.md), [Schema Guide](../schemas/README.md),
[Examples Guide](../examples/README.md).

## `0.3` Architecture Preparation Checkpoint

Checkpoint state: **prepared with decision blockers**.

This checkpoint records architecture boundary work completed alongside the
`0.3` semantic-consistency workstream. It does not redefine the public version
line: the [Release Plan](release-plan.md) keeps `0.3` focused on semantic
consistency and `0.4` focused on Runtime Architecture Decision readiness.

Preparing this checkpoint does not publish a `0.3` release, change manifest
`specVersion: "0.1"`, accept a Runtime Architecture Decision, select an
implementation language, or authorize a CLI or runtime package.

### Checkpoint Evidence

| Area | Current state | Evidence |
| --- | --- | --- |
| Language evaluation | Ready as a neutral process; no candidate scored or selected | [Runtime Language Evaluation Matrix](language-evaluation-matrix.md) |
| CLI/runtime separation | Command effect budgets and static-versus-runtime fact ownership specified | [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) |
| Extension loading | Runtime-neutral discovery, verification, isolation, activation, and authorization boundary specified | [Extension Loading Boundary](extension-loading-boundary.md) |
| Provider adapters | Host-owned selection and fallback plus bounded adapter responsibilities specified | [Provider Adapter Boundary](provider-adapter-boundary.md) |
| Event and audit storage | Authority, redaction, ordering, retention, durability, and failure boundary specified | [Event And Audit Storage Boundary](event-audit-storage-boundary.md) |
| Decision governance | Mandatory evidence, review gates, blocker classes, and acceptance rule published | [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md) |
| Public status | Architecture outcome and outcome-dependent next work documented as `not-ready` | [Architecture](architecture.md), [Runtime Options](runtime-options.md) |

### Checkpoint Blockers

The checkpoint cannot become an accepted architecture decision because:

- no Runtime Architecture Decision RFC proposes one language, architecture
  layout, package ownership model, and exact target matrix
- TypeScript, Python, Rust, and Go do not have comparable prototype evidence,
  completed hard-gate results, scorecards, or reviewer reconciliation
- package boundaries and cross-package compatibility remain undecided
- complete threat, credential, and conformance test strategies are not
  available as pinned decision evidence
- no candidate has demonstrated target artifacts, signing, provenance,
  installation, upgrade, rollback, or accepted maintenance ownership

The authoritative blocker and acceptance rules remain in the
[Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md).
This checkpoint summarizes them; it does not create a second decision process.

### Exit Statement

The `0.3` architecture preparation checkpoint is ready to publish as a factual
status snapshot. It is **not ready to pass** the Runtime Architecture Decision
gate. Milestone 4 remains in evidence preparation, and Milestone 5 Reference
CLI work must not begin until a revision-pinned decision RFC reaches
`accepted`.

## Milestone 4: Runtime Architecture Decision

Status: evidence preparation. The published review outcome is `not-ready`; no
runtime language, package layout, supported target matrix, or implementation
authorization has been accepted.

### Completed Review Inputs

- neutral hard gates, weighted criteria, and a common validation-only prototype
  contract for TypeScript, Python, Rust, and Go
- validation-only CLI command scope and effect budgets
- runtime-neutral extension loading, provider adapter, and event and audit
  storage boundaries
- mandatory architecture review gates, evidence rules, blocker classes, and
  acceptance criteria

These inputs constrain a future decision. They are not a substitute for the
decision RFC or candidate evidence.

### Open Acceptance Blockers

- no Runtime Architecture Decision RFC proposes a language, architecture
  layout, package ownership, and exact release targets
- no comparable candidate prototypes, hard-gate reports, weighted scorecards,
  target measurements, or reviewer reconciliation records are published
- package boundaries, cross-package version ownership, and distribution
  mechanisms remain undecided
- complete runtime threat and credential boundaries are not available as
  decision evidence
- CLI, runtime, and extension conformance test ownership is not complete
- artifact signing, provenance, installation, upgrade, rollback, and
  maintenance ownership have not been demonstrated

### Decision Closure Sequence

1. Publish a draft decision RFC that states the candidate architectures,
   mandatory decisions, non-goals, and evidence still required.
2. Complete the package layout, threat, credential, and conformance strategy
   inputs without choosing a language by assumption.
3. Freeze one specification and fixture revision for all candidate prototypes.
4. Run the common prototype, target, security, supply-chain, distribution, and
   maintenance evaluations for every candidate.
5. Reconcile independent reviewer scorecards and record ties, dissent,
   confidence, failed gates, and residual risks.
6. Review the pinned RFC and evidence against every mandatory gate.
7. Record exactly one decision outcome before changing implementation status.

### Outcome-Dependent Work

| Review outcome | Permitted next work |
| --- | --- |
| `not-ready` | Close the recorded blockers and repeat the review. Do not start CLI or runtime implementation. |
| `changes-requested` | Revise the proposal or evidence within the recorded scope, then repeat all affected gates. |
| `accepted` | Synchronize architecture, runtime options, compatibility, release, and conformance documents to the exact accepted revision before opening implementation work. |
| `rejected` | Do not implement the rejected proposal; document whether a materially different RFC will follow. |
| `superseded` | Continue only from the newer reviewed RFC and preserve the earlier decision record. |

Even after `accepted`, implementation is limited to the scope authorized by the
RFC. A validation-focused CLI does not authorize orchestration, and a runtime
architecture choice does not create an `NF-RUNTIME` conformance claim.

### Milestone Scope

- Compare TypeScript, Python, Rust, and Go through identical validation-only
  prototypes, hard gates, weighted criteria, and reviewable evidence.
- Define reference CLI scope.
- Review RFC-0011 validation-only reference CLI command boundaries.
- Freeze CLI command effect budgets and separation from runtime preflight,
  executable extensions, credentials, network access, and shared runtime code.
- Define security and extension loading boundaries.
- Define the provider adapter boundary between host-owned selection and
  provider-specific invocation.
- Define the event and audit storage boundary for authority, redaction,
  ordering, retention, integrity, access, durability, and failures.
- Decide packaging and conformance test strategy.
- Review the decision RFC against the
  [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md),
  pin all evidence revisions, close every blocker, and record an explicit
  outcome before implementation begins.

This milestone must reach an explicit `accepted` outcome before reference CLI
or runtime implementation begins.

Relevant docs: [Architecture](architecture.md), [Runtime Options](runtime-options.md),
[Runtime Language Evaluation Matrix](language-evaluation-matrix.md),
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md),
[Extension Loading Boundary](extension-loading-boundary.md),
[Provider Adapter Boundary](provider-adapter-boundary.md),
[Event And Audit Storage Boundary](event-audit-storage-boundary.md),
[Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md),
[Provider Abstraction](provider-abstraction.md), [Security Model](security-model.md).

## Milestone 5: Reference CLI

Possible commands:

- `nexflow init`
- `nexflow validate`
- `nexflow inspect`
- `nexflow graph`

The CLI should validate and inspect manifests only. It should not orchestrate real work.
Its commands must preserve the offline, filesystem, process, extension,
credential, and runtime-preflight limits in the
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md).

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
