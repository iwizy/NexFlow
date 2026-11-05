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
node ./consumer/node_modules/@nexflow/cli/dist/main.js --version
node ./consumer/node_modules/@nexflow/cli/dist/main.js --help
node ./consumer/node_modules/@nexflow/cli/dist/main.js validate --root ./your-project --format json
node ./consumer/node_modules/@nexflow/cli/dist/main.js inspect --root ./your-project --format json
node ./consumer/node_modules/@nexflow/cli/dist/main.js graph --root ./your-project --format json
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
installation the verifier permits only npm's exact declared YAML bin symlink
on Unix, or the three exact npm 11.20.0-generated YAML wrappers on Windows.
Their target remains covered by the inventory; modified wrappers reject.
The installed user entry is `consumer/node_modules/.bin/nexflow` on Unix or
`consumer/node_modules/.bin/nexflow.cmd` in Windows PowerShell/cmd. The explicit
`node .../dist/main.js` form above works on all qualified targets without
changing a PowerShell execution policy or relying on a global installation.

The CLI emits `0.5-preview.1` text/JSON results. Successful schema/declared checks
do not establish complete semantics, Core/extension profiles or execution
authority. `init`, discovery scans and runtime commands are unsupported. CLI
operations do not write project/report files or use provider/network/credential,
subprocess or executable-extension effects.

Preserve the original candidate bytes, provenance and checksum set. A genuine
future corrected source revision may supply a successor for upgrade/rollback;
relabeling these bytes is not a predecessor test. Qualification is always bound
to exact archive digests: select the matching security and native records in
the release review. Node 26.13.0/npm 11.20.0 targets are Ubuntu 24.04 AMD64,
macOS 15 ARM64 and Windows Server 2025 AMD64. Other versions are unsupported
until separately qualified. A checked predecessor is test input, not a security
recommendation to deploy an older affected candidate.

For migration, rollback, best-effort support and correction/withdrawal routes,
read `docs/reference-cli-installation.md` and
`docs/reference-cli-compatibility.md` in the repository revision recorded in
`build-info.json`. Public publication remains separately authorized. No
Developer ID, notarization, Authenticode, independent publisher-signature or
general OS sandbox claim is made.
