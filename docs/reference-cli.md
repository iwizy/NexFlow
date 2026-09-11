# Reference CLI

Status: target contract documented; no reference CLI package or release exists.

NexFlow plans a validation-focused reference CLI for authoring and reviewing
manifest projects. The command names are proposed by
[RFC-0011](../rfcs/RFC-0011-reference-cli-scope.md), which remains Draft. The
repository also contains an unreleased
[CLI prototype](cli-prototype.md) used to test parts of that proposal.

These are different surfaces:

- the **reference CLI** is a future supported product with an explicit package,
  compatibility policy, and `NF-CLI` evidence
- the **repository CLI prototype** is disposable maintenance tooling invoked
  from a source checkout
- a future **runtime** may execute work and mediate effects, but the reference
  CLI must not acquire runtime authority

Documentation of a command does not mean that the reference CLI implements or
ships it.

The [Draft Reference CLI Alpha Release Notes](cli-alpha-release-notes.md)
collect the candidate scope, current evidence, known limitations, version
boundaries, and publication checklist. They remain blocked and must not be used
as a release announcement.

## Command Map

The initial reference CLI proposal contains four public commands. `discover`
exists only in the repository prototype as a focused evaluation aid.

| Intent | Proposed public form | Runnable repository prototype | Current evidence |
| --- | --- | --- | --- |
| Validate a selected manifest assembly | `nexflow validate <path>` | `node scripts/cli-prototype.mjs validate --root <directory>` | Local discovery and JSON Schema validation only. |
| Inspect declared resources and references | `nexflow inspect <path>` | `node scripts/cli-prototype.mjs inspect --root <directory>` | Bounded declared-only projection after schema validation. |
| Build a static relationship graph | `nexflow graph <path>` | `node scripts/cli-prototype.mjs graph --root <directory>` | Bounded text or JSON graph over selected references. |
| Create a safe starter project | `nexflow init` with an explicit destination and template | `node scripts/cli-prototype.mjs init --root <directory> --id <project-id>` | One built-in three-file starter with no overwrite mode. |
| Inspect discovery input without validation | No proposed public command | `node scripts/cli-prototype.mjs discover --root <directory>` | Repository-only source inventory. |

The proposed public syntax is not stable. Do not write installers, integrations,
or automation that assume these positional arguments or flags. The runnable
forms above describe the current repository revision only.

## Try The Current Evidence

Install the pinned maintenance dependencies from a NexFlow checkout:

```sh
npm ci --ignore-scripts
npm run cli-prototype -- --help
npm run cli-prototype -- validate --root examples/minimal-team
npm run cli-prototype -- inspect --root examples/minimal-team
npm run cli-prototype -- graph --root examples/minimal-team
```

Use the direct Node entry point for machine-readable output so npm does not add
lifecycle logging:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team --format json
```

The prototype requires Node.js 20 or newer because that is the repository
maintenance environment. This does not select the language, package layout, or
distribution mechanism of a future reference CLI.

## Input Selection

The prototype requires an explicit `--root`. Read-only commands select input in
exactly one mode:

| Mode | Selection |
| --- | --- |
| Directory Project | With no source flag, require exactly one root `project.yaml` or `project.yml`, then follow its supported source hints. |
| Project hints | `--project <relative-file>` loads that Project and its supported hints relative to `--root`. |
| Explicit files | Repeated `--file <relative-file>` loads only those files and does not follow Project hints. |

The prototype does not recursively scan, search parent directories, expand
globs, fetch remote sources, or load files outside the explicit root. See
[Manifest Discovery](manifest-discovery.md) for limits and rejection rules.
Input selection for the reference CLI remains subject to the RFC process.

## Commands And Boundaries

### `validate`

The prototype safely parses selected YAML and validates each known manifest
against the repository-owned schema for `specVersion: "0.1"`. A successful
result does not prove Core Profile, semantic, extension-profile, policy, runtime,
or execution readiness.

### `inspect`

The prototype exposes allowlisted identities, source locations, per-kind
counts, and selected references. It does not return arbitrary manifest content,
resolve effective agent configuration, or compute Agent Assembly. See
[CLI Declared Inspection](cli-inspection.md).

### `graph`

The prototype derives nodes and selected reference edges from declared
inspection. Resolution labels are static matches inside the selected assembly;
they are not execution order, scheduling, live state, or authorization. See
[CLI Static Graph](cli-graph.md).

### `init`

The prototype creates `project.yaml`, `actors.yaml`, and `agents.yaml` from the
built-in `minimal-team@0.1-draft` starter. It requires an existing non-symlinked
destination, skips exact matches, and rejects every write when a target
conflicts. It does not install packages, initialize Git, configure providers,
create credentials, or start a runtime. See
[CLI Starter Initialization](cli-init.md).

## Output And Exit Status

Text is the default prototype output. `--format json` emits the experimental
`formatVersion: "0.4-draft"` envelope defined by
[`scripts/contracts/cli-output.schema.json`](../scripts/contracts/cli-output.schema.json).
That version is separate from manifest `specVersion`, the NexFlow repository
release, and any future CLI package version.

| Exit status | Prototype meaning |
| ---: | --- |
| `0` | The requested bounded operation succeeded. |
| `1` | Input, schema, inspection limit, or initializer destination failed. |
| `2` | Command-line usage is invalid. |
| `3` | A manifest version, kind, or source hint is unsupported. |
| `4` | An internal prototype dependency or operation failed. |

JSON mode reports one object on stdout, including failures. It keeps explicit
check states and always reports `executionAuthorized: false`. See
[CLI Machine-Readable Diagnostics](cli-diagnostics.md) for ordering, limits,
redaction, and migration rules.

## Effect Boundary

The reference CLI is intended to remain offline and non-orchestrating. The
current prototype has executable guardrails that deny network access, process
execution, credential access, provider calls, executable extensions, runtime
preflight, workflow execution, and background work. Its only project-write
budget is the fixed three-file `init` starter.

These checks are application-level regression evidence, not an operating-system
sandbox. The normative separation is documented in
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md).

## Verification

The dedicated [`CLI Prototype` workflow](../.github/workflows/cli-smoke.yml)
runs these checks on pull requests and pushes to `main` or `develop`:

```sh
npm run cli-prototype-smoke
npm run cli-validation-smoke
npm run cli-diagnostics-smoke
npm run cli-inspection-smoke
npm run cli-graph-smoke
npm run cli-init-smoke
npm run cli-no-runtime-guardrails-smoke
npm run cli-fixture-smoke
```

Passing this repository suite supports claims about the named prototype
revision only. It is not `NF-CLI` conformance.

## Promotion Gates

Before the project can publish a reference CLI alpha, it must:

1. Accept the relevant architecture and CLI scope decisions through the RFC
   process.
2. Assign package, distribution, release, and security ownership.
3. Stabilize command grammar, input discovery, diagnostics, output versions,
   and compatibility policy for the claimed surface.
4. Define the exact syntax, schema, static semantic, inspection, graph, and
   initialization coverage included in an `NF-CLI` claim.
5. Publish target-platform evidence, supported-version ranges, known
   limitations, and migration guidance.
6. Demonstrate that runtime effects remain unavailable and that CLI success
   cannot authorize execution.

Until those gates close, use the prototype only as repository evidence and keep
public support claims at `Planned` or `Partial` as recorded in the
[Compatibility Matrix](compatibility-matrix.md).

## Explicit Non-Goals

Neither the proposed reference CLI nor the current prototype runs agents,
executes workflows, calls providers or integrations, acquires credentials,
persists memory, performs handoffs, deploys applications, or grants permission
for any effect. Those are runtime responsibilities and require separate design,
implementation, and conformance evidence.
