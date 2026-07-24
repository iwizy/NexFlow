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

## Manifest Versioning

All manifests in one project SHOULD use the same `specVersion`.

A future runtime MAY support mixed versions during migration, but it MUST make compatibility behavior explicit.

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

Until the RFC is accepted, agent definition versioning remains draft vocabulary. Projects should avoid treating draft agent definition fields as stable runtime requirements.

## Agent Assembly Checkpoints

[Agent Assembly](agent-assembly.md) describes the cross-manifest relationship and review checkpoint connecting an agent identity, an agent definition, model profiles, prompt sets, retrieval profiles, permissions, context, memory, autonomy, and extensions.

Agent assembly checkpoints may be useful for project planning, releases, changelog entries, and review summaries, but they do not automatically require a manifest `specVersion` bump.

Keep `specVersion` unchanged when a change:

- clarifies draft documentation
- adds examples that remain compatible with the current schema
- adds new draft vocabulary without changing existing manifest meaning
- improves cross-links, review checklists, or audit guidance

Re-evaluate `specVersion` when a change:

- changes required fields
- removes or renames fields
- changes schema compatibility
- changes normative semantics for permissions, approval gates, memory, context, provider selection, or runtime behavior
- introduces accepted breaking changes through the RFC process

For the current draft, agent assembly remains part of `specVersion: "0.1"` and is not a separate stable runtime contract.

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
