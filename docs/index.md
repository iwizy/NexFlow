# NexFlow Documentation

NexFlow is an open specification and reference framework for describing AI developer teams.

The documentation is the canonical source for the specification. Schemas and examples support the docs, but they do not replace the written model.

## Start Here

- [Vision](vision.md)
- [Concepts](concepts.md)
- [Glossary](glossary.md)
- [Architecture](architecture.md)
- [Manifest Reference](manifest-reference.md)
- [Security Model](security-model.md)

## Reading Paths

| Reader | Recommended Path |
| --- | --- |
| New project visitor | [Vision](vision.md) -> [Concepts](concepts.md) -> [Glossary](glossary.md) -> [Manifest Reference](manifest-reference.md) |
| Manifest author | [Manifest Reference](manifest-reference.md) -> [Context Model](context-model.md) -> [Memory Model](memory-model.md) -> [Examples Guide](../examples/README.md) |
| Safety reviewer | [Security Model](security-model.md) -> [Network Access Policy](network-access-policy.md) -> [Approval Gates](approval-gates.md) -> [Capability Model](capability-model.md) -> [Autonomy Model](autonomy-model.md) |
| Validator author | [Validation](validation.md) -> [Schema Design Notes](schema-design-notes.md) -> [Schema Guide](../schemas/README.md) -> [Conformance](conformance.md) -> [Compatibility Matrix](compatibility-matrix.md) |
| Runtime implementer | [Architecture](architecture.md) -> [Runtime Options](runtime-options.md) -> [Provider Abstraction](provider-abstraction.md) -> [Roadmap](roadmap.md) |
| Extension author | [Extension Model](extensions.md) -> [Integrations](integrations.md) -> [Provider Abstraction](provider-abstraction.md) -> [Conformance](conformance.md) |

## Core Models

| Model | Purpose |
| --- | --- |
| [Capability Model](capability-model.md) | Defines technical actions separately from authorization. |
| [Autonomy Model](autonomy-model.md) | Defines how independently actors may act. |
| [Approval Gates](approval-gates.md) | Defines human or policy approvals before sensitive actions. |
| [Agent Assembly](agent-assembly.md) | Defines the cross-manifest relationship and review checkpoint connecting agent identities, definitions, and referenced behavioral components. |
| [Agent Definitions](agent-definitions.md) | Defines versioned behavioral releases assembled from model, prompt, retrieval, permission, context, memory, autonomy, and extension references. |
| [Context Model](context-model.md) | Defines declared information sources, freshness, classification, and access boundaries. |
| [Network Access Policy](network-access-policy.md) | Defines fail-closed outbound connection rules, destinations, approvals, transport constraints, audit, and legacy migration. |
| [Memory Model](memory-model.md) | Defines retention, ownership, sensitivity, and cross-scope reuse boundaries. |
| [Model Profiles](model-profiles.md) | Defines provider-neutral model selection, pinned and floating references, constraints, and audit expectations. |
| [Prompt Sets](prompt-sets.md) | Defines versioned prompt material, prompt revisions, ownership, safety review, and compatibility impact. |
| [Retrieval Profiles](retrieval-profiles.md) | Defines context source selection, index versions, chunking, freshness, citations, sensitivity, and audit expectations. |
| [Handoff Protocol](handoff-protocol.md) | Defines structured responsibility transfer between actors. |
| [Event Model](events.md) | Defines auditable state transitions and payload expectations. |
| [Extension Model](extensions.md) | Defines namespaced extension lifecycle and integration surface. |
| [Provider Abstraction](provider-abstraction.md) | Defines provider-neutral preferences and constraints. |

## Project Process

| Process Area | Purpose |
| --- | --- |
| [Governance](governance.md) | Contribution, review, and decision rules. |
| [Versioning](versioning.md) | Spec versioning and migration policy. |
| [Conformance](conformance.md) | Draft support levels for manifests, validators, CLIs, runtimes, and extensions. |
| [Validation](validation.md) | Structural validation workflow and semantic validation boundary. |
| [Schema Design Notes](schema-design-notes.md) | Explains schema goals, non-goals, strictness boundaries, extension flexibility, and semantic validation limits. |
| [Compatibility](compatibility.md) | Compatibility expectations and breaking change guidance. |
| [Compatibility Matrix](compatibility-matrix.md) | Current support across spec versions, schemas, examples, validators, CLI, runtime, and extensions. |
| [Release Plan](release-plan.md) | Public readiness criteria from `0.1` draft through `1.0`. |
| [0.1 Readiness Checklist](readiness-checklist.md) | Candidate review checklist for docs, schemas, examples, RFCs, compatibility, and limitations. |
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
