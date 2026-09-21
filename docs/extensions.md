# Extension Model

Extensions allow NexFlow to grow without forcing every integration into the core specification.

Related RFC: [RFC-0006: Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md).

The draft [Extension Registry Model](extension-registry.md) defines portable
discovery metadata for namespaces, ownership claims, exact profile sources,
compatibility, requirements, and publication lifecycle. It does not create a
registry service or grant trust, installation, support, or runtime authority.

Future executable discovery and activation must follow the
[Extension Loading Boundary](extension-loading-boundary.md). An extension
declaration, maintained profile, installed package, or successful validation is
not evidence that executable behavior is trusted, loaded, or authorized.

The maintained machine-readable profiles are the
[GitHub Extension Draft](../extensions/github/README.md), proposed by
[RFC-0020](../rfcs/RFC-0020-github-extension-profile.md), the
[MCP Extension Draft](../extensions/mcp/README.md), proposed by
[RFC-0018](../rfcs/RFC-0018-mcp-extension-profile.md), and the
[A2A Extension Draft](../extensions/a2a/README.md), proposed by
[RFC-0019](../rfcs/RFC-0019-mcp-a2a-boundaries.md).

## Goals

- support integrations such as GitHub, GitLab, Jira, Linear, Figma, Slack, Discord, Telegram, MCP, A2A, notes, and custom systems
- preserve core portability
- make non-core behavior visible
- avoid hidden permission expansion

## Extension Declaration

```yaml
specVersion: "0.1"
kind: ExtensionSet
extensions:
  - id: github-basic
    namespace: io.nexflow.github
    displayName: GitHub Basic
    lifecycle: experimental
    appliesTo:
      - context
      - events
      - workflow
    requiredCapabilities:
      - read_repository
      - create_pull_request
```

## Lifecycle

- `experimental`: design may change.
- `stable`: intended for broad use.
- `deprecated`: retained for compatibility, not recommended.
- `removed`: no longer supported by the target spec version.

## Namespace Ownership

Extension namespaces should be stable and ownership-aware. The draft namespace model is described in [RFC-0006](../rfcs/RFC-0006-extension-namespaces.md).

The `io.nexflow.*` namespace family is reserved for NexFlow-maintained or governance-accepted extension drafts. Private organizations should prefer reverse-DNS namespaces such as `com.example.platform`.

## Extension Rules

Extensions MUST:

- use a stable namespace
- declare required capabilities
- document permission implications
- avoid changing core semantics silently
- preserve human approval requirements

Extensions MUST NOT:

- grant permissions by presence alone
- read secrets implicitly
- bypass approval gates
- redefine core event types incompatibly

## Attachment Areas

The current schema recognizes these draft `appliesTo` values: `project`, `agents`, `workflow`, `tasks`, `handoffs`, `permissions`, `capabilities`, `context`, `retrieval`, `memory`, `providers`, `events`, and `extensions`.

`retrieval` covers retrieval profile declarations and related retrieval configuration. It does not grant access to context sources or permit retrieval by itself. Context access, capabilities, permissions, autonomy, and approval gates remain separate controls.

## Custom Extensions

Private organizations may use reverse-DNS namespaces:

```yaml
namespace: com.example.platform
```

Custom extensions should include a public or internal reference document when possible.

## Maintained Draft Profiles

| Namespace | Status | Evidence | Runtime support |
| --- | --- | --- | --- |
| `io.nexflow.github` | Draft / experimental | Profile schema, RFC-0020, Software Team binding, and `npm run github-extension-smoke` | Not implemented |
| `io.nexflow.mcp` | Draft / experimental | Profile schema, RFC-0018, Software Team binding, and `npm run mcp-extension-smoke` | Not implemented |
| `io.nexflow.a2a` | Draft / experimental | Profile schema, RFC-0019, boundary map, and `npm run a2a-extension-smoke` | Not implemented |

A maintained profile defines a policy mapping and validation evidence. It does
not load an integration, install software, negotiate an external protocol,
obtain credentials, or establish runtime conformance.

## Future Loading Boundary

Project declaration discovery and implementation discovery are separate.
Future runtimes must resolve implementations only from explicit runtime-owned
sources, verify one immutable implementation, fail closed for unsupported or
ambiguous behavior, isolate loaded code, and re-evaluate authorization for each
operation. Loading never grants capabilities, permissions, approvals, network,
credentials, context, memory, autonomy, or local identity.

See [Extension Loading Boundary](extension-loading-boundary.md) for the complete
runtime-neutral contract. No extension loader is implemented.

## Registry Boundary

A registry entry may make extension metadata easier to discover, but it is not
part of a project assembly and is not an executable implementation record.
Registry lookup must remain optional for private namespaces and offline
authoring. A future consumer must validate and pin registry metadata, expose
ownership verification honestly, keep unknown behavior inert, and re-evaluate
all project and runtime policy independently.

The repository includes a standalone draft schema, a fictional example, and
focused checks. It does not publish a registry snapshot, verify namespace
ownership, resolve packages, or perform remote lookup. See
[Extension Registry Model](extension-registry.md).
