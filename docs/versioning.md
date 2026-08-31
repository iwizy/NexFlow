# Versioning

Every NexFlow manifest MUST include `specVersion`.

```yaml
specVersion: "0.1"
```

## Version Format

NexFlow uses semantic versioning for stable releases:

- `MAJOR`: incompatible specification changes
- `MINOR`: backward-compatible feature additions
- `PATCH`: clarifications and compatible fixes

Draft versions may use `0.x` until the specification stabilizes.

For public release readiness criteria across `0.1` through `1.0`, see the [Release Plan](release-plan.md).

For the currently tested pairing of spec version, schemas, examples, validators, CLI, runtime, and extensions, see the [Compatibility Matrix](compatibility-matrix.md).

For the exact feature boundary under candidate review, see the
[0.1 Candidate Scope](0.1-scope.md).

## Manifest Versioning

All manifests in one project SHOULD use the same `specVersion`.

A future runtime MAY support mixed versions during migration, but it MUST make compatibility behavior explicit.

## 0.1 Scope Freeze Version Decision

Freezing the `0.1` candidate scope does not change manifest `specVersion`. The
freeze selects the current 17-kind draft authoring and repository-validation
boundary for candidate review; it does not add fields, stabilize runtime
behavior, accept every draft RFC, or publish a release.

Corrections that remain inside the frozen boundary may keep
`specVersion: "0.1"`. Adding a manifest kind, adding a required top-level field,
promoting an optional or experimental surface, changing authority or safety
defaults, or relying on deferred behavior requires an explicit scope and
version compatibility decision. Candidate evidence must then be regenerated
for the new exact commit.

## Core Profile Version Decision

The Core Profile and optional `Project.manifests` source hints remain in
`specVersion: "0.1"`. This is a compatibility-widening change inside the
unreleased draft: complete Project path maps remain valid, while reduced
projects no longer need placeholder paths for unadopted modules.

Changing required profile slots, participant authority precedence, omission
semantics, or dependency closure may be breaking. Discovery and multiple
Workflow compatibility are recorded separately below. See
[Core Profile](core-profile.md).

## Manifest Discovery Version Decision

The explicit local discovery slice and plural `Project.manifests.workflows`
source hint remain in `specVersion: "0.1"`. Existing projects using the singular
`workflow` hint remain valid; projects may replace it with a non-empty unique
list when they adopt multiple Workflow documents. The singular and plural forms
cannot coexist.

This is an additive change inside the unreleased draft. It defines validation
inventory behavior only and does not select, schedule, execute, or merge
workflows.

Removing the singular hint, changing Workflow identity or cardinality, allowing
multiple documents for another current singleton kind, stabilizing diagnostics,
adding directory or bundle discovery, or enabling cross-workflow dependencies
requires an explicit compatibility and version decision. See
[Manifest Discovery](manifest-discovery.md).

## Conformance Claim Versioning

Conformance claims use `claimVersion`, which is independent from manifest
`specVersion` and the evaluated subject's release version.

The initial standalone claim format is:

```yaml
claimVersion: "0.1"
kind: NexFlowConformanceClaim
```

Changing claim status vocabulary, required scope, required conformance levels,
evidence rules, or attestation meaning requires a claim-format compatibility
decision. Breaking changes require a new `claimVersion` and migration guidance.

The current unreleased `claimVersion: "0.1"` draft requires an explicit
`scope.profiles` list. Earlier draft claims should add evaluated Core Profile
qualifiers or an empty list. No published claim format is being migrated.

Publishing a claim, changing a subject's conformance status, or updating evidence
does not by itself change manifest `specVersion`. See
[Conformance Claims](conformance-claims.md).

## Candidate Readiness Record Versioning

Candidate readiness records use `recordVersion`, independently from manifest
`specVersion`, conformance `claimVersion`, and the proposed release tag.

The initial standalone record format is:

```yaml
recordVersion: "0.1"
kind: NexFlowCandidateReadiness
```

Changing the required gate registry, gate status vocabulary, ready-state
guards, blocker meaning, or evidence shape requires a record-format
compatibility decision. A breaking format change requires a new
`recordVersion` and migration guidance.

Completing a readiness record or approving a candidate does not by itself
change manifest `specVersion`. The candidate commit determines the exact schema,
example, documentation, and validation snapshot under review. See the
[0.1 Readiness Checklist](readiness-checklist.md).

## Actor Model Version Decision

The first `ActorSet` schema and typed-reference primitives remain in
`specVersion: "0.1"`. This is an additive draft change: existing manifests remain
valid, and participant resolution changes only when a project explicitly
declares an `ActorSet`.

Projects with `ActorSet` use it as the authoritative participant namespace.
Projects without it retain legacy maintainer and `AgentSet` participant
resolution during the migration window.

A later explicit version decision is required before making `ActorSet`
mandatory, rejecting legacy human entries in `AgentSet`, removing fallback, or
requiring typed objects in existing participant fields. See
[Actor Model Migration](actor-model-migration.md).

The shared typed-reference shapes and lexical boundaries are documented in
[Typed References](typed-references.md). Requiring typed objects in an existing
scalar field, changing its allowed target kinds or scope, or removing a
transitional scalar form requires an explicit compatibility and version
decision.

## Approval Gate Target Version Decision

Typed approval gate `targets` remains in `specVersion: "0.1"`. It is additive
inside the unreleased draft. Maintained examples use the new typed form, while
deprecated scalar `appliesTo` remains schema-valid only for migration and cannot
coexist with `targets`.

Removing `appliesTo`, changing the accepted target kinds, changing workflow
scope, or allowing implicit cross-kind resolution requires an explicit
compatibility and version decision. See
[Approval Gate Targets](approval-gate-targets.md).

## Work Reference Namespace Version Decision

Workflow-wide step identity and assembly-wide task artifact identity remain in
`specVersion: "0.1"`. This clarifies the documented scope of current scalar
dependency and handoff references without changing their authored shape.

Changing steps to stage-scoped identity, artifacts to task-scoped identity,
allowing implicit cross-workflow lookup, or requiring typed objects in these
fields requires an explicit compatibility and version decision. See
[Work Reference Namespaces](work-reference-namespaces.md).

## Provider Feature Version Decision

Provider `features` remains in `specVersion: "0.1"`. It is additive inside the
unreleased draft, while legacy provider `capabilities` remains schema-valid only
for migration and cannot coexist with `features`.

Removing the legacy field, changing the closed core feature vocabulary, changing
a feature meaning, or coupling provider features to action capability grants
requires an explicit compatibility and version decision. See
[Provider Features](provider-features.md).

## Provider Constraint Version Decision

The structured provider constraint vocabulary remains in
`specVersion: "0.1"`. It tightens an open object inside the unreleased draft,
migrates maintained examples to explicit enum values, and keeps deprecated
`allowTrainingUse` readable without allowing it to coexist with `trainingUse`.

Early manifests should map `allowTrainingUse: false` to
`trainingUse: prohibited`. A true legacy value requires policy review before it
is mapped to `allowed`, `requires_approval`, or `unspecified`.

Removing the legacy field, changing a constraint meaning, changing composition
or unknown-fact behavior, or making a field required needs an explicit later
version decision. See [Provider Constraints](provider-constraints.md).

## Provider Adapter Version Decision

The [Provider Adapter Boundary](provider-adapter-boundary.md) adds no manifest
fields and does not change `specVersion`. Adapter versions, provider API
versions, host-interface versions, and runtime support claims are separate from
manifest versioning.

Changing request translation, material defaults, actual-model detection, tool
or streaming mapping, retry and fallback behavior, error or usage
normalization, credential or network scope, remote session reuse, audit, or
redaction may require an adapter and runtime compatibility decision even when
the manifests remain unchanged.

## MCP Extension Draft Version Decision

The `io.nexflow.mcp` profile and stricter MCP context shape remain in
`specVersion: "0.1"` while RFC-0018 is Draft. The profile has its own
`profileVersion: "0.1-draft"` because external extension compatibility must not
be inferred only from the core manifest version.

Earlier MCP sources should add `mcp.serverId`, a non-empty `mcp.exposes`
inventory, and, for tools or actions, a non-empty allow-list plus explicit
approval posture. Changing surface authority, protocol compatibility claims,
or failure policy requires explicit compatibility review. See the
[MCP Extension Draft](../extensions/mcp/README.md).

## A2A Extension Draft Version Decision

The `io.nexflow.a2a` profile and MCP/A2A ownership map remain in
`specVersion: "0.1"` while RFC-0019 is Draft. The profile uses its own
`profileVersion: "0.1-draft"`; external A2A protocol versions and bindings are
declared separately by implementations in conformance evidence.

The profile adds no core manifest kind and does not require existing projects
to adopt A2A. Remote identifiers remain integration-scoped and opaque. Agent
Cards, skills, messages, tasks, context IDs, and artifacts do not become local
identity, capabilities, Handoffs, TaskSet entries, Context Sources, Memory
Scopes, or artifacts automatically.

Changing identity binding, task correlation, artifact provenance, inbound
callback policy, credential handling, external ownership, or fail-closed
behavior requires explicit compatibility review. See the
[A2A Extension Draft](../extensions/a2a/README.md) and
[MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Event Interoperability Version Decision

The CloudEvents and OpenTelemetry mappings remain documentation-level draft
profiles within `specVersion: "0.1"`:

- `nexflow-cloudevents/0.1-draft`
- `nexflow-opentelemetry/0.1-draft`

They add no manifest kind or required `EventSet` field. CloudEvents versions,
OpenTelemetry specification and semantic convention versions, adapter versions,
and mapping directions must be declared separately in conformance evidence.

Changing interoperable event names, projected fields, CloudEvents extension
attributes, OpenTelemetry attribute names, severity normalization,
trace-context separation, or import authority requires explicit compatibility
review and migration guidance. Transport bindings, SDKs, OTLP, collectors,
brokers, sinks, and storage remain implementation concerns and do not inherit
compatibility from the mapping profile.

See [Event Interoperability](event-interoperability.md).

## Event And Audit Storage Version Decision

The [Event And Audit Storage Boundary](event-audit-storage-boundary.md) adds no
manifest kind or required `EventSet` field and does not change `specVersion`.
Audit store, persistence adapter, policy, projection, evidence-store, and
runtime versions remain separate implementation compatibility dimensions.

Changing designated store roles, event identity, duplicate or collision
handling, redaction timing, timestamp or sequence meaning, audit-before-effect,
durability, buffering, retention, deletion, access, integrity, correction,
gap, recovery, or telemetry authority requires explicit runtime compatibility
review even when manifests and event mapping profiles remain unchanged.

## CLI And Runtime Boundary Version Decision

The [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md) adds no
manifest field and does not change `specVersion`. CLI artifacts, commands,
diagnostic catalogs, output formats, static validation profiles, runtime
artifacts, and runtime interfaces require independent versioning and support
claims.

Changing a command's effect budget, offline guarantee, discovery or write
boundary, runtime-preflight separation, executable extension behavior,
shared-library initialization, unresolved-fact meaning, or `NF-CLI` and
`NF-RUNTIME` claim separation requires explicit compatibility review even when
accepted manifests remain unchanged.

## Agent Identity Version Decision

The compact AgentSet migration remains in `specVersion: "0.1"`. The schema
removes behavior-specific fields from the required set while continuing to
validate those fields as deprecated compatibility data.

This is a widening structural change: existing manifests remain valid, and
migrated projects can remove duplicated behavior fields without changing
stable agent IDs.

A later version decision is required before removing deprecated fields,
rejecting legacy mixed AgentSet entries, or adding new required standing
constraints. See [Agent Identity Migration](agent-identity-migration.md).

## Agent Definition Authority Version Decision

The unique unscoped active-definition authority rule remains in
`specVersion: "0.1"`. It is included in `v0.1.0`, so subsequent changes to
the candidate contract require explicit compatibility review and synchronized
migration guidance even though the specification remains pre-`1.0`.

Projects with only draft definitions remain valid. Earlier unreleased `0.1`
snapshots with incomplete active definitions must add complete component lists,
change and compatibility metadata, approved review data, activation criteria,
and required audit settings. Normal selection requires exactly one active
definition for the agent and never uses version or file order.

A later explicit version decision is required before adding scoped binding,
allowing multiple simultaneously active releases, removing deprecated AgentSet
fields, or changing the authority boundary. See
[Effective Agent Configuration](effective-agent-configuration.md).

## Human Override Version Decision

The optional structured human override policy remains in
`specVersion: "0.1"`. It is an additive project policy and does not claim runtime
enforcement.

Making the policy mandatory, broadening eligible authority kinds, allowing
automatic resume, weakening fail-closed response, or changing operation
semantics requires an explicit version and migration decision. See
[Human Override](human-override.md).

## Agent Definition Versioning

Manifest `specVersion` describes the shape of a NexFlow manifest. It does not fully describe the behavioral version of an individual agent.

[RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md) proposes a draft model for versioned agent definitions that reference model profiles, prompt sets, retrieval profiles, permission sets, memory policies, autonomy levels, and extensions.

[Agent Definitions](agent-definitions.md) define draft `agent-definitions.yaml` vocabulary for practical examples and schema validation.

Agent definitions can include:

- agent identity references
- definition versions
- lifecycle status
- model profile references
- prompt set references
- retrieval profile references
- permission and capability references
- context source references
- memory scopes
- autonomy level
- extension references
- review and activation criteria
- audit expectations

Agent definition versioning remains draft vocabulary. The unique-active
authority slice is implemented for specification and validation, but it is not
a stable runtime contract and does not execute agents.

## Agent Assembly Views

[Agent Assembly](agent-assembly.md) is the derived inspection projection of an
Effective Agent Configuration. It has no independently authored version and is
not a manifest.

An illustrative view may report `sourceSpecVersion` to identify the manifest
semantics used for derivation. Definition and component versions remain
separate and should be preserved in the projection.

Keep `specVersion` unchanged when a change:

- clarifies draft documentation
- refines the non-normative illustrative view without changing manifest meaning
- improves authority, provenance, blocker, redaction, or review guidance

Re-evaluate `specVersion` when a change:

- changes required fields
- removes or renames fields
- changes schema compatibility
- changes normative semantics for permissions, approval gates, memory, context, provider selection, or runtime behavior
- introduces accepted breaking changes through the RFC process

A future standardized Agent Assembly serialization needs its own output
compatibility decision. Changing its fields, state meanings, ordering, or
diagnostic codes may affect `NF-CLI` and `NF-SEMANTIC` without changing authored
manifest compatibility.

For the current draft, Agent Assembly remains documentation for
`specVersion: "0.1"` and is not a stable machine-readable or runtime contract.

## Diagnostic Output Versioning

The [Diagnostic Code Catalog](diagnostic-code-catalog.md) records draft output
vocabulary for validators and future CLIs. Diagnostic codes are tool output,
not authored manifest fields, so adding or clarifying a draft code does not by
itself require a manifest `specVersion` change.

The [repository CLI JSON envelope](cli-diagnostics.md) now carries its own
experimental `formatVersion: "0.2-draft"`, separate from the prototype's
`unreleased` tool version, supported input `specVersion: "0.1"`, and specification
release tags. Pin the repository revision as well as the output version.
Incompatible envelope, exit, stream, state, ordering, or redaction changes
require a new output version and migration notes; this does not automatically
advance authored manifest versions or README specification-release badges.

The advance from `0.1-draft` to `0.2-draft` introduces successful declared-only
`inspect` and its result shape, which the previous closed schema rejected.
All commands now emit the new version; consumers must migrate their accepted
version and output schema together. See the [migration notes](cli-diagnostics.md#migration-from-01-draft-to-02-draft).

No diagnostic code is Stable yet. A future stable catalog or CLI contract must
version code meaning, default severity, required structured details, and output
format separately from manifest `specVersion`. Renaming, merging, splitting,
removing, or materially reclassifying a stable code requires deprecation and
migration guidance. If the diagnostic changes because authored manifest
semantics changed, the underlying specification version must also be reviewed.

## Model Profile Versioning

Model profiles describe provider-neutral model selection expectations. A model profile can be behavior-changing even when the agent identity and manifest `specVersion` stay the same.

[Model Profiles](model-profiles.md) define draft vocabulary for:

- pinned model references
- floating aliases
- policy-based selection
- fallback behavior
- model constraints
- audit expectations
- review triggers

Changing a pinned model reference, changing a floating alias policy, broadening provider eligibility, allowing training use, or broadening tool use SHOULD be treated as behavior-significant and may require review.

## Prompt Set Versioning

Prompt sets describe versioned prompt material. A prompt set can be behavior-changing even when the agent identity and manifest `specVersion` stay the same.

[Prompt Sets](prompt-sets.md) define draft vocabulary for:

- prompt set identifiers
- prompt revisions
- prompt source references
- optional content digests
- prompt ownership
- safety review status
- compatibility impact
- audit expectations

Changing prompt revisions used by an active agent definition, changing safety prompts, changing required variables, broadening tool-use guidance, or disclosing sensitive prompt text SHOULD be treated as behavior-significant and may require review.

Prompt set versions should be recorded separately from `specVersion`. `specVersion` describes the manifest shape; prompt set `version` describes a behavioral release of prompt material.

## Retrieval Profile Versioning

Retrieval profiles describe how declared context should be selected, indexed, assembled, cited, and audited. A retrieval profile can be behavior-changing even when the agent identity and manifest `specVersion` stay the same.

[Retrieval Profiles](retrieval-profiles.md) define draft vocabulary for:

- context source references
- included and excluded sources
- index or corpus versions
- chunking policy
- retriever strategy
- freshness expectations
- citation requirements
- sensitivity and redaction expectations
- audit expectations
- review triggers

Changing source sets, index versions, chunking policy, retriever strategy, freshness rules, citation requirements, or maximum classification SHOULD be treated as behavior-significant and may require review.

Retrieval profile versions should be recorded separately from `specVersion`. `specVersion` describes the manifest shape; retrieval profile `version` describes a behavioral release of retrieval expectations.

## Migration Policy

Breaking changes require:

- an RFC
- migration guidance
- example updates
- schema updates
- changelog entry

Migration guides should explain:

- old field or behavior
- new field or behavior
- compatibility impact
- suggested automated migration if possible

## Stability Expectations

Version `0.1` is a draft. Names, fields, and schemas may change before `1.0`.

The project should avoid churn unless it materially improves clarity, safety, or interoperability.
