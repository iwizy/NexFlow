# NexFlow Documentation

NexFlow is an open specification and reference framework for describing AI developer teams.

The documentation is the canonical source for the specification. Schemas and examples support the docs, but they do not replace the written model.

## Start Here

- [Vision](vision.md)
- [Concepts](concepts.md)
- [Glossary](glossary.md)
- [Actor Model](actor-model.md)
- [Human Override](human-override.md)
- [Architecture](architecture.md)
- [Core Profile](core-profile.md)
- [Manifest Reference](manifest-reference.md)
- [Security Model](security-model.md)

## Reading Paths

| Reader | Recommended Path |
| --- | --- |
| New project visitor | [Vision](vision.md) -> [Concepts](concepts.md) -> [Glossary](glossary.md) -> [Manifest Reference](manifest-reference.md) |
| Manifest author | [Core Profile](core-profile.md) -> [Manifest Reference](manifest-reference.md) -> [Actor Model](actor-model.md) -> [Context Model](context-model.md) -> [Memory Model](memory-model.md) -> [Examples Guide](../examples/README.md) |
| Safety reviewer | [Security Model](security-model.md) -> [Human Override](human-override.md) -> [Network Access Policy](network-access-policy.md) -> [Approval Gates](approval-gates.md) -> [Approval Gate Targets](approval-gate-targets.md) -> [Capability Model](capability-model.md) -> [Autonomy Model](autonomy-model.md) |
| Validator author | [Validation](validation.md) -> [Fixtures Guide](../fixtures/README.md) -> [Manifest Discovery](manifest-discovery.md) -> [Semantic Reference Inventory](semantic-reference-inventory.md) -> [Typed References](typed-references.md) -> [Approval Gate Targets](approval-gate-targets.md) -> [Work Reference Namespaces](work-reference-namespaces.md) -> [Schema Design Notes](schema-design-notes.md) -> [Schema Guide](../schemas/README.md) -> [Conformance](conformance.md) -> [Conformance Claims](conformance-claims.md) -> [Compatibility Matrix](compatibility-matrix.md) |
| Runtime implementer | [Architecture](architecture.md) -> [Event Model](events.md) -> [Event Interoperability](event-interoperability.md) -> [Runtime Options](runtime-options.md) -> [Provider Abstraction](provider-abstraction.md) -> [Provider Features](provider-features.md) -> [Provider Constraints](provider-constraints.md) -> [Roadmap](roadmap.md) |
| Extension author | [Extension Model](extensions.md) -> [MCP And A2A Boundaries](mcp-a2a-boundaries.md) -> [MCP Extension Draft](../extensions/mcp/README.md) -> [A2A Extension Draft](../extensions/a2a/README.md) -> [Integrations](integrations.md) -> [Conformance](conformance.md) |

## Core Models

| Model | Purpose |
| --- | --- |
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
| [Network Access Policy](network-access-policy.md) | Defines fail-closed outbound connection rules, destinations, approvals, transport constraints, audit, and legacy migration. |
| [Memory Model](memory-model.md) | Defines retention, ownership, sensitivity, and cross-scope reuse boundaries. |
| [Model Profiles](model-profiles.md) | Defines provider-neutral model selection, pinned and floating references, constraints, and audit expectations. |
| [Provider Features](provider-features.md) | Defines closed model support signals separately from project action capabilities and permissions. |
| [Provider Constraints](provider-constraints.md) | Defines structured provider-side eligibility facts, model-profile composition, migration, and validation boundaries. |
| [Prompt Sets](prompt-sets.md) | Defines versioned prompt material, prompt revisions, ownership, safety review, and compatibility impact. |
| [Retrieval Profiles](retrieval-profiles.md) | Defines context source selection, index versions, chunking, freshness, citations, sensitivity, and audit expectations. |
| [Handoff Protocol](handoff-protocol.md) | Defines structured responsibility transfer between actors. |
| [Event Model](events.md) | Defines auditable state transitions and payload expectations. |
| [Event Interoperability](event-interoperability.md) | Maps NexFlow event instances to CloudEvents and OpenTelemetry without selecting transport, storage, or runtime behavior. |
| [Extension Model](extensions.md) | Defines namespaced extension lifecycle and integration surface. |
| [MCP Extension Draft](../extensions/mcp/README.md) | Maps MCP context and action surfaces to independent capability, permission, approval, network, credential, and audit boundaries. |
| [A2A Extension Draft](../extensions/a2a/README.md) | Maps remote agent, skill, message, task, and artifact surfaces without treating external metadata as local authority. |
| [MCP And A2A Boundaries](mcp-a2a-boundaries.md) | Defines protocol ownership, namespace collisions, identity binding, work correlation, artifact import, and cross-protocol authority rules. |
| [Provider Abstraction](provider-abstraction.md) | Defines provider-neutral preferences, features, and constraints. |

## Project Process

| Process Area | Purpose |
| --- | --- |
| [Governance](governance.md) | Contribution, review, and decision rules. |
| [Licensing And Patent Rationale](licensing-and-patent-rationale.md) | Records the current MIT decision, the Apache-2.0 patent tradeoff, and mandatory review triggers. |
| [Versioning](versioning.md) | Spec versioning and migration policy. |
| [Actor Model Migration](actor-model-migration.md) | Defines the staged, identity-preserving transition from legacy participant resolution. |
| [Agent Identity Migration](agent-identity-migration.md) | Defines the transition from duplicated AgentSet behavior fields to compact stable AI identity. |
| [Conformance](conformance.md) | Draft support levels for manifests, validators, CLIs, runtimes, and extensions. |
| [Conformance Claims](conformance-claims.md) | Versioned machine-readable and human-readable support statements, evidence requirements, and trust boundaries. |
| [Validation](validation.md) | Structural validation workflow and semantic validation boundary. |
| [Fixtures Guide](../fixtures/README.md) | Focused positive and negative validation evidence, owning checks, and maintenance rules. |
| [Manifest Discovery](manifest-discovery.md) | Defines explicit local source boundaries, Project source hints, logical inventory, document cardinality, and multiple-workflow rules. |
| [Semantic Reference Inventory](semantic-reference-inventory.md) | Prioritizes cross-manifest reference resolution and records current smoke-check coverage and gaps. |
| [Typed References](typed-references.md) | Defines shared typed, scoped, transitional, and kind-specific reference shapes, lexical boundaries, and migration rules. |
| [Work Reference Namespaces](work-reference-namespaces.md) | Defines workflow-wide step identity, assembly-wide task artifact identity, and deterministic dependency and handoff lookup. |
| [Schema Design Notes](schema-design-notes.md) | Explains schema goals, non-goals, strictness boundaries, extension flexibility, and semantic validation limits. |
| [Compatibility](compatibility.md) | Compatibility expectations and breaking change guidance. |
| [Compatibility Matrix](compatibility-matrix.md) | Current support across spec versions, schemas, examples, validators, CLI, runtime, and extensions. |
| [Release Plan](release-plan.md) | Public readiness criteria from `0.1` draft through `1.0`. |
| [0.1 Candidate Scope](0.1-scope.md) | Freezes the 17-kind baseline, RFC-backed feature treatment, deferred work, and remaining candidate blockers. |
| [0.1 Readiness Checklist](readiness-checklist.md) | Candidate review criteria and machine-readable release evidence workflow for docs, schemas, examples, RFCs, compatibility, safety, and limitations. |
| [Runtime Options](runtime-options.md) | Runtime language evaluation criteria without choosing an implementation. |
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
