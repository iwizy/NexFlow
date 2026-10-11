# RFC-0024: Single-Maintainer Governance

## Status

Accepted

Alexander Agafonov explicitly accepted this governance amendment on 2026-10-11
and authorized merging [PR #115](https://github.com/iwizy/NexFlow/pull/115).
Adopted policy revision: `2cd3b442d4549f0e5c1cd4c4363f9449796010df`; merge revision:
`f6a1f5cb26ea2c048d950039641a951b04e19db4`. The
[dated adoption and ownership record](reviews/2026-10-11-single-maintainer-ownership.md)
records the rationale, authority and bounded roles. Acceptance applies to this
governance rule only, not RFC-0023, a completed technical review or a release.

## Summary

Permit one named maintainer to author, review and own NexFlow during its
single-maintainer phase. Replace the architecture review's two-person minimum
with disclosed self-review through separate architecture and security lenses,
one scorecard per eligible candidate and a written review summary. Preserve
every technical gate and require a separate explicit human acceptance decision.

The normative policy is [Single-Maintainer Governance](../docs/single-maintainer-governance.md).
It amends organizational parts of the existing architecture review framework,
not the specification, runtime authority model or candidate evidence.

## Motivation

A two-person appointment prerequisite cannot be fulfilled honestly in a project
with one maintainer. Repeated pending records do not provide reviewers. An
explicit, bounded single-maintainer policy is clearer than fabricated identities,
duplicated self-reviews presented as independence or silent exceptions.

## Proposal

1. Adopt single-maintainer mode explicitly and pin the adopted policy commit in
   each future review. Default/historical reports keep the original rule.
2. Allow one person to review their own work, disclosing authorship/conflicts and
   the lack of independent assurance. Complete both review lenses on identical
   immutable inputs, without changing criteria, weights or eligibility rules.
3. Amend only the reviewer/reconciliation portions of gates 2, 9, 11 and
   acceptance rule item 5 as described in the policy. All eleven technical
   gates and closure of every blocker remain mandatory.
4. Allow one person to acknowledge multiple ownership scopes. Require real
   acknowledgement of every applicable obligation, realistic support and
   continuity limits, and actual signing/target authority where required.
5. Keep policy adoption, NF-101 organizational acknowledgement, NF-102 completed
   review, architecture acceptance and NF-103 release readiness distinct.
6. Return to independent review when the project gains another maintainer.
   Preserve external legal, certification and separately required independent
   release/security reviews; this is not a general waiver.

## Compatibility Impact

No manifest, schema, diagnostic contract, candidate source, dependency, lock,
package version or product support claim changes. Historical evidence remains
byte-for-byte unchanged and assessed under its original policy. The report
assessor gains an explicit optional context for new single-maintainer reviews;
existing callers keep identical two-person behavior. The historical decision
bundle reads its pinned governance bytes even as current governance evolves.

## Security and Safety Impact

Self-review reduces independent assurance. Disclose that limitation and preserve
architecture/security lenses, exact evidence, negative tests, unresolved risks,
all technical gates and separate human acceptance. This proposal cannot waive
failed isolation, missing native lifecycle/signing, dated advisory review,
missing measurements or absent conformance evidence. It grants no runtime,
provider, credential, production, signing or publication authority.

## Alternatives Considered

- Keep the two-person rule: suitable for a multi-maintainer project, but leaves
  this phase blocked without actual appointments and consent.
- Treat two passes as independent people: rejected as a false assurance claim.
- Waive technical gates along with headcount: rejected; organizational scale
  does not supply missing safety, compatibility or distribution evidence.
- Adopt this bounded one-person mode: accepted, with reduced independence
  disclosed and all technical requirements preserved.

## Open Questions

- Actual ownership acknowledgements and support/backup limits are recorded in
  the new NF-101 record. Signing/distribution ownership is coordination-only;
  permitted signing and native-target capabilities remain unavailable/blocking.
- Actual completed review and technical blocker closure remain future work.
- A return to independent review needs a new record when another maintainer joins.

## Verification And Adoption

Run `npm run single-maintainer-governance-smoke`, the existing historical review
checks, documentation/feature inventory checks and the full relevant suite.
The focused check exercises default and explicit single-maintainer assessments,
rejects incomplete/unknown/stale contexts and retains failed technical gates.
No test result accepts this RFC or RFC-0023: this policy's adoption is based on
the explicit maintainer decision, not CI. PR #115 was merged under that direct
authorization. No release or version bump is part of adoption; RFC-0023 stays Draft.
