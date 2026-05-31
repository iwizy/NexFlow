# NexFlow Documentation

NexFlow is an open specification and reference framework for describing AI developer teams.

The documentation is the canonical source for the specification. Schemas and examples support the docs, but they do not replace the written model.

## Start Here

- [Vision](vision.md)
- [Concepts](concepts.md)
- [Architecture](architecture.md)
- [Manifest Reference](manifest-reference.md)
- [Security Model](security-model.md)

## Core Models

- [Context Model](context-model.md)
- [Memory Model](memory-model.md)
- [Autonomy Model](autonomy-model.md)
- [Capability Model](capability-model.md)
- [Handoff Protocol](handoff-protocol.md)
- [Event Model](events.md)
- [Extension Model](extensions.md)
- [Provider Abstraction](provider-abstraction.md)

## Project Process

- [Governance](governance.md)
- [Versioning](versioning.md)
- [Conformance](conformance.md)
- [Validation](validation.md)
- [Compatibility](compatibility.md)
- [Runtime Options](runtime-options.md)
- [Integrations](integrations.md)
- [Roadmap](roadmap.md)
- [FAQ](faq.md)

## Specification Layers

NexFlow is organized into four layers:

1. **Conceptual model**: stable vocabulary for teams, agents, context, memory, workflows, and approvals.
2. **Manifest model**: YAML documents that encode the conceptual model.
3. **Validation model**: JSON Schemas that make manifests machine-checkable.
4. **Runtime model**: future implementations that interpret and enforce manifests.

Only the first three layers exist in this repository today.
