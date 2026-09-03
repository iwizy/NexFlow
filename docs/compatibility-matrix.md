# Compatibility Matrix

This matrix records which NexFlow specification, schema, example, validator,
CLI, runtime, and extension combinations are supported by the repository today.

It is a statement of current evidence, not a promise that planned components
already exist.

For compatibility rules and breaking change guidance, see
[Compatibility](compatibility.md). For support claim vocabulary, see
[Conformance](conformance.md). For the feature boundary used by the first
candidate review, see [0.1 Candidate Scope](0.1-scope.md).

## How To Read This Matrix

The status terms are intentionally strict.

| Status | Meaning |
| --- | --- |
| **Implemented** | A repository artifact exists and is exercised by documented checks. |
| **Partial** | A limited implementation exists, with explicit gaps that prevent a broader claim. |
| **Specified** | Draft documentation defines the intended behavior, but no complete implementation exists. |
| **Planned** | A roadmap or RFC discusses the surface; its final contract is not implemented. |
| **Unsupported** | The repository makes no compatibility claim for the combination and tools should reject or avoid it. |
| **Not applicable** | The surface does not apply to the row. |

`Specified` and `Implemented` are different. A documented runtime rule does not
mean a runtime exists. An implemented schema does not mean runtime safety is
enforced.

## Current Compatibility Summary

| Surface | Current contract | Status | Evidence | Explicit limitation |
| --- | --- | --- | --- | --- |
| `0.1` release scope | Frozen 17-kind baseline with explicit RFC treatment, optional surfaces, migration-only forms, and deferred work | Specified | `docs/0.1-scope.md`, `v0.1.0` release evidence | The release decision covers one exact repository snapshot; it does not imply runtime behavior, accepted draft RFCs, or `1.0` stability. |
| Specification | `specVersion: "0.1"` draft | Specified | Core docs, manifest reference, RFCs | Pre-`1.0`; fields and semantics may change with migration guidance. |
| JSON Schemas | `0.1` across 17 manifest kinds plus common definitions | Implemented | `schemas/*.schema.json` | Structural validation only; schemas do not prove cross-manifest meaning or safety. |
| Reference examples | One reduced Core Profile project plus 6 complete project sets, totaling 99 schema-backed manifests using `0.1` | Implemented | `examples/` | Authoring and validation material, not executable teams or runtime demonstrations. |
| Repository schema validator | Current repository schema snapshot and reference examples | Implemented | `npm run validate` | Maintenance tooling, not a published `nexflow` CLI or general runtime preflight. |
| Negative schema fixtures | Required field, enum value, ID format, and unknown kind rejection | Implemented | `npm run negative-schema-fixtures`, `fixtures/schema/invalid/` | Four focused rejection categories, not a complete invalid-input or diagnostic conformance suite. |
| Diagnostic code catalog | Families, severity, messages, remediation, implemented draft codes, candidate codes, and reserved areas | Specified | `docs/diagnostic-code-catalog.md`, RFC-0005, RFC-0011, RFC-0015, RFC-0016 | No code is Stable; the prototype serializes only implemented discovery and schema diagnostics, not the complete catalog. |
| Actor schema boundary smoke | 9 accepted and rejected structural cases | Implemented | `npm run actor-schema-smoke` | Focused ActorSet schema evidence, not full semantic or runtime conformance. |
| Agent identity boundary smoke | 7 compact and legacy structural cases | Implemented | `npm run agent-identity-schema-smoke` | Checks identity migration compatibility, not definition selection or effective configuration. |
| Agent definition authority smoke | 15 structural and selection cases | Implemented | `npm run agent-definition-authority-smoke` | Checks active completeness, unique unscoped selection, and rejection of unsupported memory policy references, not full policy resolution or runtime execution. |
| Core Profile contract | Machine-readable required slots, optional qualifiers, dependency rules, and 16 focused cases | Implemented | `profiles/core.yaml`, `docs/core-profile.md`, `npm run core-profile-smoke` | Consumes normalized kind inventories; arbitrary assembly validation, complete dependency resolution, and runtime preflight are absent. |
| Manifest discovery and multiple workflows | Explicit local file lists, Project source hints, two-filename Project entry selection, conservative cardinality, and unique workflow inventory | Implemented | `docs/manifest-discovery.md`, `scripts/lib/manifest-discovery.mjs`, `npm run manifest-discovery-smoke` | Focused repository validation helper only; no directory scan, bundle input, general index, stable CLI contract, workflow selection, cross-workflow execution, or runtime loading. |
| Agent Assembly inspection view | Documentation contract for a derived effective-configuration projection | Specified | `docs/agent-assembly.md`, RFC-0014 | No resolver, serializer, JSON Schema, reference CLI output, or runtime implementation exists. |
| Human override boundary smoke | 11 accepted and rejected structural cases | Implemented | `npm run human-override-schema-smoke` | Checks policy shape, not authentication, interruption, revocation, or runtime enforcement. |
| Typed reference primitives | Common typed, scoped, transitional, and kind-specific definitions with 53 focused cases | Implemented | `schemas/common.schema.json`, `npm run typed-reference-schema-smoke` | Shape and lexical evidence only; no complete field-contract or semantic resolution conformance. |
| Approval gate targets | Closed typed target kinds, assembly and workflow scope, migrated examples, and exact semantic lookup | Implemented | `docs/approval-gate-targets.md`, `npm run approval-gate-target-schema-smoke`, `npm run semantic-smoke` | Target resolution only; no gate coverage, decision state, approver authentication, or runtime enforcement. |
| Work reference namespaces | Workflow-wide step and assembly-wide artifact rules with 13 focused cases | Implemented | `docs/work-reference-namespaces.md`, `npm run work-reference-namespace-smoke` | Identity and exact lookup evidence only; no cycle, ordering, provenance, disclosure, or runtime enforcement. |
| Provider feature vocabulary | Closed model support signals, migrated examples, and legacy capability separation | Implemented | `docs/provider-features.md`, `npm run provider-feature-schema-smoke`, `npm run semantic-smoke` | Structural and migration evidence only; no provider selection, live availability, permission, or runtime support. |
| Provider constraint vocabulary | Structured provider eligibility fields, migrated examples, legacy training boolean, and 17 focused cases | Implemented | `docs/provider-constraints.md`, `npm run provider-constraint-schema-smoke` | Structural and migration evidence only; no complete constraint solver, live provider facts, selection, or runtime enforcement. |
| Provider adapter boundary | Host-owned selection and fallback, bounded request translation, mediated credentials and network, normalized results and failures, and audit explanations | Specified | `docs/provider-adapter-boundary.md`, RFC-0010 | No adapter API, provider client, live call, retry engine, fallback engine, credential broker, or provider execution conformance evidence exists. |
| Event and audit storage boundary | Separate event, audit record, evidence, projection, receipt, store, index, and telemetry roles with redaction, ordering, retention, integrity, access, and failure rules | Specified | `docs/event-audit-storage-boundary.md`, RFC-0009 | No event-instance validator, audit store, persistence adapter, evidence store, retention engine, exporter, or runtime storage conformance evidence exists. |
| CLI and runtime responsibility boundary | Static validation and authoring command effect budgets separated from runtime preflight, credentials, executable extensions, remote access, orchestration, and enforcement | Specified | `docs/cli-runtime-boundary.md`, RFC-0011, RFC-0005 | No `nexflow` executable, CLI package, stable output contract, runtime preflight, or `NF-CLI` conformance evidence exists. |
| MCP extension draft | Machine-readable `io.nexflow.mcp` profile, stricter ContextSet boundary, Software Team binding, and 10 focused cases | Implemented | `extensions/mcp/`, RFC-0018, `npm run mcp-extension-smoke` | Policy mapping only; no MCP client, server, transport, discovery, credential, protocol negotiation, or execution support. |
| A2A extension draft | Machine-readable `io.nexflow.a2a` profile, protocol ownership map, and 13 focused cases | Implemented | `extensions/a2a/`, RFC-0019, `docs/mcp-a2a-boundaries.md`, `npm run a2a-extension-smoke` | Policy mapping only; no A2A client, server, binding, discovery, authentication, invocation, remote task synchronization, artifact import, streaming, or callbacks. |
| Event interoperability mappings | `nexflow-cloudevents/0.1-draft` and `nexflow-opentelemetry/0.1-draft` | Specified | `docs/event-interoperability.md`, RFC-0009 | No event-instance schema, encoder, importer, SDK, CloudEvents binding, OpenTelemetry instrumentation, OTLP exporter, collector, sink, storage, or conformance suite. |
| Conformance claim format | Standalone `claimVersion: "0.1"` schema plus profile-qualified YAML and Markdown templates | Implemented | `conformance/`, `npm run conformance-claim-smoke` | Self-declared claim structure only; no certification, external evidence verification, registry, or conformance test suite. |
| Candidate readiness record | Standalone `recordVersion: "0.1"` schema, eight-gate template, and 14 focused cases | Implemented | `release/`, `npm run candidate-readiness-smoke`, `v0.1.0` release assets | Repository checks validate record structure and decision guards; the published decision is maintainer-reviewed evidence, not automated approval or a conformance certificate. |
| Semantic reference inventory | P0-P3 target namespaces, coverage, gaps, and deferred fields | Specified | `docs/semantic-reference-inventory.md` | Documentation contract only; it is not a manifest, generated registry, validator, or conformance suite. |
| Semantic reference smoke | Selected cross-manifest reference, active definition authority, and duplicate checks | Partial | `npm run semantic-smoke`, semantic reference inventory | Does not cover every inventoried field or establish full `NF-SEMANTIC` conformance, graph safety, or policy correctness. |
| Runtime language evaluation | Hard gates, weighted criteria, common prototype, and evidence record for TypeScript, Python, Rust, and Go | Specified | `docs/language-evaluation-matrix.md`, `docs/runtime-options.md` | No comparable candidate prototypes, scores, language selection, package layout, or accepted Runtime Architecture Decision exists. |
| Reference CLI | Validation-only scope proposed | Planned | RFC-0011 | No `nexflow` executable or `NF-CLI` implementation exists. |
| Repository CLI prototype | Help, unreleased version, local discovery, structural `validate`, declared-only `inspect`, static `graph`, and opt-in JSON output | Partial | `docs/cli-prototype.md`, `npm run cli-prototype-smoke`, `npm run cli-validation-smoke` | Disposable maintenance tooling, not a reference CLI alpha or completed architecture candidate; no full semantic validation, stable JSON envelope, package, or conformance claim. |
| Prototype JSON diagnostics | Experimental `formatVersion: "0.3-draft"` envelope and separate output schema | Implemented | `docs/cli-diagnostics.md`, `scripts/contracts/cli-output.schema.json`, `npm run cli-diagnostics-smoke` | Versioned repository output, not stable catalog or public CLI conformance; no semantic diagnostics, SARIF, automatic fixes, or runtime authority. |
| Prototype declared inspection | Schema-first Project summary, declaration occurrences, and selected unresolved references across all 17 kinds | Implemented | `docs/cli-inspection.md`, `npm run cli-inspection-smoke` | Bounded, allowlisted projection only; no complete reference inventory, effective configuration, Agent Assembly resolver, or execution authority. |
| Prototype static graph | Declaration nodes and selected reference edges with static resolution labels | Implemented | `docs/cli-graph.md`, `npm run cli-graph-smoke` | Text and JSON only; no full semantic graph, cycle analysis, execution order, renderer, external state, or runtime authority. |
| Runtime | Provider-neutral requirements documented | Planned | Architecture, runtime options, roadmap | No orchestration, enforcement, provider calling, task execution, or `NF-RUNTIME` implementation exists. |
| Extensions | Core declaration schema, namespace/lifecycle rules, future loading boundary, and maintained experimental MCP and A2A profiles | Partial | `extensions.schema.json`, `docs/extension-loading-boundary.md`, `extensions/mcp/`, `extensions/a2a/`, extension docs, examples | Loading is specified only as a safety boundary; no registry, loader, live integration, protocol implementation, or plugin execution exists. |

## Version Compatibility Matrix

| Manifest `specVersion` | Schema snapshot | Reference examples | Repository validator | Reference CLI | Runtime | Extensions | Repository support |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0.1` | Current 17-kind draft schema set | 7 maintained project sets | Schema validation implemented; semantic references partial | Not implemented | Not implemented | Declaration shape implemented; behavior not implemented | Current supported authoring and repository validation target |
| Any other `0.x` | No published schema mapping | None | Must report unsupported version | Not implemented | Not implemented | Unsupported | Unsupported |
| `1.0` | Not published | None | Must report unsupported version | Planned only | Planned only | Planned only | Future target, not currently supported |

The `0.1` row does not mean that every draft RFC is accepted or represented in
schemas. RFC proposals remain proposals until their docs, schemas, examples,
compatibility notes, and versioning impact are accepted and synchronized.

[RFC-0016](../rfcs/RFC-0016-core-profile-and-discovery.md) now has an
implemented Core Profile slice with optional module qualifiers and reduced
Project source hints, plus a focused explicit local discovery and
multiple-workflow validation slice. Root Project entry selection now delegates
to source-hint loading without a directory walk. Directory scanning, general source indexes,
bundle equivalence, and runtime loading remain outside the current supported
matrix.

## Current Artifact Pairing

The currently tested repository pairing is:

```text
specVersion: 0.1
schemas: current repository snapshot
examples: current repository snapshot
schema validator: scripts/validate-schemas.mjs
negative schema fixtures: fixtures/schema/invalid/ via scripts/negative-schema-fixtures.mjs
actor boundary smoke: scripts/actor-schema-smoke.mjs
agent identity boundary smoke: scripts/agent-identity-schema-smoke.mjs
agent definition authority smoke: scripts/agent-definition-authority-smoke.mjs
core profile definition: profiles/core.yaml
core profile smoke: scripts/core-profile-smoke.mjs
manifest discovery helper: scripts/lib/manifest-discovery.mjs
manifest discovery smoke: scripts/manifest-discovery-smoke.mjs
repository CLI prototype: scripts/cli-prototype.mjs (unreleased, discovery, schema validation, declared inspection, static graph)
repository CLI prototype smoke: scripts/cli-prototype-smoke.mjs
repository CLI schema validation helper: scripts/lib/schema-validation.mjs
repository CLI validation smoke: scripts/cli-validation-smoke.mjs
repository CLI JSON output: scripts/contracts/cli-output.schema.json (formatVersion 0.3-draft)
repository CLI diagnostic smoke: scripts/cli-diagnostics-smoke.mjs
repository CLI inspection helper: scripts/lib/manifest-inspection.mjs
repository CLI inspection smoke: scripts/cli-inspection-smoke.mjs
repository CLI graph helper: scripts/lib/manifest-graph.mjs
repository CLI graph smoke: scripts/cli-graph-smoke.mjs
multi-workflow fixture: fixtures/discovery/multi-workflow/
human override boundary smoke: scripts/human-override-schema-smoke.mjs
mcp extension profile: extensions/mcp/profile.yaml
mcp extension smoke: scripts/mcp-extension-smoke.mjs
a2a extension profile: extensions/a2a/profile.yaml
a2a extension smoke: scripts/a2a-extension-smoke.mjs
typed reference primitive smoke: scripts/typed-reference-schema-smoke.mjs
approval gate target smoke: scripts/approval-gate-target-schema-smoke.mjs
provider constraint smoke: scripts/provider-constraint-schema-smoke.mjs
work reference namespace smoke: scripts/work-reference-namespace-smoke.mjs
provider feature smoke: scripts/provider-feature-schema-smoke.mjs
conformance claim format smoke: scripts/conformance-claim-smoke.mjs
candidate readiness record smoke: scripts/candidate-readiness-smoke.mjs
semantic smoke: scripts/semantic-reference-smoke.mjs
reference CLI: absent
runtime: absent
extension execution: absent
```

The schemas do not currently publish an independent package version. Until a
schema distribution and release process is accepted, a schema snapshot should be
identified by a NexFlow repository release, tag, or commit when reproducibility
outside this repository is required.

Do not describe an arbitrary mix of schemas, examples, and scripts from different
repository revisions as a tested compatibility set.

### Manifest Discovery And Multiple-Workflow Smoke

Command:

```sh
npm run manifest-discovery-smoke
```

Compatible with explicit local file-list input, current Project source hints,
bounded root Project entry selection, the plural `manifests.workflows` shape,
one Project, zero or more unique Workflow documents, and one document for every
other current manifest kind. Focused checks cover entry ambiguity, parser and
resource limits, exact supported versions, source boundaries, association,
cardinality, deterministic ordering, and workflow-local namespaces.

It does not recursively discover directories, read ignore files, expand
bundles, fetch remote sources, aggregate collection manifests, compute complete
semantic closure, select a workflow, define cross-workflow state, or establish
CLI or runtime conformance.

## Manifest Kind Coverage

Every current schema-backed manifest kind appears in at least one maintained
example and is validated in CI.

| Manifest `kind` | Schema | Example coverage | `npm run validate` | `npm run semantic-smoke` |
| --- | --- | --- | --- | --- |
| `Project` | `project.schema.json` | One reduced and 6 complete project sets, plus focused fixtures | Full structural check | Optional source hints, singular or plural Workflow sources, selected project, maintainer, approval gate, network policy, and human override checks |
| `ActorSet` | `actors.schema.json` | Minimal Team migration path | Full structural check | Actor identity, agent bridge, operator, representative, integration, and relationship cycle checks |
| `AgentSet` | `agents.schema.json` | All 7 project sets | Full structural check | Agent identity inventory plus deprecated compatibility-field references where present |
| `AgentDefinitionSet` | `agent-definitions.schema.json` | 6 complete project sets | Full structural check | Selected agent and component references |
| `CapabilitySet` | `capabilities.schema.json` | 6 complete project sets | Full structural check | Capability inventory and selected references |
| `PermissionSet` | `permissions.schema.json` | 6 complete project sets | Full structural check | Permission, subject, capability, and approval gate references |
| `ContextSet` | `context.schema.json` | 6 complete project sets | Full structural check | Context source and selected actor/gate references |
| `MemorySet` | `memory.schema.json` | 6 complete project sets | Full structural check | Memory scope and selected actor/gate references |
| `ProviderSet` | `providers.schema.json` | 6 complete project sets | Full structural check | Provider inventory, closed feature vocabulary, and legacy feature migration diagnostics |
| `ModelProfileSet` | `model-profiles.schema.json` | 6 complete project sets | Full structural check | Provider references and selected actor references |
| `PromptSet` | `prompt-sets.schema.json` | 6 complete project sets | Full structural check | Selected owner, approver, and agent references |
| `RetrievalProfileSet` | `retrieval-profiles.schema.json` | 6 complete project sets | Full structural check | Selected context source, owner, approver, and agent references |
| `TaskSet` | `tasks.schema.json` | 6 complete project sets | Full structural check | Task dependency, actor, capability, gate, artifact, and event references |
| `Workflow` | `workflow.schema.json` | 6 complete project sets | Full structural check | Task, step dependency, gate, and event references |
| `HandoffSet` | `handoffs.schema.json` | 6 complete project sets | Full structural check | Endpoint and artifact references |
| `EventSet` | `events.schema.json` | 6 complete project sets | Full structural check | Event type inventory and selected event references |
| `ExtensionSet` | `extensions.schema.json` | 6 complete project sets | Full structural check | Extension inventory and required capability references |

`Full structural check` means validation against the matching JSON Schema. It
does not mean full semantic validation for that manifest kind.

## Validator Compatibility

### Repository Schema Validator

Command:

```sh
npm run validate
```

Compatible with:

- Node.js 20 or newer
- dependencies pinned in `package-lock.json`
- current draft 2020-12 JSON Schemas
- example manifests under `examples/`
- exact `specVersion: "0.1"`

It checks schema and YAML syntax, rejects aliases and duplicate mapping keys,
verifies bidirectional manifest-kind discovery, compiles the schemas, and
validates every maintained example against its selected schema.

It supports a repository-level `NF-SCHEMA` draft claim for the maintained
examples. It is not a published CLI compatibility promise.

It does not check:

- complete cross-manifest semantics
- permission or approval sufficiency
- graph reachability or all cycles
- context or memory safety
- provider availability
- runtime enforceability
- extension execution

### Actor Schema Boundary Smoke

Command:

```sh
npm run actor-schema-smoke
```

Compatible with the current common and ActorSet schema snapshot. It checks nine
accepted and rejected structural cases covering actor kinds, required
relationships, wrong target kinds, prohibited scope, and required identity
fields.

It does not resolve external references, authenticate actors, evaluate
delegation, or establish `NF-SEMANTIC` or `NF-RUNTIME` conformance.

### Agent Identity Schema Boundary Smoke

Command:

```sh
npm run agent-identity-schema-smoke
```

Compatible with the current AgentSet schema snapshot. It checks seven accepted
and rejected cases covering compact required identity, non-empty identity
metadata, and legacy behavior-field compatibility.

It does not select an agent definition, resolve components, or establish
effective behavior.

### Human Override Schema Boundary Smoke

Command:

```sh
npm run human-override-schema-smoke
```

Compatible with the current common and Project schema snapshot. It checks
eleven accepted and rejected cases covering typed authorities, supported
operations, new-action blocking, fail-closed response, approval-gated resume,
required reason, audit fields, and event syntax.

It does not authenticate authorities, interrupt work, revoke live credentials,
or establish runtime conformance.

### Typed Reference Primitive Smoke

Command:

```sh
npm run typed-reference-schema-smoke
```

Compatible with the current common schema snapshot. It checks 53 accepted and
rejected cases across six shared generic, transitional, and kind-specific
reference definitions.

It does not resolve target existence, apply every field contract, detect
semantic ambiguity, or establish complete `NF-SEMANTIC` conformance.

### Approval Gate Target Schema Smoke

Command:

```sh
npm run approval-gate-target-schema-smoke
```

Compatible with the current common and Project schema snapshot. It checks 16
accepted and rejected cases covering the closed target-kind set, assembly and
workflow scope, deprecated scalar coexistence, duplicate rejection, ID syntax,
and closed typed objects.

The semantic smoke command resolves maintained typed targets in exact
kind-specific namespaces. Neither command evaluates gate coverage, approval
decisions, approver authority, expiry, revocation, or runtime enforcement.

### Work Reference Namespace Smoke

Command:

```sh
npm run work-reference-namespace-smoke
```

Compatible with the current Workflow, TaskSet, and HandoffSet contracts. It
checks 13 cases covering workflow-wide step identity, cross-stage references,
assembly-wide artifact identity, duplicate rejection, and exact handoff lookup.

It does not validate graph cycles, execution order, artifact production,
provenance, disclosure policy, content integrity, or runtime behavior.

### Provider Feature Schema Smoke

Command:

```sh
npm run provider-feature-schema-smoke
```

Compatible with the current ProviderSet schema and maintained examples. It
checks 11 accepted and rejected cases covering the closed core vocabulary,
non-empty unique lists, deprecated field coexistence, and rejection of project
action capability IDs.

It does not select providers, inspect live models, grant tool or network access,
evaluate permissions, or establish runtime conformance.

### Conformance Claim Format Smoke

Command:

```sh
npm run conformance-claim-smoke
```

Compatible with standalone conformance claim `claimVersion: "0.1"`. It checks
15 accepted and rejected schema cases, including profile-qualified scope, plus
the required human-readable template sections and six current conformance
levels.

It does not verify external evidence, evaluate implementations, operate a
registry, issue certification, or establish any conformance level.

### Candidate Readiness Record Smoke

Command:

```sh
npm run candidate-readiness-smoke
```

Compatible with standalone candidate readiness `recordVersion: "0.1"`. It
checks 14 accepted and rejected schema cases, the exact eight-gate registry,
non-claiming template defaults, passed-gate evidence, evaluated-outcome
metadata, and blocker guards.

It does not execute evidence commands, verify links, evaluate release quality,
approve a tag, publish a release, or establish specification conformance.

### Semantic Reference Smoke

Command:

```sh
npm run semantic-smoke
```

Compatible with the current example project layout and current core reference
model.

It checks selected:

- duplicate declarations
- ActorSet identity, agent bridges, relationship cycles, and legacy participant references
- task references plus workflow-scoped step and dependency references
- assembly-scoped artifact declarations and handoff references
- capability and permission references
- approval gate references
- structured network policy rule and destination references
- human override authority, resume gate, and audit event references
- context and memory references
- provider and agent component references plus deprecated provider feature-field migration
- event references
- extension references

It remains `Partial` because it does not implement every semantic rule described
by the specification and RFCs. Passing it must not be presented as complete
`NF-SEMANTIC` conformance.

## CLI Compatibility

No reference CLI is implemented.

The [repository CLI prototype](cli-prototype.md) is an unreleased command
tool with discovery, structural validation, declared inspection, and static graph operations. It uses existing
maintenance dependencies without installing any of the public executables
below, selecting a language, or satisfying the architecture decision gates.
Its `validate` command applies the local core schemas to selected input after
discovery; it does not perform full semantic or extension-profile validation.
Its `inspect` command adds a bounded, allowlisted declaration and selected
reference projection after schema validation, not effective configuration or
Agent Assembly. See [CLI Declared Inspection](cli-inspection.md).
Its `graph` command matches selected references against that bounded inventory,
with explicit unresolved, ambiguous, and redacted states. See
[CLI Static Graph](cli-graph.md).
Checks cover dispatch, explicit input modes, schema selection, safe failure,
redaction, non-mutation, and deterministic output, not `NF-CLI` conformance.
Opt-in JSON output has a separate experimental schema and version, with
structured errors, check states, clean streams, related sources, and explicit
truncation. Existing discovery and validation text and exit meanings remain unchanged. See
[CLI Machine-Readable Diagnostics](cli-diagnostics.md) for the bounded contract.

The following command names are proposals, not available commands:

```text
nexflow validate
nexflow inspect
nexflow graph
nexflow init
```

RFC-0011 limits an initial reference CLI to validation, inspection, graphing,
and initialization. The
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) also fixes
command effect budgets, offline operation, static-versus-runtime fact ownership,
extension behavior, and shared-library constraints. Even after implementation,
an `NF-CLI` claim must not imply runtime preflight, workflow execution, or
runtime enforcement.

A future CLI release should publish:

- CLI version
- supported NexFlow `specVersion` values
- schema snapshots or package versions
- supported manifest kinds
- supported validation layers
- stable diagnostic code families
- output format versions
- extension-awareness limits
- explicitly unsupported runtime behavior

Until that information exists, there is no supported CLI/spec compatibility
pairing.

## Runtime Compatibility

No NexFlow runtime is implemented or selected.

The repository intentionally does not choose TypeScript, Python, Rust, or Go for
a runtime. Documentation and RFCs define evaluation criteria and future
behavioral requirements only.

There is currently no supported pairing between `specVersion: "0.1"` and an
executable runtime.

A future runtime must publish at least:

- runtime name and version
- supported NexFlow `specVersion` values
- supported manifest kinds and fields
- accepted schema or semantic validator versions
- implemented permission effects
- approval gate enforcement coverage
- autonomy enforcement coverage
- context and memory boundary coverage
- event and audit coverage
- audit store roles, redaction stage, ordering scope, durability, retention,
  deletion, access, integrity, gap, and recovery behavior
- separation from validation-only CLI commands and their shared libraries
- provider and model selection coverage
- provider adapter versions, provider API mappings, retry and fallback behavior,
  credential and network enforcement, error normalization, and audit coverage
- supported extension namespaces and versions
- unsupported or advisory-only semantics

Parsing manifests is not enough for `NF-RUNTIME` conformance.

## Extension Compatibility

The repository currently implements structural validation for `ExtensionSet` and
documents draft extension namespace and lifecycle rules.

It also specifies a future
[Extension Loading Boundary](extension-loading-boundary.md) that separates
project declarations from executable discovery, exact implementation
resolution, verification, enablement, isolation, activation, and
per-operation authorization. This is documentation, not loader support.

Current extension support includes:

- extension IDs
- reverse-DNS-style namespaces
- lifecycle declarations
- applicable manifest declarations
- required capability declarations
- example extension records
- an experimental `io.nexflow.mcp` policy profile with machine-readable
  structure and focused offline validation
- an experimental `io.nexflow.a2a` policy profile with machine-readable
  external identity, work, artifact, authority, and callback boundaries

Current extension support does not include:

- executable extension loading
- package discovery or installation
- namespace ownership verification
- a public extension registry
- live GitHub, GitLab, Jira, Linear, Figma, Slack, MCP, A2A, or custom integrations
- MCP transport, protocol negotiation, discovery, client, or server behavior
- A2A protocol bindings, Agent Card discovery, authentication, remote task
  synchronization, artifact import, streaming, push callbacks, client, or server behavior
- credential acquisition or secret management
- extension-provided runtime behavior

An unknown extension should be preserved when possible, reported as unsupported,
and prevented from granting capabilities, permissions, context, memory, or
runtime authority.

A future `NF-EXTENSION` compatibility claim should publish:

- extension namespace
- extension version
- lifecycle state
- supported NexFlow `specVersion` range
- required manifest kinds
- required capabilities and permissions
- runtime and CLI dependencies
- configuration schema version
- migration and deprecation policy
- unsupported behavior when the extension is absent

## Supported And Unsupported Combinations

| Combination | Result | Reason |
| --- | --- | --- |
| Current `0.1` examples + current schemas + `npm run validate` | Supported | This is the repository's maintained structural validation path. |
| Current `0.1` examples + `npm run semantic-smoke` | Supported with partial claim | Selected reference consistency only. |
| `0.1` project with valid ActorSet + current schemas and semantic smoke | Supported migration path | ActorSet is authoritative for participant identity; Minimal Team is the maintained reference. |
| `0.1` project without ActorSet + current schemas and semantic smoke | Supported legacy path | Maintainers and AgentSet remain the transitional participant inventory. |
| `0.1` manifest + future or unknown schema snapshot | Not established | No independent schema release mapping exists yet. |
| Manifest with unsupported `specVersion` + current schemas | Unsupported | Validators must report the unsupported version instead of guessing. |
| Mixed manifest versions in one project | Unsupported today | No migration runtime or mixed-version contract exists. |
| Schema-valid manifest + claimed full semantic correctness | Unsupported claim | JSON Schema cannot prove cross-manifest meaning. |
| Semantic-smoke pass + claimed runtime safety | Unsupported claim | Smoke validation does not enforce behavior. |
| Current manifest + `nexflow` CLI | Unsupported | No reference CLI exists. |
| Current manifest + NexFlow runtime | Unsupported | No runtime exists. |
| Declared extension + claimed live integration | Unsupported claim | Declaration is not implementation or authorization. |
| Unknown extension + additional access | Non-conforming | Unknown metadata cannot grant authority. |

## Consumer Compatibility Procedure

A future tool consuming NexFlow manifests should:

1. Read `specVersion` before interpreting fields.
2. Reject an unsupported version with a clear diagnostic.
3. Discover the complete logical manifest set.
4. Assess required profile slots, claimed qualifiers, and dependency closure.
5. Reject unsupported manifest kinds or report explicitly preserved unknown data.
6. Select the schema snapshot mapped to the declared spec version.
7. Run structural validation.
8. Run the semantic validation layers the tool claims.
9. Report unsupported RFC vocabulary that has not entered the accepted schema.
10. Resolve extension namespaces only through explicit support declarations.
11. Refuse runtime execution when required enforcement semantics are unsupported.

Tools must not choose the closest known version, silently downgrade manifests,
or treat a draft RFC as implemented schema behavior.

## Producer Compatibility Procedure

A tool producing NexFlow manifests should:

1. Declare the exact `specVersion` it targets.
2. Identify the authoring profiles its output is intended to satisfy.
3. Emit only fields accepted for that version unless namespaced extension rules
   explicitly allow additional metadata.
4. Validate output against the matching schema snapshot.
5. Avoid generating runtime claims from schema validity alone.
6. Record tool and template versions when reproducibility matters.
7. Preserve unsupported extension data when round-tripping is safe.
8. Provide migration guidance when output format behavior changes.

## Compatibility Record Template

Validators, CLIs, runtimes, and extensions should publish the standalone
[YAML conformance claim](../conformance/conformance-claim.template.yaml) and the
matching
[human-readable conformance claim](../conformance/CONFORMANCE-CLAIM.template.md).

The templates require a named subject version, exact profile-qualified scope,
explicit status for all six levels, evidence for supported or partial levels,
separate validation and enforcement descriptions, limitations, and a
self-declared attestation.

The machine-readable format is validated by:

```sh
npm run conformance-claim-smoke
```

This is a compatibility record, not a NexFlow project manifest, certification,
permission grant, approval, or runtime safety guarantee. See
[Conformance Claims](conformance-claims.md).

## Updating This Matrix

Update this matrix when a change affects any of the following:

- accepted or supported `specVersion` values
- schema-backed manifest kinds
- reference example coverage
- validation commands or validation depth
- conformance claims
- CLI implementation or output contracts
- runtime architecture or enforcement coverage
- extension namespace support or execution behavior
- schema distribution and release mapping

Changes to the matrix must stay synchronized with:

- [README status](../README.md#status)
- [Compatibility](compatibility.md)
- [Conformance](conformance.md)
- [Validation](validation.md)
- [Versioning](versioning.md)
- [Schema Guide](../schemas/README.md)
- [Examples Guide](../examples/README.md)
- [Changelog](../CHANGELOG.md)

## Known Gaps

- No independent schema package or schema release version exists.
- No complete semantic validator exists.
- No reference CLI exists.
- No runtime architecture decision has been accepted.
- No runtime exists.
- No extension registry or extension loader exists.
- No compatibility fixtures cover multiple accepted spec versions because only
  `0.1` is currently supported.
- Draft RFC features are not uniformly represented in current schemas.

These gaps are intentional and visible. They should be closed through the public
release plan rather than hidden behind broad compatibility claims.
