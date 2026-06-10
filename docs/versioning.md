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

## Manifest Versioning

All manifests in one project SHOULD use the same `specVersion`.

A future runtime MAY support mixed versions during migration, but it MUST make compatibility behavior explicit.

## Agent Definition Versioning

Manifest `specVersion` describes the shape of a NexFlow manifest. It does not fully describe the behavioral version of an individual agent.

[RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md) proposes a draft model for versioned agent definitions that reference model profiles, prompt sets, retrieval profiles, permission sets, memory policies, autonomy levels, and extensions.

Until that RFC is accepted, agent definition versioning is specified as draft vocabulary only. Projects should avoid treating proposed agent definition fields as stable schema requirements.

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
