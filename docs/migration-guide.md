# Migration Guide

This guide is the reusable starting point for planning and documenting NexFlow
migrations. It connects the compatibility and versioning rules to a reviewable
migration record that maintainers can complete for one concrete change.

This is a skeleton, not a migration announcement. It does not publish a new
manifest version, open a deprecation window, promise backward compatibility, or
provide an automatic migration command. A concrete migration must identify its
accepted decision, exact source and target revisions, affected version domain,
support window, validation evidence, and rollback boundary.

## When A Migration Record Is Required

Use a migration record when a change does any of the following:

- replaces, removes, renames, or reinterprets an authored field
- changes a default, authority rule, safety boundary, reference namespace, or
  validation outcome
- retires a deprecated compatibility form
- changes a versioned schema artifact, CLI output format, conformance record,
  extension profile, or behavioral resource contract
- requires maintained examples or downstream consumers to be rewritten
- introduces a staged cutover, support window, or rollback decision

A documentation clarification that does not change accepted shape or meaning
does not need a migration record. The change should still state why migration
is not required when its compatibility impact may be unclear.

## Classify The Change

| Class | Typical effect | Minimum migration treatment |
| --- | --- | --- |
| Clarification | Accepted shape and meaning stay unchanged. | Record that no migration is required and cite the reviewed compatibility rationale. |
| Additive opt-in | A new optional form is available; existing input stays valid and retains its meaning. | Describe adoption steps, coexistence rules, and how a consumer detects support. |
| Deprecated compatibility form | Old and replacement forms are temporarily accepted. | Define precedence or mutual exclusion, diagnostics, support window, removal gate, and rollback behavior. |
| Behavior-significant | Authored shape may stay unchanged while authority, defaults, validation, or observable output changes. | Identify affected conformance surfaces, safety review, version decision, before-and-after behavior, and rollback limits. |
| Breaking | Previously supported input or consumer behavior is rejected or changes meaning. | Use an accepted RFC or equivalent maintainer decision, a new version where required, a complete migration record, synchronized artifacts, and release notes. |

Pre-`1.0` status does not make a breaking change silent. It changes the
stability promise, not the need for an explicit decision and usable migration
path.

## Identify The Version Domain

Choose every domain affected by the change. Do not advance one identifier as a
proxy for another.

| Domain | Identifier or snapshot | Governing source |
| --- | --- | --- |
| Manifest language | `specVersion` | [Versioning](versioning.md), [Compatibility](compatibility.md) |
| Repository schemas and examples | Exact repository release, tag, or commit until a schema bundle exists | [Compatibility Matrix](compatibility-matrix.md), [Schema Bundle Publication](schema-bundle-publication.md) |
| Future schema bundle | Artifact version and `bundleFormatVersion`, separately from `specVersion` | [Schema Bundle Publication](schema-bundle-publication.md) |
| Repository CLI JSON | Experimental `formatVersion` | [CLI Machine-Readable Diagnostics](cli-diagnostics.md) |
| Conformance claim | `claimVersion` plus the evaluated subject and scope | [Conformance Claims](conformance-claims.md) |
| Candidate readiness record | `recordVersion` plus the exact candidate commit | [0.1 Readiness Checklist](readiness-checklist.md) |
| Extension profile | Profile version, namespace lifecycle, and external protocol range | [Extension Model](extensions.md), [Extension Profiles](../extensions/README.md) |
| Behavioral resource | Resource-specific version and the active definition that selects it | [Agent Definitions](agent-definitions.md), [Model Profiles](model-profiles.md), [Prompt Sets](prompt-sets.md), [Retrieval Profiles](retrieval-profiles.md) |
| Future implementation | Package, runtime, adapter, and API versions | [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md), [Provider Adapter Boundary](provider-adapter-boundary.md) |

If more than one domain changes, record the compatibility relationship between
them. For example, a CLI output-format change does not automatically change
manifest `specVersion`, and a manifest-compatible schema artifact update still
needs its own immutable artifact version after bundle publication exists.

## Required Decision Inputs

Before drafting steps, identify:

- the accepted RFC, maintainer decision, or compatibility rationale
- the exact source and target versions or immutable revisions
- affected manifests, profiles, examples, fixtures, tools, and consumers
- compatibility surfaces such as `NF-MANIFEST`, `NF-SCHEMA`, `NF-SEMANTIC`,
  `NF-CLI`, `NF-RUNTIME`, or `NF-EXTENSION`
- the old and new source of truth, including precedence during coexistence
- the start, duration, and exit criteria of any compatibility window
- diagnostics and failure behavior for old, mixed, ambiguous, or unsupported
  input
- security, authority, privacy, credential, network, audit, and human-approval
  impact
- validation evidence, rollback boundary, ownership, and support limitations

Unknown values are blockers or explicit open questions. They must not be
filled from repository order, matching names, provider state, runtime history,
or other undeclared heuristics.

## Copyable Migration Record Skeleton

Copy this structure into the owning document, RFC, or a dedicated migration
guide. Replace every placeholder and remove instructional text before treating
the record as publishable evidence.

```md
# <Migration name>

## Status And Ownership

- Status: planned | available | required | complete | withdrawn
- Owner:
- Decision or RFC:
- Source version or revision:
- Target version or revision:
- Published or effective date:
- Last reviewed date:

## Audience And Scope

- Who must migrate:
- Who is unaffected:
- Affected artifacts and consumers:
- Explicit non-goals:

## Version And Compatibility Decision

- Version domains:
- Compatibility class:
- Affected conformance surfaces:
- Compatibility window:
- Removal or completion gate:

## Before

Describe the old shape or behavior and its source of truth.

## After

Describe the replacement shape or behavior and its source of truth.

## Preconditions

List required backups, pinned revisions, supported starting states, tools,
permissions, and human approvals.

## Migration Procedure

1. Inventory the affected state.
2. Apply one deterministic change.
3. Validate before continuing.

## Validation

List exact commands, expected results, fixtures, manual reviews, and evidence
locations. Separate structural, semantic, runtime, and external checks.

## Failure And Ambiguity Handling

Define rejected inputs, mixed states, diagnostics, stop conditions, and the
human decision path. Never guess an authority-bearing rewrite.

## Rollback

State the last reversible point, restoration steps, post-rollback validation,
and effects that cannot be undone.

## Security And Authority Review

Record changes to identity, permissions, approvals, context, memory,
credentials, network access, extensions, audit, and human override.

## Automation

State whether tooling exists, its version and effect boundary, dry-run and
idempotence behavior, and cases that always require human review.

## Evidence And Known Limitations

Record exact revisions, validation output, reviewers, unresolved gaps, support
limits, and follow-up removal work.
```

## Migration Procedure

Use this sequence unless the owning migration guide defines a stricter one:

1. Pin the source project, schema, tool, profile, and external dependency
   revisions needed to reproduce the current state.
2. Inventory every affected declaration and reference before editing. Include
   deprecated fields and mixed states rather than filtering them out.
3. Confirm that the project is in a documented starting state. Stop on an
   unsupported version, duplicate identity, unresolved reference, or ambiguous
   intent.
4. Preserve a recoverable copy and record the pre-migration validation result.
   Do not place credentials, tokens, private prompts, or sensitive runtime data
   in migration evidence.
5. Apply the smallest deterministic rewrite. Preserve stable identity where the
   target contract permits it.
6. Re-run structural and focused semantic checks after each dependency-bearing
   stage rather than waiting until the end.
7. Review authority and safety separately from schema validity. A structurally
   valid migration can still broaden access or weaken approval.
8. Compare the final state with the documented target and record exact evidence.
9. Cut over only after required reviewers approve the compatibility, safety,
   and rollback evidence.
10. Retain the guide and removal criteria for as long as the old form remains
    supported or published consumers may still encounter it.

## Validation And Evidence

Evidence should match the surface being migrated.

| Layer | Typical evidence | What it does not prove |
| --- | --- | --- |
| Documentation | `npm run documentation-navigation-smoke` and reviewed before/after guidance | Correct semantics or executable behavior. |
| Syntax and schema | `npm run validate` plus the owning schema smoke check | Cross-manifest meaning, policy correctness, or runtime enforcement. |
| Semantic references | `npm run semantic-smoke` plus focused fixtures | Complete semantic conformance or live resource existence. |
| CLI contract | Owning CLI smoke check and pinned `formatVersion` | A released reference CLI or runtime support. |
| Extension profile | Profile schema, fictional fixtures, and owning extension smoke check | Live protocol, authentication, provider compatibility, or execution. |
| Runtime or external state | Accepted implementation-specific tests and reviewed operational evidence | Specification conformance outside the declared scope. |

Record the exact command, repository revision, input fixture, expected outcome,
actual result, timestamp when externally relevant, and reviewer. A passing
schema check alone is never evidence that authority, safety, runtime, or
external effects were migrated correctly.

## Safe Automation Requirements

The repository currently provides no general migration command. Any future
migration tool must:

- require explicit input and output boundaries
- identify its supported source and target versions before writing
- provide a no-write preview of intended changes
- fail closed on zero or multiple reference targets, unknown fields, mixed
  versions, and unsupported syntax
- avoid network, credential, provider, extension, and runtime access unless a
  separately reviewed contract explicitly requires it
- preserve stable IDs, ordering where meaningful, and unrelated content, or
  report unavoidable loss before writing
- avoid broadening permissions, approvals, context, memory, network access,
  extension activation, or autonomy
- use bounded, recoverable writes and report partial failure without claiming
  completion
- be deterministic and idempotent for the same input and tool revision
- emit evidence that can be reviewed without exposing secrets or local paths

Automation must not resolve ambiguity by searching every namespace, choosing
the first matching ID, consulting live provider state, or inferring authority
from names or roles.

## Rollback Boundary

A migration record must state the last reversible point. Rollback should restore
the pinned source representation, re-run its supported validation, and verify
that no target-only dependency remains.

Repository authoring rollback is not the same as undoing runtime or external
effects. If a future migration changes remote state, credentials, published
artifacts, audit records, or irreversible data, document compensation and human
approval separately. Never claim that restoring YAML reverses an external
effect.

## Current Migration Routes

These are the maintained entry points for migration guidance already present in
the repository. Each remains governed by its own compatibility and version
decision.

| Surface | Transition | Guide and evidence |
| --- | --- | --- |
| Participant identity | Legacy Project maintainer and mixed `AgentSet` resolution to explicit `ActorSet` identity | [Actor Model Migration](actor-model-migration.md), `npm run actor-schema-smoke`, `npm run semantic-smoke` |
| AI agent identity | Deprecated behavior fields in `AgentSet` to compact identity with behavior in `AgentDefinitionSet` and referenced resources | [Agent Identity Migration](agent-identity-migration.md), `npm run agent-identity-schema-smoke`, `npm run agent-definition-authority-smoke` |
| Active agent definition | Incomplete or duplicated behavior declarations to one complete, unique, unscoped active definition | [Effective Agent Configuration](effective-agent-configuration.md), `npm run agent-definition-authority-smoke`, `npm run semantic-smoke` |
| Typed references | Field-specific transitional scalar references to explicit kind, ID, and allowed scope where the owning contract supports both forms | [Typed References](typed-references.md), `npm run typed-reference-schema-smoke`, `npm run semantic-smoke` |
| Approval gate targets | Ambiguous scalar `appliesTo` to typed `targets` with explicit kind and scope | [Approval Gate Targets](approval-gate-targets.md), `npm run approval-gate-target-schema-smoke` |
| Multiple Workflow discovery | Singular Project `workflow` source hint to the mutually exclusive plural `workflows` list | [Manifest Discovery](manifest-discovery.md), `npm run manifest-discovery-smoke` |
| Provider support signals | Legacy provider `capabilities` to closed provider `features` | [Provider Features](provider-features.md), `npm run provider-feature-schema-smoke` |
| Provider training policy | Legacy `allowTrainingUse` to explicit `trainingUse` policy | [Provider Constraints](provider-constraints.md), `npm run provider-constraint-schema-smoke` |
| Network policy | Advisory `networkAccess` text to a structured deny-by-default policy | [Network Access Policy](network-access-policy.md), `npm run validate`, `npm run semantic-smoke` |
| MCP declaration profile | Earlier MCP sources to explicit server identity, surface inventory, and action allow-list and approval posture where applicable | [MCP Extension Draft](../extensions/mcp/README.md), `npm run mcp-extension-smoke` |
| Repository CLI JSON | Experimental `formatVersion` transitions through `0.4-draft` | [CLI Machine-Readable Diagnostics](cli-diagnostics.md), `npm run cli-diagnostics-smoke` |

This inventory is navigational, not a claim that every project must adopt each
route now. A project should migrate only when the owning guide applies and its
starting state is supported.

## Publication Checklist

Before publishing a concrete migration guide, confirm that:

- the decision route and version impact are explicit
- source and target versions or revisions are immutable and reproducible
- affected and unaffected consumers are named
- before, after, mixed, invalid, and ambiguous states are documented
- maintained examples or focused fixtures demonstrate the supported path
- diagnostics and human-review stops are defined
- authority, security, privacy, and external-effect impact is reviewed
- validation commands and evidence limits are stated
- rollback and irreversible effects are separated
- the compatibility window has an owner, exit criteria, and removal gate
- indexes, compatibility material, versioning guidance, and changelog are
  synchronized

## Current Limits

This guide adds planning and review structure only. It introduces no manifest
kind, schema, migration record format, CLI command, runtime behavior,
deprecation deadline, support promise, release, or version change.

The current repository CLI prototype has no `migrate` command. Current checks
can provide structural and selected semantic evidence, but they do not rewrite
arbitrary projects, evaluate complete policy, authenticate identities, contact
providers, execute extensions, or reverse external effects.

See [Compatibility](compatibility.md), [Versioning](versioning.md), the
[Compatibility Matrix](compatibility-matrix.md), and the
[Maintainer Guide](maintainer-guide.md) for the governing review and evidence
boundaries.
