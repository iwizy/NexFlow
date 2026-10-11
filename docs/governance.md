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

### Review Modes

The project may operate with one maintainer under the explicit
[Single-Maintainer Governance](single-maintainer-governance.md) policy proposed
in [RFC-0024](../rfcs/RFC-0024-single-maintainer-governance.md). Adoption requires
maintainer approval of that policy PR; opening it or passing CI is not adoption.
The adopted policy revision must be pinned in each later review record.

In that mode one named human may author, review and maintain the work, with
authorship disclosed and separate architecture and security review sections.
Those sections are not two independent people. A written, revision-bound
maintainer decision is still required; no architecture is accepted by a commit,
CI result or merge alone. All technical and safety gates remain mandatory.

Without explicit single-maintainer adoption, the existing two-independent-
reviewer rule for runtime architecture remains the default. External legal,
licensing, certification and separately required release/security reviews are
outside this exception. A later multi-maintainer project returns to independent
review; a governance change cannot manufacture missing consent or past reviews.

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
Read that historical framework together with the adopted review-mode policy.
Only reviewer cardinality, self-review disclosure and reconciliation differ in
single-maintainer mode; all eleven gates, pinned comparative evidence, security
and boundary gates, explicit ownership, and closure of every blocker before an
RFC may become Accepted are retained. The specialized checklist supplements
rather than replaces maintainer approval.

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
