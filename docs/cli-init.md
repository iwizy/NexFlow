# CLI Starter Initialization

Status: implemented experimental repository `init`, not a distributed
reference CLI alpha, project generator framework, or runtime initializer.

The [repository CLI prototype](cli-prototype.md) can write one built-in,
versioned starter into an explicit local destination. The starter provides a
small Core Profile authoring baseline: one Project, an authoritative ActorSet,
and a compact AgentSet. Generated files are ordinary manifests that require
human review.

## Usage

Create the destination directory first, then run:

```sh
mkdir my-project
node scripts/cli-prototype.mjs init --root my-project --id my-project
node scripts/cli-prototype.mjs init --root my-project --id my-project --name "My Project"
node scripts/cli-prototype.mjs init --root my-project --id my-project --format json
```

`--root` and `--id` are required. The destination must already be an available,
non-symlinked directory. The ID follows the specification identifier syntax:
it starts with a lowercase letter and contains lowercase letters, digits, and
non-empty `-` or `_` separated segments, up to 128 characters. An omitted
`--name` is derived deterministically from the ID. Display names must be
non-empty, at most 128 characters, and contain no terminal or bidirectional
control characters.

There is no implicit current-directory destination, parent search, recursive
directory creation, remote template, template path, configuration file, or
environment-variable override.

## Built-In Starter

Template `minimal-team@0.1-draft` targets manifest `specVersion: "0.1"` and
creates exactly:

| File | Declaration |
| --- | --- |
| `project.yaml` | Project identity, a human maintainer, `suggest_only` default autonomy, mandatory review, and local source hints. |
| `actors.yaml` | One human authority and one AI agent actor linked by a typed agent reference. |
| `agents.yaml` | Compact stable identity for the developer agent, without provider or runtime configuration. |

The starter intentionally contains no provider selection, credential
reference, network permission, executable extension, workflow command, runtime
configuration, secret, account identifier, private endpoint, machine path, or
license choice. It does not create Agent Definitions or policy manifests.
Additional behavior and policy should be added deliberately using the
[Minimal Team progression](../examples/minimal-team/README.md).

Changing generated files, template identity, autonomy, review defaults, or
file names is compatibility-relevant CLI behavior. The template version must
advance when those outputs become incompatible; it is independent from the
manifest `specVersion`, repository release, and JSON output format.

## Conflict And Write Rules

Before writing, `init` compares all three target names:

- a missing target is reported as `created`
- an existing regular file with byte-identical template content is reported as
  `skipped`
- an existing different file, directory, or symbolic link is a conflict

Any preflight conflict prevents every write. The alpha has no overwrite,
merge, repair, backup, or force mode. Unrelated destination files are ignored
and preserved. Missing targets are reserved with exclusive file creation before
template content is written; a file that appears during reservation fails the
operation and files reserved by that attempt are removed.

The destination and fixed target names are resolved locally. Output reports
only the three relative starter names, never the destination's absolute path or
file contents. This is application-level handling, not an operating-system
sandbox; hostile concurrent directory replacement, hard-link ownership,
dependency compromise, and operating-system permissions remain outside the
prototype guarantee.

## Output And Failure

Text output reports the created and skipped counts, then every starter file and
its status. JSON output uses the shared
[`formatVersion: "0.4-draft"` envelope](cli-diagnostics.md) and returns:

```json
{
  "template": {
    "name": "minimal-team",
    "version": "0.1-draft",
    "specVersion": "0.1"
  },
  "files": [
    { "file": "project.yaml", "status": "created" },
    { "file": "actors.yaml", "status": "created" },
    { "file": "agents.yaml", "status": "created" }
  ],
  "reviewRequired": true
}
```

For `init`, discovery and schema checks remain `not-run`; template validity is
repository test evidence, not a validation pass produced during generation.
`executionAuthorized` remains `false`.

| Exit status | Meaning |
| ---: | --- |
| `0` | Every starter target was created or already matched exactly. |
| `1` | Destination or target conflict; no preflight-conflicting write is performed. |
| `2` | Invalid command usage, project ID, or display name. |
| `4` | Unexpected internal failure; no successful initialization result is available. |

Conflict failures use `NEXFLOW-PROTOTYPE-INIT-CONFLICT`; unavailable or
symlinked destinations use `NEXFLOW-PROTOTYPE-INIT-DESTINATION`. These are
implementation-owned experimental codes, not Stable `NF-*` diagnostics.

## Safety And Evidence

`init` reads built-in non-executable template data and target-file state. It
does not read project manifests, validate an existing assembly, access the
network or credentials, invoke a provider or integration, load extensions, run
subprocesses or hooks, install dependencies, initialize Git, create accounts,
or start runtime services. A successful result is not runtime readiness,
conformance, approval, or execution authority.

Run:

```sh
npm run cli-init-smoke
```

The focused check covers valid generation, repository structural validation,
idempotence, partial exact-template completion, conflicts, symbolic links,
relative output, preserved unrelated files, argument rejection, and the closed
JSON result. Broader fixture and denied-effect evidence remains future work.
