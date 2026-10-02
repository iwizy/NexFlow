# Candidate Toolchains

Status: NF-056-04 tooling preparation, not candidate evaluation.

[toolchains.json](toolchains.json) pins four separate dependency/build plans.
The exact graph is in each lockfile; its byte digest and capability source
digests are checked by npm run runtime-toolchain-smoke. Changes require reviewed
new locks, a repeated probe and updated receipts, not a silent version range.

| Candidate | Compiler or interpreter | YAML / Draft 2020-12 | CLI / packaging plan |
| --- | --- | --- | --- |
| [TypeScript](typescript/README.md) | Node 22.23.2, TypeScript 7.0.2 | yaml 2.9.0 / AJV 8.20.0, ajv-formats 3.0.1 | Node parseArgs / npm 10.9.8 private tarball |
| [Python](python/README.md) | CPython 3.12.14 | PyYAML 6.0.3 / jsonschema 4.26.0 | argparse / build 1.3.0, setuptools 80.9.0, wheel 0.45.1 |
| [Rust](rust/README.md) | rustc and Cargo 1.99.0 | yaml-rust2 0.11.0 / jsonschema 0.58.4 | std::env / Cargo native release executable |
| [Go](go/README.md) | Go 1.27.1 | go.yaml.in/yaml/v3 3.0.4 / jsonschema/v6 6.0.2 | flag / cgo-free native executable |

These choices bound a disposable experiment. They do not select a language,
change specification version 0.1 or authorize a release. CLI parsing and artifact
production are plans for the later prototypes, not implemented public commands.
Standard-library CLI tools inherit the pinned runtime version and add no package.

## Actual Capability Evidence

[probe-cases.json](probe-cases.json) contains 11 **additional generic dependency
probes**, identical for all four languages: local relative schema references,
invalid referenced types, Draft 2020-12 tuple/items behavior, date format
assertion, unavailable-reference rejection, malformed/duplicate YAML and basic
scalar meaning. It neither replaces nor edits the frozen 176-file corpus,
11 shared CLI cases or 352 [library cases](../library-experiment.md).

Each native macOS ARM64 capability program was executed twice on 2026-10-02.
All 44 result/expectation comparisons passed, stdout was identical between each
pair, stderr was empty, and the probe input bytes remained unchanged. The four
probe-result.json records retain raw structured diagnostic differences.
Checksums bind the reviewed inputs and locks; they are not signed provenance.

Verified preparation commands:

- TypeScript: offline npm ci with lifecycle scripts disabled, then npm run build.
- Python: a fresh venv installed all 15 pinned packages from a prepared local
  wheelhouse with --no-index, --require-hashes and --only-binary=:all:.
- Rust: cached cargo build --frozen using the exact compiler, standard library
  and Cargo distributions whose download checksums are in the manifest.
- Go: go mod verify and a cached read-only module build with GOTOOLCHAIN=local
  and GOPROXY=off; no automatic compiler download.

Network-backed provisioning is separate from these commands and the probes.
Runtime archives, package caches and venvs were provisioned outside the source
checkout in a task-specific temporary directory; no global toolchain was changed.
Node/CPython were existing exact-version runtimes. Their download provenance
still needs independent evidence in the later supply-chain task.

To rerun one reviewed program from the repository root:

~~~sh
node scripts/runtime-toolchain-probe-run.mjs --candidate typescript \
  --command '["node","evaluation/toolchains/typescript/dist/probe.js"]'
npm run runtime-toolchain-smoke
~~~

Use the executable argv array for the other candidates from their instructions.
The runner appends the common case file and uses no shell. It checks two executions,
their expected properties and probe-input immutability; it emits JSON to stdout.
It does not install dependencies or write candidate reports.

The runner executes trusted reviewed code and **is not an OS sandbox**.
Offline package-manager modes and a rejecting schema loader do not prove
network, filesystem or subprocess isolation. Linux/Windows candidate results,
all distribution lifecycle evidence, full dialect fidelity, independent review
and hard gates remain not-tested. Existing CI checks lock/source consistency
and saved evidence only; it does not rerun four native capability programs.

## Known Differences And Follow-up

- PyYAML's boolean/timestamp and duplicate-key adapters are needed for the tested
  scalar meanings. Numeric resolution and aliases are not yet full YAML 1.2 proof.
- Go's node adapter preserves date-looking scalar text and rejects duplicate or
  non-string keys. Alias conversion remains unsupported in this probe.
- For items:false, TypeScript/Python report the array root and items, Rust
  reports /2 and items, and Go reports /0 with an empty raw keyword.
  Negative validity agrees, **diagnostic parity does not**. The shared library
  catalog already requires more precise properties; later adapters must meet
  those unchanged expectations or retain the failure.
- Exotic YAML tags, aliases, non-finite numbers, complete NexFlow semantic rules,
  human-readable diagnostics and input/resource bounds need the full prototypes.
- Locks do not settle license, vulnerability, signing, artifact reproducibility,
  clean install/upgrade/rollback/uninstall, or environment fingerprint drift.
  They cannot remove the [common environment contract](../environments.md).

The unstarted candidate scorecards remain unchanged. NF-056-05 and NF-056-06
implement independent TypeScript and Python prototypes against the committed
evaluation package; Rust/Go prototypes and the parity/isolation/distribution
tasks follow. No maintenance JavaScript validator is counted as a candidate.
