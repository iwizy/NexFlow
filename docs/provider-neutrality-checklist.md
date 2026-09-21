# Provider Neutrality Checklist

This is a review aid for changes to provider declarations, model profiles,
extensions, examples, validation tooling, and support claims. It makes the
existing provider-neutrality and safety boundaries reviewable; it does not add
manifest fields, select a runtime, accept a draft RFC, or certify a provider.

Use it with the [Maintainer Guide](maintainer-guide.md) and
[Provider Abstraction](provider-abstraction.md). The linked owning contracts
remain authoritative. Proposed selection behavior in
[RFC-0010](../rfcs/RFC-0010-provider-selection.md) remains Draft; a completed
review does not promote that proposal or implement selection or invocation.

## Review Scope And Evidence

Record the exact revision, affected surfaces, applicable checklist IDs, and
evidence in the pull request or release review. For each ID, use `pass`,
`blocked`, or `not-applicable`, with a reason and a link to the relevant diff,
contract, example, or check result. An unchecked item is unresolved, not a pass.
Explain non-applicability from the actual diff; absence of an implementation is
not evidence that future runtime behavior works.

Review both the normal path and at least one relevant failure or unsupported
case. Distinguish automated structural evidence from manual contract review
and unimplemented runtime expectations. Record gaps explicitly. Block the
affected claim when a required boundary is contradicted or lacks evidence;
route material semantic, security, or compatibility changes through the
[RFC process](../rfcs/README.md).

Provider neutrality does not require identical provider capabilities, identical
model outputs, multiple configured providers, or fallback. A project may pin
one reviewed model or adopt a provider-specific extension. The core contract
must remain usable without that choice, and changing the choice must not
silently change authority or relax policy.

## Checklist

- [ ] **PN-01 — Core adoption is independent.** Core authoring and validation
  require no particular provider, hosted account, proprietary SDK, model
  catalog, or registry service. Provider and extension modules remain optional
  until requested qualifiers or authored references require their dependency
  closure. No missing module is synthesized as a default provider or permission.
  Evidence: review the affected entry points against the
  [Core Profile](core-profile.md) and
  [Extension Registry Model](extension-registry.md), including an assembly
  without provider declarations.

- [ ] **PN-02 — Common vocabulary stays separate from provider details.** Core
  fields describe portable intent. Provider-specific options remain documented,
  namespaced, and optional for core adoption. Unknown metadata does not satisfy
  core constraints or become a core feature. Provider `features` are support
  signals, never project action capabilities or permission grants. Required
  unsupported behavior is reported explicitly rather than silently ignored.
  Evidence: inspect field meanings, namespace handling, and accepted/rejected
  declarations against [Provider Features](provider-features.md),
  [Provider Constraints](provider-constraints.md), and
  [Extension Model](extensions.md).

- [ ] **PN-03 — Selection intent is explicit.** Pinned, floating, and policy
  modes retain their documented meanings. References resolve in their declared
  namespace; free text, names, or legacy preferences do not become hidden
  selection rules. The current model-profile contract has no `requiredFeatures`
  field. A pinned choice is project configuration, not a core requirement.
  Evidence: trace affected declarations through
  [Model Profiles](model-profiles.md), [Provider Features](provider-features.md),
  and the [Semantic Reference Inventory](semantic-reference-inventory.md);
  identify checks that remain unimplemented.

- [ ] **PN-04 — Constraints are not weakened.** Candidate declarations are
  compared with model-profile requirements and project policy, rather than
  replacing them. Training use, residency, retention, sensitivity, tool use,
  network posture, and approval constraints retain their meanings. Missing,
  `unspecified`, conflicting, or externally resolved restrictive facts are not
  treated as satisfied. Cost and latency labels are not live measurements.
  Evidence: document a compatible declaration and a conflict or material unknown
  using [Provider Constraints](provider-constraints.md); distinguish schema
  acceptance from the future policy decision.

- [ ] **PN-05 — Selection and authorization remain independent.** A provider
  reference, feature, extension declaration, registry entry, or available model
  grants no action, context, memory, credential, network, or approval authority.
  Provider-native tool requests remain requests subject to local checks.
  Local deployment does not waive permissions or human control; any outbound
  operation still needs the applicable network and credential decisions.
  Evidence: trace the affected operation through
  [Security Model](security-model.md), [Network Access Policy](network-access-policy.md),
  [Credential Handling](credential-handling.md),
  [Approval Gates](approval-gates.md), and [Human Override](human-override.md).

- [ ] **PN-06 — Adapters cannot hide behavioral changes.** The future host
  selects and authorizes one target. Translation, material defaults, lossy
  mappings, unsupported fields, and normalized failures remain explicit. An
  adapter cannot select a substitute, silently drop a restrictive field, execute
  a returned tool request, or broaden disclosure through session reuse.
  Evidence: review the proposed mapping and a denied or unsupported case against
  [Provider Adapter Boundary](provider-adapter-boundary.md), without implying
  that an adapter exists.

- [ ] **PN-07 — Retry and fallback preserve the boundary.** Fallback is allowed
  only by the applicable model profile; it returns to host-owned selection and
  repeats policy, context, memory, network, credential, and approval evaluation.
  Retries remain bounded and do not hide uncertain outcomes or duplicate
  effects. Provider-managed routing cannot substitute an unreviewed target.
  Evidence: review denied fallback, changed destination or model, and partial
  outcome handling against [Model Profiles](model-profiles.md) and
  [Provider Adapter Boundary](provider-adapter-boundary.md). Do not require
  fallback as proof of neutrality.

- [ ] **PN-08 — Explanations preserve provenance and privacy.** Proposed audit
  evidence identifies the model profile, selected target and available revision,
  applied constraints, policy decision, fallback, material defaults, and known
  uncertainty. Provider traces are not local approval or acceptance authority.
  Logs exclude credentials, complete prompts, and unnecessary sensitive context
  or memory. Evidence: inspect safe metadata and failure explanations against
  [Provider Adapter Boundary](provider-adapter-boundary.md) and
  [Event And Audit Storage Boundary](event-audit-storage-boundary.md).

- [ ] **PN-09 — Static tooling stays offline.** Parsing, schema validation,
  declaration inspection, and static graphing do not contact providers, resolve
  live model aliases, acquire credentials, benchmark services, load executable
  extensions, or perform runtime preflight. Examples use fictional, non-secret
  values and do not imply that a declaration creates a connection. Evidence:
  inspect affected commands and examples against the
  [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md), with the
  existing no-runtime guardrail evidence when tooling is affected.

- [ ] **PN-10 — Compatibility and claims match the evidence.** Review changes
  to selection, mappings, defaults, fallback, constraints, and audit even when
  manifest shape is unchanged. Preserve documented `0.1` migration treatment
  for legacy provider `capabilities`, `allowTrainingUse`, and preferences;
  deprecation is not removal or added authority. Keep docs, examples, checks,
  versions, and changelog aligned. Evidence: record the version decision under
  [Versioning](versioning.md) and [Compatibility](compatibility.md), and bound
  claims using [Conformance Claims](conformance-claims.md) and the
  [Compatibility Matrix](compatibility-matrix.md). Structural checks do not
  prove live compatibility, equivalent output, or `NF-RUNTIME` conformance.

## Review Scenarios

These are manual review examples, not executable fixtures or assertions that
the repository implements a selector or policy evaluator.

| Proposed change or claim | Review outcome | Relevant IDs |
| --- | --- | --- |
| A core-only example omits providers and extensions, with no references or qualifiers requiring them. | Compatible with minimum adoption; no provider availability or execution claim follows. | PN-01, PN-10 |
| A project pins one reviewed model while core schemas remain independent of that choice. | Compatible in principle; review the reference, constraints, and authorization separately. | PN-01, PN-03, PN-05 |
| An optional namespaced setting is preserved but the consumer does not support its required behavior. | Preservation alone is insufficient; report unsupported behavior and block the affected support claim. | PN-02, PN-06, PN-10 |
| A declaration uses `features: [tool_reasoning]` to justify command execution. | Block the authority claim; a valid feature grants no action permission. | PN-02, PN-05 |
| A profile prohibits training use while a candidate leaves it `unspecified`. | Block the claim that the restrictive requirement is satisfied, even if both declarations validate. | PN-04 |
| An adapter silently changes destination after a timeout or retries a possibly completed effect. | Block the proposed behavior pending host-owned policy and outcome handling. | PN-06, PN-07 |
| A validator contacts a live catalog to complete an offline inspection result. | Block the effect expansion; it crosses the static tooling boundary. | PN-09 |
| Passing schema checks is advertised as working provider failover. | Block the publication claim; no runtime or failover evidence follows from structure. | PN-07, PN-10 |

## Validation And Review Record

Use existing focused evidence appropriate to the diff:

| Check | Evidence it supplies | Limit |
| --- | --- | --- |
| `npm run provider-feature-schema-smoke` | Accepted and rejected feature shapes, closed vocabulary, and legacy coexistence rules. | No provider capability detection or action authorization. |
| `npm run provider-constraint-schema-smoke` | Constraint shapes, migration forms, and selected invalid combinations. | No complete constraint comparison, live facts, or selection algorithm. |
| `npm run core-profile-smoke` | Minimum adoption, optional modules, and selected dependency boundaries. | No provider availability or runtime permission. |
| `npm run semantic-smoke` | Selected cross-manifest reference checks. | Not complete semantic or policy validation. |
| `npm run cli-no-runtime-guardrails-smoke` | Regression checks for prohibited effects in prototype commands. | Not an operating-system sandbox or runtime implementation. |
| `npm run validate` | Schema compilation and maintained example structure. | Not live interoperability, policy enforcement, or certification. |

Before merge, also run the complete current suites referenced by the two
[repository workflows](../.github/workflows/) as described in the
[Maintainer Guide](maintainer-guide.md#validate-locally). Review links and
`git diff --check` for documentation changes. Manual review is still required
for the semantic and claim boundaries in this checklist.

A review record can use this compact format; placeholders are not evidence:

```text
Revision and scope: <exact revision; changed surfaces>
Checklist results: <each PN-ID; pass/blocked/not-applicable; reason; evidence>
Failure or unsupported cases: <reviewed scenario; expected boundary; evidence>
Validation: <commands; results; CI revision; limitations>
Compatibility: <affected contracts; version decision; migration or none>
Open blockers: <unresolved evidence or contradictions; owner; required action>
Review: <reviewer; date; outcome for this scoped change>
Permitted claim: <what the evidence supports; what remains unimplemented>
```

Adding this review aid changes no manifest, schema, profile, CLI output, or
adapter contract. It needs no version bump or migration. A future change found
during review still needs its own compatibility and version decision. Checklist
completion is review evidence only; it is not release approval, conformance
certification, provider support, or permission to publish an announcement.
