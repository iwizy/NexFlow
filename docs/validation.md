# Validation

Validation is the process of checking NexFlow manifests before any tool or runtime relies on them.

NexFlow currently provides draft JSON Schemas and examples. It does not yet provide an official validation CLI or semantic validator.

Related RFCs:

- [RFC-0005: Validation Strategy](../rfcs/RFC-0005-validation-strategy.md)
- [RFC-0011: Reference CLI Scope](../rfcs/RFC-0011-reference-cli-scope.md)

Related design notes:

- [Schema Design Notes](schema-design-notes.md)
- [Compatibility Matrix](compatibility-matrix.md)

## Validation Goals

- Catch structural manifest errors early.
- Make unsupported `specVersion` values visible.
- Keep examples and schemas aligned.
- Separate schema validation from future runtime enforcement.
- Avoid implying that valid manifests are automatically safe to execute.

## Current Validation Surface

The repository supports basic validation through:

- A local repository smoke script.
- A GitHub Actions validation workflow for pull requests and pushes to `main` or `develop`.
- JSON syntax checks for schema files.
- YAML parsing checks for example manifests.
- Example manifest kind discovery against available schemas.
- A reproducible command that validates every example manifest against its JSON Schema.
- A semantic reference smoke command for core cross-manifest references in examples.
- Draft JSON Schemas in `schemas/`.
- Documentation describing semantic expectations.

This is enough to catch many authoring mistakes, but not enough to prove that a full project is semantically consistent.

## Recommended Local Checks

Run the repository smoke checks from the repository root:

```sh
./scripts/schema-smoke
```

The script checks:

- every `schemas/*.schema.json` file parses as JSON
- every example YAML manifest parses safely
- every example manifest declares a non-empty `kind`
- every discovered manifest kind has a matching schema
- every schema-backed manifest kind appears in at least one example

The script uses Ruby and standard-library JSON and YAML support as repository maintenance tooling. This does not select or constrain a future NexFlow runtime language.

These checks do not validate example contents against JSON Schemas and do not perform semantic validation. They confirm that files are syntactically readable and that the discovered manifest kinds have schema coverage.

Install the pinned validation dependencies and run full schema validation:

```sh
npm ci
npm run validate
```

The command requires Node.js 20 or newer. It safely parses each YAML file under `examples/`, selects a schema from the manifest `kind`, compiles the draft 2020-12 schemas, and reports syntax or schema diagnostics with file and instance paths. `package-lock.json` pins AJV, YAML parsing, and format validation dependencies.

This Node.js command is repository maintenance tooling, not a reference CLI or runtime implementation. It does not choose a future NexFlow runtime language and does not perform semantic validation.

The GitHub Actions workflow runs the same smoke script and schema validation command so pull requests exercise schema JSON parsing, example YAML parsing, manifest kind discovery, schema compilation, and example manifest validation.

Run semantic reference smoke checks:

```sh
npm run semantic-smoke
```

This command checks core example references across actors, tasks, workflow steps, artifacts, permissions, capabilities, context sources, memory scopes, providers, model profiles, prompt sets, retrieval profiles, agent definitions, approval gates, events, and extensions. It reports `NF-SEMANTIC` diagnostics for missing references or duplicate IDs.

The command is intentionally a smoke check. It does not prove workflow graph correctness, policy safety, approval sufficiency, runtime enforceability, provider compatibility, or full semantic conformance.

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
| `agent-definitions.yaml` | `AgentDefinitionSet` | `schemas/agent-definitions.schema.json` |
| `workflow.yaml` | `Workflow` | `schemas/workflow.schema.json` |
| `tasks.yaml` | `TaskSet` | `schemas/tasks.schema.json` |
| `handoffs.yaml` | `HandoffSet` | `schemas/handoffs.schema.json` |
| `permissions.yaml` | `PermissionSet` | `schemas/permissions.schema.json` |
| `capabilities.yaml` | `CapabilitySet` | `schemas/capabilities.schema.json` |
| `context.yaml` | `ContextSet` | `schemas/context.schema.json` |
| `memory.yaml` | `MemorySet` | `schemas/memory.schema.json` |
| `providers.yaml` | `ProviderSet` | `schemas/providers.schema.json` |
| `model-profiles.yaml` | `ModelProfileSet` | `schemas/model-profiles.schema.json` |
| `prompt-sets.yaml` | `PromptSet` | `schemas/prompt-sets.schema.json` |
| `retrieval-profiles.yaml` | `RetrievalProfileSet` | `schemas/retrieval-profiles.schema.json` |
| `events.yaml` | `EventSet` | `schemas/events.schema.json` |
| `extensions.yaml` | `ExtensionSet` | `schemas/extensions.schema.json` |

## Schema Validation Limits

JSON Schema can check structure, required fields, enums, and simple patterns.

See [Schema Design Notes](schema-design-notes.md) for the design rationale behind this boundary.

JSON Schema does not fully check:

- whether agent IDs referenced by tasks exist
- whether agent definitions reference existing agents
- whether agent definitions reference existing model profiles, prompt sets, retrieval profiles, permissions, capabilities, context sources, memory scopes, and extensions
- whether agent definition autonomy is compatible with project policy
- whether agent definition review gates cover safety-significant changes
- whether permission IDs referenced by agents exist
- whether capability IDs referenced by permissions exist
- whether workflow step dependencies form a valid graph
- whether handoff artifacts were produced by earlier tasks
- whether event types referenced by workflows are declared
- whether memory scope access is consistent with project policy
- whether memory promotion paths preserve sensitivity boundaries
- whether memory audit events and approval gates are declared
- whether model profile provider references exist
- whether model profile fallback rules are compatible with project policy
- whether prompt set owners and approvers exist
- whether prompt source references resolve
- whether prompt set recommended agents exist
- whether prompt content digests match external prompt material
- whether prompt classification is appropriate for the referenced content
- whether retrieval profile context source references exist
- whether retrieval profile owners and approvers exist
- whether retrieval profile index versions or source digests match external corpora
- whether retrieval profile freshness and citation rules satisfy project policy
- whether retrieval sensitivity is compatible with referenced context sources and memory scopes
- whether agent context source references exist
- whether web sources have domain and freshness policies
- whether MCP sources distinguish context from tools
- whether approval gates are sufficient for a risky action

Those checks belong to future semantic validation.

## Semantic Validation

Semantic validation should evaluate cross-manifest meaning.

[RFC-0005](../rfcs/RFC-0005-validation-strategy.md) proposes a layered validation strategy that separates syntax checks, JSON Schema validation, manifest set inventory, semantic validation, and future runtime preflight checks.

Future semantic validators should check:

- cross-file references
- duplicate IDs within a manifest or project namespace
- agent definition component references and lifecycle consistency
- duplicate IDs within a manifest
- capability and permission consistency
- task ownership and dependency consistency
- workflow graph validity
- approval gate coverage
- context and memory access boundaries
- context freshness, source classification, and MCP boundary consistency
- memory ownership, allowed writers, prohibited content, and cross-scope promotion consistency
- model profile provider references, fallback policies, and audit expectations
- prompt set references, source references, safety review status, content digest expectations, and compatibility impact
- retrieval profile references, source coverage, index versions, freshness, citations, sensitivity, and compatibility impact
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

See [RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) for the draft scope of `nexflow validate`, `nexflow inspect`, `nexflow graph`, and `nexflow init`.
