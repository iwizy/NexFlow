# Candidate Supply-chain Evidence

NF-056-11 collects dependency metadata for the four exact source revisions in
[source-pins.json](../fidelity/source-pins.json). It does not change candidate
code, versions, dependency locks, the frozen corpus, fidelity verdicts or
architecture scorecards. Its scope is evidence preparation, not security or
license approval. NF-056 and the next architecture checkpoint remain not-ready.

## Collection Boundary

The trusted [collector](../../scripts/runtime-supply-chain-collect.mjs) verifies
clean pinned sources, hashes source/lock bytes, inspects installed/cache metadata,
and repeats the native macOS ARM64 offline builds. It records TypeScript emitted
files, Python source/compiled bytecode and wheel/native-extension receipts, and
Rust/Go CLI and library-driver executable checksums. These are source-bound
evaluation artifacts, not installed distribution packages. Absolute paths,
upstream build-user attribution and environment secrets are not copied into
evidence. Required system-library paths in linking inventories are not personal
paths. Checksums do not prove signed provenance or reproducible builds.

Inventories distinguish installed/build/other-platform dependencies:

- npm: every exact lock entry, including excluded platform compiler packages;
  installed versions and lifecycle-disabled offline provisioning are verified.
- Python: the 15 hash-locked wheels, installed dependency markers, vendored build
  tooling and the 17 Rust entries in the upstream rpds-py wheel SBOM. The latter
  is an all-targets upstream declaration, not an independent linked-binary audit.
  Unknown vendored license attribution stays NOASSERTION; owner license-file
  digests are retained, not inferred to license every embedded component.
- Cargo: target-filtered metadata, features, dependency kinds, build-script and
  procedural-macro declarations, crate archives checked against Cargo.lock,
  native linking libraries and debug artifact receipts.
- Go: every compiled module/package and standard-library package, plus all
  go.sum archive identities, including unused test-only entries. Additional
  uncached transitive test-module metadata remains not-tested: offline
  go list -m all failed and no new sums were added.

The external Node/CPython distributions, compiler internals, libyaml inside a
native wheel, OS libraries and complete native closure are not independently
inventoried or certified. Release signing, clean install/upgrade/rollback/
uninstall and Linux/Windows artifacts belong to later explicitly authorized
work. Offline caches are provisioning prerequisites, not sandboxes.

## SBOM And Advisory Method

Each bundle includes an inventory, a
[CycloneDX 1.6](https://github.com/CycloneDX/specification/tree/1.6) JSON SBOM and
a dated advisory record. The SBOM lists the same versioned components and graph
as the inventory, preserves upstream-declared license names, and explicitly
marks overall composition incomplete for unresolved native/runtime closure.
It is not an independently approved license conclusion.

The separate [scanner](../../scripts/runtime-supply-chain-scan.mjs) sends only
public ecosystem/package/version identities to the
[OSV v1 querybatch API](https://google.github.io/osv.dev/post-v1-querybatch/).
It follows pagination and preserves queries, match IDs/modified dates, response
digests and fetched advisory affected ranges, aliases and source digests.
Scanner source revision/version and timestamps are pinned; the live service
provides no database snapshot/version identifier. These are version matches,
not reachability analysis. Zero matches is not a security pass. OS/compiler/
interpreter coverage, unpublished vulnerabilities and source audits remain
not-tested. Go stdlib is queried separately by its pinned version.

Network-backed advisory retrieval is separate from offline candidate builds.
It is evaluation tooling, never a manifest-executed or provider/runtime effect.
The root maintenance npm graph is not used as a substitute for any candidate.
No audit fix, lock update or vulnerability repair is authorized by this study.
Public, already disclosed dependency advisories may be referenced here; any
new private repository vulnerability follows [SECURITY.md](../../SECURITY.md).

## Reproduce

Provision the exact runtimes and caches separately from the clean candidate
checkouts. The collector accepts one private JSON configuration argument with
sources for all four candidates, node/npm/npmCache, python/wheelhouse,
cargo/rustc/rustdoc/cargoHome/rustTarget and go/goPath/goCache. Those task-local
paths must not be saved in public reports.

~~~sh
node scripts/runtime-supply-chain-collect.mjs "$TASK_CONFIGURATION_JSON"
node scripts/runtime-supply-chain-scan.mjs evaluation/supply-chain/typescript/inventory.json
npm run runtime-supply-chain-smoke
~~~

The collector writes JSON to stdout; optional --interactive streams bounded
field slices for large inventories. Capture generated evidence through a
reviewed file-edit workflow. Repeat advisory retrieval separately for Python,
Rust and Go. Preserve observed failures and untested coverage. CI runs offline
consistency/rejection checks; it does not silently refresh vulnerability data
or rerun local native builds.

Preflight repairs affected only this collection harness: metadata comparison
excludes later README prose changes, Packaging Specifier attributes are read
explicitly, Cargo archive hashes come from actual cache bytes and Cargo.lock
instead of an absent extraction sidecar, and Go reports its real compiled
closure rather than inventing a complete uncached test graph.

## Bundles

Final collected bundle links and dated results are added after the committed
collector is rerun. No incomplete preflight data is an accepted security gate.
