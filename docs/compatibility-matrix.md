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
| Negative schema fixtures | Required field, enum value, ID format, and unknown kind rejection | Implemented | `npm run negative-schema-fixtures`, `fixtures/schema/invalid/` | Four focused rejection categories, not a complete invalid-input or diagnostic conformance suite. |
| Actor schema boundary smoke | 9 accepted and rejected structural cases | Implemented | `npm run actor-schema-smoke` | Focused ActorSet schema evidence, not full semantic or runtime conformance. |
| Agent identity boundary smoke | 7 compact and legacy structural cases | Implemented | `npm run agent-identity-schema-smoke` | Checks identity migration compatibility, not definition selection or effective configuration. |
| Agent definition authority smoke | 15 structural and selection cases | Implemented | `npm run agent-definition-authority-smoke` | Checks active completeness, unique unscoped selection, and rejection of unsupported memory policy references, not full policy resolution or runtime execution. |
| Core Profile contract | Machine-readable required slots, optional qualifiers, dependency rules, and 16 focused cases | Implemented | `profiles/core.yaml`, `docs/core-profile.md`, `npm run core-profile-smoke` | Consumes normalized kind inventories; general discovery, arbitrary assembly validation, multi-workflow loading, and runtime preflight are absent. |
| Agent Assembly inspection view | Documentation contract for a derived effective-configuration projection | Specified | `docs/agent-assembly.md`, RFC-0014 | No resolver, serializer, JSON Schema, reference CLI output, or runtime implementation exists. |
| Human override boundary smoke | 11 accepted and rejected structural cases | Implemented | `npm run human-override-schema-smoke` | Checks policy shape, not authentication, interruption, revocation, or runtime enforcement. |
| Typed reference primitives | Common typed, scoped, transitional, and kind-specific definitions with 53 focused cases | Implemented | `schemas/common.schema.json`, `npm run typed-reference-schema-smoke` | Shape and lexical evidence only; no complete field-contract or semantic resolution conformance. |
| Approval gate targets | Closed typed target kinds, assembly and workflow scope, migrated examples, and exact semantic lookup | Implemented | `docs/approval-gate-targets.md`, `npm run approval-gate-target-schema-smoke`, `npm run semantic-smoke` | Target resolution only; no gate coverage, decision state, approver authentication, or runtime enforcement. |
| Work reference namespaces | Workflow-wide step and assembly-wide artifact rules with 13 focused cases | Implemented | `docs/work-reference-namespaces.md`, `npm run work-reference-namespace-smoke` | Identity and exact lookup evidence only; no cycle, ordering, provenance, disclosure, or runtime enforcement. |
| Provider feature vocabulary | Closed model support signals, migrated examples, and legacy capability separation | Implemented | `docs/provider-features.md`, `npm run provider-feature-schema-smoke`, `npm run semantic-smoke` | Structural and migration evidence only; no provider selection, live availability, permission, or runtime support. |
| Provider constraint vocabulary | Structured provider eligibility fields, migrated examples, legacy training boolean, and 17 focused cases | Implemented | `docs/provider-constraints.md`, `npm run provider-constraint-schema-smoke` | Structural and migration evidence only; no complete constraint solver, live provider facts, selection, or runtime enforcement. |
| MCP extension draft | Machine-readable `io.nexflow.mcp` profile, stricter ContextSet boundary, Software Team binding, and 10 focused cases | Implemented | `extensions/mcp/`, RFC-0018, `npm run mcp-extension-smoke` | Policy mapping only; no MCP client, server, transport, discovery, credential, protocol negotiation, or execution support. |
| Conformance claim format | Standalone `claimVersion: "0.1"` schema plus profile-qualified YAML and Markdown templates | Implemented | `conformance/`, `npm run conformance-claim-smoke` | Self-declared claim structure only; no certification, external evidence verification, registry, or conformance test suite. |
| Semantic reference inventory | P0-P3 target namespaces, coverage, gaps, and deferred fields | Specified | `docs/semantic-reference-inventory.md` | Documentation contract only; it is not a manifest, generated registry, validator, or conformance suite. |
| Semantic reference smoke | Selected cross-manifest reference, active definition authority, and duplicate checks | Partial | `npm run semantic-smoke`, semantic reference inventory | Does not cover every inventoried field or establish full `NF-SEMANTIC` conformance, graph safety, or policy correctness. |
| Reference CLI | Validation-only scope proposed | Planned | RFC-0011 | No `nexflow` executable or `NF-CLI` implementation exists. |
| Runtime | Provider-neutral requirements documented | Planned | Architecture, runtime options, roadmap | No orchestration, enforcement, provider calling, task execution, or `NF-RUNTIME` implementation exists. |
| Extensions | Core declaration schema, namespace/lifecycle rules, and one maintained experimental MCP profile | Partial | `extensions.schema.json`, `extensions/mcp/`, extension docs, examples | No registry, loader, live integration, protocol implementation, or plugin execution exists. |

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
Project source hints. General discovery, source indexes, and multiple workflow
loading remain outside the current supported matrix.

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
human override boundary smoke: scripts/human-override-schema-smoke.mjs
mcp extension profile: extensions/mcp/profile.yaml
mcp extension smoke: scripts/mcp-extension-smoke.mjs
typed reference primitive smoke: scripts/typed-reference-schema-smoke.mjs
approval gate target smoke: scripts/approval-gate-target-schema-smoke.mjs
provider constraint smoke: scripts/provider-constraint-schema-smoke.mjs
work reference namespace smoke: scripts/work-reference-namespace-smoke.mjs
provider feature smoke: scripts/provider-feature-schema-smoke.mjs
conformance claim format smoke: scripts/conformance-claim-smoke.mjs
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
| `Project` | `project.schema.json` | All 7 complete project sets plus reduced focused fixtures | Full structural check | Optional source hints, selected project, maintainer, approval gate, network policy, and human override checks |
| `ActorSet` | `actors.schema.json` | Minimal Team migration path | Full structural check | Actor identity, agent bridge, operator, representative, integration, and relationship cycle checks |
| `AgentSet` | `agents.schema.json` | All 7 project sets | Full structural check | Agent identity inventory plus deprecated compatibility-field references where present |
| `AgentDefinitionSet` | `agent-definitions.schema.json` | All 7 project sets | Full structural check | Selected agent and component references |
| `CapabilitySet` | `capabilities.schema.json` | All 7 project sets | Full structural check | Capability inventory and selected references |
| `PermissionSet` | `permissions.schema.json` | All 7 project sets | Full structural check | Permission, subject, capability, and approval gate references |
| `ContextSet` | `context.schema.json` | All 7 project sets | Full structural check | Context source and selected actor/gate references |
| `MemorySet` | `memory.schema.json` | All 7 project sets | Full structural check | Memory scope and selected actor/gate references |
| `ProviderSet` | `providers.schema.json` | All 7 project sets | Full structural check | Provider inventory, closed feature vocabulary, and legacy feature migration diagnostics |
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
- an experimental `io.nexflow.mcp` policy profile with machine-readable
  structure and focused offline validation

Current extension support does not include:

- executable extension loading
- package discovery or installation
- namespace ownership verification
- a public extension registry
- live GitHub, GitLab, Jira, Linear, Figma, Slack, MCP, or custom integrations
- MCP transport, protocol negotiation, discovery, client, or server behavior
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
