# Changelog

All notable changes to NexFlow will be documented in this file.

This project follows a specification-first process. Breaking changes must include migration notes.

## [Unreleased]

### Added

- Added a compact Solo Developer example with one human maintainer, one AI
  coding assistant, approval-gated repository changes, local context, a
  three-task workflow, review handoff, and audit event declarations. Its ten
  manifests intentionally omit provider and runtime configuration.
- Added schema-first `graph` to the repository CLI prototype, deriving static
  declaration nodes and selected reference edges from bounded inspection.
  Edges distinguish resolved, unresolved, ambiguous, and redacted targets while
  preserving Workflow scope. Focused graph checks run in CI. This is not an
  execution plan, full semantic graph, renderer, or reference CLI alpha.
- Added schema-first `inspect` to the repository CLI prototype, with Project
  summaries, declaration occurrences, and selected unresolved references for
  all 17 manifest kinds. Text and JSON preserve source pointers and workflow
  scope, omit free text and credential fields, and fail without partial output
  on resource or reference budget overflow. Focused inspection checks run in CI.
  This is not effective configuration, Agent Assembly, or a reference CLI alpha.
- Added opt-in `--format json` to the repository CLI prototype, with an
  independent `0.1-draft` output schema, structured diagnostics and check states,
  safe related locations, deterministic ordering, and explicit truncation.
  All command outcomes use one JSON result on stdout; default text output and
  exit meanings remain compatible. Focused diagnostic checks run in CI.
  This does not stabilize the catalog, release a CLI, or change manifest versions.
- Added a maintainer guide for change routing, synchronized specification
  surfaces, local validation, pull request review, RFC stages, release evidence,
  security corrections, and factual handoffs.
- Added structural `validate` to the unreleased repository CLI prototype,
  using bounded discovery and the repository-owned schemas for all 17 kinds.
  It checks formats without coercing, filling, or rewriting input, reports
  bounded and redacted `NF-SCHEMA` diagnostics, and returns failure for unsafe,
  unsupported, or invalid input. Focused CLI validation checks run in CI.
  This is not a reference CLI alpha, full semantic validation, or a runtime.
- Added a non-distributed repository CLI prototype with help, unreleased
  version identification, strict argument handling, explicit unsupported
  commands, and a discovery-only inventory. It does not select a runtime or
  replace the pending reference CLI architecture decision.
- Added bounded directory Project selection for exactly one `project.yaml` or
  `project.yml`, reusing explicit-file and Project-hint discovery without
  scanning unrelated files, expanding bundles, or executing manifests.
- Added discovery and CLI prototype regression checks to repository CI.

### Changed

- Advanced the experimental CLI output contract from `0.2-draft` to `0.3-draft`
  for successful static graph results. All commands emit the new version; no
  manifest `specVersion`, schema snapshot, or specification release changes.
- Advanced the experimental CLI output contract from `0.1-draft` to `0.2-draft`
  to represent successful inspection and its result shape. All commands emit
  the new version; migration requires updating the accepted output schema and
  version together. No manifest `specVersion` or specification release changes.
- Reduced Minimal Team from 17 manifests to a three-manifest Core Profile
  onboarding path with Project, ActorSet, and compact AgentSet. Its guide now
  gives a staged path to policy, work, data boundaries, and advanced agent
  versioning without implying execution or access.
- Consolidated repository syntax, manifest discovery, example coverage, schema
  compilation, and structural validation in the Node-based `npm run validate`
  command; removed the redundant legacy smoke command and synchronized CI and
  contributor documentation.
- Refreshed the README status to distinguish the frozen `v0.1.0` release
  baseline from unreleased `0.2` validation and conformance work.
- Hardened discovery against unsupported Project versions, inherited hint
  names, unsafe YAML, invalid resource limits, oversized reads, and symlinked
  source paths; diagnostics no longer echo raw parser or filesystem errors.

## [0.1.0] - 2026-08-23

### Changed

- Promoted the reviewed `v0.1.0-rc.1` specification snapshot after repeating
  the full repository check set against the exact stable commit.
- Synchronized release status, roadmap priorities, and historical version
  rationale discovered during post-publication candidate review.
- Preserved manifest `specVersion: "0.1"` and every documented limitation; this
  release does not add runtime, provider, integration, or orchestration support.

## [0.1.0-rc.1] - 2026-08-23

This release candidate records the first evaluated `0.1` repository snapshot.
Manifest `specVersion` remains `"0.1"`; the release does not imply runtime,
provider, integration, or orchestration support.

### Added

- Added a Runtime Architecture Decision review framework with pinned evidence
  requirements, eleven mandatory gates, blocker and follow-up classification,
  a reproducible review record, explicit acceptance rules, and a factual
  `not-ready` baseline without selecting a language or implementing a runtime.
- Defined a language-neutral CLI and runtime responsibility boundary with
  command-specific effect budgets, offline and filesystem rules, static versus
  runtime fact ownership, explicit runtime-preflight separation, inert
  extension handling, safe shared-library dependencies, deterministic output,
  and independent `NF-CLI` and `NF-RUNTIME` conformance claims without
  implementing a CLI or runtime.
- Defined a runtime-neutral event and audit storage boundary that separates
  event declarations, event instances, audit records, evidence, projections,
  receipts, stores, indexes, and telemetry; requires redaction before
  persistence or export; and documents ordering, duplicates, durability,
  retention, deletion, access, integrity, gaps, recovery, compatibility, and
  conformance without selecting or implementing storage technology.
- Defined a runtime-neutral provider adapter boundary with host-owned selection
  and fallback, explicit support records and invocation plans, deterministic
  request translation, mediated credentials and network access, tool and
  streaming boundaries, normalized failures and responses, retry rules, audit
  explanations, and conformance requirements without implementing provider
  clients or runtime calls.
- Added a central draft diagnostic code catalog with status and family
  registries, severity semantics, suggested messages, safe remediation,
  deterministic output and redaction guidance, implemented discovery and Core
  Profile codes, candidate schema, reference, bundle, and effective
  configuration codes, and explicit reserved areas without claiming a stable
  CLI contract.
- Defined a runtime-neutral extension loading boundary with separate project
  and implementation discovery, exact immutable resolution, fail-closed
  unsupported handling, host isolation, per-operation authorization, update
  controls, audit evidence, and conformance requirements without implementing a
  loader or registry.
- Added a neutral Runtime Language Evaluation Matrix for TypeScript, Python,
  Rust, and Go with hard gates, weighted criteria, identical validation-only
  prototypes, evidence records, target measurements, and no language choice.
- Froze the future `0.1` candidate scope with a 17-kind manifest baseline,
  explicit treatment for RFC-0001 through RFC-0019, migration-only and deferred
  surfaces, five remaining blockers, and scope-change rules.
- Added a licensing and patent rationale that retains MIT for the `0.1`
  specification phase, records the Apache-2.0 patent tradeoff, and defines
  mandatory review triggers without changing the repository license.
- Added draft CloudEvents 1.0.2 and OpenTelemetry EventRecord mapping profiles
  with canonical event names, field projections, severity normalization,
  trace-context separation, import authority, and transport and storage
  boundaries.
- Added a fixture inventory and cross-linked schema, validation, conformance,
  fixture, and example guides so validation evidence is easier to discover and
  interpret without overstating its scope.
- Added the optional `ActorSet` manifest, shared typed-reference primitives,
  kind-specific actor relationships, and an identity-preserving Minimal Team
  migration guide.
- Extended semantic reference smoke checks with authoritative ActorSet
  resolution, explicit agent bridge validation, relationship references, and
  cycle detection.
- Added focused ActorSet schema boundary checks to the repository CI workflow.
- Added a structured, fail-closed outbound network access policy model with
  actor, purpose, destination, approval, transport, audit, and legacy migration
  semantics.
- Added the standard `access_network` capability to the software team example
  and semantic smoke checks for network policy references.
- Added a structured human override project policy with typed human-controlled
  authorities, closed narrowing operations, fail-closed response,
  approval-gated resume, required audit events, a Minimal Team example, and
  focused boundary checks.
- Added RFC-0017 for human override authority, response, resume, audit,
  compatibility, and future runtime boundaries.
- Added focused AgentSet identity boundary checks and an identity migration
  guide.
- Added authoritative unique-active agent definition selection semantics,
  selection audit events, an effective configuration guide, and focused
  structural and selection checks.
- Added cataloged negative schema fixtures for required fields, enum values, ID
  formats, and unknown manifest kinds, with a dedicated CI command that verifies
  each expected rejection.
- Defined Agent Assembly as the read-only inspection projection of Effective
  Agent Configuration, including deterministic derivation, authority,
  provenance, blocker, serialization, security, compatibility, and conformance
  boundaries.
- Added a P0-P3 semantic reference inventory covering target namespaces,
  deterministic resolution, current smoke coverage, known gaps, deferred
  ambiguous fields, non-reference lookalikes, and maintenance rules.
- Added a standalone typed-reference guide and focused schema checks covering 53
  accepted and rejected cases across shared generic, scoped, transitional,
  actor, agent, and extension reference definitions.
- Added deterministic workflow-wide step and assembly-wide task artifact
  namespace contracts with 13 focused positive and negative cases.
- Added typed approval gate targets with closed resource kinds, explicit workflow
  scope, 16 focused schema cases, semantic target resolution, and migration
  guidance for deprecated ambiguous `appliesTo`.
- Added a closed provider feature vocabulary with 11 focused schema cases and
  an explicit boundary from project action capabilities and permissions.
- Added a standalone `0.1` conformance claim schema, synchronized YAML and
  Markdown templates, evidence and limitation rules, publication guidance, and
  15 focused positive and negative format checks including profile qualifiers.
- Added a machine-readable Core Profile definition with required Project and
  participant slots, optional module qualifiers, dependency rules, fail-closed
  omission semantics, and 16 focused conformance cases.
- Added RFC-0018 and a machine-readable experimental `io.nexflow.mcp` extension
  profile with explicit context/action, capability, permission, approval,
  network, credential, audit, and fail-closed boundaries.
- Added 10 focused MCP profile and ContextSet checks plus a complete Software
  Team MCP extension, capability, permission, and source binding.
- Added a structured provider constraint vocabulary covering training use,
  residency, tool use, sensitivity, cost, latency, deployment, network posture,
  approval, and retention, with 17 focused schema cases.
- Added a standalone `0.1` candidate readiness record with eight explicit gates,
  evidence requirements, release decision guards, a non-claiming template, and
  14 focused positive and negative checks wired into CI.
- Added explicit local manifest discovery for file lists and Project source
  hints, conservative document cardinality, multiple unique Workflow inventory,
  a five-document focused fixture, and 24 boundary checks wired into CI.
- Added RFC-0019, a normative MCP/A2A ownership map, and the experimental
  `io.nexflow.a2a` policy profile for external agent, skill, message, task, and
  artifact boundaries without copying either protocol.
- Added 13 focused A2A profile checks for external authority, opaque identity,
  work and artifact separation, permissions, network callbacks, credentials,
  audit expectations, and fail-closed behavior, wired into CI.

### Changed

- Prepared the `0.3` architecture checkpoint as a blocker-bearing status
  snapshot: neutral evaluation, CLI/runtime, extension, provider, audit, and
  review boundaries are documented, while the decision RFC, comparable
  prototypes, package model, security evidence, conformance strategy, target
  artifacts, and ownership evidence remain unresolved. The checkpoint does not
  publish a release, change `specVersion`, select a language, or unblock
  implementation.
- Refreshed the public architecture status and roadmap after the decision review:
  the outcome remains `not-ready`, evidence-closure work is ordered, each review
  outcome has an explicit next path, and CLI or runtime implementation remains
  blocked until a revision-pinned RFC is accepted.
- Refreshed the README support snapshot, navigation, near-term priorities, and
  known limitations using evidence from the compatibility matrix and repository
  validation workflow.
- Added machine-readable examples to common typed-reference definitions and
  wired the focused primitive check into CI.
- Extended semantic reference smoke checks to reject duplicate workflow stages,
  workflow steps, and task artifacts while resolving step dependencies and
  handoff artifacts through the accepted namespaces.
- Migrated maintained approval gate target examples from scalar `appliesTo`
  values to exact typed task and context-source references.
- Migrated maintained provider declarations from ambiguous `capabilities` to
  `features`; the legacy field remains structurally valid but deprecated.
- Migrated maintained provider training policy from deprecated
  `allowTrainingUse` booleans to explicit `trainingUse` values and documented
  provider-versus-model-profile constraint composition.
- Tightened MCP ContextSet sources to require server and surface inventory;
  tool and action surfaces now require a non-empty allow-list and explicit
  approval posture in the draft schema.
- Removed the unresolvable AgentDefinition `memoryPolicyRef` draft field,
  established `memoryScopes` to `MemorySet` as the only core memory selection
  contract, and added migration guidance plus focused rejection checks.
- Made `Project.manifests` an optional source-hint map so reduced Core Profile
  projects do not require empty files for unadopted modules; existing complete
  maps remain valid.
- Added migration-compatible plural `Project.manifests.workflows` source hints
  while preserving the singular `workflow` form and rejecting coexistence.
- Added required explicit `scope.profiles` qualifiers to the unreleased
  `claimVersion: "0.1"` conformance claim format and synchronized both
  templates and focused checks.
- Added a roadmap checkpoint separating candidate evidence, release decisions,
  known draft boundaries, and post-`0.1` work.
- Simplified the required AgentSet shape to stable AI identity, role,
  description, responsibilities, and skills while keeping duplicated behavior
  and access fields schema-valid but deprecated for compatibility.
- Migrated the Minimal Team AgentSet to compact identity and extended semantic
  checks for human override authorities, resume gates, and audit events.
- Tightened active agent definitions to require complete component, approved
  review, compatibility, activation, and audit metadata while keeping draft
  definitions authoring-compatible.
- Activated the Minimal Team definition, prompt set, and retrieval profile as
  the maintained authority example and extended semantic checks for active
  lifecycle compatibility.

### Candidate Notes

- The exact release commit, evaluated readiness record, complete check output,
  and cross-surface review are attached to the `v0.1.0-rc.1` GitHub release.
- The `0.3` architecture preparation checkpoint is prepared but not passed. It
  is a public evidence and blocker summary, not a release tag or Runtime
  Architecture Decision.
- The public version line remains unchanged: `0.3` covers semantic consistency,
  while Runtime Architecture Decision readiness remains a `0.4` outcome.
- Reference CLI work remains blocked until the decision review reaches
  `accepted`; the checkpoint alone grants no implementation or conformance
  status.
- The release candidate remains a draft specification release rather than
  a runtime, CLI, provider integration, or orchestration release.
- Current repository evidence covers 17 schema-backed manifest kinds, 7
  maintained project examples, 113 structurally validated manifests, and
  limited semantic reference smoke checks.
- Draft RFCs remain proposals unless their decisions are accepted and reflected
  consistently in documentation, schemas, examples, compatibility guidance,
  migrations, and release notes.
- Release evidence records the readiness outcome, exact commit, validation
  results, compatibility notes, known limitations, and blocker closure without
  changing manifest `specVersion`.

## [0.1.0-draft] - 2026-05-29

### Changed

- Normalized actor and agent vocabulary, agent identity/definition/assembly distinctions, permission effect language, event type terminology, schema enum descriptions, example wording, and draft RFC references.
- Upgraded the schema validation workflow to run repository smoke checks and full example manifest schema validation.
- Tightened common ID syntax, documented exact reference resolution, and separated dotted event types from entity IDs across schemas and examples guidance.
- Aligned extension and context schema vocabularies with retrieval profiles and sanitized product research content used by the reference examples.
- Declared referenced `agent.started` audit events across the minimal, software, and startup examples and clarified project-level event reference resolution.

### Added

- Compatibility matrix covering current spec, schema, example, validator, CLI, runtime, and extension support without implying unimplemented conformance.
- `0.1` readiness checklist covering docs, schemas, examples, validation, RFCs, compatibility, safety, limitations, blockers, and release evidence.
- Semantic reference smoke command for checking core cross-manifest references in examples without claiming full semantic validation.
- Public release plan describing readiness criteria from `0.1` draft through `1.0` without publishing date commitments.
- Reproducible, lockfile-pinned validation command for checking every reference manifest against its draft JSON Schema.
- Repository smoke script for schema JSON syntax, example YAML syntax, and manifest kind discovery checks.
- Initial specification-first repository structure.
- Core documentation set under `docs/`.
- Draft conformance vocabulary for manifests, validators, CLIs, runtimes, and extensions.
- Validation workflow guidance for schema and future semantic checks.
- Schema guide for schema scope, update rules, and validation boundaries.
- Schema design notes explaining schemas as practical validation aids rather than complete formal semantics or runtime enforcement.
- Examples guide for reference team selection and manifest file sets.
- Detailed example matrix for comparing complexity, context sources, autonomy posture, approval gates, integrations, validation focus, and learning path.
- Example consistency checklist for IDs, references, capabilities, permissions, context, memory, events, safety, and local checks.
- Clarified capability and permission separation with allow, deny, and approval-required examples.
- Approval gate semantics for approvers, decisions, evidence, scope, expiry, revocation, and runtime expectations.
- Expanded context source taxonomy with source fields, freshness guidance, web boundaries, MCP metadata, and classification rules.
- Expanded memory sensitivity rules with ownership, allowed writers, update modes, prohibited content, audit events, and cross-scope leakage guidance.
- Glossary for stable specification vocabulary.
- Cross-linked README, docs index, roadmap, and manifest reference across core models, validation, conformance, schemas, examples, and runtime planning docs.
- Draft RFC-0003 for conformance levels and compatibility impact vocabulary.
- Draft RFC-0004 for agent definition versioning across models, prompts, retrieval profiles, permissions, memory, autonomy, and extensions.
- Draft RFC-0005 for validation strategy across syntax checks, JSON Schema validation, manifest inventory, semantic validation, diagnostics, and safety boundaries.
- Draft RFC-0006 for extension namespace ownership, lifecycle transitions, registry expectations, compatibility, and safety boundaries.
- Draft RFC-0007 for approval gate declarations, requests, decisions, evidence, scope, expiry, revocation, evaluation order, and future enforcement boundaries.
- Draft RFC-0008 for memory retention, ownership, visibility, consumers, writers, sensitivity, promotion, correction, deletion, expiry, audit, and future runtime boundaries.
- Draft RFC-0009 for event envelope identity, actor, subject, correlation, causation, payload, audit, redaction, ordering, and future runtime boundaries.
- Draft RFC-0010 for provider preferences, constraints, model profile selection, fallback, explainability, and future runtime audit boundaries.
- Draft RFC-0011 for validation-only reference CLI scope across `validate`, `inspect`, `graph`, and `init`.
- Draft RFC-0012 for optional manifest bundling, expansion, validation, compatibility, and safety boundaries.
- Draft RFC-0013 for first-class human, agent, automation, service, and authority actors, including identity, delegation, validation, compatibility, and migration boundaries.
- Draft RFC-0014 for effective agent configuration source-of-truth, definition selection, domain-specific precedence, conservative policy composition, validation, audit, and migration boundaries.
- Draft RFC-0015 for typed resource references, target-kind and scope namespaces, deterministic resolution, ambiguity diagnostics, and migration from unqualified IDs.
- Draft RFC-0016 for a minimum core profile, optional modules, dependency-driven incremental adoption, multiple workflows, and logical manifest discovery independent of file layout.
- Foundational cross-RFC review aligning the Actor Model, Effective Agent Configuration, Typed References, and Core Profile proposals with safety invariants, blockers, migration gates, and implementation order.
- Draft agent definition vocabulary for versioned behavioral releases assembled from model, prompt, retrieval, permission, capability, context, memory, autonomy, and extension references.
- Draft model profile vocabulary for provider-neutral model selection, pinned and floating references, constraints, fallback, review triggers, and audit expectations.
- Draft prompt set vocabulary for prompt identifiers, revisions, source references, ownership, safety review, compatibility impact, and audit expectations.
- Draft retrieval profile vocabulary for context source references, index versions, chunking, freshness, citations, sensitivity, review triggers, and audit expectations.
- Initial Agent Assembly documentation connecting agent definitions, model profiles, prompt sets, retrieval profiles, permissions, context, memory, autonomy, extensions, versioning, review, compatibility, and future audit expectations.
- Expanded minimal team example notes with learning goals, reading path, reference chain, safety notes, and local checks.
- Strengthened software team example lifecycle, pull request review evidence, QA handoffs, and documentation handoff notes.
- Refined startup team example product approval gates, research context, handoffs, and release readiness evidence.
- Expanded enterprise team example with audit-ready evidence, compliance signoff, restricted context, restricted memory, and release controls.
- Expanded product delivery team example with many-to-many handoffs, explicit product acceptance, quality evidence, and launch readiness details.
- Added open-source maintainer example for issue triage, maintainer scope decisions, documentation updates, PR review, and release notes.
- Added research lab example for literature review, experiment planning, reproducibility artifacts, citations, publication claims, and research memory limits.
- Draft JSON Schemas for core manifests.
- Reference examples for minimal, software, startup, enterprise, product delivery, open-source maintainer, and research lab teams.
- Governance and RFC process.
- MIT License.
- Contributor, security, and agent guidance.
