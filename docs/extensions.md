# Extension Model

Extensions allow NexFlow to grow without forcing every integration into the core specification.

Related RFC: [RFC-0006: Extension Namespaces](../rfcs/RFC-0006-extension-namespaces.md).

## Goals

- support integrations such as GitHub, GitLab, Jira, Linear, Figma, Slack, Discord, Telegram, MCP, notes, and custom systems
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
