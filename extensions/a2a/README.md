# A2A Extension Draft

The `io.nexflow.a2a` profile maps Agent2Agent Protocol interoperability into
existing NexFlow identity, capability, permission, approval, network,
credential, provenance, and audit boundaries.

It does not copy the A2A data model, publish or fetch Agent Cards, discover
remote agents, send messages, create remote tasks, stream updates, receive push
notifications, authenticate a client, or implement an A2A protocol binding.

The machine-readable draft is [profile.yaml](profile.yaml). Its structure is
validated by [profile.schema.json](profile.schema.json), and the repository
checks the profile with:

```sh
npm run a2a-extension-smoke
```

The profile was reviewed against the externally governed A2A `1.0`
specification. This review baseline is not a protocol compatibility claim. A
tool must declare the A2A versions and bindings it actually supports.

## Authority Boundaries

An A2A declaration is an inventory and policy attachment point. Effective
remote-agent use is the intersection of:

- an `ExtensionSet` declaration for `io.nexflow.a2a`
- an explicit local binding when a remote agent corresponds to a NexFlow Actor
- the `access_a2a` capability and an effective permission
- an action-specific capability for every local project effect
- autonomy and approval rules for the initiating actor
- `access_network` and matching network policy for remote calls
- separately managed credentials accepted by the remote service
- runtime support for the profile, A2A version, and selected protocol binding
- audit and provenance behavior appropriate to the exchanged data

No Agent Card, advertised skill, reachable endpoint, successful
authentication, remote task, or returned artifact grants local authority.

## Surface Mapping

| A2A surface | NexFlow treatment |
| --- | --- |
| Agent Card | External discovery metadata. It does not create an Actor, Agent, AgentDefinition, capability, or permission. |
| Remote agent | Integration-scoped external identity. A local Actor relationship requires an explicit authored binding. |
| Skill | External suitability claim. It does not become a Skill or CapabilitySet grant automatically. |
| Message | Protocol exchange. It is not a NexFlow Handoff or durable audit record by itself. |
| Task | External runtime work instance. It is not a TaskSet declaration or Workflow step. |
| Artifact | External output. It enters a NexFlow artifact namespace only through an explicit import with provenance and policy checks. |

The A2A specification remains authoritative for these objects, their fields,
states, operations, bindings, and wire behavior.

## Example Extension Declaration

```yaml
specVersion: "0.1"
kind: ExtensionSet
metadata:
  project: software-team
extensions:
  - id: remote_review_agents
    namespace: io.nexflow.a2a
    displayName: Remote Review Agents
    description: Policy attachment for approved remote review agents.
    lifecycle: experimental
    appliesTo:
      - agents
      - tasks
      - handoffs
      - capabilities
      - permissions
      - events
    requiredCapabilities:
      - access_a2a
```

This declaration does not identify an endpoint, contain an Agent Card, or
authorize an invocation. The current draft does not define a core manifest
shape for A2A endpoints or remote-agent bindings.

## Work And Artifact Boundaries

- A remote task ID is opaque and scoped to the selected A2A integration.
- A remote task state does not transition a NexFlow task or workflow.
- A2A messages do not satisfy Handoff acceptance criteria automatically.
- A returned artifact must be classified, scanned, attributed, and explicitly
  imported before a NexFlow task or handoff may reference it as local evidence.
- A2A `contextId` groups protocol interactions; it is not a NexFlow Context
  Source, Memory Scope, or authorization scope.
- Cancellation, input-required, authentication-required, and terminal remote
  states remain protocol-owned until a separate mapping is declared.

## Network, Credentials, And Push

Outbound A2A calls require `access_network` and a matching structured network
rule in addition to A2A access permission. Agent Card security schemes describe
remote authentication requirements; they do not supply credentials or grant
local access.

Credentials remain outside public manifests. Push notification callbacks or
other inbound listeners remain unsupported unless a future NexFlow policy
model explicitly covers inbound exposure, callback authentication, replay
protection, and destination ownership.

## Current Limits

This draft does not define:

- an A2A endpoint, Agent Card, Message, Task, Part, Artifact, or Extension schema
- a remote-agent registry or discovery algorithm
- protocol binding or version negotiation
- authentication or credential acquisition
- streaming, polling, cancellation, or push notification behavior
- automatic Actor, TaskSet, Workflow, Handoff, Event, Context, or Memory mapping
- an A2A client, server, gateway, SDK, or runtime

See [MCP And A2A Boundaries](../../docs/mcp-a2a-boundaries.md) for the complete
cross-protocol mapping and
[RFC-0019](../../rfcs/RFC-0019-mcp-a2a-boundaries.md) for rationale,
compatibility, and open questions.

External authority:
[A2A 1.0 Specification](https://a2a-protocol.org/latest/specification/).
