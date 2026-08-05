# RFC-0019: MCP And A2A Boundaries

## Status

Draft; boundary map and A2A policy profile implemented

## Summary

This RFC defines how NexFlow policy refers to externally governed MCP and A2A
surfaces without copying either protocol into NexFlow core.

MCP resources and prompts remain external context; MCP tools remain external
action surfaces. A2A Agent Cards, agents, skills, messages, tasks, and artifacts
remain external discovery, identity, exchange, work-instance, and output
objects. NexFlow owns local desired state, identity binding, capabilities,
permissions, autonomy, approvals, network policy, provenance, and audit
expectations.

The RFC introduces an experimental `io.nexflow.a2a` machine-readable policy
profile. It does not implement an MCP or A2A client, server, transport,
protocol binding, discovery mechanism, credential flow, or runtime.

## Motivation

NexFlow, MCP, and A2A use overlapping words with different ownership:

- an MCP task is not a NexFlow TaskSet task
- an A2A Task is not a NexFlow TaskSet task or Workflow step
- an A2A Artifact is not automatically a NexFlow task artifact
- an A2A Agent Card does not create a NexFlow Actor or Agent
- an A2A skill is not a CapabilitySet grant
- an A2A `contextId` is not a Context Source or Memory Scope
- an MCP prompt is not an authoritative NexFlow PromptSet revision
- an A2A Message is not a NexFlow Handoff

Without an explicit mapping, implementers may merge namespaces, infer local
authority from remote metadata, or treat protocol state as project truth. Those
behaviors would make review, safety, and conformance non-deterministic.

## External Authority

This RFC was reviewed against:

- [MCP 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [A2A 1.0](https://a2a-protocol.org/latest/specification/)

These are review baselines, not NexFlow protocol support claims. The external
specifications remain authoritative for protocol types, fields, operations,
states, errors, transports, bindings, authentication, and compatibility.

NexFlow extension profiles define policy attachment and fail-closed treatment
only.

## Proposal

### Protocol Roles

NexFlow should treat the three layers as complementary:

| Layer | Primary role |
| --- | --- |
| NexFlow | Declarative project intent, local authority, policy, work definitions, governance, and audit expectations. |
| MCP | Context and tool connectivity between a host/client and MCP servers. |
| A2A | Discovery and communication between independent remote agent systems. |

No layer should be inferred to implement another.

### Effective Operation

An MCP or A2A operation is eligible only when all applicable declarations and
runtime facts agree:

- the extension profile and protocol version are supported
- local participant identity is resolved
- any remote identity binding is explicit
- the technical integration capability exists
- action-specific project-effect capabilities exist
- effective permissions allow or gate the operation
- autonomy and approval policy permit it
- context, classification, and data rules permit the input and output
- network policy permits the connection
- credentials are available outside public manifests
- runtime support exists

Missing or ambiguous dependencies fail closed. Protocol discovery and
authentication never substitute for local authorization.

## MCP Boundary

[RFC-0018](RFC-0018-mcp-extension-profile.md) remains authoritative for the
`io.nexflow.mcp` profile.

This RFC adds cross-protocol clarification:

| MCP surface | NexFlow treatment |
| --- | --- |
| Resources | External context governed by Context Source policy. |
| Prompts | External context-like material; never an automatic PromptSet override. |
| Tools | Allow-listed external actions requiring `access_mcp` and action-specific local authority. |
| Roots | Protocol scope hints that never expand local filesystem or repository access. |
| Sampling | External model-use request that remains subject to provider, model, budget, data, permission, and approval policy. |
| Elicitation | User interaction request that is not Approval Gate satisfaction or credential authority. |
| MCP tasks | External protocol request instances that do not enter TaskSet or Workflow namespaces. |

The current MCP profile directly recognizes only context, resources, prompts,
tools, and action mapping categories. Other protocol surfaces remain
unsupported by that profile and must not execute by inference.

## A2A Boundary

NexFlow should maintain `io.nexflow.a2a` as an experimental extension profile.

### Surface Classes

| A2A surface | Profile class | NexFlow treatment |
| --- | --- | --- |
| Agent Card | Discovery | External metadata. |
| Agent | Identity | Integration-scoped external identity. |
| Skill | Advertisement | External claim, not a grant. |
| Message | Exchange | External message, not a Handoff. |
| Task | Work instance | External runtime instance, not TaskSet. |
| Artifact | Output | External output requiring explicit provenance-preserving import. |

The profile intentionally does not reproduce A2A object schemas.

### Extension Dependency

An adopted A2A extension should declare `access_a2a` as a required technical
capability. This is a dependency, not a permission grant. The capability must
exist in the selected project assembly and must be effective through local
permission.

Remote operations that produce project effects require additional
action-specific capabilities. A remote code-editing skill may require
`write_repository`; a tracker mutation may require `manage_tasks`; a deployment
operation may require `deploy_application` and human approval.

### Identity And Reference Scope

Agent Card locators, remote agent identifiers, skill IDs, task IDs, context IDs,
and artifact IDs remain integration-scoped opaque values. They do not resolve
through core scalar or typed reference namespaces.

NexFlow core should not add a remote-agent target kind until an accepted RFC
defines:

- declaration ownership and namespace
- protocol and endpoint identity
- local Actor binding
- review and trust metadata
- credential references without secret material
- compatibility and failure behavior

Names, descriptions, or skill similarity must never create a binding.

### Work Correlation

An A2A Task is an externally owned runtime instance. A NexFlow TaskSet task is
an authored project work definition. A future adapter may correlate them, but
must preserve separate IDs and state authority.

Remote state may update local state only through an explicit accepted mapping
that addresses identity, permission, approval, replay, ordering, stale data,
terminal-state differences, errors, and audit provenance.

MCP tasks, A2A tasks, and NexFlow tasks remain separate namespaces.

### Artifact Import

A2A output must remain external until an import operation records:

- protocol and integration identity
- remote agent, task, and artifact identifiers
- media type and retrieval time
- integrity evidence when available
- classification, scanning, redaction, and retention decisions
- the selected local artifact identity
- approval and audit evidence when required

The import must reject silent overwrite and identity collision. Retrieval alone
does not satisfy acceptance criteria, Handoff completion, or evidence quality.

### Messages And Handoffs

An A2A Message is not a NexFlow Handoff. A future adapter may transport handoff
content through A2A, but the local Handoff remains authoritative and must record
acceptance, rejection, artifacts, blockers, acceptance criteria, and next
action explicitly.

### Context And Memory

A2A `contextId` groups protocol interactions. It does not select a NexFlow
Context Source, Memory Scope, retention rule, visibility boundary, or allowed
consumer.

Remote task history and messages must not be promoted into project or team
memory without explicit classification, provenance, retention, and promotion
policy.

## Network, Authentication, And Credentials

Extension presence never grants a connection.

Outbound remote calls require `access_network`, effective permission, and a
matching structured network rule. MCP local transports may have different
network requirements but remain subject to process, sandbox, path, and
credential boundaries outside this RFC.

A2A push notifications introduce an inbound callback surface. The current
NexFlow network model governs outbound access and does not define complete
inbound listener policy. The A2A profile therefore marks callbacks unsupported
without a separately declared inbound policy.

MCP authorization metadata and A2A Agent Card security schemes describe
external requirements. Public NexFlow manifests must not store tokens,
passwords, API keys, private keys, cookies, or client secrets.

## Cross-Protocol Composition

Authority is not transitive.

An A2A remote agent may use MCP internally, but its internal tools and policy
are opaque. A local project cannot infer that the remote agent has permission
to affect the project because its Agent Card advertises a skill or because the
remote system reports success.

When a local runtime performs multiple protocol hops, every local project
effect must still map to the initiating Actor, requested capability, effective
permission, approval, network decision, remote identity, result, and audit
evidence.

## Machine-Readable A2A Profile

The repository implements:

- `extensions/a2a/profile.yaml`
- `extensions/a2a/profile.schema.json`
- `scripts/a2a-extension-smoke.mjs`

The profile records surface classes, external ownership, authority separation,
opaque reference scope, task and artifact treatment, network and credential
requirements, audit expectations, and fail-closed behavior.

It is not a core manifest and does not define a protocol endpoint or runtime
configuration.

## Validation Expectations

Repository validation may check:

- profile structure and namespace
- external protocol authority
- complete and unique boundary surface inventory
- no automatic Actor or core typed-reference mapping
- no TaskSet, Handoff, Context, Memory, or artifact inference
- permission, project-effect capability, network, credential, audit, and
  fail-closed requirements

Static validation must not connect to a protocol endpoint, fetch an Agent Card,
enumerate live capabilities, inspect remote tasks, retrieve artifacts, obtain
credentials, or claim wire compatibility.

## Conformance Impact

A tool claiming `NF-EXTENSION` support for `io.nexflow.a2a` should identify:

- supported profile version
- supported A2A protocol versions and bindings
- supported discovery and authentication modes
- whether remote identity binding is implemented
- supported operation, streaming, polling, cancellation, and callback behavior
- artifact provenance and import behavior
- unsupported surfaces and failure policy

Supporting an A2A SDK or successfully fetching an Agent Card is not sufficient
for a NexFlow conformance claim.

## Compatibility Impact

The profile and mapping are additive inside the unreleased
`specVersion: "0.1"` draft. No existing manifest must adopt A2A and no core
manifest kind changes.

Potentially breaking changes include:

- treating remote metadata as local authority
- changing integration-scoped IDs into global or core identities
- automatically mapping remote tasks, messages, or artifacts
- weakening permission, approval, network, credential, provenance, or audit
  requirements
- allowing inbound callbacks without explicit policy
- changing fail-closed behavior

External MCP and A2A protocol version changes remain independently governed.

## Security And Safety Impact

The proposal reduces confused-deputy, identity-spoofing, prompt-injection,
capability-confusion, artifact-substitution, callback-exposure, and transitive
authority risks by keeping protocol metadata separate from local grants.

The profiles do not prove that an endpoint, Agent Card, server, remote agent,
skill, tool, task, message, or artifact is trustworthy. Runtime authentication,
content safety, sandboxing, integrity, availability, and enforcement remain
future work.

## Relationship To Other RFCs

- [RFC-0005](RFC-0005-validation-strategy.md) owns validation layering.
- [RFC-0006](RFC-0006-extension-namespaces.md) owns extension namespace and lifecycle rules.
- [RFC-0007](RFC-0007-approval-gates.md) owns local approval semantics.
- [RFC-0009](RFC-0009-event-envelope.md) owns event envelope semantics.
- [RFC-0015](RFC-0015-typed-references.md) owns core reference forms and keeps integration handles opaque.
- [RFC-0017](RFC-0017-human-override.md) owns human pause, stop, block, revoke, and resume authority.
- [RFC-0018](RFC-0018-mcp-extension-profile.md) owns the maintained MCP profile.

## Alternatives Considered

### Copy MCP And A2A Schemas Into NexFlow

Rejected. It would duplicate external standards and couple NexFlow releases to
their wire-level evolution.

### Treat A2A Agent Cards As Agent Definitions

Rejected. Agent Cards describe remote protocol endpoints and skills; they do
not express NexFlow local policy, reviewed component versions, memory,
permissions, or authority.

### Treat All Protocol Tasks As NexFlow Tasks

Rejected. MCP and A2A tasks are runtime instances with protocol-owned
lifecycles, while NexFlow TaskSet entries are authored project definitions.

### Trust Remote Skills As Capabilities

Rejected. Advertised suitability is not a local technical capability or
permission grant.

### Add A Runtime Gateway

Rejected for this milestone. Runtime transport and execution remain outside a
specification-first boundary mapping.

## Open Questions

- What extension shape should declare A2A endpoint and Agent Card references?
- Should remote agents receive a dedicated typed target kind or remain
  integration-scoped extension identities?
- What provenance record should standardize A2A Artifact import?
- Which A2A task states, if any, should map to NexFlow events without changing
  local work state?
- What inbound network policy is required before push callbacks are supported?
- How should signed Agent Cards, cached cards, and extended cards affect trust
  and review expiration?
- Which MCP roots, sampling, elicitation, and task surfaces belong in a future
  `io.nexflow.mcp` profile revision?
