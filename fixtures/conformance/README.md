# Conformance Claim Fixtures

This directory contains fictional, cataloged inputs for the standalone NexFlow
conformance claim format. It tests whether claim documents follow the declared
structure; it does not evaluate a tool, verify evidence, certify an
implementation, or publish a support claim.

## Layout

- [`index.json`](index.json) owns case identity, transformations, and expected
  results.
- [`valid/`](valid/) contains reusable claim bases for validator, CLI,
  extension, and service subject types.
- [`../../scripts/conformance-claim-smoke.mjs`](../../scripts/conformance-claim-smoke.mjs)
  applies the catalog and validates each result against the claim schema.

Every YAML base is intentionally fictional and must appear in at least one
catalog case. A valid base may support multiple focused negative cases.

## Catalog Contract

Each case contains exactly:

| Field | Purpose |
| --- | --- |
| `id` | Stable lowercase case identifier. |
| `description` | Public explanation of the tested boundary. |
| `base` | Relative YAML path contained by this fixture directory. |
| `patch` | Ordered transformation list; empty for an accepted base case. |
| `expected` | Expected validity and, for rejection, the JSON Schema error boundary. |

The patch list supports only the `add`, `remove`, and `replace` operations from
JSON Patch. Paths use non-root JSON Pointer syntax. Parent paths must already
exist, array indexes are bounded, and prototype-related object keys are
rejected. This deliberately small surface keeps fixtures deterministic without
copying a full claim for every invalid field.

An invalid expectation identifies:

- the JSON Schema `keyword`
- the exact `instancePath`
- optional error `params`, such as `missingProperty` or `additionalProperty`

The runner requires the transformed claim to fail and requires at least one
reported error to match that boundary. Other schema errors do not satisfy the
case accidentally.

## Run

From the repository root:

```sh
npm run conformance-claim-smoke
```

The check also validates the maintained YAML claim template and confirms that
the Markdown template includes every required section and conformance level.

## Add A Case

1. Reuse the smallest valid base that represents the subject and lifecycle.
2. Add a new base only when the accepted shape itself adds useful coverage.
3. Apply one focused transformation whenever possible.
4. Run the suite and record the exact schema keyword and instance path.
5. Keep all names, descriptions, URIs, and responsible parties fictional and
   public.
6. Update the claim schema and documentation together when the tested contract
   changes.

Passing these fixtures proves only that the repository recognizes the
cataloged claim shapes and rejection boundaries.
