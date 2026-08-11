# Changelog

All notable changes to NexFlow will be documented in this file.

This project follows a specification-first process. Breaking changes must include migration notes.

## [Unreleased]

This section records preparation for a possible `0.1` candidate. No candidate
tag or release has been published, and manifest `specVersion` remains `"0.1"`.

### Added

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

- The candidate, if approved, remains a draft specification release rather than
  a runtime, CLI, provider integration, or orchestration release.
- Current repository evidence covers 17 schema-backed manifest kinds, 7
  maintained project examples, 113 structurally validated manifests, and
  limited semantic reference smoke checks.
- Draft RFCs remain proposals unless their decisions are accepted and reflected
  consistently in documentation, schemas, examples, compatibility guidance,
  migrations, and release notes.
- A candidate tag requires a recorded readiness outcome, commit hash, validation
  results, compatibility notes, known limitations, and unresolved RFCs or
  blockers.

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
