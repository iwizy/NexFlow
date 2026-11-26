# Integrations

Integrations connect NexFlow projects to external systems. They are declared, not assumed.

Integrations that need non-core metadata should use extension namespaces. See [Extension Model](extensions.md) and [RFC-0006: Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md).

## Integration Examples

- GitHub
- GitLab
- Jira
- Linear
- Figma
- Slack
- Discord
- Telegram
- notes
- MCP
- A2A
- custom systems

## Issue Tracker Policy Profile

The [Issue Tracker Extension Draft](../extensions/issue-tracker/README.md)
defines `io.nexflow.issue_tracker` as a shared policy boundary for external
issues, selected mutations, state correlation, and events. Provider bindings
remain explicit and independently versioned. Existing Jira, Linear, GitHub,
or custom declarations are not aliases and do not automatically adopt it.
No tracker adapter or synchronization is implemented.

## Integration Roles

An integration may be:

- a context source
- an action provider
- an event sink
- an artifact host
- an approval surface
- an identity source

## Declaration Example

```yaml
id: github
type: github
description: Source control and pull request workflow.
capabilities:
  - read_repository
  - create_branch
  - create_pull_request
requiredPermissions:
  - repo_read
  - pr_create_with_review
events:
  - review.requested
  - review.completed
```

## Integration Rules

Integrations MUST NOT silently grant access. All meaningful actions should map to capabilities and permissions.

An integration declaration, extension reference, context source, or credential
MUST NOT be treated as an outbound connection grant. Network-dependent
integration actions also require a matching structured
[Network Access Policy](network-access-policy.md) rule. In the absence of such a
rule, future runtimes must deny the connection.

Integrations SHOULD declare:

- supported capabilities
- context sources exposed
- event types emitted
- approval surfaces
- credential requirements
- audit behavior

Network policy should select the integration or extension destination, allowed
purposes, actors, schemes, and ports as narrowly as practical. Credentials must
remain outside public manifests and must not be inferred from destination
selection. Protected actions require a matching structured
[Credential Handling](credential-handling.md) rule and external runtime binding
in addition to their action and network authorization.

## External Metadata And Local Decisions

This slice applies to the maintained GitHub, issue tracker, MCP and A2A
profiles. It defines the evidence a consumer needs to review an operation.
The corresponding fixtures use synthetic compatibility labels and exercise
offline decisions. Live protocol compatibility, transport and enforcement
require their own evidence.

| Input | What the consumer can use |
| --- | --- |
| Authored integration and extension metadata | The project's requested integration, context, operation and declared scope. |
| Registry and compatibility evidence | The exact namespace, profile version and authenticated source pin under the consumer's registry policy. |
| Deployment binding and observation | The configured external instance, installed implementation, supported protocol/version pair and observed target or artifact revision. |
| Local authority | The host's current capability, permission, approval, network, credential and other applicable policy decisions for one operation. |

### Identity And Evidence

Keep external IDs opaque and scoped to the configured binding, external
resource kind and exact ID. Apply narrower scopes where the profile requires
them, such as a repository, tracker container, MCP server or remote A2A agent
and task. Identical IDs from different bindings identify different objects.
A display name, URL, tracker key, branch, tag or Agent Card alone cannot
establish an external identity or an immutable revision. Actor mappings and
local work correlations require explicit local bindings.

Use the exact observed commit, resource revision, digest or provider
precondition required by the operation. For mutable resources, recheck the
precondition before the effect. Refuse unavailable, stale, conflicting or
ambiguous evidence when the operation requires it. A tracker create operation
binds its reviewed container and proposed fields. It has no existing issue
revision to invent. When importing remote artifacts, retain the exact source
binding, agent/task scope when applicable, external artifact ID, protocol
version, retrieval time, media type and integrity evidence required by the
import policy. Preserve or raise classification and authorize the destination
and local artifact mapping separately.

### Operations And Refusals

| Profile | Keep these decisions separate |
| --- | --- |
| [GitHub](../extensions/github/README.md) | Repository reads, branch creation, commit pushes, PR creation and review submission are distinct operations. An external review, check or webhook is evidence. Local approval still binds one operation and its exact scope. |
| [Issue tracker](../extensions/issue-tracker/README.md) | Read, create, update, comment and transition use explicit instance, container, target, fields and effect. Remote status and comments leave local approval, completion and acceptance unchanged. An unknown write outcome requires reconciliation before another attempt. |
| [MCP](../extensions/mcp/README.md) | Resources and prompts enter through context policy. Tools and actions require an exact allow-list entry, a separate action capability, effective permission and approval under the draft profile. Tool descriptions, annotations and requested follow-up work are external claims. Context access cannot be reused for a tool call. |
| [A2A](../extensions/a2a/README.md) | Agent Cards describe discovery, agents have external identities, skills advertise behavior, messages are exchanges, tasks are external instances, and artifacts are outputs pending explicit import. None creates a local actor, capability, Handoff, TaskSet task, context source, memory or accepted artifact. |

Match the requested profile pin and protocol/version against explicit local
support for the exact pair. Absent or unsupported required metadata, versions,
surfaces or effects stop the requested operation. Unsupported optional
metadata may be kept as opaque data when permitted by classification and
retention policy. Exclude it from authority, operation selection and public
projections. Preserve the reason for refusal without echoing raw content,
credential material, private paths or endpoint parameters.

Inbound callbacks and webhooks remain unsupported in this slice. Their
metadata, registration URLs, delivery IDs and authentication claims do not
authorize a listener or a follow-up request. Each invocation and each
cross-protocol hop requires an independent local decision. An earlier fetch,
a local or remote parent approval, a remote agent's skill or its own tools
cannot delegate or broaden the next hop. A protected operation independently
needs its scoped credential binding. A network operation independently needs
its outbound rule. A matching capability does not bypass permission, freshness
or approval. Record the local actor, scoped binding and target, profile and
protocol versions, requested effect, policy/review references and disposition
in safe audit evidence. That evidence cannot authorize retry or fallback.

Run `node scripts/integration-metadata-smoke.mjs` for the
[offline examples](../fixtures/integrations/metadata-boundaries.yaml) and
refusal checks. Refer to the individual profile checks for their full schema
coverage. Existing manifest shapes and profile assets keep their current
versions. A consumer may need to pin an exact binding or request fresh evidence
before relying on previously ambiguous metadata.

## MCP

MCP can expose both context and tools. NexFlow should model MCP servers explicitly so teams can see what data and actions are available.

The [MCP Extension Draft](../extensions/mcp/README.md) maps MCP-facing context,
resources, prompts, tools, and actions to existing NexFlow policy domains.

Use the [MCP Integration Profile](mcp-integration-profile.md) to review adoption
evidence, scoped tool effects, operation decisions, fictional declaration
fragments, and unsupported behavior against that existing mapping.

Action-bearing surfaces require an explicit tool allow-list, `access_mcp`, an
action-specific capability, effective permissions, approval in the initial draft, and
audit evidence. Networked transports additionally require `access_network` and
a matching structured network rule. Credentials remain outside manifests and
must satisfy the separate credential handling policy.

The draft does not implement MCP, choose a protocol version, discover live
servers or tools, or treat connection success as authorization.

## A2A

A2A describes discovery and collaboration with remote agent systems. NexFlow
does not copy Agent Cards, skills, messages, tasks, artifacts, protocol
bindings, or lifecycle operations into core manifests.

The [A2A Extension Draft](../extensions/a2a/README.md) maps those externally
owned surfaces to local identity, capability, permission, approval, network,
credential, provenance, and audit policy. `access_a2a` is a technical
dependency, not a grant. Remote project effects require action-specific
capabilities and effective local permission.

An Agent Card does not create a NexFlow Actor, an advertised skill does not
become a CapabilitySet grant, an A2A Task does not become a TaskSet task, and an
A2A Artifact does not enter the local artifact namespace without explicit
provenance-preserving import.

See [MCP And A2A Boundaries](mcp-a2a-boundaries.md) for collision, identity,
work, Handoff, network, credential, and cross-protocol rules.
