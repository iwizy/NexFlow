# NexFlow Unreleased Package Candidate

This is validation-only tooling for manifests with `specVersion: "0.1"`.
The package is `0.5.0-alpha.1`; it is not a published release or a runtime.
Use external **Node 26.13.0 and npm 11.20.0**, acquired through a separately
verified upstream route. No interpreter or native executable is bundled.

Select the exact source revision in `build-info.json` and obtain its complete
candidate set. Verify `SHA256SUMS` from that same trusted source before install.
Checksums establish byte identity, not an independent publisher signature.

Install an exact local tarball into a new directory; scripts stay disabled:

```sh
npm install --prefix ./consumer --offline --ignore-scripts --no-audit --no-fund --update-notifier=false --cache ./empty-cache ./nexflow-cli-0.5.0-alpha.1.tgz
node ./consumer/node_modules/@nexflow/cli/verify-package.mjs
./consumer/node_modules/.bin/nexflow --version
./consumer/node_modules/.bin/nexflow --help
./consumer/node_modules/.bin/nexflow validate --root ./your-project --format json
./consumer/node_modules/.bin/nexflow inspect --root ./your-project --format json
./consumer/node_modules/.bin/nexflow graph --root ./your-project --format json
```

The CLI archive contains its matching validation library and complete pinned
production dependency closure. Installing the separate validation tarball into
another clean consumer provides the pure `@nexflow/validation` API without CLI
commands. Run that package's `verify-package.mjs` too. Neither install needs a
source checkout or registry lookup. Build-time dependency acquisition is separate.

`package-inventory.json` describes every regular file except itself. The outer
archive digest protects that inventory. `schema-bundle.json` lists 18 schema
files (17 kinds and common definitions), exact IDs, local refs and digests.
Its detached `.schemas.json` copy must be byte-identical. CLI copies use
`schemas/0.1/`; the library's existing copy uses `dist/schemas/`. These are
embedded package snapshots, not an independently published schema release.
The consumer verifier checks composition, hashes, local closure and API setup;
it neither authenticates the publisher nor rewrites files.
The update notifier is disabled separately because npm may otherwise attempt
its own update lookup even in offline mode. Archives contain no links; after
installation the verifier permits only npm's exact declared YAML bin symlink,
whose target remains covered by the inventory.

The CLI emits `0.5-preview.1` text/JSON results. Successful schema/declared checks
do not establish complete semantics, Core/extension profiles or execution
authority. `init`, discovery scans and runtime commands are unsupported. CLI
operations do not write project/report files or use provider/network/credential,
subprocess or executable-extension effects.

Preserve the original candidate bytes, provenance and checksum set. A genuine
future corrected source revision may supply a successor for upgrade/rollback;
relabeling these bytes is not a predecessor test. Artifact security acceptance,
native three-target lifecycle, signing applicability and publication remain
separate gates. No Developer ID, notarization or Authenticode claim is made.
