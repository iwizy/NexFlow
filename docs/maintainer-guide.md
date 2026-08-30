# Maintainer Guide

This guide describes how NexFlow maintainers route, review, validate, merge,
and release repository changes. It complements the contributor workflow in
[`CONTRIBUTING.md`](../CONTRIBUTING.md), the decision rules in
[Governance](governance.md), and the proposal process in
[RFCs](../rfcs/README.md).

NexFlow is specification-first. Maintainer decisions must keep documentation,
schemas, examples, fixtures, tooling, compatibility statements, and release
claims aligned. Repository tooling is validation evidence; it is not a runtime
implementation or execution authority.

## Maintainer Responsibilities

Maintainers are expected to:

- protect provider neutrality, runtime neutrality, human authority, least
  privilege, and explicit approval boundaries
- route material design decisions through the RFC process
- require compatibility and migration analysis for behavior-significant change
- keep public claims limited to reviewed repository evidence
- maintain synchronized docs, schemas, examples, fixtures, tests, and changelog
- review reports through the security process without exposing sensitive detail
- make release and deprecation decisions from exact, reproducible revisions

Maintainer status does not replace written rationale, review evidence, or the
special acceptance gates for runtime architecture decisions.

## Route The Change

Classify a proposed change before editing files.

| Change | Normal route | Minimum synchronized surfaces |
| --- | --- | --- |
| Typo, link, or non-normative clarification | Pull request | Owning document and affected indexes |
| Normative clarification with unchanged manifest shape | Pull request; RFC when semantics or compatibility change materially | Owning docs, example or fixture, validation evidence, compatibility notes, changelog |
| Manifest or schema shape change | Usually RFC, then implementation pull request | Manifest reference, schema, example or fixture, migration guidance, compatibility matrix, validation, changelog |
| New core concept, security rule, extension lifecycle, or compatibility policy | RFC | RFC index, owning docs, schemas and examples when implemented |
| Runtime language or architecture decision | Dedicated RFC after the Runtime Architecture Decision gates pass | Pinned comparative evidence, review record, ownership, threat and credential boundaries, target matrix |
| Repository tooling change | Pull request unless it changes a standard contract | Tool code, focused tests, CI, usage docs, diagnostic and compatibility statements |
| Release or deprecation | Maintainer-reviewed release process | Versioning, compatibility, migration, changelog, release evidence, badges and status docs |
| License change | Written decision and qualified legal review | Contribution-rights inventory, notices, repository metadata, docs, migration plan |

When uncertain, open a Draft RFC or issue that frames the decision without
claiming acceptance. Do not merge an implementation merely to create evidence
for a decision that is still blocked.

## Source Of Truth

Use the owning surface instead of copying a rule into unrelated documents.

| Concern | Authoritative starting point |
| --- | --- |
| Concepts and manifest meaning | [Concepts](concepts.md), [Manifest Reference](manifest-reference.md), accepted RFCs |
| Structural shape | `schemas/*.schema.json` and [Schema Guide](../schemas/README.md) |
| Minimum adoption | [Core Profile](core-profile.md) and `profiles/core.yaml` |
| Cross-manifest meaning | [Semantic Reference Inventory](semantic-reference-inventory.md) and focused checks |
| Diagnostics | [Diagnostic Code Catalog](diagnostic-code-catalog.md) |
| Compatibility and migration | [Compatibility](compatibility.md), [Versioning](versioning.md), migration guides |
| Current implementation claims | [Compatibility Matrix](compatibility-matrix.md), README status, Unreleased changelog |
| Safety | [Security Model](security-model.md), approval, network, override, extension, provider, and audit boundaries |
| Release readiness | [Release Plan](release-plan.md), readiness records, exact release evidence |
| Public vulnerability reporting | [`SECURITY.md`](../SECURITY.md) |

An RFC can propose a future rule without making it implemented. A schema can
prove structure without proving reference resolution, policy correctness, or
runtime enforcement. An example demonstrates composition without granting
access or executing work.

## Prepare A Change

1. Start from a clean worktree and confirm the intended branch and repository.
2. Read the owning documents, related RFC status, compatibility matrix entry,
   and current Unreleased changelog.
3. Define what changes, what stays compatible, and what remains unsupported.
4. Identify every synchronized surface before editing.
5. Prefer the smallest change that proves the intended contract.
6. Add focused positive and negative evidence proportional to the risk.
7. Keep unrelated formatting, generated churn, and private working material
   out of the public diff.

The current repository convention uses `develop` as the integration branch and
opens reviewed pull requests into `main`. Confirm current hosting rules before
merging; repository documentation does not substitute for branch protection.

## Synchronization Rules

For manifest behavior changes, review this set as one unit:

- owning specification and manifest-reference sections
- matching JSON Schema and shared definitions
- at least one maintained example or focused fixture
- semantic or boundary checks when JSON Schema cannot express the rule
- migration and compatibility guidance
- diagnostic catalog when emitted conditions or meanings change
- README, docs index, matrix, roadmap, and limitations when support claims move
- Unreleased changelog

For examples, keep Project source hints, `metadata.project`, actor and agent
bridges, IDs, references, lifecycle states, approval gates, and dependency
closure consistent. A reduced Core Profile example need not carry empty
optional modules. A complete example should follow
[the consistency checklist](../examples/CHECKLIST.md).

For RFCs, update the RFC status in the document and RFC index together. The
`Implemented` stage requires the accepted rule to be represented across all
affected specification surfaces; code or prose in isolation is insufficient.

## Validate Locally

Install exactly the pinned maintenance dependencies:

```sh
npm ci --ignore-scripts
```

Run `npm run validate` for every change. It checks schema JSON, example YAML,
kind coverage, schema compilation, and structural validation.

Run focused checks for the surfaces changed. Before merge, run the complete set
used by `.github/workflows/schema-smoke.yml`:

```sh
npm run validate
npm run negative-schema-fixtures
npm run typed-reference-schema-smoke
npm run work-reference-namespace-smoke
npm run approval-gate-target-schema-smoke
npm run actor-schema-smoke
npm run agent-identity-schema-smoke
npm run agent-definition-authority-smoke
npm run core-profile-smoke
npm run manifest-discovery-smoke
npm run cli-prototype-smoke
npm run cli-validation-smoke
npm run cli-diagnostics-smoke
npm run human-override-schema-smoke
npm run mcp-extension-smoke
npm run a2a-extension-smoke
npm run provider-feature-schema-smoke
npm run provider-constraint-schema-smoke
npm run conformance-claim-smoke
npm run candidate-readiness-smoke
npm run semantic-smoke
```

Also run:

```sh
git diff --check
git status --short --ignored
```

Review ignored and untracked paths before staging. Commit only public project
files. Do not publish credentials, private keys, tokens, personal data,
machine-specific paths, local agent instructions, editor state, private plans,
or internal workflow notes.

Passing checks do not prove runtime safety or full conformance. Record checks
that actually ran, their results, and any relevant gaps. An absent CI result is
not a passing result.

## Review A Pull Request

Review findings before summaries. Check:

- the change matches its stated scope and uses the correct decision route
- normative terms are deliberate and consistent
- implementation and support claims cite current evidence
- schema, docs, examples, fixtures, diagnostics, and migration guidance agree
- safety defaults remain fail-closed and human authority remains explicit
- provider-specific details do not leak into core semantics
- validation does not become execution, remote access, credential use, or
  hidden runtime preflight
- new references have exact namespaces and dependency closure
- failures, unsupported cases, and compatibility impact are visible
- the diff contains no unrelated, generated, private, or sensitive material

Require at least one appropriate maintainer review for ordinary changes.
Security-sensitive, breaking, licensing, release, or architecture changes may
need additional domain review under their owning process.

Merge only when required review is complete, local and required remote checks
pass, conflicts are resolved, and blockers are closed or explicitly moved to a
non-blocking follow-up with rationale. Do not treat mergeability alone as
readiness.

## Manage RFCs

Maintainers should keep the RFC stage factual:

1. `Draft` while the proposal, tradeoffs, safety, and compatibility are being
   developed.
2. `Review` when the proposal is complete enough for a decision.
3. `Accepted` only after required reviewers approve and blockers are closed.
4. `Implemented` only after every required repository surface is synchronized.
5. `Rejected` or `Superseded` with a written reason and replacement when
   applicable.

Do not infer consensus from silence. Record dissent, unresolved questions, and
the evidence used for material decisions. Runtime architecture follows its
special review framework in addition to this process.

## Prepare A Release

1. Select the exact candidate commit and keep it unchanged during evaluation.
2. Confirm the intended specification, schema, profile, diagnostic, and tool
   versions independently; they do not advance automatically together.
3. Run the complete repository checks against that exact revision.
4. Review docs, schemas, examples, RFCs, compatibility, limitations, safety,
   migration notes, and changelog as one release surface.
5. Complete the applicable readiness record with real evidence and reviewer
   identity. A template is not evidence.
6. Publish notes that separate implemented, partial, specified, planned, and
   unsupported behavior.
7. Update README badges and status text only when the release or version change
   actually exists.
8. Tag and publish through the repository release process, then verify links
   and artifacts from a clean checkout.

Never describe schema validation as execution readiness, a runtime, provider
availability, policy enforcement, certification, or security approval.

## Security And Corrections

Follow [`SECURITY.md`](../SECURITY.md) for vulnerability reports. Do not move a
private report into an issue, pull request, RFC, changelog, or example before a
coordinated disclosure decision. Keep secrets and exploit details out of logs
and validation fixtures.

For an incorrect public claim or unsafe example, correct the authoritative
surface first, then synchronize indexes, compatibility statements, changelog,
and migration guidance. Preserve release history: describe what a historical
tag contained instead of rewriting it as if the correction had always existed.

## Handoff Checklist

Before handing maintenance work to another reviewer, state:

- exact repository revision and branch
- intended change and decision route
- files and contracts affected
- compatibility, migration, security, and autonomy impact
- checks completed and their exact outcomes
- remaining blockers, open questions, and required reviewers
- release, documentation, or follow-up work that remains

Keep the handoff factual and safe to publish with the project. Do not include
credentials, private correspondence, personal schedules, or unrelated local
context.
