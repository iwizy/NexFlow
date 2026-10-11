# NF-101: Single-Maintainer Assignment And Ownership — 2026-10-11

## Decision And Authority

**NF-101 completed in single-maintainer mode; runtime architecture not-ready.**

Alexander Agafonov explicitly accepted the new governance rules, authorized
merging [PR #115](https://github.com/iwizy/NexFlow/pull/115) and directed completion
of NF-101 under those rules after delegating organizational choices. This dated
record implements that direction for his own project roles, not another person's
consent. It paraphrases only the decision and publishes the established maintainer
identifier, not private conversation, contact details or a fabricated signature.

The adopted [policy](../../docs/single-maintainer-governance.md) is pinned at
`2cd3b442d4549f0e5c1cd4c4363f9449796010df`; its unchanged tree was merged as
`f6a1f5cb26ea2c048d950039641a951b04e19db4`. The
[machine-readable record](2026-10-11-single-maintainer-ownership.json) binds that
policy's SHA-256 and records each applicable role separately. RFC-0024 is Accepted
for governance only. RFC-0023 remains Draft/not-ready.

## Review Assignment, Not A Completed Review

Alexander is the one assigned human reviewer for both architecture and security
lenses on the review inputs at `f6a1f5cb26ea2c048d950039641a951b04e19db4`.
Authorship/conflict declaration: sole project maintainer reviewing own project
materials; **self-review, no independent assurance**. There is no second person,
external reviewer, score, reconciliation, completed review or runtime acceptance
in this task. NF-102 must perform the actual revision-bound review, retaining all
technical failures and only scoring eligible candidates. Later changed inputs
require new exact revisions, not a floating branch reference.

## Acknowledged Maintenance Roles

All seven roles belong to Alexander Agafonov under the delegated decision above.
Each adopts the common support, update, escalation and continuity limits below.

| Role | Accepted obligations and limits |
| --- | --- |
| CLI | Maintain validation-only commands, diagnostics and compatibility checks; no runtime execution. |
| Validation libraries | Maintain pure APIs, schema/semantic coverage, fixtures, version mapping and disclosed unsupported behavior. |
| Future runtime | Design-only ownership of authority/effect boundaries and review routing. Implementation, production operations and on-call support are not offered; revisit before that scope starts. |
| Security | Coordinate private reporting, boundary review, triage and follow-up under [SECURITY.md](../../SECURITY.md); preserve risks and stop unsupported publication claims. No independent certification or response SLA. |
| Dependencies | Own dependency/license inventories, advisory triage and reviewed updates; preserve locks/provenance and separate repair authority for frozen candidates. |
| Release / CI | Maintain checks, receipts, checksum/provenance requirements and release controls. Publication still requires a separate decision and real target evidence. |
| Signing / distribution | Coordinate target provisioning and permitted signing requests only. No keys, certificates, notarization or target access are supplied or authorized. Missing capabilities remain blockers. |

Support is **pre-release best-effort, no SLA**, at available maintenance sessions:
no fixed hours, response deadline, availability guarantee or product support.
Review advisories for changed dependencies and before releases; triage reported
risks at the next available session. No unattended updates or automatic lock edits.
Alexander owns incident coordination and escalation under the existing private
reporting process, may stop publication and propose repairs, but operation-specific
approval rules still apply. Infrastructure, credential, scope, release and safety
decisions escalate to the same maintainer; no external responder is appointed.

Backup: **none**. Explicit continuity risk: maintenance and response may stop
when the sole maintainer is unavailable. No runtime on-call service or newly
supported product target is promised. Evaluation targets are not supported
installations. Record a return to independent review when another maintainer joins.

## Completion Boundary And Remaining Work

NF-101's organizational deliverable is complete: one assigned human, adopted
policy and seven acknowledged bounded roles. This does not close architecture
gates 2, 9 or 11: completed evidence review, actual signing/lifecycle capability
and a separate revision-specific architecture decision are still required.
All eleven technical gates, retained failures and unsupported/not-tested results
remain mandatory. NF-102 review and NF-103 release readiness remain separate.

The [2026-10-09 pending snapshot](2026-10-09-runtime-reviewer-ownership.md), blank
scorecards, RFC-0023, candidate reports, sources and locks are unchanged. Its
absence of consent at that date remains true; this is a forward-only new decision.
Unavailable signing authority, native-target/lifecycle, isolation, fidelity,
supply-chain and comparable-measurement evidence cannot be supplied by assigning
an owner. This task performs no candidate repair or scoring.

Only PR #115's merge was authorized here. No other PR is automatically merged,
and no architecture, runtime implementation, production/credential access,
signing, release, package, tag or version change is authorized by this record.

## Verification

`npm run single-maintainer-ownership-smoke` checks the adopted Git revision,
merge parents/tree, policy hash, seven role records, bounded support and explicit
non-acceptance, with rejection controls. The governance, historical snapshot,
documentation, registry and full relevant checks remain required. Scripts check
record consistency, not human identity, consent or a cryptographic signature.
