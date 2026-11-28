# NF-120 Independent Implementation Comparison

Status: **comparison-recorded-with-gaps**, 28 November 2026. This completes
the comparison task, not the NF-121 release review or a conformance claim.

## Subjects And Exact Inputs

Both subjects use source revision
`bd5cd4140801f205746fac17ea9d3a258993011c`:

- Reference: the built public `@nexflow/validation` entry, its read-only
  workspace facade and actual reference CLI source entry. Internal semantic
  modules and arbitrary-schema helpers are deliberately not exposed as public
  support by the adapter.
- Independent implementation: the existing native Python evaluation candidate,
  including its native parser, schema, discovery, semantic and CLI modules.
  PyYAML, jsonschema and referencing implement its backend. It neither imports
  the reference package nor invokes JavaScript. This is implementation
  independence, not an independent person, external review or distribution.

No candidate code, dependency lock, schema or expected result was repaired for
this task. [Summary and source pins](nf-120-evidence/summary.json) identify every
implementation file, compiled payload, adapter hash and actual dependency
version. The accepted [NF-119 corpus](interoperability-corpus.md) is unchanged:
447 cases, 11 profiles, SHA-256
`d080a4cf0cfc82a16d74b9b43f5d24b3f7949970b106b763f7922447f8af5439`.
Input files are materialized from
`a7dd64df680babaf9dcf26fcea181c41f30f8ea2`, checked against all source pins,
then combined with the five hash-verified frozen artifacts. No moving
working-copy examples are substituted.

The recorded local cohort is native macOS 27.2.1 ARM64, kernel 27.2.0,
Node 26.13.1, TypeScript 6.0.3 and CPython 3.12.15. The reference graph uses
AJV 8.20.0 / ajv-formats 3.0.1 / yaml 2.9.0; the Python graph uses PyYAML 6.0.3 /
jsonschema 4.26.0 / referencing 0.37.0. All nine installed Python dependencies
are listed in the receipt. These are source comparison environments, not a
renewal of the frozen three-platform lifecycle or benchmark target contract.
CI independently reruns the same protocol on Ubuntu 24.04 with the exact
Node/Python versions and records its own environment and payload digests.

## Observed Results By Profile

Each subject has all 447 records; unsupported operations remain explicit.
Both implementations were run twice in the same case order. Original output
values and diagnostic order repeated exactly; all selected input byte digests
remained unchanged. A parsed input object is also checked for mutation after
each library call. Original JSONL responses, their SHA-256 values and normalized
reports are retained below.

| Profile | Cases | Common exact matches | Common differences | Outside common scope |
| --- | ---: | ---: | ---: | ---: |
| Manifest schema | 113 | 112 | 1 | 0 |
| YAML parser | 3 | 3 | 0 | 0 |
| Discovery | 7 | 6 | 1 | 0 |
| Migration schema | 15 | 15 | 0 | 0 |
| Public CLI | 7 | 0 | 3 | 4 |
| Static fragments | 224 | 0 | 0 | 224 |
| Local schema engine | 5 | 0 | 0 | 5 |
| Historical prototype CLI | 15 | 0 | 0 | 15 |
| Claim format | 37 | 0 | 0 | 37 |
| Extension metadata | 17 | 0 | 0 | 17 |
| Runtime boundary | 4 | 0 | 0 | 4 |

The common supported intersection contains **141 cases: 136 exact matches and
5 differences**. Validity or CLI acceptance/rejection decisions agree in all
141. This is not a global success rate: another **306 cases** remain outside
the intersection. The reference executes 145 cases and records 302 unsupported;
Python executes 378 and records 69 unsupported. Neither has adapter errors or
unrecorded cases in the qualified runs.

## Retained Differences

1. `library/schema-negative-unknown-kind`: both reject. The public reference
   boundary emits `NF-DISCOVERY-UNSUPPORTED-KIND` with a relative source locator;
   Python's schema experiment emits `NF-SCHEMA`, category `unknown-kind`, empty
   pointer and structured native kind context, without a file locator. Schema
   execution remains not-run for this unsupported-kind boundary. The reference
   does not meet the historical experiment's `NF-SCHEMA` diagnostic expectation;
   its public boundary is not rewritten to make the old oracle pass.
2. `library/discovery-reject-source-outside-root`: both reject with
   `NF-DISCOVERY-OUTSIDE-ROOT`. Reference locates the offending declaration in
   `project.yaml`; Python emits `<redacted-source>`. Those locators remain
   different, rather than being collapsed into a generic failure.
3. `public-cli/validate-minimal`: both accept the same three documents with
   exit 0 and the same projected result. Python does not emit the reference
   envelope's explicit `projection` or `runtime` check fields. Missing layer
   declarations stay missing in the observed envelope.
4. `public-cli/inspect-minimal`: exit, resources, references, IDs and declared
   inspection agree. Reference explicitly reports projection passed/runtime
   not-run; Python lacks those envelope fields.
5. `public-cli/unsupported-dialect`: both reject the synthetic 0.2 input with
   exit 3 and `NF-DISCOVERY-UNSUPPORTED-VERSION`. Python additionally emits
   `NF-DISCOVERY-NO-PROJECT`, and the envelope fields differ as above. Diagnostic
   multiplicity is retained; no extra diagnostic is discarded.

These are findings for NF-121 to reconcile, not automatic permission to repair
implementations or change the corpus. The summary separately retains each
subject's oracle findings, including missing CLI layers and the extra Python
diagnostic. Agreement between subjects does not override expected results.

## Unsupported And Untested Scope

- Python executes all 224 fragment cases and the five local-schema experiments.
  The public reference library has no corresponding fragment/arbitrary-schema
  entry. Python-only observations are not cross-implementation passes or full
  semantic coverage.
- Python executes eight validate/inspect cases from the old CLI catalog;
  seven old commands are unsupported. The public reference CLI is not relabeled
  as that historical protocol. Its seven public cases run, while Python shares
  only the three validate/inspect/unsupported-dialect cases. Graph and the
  remaining public command cases stay outside the common intersection.
- Claim-format and extension-registry disposition interfaces are unsupported
  by these selected product/evaluation entries. Earlier repository fixture
  checks are not reused as independent implementation passes. Their 54 records
  remain visible with no invented runtime or extension authority.
- All four runtime capabilities are unsupported and **not executed**. No
  workflow, provider/network call, credential binding or executable extension
  was attempted. The separate synthetic source-host fixture was not run or
  used as runtime interoperability evidence. Full semantics, policy composition,
  general migration equivalence, performance and target lifecycle remain outside
  this experiment. No winner or release readiness is inferred.

An initial macOS rehearsal used the operating system's temporary-directory
alias. Reference rejected that root under its symlink-component policy, while
Python canonicalized it. That setup did not qualify the intended canonical-root
workload. The controller now resolves its own newly created temporary root
before either subject receives it; candidate code and fixture bytes are
unchanged. The earlier rejection is retained as a supplemental root-policy
observation, not reclassified as a pass or an OS isolation result.

## Evidence And Reproduction

- [Comparison, revisions, environment, payloads, per-case oracle findings](nf-120-evidence/summary.json)
- [Reference normalized observations](nf-120-evidence/reference.json)
- [Python normalized observations](nf-120-evidence/python.json)
- [Reference raw run 1](nf-120-evidence/reference-run-1.jsonl) / [run 2](nf-120-evidence/reference-run-2.jsonl)
- [Python raw run 1](nf-120-evidence/python-run-1.jsonl) / [run 2](nf-120-evidence/python-run-2.jsonl)

After provisioning the unchanged lockfiles and exact runtimes, build the library
and CLI as documented in [CONTRIBUTING](../../CONTRIBUTING.md), then provision
Python with `scripts/evaluation-python-provision.py` and the current hash lock.
The existing [provisioning workflow](../../.github/workflows/interoperability-comparison.yml)
shows exact commands. Functional comparison itself needs no dependency fetch.

```sh
node scripts/interoperability-corpus-smoke.mjs
node scripts/interoperability-comparison-smoke.mjs
node scripts/interoperability-compare.mjs /path/to/locked/python /path/to/new/report-directory
node scripts/interoperability-comparison-smoke.mjs /path/to/new/report-directory
```

Only the controller reads expected results. Each native driver receives case
identity, profile, operation and input. Native diagnostic fields are preserved:
category/keyword, code, relative file, exact pointer, severity and explicitly
supplied structured context. Absent details remain null; native prose is not
translated into invented meaning. Raw order is compared before sorting; the
cross-implementation view sorts diagnostic tuples while preserving duplicates.
Root/canary/native-exception/source-document leaks fail before normalization.
Public authored IDs and the declared inspect projection remain visible.

CI success means this reproducible, gap-bearing record was checked. It does
not mean all 447 cases passed, that Python is a supported public package, or
that the public CLI gained semantic/extension/runtime support. Specification
`0.1 Draft` remains the comparison baseline. [NF-121's version/Draft decision](specification-version-review.md),
release review, task merge and publication are separate actions. The corpus
guide and preliminary version assessment are frozen NF-119 records; their
pre-comparison wording retains that historical scope. Current status is
recorded here and in the README/roadmap/compatibility matrix.
