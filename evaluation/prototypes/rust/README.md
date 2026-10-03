# Disposable Rust Validation Candidate

NF-056-07 independently implements local structural `validate` and declared-only
`inspect`, with a native library entry. It uses neither the historical JavaScript
CLI nor another candidate as a backend. This is a private source-bound experiment,
not a runtime, published package, accepted architecture or distribution claim.

## Pinned Build And Checks

Use rustc and Cargo 1.99.0 with the native standard library and linker. Provision
these separately in a task-local prefix, using the reviewed archive checksums in
[the common plan](../../toolchains/toolchains.json). Do not change a global
compiler. The direct dependencies are jsonschema 0.58.4 (default features off),
serde_json 1.0.145 and yaml-rust2 0.11.0. The complete Cargo.lock graph equals
the approved NF-056-04 lock except for the local package name; no crate was added.

From the repository root, use the provisioned exact compiler and task-local
CARGO_HOME. Network-backed `cargo fetch --locked` is a separate provisioning
step; the actual build and tests use the frozen cached graph:

```sh
cargo +1.99.0 build --frozen --manifest-path evaluation/prototypes/rust/Cargo.toml
cargo +1.99.0 test --frozen --manifest-path evaluation/prototypes/rust/Cargo.toml
npm ci --ignore-scripts
npm run runtime-rust-prototype-smoke
node scripts/runtime-evaluation-run.mjs --command '["evaluation/prototypes/rust/target/debug/nexflow-rust-evaluation"]'
node scripts/runtime-rust-library-run.mjs evaluation/prototypes/rust/target/debug/library-driver
```

The `+1.99.0` syntax assumes separately provisioned rustup; direct exact-version
Cargo with RUSTC/RUSTDOC overrides also works without installing rustup globally.
Cargo build scripts and procedural macros in the locked graph are build-time
dependencies, not evidence of build isolation. The CLI and library driver are
native executables with no interpreter/backend process. This initial debug build
is not a reproducible release artifact. Release/native target packaging,
installation lifecycle, linking inventory and cross-platform execution remain
later tasks. CI repeats the initial checks on Linux, not distribution testing.

## Library And Read-only Inputs

The public source library exposes `Selection`, `Manifest`, `discover`,
`SchemaEngine`, `parse_yaml`, `evaluate`, `inspection::inspect` and
`evaluate_library_case`. These return data without printing or exiting.
Projection and low-level schema helpers do not assert a complete valid assembly;
use `evaluate` for ordered discovery, schema checks and failure-suppressed
inspection. Trusted callers provide the reviewed schema engine explicitly.

Only `validate` and `inspect`, an explicit `--root`, optional `--project` or
repeated `--file`, and `--format json|text` are accepted. Singleton duplication,
unknown options and mixed selections fail before manifest reads. JSON/text use
the same fixed diagnostic meaning and escaped source/path/keyword fields.

Inputs are root-relative regular UTF-8 YAML, at most 128 files and 1 MiB each.
Traversal, remote-like locators, symlink source components and nonregular files
fail closed. Linux/macOS final opens use no-follow/nonblocking flags. Parent
replacement races and Windows equivalent race protection remain untested; this
is not OS isolation. The root is explicitly canonicalized. No recursive scan or
manifest-selected code/schema loading occurs. Source-bound CLI schemas are
anchored to the reviewed build checkout, which must remain available; moving or
distributing this executable is not supported by the initial experiment.

YAML preflight limits nesting to 100 and events to 200,000 before conversion;
JSON conversion also has a 200,000-value budget. One document, unique string
mapping keys and finite JSON-compatible values are required. Aliases and explicit
tags are rejected, not silently expanded or treated as executable content.
Those restrictions, numeric scalar limits and complete YAML fidelity require
later parity review; passing three shared YAML cases does not settle the dialect.

Draft 2020-12 and format assertion are explicit. Reviewed local registry resources
and `.offline()` resolution are used with default retrieval features disabled;
no simpler dialect or external schema fetch is a fallback. The `items:false`
adapter normalizes the rejected member to its containing array constraint and
retains the native `falseSchema` keyword/member pointer in library diagnostics.

Fixed messages omit source values and raw exception text. Pointers redact fields
outside the schema allowlist; diagnostics sort and truncate at 200. Inspection
projects only selected declarations/references, with 1,000/2,000 budgets. IDs and
relative filenames intentionally remain visible and must not contain secrets;
this is not a secret detector. Runtime, provider, credential, network and
executable-extension APIs are absent. `executionAuthorized` is always false;
semantic/core-profile/extension CLI checks remain `not-run`.

## Actual Initial Scope

18 native unit/boundary tests pass. All 11 frozen CLI cases pass twice, with
identical stdout, empty stderr and unchanged inputs. All 352 common library
identities receive two native evaluations: 128 pass, zero fail, 224 are explicitly
`not-implemented`/`not-tested` semantic-fragment or namespace operations. No input
oracle is sent to the driver. The Node harness only compares native outputs.

See [initial evidence](../../evidence/rust-initial.json) and
[the candidate record](../../candidates/rust.json) for exact source/package
revisions and remaining limits. Candidate status stays `in-progress`, readiness
`not-ready`; all nine architecture gates and three distribution targets remain
`not-tested`. Neither tests, offline dependency builds nor static source guards
prove offline enforcement, security isolation, supply-chain acceptance, target
support, comparative performance or independent review.
