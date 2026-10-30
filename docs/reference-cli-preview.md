# Reference CLI Source Preview

NF-106 implements the source entry for the bounded
[0.5 profile](0.5-cli-contract.md): `validate`, `inspect`, static `graph`, help
and version. It uses the separate NF-105 library through its public package
entry, not a historical CLI or another language backend.

Status: **implemented source preview, unreleased**. Package identity is
`@nexflow/cli` `0.5.0-alpha.1`, with matching `@nexflow/validation` and exact
Node 26.13.0. The bin mapping points to `dist/main.js`; final tarballs, dependency
closure, offline install, native lifecycle, security acceptance and publication
are NF-107–NF-110 work. This is not an `NF-CLI` or full semantic claim.

## Build And Run

Follow the [package build instructions](../packages/cli/README.md). The local
build makes a development dependency link; the executable itself has no
source-checkout fallback. Until a qualified CLI artifact exists, invoke it as:

```sh
node packages/cli/dist/main.js validate --root examples/minimal-team
node packages/cli/dist/main.js inspect --root examples/minimal-team --format json
node packages/cli/dist/main.js graph --root fixtures/discovery/multi-workflow --project project.yaml
node packages/cli/dist/main.js --help --format json
node packages/cli/dist/main.js --version
```

The command grammar is the [frozen profile](0.5-cli-contract.md#command-grammar).
Operations require an explicit nonempty root and accept either one Project
locator or repeated explicit file locators. With neither selector, require
exactly one root `project.yaml`/`project.yml`. File-list mode does not follow
Project hints; all locators are relative to the selected root, including nested
Project hints. `--name=value` and separate value tokens agree. Singleton options
cannot repeat. There is no positional input, stdin, recursive/parent scan,
remote source, schema override, report-file option or environment discovery.

`--help` and `--version` are terminal informational operations. Per-operation
help is `<validate|inspect|graph> --help`; selection flags conflict with help.
`init` is deliberately deferred, and `discover`, `run`, renderers, automatic
fixes and runtime-preflight flags return usage failure. No-argument invocation
is a usage failure; use `--help` explicitly.

## Performed Checks And Static Graph

- `validate` checks discovery/association and pinned 17-kind JSON Schema shape.
- `inspect` adds the library's [declared-only projection](cli-inspection.md):
  selected identities, occurrences and references, without raw authored bodies,
  effective configuration or Agent Assembly resolution.
- `graph` ports the [selected-field static graph](cli-graph.md) over that same
  projection. Nodes retain declaration occurrences and source pointers; edges
  use the deepest declaring node and exact selected namespace/Workflow scope.
  Participant lookup uses ActorSet authority when present, otherwise AgentSet.

Graph edges label `resolved`, `unresolved`, `ambiguous` or `redacted` targets.
An unknown namespace received from a projection helper is explicitly
`unsupported`, with a fixed `<unsupported-kind>` marker and no target/candidates;
this is defensive helper handling, not a new supported manifest kind. Current
supported-library projections use the documented namespace allowlist. Unsupported
selected manifest kinds/dialects are rejected before any graph is emitted.

Duplicates are not collapsed. Missing declarations in a selected file list are
unresolved, not fetched. Matching is explanatory only: it does not establish
dependency acyclicity, approval coverage, execution order, provider selection,
external existence or runtime state. Semantic, Core Profile, extension-profile
and runtime checks remain `not-run`; `executionAuthorized` is always false.

## Output Contract And Diagnostics

The concrete [closed JSON Schema](../packages/cli/contracts/output.schema.json)
implements `formatVersion: "0.5-preview.1"`. JSON mode emits one UTF-8 JSON
object and one final newline on stdout, with empty stderr. It includes tool
identity/version, fixed supported dialects, recognized command, input mode,
per-layer checks, success/exit code, diagnostics/truncation and the bounded
successful result. Failure always has `result: null`.

Help has a subject, accepted usage forms and explicit unsupported commands.
Version exposes the CLI version and `requiredLibraryApiVersion`; it does not
load the validation package. All informational check states remain `not-run`.
The CLI reads fixed installed metadata for startup, checks runtime and package
compatibility before project reads, and emits a fixed internal error if setup
cannot be used. If its metadata is unreadable, the known build identity is
retained in that failure; metadata errors are never printed verbatim.

Default `text` output describes the same result and preserves the explicit
non-authority warning. Untrusted display strings are quoted/escaped, including
non-ASCII UTF-16 code units, so terminal controls cannot become active output.
Safe authored identities and relative source locators are intentionally visible
and must not contain secrets; this is not a secret detector. Low-level raw
parsing helpers are never serialized as public CLI output.

Diagnostics sort by Unicode code-point order of safe file, pointer, severity,
code, schema keyword and fixed message, before the global 200-item limit.
When the library's aggregate schema diagnostics were already capped, the CLI
recovers each file's bounded prefix before applying its global order. Safe
schema pointer/keyword fields are ASCII within each file. Truncation retains
failure and suppresses a partial successful projection.

| Exit | Meaning |
| ---: | --- |
| 0 | Bounded operation succeeds, or informational output is returned. |
| 1 | Discovery/input/schema failure or projection limit. |
| 2 | Unsupported command/flags, invalid arguments or conflicting options. |
| 3 | Unsupported selected dialect, kind or Project source hint. |
| 4 | Unexpected internal/setup failure, incompatible package pair or unsupported runtime. |

Usage errors precede workspace reads. A recognized explicit JSON format value
also selects JSON for usage failures; a flag-like token consumed as another
option's value is data and does not select output mode. Within completed input
assessment, ordinary invalid input wins over unsupported input. A consequent
`NF-DISCOVERY-NO-PROJECT` is omitted when the only primary problems are rejected
kind/dialect; it does not incorrectly turn exit 3 into exit 1. Independent
invalid input still wins. Unexpected internal failures take precedence over
input classification.

| CLI-owned code | Fixed meaning and evidence |
| --- | --- |
| `NEXFLOW-CLI-USAGE` | Invalid command/arguments/options; [grammar fixtures](../fixtures/reference-cli/index.json) include unsupported commands and consumed-format values. |
| `NEXFLOW-CLI-INTERNAL` | Runtime/package setup or unexpected internal failure; verifier exercises a missing/mismatched dependency and simulated runtime-metadata rejection before project reads. |
| `NEXFLOW-CLI-LIMIT` | Inspection/graph exceeds the 1,000-resource or 2,000-reference budget; verified from the actual entry without partial results. |

Existing `NF-DISCOVERY-*` and `NF-SCHEMA` mappings are retained. CLI-owned codes
are not new specification diagnostic codes. Native exceptions, parser excerpts,
absolute roots, rejected values and stacks are not output.

## Compatibility And Verification

The historical `0.4-draft` CLI and evaluation diagnostics formats remain
unchanged. This preview has no old-format compatibility switch; consumers must
adopt its new schema and check both exit 0 and a valid successful envelope.
All 15 historical catalog cases run through the new entry with an explicit
mapping: `discover` and `init` are now usage failures; unsupported kind/dialect
retains exit 3 without the consequent missing-Project diagnostic. Other
cataloged discovery/schema outcomes remain checked. The old catalog is intact.

```sh
node scripts/reference-cli-smoke.mjs
```

The verifier builds and relocates the real entry with the actual extracted
library package, checks all eight maintained projects and new grammar fixtures,
compares declared inspection/static graphs with historical pure projections,
tests safe failures and source preservation, and runs under the existing
no-runtime deny harness plus a bounded-read guard. It checks repeatability,
Unicode ordering before truncation, JSON schema rejection and import closure.
These are source/package relationship regressions, not an OS sandbox. Runtime
metadata fault injection is not native-runtime qualification. Linux CI and local
macOS checks do not establish the three-target installation/lifecycle gate.

The [NF-106 source record](../evaluation/reference-cli/nf-106.json) binds the
93 observations to the verifier, output schema, compiled CLI payload and actual
validation tarball hashes, with exact toolchain and local platform. CI reruns
the same verifier and uploads its own environment-specific record. This does
not replace final artifact or target qualification.
