# NexFlow Profiles

This directory contains machine-readable authoring profile definitions.

Profile definitions are specification assets, not project manifests. They do
not use a project manifest `kind`, do not participate in manifest discovery,
and do not grant runtime behavior.

The current registry contains:

- `core.yaml` - the minimum useful project and participant profile, optional
  module qualifiers, reference-driven dependency rules, and fail-closed
  omission semantics.
- `core-profile.schema.json` - the JSON Schema used to validate the profile
  definition itself.

Use [Core Profile](../docs/core-profile.md) for normative semantics and
migration guidance. Run `npm run core-profile-smoke` to validate the registry,
the reduced Project shape, and focused profile conformance cases.
