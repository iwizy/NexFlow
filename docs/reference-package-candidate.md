# Reference Package Candidate

NF-107 supplies an **unreleased installable candidate** for the bounded
[0.5 CLI contract](0.5-cli-contract.md). It packages the NF-105 library and NF-106
commands without changing manifest meaning, diagnostics, versions or runtime
authority. Registry publication, a public release and full native lifecycle are
separate decisions. The broader RFC-0011 remains Draft.

## Build From An Exact Revision

Use external Node **26.13.0**, npm **11.20.0**, TypeScript **6.0.3**, and npm's
bundled tar **7.5.22**. Provision the existing locks with scripts disabled:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix packages/validation --ignore-scripts --no-audit --no-fund
node scripts/reference-packages.mjs --out /absolute/new-output-directory
```

The builder requires a clean exact Git commit, the original schema snapshot and
the complete existing production graph. Output must be a new directory outside
the checkout; an existing candidate is never overwritten. Source dependency
provisioning may need network or a separately provisioned cache. Package
assembly uses only those installed locked inputs and offline npm packing;
install/build scripts are disabled. No dependency repair is part of NF-107.

Each candidate set contains:

```text
nexflow-cli-0.5.0-alpha.1.tgz
nexflow-validation-0.5.0-alpha.1.tgz
nexflow-cli-0.5.0-alpha.1.schemas.json
nexflow-validation-0.5.0-alpha.1.schemas.json
PROVENANCE.json
SHA256SUMS
```

CLI and validation packages remain private `0.5.0-alpha.1`. The CLI declares and
bundles its exact matching library; the library bundles all seven locked
production dependencies. A separate CLI lock is not resolved from a registry:
its only dependency is the actual bundled library, and that closure comes from
the unchanged validation lock. Provenance records the actual graph and lock
hashes. Compiler/types are build inputs, not installed runtime dependencies.

The distribution stage keeps compiled code/declarations, package metadata,
required dependency code, embedded schemas, consumer verification and legal
materials. Tests, benchmarks, dependency source trees, evaluation outputs,
credentials, checkout paths and native binaries are excluded. Dependency
metadata and license texts remain original. Node-specific dependency exports
are included; unneeded browser entry points are not a supported package surface.
No dependency or package install script is enabled.

## Verify And Install The Actual Bytes

Select one exact source revision and trusted candidate set. Verify its
`SHA256SUMS` before npm extracts anything, then use a new consumer/cache:

```sh
shasum -a 256 -c SHA256SUMS
npm install --prefix ./consumer --offline --ignore-scripts --no-audit --no-fund --update-notifier=false --cache ./empty-cache ./nexflow-cli-0.5.0-alpha.1.tgz
node ./consumer/node_modules/@nexflow/cli/verify-package.mjs
./consumer/node_modules/.bin/nexflow --help
./consumer/node_modules/.bin/nexflow --version
./consumer/node_modules/.bin/nexflow validate --root ./your-project --format json
./consumer/node_modules/.bin/nexflow inspect --root ./your-project --format json
./consumer/node_modules/.bin/nexflow graph --root ./your-project --format json
```

Install the separate validation tarball in another empty consumer for its pure
public API, then run that package's `verify-package.mjs`. Local installation is
qualified separately from later native target lifecycle. Do not install both
archives into the same consumer to infer the CLI's dependency closure.

Each archive includes `LICENSE`, `NOTICE`, original dependency licenses,
`build-info.json`, an exact `package-inventory.json`, and a standalone consumer
verifier. The inventory lists paths, bytes, SHA-256 and executable status for all
regular files except itself; the trusted outer archive digest covers that file.
Consumer verification rejects missing, modified or unexpected files and links,
checks installed package/schema composition, compiles local schema refs and
initializes the public validation API without network or writes. It does not
authenticate an untrusted inventory or publisher. Checksum/Git identity is not
an independent publisher signature.

Archives contain no links. On the checked Unix installations, npm creates one
declared YAML bin symlink inside the bundled closure. Verification permits only
that exact link and its inventoried target; arbitrary links still reject.
`--update-notifier=false` is required separately: npm's own update lookup may
otherwise attempt a request despite `--offline`. The install verifier rejects
any observed application-level network attempt, including that lookup.

## Embedded Schema Contract

The closed [index schema](../packages/cli/contracts/schema-bundle.schema.json)
implements the inventory/digest/local-ref parts of
[schema publication](schema-bundle-publication.md). Each package has 18 exact
files: 17 manifest kinds plus `common.schema.json`. IDs and the manifest dialect
remain unchanged. Index entries are sorted, with unique IDs, paths and kinds;
every `$ref` stays within the locally registered closure.

The CLI embeds a versioned `schemas/0.1/` copy; the library retains its existing
`dist/schemas/` payload. Its embedded schema data and byte inventory remain
pinned to NF-105's schema snapshot. The package build revision and historical
schema snapshot revision are recorded separately, rather than silently updating
the library's source pin. Embedded indexes bind their package's build revision.
Each detached `.schemas.json` is byte-identical to its own embedded index.

For this preview, index `artifactVersion` follows the containing package version
explicitly; `specVersion` and `bundleFormatVersion` retain independent meanings.
This is **not** an independent schema artifact publication, hosted schema URL,
new manifest-bundle support or conformance claim. The separately published
schema product remains Planned.

## Evidence And Real Predecessors

```sh
node scripts/reference-packages-smoke.mjs --out /absolute/new-candidate-directory --report /absolute/qualification.json
```

The verifier makes two clean builds and compares actual archive/provenance
bytes. It validates checksums and detached indexes, preflights bounded regular
archive entries, performs separate clean installs from empty caches with
offline npm and application-level network denial, then exercises the installed
bin/public library outside the checkout. Maintained projects, historical CLI
failures, JSON contracts, safe reads/effects and corruption rejection remain
checked. This is not an OS sandbox. Local macOS and Linux CI do not establish
Ubuntu/macOS/Windows native install/upgrade/rollback acceptance.

[Candidate CI](../.github/workflows/reference-packages.yml) checks out the exact
PR head and uploads both actual tarballs, detached indexes, provenance,
checksums and qualification record in one revision-named artifact for 90 days.
Archive digests are reproducible across builds of the same revision; a different
source revision changes provenance and therefore candidate identity.

Keep the first successful candidate's **original** bytes and source/run/artifact
identities as the real predecessor for NF-109. Download and checksum-verify it
before CI retention expires; retain a separate local copy under
`dist/reference-candidates/<source-revision>/` in the primary checkout. Preserve
its checksum/provenance set together. CI artifacts are temporary evaluation
delivery, not product release assets or a permanent publication promise.
Upgrade/rollback remains not-tested until a substantively corrected successor
exists and both real candidates are run on the target. Repacking identical
code under an invented preview version is not a lifecycle test.

NF-108 must assess these actual artifact dependencies/bytes; NF-109 qualifies
the selected native targets and upstream runtime route; NF-110 reviews the final
candidate and publication authority. No publisher signatures, Developer ID,
notarization, Authenticode, embedded interpreter or installer are provided here.
