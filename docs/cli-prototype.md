# Repository CLI Prototype

Status: Unreleased, disposable repository tooling; not the reference CLI alpha.

The [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md)
is still `not-ready`. This prototype exercises command dispatch and local
manifest discovery using the existing maintenance dependencies. It does not
select a CLI or runtime language, establish a package layout, install a
`nexflow` executable, or claim `NF-CLI` conformance. It is not a completed
candidate for the [common language evaluation](language-evaluation-matrix.md).
Promotion to a reference CLI still requires the accepted architecture decision.

## Scope

The entry point is [`scripts/cli-prototype.mjs`](../scripts/cli-prototype.mjs).
Argument handling and output are separate from the shared discovery helper.
Help, version, usage failures, and unsupported commands do not load manifests.

The only working operation is `discover`: a read-only inventory of source
paths and known manifest kinds. This repository-only command is not a proposed
addition to the public CLI command set. It does not perform JSON Schema,
Core Profile, full semantic validation, or Agent Assembly inspection.

`validate`, `inspect`, `graph`, and `init` are reserved, unimplemented commands
that fail explicitly. In particular, the prototype must not print a successful
validation result for a discovery-only operation.

## Usage

Use the dependencies already pinned by this repository:

```sh
npm ci --ignore-scripts
npm run cli-prototype -- --help
npm run cli-prototype -- --version
npm run cli-prototype -- discover --root examples/minimal-team
npm run cli-prototype -- discover --root fixtures/discovery/multi-workflow --project project.yaml
npm run cli-prototype -- discover --root fixtures/discovery/multi-workflow --file project.yaml --file people/team.yml
```

An explicit `--root` is required. There is no implicit current-directory or
parent-directory search. Inputs inside that root are selected in exactly one
of three ways:

| Selection | Behavior |
| --- | --- |
| No source flag | Select exactly one of `project.yaml` and `project.yml` in the root, then follow its source hints. Two entries are ambiguous; an unsafe entry is not silently skipped. |
| `--project relative/path.yml` | Load that Project and its source hints. Hints are relative to `--root`, not to the Project's parent directory. |
| Repeated `--file relative/path.yml` | Load only the explicit list. Project hints are not followed. |

`--project` and `--file` are mutually exclusive. Unknown flags, repeated
single-value flags, extra positional arguments, and conflicting modes fail
before discovery. See [Manifest Discovery](manifest-discovery.md) for source
containment, version, kind, parsing, size, count, and cardinality rules.

There is no recursive scan, glob expansion, ignore-file processing, bundle
expansion, stdin input, remote fetching, or source auto-completion.

## Output And Exit Status

Text output is experimental and identified by the repository revision, not a
published CLI version. `--version` reports an unreleased prototype targeting
manifest `specVersion: "0.1"`; it must not borrow the specification release
number as a CLI release number. JSON and stable diagnostic envelopes remain
future work.

| Exit status | Meaning |
| ---: | --- |
| `0` | Help, prototype version, or successful discovery only. |
| `1` | Invalid, missing, ambiguous, or unsafe discovery input. |
| `2` | Invalid command-line usage. |
| `3` | Known unimplemented command or unsupported version, kind, or source hint. |
| `4` | Unexpected internal failure, without a raw exception or stack trace. |

Any discovery error suppresses the success inventory. Diagnostic codes remain
Implemented draft under the [Diagnostic Code Catalog](diagnostic-code-catalog.md).
Paths in output are root-relative and escaped, including terminal control and
bidirectional formatting characters. Absolute, remote, escaping, or overlong
locators are redacted. Raw document fields, parser excerpts, credentials,
environment values, and machine paths are not printed.

## Safety Boundary

The prototype reads only selected local manifests and writes only stdout and
stderr. It has no network, provider SDK, credential, subprocess, executable
extension, runtime, or output-file mode. Commands and remote locators found in
manifest content remain inert data. Missing modules are not auto-discovered
and do not grant authority.

This is application-level input handling, not an operating-system sandbox.
Use a stable local checkout: hostile concurrent replacement of ancestor
directories, hard-link ownership, dependency compromise, and OS permissions
are not isolation guarantees supplied by this prototype.

## Verification And Remaining Gates

```sh
npm run cli-prototype-smoke
npm run manifest-discovery-smoke
npm run validate
```

The checks cover dispatch and exit status, source selection, deterministic
inventory, failed-discovery suppression, redaction, and source safety. CI runs
them alongside existing repository checks. No schema or example migration is
needed; no manifest fields or accepted schema versions change.

Still required before a reference CLI alpha: the accepted architecture
decision, package and distribution ownership, actual validation and inspection
commands, versioned output, target evidence, and a bounded support claim. These
requirements are not satisfied by adding this prototype.
