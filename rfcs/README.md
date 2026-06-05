# NexFlow RFCs

RFCs are design proposals for meaningful changes to NexFlow.

## RFC Index

| RFC | Title | Status |
| --- | --- | --- |
| [RFC-0001](RFC-0001-project-vision.md) | Project Vision | Accepted |
| [RFC-0002](RFC-0002-core-manifest-model.md) | Core Manifest Model | Accepted |
| [RFC-0003](RFC-0003-conformance-levels.md) | Conformance Levels | Draft |
| [RFC-0004](RFC-0004-agent-definition-versioning.md) | Agent Definition Versioning | Draft |

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
