# Validation

Validation is the process of checking NexFlow manifests before any tool or runtime relies on them.

NexFlow currently provides draft JSON Schemas and examples. It does not yet provide an official validation CLI or semantic validator.

Related RFCs:

- [RFC-0005: Validation Strategy](../rfcs/RFC-0005-validation-strategy.md)
- [RFC-0011: Reference CLI Scope](../rfcs/RFC-0011-reference-cli-scope.md)

Related design notes:

- [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md)
- [Diagnostic Code Catalog](diagnostic-code-catalog.md)
- [Schema Design Notes](schema-design-notes.md)
- [Semantic Reference Inventory](semantic-reference-inventory.md)
- [Typed References](typed-references.md)
- [Work Reference Namespaces](work-reference-namespaces.md)
- [Core Profile](core-profile.md)
- [MCP And A2A Boundaries](mcp-a2a-boundaries.md)
- [Compatibility Matrix](compatibility-matrix.md)

## Validation Asset Map

| Resource | Role in validation |
| --- | --- |
| [Schema Guide](../schemas/README.md) | Structural contract inventory, design rules, and schema maintenance guidance. |
| [Fixtures Guide](../fixtures/README.md) | Focused inputs with explicit pass or rejection expectations. |
| [Examples Guide](../examples/README.md) | Complete reference manifest sets expected to pass maintained checks. |
| [Diagnostic Code Catalog](diagnostic-code-catalog.md) | Draft code families, severities, messages, remediation, and implementation status. |
| [Conformance](conformance.md) | Requirements for claiming schema, semantic, CLI, runtime, or extension support. |
| [Compatibility Matrix](compatibility-matrix.md) | Evidence-backed status and explicit implementation gaps. |

Examples and fixtures serve different purposes. Examples demonstrate coherent
authoring patterns; fixtures isolate specific validation contracts. Neither is
evidence of runtime execution or enforcement.

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
- Four cataloged negative fixture categories for required fields, enum values,
  ID formats, and unknown manifest kinds.
- Focused shared typed-reference shape and lexical-boundary checks.
- Focused approval gate target kind and scope checks.
- Focused workflow step and task artifact namespace checks.
- Focused provider feature vocabulary and capability-separation checks.
- Focused structured provider constraint and legacy migration checks.
- Focused MCP extension profile, context/action surface, allow-list, approval,
  and example dependency checks.
- Focused A2A profile checks for external identity, task, artifact, permission,
  network callback, credential, audit, and fail-closed boundaries.
- Focused ActorSet, AgentSet identity, agent definition authority, and human
  override boundary checks.
- Focused Core Profile definition, reduced Project, participant authority,
  optional qualifier, and dependency-closure checks.
- Focused explicit-file, Project source-hint, and bounded Project-entry discovery, conservative
  cardinality, and multiple-workflow checks.
- A focused standalone conformance claim schema and template check.
- A focused standalone candidate readiness record schema and decision-guard check.
- A semantic reference smoke command for selected cross-manifest references in examples.
- A prioritized semantic reference inventory that distinguishes checked,
  partial, missing, and deferred field contracts.
- Draft JSON Schemas in `schemas/`.
- Documentation describing semantic expectations.

This is enough to catch many authoring mistakes, but not enough to prove that a full project is semantically consistent.

The repository does not validate emitted event instances, CloudEvents
representations, or OpenTelemetry EventRecords. The draft mappings in
[Event Interoperability](event-interoperability.md) are documentation contracts
without an encoder, importer, external schema, or conformance suite.

Agent Assembly is outside the current schema-validation surface because it is a
derived inspection projection rather than an authored manifest. The repository
does not validate an assembly document, and the semantic smoke command does not
compute a complete Agent Assembly view.

## Recommended Local Checks

Install the pinned dependencies and run the unified repository validator from
the repository root:

```sh
npm ci --ignore-scripts
npm run validate
```

The command checks:

- every `schemas/*.schema.json` file parses as JSON
- every example YAML manifest parses without aliases or duplicate mapping keys
- every example manifest declares a non-empty `kind`
- every discovered manifest kind has a matching schema
- every schema-backed manifest kind appears in at least one example
- every schema has an identifier, registers, and compiles
- every example validates against the schema selected by its `kind`

The command requires Node.js 20 or newer and reports syntax or schema
diagnostics with file and instance paths. `package-lock.json` pins AJV, YAML
parsing, and format validation dependencies.

This Node.js command is repository maintenance tooling, not a reference CLI or runtime implementation. It does not choose a future NexFlow runtime language and does not perform semantic validation.

Discovery and the disposable command skeleton have separate checks:

```sh
npm run manifest-discovery-smoke
npm run cli-prototype-smoke
npm run cli-prototype -- discover --root examples/minimal-team
```

The last command prints an inventory only, not a validation result. The
[repository CLI prototype](cli-prototype.md) supports explicit files, Project
source hints, and a bounded choice between root `project.yaml` and `project.yml`.
It has no implemented `validate`, `inspect`, `graph`, or `init` command, no
reference CLI package, and no `NF-CLI` claim. The architecture decision remains
`not-ready`. See [Manifest Discovery](manifest-discovery.md) for exact source
and parser boundaries.

Its broad `NF-SYNTAX` and `NF-SCHEMA` codes are classified as Implemented draft
in the [Diagnostic Code Catalog](diagnostic-code-catalog.md). The catalog also
records implemented discovery and Core Profile codes, candidate refinements,
default severity, suggested messages, and safe remediation. No current command
implements the complete catalog or a stable machine-readable output contract.

Verify the intentionally invalid schema fixtures:

```sh
npm run negative-schema-fixtures
```

This command loads `fixtures/schema/invalid/index.json`, confirms every
cataloged YAML file is syntactically valid, and verifies that it is rejected
for the expected schema category and field path. It also fails when a fixture
is missing from the catalog or unexpectedly becomes valid.

Negative fixtures are not reference examples. They do not test cross-manifest
meaning, policy safety, diagnostic wording stability, or runtime enforcement.
The [Fixtures Guide](../fixtures/README.md) lists all maintained fixture sets and
their owning checks.

Run focused typed-reference primitive checks:

```sh
npm run typed-reference-schema-smoke
```

This command exercises 53 accepted and rejected cases across the shared generic,
scoped, scalar-compatible, actor, agent, and extension reference definitions.
It checks authored shape, closed target kinds, ID lexical rules, scope shape,
strict kind-specific forms, and duplicate list values.

It does not prove that targets exist, resolve field contracts across manifests,
detect semantic ambiguity, or establish complete typed-reference conformance.

Run focused approval gate target checks:

```sh
npm run approval-gate-target-schema-smoke
```

This command exercises 16 accepted and rejected cases for allowed target kinds,
assembly-scoped resources, workflow-scoped stages and steps, deprecated
`appliesTo` coexistence, duplicate targets, ID syntax, and closed typed objects.

It does not prove target existence, gate coverage, approver eligibility,
approval state, or runtime enforcement. Maintained target existence is checked
separately by `npm run semantic-smoke`.

Run focused work reference namespace checks:

```sh
npm run work-reference-namespace-smoke
```

This command exercises 13 accepted and rejected cases for workflow-wide step
identity, cross-stage dependencies, assembly-wide task artifact identity, and
handoff artifact lookup. The semantic smoke command uses the same namespace
implementation for maintained examples.

It does not validate workflow cycles, execution order, artifact production,
content integrity, disclosure policy, or runtime behavior.

Run focused provider feature checks:

```sh
npm run provider-feature-schema-smoke
```

This command exercises 11 accepted and rejected cases for the closed provider
feature vocabulary, non-empty unique lists, deprecated `capabilities`
coexistence, and rejection of project action capability IDs.

It does not prove provider availability, model quality, model profile
compatibility, permission, tool access, network access, or runtime behavior.

Run focused provider constraint checks:

```sh
npm run provider-constraint-schema-smoke
```

This command exercises 17 accepted and rejected cases for structured and
legacy training policy, residency and region coupling, tool use, sensitivity,
network posture, retention, and namespaced extension preservation.

It does not compare every provider constraint with model-profile requirements,
query live provider policy, verify pricing or latency, authorize a provider, or
establish runtime support.

Run the MCP extension draft checks:

```sh
npm run mcp-extension-smoke
```

This command validates the machine-readable `io.nexflow.mcp` profile, exercises
10 ContextSet cases, and checks the Software Team extension, capability,
permission, and context declarations. It does not connect to an MCP server,
discover tools, negotiate protocol versions, or execute an action.

Run the A2A extension draft checks:

```sh
npm run a2a-extension-smoke
```

This command exercises 13 accepted and rejected cases for the machine-readable
`io.nexflow.a2a` profile. It checks external protocol ownership, opaque remote
identity, no automatic Actor or typed-reference binding, TaskSet and Handoff
separation, provenance-preserving artifact import, permissions, project-effect
capabilities, network callbacks, credential handling, and fail-closed behavior.

It does not fetch an Agent Card, discover a remote agent, negotiate a protocol
version or binding, authenticate, invoke, poll, stream, cancel, receive a push
callback, import an artifact, or implement A2A. See
[MCP And A2A Boundaries](mcp-a2a-boundaries.md).

Run the standalone conformance claim format checks:

```sh
npm run conformance-claim-smoke
```

This command exercises 15 accepted and rejected cases for claim identity,
profile-qualified scope, level status, evidence, limitations, lifecycle,
timestamps, and self-declared assurance. It also checks that the Markdown
template contains every required section and all six current conformance
levels.

It validates claim structure only. It does not inspect external tools, verify
evidence, certify implementations, or establish any conformance level.

Run the standalone candidate readiness record checks:

```sh
npm run candidate-readiness-smoke
```

This command exercises 14 accepted and rejected cases for the `0.1` candidate
record, including the complete eight-gate registry, ready-state commit and
review metadata, evidence requirements, unresolved blockers, known limitations,
and non-claiming template defaults.

It validates record structure and decision guards only. It does not execute
the commands named as evidence, verify links, evaluate release quality, approve
a tag, publish a release, or establish specification conformance.

The GitHub Actions workflow runs the same smoke script, schema validation, and
focused boundary commands so pull requests exercise schema JSON parsing,
example YAML parsing, manifest kind discovery, schema compilation, example
manifest validation, typed-reference primitive boundaries, work reference
namespaces, approval gate target kinds and scope, provider feature vocabulary,
provider constraint structure, MCP and A2A extension profile boundaries,
compact agent identity compatibility, Core Profile conformance boundaries,
manifest discovery and multiple-workflow boundaries, human override fail-closed
shape, and conformance claim format boundaries. It also checks candidate
readiness record boundaries, active agent definition completeness and unique
unscoped selection cases, plus the cataloged negative schema boundaries.

Run semantic reference smoke checks:

```sh
npm run semantic-smoke
```

This command checks core example references across ActorSet identity and agent
bridges, active agent definition authority, tasks, workflow steps, artifacts,
permissions, capabilities,
structured network policies, context sources, memory scopes, providers, model
profiles, prompt sets, retrieval profiles, agent definitions, approval gates,
typed approval gate targets, human override authorities and audit references,
events, and extensions. It reports `NF-SEMANTIC` diagnostics for missing
references, deprecated ambiguous gate targets, deprecated provider capability
labels, duplicate IDs, duplicate agent bridges, and actor relationship cycles.

The command is intentionally a smoke check. It does not prove workflow graph correctness, policy safety, approval sufficiency, runtime enforceability, provider compatibility, or full semantic conformance.

The [Semantic Reference Inventory](semantic-reference-inventory.md) records
which reference fields the command checks today, known gaps, deferred ambiguous
fields, and the P0-P3 order recommended for future validator work.

Run focused ActorSet structural boundary checks:

```sh
npm run actor-schema-smoke
```

This command exercises accepted and rejected actor kinds, required
kind-specific relationships, typed target kinds, assembly scope, and required
identity fields. It complements maintained example validation; it is not a
general conformance suite or semantic resolver.

Run focused agent identity boundary checks:

```sh
npm run agent-identity-schema-smoke
```

This command checks the compact required identity shape, non-empty
responsibilities and skills, and continued structural validity of deprecated
legacy behavior fields. It does not select an agent definition or compute
effective configuration.

Run focused agent definition authority checks:

```sh
npm run agent-definition-authority-smoke
```

This command checks complete active definitions, approved review and audit
requirements, draft compatibility, unique active selection, missing active
selection, and ambiguous active selection. It does not resolve full policy,
authenticate reviewers, execute agents, or prove runtime enforcement.

Run focused Core Profile checks:

```sh
npm run core-profile-smoke
```

This command validates `profiles/core.yaml` against its standalone schema and
exercises 16 cases for reduced Project structure, ActorSet authority, legacy
AgentSet fallback, optional and claimed qualifiers, missing dependencies,
transitive closure, and unsupported required modules.

The cases consume normalized manifest-kind inventories. They do not discover
files, validate arbitrary project assemblies, load multiple workflows, execute
work, or establish complete `NF-MANIFEST`, `NF-SCHEMA`, or `NF-SEMANTIC`
conformance.

Run focused manifest discovery and multiple-workflow checks:

```sh
npm run manifest-discovery-smoke
```

This command exercises 24 cases for the plural Project workflow source-hint
shape, explicit local file discovery, source order independence, project and
version association, expected kinds, source and parser boundaries,
conservative singleton cardinality, unique workflow identity, and two
workflow-local step namespaces.

The helper produces a logical validation inventory. It does not recursively
scan directories, expand bundles, fetch remote sources, compute complete
dependency closure, select a workflow, execute tasks, or define cross-workflow
runtime state. See [Manifest Discovery](manifest-discovery.md).

Run focused human override boundary checks:

```sh
npm run human-override-schema-smoke
```

This command checks typed authorities, supported operations, new-action
blocking, fail-closed failure behavior, approval-gated resume, required reason,
audit fields, and event syntax. It does not authenticate people or interrupt a
runtime.

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
| `actors.yaml` | `ActorSet` | `schemas/actors.schema.json` |
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
- whether human override authorities resolve to human-controlled actors
- whether a future runtime can actually pause, stop, revoke, or resume activity

Those checks belong to future semantic validation.

## Semantic Validation

Semantic validation should evaluate cross-manifest meaning.

[RFC-0005](../rfcs/RFC-0005-validation-strategy.md) proposes a layered validation strategy that separates syntax checks, JSON Schema validation, manifest set inventory, semantic validation, and future runtime preflight checks.

Future semantic validators should check:

- cross-file references
- duplicate IDs within a manifest or project namespace
- ActorSet identity mode, explicit agent bridges, operators, representatives, integration references, and relationship cycles
- agent definition component references and lifecycle consistency
- duplicate IDs within a manifest
- capability and permission consistency
- task ownership and dependency consistency
- workflow graph validity
- approval gate coverage
- human override authority, resume gate, event, and fail-closed consistency
- network rule identifiers and references to actors, capabilities, destinations, approval gates, and audit event types
- network rule coherence with permissions, context boundaries, transport constraints, DNS resolution, redirects, and audit policy
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

Runtime preflight is also outside the initial validation-only CLI. Checks for
live provider availability, installed executable extensions, credentials,
network routes, current approvals, context or memory backends, and event sinks
use runtime facts and authority. See
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md).

## Expected Validator Output

A validator should prefer precise, actionable messages.

Example:

```text
examples/minimal-team/agents.yaml
  kind: AgentSet
  error: agents[0].skills must contain at least one stable skill identifier
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
See [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) for each
command's effect budget and the separation from runtime preflight and
enforcement.
