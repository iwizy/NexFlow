# Compatibility Matrix

This matrix records which NexFlow specification, schema, example, validator,
CLI, runtime, and extension combinations are supported by the repository today.

It is a statement of current evidence, not a promise that planned components
already exist.

For compatibility rules and breaking change guidance, see
[Compatibility](compatibility.md). For support claim vocabulary, see
[Conformance](conformance.md).

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
| Specification | `specVersion: "0.1"` draft | Specified | Core docs, manifest reference, RFCs | Pre-`1.0`; fields and semantics may change with migration guidance. |
| JSON Schemas | `0.1` across 17 manifest kinds plus common definitions | Implemented | `schemas/*.schema.json` | Structural validation only; schemas do not prove cross-manifest meaning or safety. |
| Reference examples | 7 project sets, 113 schema-backed manifests, all using `0.1` | Implemented | `examples/` | Authoring and validation fixtures, not executable teams or runtime demonstrations. |
| Repository schema validator | Current repository schema snapshot and reference examples | Implemented | `npm run validate` | Maintenance tooling, not a published `nexflow` CLI or general runtime preflight. |
| Actor schema boundary smoke | 9 accepted and rejected structural cases | Implemented | `npm run actor-schema-smoke` | Focused ActorSet schema evidence, not full semantic or runtime conformance. |
| Agent identity boundary smoke | 7 compact and legacy structural cases | Implemented | `npm run agent-identity-schema-smoke` | Checks identity migration compatibility, not definition selection or effective configuration. |
| Agent definition authority smoke | 13 structural and selection cases | Implemented | `npm run agent-definition-authority-smoke` | Checks active completeness and unique unscoped selection, not full policy resolution or runtime execution. |
| Human override boundary smoke | 11 accepted and rejected structural cases | Implemented | `npm run human-override-schema-smoke` | Checks policy shape, not authentication, interruption, revocation, or runtime enforcement. |
| Semantic reference smoke | Selected cross-manifest reference, active definition authority, and duplicate checks | Partial | `npm run semantic-smoke` | Does not establish full `NF-SEMANTIC` conformance, graph safety, or policy correctness. |
| Reference CLI | Validation-only scope proposed | Planned | RFC-0011 | No `nexflow` executable or `NF-CLI` implementation exists. |
| Runtime | Provider-neutral requirements documented | Planned | Architecture, runtime options, roadmap | No orchestration, enforcement, provider calling, task execution, or `NF-RUNTIME` implementation exists. |
| Extensions | Core declaration schema and draft namespace/lifecycle rules | Partial | `extensions.schema.json`, extension docs, examples | No registry, loader, live integration, plugin execution, or supported namespace catalog exists. |

## Version Compatibility Matrix

| Manifest `specVersion` | Schema snapshot | Reference examples | Repository validator | Reference CLI | Runtime | Extensions | Repository support |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0.1` | Current 17-kind draft schema set | 7 maintained project sets | Schema validation implemented; semantic references partial | Not implemented | Not implemented | Declaration shape implemented; behavior not implemented | Current supported authoring and repository validation target |
| Any other `0.x` | No published schema mapping | None | Must report unsupported version | Not implemented | Not implemented | Unsupported | Unsupported |
| `1.0` | Not published | None | Must report unsupported version | Planned only | Planned only | Planned only | Future target, not currently supported |

The `0.1` row does not mean that every draft RFC is accepted or represented in
schemas. RFC proposals remain proposals until their docs, schemas, examples,
compatibility notes, and versioning impact are accepted and synchronized.

[RFC-0016](../rfcs/RFC-0016-core-profile-and-discovery.md) proposes reduced core profiles, optional modules, and multiple workflow discovery. Those combinations are not part of the current supported matrix unless the proposal is accepted and implemented.

## Current Artifact Pairing

The currently tested repository pairing is:

```text
specVersion: 0.1
schemas: current repository snapshot
examples: current repository snapshot
schema validator: scripts/validate-schemas.mjs
actor boundary smoke: scripts/actor-schema-smoke.mjs
agent identity boundary smoke: scripts/agent-identity-schema-smoke.mjs
agent definition authority smoke: scripts/agent-definition-authority-smoke.mjs
human override boundary smoke: scripts/human-override-schema-smoke.mjs
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

## Manifest Kind Coverage

Every current schema-backed manifest kind appears in at least one maintained
example and is validated in CI.

| Manifest `kind` | Schema | Example coverage | `npm run validate` | `npm run semantic-smoke` |
| --- | --- | --- | --- | --- |
| `Project` | `project.schema.json` | All 7 project sets | Full structural check | Selected project, maintainer, approval gate, network policy, and human override checks |
| `ActorSet` | `actors.schema.json` | Minimal Team migration path | Full structural check | Actor identity, agent bridge, operator, representative, integration, and relationship cycle checks |
| `AgentSet` | `agents.schema.json` | All 7 project sets | Full structural check | Agent identity inventory plus deprecated compatibility-field references where present |
| `AgentDefinitionSet` | `agent-definitions.schema.json` | All 7 project sets | Full structural check | Selected agent and component references |
| `CapabilitySet` | `capabilities.schema.json` | All 7 project sets | Full structural check | Capability inventory and selected references |
| `PermissionSet` | `permissions.schema.json` | All 7 project sets | Full structural check | Permission, subject, capability, and approval gate references |
| `ContextSet` | `context.schema.json` | All 7 project sets | Full structural check | Context source and selected actor/gate references |
| `MemorySet` | `memory.schema.json` | All 7 project sets | Full structural check | Memory scope and selected actor/gate references |
| `ProviderSet` | `providers.schema.json` | All 7 project sets | Full structural check | Provider inventory and selected references |
| `ModelProfileSet` | `model-profiles.schema.json` | All 7 project sets | Full structural check | Provider references and selected actor references |
| `PromptSet` | `prompt-sets.schema.json` | All 7 project sets | Full structural check | Selected owner, approver, and agent references |
| `RetrievalProfileSet` | `retrieval-profiles.schema.json` | All 7 project sets | Full structural check | Selected context source, owner, approver, and agent references |
| `TaskSet` | `tasks.schema.json` | All 7 project sets | Full structural check | Task dependency, actor, capability, gate, artifact, and event references |
| `Workflow` | `workflow.schema.json` | All 7 project sets | Full structural check | Task, step dependency, gate, and event references |
| `HandoffSet` | `handoffs.schema.json` | All 7 project sets | Full structural check | Endpoint and artifact references |
| `EventSet` | `events.schema.json` | All 7 project sets | Full structural check | Event type inventory and selected event references |
| `ExtensionSet` | `extensions.schema.json` | All 7 project sets | Full structural check | Extension inventory and required capability references |

`Full structural check` means validation against the matching JSON Schema. It
does not mean full semantic validation for that manifest kind.

## Validator Compatibility

### Repository Smoke Script

Command:

```sh
./scripts/schema-smoke
```

Compatible with:

- the current repository layout
- current schema JSON files
- current example YAML files
- current manifest-kind discovery rules

It checks:

- schema JSON syntax
- example YAML syntax
- non-empty manifest `kind`
- a matching schema for every discovered kind
- at least one example for every schema-backed kind

It does not validate examples against JSON Schema and does not perform semantic
validation.

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
- task and workflow references
- artifact references
- capability and permission references
- approval gate references
- structured network policy rule and destination references
- human override authority, resume gate, and audit event references
- context and memory references
- provider and agent component references
- event references
- extension references

It remains `Partial` because it does not implement every semantic rule described
by the specification and RFCs. Passing it must not be presented as complete
`NF-SEMANTIC` conformance.

## CLI Compatibility

No reference CLI is implemented.

The following command names are proposals, not available commands:

```text
nexflow validate
nexflow inspect
nexflow graph
nexflow init
```

RFC-0011 limits an initial reference CLI to validation, inspection, graphing,
and initialization. Even after implementation, an `NF-CLI` claim must not imply
workflow execution or runtime enforcement.

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
- provider and model selection coverage
- supported extension namespaces and versions
- unsupported or advisory-only semantics

Parsing manifests is not enough for `NF-RUNTIME` conformance.

## Extension Compatibility

The repository currently implements structural validation for `ExtensionSet` and
documents draft extension namespace and lifecycle rules.

Current extension support includes:

- extension IDs
- reverse-DNS-style namespaces
- lifecycle declarations
- applicable manifest declarations
- required capability declarations
- example extension records

Current extension support does not include:

- executable extension loading
- package discovery or installation
- namespace ownership verification
- a public extension registry
- live GitHub, GitLab, Jira, Linear, Figma, Slack, MCP, or custom integrations
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
4. Reject unsupported manifest kinds or report explicitly preserved unknown data.
5. Select the schema snapshot mapped to the declared spec version.
6. Run structural validation.
7. Run the semantic validation layers the tool claims.
8. Report unsupported RFC vocabulary that has not entered the accepted schema.
9. Resolve extension namespaces only through explicit support declarations.
10. Refuse runtime execution when required enforcement semantics are unsupported.

Tools must not choose the closest known version, silently downgrade manifests,
or treat a draft RFC as implemented schema behavior.

## Producer Compatibility Procedure

A tool producing NexFlow manifests should:

1. Declare the exact `specVersion` it targets.
2. Emit only fields accepted for that version unless namespaced extension rules
   explicitly allow additional metadata.
3. Validate output against the matching schema snapshot.
4. Avoid generating runtime claims from schema validity alone.
5. Record tool and template versions when reproducibility matters.
6. Preserve unsupported extension data when round-tripping is safe.
7. Provide migration guidance when output format behavior changes.

## Compatibility Record Template

Future validators, CLIs, runtimes, and extensions should publish a compact record
like this:

```yaml
implementation:
  name: example-tool
  version: 0.1.0
supports:
  specVersions:
    - "0.1"
  schemaSnapshot: nexflow-tag-or-commit
  manifestKinds:
    - Project
    - AgentSet
    - TaskSet
  conformance:
    - NF-MANIFEST
    - NF-SCHEMA
  extensionNamespaces: []
limitations:
  - No runtime execution.
  - No full semantic validation.
```

This is documentation guidance, not a new NexFlow manifest kind.

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
