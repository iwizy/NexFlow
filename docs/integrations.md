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

## MCP

MCP can expose both context and tools. NexFlow should model MCP servers explicitly so teams can see what data and actions are available.

The [MCP Extension Draft](../extensions/mcp/README.md) maps MCP-facing context,
resources, prompts, tools, and actions to existing NexFlow policy domains.

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
