# Integrations

Integrations connect NexFlow projects to external systems. They are declared, not assumed.

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

Integrations SHOULD declare:

- supported capabilities
- context sources exposed
- event types emitted
- approval surfaces
- credential requirements
- audit behavior

## MCP

MCP can expose both context and tools. NexFlow should model MCP servers explicitly so teams can see what data and actions are available.
