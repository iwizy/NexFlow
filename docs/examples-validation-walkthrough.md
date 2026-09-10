# Examples Validation Walkthrough

This walkthrough shows how to validate and inspect the maintained NexFlow
examples using the repository tooling. It starts with the three-manifest
Minimal Team, checks a complete Software Team assembly, and finishes with an
intentional failure fixture.

The commands demonstrate syntax and schema validation, declared inspection,
and static graphing. They do not execute agents or workflows, resolve live
systems, enforce policy, or establish full semantic or runtime conformance.

## Prerequisites

Use Node.js 20 or newer and run every command from the repository root:

```sh
npm ci --ignore-scripts
```

The dependencies are pinned for repository maintenance. Installing them does
not install a distributed `nexflow` command or select a future runtime language.

## 1. Start With Minimal Team

[`examples/minimal-team/`](../examples/minimal-team/) contains the smallest
maintained project assembly:

```text
examples/minimal-team/
  project.yaml
  actors.yaml
  agents.yaml
```

`project.yaml` declares the Project and source hints. `actors.yaml` declares
one human and one AI actor. `agents.yaml` provides the AI agent's stable
identity. No permission, capability, context, memory, provider, extension, or
runtime authority is implied by this example.

## 2. Validate The Whole Repository

Run the broad maintenance validator first:

```sh
npm run validate
```

At the current revision, the final summary is:

```text
Parsed 18 schema files and 109 example manifests.
Matched 17 manifest kinds to 17 schemas.
Validated 109 manifests against 17 schemas.
Schema validation passed. Semantic validation was not performed.
```

This command parses every schema and maintained example, checks kind coverage,
compiles the schemas, and validates each example document. It does not use the
CLI discovery contract and does not perform complete cross-manifest semantic
checks.

## 3. Validate One Logical Assembly

Run the repository CLI prototype directly for deterministic output:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team
```

Expected result:

```text
Validated 3 manifest(s) against the local spec 0.1 schemas (directory-project).
Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.
```

The CLI selects the root `project.yaml`, follows its supported source hints,
and validates all three selected manifests. Exit status `0` means this bounded
operation succeeded; it is not approval or execution authority.

## 4. Inspect Declared Resources

Use `inspect` to see the allowlisted declarations and selected references:

```sh
node scripts/cli-prototype.mjs inspect --root examples/minimal-team
```

The important part of the result is:

```text
Inspected 3 manifest(s) (directory-project).
Project "minimal-team" at "project.yaml" "/project"
ActorSet: 1 document(s), 2 declaration(s)
AgentSet: 1 document(s), 1 declaration(s)
Project: 1 document(s), 1 declaration(s)
```

The resource list identifies the human maintainer, the AI actor, the compact
agent identity, and the Project. The selected references show the explicit
actor-to-agent bridge and Project maintainer reference. They are reported as
declared references, not as a complete semantic resolution or Agent Assembly.

## 5. Build The Static Graph

Use `graph` on the same selected assembly:

```sh
node scripts/cli-prototype.mjs graph --root examples/minimal-team
```

Expected summary:

```text
Graphed 4 node(s) and 2 edge(s) from 3 manifest(s) (directory-project).
```

Both selected references resolve against declarations in this bounded input:
the AI actor points to the agent identity, and the Project maintainer points to
the human actor. The graph does not infer task order, schedule work, or report
runtime state.

## 6. Validate A Complete Example

[`examples/software-team/`](../examples/software-team/) exercises all 16
current manifest kinds used by the complete legacy example shape:

```sh
node scripts/cli-prototype.mjs validate --root examples/software-team
```

Expected result:

```text
Validated 16 manifest(s) against the local spec 0.1 schemas (directory-project).
Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.
```

This pass confirms that every discovered document matches its local JSON
Schema. It does not prove that every reference resolves, that approval gates
are sufficient, that credentials or integrations exist, or that the declared
workflow can run.

## 7. Read A Validation Failure

Fixtures are focused regression inputs, not reference examples. Run the
cataloged Project fixture that intentionally omits `project.description`:

```sh
node scripts/cli-prototype.mjs validate --root fixtures/cli/invalid/schema
```

The command exits with status `1` and reports:

```text
NF-SCHEMA "project.yaml" Project "/project/description" [required]: Required field is missing.
```

Read the diagnostic from left to right:

| Field | Meaning |
| --- | --- |
| `NF-SCHEMA` | The selected document failed structural schema validation. |
| `project.yaml` | Root-relative source location. |
| `Project` | Manifest kind used to select the schema. |
| `/project/description` | Sanitized JSON Pointer to the missing field. |
| `required` | JSON Schema constraint that failed. |

Do not “fix” files under `fixtures/cli/invalid/`; their rejection is maintained
test evidence. Apply corrections to a project copy or authored manifest, then
run validation again.

## 8. Use Machine-Readable Output

Add `--format json` when another local tool needs structured results:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team --format json
```

Check these fields before consuming the result:

| Field | Interpretation |
| --- | --- |
| `formatVersion` | Version of the experimental CLI output envelope, currently `0.4-draft`. |
| `success` and `exitCode` | Outcome of the requested prototype operation. |
| `inputMode` | How the local manifest assembly was selected. |
| `checks` | Which validation layers actually ran and their states. |
| `diagnostics` | Structured, bounded, redacted failures. |
| `executionAuthorized` | Always `false`; validation never grants execution authority. |

Pin the repository revision and output format together. This JSON shape is not
a stable reference CLI contract. See
[CLI Machine-Readable Diagnostics](cli-diagnostics.md) for the full envelope.

## 9. Choose The Next Example

Use the [Example Matrix](../examples/MATRIX.md) to select a project by team
shape and policy emphasis:

- choose [Solo Developer](../examples/solo-developer/) for a compact human-owned
  work and review path
- choose [Software Team](../examples/software-team/) for conventional feature
  delivery with QA and review handoffs
- choose [Open Source Maintainer](../examples/open-source-maintainer/) for issue,
  pull request, documentation, and release-note responsibilities
- choose [Enterprise Team](../examples/enterprise-team/) for strict approval,
  context, memory, credential, and compliance boundaries

Every maintained example should pass `npm run validate`. Use focused smoke
commands when changing a model boundary, and follow the
[Example Consistency Checklist](../examples/CHECKLIST.md) before submitting an
example change.

## What Passing Does Not Prove

A successful walkthrough does not prove:

- complete semantic reference resolution
- workflow acyclicity or executable ordering
- provider, integration, context, memory, or credential availability
- permission, approval, autonomy, network, or human-override enforcement
- runtime compatibility, safety, or conformance
- a released reference CLI or stable command interface

For those boundaries, continue with [Validation](validation.md),
[Conformance](conformance.md), [Compatibility Matrix](compatibility-matrix.md),
and [Reference CLI](reference-cli.md).
