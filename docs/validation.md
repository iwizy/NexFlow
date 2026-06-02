# Validation

Validation is the process of checking NexFlow manifests before any tool or runtime relies on them.

NexFlow currently provides draft JSON Schemas and examples. It does not yet provide an official validation CLI or semantic validator.

## Validation Goals

- Catch structural manifest errors early.
- Make unsupported `specVersion` values visible.
- Keep examples and schemas aligned.
- Separate schema validation from future runtime enforcement.
- Avoid implying that valid manifests are automatically safe to execute.

## Current Validation Surface

The repository supports basic validation through:

- JSON syntax checks for schema files.
- YAML parsing checks for example manifests.
- Draft JSON Schemas in `schemas/`.
- Documentation describing semantic expectations.

This is enough to catch many authoring mistakes, but not enough to prove that a full project is semantically consistent.

## Recommended Local Checks

Check that all schema files are valid JSON:

```sh
python3 - <<'PY'
import json
from pathlib import Path

for path in sorted(Path("schemas").glob("*.schema.json")):
    with path.open(encoding="utf-8") as handle:
        json.load(handle)
    print(f"ok {path}")
PY
```

Check that all example manifests parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/**/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

These checks do not validate examples against JSON Schemas. They only confirm that files are syntactically readable.

## YAML to JSON Schema Validation

JSON Schema validates JSON-compatible data. YAML manifests should be parsed into JSON-compatible objects before validation.

A validation tool should:

1. Load YAML safely.
2. Convert YAML data to JSON-compatible values.
3. Select the schema based on manifest `kind`.
4. Validate the manifest against the selected schema.
5. Report file path, manifest kind, and failing field path.

Example mapping:

| Manifest File | `kind` | Schema |
| --- | --- | --- |
| `project.yaml` | `Project` | `schemas/project.schema.json` |
| `agents.yaml` | `AgentSet` | `schemas/agents.schema.json` |
| `workflow.yaml` | `Workflow` | `schemas/workflow.schema.json` |
| `tasks.yaml` | `TaskSet` | `schemas/tasks.schema.json` |
| `handoffs.yaml` | `HandoffSet` | `schemas/handoffs.schema.json` |
| `permissions.yaml` | `PermissionSet` | `schemas/permissions.schema.json` |
| `capabilities.yaml` | `CapabilitySet` | `schemas/capabilities.schema.json` |
| `context.yaml` | `ContextSet` | `schemas/context.schema.json` |
| `memory.yaml` | `MemorySet` | `schemas/memory.schema.json` |
| `providers.yaml` | `ProviderSet` | `schemas/providers.schema.json` |
| `events.yaml` | `EventSet` | `schemas/events.schema.json` |
| `extensions.yaml` | `ExtensionSet` | `schemas/extensions.schema.json` |

## Schema Validation Limits

JSON Schema can check structure, required fields, enums, and simple patterns.

JSON Schema does not fully check:

- whether agent IDs referenced by tasks exist
- whether permission IDs referenced by agents exist
- whether capability IDs referenced by permissions exist
- whether workflow step dependencies form a valid graph
- whether handoff artifacts were produced by earlier tasks
- whether event names referenced by workflows are declared
- whether memory scope access is consistent with project policy
- whether memory promotion paths preserve sensitivity boundaries
- whether memory audit events and approval gates are declared
- whether agent context source references exist
- whether web sources have domain and freshness policies
- whether MCP sources distinguish context from tools
- whether approval gates are sufficient for a risky action

Those checks belong to future semantic validation.

## Semantic Validation

Semantic validation should evaluate cross-manifest meaning.

Future semantic validators should check:

- cross-file references
- duplicate IDs within a manifest
- capability and permission consistency
- task ownership and dependency consistency
- workflow graph validity
- approval gate coverage
- context and memory access boundaries
- context freshness, source classification, and MCP boundary consistency
- memory ownership, allowed writers, prohibited content, and cross-scope promotion consistency
- extension namespace and capability requirements

Semantic validation should report warnings separately from hard errors when the spec allows judgment.

## Validation Is Not Enforcement

A valid manifest is not the same thing as safe runtime behavior.

Validation can say:

- the manifest is structurally valid
- references appear consistent
- required gates and policies are declared

Validation cannot by itself enforce:

- command sandboxing
- credential isolation
- provider data handling
- deployment controls
- production safety
- human override behavior

Those responsibilities belong to a future runtime.

## Expected Validator Output

A validator should prefer precise, actionable messages.

Example:

```text
examples/minimal-team/agents.yaml
  kind: AgentSet
  error: agents[0].autonomyLevel must be one of manual_only, suggest_only, ask_before_changes, autonomous_safe, autonomous_extended
```

For semantic checks:

```text
examples/software-team/tasks.yaml
  warning: task "review-change" references capability "approve_changes", but no matching approval gate is declared on the task
```

## Relationship to Conformance

Validation supports the `NF-SCHEMA` and future `NF-SEMANTIC` conformance levels described in [Conformance](conformance.md).

Current repository checks are draft validation aids. A future `nexflow validate` command should make these checks easier to run consistently.
