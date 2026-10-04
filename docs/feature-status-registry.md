# Feature Status Registry

This is the single inventory of feature **lifecycle**, not a support matrix,
release approval or runtime claim. It covers every current schema-backed
manifest kind, every numbered RFC proposal, experimental implementation slices,
explicitly deprecated fields and the planned implementations most easily
confused with existing documentation.

Current source snapshot: `a357309c7737d94b13330513da3deb20eef2b8f8`.
The inventory describes that source plus this documentation/consistency change.
A later edit must update the affected rows and their evidence; this is not a
live service or a registry of external implementations.

## Read The Axes Separately

| Lifecycle | Meaning and change authority |
| --- | --- |
| **Accepted** | The scoped design decision is accepted in its owning RFC/review. It does not mean all fields are stable or an implementation exists. |
| **Draft** | The current authored contract or whole proposal is still a draft, even when schemas or a limited implementation exist. |
| **Experimental** | A bounded implementation/profile is available for evaluation, without stable API, runtime, integration or distribution guarantees. |
| **Deprecated** | An existing compatibility form is explicitly deprecated in its owning schema/guidance. It may still be schema-valid; this registry sets no removal date. |
| **Planned** | The named implementation is future work, not an implemented capability. Its proposal may separately be Draft. |

The [RFC index](../rfcs/README.md) records proposal stages and decision authority.
The [compatibility matrix](compatibility-matrix.md) owns evidence/support states
such as Implemented, Partial, Specified and Unsupported. The [README status
summary](../README.md#status) is a short implementation overview.
The [frozen 0.1 scope](0.1-scope.md) owns historical candidate treatment
(Baseline, Optional, Migration-only, Deferred).
These are separate axes: this registry does not accept an RFC, certify
conformance, change a version or approve a release.

For example, RFC-0018 is Draft, its offline MCP profile is Experimental and its
live client/server implementation is Planned/not implemented. A Deprecated
field can remain structurally supported for migration. Authored instance values
such as `AgentDefinition.status: active` or `Extension.status: stable` are not
project feature lifecycle decisions.

## Manifest Kind Contracts

All 17 current `specVersion: "0.1"` authoring contracts remain **Draft**.
Accepted RFC-0002 establishes the separate-manifest foundation, not acceptance
of every later field, optional profile or proposed semantic rule. Structural
coverage does not promote a kind to Accepted. Supporting common definitions,
profiles, conformance claims and readiness records are not additional kinds.

| ID | Surface and scope | Lifecycle | Evidence and boundary |
| --- | --- | --- | --- |
| `kind:ActorSet` | First-class participant identities and relationships | Draft | [Schema](../schemas/actors.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:AgentDefinitionSet` | Versioned requested behavior and unique active-definition selection | Draft | [Schema](../schemas/agent-definitions.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:AgentSet` | Compact AI identity; deprecated duplicates are listed separately below | Draft | [Schema](../schemas/agents.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:CapabilitySet` | Technical action vocabulary, not permission | Draft | [Schema](../schemas/capabilities.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:ContextSet` | Context source, access and freshness declarations | Draft | [Schema](../schemas/context.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:EventSet` | Event type declarations, not an event log | Draft | [Schema](../schemas/events.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:ExtensionSet` | Extension namespace and lifecycle declarations | Draft | [Schema](../schemas/extensions.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:HandoffSet` | Responsibility transfer declarations | Draft | [Schema](../schemas/handoffs.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:MemorySet` | Retention, ownership and visibility declarations | Draft | [Schema](../schemas/memory.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:ModelProfileSet` | Requested model selection and fallback declarations | Draft | [Schema](../schemas/model-profiles.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:PermissionSet` | Allow, deny and approval-required policy declarations | Draft | [Schema](../schemas/permissions.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:Project` | Project identity, policy, approval and local source declarations | Draft | [Schema](../schemas/project.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:PromptSet` | Prompt revision, ownership and review declarations | Draft | [Schema](../schemas/prompt-sets.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:ProviderSet` | Provider feature and constraint declarations | Draft | [Schema](../schemas/providers.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:RetrievalProfileSet` | Retrieval, indexing and citation expectations | Draft | [Schema](../schemas/retrieval-profiles.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:TaskSet` | Work, dependencies, artifacts and acceptance declarations | Draft | [Schema](../schemas/tasks.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |
| `kind:Workflow` | Declarative stages, steps, dependencies and gates | Draft | [Schema](../schemas/workflow.schema.json) and [manifest reference](manifest-reference.md); structural authoring only, not full semantics or execution. |

## RFC-Backed Features

Every numbered RFC has one whole-proposal row. Lifecycle follows the recorded
decision stage, not the presence of a schema or an implemented slice. More
specific experimental/deprecated/planned rows below do not overwrite that stage.

| ID | Surface and scope | Lifecycle | Evidence and boundary |
| --- | --- | --- | --- |
| `rfc:RFC-0001` | Project Vision proposal | Accepted | [Owning RFC](../rfcs/RFC-0001-project-vision.md), [scope](vision.md). Accepted specification-first direction; no execution capability is granted. |
| `rfc:RFC-0002` | Core Manifest Model proposal | Accepted | [Owning RFC](../rfcs/RFC-0002-core-manifest-model.md), [scope](manifest-reference.md). Accepted separate-manifest foundation; current fields remain draft and runtime enforcement is absent. |
| `rfc:RFC-0003` | Conformance Levels proposal | Draft | [Owning RFC](../rfcs/RFC-0003-conformance-levels.md), [scope](conformance-claims.md). Claim schema and templates exist; no subject certification or runtime conformance. |
| `rfc:RFC-0004` | Agent Definition Versioning proposal | Draft | [Owning RFC](../rfcs/RFC-0004-agent-definition-versioning.md), [scope](agent-definitions.md). Declaration and selection slices exist; full resolution and agent execution do not. |
| `rfc:RFC-0005` | Validation Strategy proposal | Draft | [Owning RFC](../rfcs/RFC-0005-validation-strategy.md), [scope](validation.md). Structural checks and partial semantic smoke exist; no complete semantic or runtime validation. |
| `rfc:RFC-0006` | Extension Namespaces proposal | Draft | [Owning RFC](../rfcs/RFC-0006-extension-namespaces.md), [scope](extensions.md). Namespace declarations exist; no live registry, ownership verification or loader. |
| `rfc:RFC-0007` | Approval Gates proposal | Draft | [Owning RFC](../rfcs/RFC-0007-approval-gates.md), [scope](approval-gates.md). Declarations and typed targets exist; no authenticated decision service or enforcement. |
| `rfc:RFC-0008` | Memory Retention proposal | Draft | [Owning RFC](../rfcs/RFC-0008-memory-retention.md), [scope](memory-model.md). Policies are authored; no store, expiry, deletion or runtime enforcement. |
| `rfc:RFC-0009` | Event Envelope proposal | Draft | [Owning RFC](../rfcs/RFC-0009-event-envelope.md), [scope](events.md). Declarations and envelope/interoperability rules exist; no emitter, transport or audit store. |
| `rfc:RFC-0010` | Provider Selection proposal | Draft | [Owning RFC](../rfcs/RFC-0010-provider-selection.md), [scope](provider-abstraction.md). Eligibility declarations exist; no live selection, fallback engine or provider invocation. |
| `rfc:RFC-0011` | Reference CLI Scope proposal | Draft | [Owning RFC](../rfcs/RFC-0011-reference-cli-scope.md), [scope](reference-cli.md). Proposed command scope only; experimental repository tooling is not a released reference CLI. |
| `rfc:RFC-0012` | Manifest Bundling proposal | Draft | [Owning RFC](../rfcs/RFC-0012-manifest-bundling.md), [scope](manifest-discovery.md). Local files/source hints exist; no bundle expansion, remote loading or supported bundle format. |
| `rfc:RFC-0013` | Actor Model proposal | Draft | [Owning RFC](../rfcs/RFC-0013-actor-model.md), [scope](actor-model.md). ActorSet and migration slices exist; no runtime principal binding. |
| `rfc:RFC-0014` | Effective Agent Configuration proposal | Draft | [Owning RFC](../rfcs/RFC-0014-effective-agent-configuration.md), [scope](effective-agent-configuration.md). Unique active-definition authority is bounded; no complete resolver or Agent Assembly serializer. |
| `rfc:RFC-0015` | Typed References proposal | Draft | [Owning RFC](../rfcs/RFC-0015-typed-references.md), [scope](typed-references.md). Selected primitives and namespace checks exist; no complete field-wide semantic conformance. |
| `rfc:RFC-0016` | Core Profile And Logical Discovery proposal | Draft | [Owning RFC](../rfcs/RFC-0016-core-profile-and-discovery.md), [scope](core-profile.md). Core Profile and bounded local discovery exist; no scans, general indexes or runtime loading. |
| `rfc:RFC-0017` | Human Override proposal | Draft | [Owning RFC](../rfcs/RFC-0017-human-override.md), [scope](human-override.md). Fail-closed declarations exist; no authentication, interruption or revocation enforcement. |
| `rfc:RFC-0018` | MCP Extension Profile proposal | Draft | [Owning RFC](../rfcs/RFC-0018-mcp-extension-profile.md), [scope](mcp-integration-profile.md). Offline experimental policy mapping exists; no MCP client, server, transport or invocation. |
| `rfc:RFC-0019` | MCP And A2A Boundaries proposal | Draft | [Owning RFC](../rfcs/RFC-0019-mcp-a2a-boundaries.md), [scope](mcp-a2a-boundaries.md). Boundary map and A2A policy assets exist; no protocol implementation or imported authority. |
| `rfc:RFC-0020` | GitHub Extension Profile proposal | Draft | [Owning RFC](../rfcs/RFC-0020-github-extension-profile.md), [scope](../extensions/github/README.md). Experimental offline policy profile exists; no client, webhook receiver or repository mutation. |
| `rfc:RFC-0021` | Issue Tracker Extension Profile proposal | Draft | [Owning RFC](../rfcs/RFC-0021-issue-tracker-extension-profile.md), [scope](../extensions/issue-tracker/README.md). Experimental policy profile and checks exist; no issue adapter or live synchronization. |
| `rfc:RFC-0022` | Security Policy Composition proposal | Draft | [Owning RFC](../rfcs/RFC-0022-security-policy-composition.md), [scope](security-model.md). Composition proposal and manual scenarios only; no complete policy evaluator or OS isolation. |

## Experimental Implementation Slices

These rows apply only to the named offline/source-bound implementation, not its
whole RFC or a future runtime. Four candidate reports agree on supported cases
but each fails specification fidelity because 224 semantic/namespace cases
remain unsupported. Full deterministic diagnostics, independent review,
target lifecycle and comparable performance are not accepted.

| ID | Surface and scope | Lifecycle | Evidence and boundary |
| --- | --- | --- | --- |
| `experiment:repository-cli` | Local repository CLI and JSON/inspection/graph/init contracts | Experimental | [Prototype scope](cli-prototype.md), [output contract](cli-diagnostics.md); bounded maintenance tooling, not stable public CLI or OS sandbox. |
| `experiment:candidate-go` | go validation-only source candidate | Experimental | [Native source](../evaluation/prototypes/go/README.md), [fidelity report](../evaluation/fidelity/go.json); 128/352 supported cases, 224 not-tested, fidelity failed, no language selection or distribution acceptance. |
| `experiment:candidate-python` | python validation-only source candidate | Experimental | [Native source](../evaluation/prototypes/python/README.md), [fidelity report](../evaluation/fidelity/python.json); 128/352 supported cases, 224 not-tested, fidelity failed, no language selection or distribution acceptance. |
| `experiment:candidate-rust` | rust validation-only source candidate | Experimental | [Native source](../evaluation/prototypes/rust/README.md), [fidelity report](../evaluation/fidelity/rust.json); 128/352 supported cases, 224 not-tested, fidelity failed, no language selection or distribution acceptance. |
| `experiment:candidate-typescript` | typescript validation-only source candidate | Experimental | [Native source](../evaluation/prototypes/typescript/README.md), [fidelity report](../evaluation/fidelity/typescript.json); 128/352 supported cases, 224 not-tested, fidelity failed, no language selection or distribution acceptance. |
| `experiment:extension-a2a` | Offline a2a policy profile | Experimental | [Profile](../extensions/a2a/README.md); declaration/schema assets only, no live integration, executable extension or delegated authority. |
| `experiment:extension-github` | Offline github policy profile | Experimental | [Profile](../extensions/github/README.md); declaration/schema assets only, no live integration, executable extension or delegated authority. |
| `experiment:extension-issue-tracker` | Offline issue-tracker policy profile | Experimental | [Profile](../extensions/issue-tracker/README.md); declaration/schema assets only, no live integration, executable extension or delegated authority. |
| `experiment:extension-mcp` | Offline mcp policy profile | Experimental | [Profile](../extensions/mcp/README.md); declaration/schema assets only, no live integration, executable extension or delegated authority. |

## Deprecated Compatibility Fields

Each row cites an existing `deprecated: true` annotation, not a new deprecation.
All ten remain valid only within their documented `0.1` migration boundary.
Their parent manifest kind is not deprecated. No removal version or deadline
is introduced; use the owning migration guide before changing declarations.

| ID | Surface and scope | Lifecycle | Evidence and boundary |
| --- | --- | --- | --- |
| `legacy:agents-permissions` | `agents.permissions` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/permissions`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-capabilities` | `agents.capabilities` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/capabilities`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-context-access` | `agents.contextAccess` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/contextAccess`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-memory-access` | `agents.memoryAccess` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/memoryAccess`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-autonomy-level` | `agents.autonomyLevel` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/autonomyLevel`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-provider-preferences` | `agents.providerPreferences` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/providerPreferences`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:agents-extensions` | `agents.extensions` compatibility field | Deprecated | [Schema annotation](../schemas/agents.schema.json) at `agents.schema.json#/properties/agents/items/properties/extensions`, [migration](agent-identity-migration.md). Move requested behavior to AgentDefinitionSet and its referenced profiles; domain policy remains authoritative. |
| `legacy:common-applies-to` | `common.appliesTo` compatibility field | Deprecated | [Schema annotation](../schemas/common.schema.json) at `common.schema.json#/$defs/approvalGate/properties/appliesTo`, [migration](approval-gate-targets.md). Use typed targets; scalar appliesTo is not semantically resolved. |
| `legacy:providers-allow-training-use` | `providers.allowTrainingUse` compatibility field | Deprecated | [Schema annotation](../schemas/providers.schema.json) at `providers.schema.json#/$defs/providerConstraints/properties/allowTrainingUse`, [migration](provider-constraints.md). Use explicit trainingUse policy; do not broaden reviewed policy during migration. |
| `legacy:providers-capabilities` | `providers.capabilities` compatibility field | Deprecated | [Schema annotation](../schemas/providers.schema.json) at `providers.schema.json#/properties/providers/items/properties/capabilities`, [migration](provider-features.md). Use provider features, never CapabilitySet action grants. |

## Planned Implementations

A Draft contract and an experimental rehearsal are not an implemented public
capability. These rows name the missing implementation rather than relabeling
the existing documentation.

| ID | Surface and scope | Lifecycle | Evidence and boundary |
| --- | --- | --- | --- |
| `planned:reference-cli` | Installable reference CLI | Planned | [Contract or proposal](reference-cli.md). Not implemented or released; alpha/beta preparation is not-ready and does not grant publication. |
| `planned:runtime` | Runtime/orchestration/enforcement | Planned | [Contract or proposal](runtime-options.md). Not implemented; no accepted architecture, provider execution or workflow execution. |
| `planned:provider-adapters` | Live provider adapters | Planned | [Contract or proposal](provider-adapter-boundary.md). Not implemented; documented invocation boundaries are not an adapter or live capability. |
| `planned:extension-loading` | Executable extension loading and live integrations | Planned | [Contract or proposal](extension-loading-boundary.md). Not implemented; profiles and metadata cannot authorize loading or effects. |
| `planned:schema-artifact` | Independently published schema bundle | Planned | [Contract or proposal](schema-bundle-publication.md). Not implemented or published; this is distinct from manifest bundling. |
| `planned:manifest-bundles` | Bundle expansion and remote manifest sources | Planned | [Contract or proposal](../rfcs/RFC-0012-manifest-bundling.md). Not implemented; current support is explicit bounded local files/source hints only. |
| `planned:agent-assembly` | Effective-configuration resolver and Agent Assembly serializer | Planned | [Contract or proposal](agent-assembly.md). Not implemented; documented inspection projection is not the experimental declared-only CLI view. |
| `planned:full-semantic-validation` | Complete semantic/reference and policy validation | Planned | [Contract or proposal](semantic-reference-inventory.md). Not implemented; smoke checks and structural source candidates remain partial. |

## Maintaining The Registry

1. Add/update a row when a schema kind, numbered RFC, maintained candidate,
   extension profile or schema deprecation changes; do not omit unsupported work.
2. Cite the owning contract, decision and bounded evidence. Lifecycle changes
   require that owning review; passing CI or merging a prototype is not approval.
3. Synchronize the RFC stage/index, README summary, compatibility matrix,
   migration guidance and changelog where their separate axes are affected.
4. Keep deprecated replacements and unsupported/runtime limits explicit.
5. Run `npm run feature-status-registry-smoke` and the complete maintenance
   checks before publication.

The offline check derives kind/RFC/candidate/profile/deprecation inventories
from repository files, rejects missing/duplicate/unknown rows and unsupported
status promotions, and verifies source links and navigation. It is consistency
evidence, not a maintainer decision, semantic validator or external URL check.
