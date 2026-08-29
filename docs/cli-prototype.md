# Repository CLI Prototype

Status: Unreleased, disposable repository tooling; not the reference CLI alpha.

The [Runtime Architecture Decision Review](../rfcs/reviews/runtime-architecture-decision-review.md)
is still `not-ready`. This prototype exercises command dispatch, local
manifest discovery, and structural validation using the existing maintenance
dependencies. It does not select a CLI or runtime language, establish a package layout, install a
`nexflow` executable, or claim `NF-CLI` conformance. It is not a completed
candidate for the [common language evaluation](language-evaluation-matrix.md).
Promotion to a reference CLI still requires the accepted architecture decision.

## Scope

The entry point is [`scripts/cli-prototype.mjs`](../scripts/cli-prototype.mjs).
Argument handling and output are separate from the discovery and schema
validation helpers. Help, version, usage failures, and unsupported commands do
not load manifests or schemas. Schema loading starts only after successful
discovery for `validate`.

The working operations are:

- `discover`: a read-only inventory of source paths and known manifest kinds.
  This repository-only command is not a proposed addition to the public CLI
  command set. It does not perform JSON Schema validation.
- `validate`: the same bounded discovery followed by JSON Schema validation
  of every selected manifest against the local `specVersion: "0.1"` snapshot.
  It reports success only when discovery and every structural check succeed.

Neither command performs Core Profile checks, full semantic validation, Agent
Assembly inspection, or extension-profile validation. Association and
cardinality checks during discovery are not complete reference resolution.
Missing actors, unresolved dependencies, and policy conflicts may therefore
remain in structurally valid input. Success never authorizes execution.

`inspect`, `graph`, and `init` remain reserved, unimplemented commands that fail
explicitly. A discovery-only operation never prints a validation result.

## Usage

Use the dependencies already pinned by this repository:

```sh
npm ci --ignore-scripts
npm run cli-prototype -- --help
npm run cli-prototype -- --version
npm run cli-prototype -- discover --root examples/minimal-team
npm run cli-prototype -- discover --root fixtures/discovery/multi-workflow --project project.yaml
npm run cli-prototype -- discover --root fixtures/discovery/multi-workflow --file project.yaml --file people/team.yml
npm run cli-prototype -- validate --root examples/minimal-team
npm run cli-prototype -- validate --root fixtures/discovery/multi-workflow --project project.yaml
npm run cli-prototype -- validate --root fixtures/discovery/multi-workflow --file project.yaml --file people/team.yml
```

An explicit `--root` is required. There is no implicit current-directory or
parent-directory search. Inputs inside that root are selected in exactly one
of three ways:

| Selection | Behavior |
| --- | --- |
| No source flag | Select exactly one of `project.yaml` and `project.yml` in the root, then follow its source hints. Two entries are ambiguous; an unsafe entry is not silently skipped. |
| `--project relative/path.yml` | Load that Project and its source hints. Hints are relative to `--root`, not to the Project's parent directory. |
| Repeated `--file relative/path.yml` | Load only the explicit list. Project hints are not followed. |

Both commands use this same selection contract, including the requirement for
exactly one Project. A lone AgentSet is not a supported input assembly. In
explicit-file mode, files named by Project hints are not loaded or validated
unless explicitly selected; a pass covers only the supplied files, not
completeness of the whole project.

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
| `0` | Help, prototype version, successful `discover`, or successful discovery and schema validation for `validate`. |
| `1` | Invalid, missing, ambiguous, or unsafe discovery input, or a schema-invalid manifest. |
| `2` | Invalid command-line usage. |
| `3` | Known unimplemented command or unsupported version, kind, or source hint. |
| `4` | Unexpected internal failure, including an unavailable or uncompilable local schema snapshot, without a raw exception or stack trace. |

Any discovery error suppresses the success inventory. Diagnostic codes remain
Implemented draft under the [Diagnostic Code Catalog](diagnostic-code-catalog.md).
Paths in output are root-relative and escaped, including terminal control and
bidirectional formatting characters. Absolute, remote, escaping, or overlong
locators are redacted. Raw document fields, parser excerpts, credentials,
environment values, and machine paths are not printed.

`validate` emits the existing coarse `NF-SCHEMA` draft code with a source,
known kind, sanitized JSON Pointer, constraint keyword, and generic message:

```text
NF-SCHEMA "project.yaml" Project "/project/description" [required]: Required field is missing.
```

The pointer is an experimental display locator, not a stable diagnostic
envelope. The empty pointer `""` denotes the document root. Missing required
fields are appended to the pointer. Property names not declared by the local
schemas, and names of rejected additional properties, become `<redacted>`;
numeric segments are preserved only for array positions. Overlong pointers
are redacted. Raw AJV messages and error parameters are not printed.

Errors are emitted in discovery's deterministic source order and the pinned
validator's constraint order. At most 200 schema diagnostics are printed per
invocation; an explicit omission notice retains exit status `1`. No partial
success summary is printed when any selected document fails.

## Schema Selection

The schema helper registers and compiles every `schemas/*.schema.json` file
adjacent to the repository tooling, including common definitions. Every
supported kind must have exactly one schema. Missing identities, duplicate
identities or kinds, missing schemas, unresolved references, and compilation
failures are internal failures, not evidence that input is valid or invalid.

The input root, working directory, manifest `$schema` fields, and remote
locators cannot select schemas. There is no schema override flag or network
schema loader. AJV and its format checks use the pinned maintenance
dependencies; coercion, default insertion, and property removal are disabled.
The command never repairs or rewrites input. It validates the core ExtensionSet
shape but does not run the separate MCP or A2A profile checks.

`npm run validate` remains the repository-wide maintenance check, including
schema/example kind coverage and stricter alias-free example parsing. The
prototype validates only its selected assembly using the bounded YAML rules
of discovery. It is not a replacement for the repository check suite.

## Safety Boundary

The prototype reads selected local manifests, its own tooling, and, for
`validate`, the repository-owned schemas. It writes only stdout and stderr.
It has no network, provider SDK, credential, subprocess, executable
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
npm run cli-validation-smoke
npm run manifest-discovery-smoke
npm run validate
```

The checks cover dispatch and exit status, source selection, deterministic
inventory, failed-discovery suppression, redaction, and source safety. The
validation checks additionally exercise all seven example projects, existing
negative schema fixtures, local registry failures, formats, bounded errors,
and non-mutating behavior. CI runs them alongside existing repository checks.
No schema or example migration is needed; no manifest fields or accepted
schema versions change.

Still required before a reference CLI alpha: the accepted architecture
decision, package and distribution ownership, agreed semantic coverage,
inspection and other accepted commands, versioned output, target evidence,
and a bounded support claim. This structural validation slice does not
satisfy those release gates.
