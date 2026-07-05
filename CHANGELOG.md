# Changelog

All notable changes to NexFlow will be documented in this file.

This project follows a specification-first process. Breaking changes must include migration notes.

## [0.1.0-draft] - 2026-05-29

### Added

- Initial specification-first repository structure.
- Core documentation set under `docs/`.
- Draft conformance vocabulary for manifests, validators, CLIs, runtimes, and extensions.
- Validation workflow guidance for schema and future semantic checks.
- Schema guide for schema scope, update rules, and validation boundaries.
- Examples guide for reference team selection and manifest file sets.
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
- Draft agent definition vocabulary for versioned behavioral releases assembled from model, prompt, retrieval, permission, capability, context, memory, autonomy, and extension references.
- Draft model profile vocabulary for provider-neutral model selection, pinned and floating references, constraints, fallback, review triggers, and audit expectations.
- Draft prompt set vocabulary for prompt identifiers, revisions, source references, ownership, safety review, compatibility impact, and audit expectations.
- Draft retrieval profile vocabulary for context source references, index versions, chunking, freshness, citations, sensitivity, review triggers, and audit expectations.
- Agent assembly checkpoint documentation tying agent definitions, model profiles, prompt sets, retrieval profiles, permissions, context, memory, autonomy, extensions, versioning, review, compatibility, and future audit expectations together.
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
