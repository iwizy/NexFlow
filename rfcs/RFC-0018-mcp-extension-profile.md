# RFC-0018: MCP Extension Profile

## Status

Draft

## Summary

This RFC proposes the first NexFlow-maintained extension profile for Model
Context Protocol integrations under the `io.nexflow.mcp` namespace.

The profile maps MCP-facing context, resources, prompts, tools, and actions into
existing NexFlow context, capability, permission, approval, network, credential,
and audit boundaries. It deliberately does not redefine the external protocol
or implement an MCP client, server, transport, discovery mechanism, or runtime.

## Motivation

NexFlow already recognizes MCP context sources and an `access_mcp` capability,
but a generic extension declaration is not enough to answer important review
questions:

- Is the server used only for context, or can it expose actions?
- Which actors may use it?
- Which tools are allowed?
- Does tool use require approval?
- Does the transport require outbound network authority?
- Where do credentials live?
- What should happen when a runtime does not support the profile?

Without a profile, tools may infer incompatible answers or treat server
availability as authority. The draft creates a common policy mapping while
keeping protocol behavior externally governed.

## Proposal

NexFlow should publish a machine-readable draft profile at
`extensions/mcp/profile.yaml` with namespace `io.nexflow.mcp`.

### Extension Identity

An MCP integration declares the namespace through `ExtensionSet` and remains
`experimental` while this RFC is Draft.

The extension declaration should include `access_mcp` in
`requiredCapabilities`. This is a dependency statement, not a grant. The
capability must also exist in `CapabilitySet` and be effective through a
separate permission.

### Context Inventory

Every MCP server used by the profile should have a `ContextSet` source with:

- `type: mcp`
- a stable integration-local `mcp.serverId`
- a non-empty `mcp.exposes` inventory
- access and classification policy

`serverId` is not a URL, credential, typed core resource reference, or proof of
availability. It remains an integration-local handle until a future
interoperability RFC defines a target kind.

### Surface Mapping

The profile uses five NexFlow mapping categories:

| Surface | Class | NexFlow boundary |
| --- | --- | --- |
| `context` | Context | Source access, classification, freshness, and context approval policy. |
| `resources` | Context | Resource reads remain bounded by the source declaration. |
| `prompts` | Context | Retrieved prompt material is context and does not replace an active PromptSet automatically. |
| `tools` | Action | Requires an allow-list, `access_mcp`, an action-specific capability, permission, and approval in the initial draft. |
| `actions` | Action | Uses the same action boundary as tools and may not bypass workflow or project policy. |

These categories are not a complete MCP feature registry. External MCP
specifications remain authoritative for protocol messages and feature names.

### Tool And Action Safety

When `mcp.exposes` includes `tools` or `actions`:

- `allowedTools` must be present and non-empty
- `requiresApprovalForTools` must be `true` in the initial draft
- an action-specific capability must still describe the project effect
- a permission must authorize both MCP access and the action capability
- effective autonomy and approval gates must allow the request
- audit evidence should identify the actor, server handle, tool or action,
  decision, approval, result, and redaction status

`access_mcp` does not imply `execute_command`, repository writes, task mutation,
deployment, provider access, or credential access.

### Network And Credentials

An MCP extension declaration never grants network access.

If the selected transport initiates an outbound connection, a future runtime
must also require `access_network`, an effective permission, and a matching
structured `project.policies.networkAccess` rule. A local process or other
non-network transport should not invent a network requirement, but it remains
subject to sandbox, command, process, and credential policy outside this draft.

Credentials must remain outside public manifests. The profile may reference a
future secret-management boundary, but it must not contain tokens, passwords,
private keys, or raw credential values.

### Protocol Compatibility

MCP protocol versions are externally governed. A tool claiming support for
`io.nexflow.mcp` should list the protocol versions and profile version it
supports in its conformance evidence.

NexFlow core does not select a current protocol version, negotiate versions, or
claim wire compatibility.

### Failure Policy

Tools should preserve unsupported extension metadata when safe, but they must
not execute it.

Unknown surfaces, unsupported profile versions, missing capabilities, missing
permissions, missing approvals, missing network rules, unsupported transports,
or unavailable credential boundaries fail closed.

## Validation Expectations

JSON Schema can validate:

- the machine-readable profile structure
- required MCP context metadata
- non-empty exposure inventories
- closed surface names in the current ContextSet vocabulary
- required allow-lists and approval posture for action-bearing surfaces

Future semantic validators may check:

- a matching `io.nexflow.mcp` ExtensionSet declaration exists
- `access_mcp` exists and is referenced by the extension
- actors have effective permissions for MCP and action-specific capabilities
- approval gate references resolve
- networked transports have matching structured network policy
- audit event references resolve
- PromptSet authority is not replaced by retrieved MCP prompt content

Static validation must not connect to a server, enumerate live tools, obtain
credentials, or treat discovery success as authorization.

## Relationship To Other RFCs

- [RFC-0005](RFC-0005-validation-strategy.md) owns validation layering.
- [RFC-0006](RFC-0006-extension-namespaces.md) owns namespace and lifecycle rules.
- [RFC-0007](RFC-0007-approval-gates.md) owns approval semantics.
- [RFC-0015](RFC-0015-typed-references.md) keeps MCP server IDs opaque until a target kind exists.
- [RFC-0017](RFC-0017-human-override.md) keeps human pause, stop, block, revoke, and resume authority effective.

A future MCP and agent-to-agent interoperability RFC may add broader protocol
mapping. It must not make this extension profile a runtime or duplicate an
external protocol.

## Compatibility Impact

The profile and stricter MCP context shape are additive inside the unreleased
`specVersion: "0.1"` draft.

Existing MCP context sources that omit `mcp`, have an empty `exposes` list, or
declare tools without an allow-list and approval posture require migration.
Maintained examples already carry this information.

Changing a context-only surface into an action-bearing surface, broadening an
allow-list, removing approval, adding networked transport, or changing profile
meaning is safety-significant and may be breaking for `NF-EXTENSION`,
`NF-SEMANTIC`, or `NF-RUNTIME` consumers.

## Security And Safety Impact

The draft reduces the risk that MCP availability is mistaken for authority. It
separates context from action, keeps PromptSet authority explicit, requires
allow-lists and approvals for action surfaces, keeps network policy independent,
and fails closed when required support is missing.

The profile does not prove that a server is trustworthy, that returned content
is safe, that a tool behaves as described, or that a runtime enforces the
declared policy.

## Alternatives Considered

### Treat MCP Only As Context

This hides action-bearing tools and makes review incomplete.

### Treat MCP Access As One Permission

A single permission would collapse server access, tool execution, and project
effects into one broad grant.

### Copy MCP Into NexFlow Core

This would duplicate an externally governed protocol and make core evolution
depend on protocol details.

### Require A Runtime Registry

This is premature for a specification-first project and would prevent offline
or private extension declarations.

## Open Questions

- Should a future manifest define MCP server identities as typed resources?
- Where should transport and protocol-version compatibility be declared?
- Should tool schemas or content digests be reviewable artifacts?
- Which audit events should become core rather than extension-scoped?
- How should dynamic tool-list changes trigger review?
- How should MCP sampling and elicitation map to provider and human approval policy?
