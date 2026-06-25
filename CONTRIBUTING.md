# Contributing to NexFlow

Thank you for helping shape NexFlow. This project is specification-first, so documentation, examples, schemas, and governance changes are first-class contributions.

## Ways to Contribute

- improve terminology and concepts
- propose manifest changes
- add or improve examples
- improve JSON Schemas
- review security and autonomy rules
- write RFCs
- report ambiguity or unsafe defaults
- help design future validation tooling

## Before You Start

Read:

- [README.md](README.md)
- [docs/index.md](docs/index.md)
- [rfcs/README.md](rfcs/README.md)

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

This repository currently provides JSON Schemas but no official validation CLI. Contributors may validate manifests with any JSON Schema tooling that can parse YAML to JSON first.

At minimum, ensure schema files are valid JSON:

```sh
python3 -m json.tool schemas/project.schema.json >/dev/null
```

## License

By contributing, you agree that your contribution is provided under the MIT License.
