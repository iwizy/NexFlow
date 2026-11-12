# Reference CLI Installation And Quick Start

This guide describes the first **unreleased** `0.5.0-alpha.1` developer preview.
The [release review](../release/0.5-preview-review.md) must select exact archives
and record technical readiness. A separate maintainer instruction is required
to promote `develop` to `main`, create `v0.5.0-alpha.1` and publish assets. The
proposed release is not a live download merely because these instructions exist.

## Select The Exact Package And Runtime

Use external **Node 26.13.1 / npm 11.20.0** on Ubuntu 24.04 AMD64, macOS 15 ARM64
or Windows Server 2025 AMD64. Check `node --version` and `npm --version` before
installing. Obtain the native Node archive through its official HTTPS route and
verify the corresponding upstream checksum; the native records also bind the
executing binary and license. Same-origin checksums are not independent publisher
authentication. Other runtimes/architectures are outside this preview's support.

The proposed distribution channel is GitHub prerelease assets, not npm registry
publication, a native app or an embedded interpreter. Before publication, the
reviewed CI artifact supplies staging bytes; it may require a GitHub login.
After publication, obtain the complete asset/checksum set from the exact tag.
Do not use a moving branch's tarball or an unrelated workflow artifact.

The base package set contains two `.tgz` archives, their two detached
`.schemas.json` indexes, `PROVENANCE.json` and a checksum file. The release packet
also includes its review, readiness and evidence assets. Verify every downloaded
asset against the selected review's recorded digests **before** npm extraction.
On Unix use `shasum -a 256 -c SHA256SUMS` or `sha256sum -c SHA256SUMS` with the
complete named asset set. On Windows use `Get-FileHash -Algorithm SHA256` and
compare the exact filename/digest entries. This validates identity, not signatures.

## Install In A Fresh Consumer

Use a new directory and empty cache. No global install, source checkout,
registry resolution or dependency lifecycle script is needed:

```sh
npm install --prefix ./consumer --offline --ignore-scripts --no-audit --no-fund --update-notifier=false --cache ./empty-cache ./nexflow-cli-0.5.0-alpha.1.tgz
node ./consumer/node_modules/@nexflow/cli/verify-package.mjs
node ./consumer/node_modules/@nexflow/cli/dist/main.js --version --format=json
node ./consumer/node_modules/@nexflow/cli/dist/main.js --help --format=json
```

Those explicit `node` commands work in Bash, PowerShell and cmd. Unix users can
instead invoke `./consumer/node_modules/.bin/nexflow`; Windows users can invoke
`./consumer/node_modules/.bin/nexflow.cmd`. No execution-policy bypass is needed.
Spaces/Unicode in paths and UTF-8 YAML filenames are included in native testing.
The verifier permits only exact npm-created YAML links/wrappers, while checking
the target, inventory, schemas, local refs and public API initialization.

The CLI bundles its matching library and all seven production dependencies.
For a pure library consumer, install the validation `.tgz` in a **different**
fresh directory with the same flags, run its `verify-package.mjs`, and import
`createValidator` from `@nexflow/validation`. Installing both tarballs in one
consumer does not prove the CLI's bundled closure. See [Library API](../packages/validation/README.md).

## A First Local Check

Create a new empty `project` directory and save this UTF-8 `project.yaml`:

```yaml
specVersion: "0.1"
kind: Project
metadata:
  project: hello-nexflow
  name: Hello NexFlow
project:
  id: hello-nexflow
  displayName: Hello NexFlow
  description: A local structural-validation quick start.
```

From the directory containing `consumer` and `project`, run:

```sh
node ./consumer/node_modules/@nexflow/cli/dist/main.js validate --root ./project --format=json
node ./consumer/node_modules/@nexflow/cli/dist/main.js inspect --root ./project --format=json
node ./consumer/node_modules/@nexflow/cli/dist/main.js graph --root ./project --format=json
```

Expect exit **0**, `success: true`, `formatVersion: "0.5-preview.1"` and
`executionAuthorized: false`. A successful structural Project check does not
establish a complete Core Profile project: semantic/Core/extension/runtime
checks remain explicitly `not-run`. For a complete authored example, see
[Examples](../examples/README.md); the candidate checks all eight maintained
project sets. No `init` or runtime command is included.

If `project.yaml` has duplicate keys or invalid YAML, expect exit **1** with a
safe diagnostic and no successful result. Unsupported version/kind/hint gives
**3**; invalid usage gives **2**; incompatible package/runtime/setup gives **4**.
Treat a nonzero exit, malformed output or missing/truncated response as failure.
The exact grammar/streams/limits are in the [preview contract](0.5-cli-contract.md).

## Upgrade, Rollback And Remove

Follow the [compatibility and rollback guide](reference-cli-compatibility.md).
Keep the genuine previous archive/checksum/provenance set. Verify the selected
new digest before replacing a consumer, then rerun package verification and the
same quick start. An offline cached success is not proof that new bytes installed.

Remove only the scoped package:

```sh
npm uninstall --prefix ./consumer --offline --ignore-scripts --no-audit --no-fund --update-notifier=false @nexflow/cli
```

Do not remove the user's Node, project manifests, parent directory, unrelated
packages or retained archives. Native records check preservation of those
boundaries. Maintainer support, security reporting and withdrawal responsibilities
are described in the compatibility guide and [Security Policy](../SECURITY.md).
