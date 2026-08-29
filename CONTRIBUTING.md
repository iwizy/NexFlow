# Contributing to NexFlow

Thank you for helping shape NexFlow. This project is specification-first, so documentation, examples, schemas, and governance changes are first-class contributions.

## Ways to Contribute

- improve terminology and concepts
- propose manifest changes
- add or improve examples
- improve JSON Schemas
- refine authoring profiles and dependency contracts
- review security and autonomy rules
- write RFCs
- report ambiguity or unsafe defaults
- help design future validation tooling

## Before You Start

Read:

- [README.md](README.md)
- [docs/index.md](docs/index.md)
- [rfcs/README.md](rfcs/README.md)

Maintainers should also use the [Maintainer Guide](docs/maintainer-guide.md) for
change routing, synchronized review, merge, release, and security boundaries.

## Change Types

Small clarifications may be proposed directly in a pull request.

Use an RFC for:

- new core concepts
- manifest model changes
- schema-breaking changes
- runtime architecture decisions
- security model changes
- extension lifecycle changes
- compatibility policy changes

## Pull Request Checklist

- Docs are updated.
- Schemas are updated if manifest fields changed.
- Examples are updated if behavior changed, and example changes follow [examples/CHECKLIST.md](examples/CHECKLIST.md).
- Changelog is updated for user-visible changes.
- Security and autonomy impact is considered.
- Provider and runtime neutrality are preserved.
- Any breaking change includes migration guidance.

## Specification Language

Use normative terms carefully:

- **MUST** means required for conformance.
- **SHOULD** means recommended unless there is a documented reason.
- **MAY** means optional.

Avoid implying that planned runtime behavior already exists.

## Local Validation

This repository currently provides JSON Schemas but no official validation CLI.
Install the pinned repository tooling and run the unified repository validator
before opening a pull request:

```sh
npm ci --ignore-scripts
npm run validate
npm run negative-schema-fixtures
npm run typed-reference-schema-smoke
npm run approval-gate-target-schema-smoke
npm run work-reference-namespace-smoke
npm run actor-schema-smoke
npm run agent-identity-schema-smoke
npm run agent-definition-authority-smoke
npm run core-profile-smoke
npm run manifest-discovery-smoke
npm run cli-prototype-smoke
npm run cli-validation-smoke
npm run human-override-schema-smoke
npm run provider-feature-schema-smoke
npm run conformance-claim-smoke
npm run semantic-smoke
```

The command requires Node.js 20 or newer. It checks schema JSON and example YAML
syntax, rejects aliases and duplicate mapping keys, verifies manifest-kind
discovery and example coverage, compiles every schema, and validates every
example against the schema selected by its `kind`. `package-lock.json` pins the
validation dependencies for reproducible contributor and CI use. Node.js is
used only for repository maintenance tooling; this does not select or constrain
a future NexFlow runtime language.

The [repository CLI prototype](docs/cli-prototype.md) is also maintenance and
evaluation tooling, not a reference CLI alpha. Its `discover` command reports
inventory only; its `validate` command adds JSON Schema checks for the selected
assembly. Neither replaces the repository-wide `npm run validate` and focused
checks or accepts the pending architecture decision. Changes to either command
must keep its documented selection, diagnostic, non-mutation, and safety
boundaries synchronized with the smoke checks.

Schema validation does not perform cross-manifest or policy checks. Focused
commands exercise documented structural and namespace boundaries. The semantic
smoke command checks selected references in examples, but it is not full
semantic validation. See [Validation](docs/validation.md) for the boundary
between schema, semantic, and runtime validation.

The conformance claim command validates the maintained standalone claim schema
and templates. It does not certify external tools or verify their evidence.

The repository GitHub Actions workflow runs the same smoke script, schema
validation, focused checks, and semantic reference smoke command on pull
requests and pushes to `main` or `develop`.

## License

By contributing, you agree that your contribution is provided under the
[MIT License](LICENSE). See the
[Licensing And Patent Rationale](docs/licensing-and-patent-rationale.md) for the
current decision, the Apache-2.0 tradeoff, and the events that require a future
review. A review does not change the terms of an existing contribution by
itself.
