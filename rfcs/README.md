# NexFlow RFCs

RFCs are design proposals for meaningful changes to NexFlow.

## RFC Index

| RFC | Title | Status |
| --- | --- | --- |
| [RFC-0001](RFC-0001-project-vision.md) | Project Vision | Accepted |
| [RFC-0002](RFC-0002-core-manifest-model.md) | Core Manifest Model | Accepted |
| [RFC-0003](RFC-0003-conformance-levels.md) | Conformance Levels | Draft |
| [RFC-0004](RFC-0004-agent-definition-versioning.md) | Agent Definition Versioning | Draft |
| [RFC-0005](RFC-0005-validation-strategy.md) | Validation Strategy | Draft |
| [RFC-0006](RFC-0006-extension-namespaces.md) | Extension Namespaces | Draft |
| [RFC-0007](RFC-0007-approval-gates.md) | Approval Gates | Draft |
| [RFC-0008](RFC-0008-memory-retention.md) | Memory Retention | Draft |
| [RFC-0009](RFC-0009-event-envelope.md) | Event Envelope | Draft |
| [RFC-0010](RFC-0010-provider-selection.md) | Provider Selection | Draft |
| [RFC-0011](RFC-0011-reference-cli-scope.md) | Reference CLI Scope | Draft |
| [RFC-0012](RFC-0012-manifest-bundling.md) | Manifest Bundling | Draft |
| [RFC-0013](RFC-0013-actor-model.md) | Actor Model | Draft |
| [RFC-0014](RFC-0014-effective-agent-configuration.md) | Effective Agent Configuration | Draft |
| [RFC-0015](RFC-0015-typed-references.md) | Typed References | Draft |
| [RFC-0016](RFC-0016-core-profile-and-discovery.md) | Core Profile And Logical Discovery | Draft |
| [RFC-0017](RFC-0017-human-override.md) | Human Override | Draft |

## Cross-RFC Reviews

- [Foundational Model Cross-RFC Review](reviews/2026-07-foundational-model-review.md)
  records compatibility, safety, migration dependencies, blockers, and the
  implementation order for RFC-0013 through RFC-0016. The reviewed RFCs remain
  Draft.

## When to Write an RFC

Write an RFC for:

- new core concepts
- manifest structure changes
- breaking schema changes
- security model changes
- autonomy model changes
- runtime architecture decisions
- extension lifecycle changes
- compatibility policy changes

Small typo fixes, examples, and clarifications may use normal pull requests.

## RFC File Naming

Use:

```text
RFC-0000-short-title.md
```

Numbers are assigned sequentially.

## RFC Template

```md
# RFC-0000: Title

## Status

Draft

## Summary

## Motivation

## Proposal

## Compatibility Impact

## Security and Safety Impact

## Alternatives Considered

## Open Questions
```

## Process

1. Open a draft RFC.
2. Discuss motivation, scope, safety, and compatibility.
3. Revise based on review.
4. Maintainers accept, reject, or request more work.
5. Accepted RFCs are implemented through docs, schemas, examples, and changelog updates.

## Acceptance Criteria

An RFC should not be accepted until it explains:

- why the change belongs in NexFlow
- how it affects manifests
- how it affects safety and approvals
- how it affects compatibility
- how examples and schemas will change

## Breaking Changes

Breaking changes require explicit maintainer approval, migration notes, and a versioning plan.

## Deprecations

Deprecations should identify a replacement and expected removal timeline when possible.
