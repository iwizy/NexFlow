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
selection.

## MCP

MCP can expose both context and tools. NexFlow should model MCP servers explicitly so teams can see what data and actions are available.
