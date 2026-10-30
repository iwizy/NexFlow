# @nexflow/cli Source Preview

NF-106 implements the unreleased validation-only `nexflow` entry point in
`src/main.ts`, using the separate public `@nexflow/validation` API. Commands are
`validate`, `inspect`, static `graph`, help and version. `init`, `discover` and
runtime operations are unsupported. Package metadata remains private
`0.5.0-alpha.1`; it does not indicate a published download.

Use the exact Node 26.13.0/npm 11.20.0 toolchain and the existing pinned compiler:

```sh
npm ci --ignore-scripts
npm ci --prefix packages/validation --ignore-scripts
npm run build --prefix packages/validation
npm run build --prefix packages/cli
node packages/cli/dist/main.js --help
node packages/cli/dist/main.js validate --root examples/minimal-team --format json
node scripts/reference-cli-smoke.mjs
```

The CLI build creates an ignored local development link to the adjacent
compiled validation package, refusing to replace an unrelated existing
dependency. Runtime code resolves the installed public package normally; it
has no source-tree or historical-prototype fallback. The verifier relocates
the actual compiled entry and extracted validation package outside the checkout.
Neither development linking nor this staging is NF-107's final offline
installation or NF-109's native lifecycle qualification.

`readWorkspace({ root, project?, files? })` is the only project-file read facade.
It uses public parsing/source-planning helpers and returns private raw documents
for validation, never public output. Symlinked roots/components, escapes,
non-regular sources, oversized/non-UTF-8 YAML, duplicate sources and ambiguous
Projects reject. It is not an OS sandbox; parent-component race confinement
remains a separate boundary.

Installed CLI/library metadata and the public API version are checked before
workspace reads. Help/version need no project or library initialization; version
reports the required library API, not a claim that a library was loaded.

The [concrete output schema](contracts/output.schema.json) and
[command/diagnostic guide](../../docs/reference-cli-preview.md) define the new
`0.5-preview.1` envelope, safe output, exit codes, compatibility and limitations.
No command writes project/report files, reads credentials, uses network or
subprocesses, loads executable extensions or initializes a workflow runtime.
