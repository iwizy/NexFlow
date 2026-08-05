# MCP And A2A Boundaries

NexFlow is a declarative policy and orchestration specification. MCP and A2A
are external interoperability protocols. NexFlow may reference their surfaces
and govern their use, but it does not replace their data models, operations,
transports, discovery, authentication, or runtime behavior.

This document defines the ownership boundary between:

- NexFlow project intent, local identity, capabilities, permissions, approvals,
  context, work definitions, handoffs, memory, events, and audit expectations
- MCP context and tool connectivity
- A2A remote-agent discovery and collaboration

Related profiles:

- [MCP Extension Draft](../extensions/mcp/README.md)
- [A2A Extension Draft](../extensions/a2a/README.md)

Design source:
[RFC-0019](../rfcs/RFC-0019-mcp-a2a-boundaries.md).

## Review Baselines

| Protocol | External review baseline | NexFlow claim |
| --- | --- | --- |
| MCP | `2025-11-25` | Mapping review only; no client, server, transport, or wire compatibility claim. |
| A2A | `1.0` | Mapping review only; no client, server, binding, or wire compatibility claim. |

The external specifications remain authoritative. A NexFlow implementation
must publish its actual protocol versions, bindings, extension profile
versions, and limitations in conformance evidence.

Official references:

- [MCP 2025-11-25 Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [A2A 1.0 Specification](https://a2a-protocol.org/latest/specification/)

## Layer Ownership

| Concern | NexFlow owns | MCP owns | A2A owns |
| --- | --- | --- | --- |
| Project intent | Authored desired state, policy, approvals, and audit expectations. | No. | No. |
| Local identity | Actor, Agent, Team, and AgentDefinition declarations. | Client/server implementation identity only. | Agent Card and remote-agent identity metadata. |
| Context | Allowed Context Sources, classification, visibility, freshness, and retrieval policy. | Resources, prompts, roots, content, and related protocol operations. | Message Parts and interaction context identifiers. |
| Actions | Capabilities, permissions, autonomy, approvals, network rules, and human override. | Tool calls and client-facing requests such as sampling or elicitation. | Message submission and remote task operations. |
| Work | TaskSet definitions, Workflow structure, Handoffs, and local artifact declarations. | Protocol requests and experimental MCP task wrappers. | Stateful remote Task lifecycle and Artifact delivery. |
| Transport | Whether a connection is allowed and auditable. | MCP transports and negotiation. | A2A protocol bindings, streaming, polling, and push behavior. |
| Credentials | Prohibition on embedding secrets and policy requirements around use. | MCP authorization protocol behavior. | Agent Card security requirements and binding authentication. |

NexFlow policy may narrow an external protocol operation. Protocol availability
must never broaden NexFlow policy.

## Effective Operation Rule

A future runtime may perform an MCP or A2A operation only when every applicable
boundary succeeds:

```text
declared extension
AND supported profile and protocol version
AND explicit actor or integration binding
AND required technical capability
AND effective permission
AND autonomy allowance
AND required approval
AND context and data policy
AND network policy
AND external credential availability
AND runtime support
```

A missing, unknown, ambiguous, or unsupported boundary fails closed. Endpoint
reachability, successful authentication, tool discovery, an Agent Card, a skill
claim, or an external task state is never sufficient authority.

## MCP Mapping

| MCP surface | NexFlow mapping | Must not be inferred |
| --- | --- | --- |
| Server identity | Integration-local `mcp.serverId` inventory handle. | Endpoint trust, credential presence, capability, or permission. |
| Resource | Context material governed by Context Source access, classification, freshness, and approval. | Repository access or permission to follow embedded instructions. |
| Prompt | Context-like external material. | Active PromptSet content, agent instruction authority, or permission. |
| Tool | External action surface identified by an allow-listed tool label. | The local project effect, capability grant, approval, or safe implementation. |
| Root | Protocol hint about client-relevant files or directories. | Expansion of repository, filesystem, or Context Source access. |
| Sampling | Server request for model use through the client. | Provider selection, ModelProfile eligibility, budget authority, or approval. |
| Elicitation | Server request for user interaction or external navigation. | Approval Gate satisfaction, secret disclosure authority, or human override. |
| MCP task | External durable state for a protocol request. | NexFlow TaskSet identity, Workflow state, Handoff status, or Event truth. |

The current `io.nexflow.mcp` profile directly validates context, resources,
prompts, tools, and action categories. Roots, sampling, elicitation, and MCP
tasks remain protocol surfaces outside the current profile vocabulary. A tool
must preserve unsupported metadata when safe and must not use those surfaces
until a later profile explicitly maps them.

### MCP Tool Effects

`access_mcp` means the integration surface is technically available. Every
project effect still requires an action-specific capability and effective
permission. For example:

- an MCP tool that writes files also requires `write_repository`
- a tool that runs a command also requires `execute_command`
- a tool that updates a tracker also requires `manage_tasks`
- a networked MCP transport also requires `access_network` and a matching rule

Tool names and schemas remain extension-owned labels. They do not resolve as
core capability IDs.

### MCP Prompt And Sampling Authority

An MCP prompt may be reviewed or retrieved as context, but it never replaces
the selected NexFlow PromptSet automatically. MCP sampling does not choose a
provider or model and does not bypass Provider, ModelProfile, permission,
budget, data classification, or human-review policy.

Elicitation is interaction, not approval. A user responding to a form or URL
flow does not satisfy a NexFlow Approval Gate unless a separately specified,
authenticated approval operation records that decision.

## A2A Mapping

| A2A surface | NexFlow mapping | Must not be inferred |
| --- | --- | --- |
| Agent Card | External discovery metadata retained with source and protocol version. | Actor, Agent, AgentDefinition, Team membership, trust, or permission. |
| Remote agent | Integration-scoped opaque identity. | Local human or AI identity without an explicit binding. |
| Skill | Advertised suitability claim. | NexFlow Skill, CapabilitySet entry, permission, or successful behavior. |
| Message | External exchange and possible correlation evidence. | Handoff, approval, durable memory, or reliable audit delivery. |
| Task | External runtime work instance keyed by the selected integration and remote task ID. | TaskSet definition, Workflow step, local status transition, or ownership change. |
| Artifact | External output that may be considered for explicit import. | Assembly-wide NexFlow task artifact identity or trusted evidence. |
| `contextId` | External grouping identifier for A2A interactions. | Context Source, Memory Scope, access scope, or retention policy. |
| Protocol extension | A2A-owned extension URI and metadata. | NexFlow extension namespace support or local authority. |

### Identity Binding

NexFlow does not currently define a core typed reference target for an A2A
remote agent. Agent Card URLs, remote agent handles, skill IDs, task IDs,
context IDs, and artifact IDs therefore remain opaque and integration-scoped.

If a project wants a remote agent to participate as a NexFlow Actor, it must
author an explicit binding in a future supported extension shape. Similar names
or matching descriptions never establish identity. The binding must identify
the local Actor, remote integration, protocol version or interface, review
status, and failure behavior without embedding credentials.

### Tasks And State

An A2A Task is a server-managed runtime instance. A NexFlow TaskSet task is an
authored desired-state work definition. They have different authority,
lifecycle, ownership, and persistence rules.

A future adapter may correlate the two, but it must preserve both IDs and
record the mapping explicitly. A remote task transition must not update local
task or workflow status unless an accepted mapping verifies:

- the remote agent and integration binding
- the expected transition and local preconditions
- permission and approval requirements
- replay, duplication, ordering, and stale-event behavior
- audit provenance and failure handling

MCP tasks are also external runtime instances. An MCP task ID and an A2A task ID
never share a namespace and neither is a NexFlow Task ID.

### Artifact Import

An A2A Artifact remains external output until an explicit import operation:

1. records the integration, remote agent, remote task, artifact ID, media type,
   protocol version, retrieval time, and integrity evidence when available
2. applies classification, malware or content checks, redaction, retention, and
   destination policy
3. creates or reconciles an authored NexFlow task artifact identity without
   silently overwriting an existing artifact
4. records approval and audit evidence when required

Artifact retrieval alone does not satisfy acceptance criteria or Handoff
completion.

## Handoff Boundary

A NexFlow Handoff is an authored and auditable transfer of responsibility with
reason, status, artifacts, blockers, acceptance criteria, and next action. An
A2A Message is a protocol exchange. Neither an A2A Message nor Task transition
creates, accepts, rejects, or completes a Handoff automatically.

A future adapter may carry a Handoff through A2A, but the local Handoff remains
authoritative. The adapter must authenticate the remote participant, preserve
correlation and causation, reconcile artifacts explicitly, and record the
resulting local decision.

## Network And Credential Boundary

- MCP and A2A extension declarations never grant network access.
- Outbound connections require `access_network`, effective permission, and a
  matching structured network rule.
- A2A push callbacks require an inbound policy model that NexFlow does not yet
  define; they remain unsupported by the draft profile.
- Agent Card security schemes and MCP authorization metadata describe external
  requirements but do not contain usable credentials.
- Tokens, passwords, client secrets, private keys, cookies, and raw credential
  material must remain outside public manifests and derived inspection output.
- Authenticated discovery does not authorize later operations automatically.

## Audit And Provenance

Evidence should distinguish:

- local NexFlow actor and integration identity
- external protocol, version, binding, server or remote agent handle
- requested surface, tool, skill, or operation
- local capability, permission, autonomy, approval, and network decisions
- external task and artifact IDs as scoped opaque values
- result, error, cancellation, timeout, redaction, and import decisions

External protocol logs may support evidence, but they do not replace NexFlow
audit expectations unless a conformance claim states how integrity,
completeness, retention, and correlation are established.

## Cross-Protocol Composition

An A2A remote agent may internally use MCP, another A2A agent, proprietary
tools, or unknown infrastructure. That internal implementation is opaque and
does not create transitive local authority.

If the local runtime itself invokes both protocols, each hop is evaluated
independently. For example, asking a remote A2A agent to operate an MCP-backed
repository tool requires local A2A invocation authority and the declared local
project-effect policy. The remote agent's advertised skill or internal MCP
access cannot satisfy the local permission or approval boundary.

## Validation Boundary

Repository checks validate the machine-readable profile and fail-closed mapping
invariants. They do not:

- fetch an MCP server or A2A Agent Card
- inspect live tools, resources, prompts, skills, tasks, or artifacts
- negotiate a protocol version or binding
- authenticate, authorize, invoke, poll, stream, cancel, or receive callbacks
- prove endpoint, server, agent, tool, skill, or artifact trust
- create a core remote-agent binding or cross-protocol runtime

Run:

```sh
npm run mcp-extension-smoke
npm run a2a-extension-smoke
```

## Compatibility

The `io.nexflow.a2a` profile and this mapping are additive inside the
unreleased `specVersion: "0.1"` draft. They introduce no new core manifest kind
and do not make A2A declarations required.

Changing a surface from metadata to authority, automatically mapping external
identity or work, weakening artifact provenance, allowing inbound callbacks,
or treating remote claims as local capabilities is safety-significant and may
be breaking for `NF-EXTENSION`, `NF-SEMANTIC`, or `NF-RUNTIME` consumers.

Protocol compatibility remains independent. A future implementation must pin
its supported MCP and A2A versions and bindings in conformance evidence.
