# Read-Only Workspace Adapter

NF-105 supplies `src/workspace.ts` and `src/files.ts` for the future CLI. There
is no bin entry, argument dispatcher, graph command or installable CLI yet.
Those belong to NF-106/NF-107 under the [0.5 contract](../../docs/0.5-cli-contract.md).

`readWorkspace({ root, project?, files? })` is the sole filesystem-capable facade.
It uses the public validation entry for YAML parsing, source planning and
association checks, then returns a private in-memory document assembly. Do not
serialize those raw documents as public output. The validation package never
imports this adapter.

Root is explicit and nonempty. Symlinked roots/components, escapes, non-regular
sources, oversized/non-UTF-8 YAML, repeated sources, unknown hints and ambiguous
Projects fail closed. Parent-component race resistance still requires actual
OS confinement; this helper is not an operating-system sandbox.

The source-only adapter has an exact validation peer version and TypeScript
declaration mapping. Its build uses the pinned compiler installed for the
validation package; it does not install a local-directory dependency or contact
a package registry. The focused test relocates its compiled files beside the
actual extracted library and exercises that package relationship. The eventual
CLI dependency/install closure remains NF-106/NF-107 work.
