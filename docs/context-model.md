# Context Model

Context is a first-class NexFlow concept. Agents and workflows must explicitly declare which sources they can access.

## Context Source Types

NexFlow defines these source types:

- `github`
- `gitlab`
- `docs`
- `obsidian`
- `confluence`
- `local_files`
- `knowledge_base`
- `linear`
- `jira`
- `figma`
- `mcp`
- `web`
- `custom`

## Context Source Fields

```yaml
id: repository
type: github
description: Main source repository.
access:
  default: read
  allowedActors:
    - maintainer
    - implementation-agent
classification: internal
refreshPolicy: on_request
```

## Access Modes

- `none`: source is declared but not available.
- `read`: source may be read.
- `write`: source may be modified where permissions also allow it.
- `query`: source can be queried through a controlled interface.
- `admin`: administrative access, requiring explicit approval gates.

## Classification

Suggested classifications:

- `public`
- `internal`
- `confidential`
- `restricted`

## Context Rules

Context access MUST NOT imply permission to act on that context. For example, reading GitHub issues does not imply permission to edit issues.

Agents SHOULD receive only the context needed for their task.

Runtimes SHOULD log meaningful context access for auditability.

## Web Context

Web access is powerful and unstable. Projects SHOULD declare allowed domains, freshness expectations, and approval requirements for network access.

## MCP Context

MCP servers should be declared as context sources, integrations, or both depending on whether they expose data, tools, or workflow actions.
