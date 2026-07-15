# 0.1 Readiness Checklist

This checklist helps maintainers decide whether NexFlow is ready for a `0.1` candidate.

It is not a release announcement, a delivery schedule, or a guarantee that every item is already complete. It is a public review tool for checking whether the draft specification is coherent enough to tag as a candidate.

## Candidate Goal

A `0.1` candidate should show that NexFlow has a useful specification foundation:

- readers can understand the project purpose and vocabulary
- manifest authors can find the expected YAML shapes
- validators can run practical syntax, schema, and reference checks
- examples demonstrate realistic AI developer team configurations
- governance, compatibility, and limitation boundaries are explicit
- runtime and provider behavior remain planned unless implemented

## Release Decision

Before tagging a `0.1` candidate, maintainers should record:

- candidate version label
- changelog entry
- validation commands run
- compatibility impact
- known limitations
- unresolved blockers
- whether `specVersion` remains `"0.1"`

Do not tag a candidate if the repository implies runtime behavior, provider integrations, orchestration, deployment, or autonomous enforcement that does not exist.

## Documentation Checklist

- [ ] README explains vision, problem, solution, status, roadmap, governance, limitations, license, and FAQ.
- [ ] Documentation index links to all core models and project process docs.
- [ ] Concepts and glossary define the core domain terms consistently.
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
- [ ] Common ID, event type, autonomy level, memory scope, risk, and status definitions are centralized where practical.
- [ ] Schemas validate useful structure without pretending to encode full project semantics.
- [ ] Schema guide explains scope, update rules, and validation boundaries.
- [ ] Schema design notes explain why some rules belong to semantic validation instead of JSON Schema.
- [ ] Schema changes include matching docs, examples, and changelog updates when relevant.
- [ ] Breaking schema changes include migration notes or RFC coverage.

## Examples Checklist

- [ ] Minimal team example remains the easiest first reading path.
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
- [ ] `npm run semantic-smoke` succeeds.
- [ ] Markdown link checks succeed.
- [ ] `git diff --check` succeeds.
- [ ] CI runs schema smoke, schema validation, and semantic reference smoke checks on pull requests.
- [ ] Validation docs explain the difference between syntax checks, schema validation, semantic smoke checks, future semantic validation, and runtime enforcement.
- [ ] Validation output avoids claiming full semantic conformance.

## RFC Checklist

- [ ] RFC index explains proposal, review, acceptance, breaking change, and deprecation processes.
- [ ] Project vision RFC records the purpose and non-goals.
- [ ] Core manifest model RFC records the initial manifest vocabulary.
- [ ] Conformance, agent definition versioning, validation, extension namespace, approval gate, memory retention, event envelope, provider selection, reference CLI, and manifest bundling RFCs are discoverable.
- [ ] Draft RFCs are marked as draft unless accepted.
- [ ] Accepted or deferred decisions are reflected in docs, schemas, examples, and changelog.
- [ ] Breaking or behavior-significant changes include compatibility notes.

## Compatibility Checklist

- [ ] Compatibility doc distinguishes compatible changes, potentially breaking changes, and pre-`1.0` instability.
- [ ] Versioning doc explains manifest `specVersion` and separate behavioral versions for agent definitions, prompt sets, model profiles, and retrieval profiles.
- [ ] Conformance doc distinguishes manifest, schema, semantic, CLI, runtime, extension, and audit support surfaces.
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
- [ ] Human override remains part of the safety model.

## Candidate Blockers

A `0.1` candidate should be blocked if any of the following are true:

- core docs contradict each other on manifest meaning
- examples fail repository validation checks
- schemas are missing for current core manifest kinds
- README claims runtime, provider, or orchestration behavior that is not implemented
- safety-critical permission, memory, context, or approval behavior is ambiguous
- known breaking changes lack migration notes or RFC context
- public docs expose private project process, personal data, credentials, or local machine state

## Evidence to Capture

For each `0.1` candidate, maintainers should capture:

- commit hash
- changelog section
- validation command output summary
- compatibility notes
- known limitations
- unresolved issues or RFCs that remain intentionally draft

Evidence should be factual and source-grounded. It should not invent implementation status, user adoption, runtime capabilities, or integration support.

## Candidate Outcome

After review, classify the candidate as one of:

| Outcome | Meaning |
| --- | --- |
| Ready | Criteria are satisfied and only acceptable draft limitations remain. |
| Ready with notes | Criteria are mostly satisfied, with documented limitations that do not block a candidate tag. |
| Blocked | One or more candidate blockers must be resolved before tagging. |

The `0.1` candidate should remain a draft specification release. It should not imply `1.0` stability or runtime readiness.
