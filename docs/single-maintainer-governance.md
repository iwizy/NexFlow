# Single-Maintainer Governance

## Status And Scope

Policy proposed in [Draft RFC-0024](../rfcs/RFC-0024-single-maintainer-governance.md)
for NF-101. It becomes effective only after the maintainer explicitly approves
this policy PR and its adopted commit is recorded. Preparing or merging the
policy does not accept RFC-0023, complete its review, acknowledge owner
obligations, authorize runtime implementation, or authorize a release.

Single-maintainer mode applies while exactly one human maintains NexFlow. It
allows that person to author, review and own multiple components. It replaces
only the runtime architecture reviewer's headcount and cross-person
reconciliation requirements. It does not waive technical, security, distribution,
compatibility, licensing or release requirements. External legal review,
certification and separately required independent release/security assessment
remain outside this exception. Record a return to default independent review
when another maintainer joins; neither mode establishes another person's consent.

## One Person, Two Review Lenses

Every new architecture review must identify `reviewMode: single-maintainer`,
the sole maintainer, the adopted policy commit, the reviewed RFC commit and the
same immutable report/evidence revisions for both lenses:

- Architecture: specification fidelity, diagnostics, compatibility, component
  and package boundaries, startup, conformance and the three required layouts.
- Security: isolation, filesystem/network/process/credential effects,
  dependency and license closure, advisories, artifact lifecycle, signing,
  provenance, supported targets and incident boundaries.

Disclose whether the maintainer authored the evaluated work and any other
conflict. Self-review is allowed and must be named as such; it is not independent
assurance. Two sections, repeated checks or separate sessions are not two people.
CI and scripts verify evidence, not human identity, consent or approval.

Use one evidence-linked candidate scorecard per eligible candidate, preserving
the [original criteria and weights](language-evaluation-matrix.md#weighted-criteria).
Do not score an ineligible candidate to compensate for failed hard gates. Replace
two-person reconciliation with one written review summary preserving findings,
uncertainty, disagreements between lenses and all unresolved blockers. Independent
feedback remains welcome and must not be represented as received when absent.

## Runtime Architecture Gate Amendment

Apply this table to the preserved
[eleven-gate framework](../rfcs/reviews/runtime-architecture-decision-review.md).
The framework's original two-person text remains historical evidence; this
explicitly adopted amendment governs new single-maintainer reviews.

| Surface | Single-maintainer requirement |
| --- | --- |
| Gate 2 / weighted scorecards | One named maintainer completes both lenses and one evidence-linked scorecard per eligible candidate on identical pinned inputs. A written review summary replaces cross-person reconciliation. |
| Gate 9 / operations | The same maintainer may own operations, CI, distribution and signing coordination, but must acknowledge every applicable scope. Actual signing authority and lifecycle evidence remain required. |
| Gate 11 / governance | One actual maintainer signs off on the exact reviewed revision, with self-authorship/conflicts and all residual risks disclosed. |
| Acceptance rule item 5 | One actual completed, revision-bound maintainer review covering both lenses replaces the two-reviewer minimum. |
| All other gates and acceptance items | Unchanged: all eleven gates must pass, blockers must be closed and verified, immutable evidence must resolve, ownership must be acknowledged and the exact acceptance revision must be recorded. |

A failed, partial, unsupported, unknown or not-tested technical requirement
remains a blocker. No favorable score, sole-maintainer vote, CI or merge turns it
into a pass. No blanket exception for signing, native targets, measurements,
advisories, security boundaries or candidate eligibility is introduced.

## Ownership And Support

One human may acknowledge all seven scopes: CLI, validation libraries, future
runtime, security, dependencies, release/CI and signing/distribution. Record each
scope separately with the accepted obligations, support window, dependency update
policy, incident/escalation authority, backup and applicable signing authority.
An absent backup may be disclosed as `none` with continuity risk; it must not be
invented. A pre-release best-effort/no-SLA window may be chosen and explicitly
acknowledged; the policy does not promise it on anyone's behalf.

Future runtime scope may be limited to design ownership, with implementation and
on-call support not offered. Signing coordination is not possession of a key or
permission to sign. Unavailable signing and target capabilities stay blocked for
claims that require them. Deferred scope needs explicit rationale and cannot
hide an applicable acceptance blocker. No new credentials or production access
are granted by assigning ownership.

NF-101 can later be completed under this adopted mode by a new dated record of
the named sole maintainer, policy adoption and all applicable role
acknowledgements. It no longer needs two reviewer appointments in that mode.
This policy PR itself supplies neither those acknowledgements nor NF-102's
actual evidence review. NF-103 release readiness stays separate.

## Separate Human Acceptance

After review and closure of every mandatory gate, record a separate explicit
maintainer decision: outcome, exact RFC/evidence/policy revisions, review record,
accepted obligations, rationale, date and maintainer identifier. The decision
may be `not-ready`, `changes-requested`, `accepted` or `rejected`.

Do not infer `accepted` from opening or merging a PR, a completed form, a
candidate assessment, an empty blocker list or successful CI. A policy-adoption
decision is not a runtime-architecture decision. RFC-0023 stays Draft/not-ready
until its own evidence and explicit acceptance actually exist.

## Reports And Compatibility

Historical candidate reports, RFC-0023, its review bundle, the eleven-gate
framework and the 2026-10-09 pending ownership snapshot retain their original
bytes, hashes and two-person assessments. New repair results do not rewrite
older failures. New policy and new reviews are forward-only records.

The repository report assessor keeps the historical two-person rule by default.
For a new single-maintainer candidate report, supply a separate completed
[review context](../evaluation/single-maintainer-review.template.json):

```sh
node scripts/runtime-evaluation-report.mjs candidate.json --review-context review.json
```

The context pins the adopted policy, reviewed RFC/report commits and SHA-256 of
the report serialized with `JSON.stringify(report)` (no trailing newline).
It must match exactly one scorecard identity, completed architecture/security
lenses, authorship disclosure and a cataloged review summary. Unknown modes,
blank/stale contexts and fabricated independent-review claims fail closed.
The context is an assertion for human verification, not proof of adoption,
identity or consent. The assessor never returns architecture acceptance and
must retain every unrelated technical blocker. Its `candidate-evidence-complete`
result means report completeness only, not Accepted architecture.

The shipped context is a blank template, not a completed review or authorization.
No manifests, schemas, candidate code, dependencies, locks, versions, support
claims, branch protection, releases or signed artifacts change with this policy.
