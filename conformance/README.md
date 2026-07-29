# NexFlow Conformance Claim Templates

This directory contains the standalone artifacts used to publish a precise,
self-declared NexFlow compatibility claim:

- [`conformance-claim.schema.json`](conformance-claim.schema.json) validates the
  machine-readable claim format.
- [`conformance-claim.template.yaml`](conformance-claim.template.yaml) is the
  machine-readable authoring template.
- [`CONFORMANCE-CLAIM.template.md`](CONFORMANCE-CLAIM.template.md) is the
  corresponding human-readable template.

The canonical semantics, status vocabulary, evidence rules, and publication
workflow are documented in
[Conformance Claims](../docs/conformance-claims.md).

These files do not define a NexFlow project manifest kind. A conformance claim
describes support for a named subject version. It does not grant capabilities or
permissions, satisfy approvals, certify an implementation, or prove runtime
safety.

## Validate A Claim

Install the pinned repository dependencies and run:

```sh
npm run conformance-claim-smoke
```

The command validates the YAML template and focused positive and negative cases.
It also checks that the human-readable template names every current conformance
level and required section.

## Publish A Claim

1. Copy both templates into the subject's own release or documentation area.
2. Replace every placeholder with facts about one exact subject version.
3. Use the same scope, status, evidence, and limitations in both formats.
4. Validate the YAML claim against the schema.
5. Publish both files together and link them from release or compatibility docs.
6. Withdraw or replace the files when the claim becomes inaccurate.

The YAML file is authoritative for machine consumption. The Markdown file is the
reader-facing explanation and must not broaden the YAML claim.
