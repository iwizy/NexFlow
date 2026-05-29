# Governance

NexFlow uses lightweight open governance centered on maintainers, public discussion, and RFCs.

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

## RFC Stages

1. **Draft**: proposal is opened for discussion.
2. **Review**: maintainers and contributors evaluate tradeoffs.
3. **Accepted**: proposal is approved for implementation.
4. **Implemented**: docs, schemas, and examples are updated.
5. **Superseded**: proposal is replaced by a later RFC.
6. **Rejected**: proposal is closed without adoption.

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
