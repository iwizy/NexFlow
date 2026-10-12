# NF-102-01: validation and public diagnostic requalification

**Evidence collection complete; qualification not-ready.** This is a new,
scoped, native four-candidate record. It does not replace historical reports,
close the architecture gates, accept RFC-0023 or select a language.

## Exact inputs and observations

- Integration source: `e1b7d65d86194b0848c219be76010f7f7460fa2b` (PR #117).
- Repaired source: `9e13a54311735a36398eb89c4a39ff2949998998` (PR #114).
  Every tracked candidate file, lock and local schema is hash-checked against
  both commits. Their bytes are identical; no candidate or dependency repair.
- Collector: `224b968ce633c8e964d97819180fb468ab0c7762`. Collector files are
  checked against that committed revision before collecting and in smoke tests.
- Frozen specification: `1d1fa238ab5729a79bee9389d5c66cfd20a61256`.
- Corpus SHA-256: `01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`.
- Full catalog SHA-256: `f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.

The four JSON reports contain all 352 ordered library results, not just a pass
count: 211 semantic fragments, 8 workflow namespaces, 5 artifact namespaces,
113 manifest schemas (109 maintained examples and 4 negatives), 5 local schema,
3 YAML and 7 discovery cases. Expectations are kept outside native drivers;
the existing oracle and comparator are unchanged. Two outer batches each
evaluate twice: four evaluations per case, exact input immutability assertions,
two raw result hashes, first full observations and second canonical hashes.
Object-key order is ignored for comparison; diagnostic array order never is.

All four candidates pass the unchanged 352-case oracle and the bounded portable
library view. **Raw library parity does not pass:** the
`draft-2020-prefixitems-rejected` case retains Rust/Go `nativeDiagnostic`
details with different native categories/paths. Those details are retained,
not discarded, and are not a portable or stable public library API.

## Declared CLI scope and results

Each candidate is run twice on 59 cases: the 11 frozen CLI cases, both supported
commands in explicit-file/project/directory modes, JSON equals syntax, explicit
text output, six unsupported commands, eleven usage negatives, validate and
inspect for all eight maintained projects, redaction, canonical-root and
selected-source symlink behavior, absent root, diagnostic limiting and an
explicit project-semantic gap. Source fixtures are copied into fresh temporary
directories; content inventories are checked before and after the calls.

All four pass these 59 **within-candidate scope/transport/safety assertions**.
The reports preserve complete public envelopes, schema-to-public and
project-semantic bridge observations, input hashes and stdout/stderr hashes.
JSON is one newline-terminated object with empty stderr, matching exit state,
eight mandatory diagnostic fields, ordered diagnostics, bounded/redacted
locators, no native detail exposure, no input mutation and no runtime authority.

**Cross-candidate public parity fails.** Of 57 JSON cases, 56 agree and
`diagnostic-limit` differs. The same 230 invalid actor declarations produce
different branch-diagnostic sets, so sorting and truncation to 200 cannot make
the outputs equivalent. TypeScript retains 14 `oneOf`, 107 `required`, 66
`const`, 13 `enum`; Python/Rust retain 33/134/0/33; Go retains 0/115/70/15.
These are counts in the retained prefix, not total native errors. Failure is
not a sorting, repeatability or redaction failure: each candidate is repeatable
and sorted, but the emitted diagnostic meanings/paths differ.

[`comparison.json`](comparison.json) records this failed parity gate and hashes
the four complete reports. Evidence-integrity CI passes only when it reproduces
the **failed** comparison and its not-ready disposition. It does not convert
candidate parity into passed.

## Library → public mapping: `nf-102-01-observation-v1`

This evaluation observation mapping is not a new candidate implementation,
stable ABI or replacement oracle. Each observation retains `emittedFields`,
`nativeDetails`, original diagnostics and its catalog case/specification rule.

| Library surface | Observation and public boundary |
| --- | --- |
| Manifest/local schema | `code` → public `code`; `category` → `keyword`; `instancePath` → `path`; a `required` property extends the pointer with JSON Pointer escaping. The CLI adapter supplies root-relative `file`, known `kind`, `severity: error`, fixed message and empty related list. The multi-error redaction probe verifies this bridge against the same native library, independently of its CLI. |
| Discovery | Library exposes code only; public `file`, `related`, severity and message require assembly context. Frozen discovery/CLI pairs verify the shared codes and exit meaning. Missing library fields stay null/not-emitted. |
| YAML | Library exposes category (`syntax`/`duplicate-key`) only; discovery maps unsafe YAML to `NF-DISCOVERY-UNSAFE-SOURCE`, possibly alongside missing Project. This is contextual, not a one-to-one code renaming. |
| Semantic/workflow/artifact fragments | Retain code, category, instance path, emitted severity and reference context. There is **no semantic-library-to-public-CLI adapter** in these candidates. Do not fabricate severity/message for missing fields or claim these fragments ran on a CLI project. |

`meaning` is an evaluation key `operation:code-or-not-emitted:category-or-not-emitted`;
its specification meaning comes from the unchanged catalog case's
`specificationRule`, not human message equality. The portable comparison removes
only explicitly retained native-detail metadata and field-name inventory, not
code/category/path/severity/context or diagnostic order. CLI comparison keeps
all eight actual fields, including fixed messages and related locators.
The native parser/schema error prose, raw values and implementation-owned
`nativeDiagnostic` records never belong in public CLI diagnostics.

## Unsupported and not tested

Only `validate` and `inspect` are implemented. `run`, `init`, `discover`, `graph`,
`help` and `version` are rejected by these candidates, regardless of the broader
historical maintenance CLI. Core and extension profile validation and full
project semantics remain `not-run` on every CLI response. A schema-valid Project
with an unresolved agent bridge deliberately returns structural success while
the native semantic-fragment probe rejects that same assembled content.
**352 fragment passes are not full project semantic conformance.**

The recorded host is native macOS 27.0.1 ARM64, kernel 27.0.0, Apple M4 Pro,
14 CPUs: a supplemental cohort, not the frozen macOS 15 target. Exact pinned
Node 22.23.2, Python 3.12.14, Rust 1.99.0 and Go 1.27.1, installed Python
distributions, entry/interpreter hashes, candidate sources and locks are in
the reports. Trusted dependency provisioning precedes evaluation; a virtualenv,
offline build or ordinary process is not a sandbox or network-denial receipt.
Native Linux CI replays are supplemental too. Lifecycle, signing, offline OS
denial, supply-chain closure, comparable measurements and stable API approval
remain not-tested/not-established, outside this task's authority.

The initial supplemental root-symlink assertion was a collector error: frozen
policy canonicalizes an explicit root and rejects symlinked sources below it.
[`collector-preflight.json`](collector-preflight.json) retains that failed
assertion and its evidence-based correction. No frozen oracle was weakened.

## Reproduce

Build native candidates with their existing pinned locks and documented build
commands. Then, from the repository root:

```sh
node scripts/runtime-diagnostics-requalify-run.mjs typescript '["node"]' '["node","evaluation/prototypes/typescript/dist/cli.js"]' /tmp/typescript-diagnostics.json
node scripts/runtime-diagnostics-requalify-run.mjs python '[".venv/bin/python","-I","-B","evaluation/prototypes/python/library_driver.py"]' '[".venv/bin/python","-I","-B","evaluation/prototypes/python/cli.py"]' /tmp/python-diagnostics.json
node scripts/runtime-diagnostics-requalify-run.mjs rust '["evaluation/prototypes/rust/target/debug/library-driver"]' '["evaluation/prototypes/rust/target/debug/nexflow-rust-evaluation"]' /tmp/rust-diagnostics.json
node scripts/runtime-diagnostics-requalify-run.mjs go '["evaluation/prototypes/go/bin/library-driver"]' '["evaluation/prototypes/go/bin/nexflow-go-evaluation"]' /tmp/go-diagnostics.json
npm run runtime-diagnostics-requalification-smoke
```

Fresh runs must not overwrite these dated observations. The comparison generator
is for a deliberately prepared new complete four-report snapshot, not for
silently replacing the historical comparison.

## Required next authority

NF-102-01 remains an **open acceptance blocker**. A separate repair scope must
define and implement uniform branch-diagnostic projection before truncation
and re-run this exact failing workload without weakening it or the frozen
oracle. Also decide whether the stable public library API excludes native
detail fields or exposes a separate explicitly non-portable channel. Full
project semantics need an explicit supported-scope decision and evidence; they
cannot be inferred from a library-fragment pass. No candidate repair was
authorized or performed here.
