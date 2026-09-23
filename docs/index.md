# NexFlow Documentation

NexFlow is an open specification and reference framework for describing AI
developer teams. The documentation is the canonical source for the
specification. Schemas, examples, profiles, and repository tools provide
evidence for the written model; they do not replace it.

## Choose A Path

Start with one route and use the catalog below when you need a deeper contract.

| Goal | Read In Order | Outcome |
| --- | --- | --- |
| Understand NexFlow | [Vision](vision.md) -> [Concepts](concepts.md) -> [Glossary](glossary.md) -> [Minimal Team](../examples/minimal-team/) | Learn the vocabulary and see the smallest maintained project shape. |
| Author manifests | [Core Profile](core-profile.md) -> [Manifest Reference](manifest-reference.md) -> [Schema Guide](../schemas/README.md) -> [Examples Guide](../examples/README.md) | Choose required documents, author supported shapes, and compare complete project sets. |
| Validate a project | [Examples Validation Walkthrough](examples-validation-walkthrough.md) -> [Validation](validation.md) -> [Diagnostic Code Catalog](diagnostic-code-catalog.md) -> [Conformance](conformance.md) | Run repository tools and interpret their evidence without widening the claim. |
| Review safety and authority | [Threat Model](threat-model.md) -> [Security Model](security-model.md) -> [Human Override](human-override.md) -> [Credential Handling](credential-handling.md) -> [Network Access Policy](network-access-policy.md) | Trace trust boundaries, human control, credentials, network access, and fail-closed behavior. |
| Design an extension | [Extension Profiles](../extensions/README.md) -> [Extension Model](extensions.md) -> [Extension Registry Model](extension-registry.md) -> [Extension Loading Boundary](extension-loading-boundary.md) -> [Integrations](integrations.md) | Separate declaration, discovery, implementation, activation, and per-operation authority. |
| Implement validation or a future runtime | [Architecture](architecture.md) -> [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) -> [Provider Adapter Boundary](provider-adapter-boundary.md) -> [Runtime Options](runtime-options.md) -> [Compatibility Matrix](compatibility-matrix.md) | Preserve current tooling limits while evaluating future implementation boundaries. |
| Maintain or release the project | [Maintainer Guide](maintainer-guide.md) -> [Governance](governance.md) -> [Provider Neutrality Checklist](provider-neutrality-checklist.md) -> [0.1 Readiness Checklist](readiness-checklist.md) -> [Release Evidence Guide](../release/README.md) | Route changes, collect evidence, review compatibility, and make an explicit release decision. |

## Repository Guides

| Area | Entry Point | What It Contains |
| --- | --- | --- |
| Specification | [Documentation Catalog](#core-models) | Conceptual models, safety boundaries, compatibility, process, and implementation guidance. |
| Manifest shapes | [Manifest Reference](manifest-reference.md) and [Schema Guide](../schemas/README.md) | Human-readable field semantics and machine-readable structural contracts. |
| Learning projects | [Examples Guide](../examples/README.md) | Compact onboarding projects and complete reference teams. |
| Extension policies | [Extension Profiles](../extensions/README.md) | Maintained provider and protocol policy profiles; no executable integrations. |
| Validation evidence | [Fixtures Guide](../fixtures/README.md) and [Validation](validation.md) | Positive and negative cases, repository commands, and evidence limits. |
| Design proposals | [RFC Index](../rfcs/README.md) | Draft proposals, review state, cross-RFC reviews, and decision process. |
| Support claims | [Conformance Templates](../conformance/README.md) | Claim schema, templates, fixture catalog, and publication workflow. |
| Release evidence | [Release Evidence Guide](../release/README.md) | Candidate record schema, template, gates, and decision rules. |
| Project policy | [Contributing](../CONTRIBUTING.md) and [Security Policy](../SECURITY.md) | Contribution requirements, local checks, and reporting boundaries. |

Every first-level `docs/*.md` page is cataloged below. The repository runs
`npm run documentation-navigation-smoke` to reject missing local link targets,
uncataloged documentation pages, and missing top-level guide links.

## Core Models

| Model | Purpose |
| --- | --- |
| [Threat Model](threat-model.md) | Maps current repository and conditional future-runtime assets, actors, trust boundaries, attacker stories, controls, assumptions, and severity. |
| [Security Model](security-model.md) | Maps safety principles and trust boundaries, with Draft policy composition, failure handling, review scenarios, and evidence limits. |
| [Core Profile](core-profile.md) | Defines the minimum Project and participant assembly, optional module qualifiers, dependency closure, and fail-closed incremental adoption. |
| [Actor Model](actor-model.md) | Defines first-class human, agent, automation, service, and authority identity plus migration behavior. |
| [Capability Model](capability-model.md) | Defines technical actions separately from authorization. |
| [Autonomy Model](autonomy-model.md) | Defines how independently actors may act. |
| [Approval Gates](approval-gates.md) | Defines human or policy approvals before sensitive actions. |
| [Approval Gate Targets](approval-gate-targets.md) | Defines typed resources governed by reusable gates, exact namespaces, workflow scope, and legacy migration. |
| [Human Override](human-override.md) | Defines human-controlled pause, stop, cancellation, revocation, fail-closed response, resume, and audit policy. |
| [Agent Assembly](agent-assembly.md) | Defines the read-only inspection projection of effective agent configuration, including provenance and blockers. |
| [Agent Definitions](agent-definitions.md) | Defines versioned behavioral releases assembled from model, prompt, retrieval, permission, context, memory, autonomy, and extension references. |
| [Effective Agent Configuration](effective-agent-configuration.md) | Defines authoritative unique-active-definition selection and domain policy boundaries. |
| [Context Model](context-model.md) | Defines declared information sources, freshness, classification, and access boundaries. |
| [Credential Handling](credential-handling.md) | Defines external-only credential references, exact policy scope, operation leases, mediation, approval, revocation, failure, redaction, and audit boundaries. |
| [Network Access Policy](network-access-policy.md) | Defines fail-closed outbound connection rules, destinations, approvals, transport constraints, audit, and legacy migration. |
| [Memory Model](memory-model.md) | Defines retention, ownership, sensitivity, and cross-scope reuse boundaries. |
| [Model Profiles](model-profiles.md) | Defines provider-neutral model selection, pinned and floating references, constraints, and audit expectations. |
| [Provider Features](provider-features.md) | Defines closed model support signals separately from project action capabilities and permissions. |
| [Provider Constraints](provider-constraints.md) | Defines structured provider-side eligibility facts, model-profile composition, migration, and validation boundaries. |
| [Provider Adapter Boundary](provider-adapter-boundary.md) | Defines host-owned selection and fallback, bounded provider-specific translation, mediated credentials and network, normalized outcomes, and audit explanations. |
| [Prompt Sets](prompt-sets.md) | Defines versioned prompt material, prompt revisions, ownership, safety review, and compatibility impact. |
| [Retrieval Profiles](retrieval-profiles.md) | Defines context source selection, index versions, chunking, freshness, citations, sensitivity, and audit expectations. |
| [Handoff Protocol](handoff-protocol.md) | Defines structured responsibility transfer between actors. |
| [Event Model](events.md) | Defines auditable state transitions and payload expectations. |
| [Event And Audit Storage Boundary](event-audit-storage-boundary.md) | Defines future audit record authority, redaction, ordering, retention, deletion, access, integrity, durability, and failure boundaries without selecting storage technology. |
| [Event Interoperability](event-interoperability.md) | Maps NexFlow event instances to CloudEvents and OpenTelemetry without selecting transport, storage, or runtime behavior. |
| [Extension Model](extensions.md) | Defines namespaced extension lifecycle and integration surface. |
| [Extension Registry Model](extension-registry.md) | Defines optional registry snapshots, namespace ownership claims, pinned profile sources, compatibility and risk metadata, publication lifecycle, and strict no-authority boundaries. |
| [Extension Loading Boundary](extension-loading-boundary.md) | Defines explicit implementation discovery, immutable resolution, verification, fail-closed unsupported handling, isolation, activation, and per-operation authorization for future runtimes. |
| [GitHub Extension Draft](../extensions/github/README.md) | Maps repository, revision, pull request, review, check, and webhook surfaces to independent capability, approval, network, credential, trust, and audit boundaries. |
| [MCP Extension Draft](../extensions/mcp/README.md) | Maps MCP context and action surfaces to independent capability, permission, approval, network, credential, and audit boundaries. |
| [MCP Integration Profile](mcp-integration-profile.md) | Applies the existing draft mapping to adoption evidence, scoped effects, operation review, declaration fragments, and unsupported behavior. |
| [A2A Extension Draft](../extensions/a2a/README.md) | Maps remote agent, skill, message, task, and artifact surfaces without treating external metadata as local authority. |
| [MCP And A2A Boundaries](mcp-a2a-boundaries.md) | Defines protocol ownership, namespace collisions, identity binding, work correlation, artifact import, and cross-protocol authority rules. |
| [Issue Tracker Extension Draft](../extensions/issue-tracker/README.md) | Defines provider-neutral issue identity, mutation, state correlation, event, credential, and authority boundaries with offline checks only. |
| [Provider Abstraction](provider-abstraction.md) | Defines provider-neutral preferences, features, and constraints. |

## Project Process

| Process Area | Purpose |
| --- | --- |
| [Governance](governance.md) | Contribution, review, and decision rules. |
| [Provider Neutrality Checklist](provider-neutrality-checklist.md) | Evidence-based review of portable core adoption, provider constraints, independent authority, adapter boundaries, offline tooling, and support claims. |
| [Maintainer Guide](maintainer-guide.md) | Change routing, synchronization, validation, review, merge, RFC, release, security, and handoff workflow for maintainers. |
| [Licensing And Patent Rationale](licensing-and-patent-rationale.md) | Records the current MIT decision, the Apache-2.0 patent tradeoff, and mandatory review triggers. |
| [Versioning](versioning.md) | Spec versioning and migration policy. |
| [Actor Model Migration](actor-model-migration.md) | Defines the staged, identity-preserving transition from legacy participant resolution. |
| [Agent Identity Migration](agent-identity-migration.md) | Defines the transition from duplicated AgentSet behavior fields to compact stable AI identity. |
| [Conformance](conformance.md) | Draft support levels for manifests, validators, CLIs, runtimes, and extensions. |
| [Conformance Claims](conformance-claims.md) | Versioned machine-readable and human-readable support statements, evidence requirements, and trust boundaries. |
| [Validation](validation.md) | Structural validation workflow and semantic validation boundary. |
| [Examples Validation Walkthrough](examples-validation-walkthrough.md) | Runs the maintained validation tools against compact and complete examples and explains a cataloged structural failure. |
| [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) | Separates offline static validation and bounded authoring commands from runtime preflight, executable extensions, credentials, remote access, orchestration, and enforcement. |
| [Reference CLI](reference-cli.md) | Maps the proposed public commands to runnable repository evidence, compatibility boundaries, safety limits, and promotion gates without claiming a released CLI. |
| [Draft Reference CLI Alpha Release Notes](cli-alpha-release-notes.md) | Prepares candidate scope, source-checkout evidence, limitations, version boundaries, and publication gates without announcing or approving an alpha. |
| [Repository CLI Prototype](cli-prototype.md) | Documents unreleased local discovery, structural validation, declared inspection, safe diagnostics, bounded initialization, executable no-runtime guardrails, dedicated CI, and remaining architecture gates; not the reference CLI alpha. |
| [CLI Declared Inspection](cli-inspection.md) | Documents schema-first summaries, declarations, selected unresolved references, disclosure limits, and the experimental inspect output. |
| [CLI Static Graph](cli-graph.md) | Documents bounded declaration nodes, selected reference edges, static resolution labels, safety limits, and the experimental graph output. |
| [CLI Starter Initialization](cli-init.md) | Documents the built-in minimal template, explicit destination, conflict behavior, generated defaults, and bounded write safety. |
| [CLI Machine-Readable Diagnostics](cli-diagnostics.md) | Experimental JSON envelope, output schema, check states, streams, exit codes, redaction, and output versioning. |
| [Diagnostic Code Catalog](diagnostic-code-catalog.md) | Central draft registry for diagnostic families, severity, messages, remediation, status, redaction, and compatibility. |
| [Fixtures Guide](../fixtures/README.md) | Focused positive and negative validation evidence, cataloged CLI outcomes, owning checks, and maintenance rules. |
| [Manifest Discovery](manifest-discovery.md) | Defines explicit local source boundaries, Project source hints, logical inventory, document cardinality, and multiple-workflow rules. |
| [Semantic Reference Inventory](semantic-reference-inventory.md) | Prioritizes cross-manifest reference resolution and records current smoke-check coverage and gaps. |
| [Typed References](typed-references.md) | Defines shared typed, scoped, transitional, and kind-specific reference shapes, lexical boundaries, and migration rules. |
| [Work Reference Namespaces](work-reference-namespaces.md) | Defines workflow-wide step identity, assembly-wide task artifact identity, and deterministic dependency and handoff lookup. |
| [Schema Design Notes](schema-design-notes.md) | Explains schema goals, non-goals, strictness boundaries, extension flexibility, and semantic validation limits. |
| [Schema Bundle Publication](schema-bundle-publication.md) | Defines a future language-neutral schema artifact layout, index, independent versions, deterministic assembly, integrity, safe consumption, and publication gates. |
| [Compatibility](compatibility.md) | Compatibility expectations and breaking change guidance. |
| [Compatibility Matrix](compatibility-matrix.md) | Current support across spec versions, schemas, examples, validators, CLI, runtime, and extensions. |
| [Release Plan](release-plan.md) | Public readiness criteria from `0.1` draft through `1.0`. |
| [0.4 Alpha Preparation Checkpoint](0.4-alpha-checkpoint.md) | Records the gate-by-gate CLI alpha readiness assessment, evidence inventory, blockers, claim ceiling, and current `not-ready` decision. |
| [0.1 Candidate Scope](0.1-scope.md) | Freezes the 17-kind baseline, RFC-backed feature treatment, deferred work, and remaining candidate blockers. |
| [0.1 Readiness Checklist](readiness-checklist.md) | Candidate review criteria and machine-readable release evidence workflow for docs, schemas, examples, RFCs, compatibility, safety, and limitations. |
| [Runtime Options](runtime-options.md) | Runtime language evaluation criteria without choosing an implementation. |
| [Runtime Language Evaluation Matrix](language-evaluation-matrix.md) | Defines hard gates, weighted criteria, common prototypes, evidence records, and a neutral decision process for TypeScript, Python, Rust, and Go. |
| [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md) | Defines mandatory evidence, review gates, blocker classes, acceptance rules, and the current not-ready decision baseline. |
| [Integrations](integrations.md) | Integration modeling rules and safety expectations. |
| [Roadmap](roadmap.md) | Specification, review, schema, CLI, runtime, and ecosystem milestones. |
| [FAQ](faq.md) | Short answers to common project questions. |

## Specification Layers

NexFlow is organized into four layers:

1. **Conceptual model**: stable vocabulary for teams, agents, context, memory, workflows, and approvals.
2. **Manifest model**: YAML documents that encode the conceptual model.
3. **Validation model**: JSON Schemas that make manifests machine-checkable.
4. **Runtime model**: future implementations that interpret and enforce manifests.

Only the first three layers exist in this repository today.
