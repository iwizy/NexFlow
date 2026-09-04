# MCP Extension Draft

The `io.nexflow.mcp` profile maps an MCP integration into existing NexFlow
policy domains. It does not copy the MCP protocol, start a server, discover
tools, acquire credentials, or authorize an operation.

The machine-readable draft is [profile.yaml](profile.yaml). Its structure is
validated by [profile.schema.json](profile.schema.json), and the repository
checks the profile plus focused ContextSet cases with:

```sh
npm run mcp-extension-smoke
```

## Authority Boundaries

An MCP declaration is an inventory and policy attachment point. Effective use
is the intersection of:

- an `ExtensionSet` declaration for `io.nexflow.mcp`
- a `ContextSet` source with `type: mcp`
- the `access_mcp` capability and an effective permission
- source access, classification, and approval gates
- an action-specific capability and approval for tools that perform project actions
- `access_network` and a matching structured network rule when the selected
  transport initiates an outbound connection
- a matching structured credential handling rule and operation-scoped external
  binding when authentication is required
- runtime support for the profile and the external MCP protocol version

No single declaration grants access. A missing or unsupported boundary blocks
the operation.

Credential material remains outside manifests and follows the
[Credential Handling](../../docs/credential-handling.md) no-ambient,
no-direct-exposure, and reauthorization rules.

## Surface Mapping

| MCP-facing surface | NexFlow treatment |
| --- | --- |
| Context and resources | Context access governed by the source declaration. |
| Prompts | Context-like material; it does not replace a NexFlow PromptSet or become active agent instructions automatically. |
| Tools and actions | Action-bearing surfaces requiring an explicit allow-list, approval posture, and action-specific capability. |

The surface names are NexFlow mapping categories, not a replacement protocol
definition. External MCP specifications remain authoritative for wire behavior.

## Example Binding

```yaml
specVersion: "0.1"
kind: ContextSet
metadata:
  project: software-team
contextSources:
  - id: mcp_tools
    type: mcp
    description: Approved local development server.
    access:
      default: query
      allowedActors:
        - implementation-agent
    classification: internal
    mcp:
      serverId: local_development_tools
      exposes:
        - context
        - tools
      allowedTools:
        - test-log-reader
      requiresApprovalForTools: true
    approvalGates:
      - mcp_tool_review
```

`serverId` is an integration-local handle. It is not a core resource reference,
endpoint, credential, or proof that the server exists.

## Current Limits

This draft does not define transport configuration, dynamic discovery,
protocol-version negotiation, sampling, elicitation, roots, subscriptions,
server trust, installation, or runtime execution. Those concerns require
separate interoperability and runtime decisions.

See [RFC-0018](../../rfcs/RFC-0018-mcp-extension-profile.md) for the proposal,
compatibility notes, validation rules, and open questions.
