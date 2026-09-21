# MCP Integration Profile

This draft is the integration review companion to the existing experimental
[`io.nexflow.mcp` extension profile](../extensions/mcp/README.md). It applies
the policy mapping in [RFC-0018](../rfcs/RFC-0018-mcp-extension-profile.md)
and the [MCP ownership boundary](mcp-a2a-boundaries.md) to a proposed adoption.
It introduces no new namespace, manifest fields, protocol binding, or runtime.
RFC-0018 remains Draft.

The machine-readable source remains
[`extensions/mcp/profile.yaml`](../extensions/mcp/profile.yaml), paired with
its [schema](../extensions/mcp/profile.schema.json). The profile is a
specification asset, not a project manifest or an executable integration.

## Adoption Evidence

A proposed integration should supply the following review evidence. This is a
review checklist, not a new binding schema or fields to copy into a manifest.

| Evidence | Existing declaration or owning boundary |
| --- | --- |
| Exact profile revision and supported protocol versions | Profile asset, RFC-0018, and implementation conformance evidence; protocol compatibility is independent of `specVersion`. |
| Extension identity and lifecycle | `ExtensionSet` with namespace `io.nexflow.mcp`, `experimental` lifecycle, used attachment areas, and `access_mcp` dependency. |
| Server and source inventory | `ContextSet` with `type: mcp`, `mcp.serverId`, explicit `mcp.exposes`, access policy, and classification. |
| Local participant | Explicit actor binding and effective configuration; the server handle does not establish an actor. |
| Requested operation and project effects | Exact server, surface, tool label where applicable, arguments, target, data scope, and action-specific capabilities. |
| Policy decision | Effective permissions, deny precedence, autonomy, required approval gates, and current human override. |
| Transport and authentication | Separate network policy where needed, credential policy, and a supported external implementation binding. |
| Result and audit treatment | Provenance, classification, redaction, retention, outcome evidence, and required audit durability. |

An omitted, ambiguous, or unsupported dependency blocks the affected operation.
Schema validity, installation, extension enablement, discovery, authentication,
or an advertised tool never supplies a missing decision. The
[Extension Loading Boundary](extension-loading-boundary.md) governs any future
implementation discovery and activation separately from use.

## Declaration Fragments

The fictional [extension fragment](../extensions/mcp/extension.example.yaml)
and [context fragment](../extensions/mcp/context.example.yaml) demonstrate a
resource source and a separately reviewed tool source. They use existing
manifest shapes and the same fictional project and server handle.

They are intentionally incomplete: the referenced `operator` and
`mcp_tool_review` gate must be declared in an adopting assembly, together with
capabilities, permissions, effective configuration, and any applicable network
and credential rules. The fragments grant no access and are not a runnable
project or a complete semantic-validation example. They contain no endpoint,
launch command, credential, or protocol-version configuration.

`serverId` is an opaque integration-local handle, not a core typed reference,
endpoint, filesystem path, credential reference, or trust claim. Reusing a
handle across sources does not union their access policies. A future operation
must identify the selected source and its effective policy unambiguously;
conflicting or unresolved bindings cannot be silently combined.

## Surface And Effect Review

| Declared surface | Required review | Authority limit |
| --- | --- | --- |
| `context`, `resources` | Source access, classification, freshness, retrieval scope, and applicable approval policy. | Returned material is context; embedded instructions cannot expand authority. |
| `prompts` | The same context review, including provenance and disclosure limits. | Retrieved content does not replace the active PromptSet or satisfy approval. |
| `tools`, `actions` | Non-empty `allowedTools`, `requiresApprovalForTools: true`, `access_mcp`, action-specific capabilities, effective permissions, and required approval. | A tool label or description does not establish the effect or authorize it. |

The categories belong to NexFlow's policy mapping; they are not a protocol
operation registry. The external MCP specification owns protocol behavior.

An implementation must map every project effect independently. For example,
reading governed context requires the applicable context capability; a tool
writing repository files additionally needs `write_repository`, running a
command needs `execute_command`, and modifying work items needs `manage_tasks`.
`access_mcp` supplies none of these permissions. A tool with several effects
must satisfy all applicable boundaries, including disclosure of its arguments
and results. Unknown effects cannot be authorized from the tool name alone.

Even a tool described as read-only remains an action surface in this draft.
It cannot bypass the tool allow-list or approval posture by advertising safe
behavior. Tool labels are opaque and scoped to the selected server; the same
label on another server is not the same approved operation. An allow-list
entry is not an instruction to invoke every matching tool.

Discovery results and changes to advertised tools do not edit authored
allow-lists, capabilities, or permissions. A changed target, tool meaning,
arguments, or policy scope requires a fresh applicable decision under the
existing approval and loading boundaries. This draft provides no dynamic
discovery, tool-schema pin format, or automatic approval renewal.

## Operation Review Sequence

A future implementation should make each step independently inspectable:

1. Resolve the declared extension, exact supported profile, protocol version,
   source, server binding, and local actor. Do not infer a binding from names.
2. Classify the requested surface and all project effects. Reject unsupported
   surfaces and tools outside the selected source's explicit allow-list.
3. Evaluate effective capabilities, permissions, autonomy, source/data policy,
   approval state and scope, and human override. A deny remains effective even
   when an approval exists.
4. Evaluate the transport and credential boundaries for this operation. A
   previously established session does not supply reusable authority.
5. Record the decision according to the applicable audit policy before an
   effect when that policy requires durable pre-effect evidence.
6. Record the observed outcome separately, apply classification and redaction,
   and retain provenance without promoting remote content into local authority.

Approval should identify the actor, selected server and source, exact tool or
operation, arguments or reviewed payload reference, target, project effect,
and applicable task/workflow scope and expiry. Installation approval, a prior
call, an external interaction, or successful authentication does not satisfy
the current operation's approval. Policy changes, revocation, or human stop
invalidate affected authority; resume requires the existing reauthorization
rules. See [Approval Gates](approval-gates.md), [Human Override](human-override.md),
and [Extension Loading Boundary](extension-loading-boundary.md).

## Transport And Credentials

Outbound transports require `access_network`, an effective permission, and a
matching structured [network rule](network-access-policy.md) for the actual
destination and purpose. A local-looking handle or loopback destination does
not waive network policy. A non-network transport does not invent a network
requirement, but process launch, executable trust, sandbox, and filesystem
authority remain separate and outside this profile's implementation scope.

Protected operations additionally require effective `use_credential`
capability and permission, a matching structured
[credential handling rule](credential-handling.md), applicable credential
approval, and an operation-scoped external binding. Anonymous access omits the
credential dependency only when authentication is not required; it retains all
other policy boundaries.

Credentials stay outside manifests, context, prompts, tool arguments/results,
diagnostics, and audit payloads. Ambient credentials and manifest-selected
subprocess injection are not supported. A declaration must not route secrets
through command arguments, generic process environments, or standard input as
a substitute for mediation. Target changes, redirects, lease expiry, renewal,
or revocation require the owning network and credential checks again.

## Results, Failures, And Unsupported Surfaces

Resource contents, prompts, tool descriptions, and results are external input.
Preserve provenance and classification; embedded instructions, links, or
returned resource identifiers cannot grant access. Further retrieval and
disclosure need their own applicable policy. A successful tool response does
not itself complete a local task, satisfy acceptance criteria or an Approval
Gate, create durable memory, or complete a Handoff.

| Condition | Required boundary |
| --- | --- |
| Missing dependency, denied permission, expired approval, or human stop | Block the affected operation; do not fall back to broader authority. |
| Unknown profile, protocol, transport, surface, or ambiguous binding | Preserve metadata when safe; do not execute unsupported behavior. |
| Changed advertised tool or target | Do not broaden declarations or reuse an out-of-scope approval. |
| Timeout, cancellation, or lost response after a possible effect | Record an uncertain outcome; do not claim success, rollback, or no effect. |
| Retry after uncertainty | Re-evaluate authority; any reconciliation read or repeat operation requires its own applicable decision and implementation-specific evidence. |
| Required pre-effect audit durability unavailable | Block the effect under the owning audit policy. |

No retry engine, cancellation guarantee, or exactly-once effect is defined.
Audit evidence should distinguish actor, server/source, surface, tool,
capability and policy decisions, approval, correlation, known or unknown
outcome, and redaction. External protocol logs alone do not establish complete
local evidence. Apply the [Event And Audit Storage Boundary](event-audit-storage-boundary.md).

Roots, sampling, elicitation, protocol task wrappers, subscriptions, inbound
callbacks, installation, and dynamic discovery remain outside the current
profile vocabulary or implementation scope. Do not alias them to `context` or
`actions` to bypass that boundary. In particular, roots do not expand file
access, sampling does not grant model access, elicitation is not approval,
and protocol task state is not local work state. Later support requires the
separate decisions identified in [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Validation And Compatibility

Run `npm run mcp-extension-smoke` for the maintained profile, declaration
fragments, positive and negative ContextSet cases, and selected Software Team
declaration checks. Run `npm run validate` and the full repository smoke suite
for the broader baseline. The MCP check is already included in repository CI.

These checks validate structure and selected static invariants. They do not
resolve all cross-manifest references, calculate effective policy, approve a
tool, connect to a server, negotiate a protocol, inspect live tools, acquire
credentials, launch processes, or prove runtime enforcement. The review
sequence and failure table are specification guidance, not tested runtime
behavior or `NF-EXTENSION` certification.

This companion keeps `profileVersion: "0.1-draft"` and
`specVersion: "0.1"`. The machine-readable profile, core schemas, CLI contract,
and dependencies are unchanged; no release or version bump is introduced.
Existing declarations need no migration because these are applications of
existing policy boundaries. Future changes to authority, supported surfaces,
binding shape, failure semantics, or protocol compatibility require explicit
RFC and compatibility review with a version decision and migration guidance.

Publication evidence may describe a draft integration policy with offline
validation at an exact repository revision. It must not describe a released
integration, working adapter, accepted RFC, supported server, or protocol/runtime
conformance. See [Versioning](versioning.md) and [Compatibility Matrix](compatibility-matrix.md).
