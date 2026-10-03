# Four-Candidate Fidelity And Diagnostic Review

NF-056-09 compares unchanged native TypeScript, Python, Rust and Go source
candidates on the complete frozen experiment. It does not implement missing
semantics, choose a language, assign reviewer scores or accept an architecture.

The [immutable source pins](source-pins.json) name each complete prototype commit,
its separately published PR/HEAD and successful prerequisite CI run. TypeScript
and Python are merged through PR #95/#97. Rust #99 and Go #100 are separate open
PRs: this comparison does not merge or copy their code into main. Reports can
reference exact Git commits even when a prerequisite PR remains open.

## Reproduce The Experiment

Prepare four separate clean checkouts at the exact `sourceRevision` values in
the pins, never moving branch tips. Provision the approved NF-056-04 compilers,
dependency locks and caches separately, then build the reviewed candidates:

- TypeScript: Node 22.23.2/npm 10.9.8, locked `npm ci --ignore-scripts`, then
  `npm --prefix evaluation/prototypes/typescript run build`.
- Python: CPython 3.12.14 with the reviewed hash-locked venv; its own source
  `library_driver.py` and CLI run with `-I -B`.
- Rust: rustc/Cargo 1.99.0, `cargo build --frozen --manifest-path
  evaluation/prototypes/rust/Cargo.toml`; keep its source checkout available.
- Go: Go 1.27.1, verified approved go.mod/go.sum, `GOTOOLCHAIN=local GOPROXY=off
  CGO_ENABLED=0 go build -mod=readonly -trimpath -buildvcs=false`, separately for
  `./cmd/cli` and `./cmd/library-driver` at their documented `bin` paths.

From the comparison checkout, provision the maintenance Node dependencies with
the repository's pinned lock. The runner accepts a candidate ID and reviewed
local configuration as a JSON argument:

```sh
node scripts/runtime-fidelity-run.mjs typescript '{"sources":{"typescript":"TASK_TYPESCRIPT","python":"TASK_PYTHON","rust":"TASK_RUST","go":"TASK_GO"},"python":"TASK_PYTHON_EXECUTABLE"}'
```

Replace each TASK value with a prepared path. Repeat for Python, Rust and Go with
the same configuration. An optional `rustBinaries` selects a reviewed shared
Cargo target directory when used during provisioning. All source HEADs and
frozen corpus/catalog bytes are checked. No local paths are put in reports.
The harness prints one JSON report, never writes evidence files itself, and
returns nonzero for a tested contract failure. Unsupported cases remain
`not-tested`; a nonzero fidelity gate is not replaced by process success.

These are trusted source processes, not sandboxed programs. Review them before
execution. The harness is not an OS deny mechanism and does not claim complete
network/filesystem/credential/subprocess isolation.

## Comparison Method And Limits

Every candidate receives the same 352 identities/inputs from the unchanged
catalog, without expected properties or the historical oracle. There are two
independent native-driver processes; each driver evaluates every case twice and
checks input immutability, giving four native evaluations per library case.
No candidate invokes another candidate as a validation backend. The Node
adapter for TypeScript calls its own independently compiled library.

The common comparator is unchanged. Library results retain every identity,
operation, supported validity and normalized diagnostic field, including
category/code/pointer/kind/required-property where actually supplied. Native
`items: false` observations are retained separately, not silently erased.
Missing library severity is not invented: severity is checked in the CLI
envelope, not established for unsupported or severity-less library operations.

All 11 frozen CLI cases run twice in JSON and twice in text with copied inputs.
Checks cover exit status, empty stderr, deterministic bytes within each format,
diagnostic order, file/path/keyword values, severity, code and same-candidate
message meaning, complete declared inspection and input immutability. JSON
object key order, candidate tool identity and translated message wording are not
cross-candidate requirements. Array order and meaningful diagnostic fields are
not discarded to hide mismatches. Text JSON literals are decoded before value
comparison, so equivalent Unicode escaping is not a diagnostic mismatch.

One supplementary synthetic schema-type canary tests non-disclosure of an
unknown field/value and absolute fixture/source roots in both formats. It is
reported separately and never added to the frozen catalog. It is not a secret
detector, an isolation claim or an additional specification rule.

Preflight repairs are preserved in the methodology: the first canary mistakenly
expected rejection of a new top-level property, which the reviewed Project
schema permits; it was changed to an object value in the required string
`project.description` field. The first text comparison treated equivalent Go
Unicode JSON escaping of `<input>` as unequal bytes; it now compares decoded
file/path/keyword values, with a rejection/regression test. No candidate,
catalog, expected result or oracle was changed for either repair.

Full semantic-fragment and workflow/artifact namespace coverage is required for
eligibility. An unsupported verdict is `valid: null`/`not-implemented`, never a
schema or semantic success. These missing cases fail the specification-fidelity
gate; the full diagnostic gate remains not-tested. Other architecture gates,
target lifecycle/support, supply-chain acceptance, measurements and independent
review remain separate. A complete comparison report is not complete candidate
evidence or an accepted architecture.

## Evidence

The native macOS ARM64 run uses comparison harness commit
`4b1a33f9ea973132f231f2c6b78261b8f739a0b3`. The complete case-by-case
[comparison](comparison.json) contains no supported-result mismatch: all 128
implemented library cases and 11 CLI meanings agree across four candidates.
Agreement on 224 unsupported cases is deliberately not a pass.

| Candidate report | CLI cases, JSON/text twice each | Library passed | Library failed | Library not-tested |
| --- | --- | --- | --- | --- |
| [TypeScript](typescript.json) | 11 | 128 | 0 | 224 |
| [Python](python.json) | 11 | 128 | 0 | 224 |
| [Rust](rust.json) | 11 | 128 | 0 | 224 |
| [Go](go.json) | 11 | 128 | 0 | 224 |

The implemented 128 consist of all 109 maintained manifests, four negative
manifest fixtures, five local-schema cases, three YAML cases and seven discovery
cases. All 211 semantic fragments and 13 workflow/artifact namespace cases are
unsupported. Each candidate also passes the separately recorded schema-type
redaction canary in both formats twice. The full catalog's broader unsupported
inventory remains outside these experiments; this is not complete specification
coverage.

Each report records specification fidelity as **failed** because mandatory
semantic/namespace evidence is missing, and full deterministic diagnostics as
**not-tested**. These scoped findings do not automatically rewrite initial
candidate scorecard templates or constitute the later NF-056-17 reconciliation.
No language winner or architecture score is produced.

Run `npm run runtime-fidelity-smoke` to verify source pins, rejection behavior and
the four committed reports when present. It recomputes normalized agreement,
checks every frozen identity and retains unsupported/mismatch rows. CI runs
these evidence-consistency checks; initial candidate native CI links are in the
source pins. Local native fidelity reports are not silently relabeled as CI or
target distribution results.
