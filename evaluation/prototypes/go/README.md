# Disposable Go Validation Candidate

NF-056-08 implements independent local structural validation and declared-only
inspection in Go. It uses no other-language validation backend. This is a
source-bound private experiment, not an installed CLI, runtime, published package
or accepted architecture.

## Pinned Provisioning And Build

Use exactly Go 1.27.1. The reviewed NF-056-04 dependency graph is unchanged:
jsonschema/v6 6.0.2, go.yaml.in/yaml/v3 3.0.4 and indirect x/text 0.14.0.
[go.mod](go.mod) changes only the module name from the capability probe;
[go.sum](go.sum) is byte-identical to the approved checksum file.
Provision the compiler and modules separately in reviewed task-local directories;
do not permit automatic toolchain switching. From this directory:

```sh
GOTOOLCHAIN=local go mod download
GOTOOLCHAIN=local GOPROXY=off go mod verify
GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go test -mod=readonly -count=1 ./...
GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go build \
  -mod=readonly -trimpath -buildvcs=false -o bin/nexflow-go-evaluation ./cmd/cli
GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go build \
  -mod=readonly -trimpath -buildvcs=false -o bin/library-driver ./cmd/library-driver
```

Set GOPATH and GOCACHE to dedicated provisioned directories where required.
The build disables cgo and VCS embedding and trims source paths. The CLI locates
the reviewed checkout's schemas relative to its executable at the documented
`bin` location. Moving the binary, `go run`, installed packages and schema
bundling are not supported by this initial experiment.

From the repository root, provision the pinned maintenance harness separately
with `npm ci --ignore-scripts`, then run:

```sh
npm run runtime-go-prototype-smoke
node scripts/runtime-evaluation-run.mjs --command '["evaluation/prototypes/go/bin/nexflow-go-evaluation"]'
node scripts/runtime-go-library-run.mjs evaluation/prototypes/go/bin/library-driver
```

The common runner executes each CLI case twice. The native library driver
receives only identities and declarative inputs, not expectations or oracle
answers; it checks input immutability and identical results on both evaluations.
The Node harness only applies the unchanged common comparison contract.

## CLI And Library Boundaries

Only `validate` and `inspect`, mandatory `--root`, optional `--project` or
repeated `--file`, and `--format json|text` are accepted. Unsupported commands,
unknown options, duplicate singleton options and mixed selections fail before
manifest reads. CLI parsing uses the pinned standard `flag` package.

Import `nexflow.local/go-evaluation` (package `candidate`) from the reviewed
module to use `Selection`, `Manifest`, `Evaluate`, `Discover`, `Inspect`,
`ParseYAML`, `SchemaEngine`, `NewSchemaEngine`, `RepositorySchemas` and
`EvaluateLibraryCase`. These APIs return data without printing or exiting.
Use `Evaluate` for ordered discovery/schema validation and failure-suppressed
inspection; lower-level projection APIs do not assert a validated assembly.

Discovery follows only explicit file lists or Project source hints. There is no
recursive scanning or executable loading. An explicit canonical root is opened
with `os.OpenRoot`; relative locators reject traversal, URL-like strings,
backslashes and controls, and each component is checked for symlinks. Reads
accept only regular UTF-8 YAML, at most 128 selected files and 1 MiB per file.
Final opens additionally use no-follow and non-blocking flags on Linux/macOS.
Root containment is not an OS sandbox: mount/device boundaries, component
replacement races, platform-specific behavior and Windows final-open protections
remain later negative experiments.

YAML conversion permits one JSON-compatible document, unique scalar-string
mapping keys, depth 100 and 200,000 node visits. Timestamp text is preserved;
aliases, explicit tags, non-string keys and non-finite values fail closed.
The parser constructs its native node tree before the bounded conversion;
these limits do not establish complete YAML dialect parity or parser isolation.

Schemas are reviewed local draft 2020-12 resources with format assertion and an
explicit loader denying non-preloaded references. Diagnostic messages are fixed,
source/exception values are not echoed, and schema pointers use reviewed field
names or redaction. Diagnostics sort deterministically and truncate at 200.
The adapter normalizes the library's empty-keyword `items: false` observation to
the shared `items` category and parent array pointer, while retaining the native
diagnostic in library evidence. It does not change the common catalog.

Inspection projects declaration/reference fields only, capped at 1,000 resources
and 2,000 references. Selected IDs and relative filenames are intentionally
visible and must not contain secrets; this is not secret detection.
`executionAuthorized` is always false, and semantic/core-profile/extension CLI
checks stay `not-run`. There are no provider, credential, workflow, network or
executable-extension operations. Structural success grants no policy authority.

## Initial Evidence And Remaining Work

The [candidate record](../../candidates/go.json) pins the complete prototype
revision after source checks. The initial native macOS ARM64 run passes all 11
shared CLI cases twice and 128 library cases twice. The remaining 224 semantic
and workflow/artifact namespace cases return `valid: null`,
`status: not-implemented` and remain `not-tested`, never successful validation.
Full four-candidate parity belongs to NF-056-09.

Native source tests and source guards do not establish offline enforcement,
an OS deny harness, supply-chain acceptance, reproducible artifacts, installation
lifecycle, target support, comparable measurements or independent review. All
architecture hard gates and distribution targets remain `not-tested`.
