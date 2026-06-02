# Compatibility

NexFlow compatibility is about preserving the meaning of manifests across tools and time.

## Compatibility Goals

- A manifest should mean the same thing across runtimes.
- A runtime should reject unsupported versions clearly.
- A schema should validate common structural errors.
- Examples should remain valid for the spec version they target.
- Extensions should not change core semantics silently.

## Compatibility Classes

### Compatible Changes

- adding optional fields
- clarifying documentation
- adding new event types
- adding new capabilities
- adding examples
- tightening unsafe language without changing manifest meaning

### Potentially Breaking Changes

- renaming fields
- changing default approval behavior
- changing memory visibility semantics
- changing capability meaning
- removing fields
- changing required fields
- changing event payload structure

## Extension Compatibility

Extensions MUST declare a namespace and lifecycle state. A runtime that does not understand an extension SHOULD preserve it when possible and MUST NOT treat it as granting additional permission.

## Runtime Compatibility

Future runtimes should publish:

- supported spec versions
- supported manifest kinds
- supported extension namespaces
- validation behavior
- enforcement limitations

See [Conformance](conformance.md) for draft vocabulary that tools can use when describing support levels.

## Compatibility Promise

Until `1.0`, NexFlow prioritizes learning and correctness over strict stability. Breaking changes are allowed with documentation and migration guidance.
