# Reference CLI Release Dry Run

Status: source-checkout rehearsal notes; no reference CLI alpha has been
released or approved.

This procedure lets maintainers rehearse the evidence collection and review
needed for a future validation-focused CLI alpha. It is deliberately a **dry
run**: it neither builds a distributable CLI nor creates a tag, package,
release, conformance claim, or public support commitment. The current runnable
surface is the unreleased [repository CLI prototype](cli-prototype.md), not a
supported `nexflow` executable.

Use these notes with the [0.4 Alpha Preparation Checkpoint](0.4-alpha-checkpoint.md)
and [Draft Reference CLI Alpha Release Notes](cli-alpha-release-notes.md). The
checkpoint's recorded outcome is `not-ready`; a successful rehearsal cannot
override its architecture, scope, packaging, ownership, or artifact blockers.
The [Release Plan](release-plan.md) places a possible tooling preview in `0.5`,
not in the `0.4` runtime-decision milestone.

## Rehearsal Boundary

- Evaluate one exact, reviewed source commit in a clean checkout. Record the
  full commit hash; a moving branch name is not an evidence identifier.
- Use Node.js 20 or newer and the repository's pinned npm dependencies. Record
  the platform and tool versions used for each run.
- Keep the checkout free of provider credentials and release publishing
  credentials. Do not run a workflow, provider call, integration, or runtime.
- Run `init` only in a newly created, disposable directory outside the source
  checkout. It writes three starter manifests; the other CLI examples are
  read-only.
- Never interpret a passing structural check as complete semantic validation,
  execution authorization, an operating-system sandbox, or `NF-CLI`
  conformance. See the [CLI and runtime boundary](cli-runtime-boundary.md).
- Do not create a tag or publish an artifact as part of this procedure. A
  separate, explicit release decision is required after every mandatory gate
  has passed against the exact candidate.

## Source-Checkout Rehearsal

Run the following from the root of a clean checkout of the selected commit.
If the commit, lockfile, scripts, or documentation changes, restart the
rehearsal and give the new run its own evidence record.

```sh
git rev-parse HEAD
git status --short
node --version
npm --version
npm ci --ignore-scripts
npm run documentation-navigation-smoke
npm run validate
npm run cli-prototype-smoke
npm run cli-validation-smoke
npm run cli-diagnostics-smoke
npm run cli-inspection-smoke
npm run cli-graph-smoke
npm run cli-init-smoke
npm run cli-no-runtime-guardrails-smoke
npm run cli-fixture-smoke
```

The checkout should be clean before and after the run. Record each command's
exit status and output location, including any failure. `npm ci` can contact a
package registry to obtain pinned dependencies; it is **not** an offline
installation test. The CLI operations themselves are designed to use local
manifest inputs without remote checks. The dedicated [CLI Prototype CI
workflow](../.github/workflows/cli-smoke.yml) runs the eight CLI checks above;
record its run and tested revision separately from local results. This is a
CLI-focused rehearsal, not the full repository suite. Also record the
[Schema Validation CI workflow](../.github/workflows/schema-smoke.yml) and
its tested revision before considering a broader candidate review.

In a network-enabled review environment, run `npm audit --audit-level=high`
against the installed lockfile and record any advisory, affected dependency
chain, and triage decision. A nonzero audit result does not prevent collecting
the remaining rehearsal evidence, but it is an unresolved security-review
item for an actual release. Do not run an automatic dependency fix as part of
the dry run; a changed lockfile requires a new revision and test cycle. This
advisory check is separate from the CLI's offline operation boundary.

Exercise the current command surface from the same checkout:

```sh
node scripts/cli-prototype.mjs --help
node scripts/cli-prototype.mjs validate --root examples/minimal-team
node scripts/cli-prototype.mjs inspect --root examples/minimal-team
node scripts/cli-prototype.mjs graph --root examples/minimal-team
node scripts/cli-prototype.mjs validate --root examples/minimal-team --format json
```

The expected result is successful local validation, bounded declared
inspection, and a static graph. The JSON result should identify the
experimental `formatVersion: "0.4-draft"`, report its check states, and keep
`executionAuthorized: false`. It is not the final public output contract. Use
the direct Node invocation for JSON so npm lifecycle text cannot contaminate
stdout. See [Reference CLI](reference-cli.md) for command and exit-status
meaning and [CLI Diagnostics](cli-diagnostics.md) for output limits.

Rehearse the sole bounded write in a disposable directory, without touching
the source checkout or an adopter project:

```sh
pilot_dir=$(mktemp -d)
node scripts/cli-prototype.mjs init --root "$pilot_dir" --id cli-dry-run
node scripts/cli-prototype.mjs validate --root "$pilot_dir"
node scripts/cli-prototype.mjs inspect --root "$pilot_dir"
node scripts/cli-prototype.mjs graph --root "$pilot_dir"
git status --short
```

Record the selected disposable directory privately and review its three
generated files before any cleanup. `init` does not itself validate its output
and has no overwrite mode. Do not include local absolute paths, machine names,
or manifest contents in public evidence unless they have been reviewed for
disclosure. An unexpected write, network request, credential access, or
`executionAuthorized: true` is a stop condition, not a passing dry run.

## Evidence Record

Keep one review record per exact candidate commit, outside the candidate
commit when it would otherwise be self-referential. A review record should
include:

| Field | Required evidence |
| --- | --- |
| Candidate identity | Full source commit, proposed CLI package/version if one exists, and the manifest, repository, and JSON output versions stated separately. |
| Environment | Operating system, architecture, Node.js and npm versions, dependency lockfile revision, and clean-checkout state. |
| Local checks | Command list, exit statuses, dated output or retained logs, failures, and the exact commit used. |
| CLI examples | Results for help, validate, inspect, graph, JSON output, and isolated starter creation; record the selected input scope. |
| CI | Workflow URLs, conclusions, tested refs and commits, pull request head if applicable, and any difference from the local candidate or environment. |
| Safety review | No-runtime guardrail result, `executionAuthorized` value, dependency-audit findings and triage, observed effects, and any unresolved limitations. |
| Cross-surface review | Agreement between help, documentation, candidate notes, package metadata if present, compatibility statements, and actual behavior. |
| Gate decision | Named reviewers, timestamp, checkpoint gate states, blockers, and an explicit `blocked`, `rehearsal-passed`, or separately approved release decision. |

`rehearsal-passed` means only that the source-checkout procedure produced the
expected evidence at that revision. It is not an alpha-ready status. Failed or
missing evidence stays visible; do not replace a failed result with a later
pass without identifying the changed revision or environment.

## Stop And Promotion Gates

Stop the rehearsal and mark it blocked if the checkout is dirty, a required
command fails unexpectedly, the source revision changes mid-run, or output
exceeds the documented effect or disclosure boundary. A pull request workflow
may test a synthetic merge revision rather than its head commit; record both
identities and do not count that run as exact-candidate CI evidence. Resolve
missing evidence and rerun against one pinned revision. A documentation-only
or source-only pass does not close a missing release artifact gate.

Before an actual alpha decision, the project still needs an accepted runtime
architecture and CLI scope, package and security owners, frozen public command
and output contracts, a supported-platform matrix, installable candidate
artifacts with integrity and provenance evidence, artifact-level tests on each
supported platform, a scoped conformance decision, and an independent review.
The [alpha release notes](cli-alpha-release-notes.md#publication-readiness)
list the publication checklist. When artifacts exist, test installation and
upgrade from those exact artifacts in clean environments; do not substitute
this source-checkout rehearsal for that work.

Until the blockers close, keep the alpha notes in pre-publication draft state,
and make no release or `NF-CLI` claim. This rehearsal changes no package,
repository, manifest, or output version.
