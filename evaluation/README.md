# Runtime Evaluation Packet

Status: preparation packet; no candidate selected or evaluated.

See the [preparation verification record](preparation-review.md) for performed
checks and their limits.

This packet turns the [language evaluation matrix](../docs/language-evaluation-matrix.md)
into a shared starting point for NF-056. It does not accept an architecture,
implement a runtime, release a CLI, or make an implementation support claim.

## Frozen Inputs

[baseline.json](baseline.json) fixes specification revision
`1d1fa238ab5729a79bee9389d5c66cfd20a61256`, 176 source files with SHA-256
digests, and 11 shared command cases. Its corpus includes the maintained
schemas, examples, fixtures, the historical diagnostic contract, and the
semantic smoke source and namespace helper.

The SHA-256 of the ordered file inventory is
`01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`.
Changing the corpus requires a new reviewed baseline and reevaluation of
affected candidates. A branch name or current checkout is not a substitute
for the immutable specification revision.

The evaluation package has a separate revision from the specification.
Candidate reports must pin both the committed package and their own prototype.
The package's later commit does not silently move the specification baseline.

## Shared Command Contract

The [shared library experiment](library-experiment.md) supplies the separate
declarative semantic/schema/YAML/discovery cases for all four candidates.
It does not expand the CLI contract or claim full semantic validation.

Every disposable candidate exposes only `validate` and `inspect`, accepts
an explicit `--root`, the cataloged `--project` or `--file` selection,
and `--format json`. Calling `run` is a rejection experiment, not an
additional implemented command.

[command-result.schema.json](command-result.schema.json) freezes the experimental
output shape for this comparison. It is derived from the pinned diagnostic
contract with a candidate-neutral tool name and version. Candidates must not
impersonate the repository prototype. This is a tooling contract, not a public
CLI API or a new manifest schema.

The initial shared cases cover valid structural validation, declared inspection,
malformed YAML, schema failure, unsupported versions and kinds, escaping source
hints, kind mismatch, ambiguous Project discovery, duplicate YAML keys, and
rejected workflow execution.

The duplicate-key case copies the pinned minimal project and appends the exact
text declared in the baseline. Every candidate receives the same transformed
bytes. Cases run twice; stdout must be identical, stderr empty, exit status and
diagnostics correct, and copied inputs unchanged.

The CLI contract keeps semantic, core-profile, and extension checks at
`not-run`. Semantic evaluation belongs to a separately documented library
experiment. The pinned semantic source records current limited coverage; it
does not turn the structural command into a semantic validator. Before candidate
eligibility review, extract the same supported semantic cases for all four
library prototypes and record unresolved references, namespace violations,
and unsupported coverage explicitly.

## Run The Packet Checks

Provision the repository's pinned maintenance dependencies separately:

```sh
npm ci --ignore-scripts
npm run runtime-evaluation-smoke
```

Use a checkout that includes the pinned specification commit in its history.
The preparation check compares the inventory both to checkout bytes and to
that commit. The dedicated CI job fetches history for this verification.

Where the exact dependencies have already been cached, provisioning may use
`npm ci --ignore-scripts --offline`. This does not prove that a candidate
enforces offline operation or has reproducible packaging.

Rehearse the shared command cases against the historical repository prototype:

```sh
node scripts/runtime-evaluation-run.mjs --command '["node","scripts/cli-prototype.mjs"]'
```

For a reviewed candidate, replace the JSON argv array with its executable and
fixed arguments. The runner uses argument arrays without a shell. Its working
directory is the evaluation checkout; each case receives a temporary copied
fixture. It writes no report into the repository.

The runner executes the supplied program. Review it first and run untrusted
candidates in an independently configured isolated environment. It does not
supply an operating-system sandbox, deny network access, guard subprocesses,
or prevent writes outside its copied input. Those remain hard-gate experiments.
A passing rehearsal covers only the checks named in its output.

Do not present the historical JavaScript prototype as the TypeScript candidate,
as performance evidence, or as a successful runtime evaluation.

## Candidate Records

Separate unstarted [TypeScript](candidates/typescript.json),
[Python](candidates/python.json), [Rust](candidates/rust.json), and
[Go](candidates/go.json) records are prepared from
[candidate-report.template.json](candidate-report.template.json).
Move status to `in-progress` when actual work starts. Leave unrun gates and targets
at `not-tested`. Positive or failed gate results require evidence references.

[candidate-report.schema.json](candidate-report.schema.json) checks record
shape. The report assessment helper also checks the shared revision and target
matrix, immutable package and prototype revisions, pinned toolchain references,
independent reviewer identifiers, reconciliation, evidence inventory, and all
seven measurement categories for each target.

Nonzero reviewer scores require evidence. Missing evidence is scored zero,
following the original matrix. Do not assign scores from language reputation.

Assess a filled record with:

```sh
npm run runtime-evaluation-report -- evaluation/candidate-report.template.json
```

The untouched template returns `not-ready` and a nonzero exit status.
Passing the shape schema alone cannot turn it into completed evidence.

`candidate-evidence-complete` is an inventory result. It does not verify that
a linked report is authentic, that its claims are true, that reviewer identities
are independent people, or that source links and artifacts are immutable.
Human review must verify those properties and the
[architecture decision gates](../rfcs/reviews/runtime-architecture-decision-review.md).
The helper never returns an accepted architecture decision.

## Confirmed Experiment Targets

The [common environment and measurement contract](environments.md) fixes native
runner selection, fingerprint checks, workloads, repetitions and evidence rules.
Infrastructure probe success does not imply successful candidate evaluation.

Alexander confirmed the common measurement matrix on 2026-10-01:

- Linux AMD64.
- macOS ARM64.
- Windows AMD64.

These are mandatory experiment targets, not supported release targets.
Existing project CI checks only Linux. This preparation packet
does not add successful Windows or macOS CI results or infer support from a
cross-build. Confirm exact OS versions, runner images, system libraries and
installation methods before comparison. Apply any matrix change to every
candidate under the same package revision.

For each target record native or cross-build mode, install prerequisites,
artifact digest and size, clean install, offline use, upgrade, rollback,
uninstall, signing path, dependency and license inventories, vulnerability
results, provenance, and measurement method. Missing target access remains a
visible blocker.

## Ordered Work To Reach NF-056 Review

1. Use the committed packet and confirmed target matrix; name the prototype
   owners and two independent evidence reviewers. The target confirmation
   does not identify or appoint reviewers.
2. Prepare four disposable candidate prototypes against the same baseline.
   Pin exact toolchains, YAML and draft 2020-12 schema libraries, transitive
   dependencies, and build commands. No provider calls, credentials, executable
   extensions, workflow execution, or remote mutation are permitted.
3. Port and exercise the selected semantic/library boundary cases. Validate all
   maintained examples and negative schema cases, not just the 11 CLI cases.
   Verify diagnostic parity without relying on one validator's raw error text.
4. Run isolation and offline experiments; prove the deny harness is active.
   Record negative filesystem, network and subprocess results, secret redaction,
   supply-chain evidence and residual limitations.
5. Produce and test target artifacts, installation lifecycle and measurements.
   Keep each command, log and artifact linked to the evaluated revisions.
6. Have two reviewers score independently using the existing weights, then
   reconcile scores and retain failed gates. A failed hard gate makes the
   candidate ineligible regardless of its weighted score.
7. Draft the decision RFC with the proposed language and package layout,
   comparing shared-language/shared-package, shared-language/separate-package,
   and split-language alternatives. Close ownership, compatibility, credential,
   extension/provider, event/audit, packaging and conformance review blockers.
8. Record the maintainer review outcome. Runtime implementation starts only
   after an accepted decision, within its named scope.

The preparation milestone is complete when the pinned packet, shared-case
rehearsal, report rejection tests and documentation checks pass. NF-056 remains
`not-ready` until actual candidate evidence and the architecture proposal
pass their published review gates.
