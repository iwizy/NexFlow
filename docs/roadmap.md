# Roadmap

NexFlow is specification-first. Runtime work starts only after the core model is coherent.

## Milestone 1: Draft Specification

- Define core concepts.
- Document manifest semantics.
- Add draft schemas.
- Add examples.
- Create governance and RFC process.

Status: in progress.

Relevant docs: [Concepts](concepts.md), [Glossary](glossary.md), [Manifest Reference](manifest-reference.md), [Agent Definitions](agent-definitions.md), [Context Model](context-model.md), [Memory Model](memory-model.md), [Approval Gates](approval-gates.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md).

Agent assembly draft checkpoint: complete for initial review. The current draft links agent definitions, model profiles, prompt sets, retrieval profiles, permissions, context, memory, autonomy, extensions, compatibility, and audit expectations.

## Milestone 2: Community Review

- Collect feedback from agent tool builders, open-source maintainers, startups, enterprises, and researchers.
- Refine terminology.
- Identify missing safety and compatibility rules.
- Review approval gate semantics with maintainers and runtime implementers.
- Review context source taxonomy, freshness rules, web boundaries, and MCP context/tool separation.
- Review memory sensitivity, ownership, allowed consumers, and cross-scope promotion rules.
- Review model profile selection modes, pinned and floating references, constraints, fallback, and audit expectations.
- Review prompt set identifiers, revisions, source references, safety review status, and compatibility impact.
- Review retrieval source references, index versions, chunking, freshness, citations, sensitivity, and audit expectations.
- Review agent definition component references, lifecycle status, activation criteria, autonomy, and audit expectations.

Relevant docs: [Security Model](security-model.md), [Capability Model](capability-model.md), [Autonomy Model](autonomy-model.md), [Provider Abstraction](provider-abstraction.md), [Agent Assembly](agent-assembly.md), [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md), [Extension Model](extensions.md).

## Milestone 3: Schema Hardening

- Improve cross-manifest consistency.
- Document validation workflow and current validation limits.
- Review RFC-0005 validation strategy for syntax, schema, semantic, diagnostic, and runtime preflight boundaries.
- Add schema examples and negative cases.
- Define conformance expectations for validators.
- Refine draft conformance levels for manifests, validators, CLIs, runtimes, and extensions.

Relevant docs: [Validation](validation.md), [Conformance](conformance.md), [Compatibility](compatibility.md), [Schema Guide](../schemas/README.md), [Examples Guide](../examples/README.md).

## Milestone 4: Runtime Architecture Decision

- Compare implementation languages.
- Define reference CLI scope.
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
