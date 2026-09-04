# Compatibility

NexFlow compatibility is about preserving the meaning of manifests across tools and time.

For the current supported combinations and explicit implementation gaps, see the [Compatibility Matrix](compatibility-matrix.md).

## Compatibility Goals

- A manifest should mean the same thing across runtimes.
- A runtime should reject unsupported versions clearly.
- A schema should validate common structural errors.
- Examples should remain valid for the spec version they target.
- Extensions should not change core semantics silently.

## Compatibility Classes

### Compatible Changes

- adding optional fields
- clarifying documentation
- adding new event types
- adding new capabilities
- adding examples
- tightening unsafe language without changing manifest meaning

### Potentially Breaking Changes

- renaming fields
- changing default approval behavior
- changing memory visibility semantics
- changing capability meaning
- changing an active agent definition component reference
- increasing agent definition autonomy
- broadening agent definition context, memory, permission, capability, or extension references
- changing a pinned model reference
- changing a floating model alias policy
- changing provider preference precedence, provider selection constraints, fallback eligibility, or provider selection explainability expectations
- changing the provider feature vocabulary, feature meaning, or separation from action capabilities
- broadening provider eligibility, training use, or tool use in a model profile
- changing a prompt revision used by an active agent definition
- changing safety prompt material
- changing required prompt variables used by runtime assembly
- lowering prompt classification incorrectly
- disclosing sensitive prompt text in public manifests
- changing retrieval source sets used by an active agent definition
- changing retrieval index or corpus versions
- changing chunking or retriever strategy
- disabling required citations
- allowing stale context where it was previously prohibited
- broadening retrieval classification or cross-scope reuse
- changing memory retention, visibility, sensitivity, allowed consumers, allowed writers, or promotion paths
- changing actor kind, identity resolution mode, agent bridge, operator, representative, or integration relationship
- removing deprecated AgentSet behavior fields before the compatibility window ends
- changing stable AgentSet identity fields or treating deprecated fields as grants
- changing network defaults, rule effects, actor or purpose scope, destination selectors, transport constraints, approval requirements, or audit semantics
- changing human override authority eligibility, operation meaning, fail-closed response, resume requirements, or audit semantics
- changing event envelope identity, actor, subject, correlation, causation, payload, audit, or redaction semantics
- changing audit storage authority, redaction timing, ordering scope, retention, deletion, access, integrity, durability, or failure behavior
- changing CLI command effect budgets, offline behavior, runtime-preflight separation, extension loading, shared-library initialization, or conformance claim boundaries
- changing discovery root containment, source-hint cardinality, document cardinality, or workflow identity rules
- changing MCP or A2A external ownership, identity binding, task correlation, artifact import, callback, or transitive-authority rules
- changing reference CLI command names, exit code meanings, diagnostic code meanings, or machine-readable output formats
- removing fields
- changing required fields
- changing event payload structure

The [Diagnostic Code Catalog](diagnostic-code-catalog.md) records current code
status and compatibility rules. No code is Stable yet. Once stable, changing a
code's condition, default severity, required structured details, or remediation
safety may break validator, editor, CI, and `NF-CLI` consumers even when
manifest schemas remain unchanged. Message-only clarification is normally
compatible when machine meaning does not change.

## Actor Model Compatibility

`ActorSet` is optional in the current `0.1` draft. Its presence explicitly
selects ActorSet mode for that project assembly; its absence preserves legacy
participant resolution through project maintainers and `AgentSet`.

This additive compatibility window keeps existing projects valid while making
the migrated mode fail closed. A participant omitted from an authored
`ActorSet` cannot be recovered silently from a same-named legacy declaration.

Requiring `ActorSet`, removing legacy fallback, changing actor kind, or requiring
typed objects in existing participant fields would be breaking. See
[Actor Model Migration](actor-model-migration.md).

## Agent Identity Compatibility

The compact AgentSet shape requires only stable AI identity metadata. Legacy
behavior and access fields remain schema-valid but deprecated, so existing
`0.1` projects continue to validate while the Minimal Team demonstrates the
migrated form.

Removing those fields from the schema, rejecting legacy mixed AgentSet projects,
or giving deprecated fields new grant semantics would be breaking. See
[Agent Identity Migration](agent-identity-migration.md).

## Agent Definition Authority Compatibility

The current `0.1` draft selects the unique unscoped active definition for an
agent as the authoritative source of requested behavior. Draft-only projects
remain schema-valid and reviewable, but they do not produce a normal selected
configuration.

An active definition must contain complete component lists, change and
compatibility metadata, approved review data, activation criteria, and enabled
audit expectations. Earlier unreleased `0.1` snapshots with incomplete active
definitions must complete those fields before validation.

Changing active selection, activating a second definition for the same agent,
inferring selection from version order, or treating deprecated AgentSet
behavior fields as merge inputs would change `NF-SEMANTIC`, safety, audit, and
future runtime compatibility. See
[Effective Agent Configuration](effective-agent-configuration.md).

## Agent Assembly View Compatibility

Agent Assembly is currently a documentation-defined inspection projection of
Effective Agent Configuration. It is not an authored manifest, has no JSON
Schema, and is not emitted by repository tooling.

A future standardized machine-readable view must preserve source authority,
provenance, blockers, redaction, and deterministic ordering. Changes to its
fields, state meanings, or diagnostic codes may affect `NF-CLI` and
`NF-SEMANTIC`, but do not by themselves change manifest `specVersion`.

## Semantic Reference Compatibility

The [Semantic Reference Inventory](semantic-reference-inventory.md) records
accepted target namespaces, implementation priority, current smoke coverage,
known gaps, and deferred ambiguous fields.

Changing a reference target kind, scope, exact-match rule, ambiguity behavior,
or grant boundary may break `NF-SEMANTIC` validators even when the source field
remains schema-valid. A validator must not infer compatibility by searching
every namespace for the same scalar ID.

## Typed Reference Compatibility

The shared typed-reference primitives are additive in the unreleased `0.1`
draft. Existing scalar reference fields retain their current syntax unless
their field-specific migration contract says otherwise.

Adding an optional typed form alongside a deterministic scalar form may preserve
`NF-MANIFEST` compatibility. Requiring an object where a scalar was accepted,
changing an allowed target kind or scope, removing a transitional scalar form,
or changing strict kind-specific semantics may break `NF-MANIFEST`,
`NF-SCHEMA`, and `NF-SEMANTIC` consumers.

See [Typed References](typed-references.md) for the current shared shapes and
migration rules.

## Approval Gate Target Compatibility

Approval gate `targets` is an additive strict typed field in the unreleased
`0.1` draft. It closes the accepted target kinds, prohibits scope for
assembly-scoped resources, and requires explicit workflow scope for stages and
steps.

Deprecated scalar `appliesTo` remains structurally valid for migration, cannot
coexist with `targets`, and is not semantically resolved. Removing it, changing
the accepted kind set, changing workflow scope, or adding cross-kind fallback may
break `NF-MANIFEST`, `NF-SCHEMA`, and `NF-SEMANTIC` consumers.

See [Approval Gate Targets](approval-gate-targets.md).

## Work Reference Namespace Compatibility

Workflow step IDs are unique across all stages in one workflow. Task artifact
IDs are unique across the logical manifest assembly, and handoffs use exact
unqualified artifact IDs. These rules clarify existing `0.1` scalar fields
without changing their authored shape.

Changing steps to stage-scoped identity, artifacts to task-scoped identity,
allowing implicit cross-workflow lookup, or selecting duplicate declarations by
file or array order would break `NF-SEMANTIC` compatibility. Requiring explicit
typed objects in these fields would also affect `NF-MANIFEST` and `NF-SCHEMA`.

See [Work Reference Namespaces](work-reference-namespaces.md).

## Manifest Discovery Compatibility

`Project.manifests.workflows` is additive in the unreleased `0.1` draft. The
singular `Project.manifests.workflow` source hint remains valid for projects
that adopt one Workflow document; the singular and plural forms cannot coexist
in one Project manifest.

The focused discovery contract treats source order as non-semantic, requires
exactly one Project document, retains each Workflow by unique `workflow.id`,
and keeps workflow stage and step namespaces local to that Workflow. Changing
root containment, supported source forms, singleton cardinality, workflow ID
uniqueness, or source precedence may break `NF-SEMANTIC` consumers even when
individual documents remain schema-valid.

See [Manifest Discovery](manifest-discovery.md).

## Provider Feature Compatibility

Provider `features` is additive inside the unreleased `specVersion: "0.1"`
draft. It uses a closed model support vocabulary that is independent from
`CapabilitySet` action identifiers.

Legacy provider `capabilities` remains structurally valid for migration, cannot
coexist with `features`, and must not resolve against project action
capabilities. Maintained examples use `features`.

Removing the legacy field, adding or removing a core feature, changing feature
meaning, or treating feature support as permission affects schema, semantic,
provider-selection, and safety compatibility.

See [Provider Features](provider-features.md).

## Provider Adapter Compatibility

Provider selection and provider invocation are separate. A future adapter must
not replace the selected target, relax constraints through provider defaults,
execute tools, or perform fallback without returning control to the runtime
host.

Adapter identity, request translation, material defaults, actual-model
detection, tool and streaming mappings, retry and fallback signaling, error and
usage normalization, credential and network scope, remote session behavior,
audit, and redaction may change behavior even when manifests do not. Such
changes may break `NF-RUNTIME`, privacy, safety, cost, and audit compatibility.
See [Provider Adapter Boundary](provider-adapter-boundary.md).

## Event And Audit Storage Compatibility

Event declarations, event instances, audit records, evidence, projections,
delivery records, and storage receipts remain separate. A future store may
support a runtime's audit retention and completeness claim, but it must not
become permission, approval, workflow, memory, or human-override authority.

Changing designated-store roles, event identity, duplicate handling,
redaction timing, timestamp or sequence interpretation, audit-before-effect,
durability, buffering, gaps, retention, deletion, access, integrity,
correction, or telemetry authority may change runtime and audit behavior even
when manifests do not. Such changes may break `NF-RUNTIME`, privacy, safety,
traceability, and interoperability compatibility. See
[Event And Audit Storage Boundary](event-audit-storage-boundary.md).

## Human Override Compatibility

The structured human override policy is optional and additive in `0.1`.
Declaring it requires ActorSet-based human authority resolution and enables no
runtime behavior by itself.

Making it required, allowing non-human-controlled authorities, enabling
automatic resume, weakening `remain_blocked`, or changing operation meaning
would be breaking. See [Human Override](human-override.md).

## Extension Compatibility

Extensions MUST declare a namespace and lifecycle state. A runtime that does not understand an extension SHOULD preserve it when possible and MUST NOT treat it as granting additional permission.

[RFC-0006](../rfcs/RFC-0006-extension-namespaces.md) proposes namespace ownership, lifecycle transition, registry, and compatibility expectations for extensions.

The [Extension Loading Boundary](extension-loading-boundary.md) separates
declaration discovery, implementation discovery, exact resolution, verification,
enablement, loading, activation, and per-operation authorization. Changing
ambient discovery defaults, implementation precedence, integrity requirements,
host interfaces, isolation, partial-support behavior, lifecycle rejection, or
authorization order may break `NF-EXTENSION` and `NF-RUNTIME` consumers without
changing the `ExtensionSet` schema.

## MCP And A2A Compatibility

The `io.nexflow.mcp` and `io.nexflow.a2a` profiles version their policy mapping
independently from manifest `specVersion`. External MCP and A2A protocol
versions and bindings are governed independently and must be named in an
implementation's conformance evidence.

Changing an externally owned surface into local authority, automatically
creating a local Actor or capability, merging external and NexFlow task IDs,
importing remote artifacts without provenance, treating messages as Handoffs,
or allowing callbacks without policy is safety-significant and may break
`NF-EXTENSION`, `NF-SEMANTIC`, or `NF-RUNTIME` consumers.

See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## CLI And Runtime Boundary Compatibility

The initial reference CLI remains validation-only even when it shares pure
specification libraries, a repository, language, binary, or release with a
future runtime. Runtime preflight, credentials, network clients, executable
extensions, providers, context and memory backends, audit stores, schedulers,
and effect handlers must not initialize for validation commands.

Changing command effect budgets, discovery, local writes, overwrite defaults,
offline posture, process or plugin access, unresolved runtime-fact handling,
shared-library dependency direction, or the separation of `NF-CLI` and
`NF-RUNTIME` claims may break CI, editor, safety, privacy, and tooling
compatibility. See
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md).

## Runtime Compatibility

Future runtimes should publish:

- supported spec versions
- supported manifest kinds
- supported extension namespaces
- validation behavior
- enforcement limitations

See [Conformance](conformance.md) for draft vocabulary and
[Conformance Claims](conformance-claims.md) for the standalone versioned schema
and publication templates.

A published claim applies only to its named subject version, spec versions,
manifest kinds, extension namespaces, evidence, and limitations. Consumers must
not infer support for omitted or `not-evaluated` surfaces. Claim format
compatibility is versioned through `claimVersion`, independently from manifest
`specVersion`.

[RFC-0007](../rfcs/RFC-0007-approval-gates.md) proposes approval semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility when approval meaning changes.

[RFC-0008](../rfcs/RFC-0008-memory-retention.md) proposes memory retention semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, privacy, audit, and safety compatibility.

[RFC-0009](../rfcs/RFC-0009-event-envelope.md) proposes event envelope
semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, traceability,
privacy, and safety compatibility. The
[Event Interoperability](event-interoperability.md) profiles version CloudEvents
and OpenTelemetry projections separately from transport and storage. The
[Event And Audit Storage Boundary](event-audit-storage-boundary.md) versions
future persistence behavior separately from both manifest and mapping profiles.

[RFC-0010](../rfcs/RFC-0010-provider-selection.md) proposes provider selection semantics that may affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, privacy, cost, safety, and compatibility.

[RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) proposes validation-only reference CLI scope that may affect `NF-CLI`, `NF-SCHEMA`, `NF-SEMANTIC`, diagnostics, and developer workflow compatibility.

## Conformance Impact

Compatibility notes should identify which conformance levels are affected when possible.

Examples:

| Change | Likely Impact |
| --- | --- |
| Add optional schema field | May preserve `NF-SCHEMA`; may require docs and examples updates. |
| Rename required manifest field | Breaks `NF-MANIFEST` and `NF-SCHEMA`. |
| Change approval gate meaning | May break `NF-RUNTIME` safety expectations. |
| Change memory retention, visibility, sensitivity, consumers, writers, or promotion paths | May affect `NF-SEMANTIC`, `NF-RUNTIME`, privacy, audit, and safety compatibility. |
| Add, remove, or reinterpret an AgentDefinition memory selector | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, memory authority, migration, privacy, and safety compatibility. |
| Change Core Profile slots, participant precedence, module qualifiers, omission semantics, or dependency closure | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, conformance claims, migration, and safety compatibility. |
| Change actor kind, identity mode, agent bridge, operator, representative, or integration relationship | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, `NF-RUNTIME`, authority, and audit compatibility. |
| Remove deprecated AgentSet behavior fields or change stable identity meaning | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, migration, and future effective configuration. |
| Change unique active-definition selection or active completeness requirements | May affect `NF-SCHEMA`, `NF-SEMANTIC`, safety, migration, audit, and future runtime compatibility. |
| Change a standardized Agent Assembly field, state, ordering rule, or diagnostic code | May affect `NF-CLI`, `NF-SEMANTIC`, inspection consumers, and audit tooling without changing manifest shape. |
| Require, remove, or reinterpret a typed-reference form, target kind, or scope | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, migration tooling, and future runtime binding. |
| Change approval gate target kinds, workflow scope, legacy coexistence, or exact resolution | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, approval coverage, safety, and migration. |
| Change workflow step or task artifact uniqueness scope or fallback behavior | May affect `NF-SEMANTIC`, graph tooling, handoff evidence resolution, migration, and future runtime binding. |
| Change discovery root, source ordering, document cardinality, or multiple-workflow identity rules | May affect `NF-SCHEMA`, `NF-SEMANTIC`, validation tooling, migration, and future runtime loading. |
| Change network defaults, destination scope, transport constraints, approvals, or audit semantics | May affect `NF-SEMANTIC`, `NF-RUNTIME`, integrations, privacy, audit, and safety compatibility. |
| Change credential defaults, references, kinds, target scope, exposure controls, lease, approval, failure, or audit semantics | May affect `NF-SCHEMA`, `NF-SEMANTIC`, `NF-RUNTIME`, authentication, privacy, audit, and safety compatibility. |
| Change human override authority, response, resume, operation, or audit semantics | May affect `NF-SCHEMA`, `NF-SEMANTIC`, `NF-RUNTIME`, safety, authority, and audit compatibility. |
| Change event envelope identity, actor, subject, correlation, causation, payload, audit, or redaction semantics | May affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, traceability, privacy, and safety compatibility. |
| Change audit store roles, redaction timing, ordering scope, duplicate handling, pre-effect persistence, retention, deletion, access, integrity, durability, gaps, or recovery | May affect `NF-RUNTIME`, audit completeness, traceability, privacy, safety, and interoperability compatibility. |
| Change interoperable event names, CloudEvents attributes, OpenTelemetry fields, severity mapping, trace-context separation, or import authority | May affect event exporters, telemetry queries, round-trip behavior, `NF-RUNTIME`, audit, privacy, and external compatibility claims. |
| Change provider selection precedence, constraints, fallback, or explainability expectations | May affect `NF-SEMANTIC`, `NF-RUNTIME`, audit, privacy, cost, safety, and compatibility. |
| Change provider constraint vocabulary, composition, unknown-fact behavior, or legacy migration | May affect `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`, provider eligibility, privacy, cost, audit, and safety compatibility. |
| Change provider adapter selection, request mapping, defaults, retries, fallback signaling, error normalization, credential or network scope, audit, or redaction | May affect `NF-RUNTIME`, provider behavior, privacy, cost, reproducibility, audit, and safety compatibility. |
| Change CLI command effects, offline guarantees, discovery or write boundaries, runtime-preflight separation, executable extension handling, shared-library initialization, or claim separation | May affect `NF-CLI`, `NF-RUNTIME`, CI, editors, developer safety, privacy, and compatibility. |
| Change reference CLI command names, exit codes, diagnostic codes, or output formats | May affect `NF-CLI`, CI workflows, editor integrations, and developer tooling compatibility. |
| Add semantic cross-reference rule | May affect `NF-SEMANTIC` validators. |
| Change extension namespace lifecycle | May affect `NF-EXTENSION` compatibility. |
| Change extension discovery, implementation resolution, integrity, isolation, activation, or unsupported-behavior rules | May affect `NF-EXTENSION`, `NF-RUNTIME`, supply-chain, authority, audit, and safety compatibility. |
| Change the MCP profile surface class, allow-list, approval, network, credential, failure, or protocol-claim boundary | May affect `NF-SCHEMA`, `NF-SEMANTIC`, `NF-EXTENSION`, `NF-RUNTIME`, integration safety, privacy, and audit compatibility. |
| Change the A2A profile identity, task, artifact, permission, callback, credential, audit, or failure boundary | May affect `NF-SEMANTIC`, `NF-EXTENSION`, `NF-RUNTIME`, identity safety, provenance, privacy, and audit compatibility. |
| Change active agent definition components or autonomy | May affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility. |
| Change model profile selection or constraints | May affect `NF-SEMANTIC`, `NF-RUNTIME`, and audit compatibility. |
| Change prompt set revisions or safety review status | May affect `NF-SEMANTIC`, `NF-RUNTIME`, safety, and audit compatibility. |
| Change retrieval sources, index versions, freshness, or citation rules | May affect `NF-SEMANTIC`, `NF-RUNTIME`, context safety, and audit compatibility. |

## Compatibility Promise

Until `1.0`, NexFlow prioritizes learning and correctness over strict stability. Breaking changes are allowed with documentation and migration guidance.
