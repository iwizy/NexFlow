# NexFlow Release Evidence

This directory contains standalone artifacts for recording release decisions.
They are repository maintenance records, not NexFlow project manifests, release
announcements, conformance certificates, or runtime guarantees.

## 0.1 Candidate Record

- [`candidate-readiness.schema.json`](candidate-readiness.schema.json) validates
  the machine-readable record format.
- [`0.1-candidate-readiness.template.yaml`](0.1-candidate-readiness.template.yaml)
  is the authoring template for a candidate review.
- [0.1 Readiness Checklist](../docs/readiness-checklist.md) defines the review
  criteria and evidence expectations.

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

The record format uses `recordVersion`, independently from manifest
`specVersion`, conformance `claimVersion`, and any eventual release tag.
