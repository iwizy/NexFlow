# Invalid Schema Fixtures

These fixtures are intentionally invalid NexFlow manifests.

See the [Fixtures Guide](../../README.md) for the repository-wide fixture
inventory and the distinction between fixtures and reference examples.

They provide stable negative evidence for schema and manifest-kind boundaries.
They are not examples, templates, or runtime inputs, and the normal example
validator does not discover them.

## Cases

| Fixture | Expected rejection |
| --- | --- |
| `missing-required-field.yaml` | A `Project` entry omits required `project.description`. |
| `invalid-enum.yaml` | A permission uses an unsupported `effect` value. |
| `invalid-id.yaml` | An agent ID violates the common ID pattern. |
| `unknown-kind.yaml` | No schema declares the manifest kind. |

`index.json` records the expected diagnostic category, path, and relevant AJV
keyword for each fixture. The repository command
`npm run negative-schema-fixtures` verifies that every listed file fails for
the intended reason and that every YAML fixture in this directory is listed.

When adding a fixture:

1. Keep the YAML syntactically valid.
2. Isolate one primary invalid condition.
3. Add the expected result to `index.json`.
4. Use only public, fictional project data.
5. Update validation and compatibility documentation when the covered boundary
   changes.

Related guidance:

- [Schema Guide](../../../schemas/README.md)
- [Validation](../../../docs/validation.md)
- [Conformance](../../../docs/conformance.md)
- [Examples Guide](../../../examples/README.md)
