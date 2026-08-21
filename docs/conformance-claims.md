# Conformance Claims

A NexFlow conformance claim is a versioned, self-declared statement describing
which parts of NexFlow a named project, validator, CLI, runtime, extension,
library, or service supports.

The claim format makes support inspectable without reducing compatibility to a
single "NexFlow compatible" label. It implements the claim guidance in
[RFC-0003](../rfcs/RFC-0003-conformance-levels.md) while preserving the boundary
between validation and enforcement.

Related artifacts:

- [Machine-readable schema](../conformance/conformance-claim.schema.json)
- [YAML template](../conformance/conformance-claim.template.yaml)
- [Markdown template](../conformance/CONFORMANCE-CLAIM.template.md)
- [Core Profile qualifiers](core-profile.md)
- [Conformance](conformance.md)
- [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md)
- [Compatibility Matrix](compatibility-matrix.md)

## Status And Scope

The initial claim format is `claimVersion: "0.1"`.

`claimVersion` versions the standalone claim document. It is independent from:

- manifest `specVersion`
- the subject's product or release version
- schema snapshot revisions
- extension versions

A claim is not a NexFlow core manifest and does not participate in project
manifest discovery. The `NexFlowConformanceClaim` kind identifies the standalone
document only. Adding or changing a claim does not change a project's manifest
set.

## Trust Boundary

Every claim is self-declared. NexFlow does not currently operate a certification
authority, compatibility registry, approved vendor list, or formal conformance
test suite.

A claim MUST NOT be interpreted as:

- certification or endorsement by NexFlow maintainers
- a capability or permission grant
- approval to perform an action
- evidence that credentials, users, actors, or providers were authenticated
- proof of semantic correctness beyond the listed evidence
- proof of runtime safety or policy enforcement

Consumers should verify evidence independently and apply their own trust policy.

## Required Identity

A machine-readable claim identifies:

- one claim format version
- one stable claim ID
- one lifecycle status
- one issue timestamp
- one named subject and exact subject version
- one subject type
- one responsible party

Claim lifecycle status is:

| Status | Meaning |
| --- | --- |
| `draft` | The claim is being prepared and MUST NOT be presented as current published support. |
| `published` | The responsible party presents the claim as current for the named subject version. |
| `withdrawn` | The responsible party no longer stands behind the claim. Consumers MUST NOT treat it as current support. |

Changing the subject version requires a new evaluation. A publisher MAY update
evidence or correct wording for the same subject version, but should update
`updatedAt` and retain an auditable publication history.

## Evaluated Scope

Every claim lists:

- supported NexFlow `specVersion` values
- supported authoring profiles, including an explicit empty list when none apply
- supported manifest kinds, including an explicit empty list when none apply
- supported extension namespaces, including an explicit empty list when none apply

A claim may also list:

- the exact schema source and tag or commit evaluated for each spec version
- unsupported fields

An `NF-SCHEMA` claim SHOULD identify the evaluated schema snapshot. An
`NF-EXTENSION` claim MUST list every namespace covered by the claim. Empty or
omitted scope must never be interpreted as "all."

For a versioned extension profile such as `io.nexflow.mcp` or
`io.nexflow.a2a`, evidence SHOULD name the supported profile version, external
protocol versions, and protocol bindings where applicable. The current claim
format keeps those details in evidence or limitations; the namespace field does
not imply all profile, protocol, or binding versions.

Profile values use the closed qualifiers defined by the current Core Profile
contract. Listing a profile narrows the evaluated declaration shape; it does not
claim runtime support or replace the required conformance level evidence.

Migration from earlier unreleased `claimVersion: "0.1"` drafts: add
`scope.profiles` with every evaluated qualifier, or an explicit empty list when
no profile was evaluated. The claim version remains `0.1` because no claim
format release has been published.

Draft RFC vocabulary, unknown future profiles, and unpublished schema
combinations are outside the scope unless the claim identifies them as
non-standard limitations.

## Level Status

The claim contains all six current conformance levels so absence cannot be
mistaken for support.

| Status | Meaning |
| --- | --- |
| `supported` | The subject satisfies the claimed level for the listed scope and provides evidence. |
| `partial` | The subject implements a bounded subset, provides evidence, and lists the gaps. |
| `unsupported` | The subject was evaluated and does not support the level. |
| `not-applicable` | The level does not apply to the subject type or evaluated use. |
| `not-evaluated` | No support conclusion has been made. This MUST NOT be treated as support. |

Every level requires a factual summary. `supported` and `partial` require at
least one evidence item. `partial` also requires at least one limitation.

`unsupported`, `not-applicable`, and `not-evaluated` are explicit non-support
states. They do not require evidence, although a publisher may include evidence
or explanatory limitations.

## Evidence

Evidence items identify:

- evidence type
- a factual description of what the evidence demonstrates
- an optional public URI
- an optional tag, commit, report revision, or suite version

Supported evidence types are:

- `documentation`
- `test-suite`
- `fixture-suite`
- `audit`
- `other`

Evidence should be reproducible and specific to the named subject version.
Marketing pages, unversioned screenshots, or schema parsing alone are
insufficient evidence for semantic or runtime claims.

Evidence for `NF-RUNTIME` must cover actual enforcement of the relevant
permissions, approval gates, autonomy, context, memory, human override, and audit
boundaries. A runtime claim cannot be inferred from `NF-SCHEMA`,
`NF-SEMANTIC`, or `NF-CLI` evidence.

## Behavior And Limitations

Every claim describes validation behavior and enforcement behavior in plain
language.

Validation behavior should state what the subject:

- parses
- validates
- rejects
- preserves without interpreting
- skips or leaves to another component

Enforcement behavior should state what the subject actually controls during
execution. Validation-only tools should state that they provide no runtime
preflight or enforcement and should disclose command-specific filesystem,
network, process, credential, extension, and remote-system effects. A shared
binary or library does not merge `NF-CLI` and `NF-RUNTIME` evidence.

Overall limitations apply to the complete claim. Level limitations apply only to
one conformance level. Neither list may silently broaden the evaluated scope.

## Machine And Human Forms

Publishers SHOULD provide both formats:

- YAML for tooling, registries, release automation, and compatibility inspection
- Markdown for reviewers, adopters, security teams, and release notes

The forms MUST identify the same subject version, scope, level statuses,
evidence, behavior, limitations, lifecycle status, and responsible party.

The YAML form is authoritative for machine consumption. Human-readable text may
explain evidence and tradeoffs, but MUST NOT claim broader support.

## Publication Workflow

1. Evaluate one exact subject version against one or more NexFlow spec versions.
2. Record the profiles, schema revisions, and manifest kinds actually exercised.
3. Assign a status to every conformance level.
4. Link evidence for every `supported` or `partial` level.
5. Record partial and overall limitations.
6. Describe validation and enforcement separately.
7. Validate the YAML document against the claim schema.
8. Review the Markdown form for consistency.
9. Publish both artifacts with the subject release.
10. Withdraw or replace the claim when evidence, behavior, or compatibility changes.

Claims should be immutable once attached to a release. Corrections should retain
the prior artifact or publication history so consumers can understand what
changed.

## Validation Boundary

The repository command:

```sh
npm run conformance-claim-smoke
```

validates the maintained YAML template, focused schema boundaries, and structural
alignment of the Markdown template. It does not evaluate external tools, verify
evidence, certify claims, or establish any NexFlow conformance level.

Future conformance fixture suites may evaluate more complete claim behavior. That
work remains separate from the current template contract.
