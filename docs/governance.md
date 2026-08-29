# Governance

NexFlow uses lightweight open governance centered on maintainers, public discussion, and RFCs.

The [Maintainer Guide](maintainer-guide.md) turns these governance rules into a
repository review, validation, merge, and release workflow. It does not replace
the RFC process or specialized security and architecture reviews.

## Maintainers

Maintainers are responsible for:

- protecting the specification-first scope
- reviewing contributions
- enforcing safety principles
- approving RFCs
- coordinating releases
- preserving provider and runtime neutrality

## Decision Process

Small documentation and schema clarifications may be accepted through pull request review.

Material changes require an RFC:

- new concepts
- manifest structure changes
- breaking schema changes
- runtime architecture choices
- security model changes
- extension lifecycle changes
- compatibility policy changes
- project or component license changes

## License And Patent Policy

The current license decision and its review triggers are recorded in
[Licensing And Patent Rationale](licensing-and-patent-rationale.md).

Maintainers must not change the repository or component license as a mechanical
documentation update. A proposed change requires a written decision, an
inventory of contribution rights, qualified legal review, and a migration plan
for notices, package metadata, documentation, and releases.

## RFC Stages

1. **Draft**: proposal is opened for discussion.
2. **Review**: maintainers and contributors evaluate tradeoffs.
3. **Accepted**: proposal is approved for implementation.
4. **Implemented**: docs, schemas, and examples are updated.
5. **Superseded**: proposal is replaced by a later RFC.
6. **Rejected**: proposal is closed without adoption.

Runtime architecture decisions also use the
[Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md).
That review requires pinned comparative evidence, mandatory security and
boundary gates, explicit ownership, and closure of every blocker before an RFC
may become Accepted. The specialized checklist supplements rather than
replaces maintainer approval.

## Breaking Changes Policy

Breaking changes require:

- an RFC
- migration notes
- compatibility impact
- changelog entry
- versioning update

## Deprecation Policy

Deprecated fields should remain documented for at least one minor spec cycle unless they create an unsafe ambiguity.

Deprecation notices should include:

- replacement field or pattern
- rationale
- migration guidance
- expected removal version if known

## Conflict Resolution

Maintainers should prefer written rationale over authority. When consensus is not possible, maintainers may make a decision and document the reason in the RFC.
