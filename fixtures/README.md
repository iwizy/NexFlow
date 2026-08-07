# NexFlow Fixtures

This directory contains focused repository-maintenance evidence for validation
boundaries that do not belong in the complete reference examples.

Fixtures are not runtime inputs, starter templates, or independent specification
documents. Their expected behavior is defined by the linked documentation and
verified by repository smoke commands.

## Fixture Inventory

| Fixture set | Expected state | Purpose | Check |
| --- | --- | --- | --- |
| [`discovery/multi-workflow/`](discovery/multi-workflow/) | Valid | Exercises explicit Project source hints, logical assembly discovery, deterministic source ordering, and multiple Workflow documents. | `npm run manifest-discovery-smoke` |
| [`schema/invalid/`](schema/invalid/) | Intentionally invalid | Preserves stable rejection evidence for required fields, enum values, ID syntax, and unknown manifest kinds. | `npm run negative-schema-fixtures` |

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
