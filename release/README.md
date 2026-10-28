# NexFlow Release Evidence

This directory contains standalone artifacts for recording release decisions.
They are repository maintenance records, not NexFlow project manifests, release
announcements, conformance certificates, or runtime guarantees.

Completed commit-bound records may be published as GitHub release assets. This
avoids embedding a self-referential commit hash in the commit being evaluated
while keeping the record, check output, and review attached to the exact tag.

## 0.1 Candidate Record

- [`candidate-readiness.schema.json`](candidate-readiness.schema.json) validates
  the machine-readable record format.
- [`0.1-candidate-readiness.template.yaml`](0.1-candidate-readiness.template.yaml)
  is the authoring template for a candidate review.
- [0.1 Readiness Checklist](../docs/readiness-checklist.md) defines the review
  criteria and evidence expectations.
- [0.1 Candidate Scope](../docs/0.1-scope.md) defines the frozen baseline,
  feature treatment, deferred work, and blockers used by the review.

The template starts in `not-evaluated` state. Before making a release decision,
maintainers should replace every placeholder, attach factual evidence, and run:

```sh
npm run candidate-readiness-smoke
```

The command checks the template, schema decision guards, required gate set, and
focused positive and negative cases. It does not run the evidence commands,
verify external links, approve a tag, publish a release, or prove runtime safety.

## Decision Rules

- `ready` and `ready-with-notes` require an exact 40-character commit hash, an
  evaluation timestamp, a decision maker, no unresolved blockers, and every
  gate to be `passed` or `not-applicable`.
- `blocked` requires at least one unresolved blocker.
- `deferred` records an intentional decision to postpone the review.
- `not-evaluated` is the only valid template default and makes no release claim.

Every outcome other than `not-evaluated` requires an exact candidate commit,
evaluation timestamp, decision maker, and rationale so the decision remains
auditable.

A ready decision must also identify the scope document revision used for the
review and include factual closure evidence for every blocker listed there.

The record format uses `recordVersion`, independently from manifest
`specVersion`, conformance `claimVersion`, and any eventual release tag.

## Milestone Reviews

- [0.2 Validation And Conformance Review](0.2-release-review.md) maps the released
  release to all eight `0.2` criteria and its compatibility boundary.
- [0.3 Semantic Consistency Review](0.3-release-review.md) maps the released
  release to all twelve `0.3` criteria and distinguishes structural checks,
  partial semantic evidence, manual expectations, and unimplemented behavior.
- [Preparation Check Results](0.2-0.3-preparation-checks.md) records the exact
  source revision, commands, results, CI links, and evidence limitations.

The maintainer approved the two scopes and sequential publication on
`2026-10-01`, subject to final candidate checks. Both releases are now published
and verified, each with its own exact commit, full checks, completed review,
readiness record, and checksums attached to GitHub:
[v0.2.0](https://github.com/iwizy/NexFlow/releases/tag/v0.2.0) and
[v0.3.0](https://github.com/iwizy/NexFlow/releases/tag/v0.3.0).

Preserve real publication dates and history. Each future eight-gate record
must also cite its milestone-specific criteria; passing the generic record
schema alone does not complete them.

## 0.4 Runtime Decision Readiness

Published and verified as [v0.4.0](https://github.com/iwizy/NexFlow/releases/tag/v0.4.0)
on 2026-10-28, after the explicit merge/publication instruction. The
[publication receipt](0.4-publication.md) binds release commit
`5cb33caad080f61808949c1de17df2879da9996f`, 68 exact-source checks, five main CI
workflows, all five downloaded assets and all 1,059 source-archive files.
Assets contain source-bound decision/evidence/checksums; no executable package
or runtime is published. Historical readiness records keep their original bytes.

Prepublication preparation: the [October 28 completion review](0.4-completion-review.md)
and [exact-candidate record](0.4-completion/record.json) close NF-103 with
`ready-with-notes` for a repository source/decision/evidence milestone. Both
previous blockers have explicit dispositions; rejected candidates and upstream
affected versions stay visible. [Prepublication draft notes](0.4-completion-notes.md)
describe the offered format and limits. Those records did not grant publication;
the subsequent explicit instruction and actual service/download verification are
recorded in the separate publication receipt. Independent version domains remain
unchanged, and package registry publication is not included.

`node scripts/release-0-4-completion-smoke.mjs` verifies the forward comparison
amendment, every new graph/advisory input, exact code/inventory bindings,
candidate checks/CI and the separate readiness decision. It makes no general
runtime/toolchain safety or independent review claim.

The [October 26 review](0.4-readiness-review.md) assesses the unchanged eight
release-plan criteria at one exact source commit. It records `not-ready`, 66
passed source checks, scoped Accepted RFC-0025 evidence, two owned release
blockers and a fresh nine-graph advisory refresh. The
[record and immutable index](0.4/record.json), [checksums](0.4/SHA256SUMS) and
[unpublished draft notes](0.4-release-notes.md) preserve the distinction between
architecture acceptance and release approval.

`node scripts/release-0-4-readiness-smoke.mjs` verifies source bindings, response and file
integrity, eight-criterion coverage and retained blockers. It does not scan for
new vulnerabilities, re-run native benchmarks, amend the release plan, approve
publication or manufacture maintainer consent. Its original open-blocker record
is preserved; the October 28 completion above is the forward outcome.

## 0.2 Validation Checkpoint

The dated [validation/conformance checkpoint](../docs/0.2-validation-checkpoint.md)
assesses all eight `0.2` criteria using a later immutable source baseline.
Its [source check record](0.2-validation-checkpoint-checks.md) distinguishes
45 actual local checks, exact-main CI and historical publication metadata.
Diagnostic and implementation-conformance gaps remain partial.

`npm run validation-checkpoint-smoke` checks bindings, completeness and
non-approval; it does not certify a validator, re-evaluate release assets,
refresh the older conformance statement or authorize publication. The existing
`v0.2.0` / `v0.3.0` decisions, tags, dates and assets are not rewritten.

## 0.5 Beta Preparation

The [beta preparation checkpoint](../docs/0.5-beta-checkpoint.md) assesses
B1–B8 at one exact source revision and remains `not-ready`. Its separate
[source checks](0.5-beta-checkpoint-checks.md) distinguish local maintenance
results, main CI and historical language experiment evidence from missing
artifact-level tests and independent release review.

`npm run beta-checkpoint-smoke` checks this preparation record's consistency,
coverage and non-approval. It does not use the `0.1` readiness schema as a beta
approval, evaluate a package, accept an architecture, or authorize publication.
Release evidence for future candidate bytes requires a new exact-candidate
record, real reviewer decisions, and completion of the preceding `0.4` gates.
