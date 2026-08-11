# 0.1 Readiness Checklist

This checklist helps maintainers decide whether NexFlow is ready for a `0.1` candidate.

It is not a release announcement, a delivery schedule, or a guarantee that every item is already complete. It is a public review tool for checking whether the draft specification is coherent enough to tag as a candidate.

The human-readable checklist on this page is paired with a standalone,
machine-readable [candidate readiness record](../release/README.md). The record
captures one review outcome without creating a new NexFlow manifest kind or
changing manifest `specVersion`.

The [`0.1` Candidate Scope](0.1-scope.md) defines the frozen baseline, optional
and migration-only surfaces, deferred work, and current blockers. Readiness is
evaluated against that boundary, not against every planned NexFlow feature.

## Candidate Goal

A `0.1` candidate should show that NexFlow has a useful specification foundation:

- readers can understand the project purpose and vocabulary
- manifest authors can find the expected YAML shapes
- validators can run practical syntax, schema, and reference checks
- examples demonstrate realistic AI developer team configurations
- governance, compatibility, and limitation boundaries are explicit
- runtime and provider behavior remain planned unless implemented
- every included, optional, migration-only, and deferred surface matches the
  frozen candidate scope

## Release Decision

Start from
[`release/0.1-candidate-readiness.template.yaml`](../release/0.1-candidate-readiness.template.yaml)
and keep its decision at `not-evaluated` until the evidence has been reviewed.
Before tagging a `0.1` candidate, maintainers should record:

- candidate version label
- proposed tag and exact candidate commit
- changelog entry
- validation commands run
- compatibility impact
- known limitations
- unresolved blockers
- candidate scope document and revision used for the review
- reviewer identity, evaluation time, and decision rationale
- whether `specVersion` remains `"0.1"`

Do not tag a candidate if the repository implies runtime behavior, provider integrations, orchestration, deployment, or autonomous enforcement that does not exist.

## Machine-Readable Gates

The candidate record groups this detailed checklist into eight stable gates:

| Gate | Checklist Coverage |
| --- | --- |
| `documentation` | Documentation completeness, navigation, terminology, and implementation claims. |
| `schemas` | Core manifest coverage, schema compilation, design boundaries, and synchronized changes. |
| `examples` | Maintained example coverage, consistency, and safe public content. |
| `validation` | Pinned local and CI checks, diagnostics, and stated validation limits. |
| `rfc-governance` | RFC state, accepted decisions, review process, and breaking-change policy. |
| `compatibility-migrations` | Version impact, deprecated forms, migrations, and tested artifact pairing. |
| `security-limitations` | Least privilege, human authority, dangerous operations, credentials, and explicit non-goals. |
| `release-evidence` | Candidate commit, changelog, tag proposal, evidence locations, blockers, and final decision. |

## Scope Freeze Checklist

- [ ] The evaluated commit matches the [0.1 Candidate Scope](0.1-scope.md) or a
  reviewed successor that explicitly reopened and refroze scope.
- [ ] The repository contains exactly the 17 schema-backed manifest kinds in
  the frozen baseline; supporting profiles and release records are not counted
  as project manifest kinds.
- [ ] RFC-backed features use the candidate treatment recorded in the scope
  document without silently promoting a Draft or experimental surface.
- [ ] Migration-only fields remain non-authoritative and link to replacement
  guidance.
- [ ] Deferred work is not required by examples, Core Profile conformance, or
  candidate support claims.
- [ ] No new CLI, runtime, provider, live integration, extension loading,
  orchestration, deployment, or policy enforcement claim has entered `0.1`.
- [ ] Every listed candidate blocker has factual closure evidence.

Use only `not-evaluated`, `passed`, `failed`, `blocked`, or `not-applicable` for
gate status. A passed gate requires at least one evidence item. Evidence may
point to a command, repository document, pull request, issue, audit, or another
reviewable source and should identify the exact revision when that matters.

Run the record-format checks with:

```sh
npm run candidate-readiness-smoke
```

This command validates record structure and release decision guards. It does
not run the referenced commands, inspect external evidence, approve a tag, or
publish a release.

## Documentation Checklist

- [ ] README explains vision, problem, solution, status, roadmap, governance, limitations, license, and FAQ.
- [ ] Documentation index links to all core models and project process docs.
- [ ] Concepts and glossary define the core domain terms consistently.
- [ ] Actor and agent identity migration guidance distinguish participant identity from effective agent configuration.
- [ ] Agent Assembly remains a derived inspection projection; no authored manifest, schema, example output, or grant semantics are introduced for it.
- [ ] Manifest reference describes every core manifest family.
- [ ] Security model explains least privilege, explicit permissions, approval gates, credentials, network access, destructive operations, and human override.
- [ ] Autonomy model and approval gates document human authority and sensitive action requirements.
- [ ] Context model and memory model document access, retention, ownership, visibility, sensitivity, and boundaries.
- [ ] Provider abstraction remains provider-neutral and does not require one LLM vendor.
- [ ] Runtime options compare implementation choices without selecting a final runtime language.
- [ ] Release plan and roadmap explain what is specified, implemented, and planned.
- [ ] Known limitations clearly state that no runtime engine or provider integration exists.

## Schema Checklist

- [ ] Every core manifest kind has a practical JSON Schema.
- [ ] Schemas include `specVersion`, `kind`, and required top-level structure.
- [ ] Common ID, event type, autonomy level, memory scope, risk, status, and typed-reference definitions are centralized where practical.
- [ ] Schemas validate useful structure without pretending to encode full project semantics.
- [ ] Schema guide explains scope, update rules, and validation boundaries.
- [ ] Schema design notes explain why some rules belong to semantic validation instead of JSON Schema.
- [ ] Schema changes include matching docs, examples, and changelog updates when relevant.
- [ ] Breaking schema changes include migration notes or RFC coverage.

## Examples Checklist

- [ ] Minimal team example remains the easiest first reading path and demonstrates the staged ActorSet-to-AgentSet bridge, compact AgentSet, authoritative active definition, and fail-closed human override.
- [ ] Software team example demonstrates implementation, QA, review, docs, and handoffs.
- [ ] Startup team example demonstrates product, design, implementation, and release review.
- [ ] Enterprise team example demonstrates security, compliance, audit evidence, restricted context, and gated release controls.
- [ ] Product delivery team example demonstrates many-to-many handoffs, product acceptance, quality evidence, and launch readiness.
- [ ] Open-source maintainer example demonstrates triage, docs, PR review, and release notes.
- [ ] Research lab example demonstrates literature review, experiment planning, reproducibility, citations, and research memory boundaries.
- [ ] Examples matrix and examples checklist remain aligned with the example directories.
- [ ] Example manifests use consistent IDs and references.
- [ ] Example manifests avoid secrets, private data, vendor lock-in, and claims of implemented runtime behavior.

## Validation Checklist

- [ ] `npm ci --ignore-scripts` succeeds.
- [ ] `./scripts/schema-smoke` succeeds.
- [ ] `npm run validate` succeeds.
- [ ] `npm run negative-schema-fixtures` succeeds.
- [ ] `npm run typed-reference-schema-smoke` succeeds.
- [ ] `npm run approval-gate-target-schema-smoke` succeeds.
- [ ] `npm run work-reference-namespace-smoke` succeeds.
- [ ] `npm run actor-schema-smoke` succeeds.
- [ ] `npm run agent-identity-schema-smoke` succeeds.
- [ ] `npm run agent-definition-authority-smoke` succeeds.
- [ ] `npm run core-profile-smoke` succeeds.
- [ ] `npm run manifest-discovery-smoke` succeeds.
- [ ] `npm run human-override-schema-smoke` succeeds.
- [ ] `npm run mcp-extension-smoke` succeeds.
- [ ] `npm run a2a-extension-smoke` succeeds.
- [ ] `npm run provider-feature-schema-smoke` succeeds.
- [ ] `npm run provider-constraint-schema-smoke` succeeds.
- [ ] `npm run conformance-claim-smoke` succeeds.
- [ ] `npm run candidate-readiness-smoke` succeeds.
- [ ] `npm run semantic-smoke` succeeds.
- [ ] Markdown link checks succeed.
- [ ] `git diff --check` succeeds.
- [ ] CI runs schema smoke, schema validation, negative fixtures, typed
  reference primitives, approval gate targets, work reference namespaces,
  ActorSet, agent identity, agent definition authority, Core Profile, human
  override boundaries, manifest discovery, multiple workflows, MCP and A2A
  extension profiles, provider features, provider constraints, conformance claim format,
  candidate readiness record, and semantic reference smoke checks on pull
  requests.
- [ ] Validation docs explain the difference between syntax checks, schema validation, semantic smoke checks, future semantic validation, and runtime enforcement.
- [ ] Semantic reference inventory target namespaces and coverage labels match
  the current schemas, examples, and semantic smoke implementation.
- [ ] Validation output avoids claiming full semantic conformance.

## RFC Checklist

- [ ] RFC index explains proposal, review, acceptance, breaking change, and deprecation processes.
- [ ] Project vision RFC records the purpose and non-goals.
- [ ] Core manifest model RFC records the initial manifest vocabulary.
- [ ] Conformance, agent definition versioning, validation, extension namespace, approval gate, memory retention, event envelope, provider selection, reference CLI, manifest bundling, actor, effective configuration, typed reference, discovery, human override, MCP extension, and MCP/A2A boundary RFCs are discoverable.
- [ ] Draft RFCs are marked as draft unless accepted.
- [ ] Accepted or deferred decisions are reflected in docs, schemas, examples, and changelog.
- [ ] Breaking or behavior-significant changes include compatibility notes.

## Compatibility Checklist

- [ ] Compatibility doc distinguishes compatible changes, potentially breaking changes, and pre-`1.0` instability.
- [ ] Versioning doc explains manifest `specVersion` and separate behavioral versions for agent definitions, prompt sets, model profiles, and retrieval profiles.
- [ ] Compatibility and migration docs explain unique active-definition authority and the stricter active shape.
- [ ] Typed-reference migrations state allowed target kinds, scope, legacy form
  compatibility, and semantic validation limits.
- [ ] Approval gate target migration distinguishes typed resource targets from
  deprecated ambiguous `appliesTo` values.
- [ ] Provider feature migration keeps model support signals separate from
  action capabilities and documents deprecated provider `capabilities`.
- [ ] Provider constraint migration documents deprecated `allowTrainingUse`,
  explicit replacement values, model-profile composition, and unknown-fact
  behavior.
- [ ] MCP profile migration documents required server and surface metadata,
  action allow-lists, approval posture, and the absence of runtime support.
- [ ] A2A profile compatibility keeps remote identity, skills, messages, tasks,
  artifacts, callbacks, credentials, and protocol claims outside local authority.
- [ ] Workflow step and task artifact namespace changes include reference and
  migration compatibility notes.
- [ ] Conformance doc distinguishes manifest, schema, semantic, CLI, runtime, extension, and audit support surfaces.
- [ ] Conformance claim YAML and Markdown templates identify the same scope,
  level status, evidence, behavior, limitations, and responsible party.
- [ ] Release notes separate implemented behavior, specified behavior, and planned behavior.
- [ ] `specVersion: "0.1"` remains accurate for current manifests.
- [ ] Any accepted breaking change includes migration guidance.

## Safety and Limitations Checklist

- [ ] README and docs state that NexFlow is not an AI coding agent, LLM wrapper, chat app, or personal productivity assistant.
- [ ] Docs state that no runtime engine exists yet.
- [ ] Docs state that provider integrations are specified or planned, not implemented.
- [ ] Security docs avoid unsafe defaults.
- [ ] Dangerous actions require explicit permissions and approval gates in the specification.
- [ ] Credential and secret guidance avoids storing secrets in manifests.
- [ ] Network, deployment, production, and destructive action policies require explicit review.
- [ ] Human override remains explicit, human-controlled, fail-closed, approval-gated for resume, auditable, and clearly separated from runtime enforcement claims.

## Candidate Blockers

A `0.1` candidate should be blocked if any of the following are true:

- the evaluated feature set exceeds or contradicts the frozen candidate scope
- core docs contradict each other on manifest meaning
- examples fail repository validation checks
- schemas are missing for current core manifest kinds
- README claims runtime, provider, or orchestration behavior that is not implemented
- safety-critical permission, memory, context, or approval behavior is ambiguous
- known breaking changes lack migration notes or RFC context
- public docs expose private project process, personal data, credentials, or local machine state
- no concrete private vulnerability reporting path is available

## Evidence to Capture

For each `0.1` candidate, maintainers should capture:

- full 40-character commit hash
- proposed tag and evaluation timestamp
- changelog section
- validation command output summary
- compatibility notes
- known limitations
- unresolved issues or RFCs that remain intentionally draft
- frozen scope revision and closure evidence for every candidate blocker
- reviewer identity and decision rationale

Evidence should be factual and source-grounded. It should not invent implementation status, user adoption, runtime capabilities, or integration support.

## Candidate Outcome

After review, classify the candidate as one of:

| Outcome | Meaning |
| --- | --- |
| Not evaluated | The template or review is incomplete and makes no tag decision. |
| Ready | Criteria are satisfied and only acceptable draft limitations remain. |
| Ready with notes | Criteria are mostly satisfied, with documented limitations that do not block a candidate tag. |
| Blocked | One or more candidate blockers must be resolved before tagging. |
| Deferred | Maintainers intentionally postpone the decision without claiming readiness. |

`Ready` and `Ready with notes` require every machine-readable gate to be
`passed` or `not-applicable` and require no unresolved blockers. `Blocked`
requires at least one recorded blocker. Every outcome other than `Not evaluated`
requires an exact candidate commit, evaluation timestamp, decision maker, and
rationale. The `0.1` candidate should remain a draft specification release. It
should not imply `1.0` stability or runtime readiness.
