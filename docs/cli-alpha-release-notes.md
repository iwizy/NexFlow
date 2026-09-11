# Draft Reference CLI Alpha Release Notes

Status: pre-publication draft; no reference CLI alpha has been released.

These notes prepare the public release record for a future NexFlow reference
CLI alpha. They describe the candidate surface using evidence that can be run
from this repository today, while keeping prototype behavior separate from a
supported product claim.

Do not publish these notes as a release announcement, create a CLI tag from
them, or describe the candidate as shipped until every item in
[Publication Readiness](#publication-readiness) is complete. The current
JavaScript tooling remains an unreleased repository prototype. It is not a
distributed `nexflow` executable and does not satisfy `NF-CLI` conformance.

## Candidate Metadata

| Field | Value before publication |
| --- | --- |
| Product | NexFlow Reference CLI |
| Candidate version | `TBD` |
| Release date | `TBD` |
| Release tag | `TBD` |
| Source commit | `TBD` |
| Distribution and install command | `TBD` |
| Supported platforms | `TBD` |
| Supported manifest versions | Proposed: `specVersion: "0.1"`; must be confirmed |
| CLI conformance claim | None; any future `NF-CLI` claim requires separate evidence |
| Publication state | Blocked |

The CLI package version, manifest `specVersion`, repository release tag, and
machine-output format version are independent version domains. A maintainer
must fill each applicable field explicitly rather than deriving one from
another.

## Candidate Summary

The planned alpha is a local, validation-focused tool for understanding and
authoring NexFlow manifest projects. Its proposed public surface contains four
commands:

- `nexflow validate` checks selected manifests against supported structural
  schemas
- `nexflow inspect` presents a bounded view of declared resources and selected
  references
- `nexflow graph` builds an explanatory static relationship graph
- `nexflow init` creates a minimal, reviewable starter manifest set

The alpha must remain an authoring and inspection tool. Successful validation
must not authorize execution, prove that external resources exist, or imply
that a project is safe to run.

## Evidence Available Today

The repository prototype exercises parts of the proposed surface. These
commands are evaluation evidence from a source checkout, not the final install
or invocation contract:

```sh
npm ci --ignore-scripts
npm run cli-prototype -- --help
npm run cli-prototype -- validate --root examples/minimal-team
npm run cli-prototype -- inspect --root examples/minimal-team
npm run cli-prototype -- graph --root examples/minimal-team
```

The current prototype provides:

| Area | Repository evidence | Claim limit |
| --- | --- | --- |
| Input selection | Explicit local root, Project hints, or an explicit file list | No recursive, parent, glob, or remote discovery |
| Validation | YAML parsing and JSON Schema checks for the repository's 17 manifest kinds at `specVersion: "0.1"` | No complete semantic, policy, extension, or runtime validation |
| Inspection | Allowlisted identifiers, source locations, counts, and selected references | No effective configuration, Agent Assembly, or arbitrary manifest disclosure |
| Graphing | Declared nodes and selected reference edges with static resolution labels | No execution order, scheduler state, authorization, or rendering contract |
| Initialization | Built-in `minimal-team@0.1-draft` three-file starter with conflict refusal | No package installation, Git setup, provider configuration, credentials, or runtime |
| Diagnostics | Opt-in JSON result and bounded diagnostics using `formatVersion: "0.4-draft"` | Experimental repository format, not a stable public CLI contract |
| Safety boundary | Executable checks for a closed command effect budget and denied runtime-like APIs | Application-level regression evidence, not an operating-system sandbox |
| CI | A dedicated workflow runs the complete repository CLI smoke suite | Evidence for the tested revision only, not release or conformance approval |

See the [Reference CLI](reference-cli.md) for the proposed public command map
and the [Examples Validation Walkthrough](examples-validation-walkthrough.md)
for a guided run through maintained examples and a cataloged failure.

## Machine Interface

The repository prototype uses text output by default. Direct Node invocation
avoids npm lifecycle logging when evaluating its experimental JSON result:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team --format json
```

The JSON envelope currently reports `formatVersion: "0.4-draft"`, explicit
check states, bounded diagnostics, and `executionAuthorized: false`. This
format may change before an alpha. Final release notes must name the public
output version, link its compatibility policy, and provide migration guidance
for every incompatible revision.

## Safety And Non-Goals

The proposed alpha is offline and non-orchestrating. It must not:

- run agents, tasks, handoffs, or workflows
- call model providers, integrations, MCP servers, or other remote services
- read, acquire, expose, validate, or rotate credentials
- load executable extensions or provider adapters
- perform runtime preflight or enforce runtime permissions and approvals
- persist project, team, user, or organization memory
- create branches, commits, pull requests, deployments, or production actions
- present structural validation as semantic correctness or execution safety

The bounded `init` command is the only proposed project-writing surface. It
must retain explicit destination selection, deterministic output, conflict
refusal, and no overwrite mode unless a reviewed specification change defines
a different safe contract.

## Known Candidate Limitations

The current evidence has deliberate gaps that final notes must preserve or
close:

- [RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md) remains Draft, so the
  public command grammar and support contract are not accepted
- the [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md)
  remains `not-ready`; no implementation language or package layout is selected
- there is no public CLI package, binary, installer, artifact signature,
  provenance record, supported-platform matrix, or maintenance owner
- structural schema checks do not implement the full semantic reference,
  policy composition, extension-profile, or conformance model
- the experimental JSON diagnostic catalog and envelope are not stable
- the prototype's application guardrails do not isolate it as an
  operating-system sandbox

No alpha announcement may omit these limitations merely because a repository
smoke suite passes.

## Verification Evidence

The dedicated [CLI Prototype workflow](../.github/workflows/cli-smoke.yml) runs
the current evidence suite:

```sh
npm run cli-prototype-smoke
npm run cli-validation-smoke
npm run cli-diagnostics-smoke
npm run cli-inspection-smoke
npm run cli-graph-smoke
npm run cli-init-smoke
npm run cli-no-runtime-guardrails-smoke
npm run cli-fixture-smoke
```

Before publication, record the exact source commit and successful CI run for
the release artifacts. Re-run the documented install and quick-start commands
against those artifacts on every supported platform; source-checkout evidence
alone is insufficient.

## Version Separation

| Version domain | Current state | Alpha publication requirement |
| --- | --- | --- |
| Manifest specification | `specVersion: "0.1"` | State the exact accepted range |
| NexFlow repository release | `v0.1.0` baseline plus unreleased changes | Identify the source tag or commit |
| Prototype JSON output | `0.4-draft` | Publish and test the supported output contract |
| Reference CLI package | Not selected | Assign a version without implying manifest compatibility |
| `NF-CLI` claim | None | Publish a scoped claim and evidence only if conformance rules permit it |

Changing one domain does not silently change another. In particular, a CLI
alpha must not advance manifest `specVersion` or claim a new NexFlow
specification release unless those changes complete their own review process.

## Publication Readiness

These notes remain blocked until maintainers complete all applicable items:

- [ ] Accept the CLI scope and related architecture decisions through the RFC
  process.
- [ ] Select package ownership, implementation language, distribution channel,
  release owner, and security owner.
- [ ] Freeze the public command grammar, discovery rules, exit statuses,
  diagnostic catalog, and output version for the alpha.
- [ ] Define the exact syntax, schema, semantic, inspection, graph, and init
  coverage included in the supported surface.
- [ ] Produce installable artifacts and record their tag, source commit,
  checksums, provenance, and signing status where applicable.
- [ ] Publish supported platforms, runtime prerequisites, installation steps,
  upgrade guidance, known issues, and the private security-reporting channel.
- [ ] Run the full repository suite and artifact-level smoke tests against the
  exact candidate on every supported platform.
- [ ] Verify that no command can authorize runtime execution or obtain ambient
  network, credential, provider, extension, or orchestration authority.
- [ ] Complete an independent cross-surface review of documentation, CLI help,
  package metadata, artifacts, compatibility statements, and release notes.
- [ ] Replace every `TBD`, change `Publication state` from `Blocked`, and obtain
  explicit maintainer approval for publication.

## Final Publication Shape

When the checklist is complete, the published release notes should retain this
order:

1. Exact version, date, tag, source commit, and support status.
2. Concise summary of what the alpha helps manifest authors do.
3. Verified installation and quick-start commands using released artifacts.
4. Supported commands and precise validation coverage.
5. Output and exit-status compatibility commitments.
6. Safety boundary, known limitations, and explicit non-goals.
7. Upgrade or migration guidance.
8. Verification, provenance, security-reporting, and feedback links.

Preparation of this draft is not a release decision. Publication requires a
separate reviewed change tied to the exact artifacts and evidence described
above.
