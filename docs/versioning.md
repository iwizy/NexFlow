# Versioning

Every NexFlow manifest MUST include `specVersion`.

```yaml
specVersion: "0.1"
```

## Version Format

NexFlow uses semantic versioning for stable releases:

- `MAJOR`: incompatible specification changes
- `MINOR`: backward-compatible feature additions
- `PATCH`: clarifications and compatible fixes

Draft versions may use `0.x` until the specification stabilizes.

## Manifest Versioning

All manifests in one project SHOULD use the same `specVersion`.

A future runtime MAY support mixed versions during migration, but it MUST make compatibility behavior explicit.

## Migration Policy

Breaking changes require:

- an RFC
- migration guidance
- example updates
- schema updates
- changelog entry

Migration guides should explain:

- old field or behavior
- new field or behavior
- compatibility impact
- suggested automated migration if possible

## Stability Expectations

Version `0.1` is a draft. Names, fields, and schemas may change before `1.0`.

The project should avoid churn unless it materially improves clarity, safety, or interoperability.
