# NexFlow Fixtures

This directory contains focused repository-maintenance evidence for validation
boundaries that do not belong in the complete reference examples.

Fixtures are not runtime inputs, starter templates, or independent specification
documents. Their expected behavior is defined by the linked documentation and
verified by repository smoke commands.

## Fixture Inventory

| Fixture set | Expected state | Purpose | Check |
| --- | --- | --- | --- |
| [`cli/`](cli/) | Mixed, cataloged per case | Exercises successful CLI commands, stable discovery and schema failures, bounded initialization, runtime-like command rejection, JSON output contracts, and input mutation boundaries. | `npm run cli-fixture-smoke` |
| [`conformance/`](conformance/) | Mixed, cataloged per case | Exercises claim lifecycle, subject types, scope uniqueness and syntax, all six levels, evidence, limitations, snapshots, behavior separation, and self-declared attestation. | `npm run conformance-claim-smoke` |
| [`discovery/multi-workflow/`](discovery/multi-workflow/) | Valid | Exercises explicit Project source hints, logical assembly discovery, deterministic source ordering, and multiple Workflow documents. | `npm run manifest-discovery-smoke` |
| [`schema/invalid/`](schema/invalid/) | Intentionally invalid | Preserves stable rejection evidence for required fields, enum values, ID syntax, and unknown manifest kinds. | `npm run negative-schema-fixtures` |

The CLI corpus is registered in [`cli/index.json`](cli/index.json). Each case
declares its command, relative fixture root, arguments, exit status, performed
checks, diagnostic codes, bounded result counts, and mutation expectation. The
runner copies every fixture root to a temporary directory, validates each JSON
envelope against the repository-owned output contract, and verifies that the
source corpus is unchanged.

The conformance corpus is registered in
[`conformance/index.json`](conformance/index.json). Five fictional valid claims
provide reusable bases; cataloged `add`, `remove`, and `replace` operations
derive focused rejection cases without duplicating whole claim documents. The
runner validates catalog shape, contained paths, YAML parsing, expected schema
validity, and the exact keyword and instance path for every rejection.

## Fixtures And Examples

[Reference examples](../examples/README.md) are coherent project-level manifest
sets intended for readers. Every maintained example is expected to parse and
validate successfully.

Fixtures are narrower:

- valid fixtures isolate a particular validator or discovery boundary without
  presenting a complete reference team
- invalid fixtures must fail for their cataloged reason and are excluded from
  normal example validation
- a fixture does not establish complete semantic or runtime conformance

Use an example when a change teaches authors how NexFlow concepts compose. Use
a fixture when a small, stable input is the clearest evidence for one validation
contract. Some changes require both.

## Maintenance Rules

When adding or changing a fixture:

1. State whether it is expected to pass or fail and identify its owning check.
2. Keep each negative fixture focused on one primary rejection condition.
3. Use only public, fictional project data.
4. Update the relevant schema or validation documentation when the tested
   boundary changes.
5. Update a maintained example as well when the change affects recommended
   authoring practice.
6. Do not use fixtures to imply runtime execution or enforcement.
7. Keep CLI cases synchronized with the output contract and documented command
   boundary whenever a cataloged result changes.
8. Keep conformance case patches focused on one primary schema boundary and
   update the expected keyword, path, and parameters together.

## Related Guides

- [Schema Guide](../schemas/README.md) explains structural scope and schema
  update rules.
- [Validation](../docs/validation.md) documents repository checks and their
  limits.
- [Conformance](../docs/conformance.md) defines evidence-backed support claims.
- [Examples Guide](../examples/README.md) covers complete reference manifest
  sets.
- [Compatibility Matrix](../docs/compatibility-matrix.md) records current
  support and known gaps.
