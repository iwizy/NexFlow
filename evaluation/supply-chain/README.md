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

Collected 2026-10-04 using committed source
f8f66a9122d73a195698966785d968cdd395de7b, following the initial source
fa92158499510666894debcfaa7cf5f9e0b17955. The forward check binds normalized
matches to the actual querybatch pages, including a hidden-advisory rejection.
[Prerequisite PR/CI evidence](prerequisites.json) confirms merged #95/#96/#97/
#99/#100 with exact published and merge revisions; NF-056-10 is not required.

| Candidate bundle | Inventory components | Exact version queries | Matched package versions | Advisory records / CVE aliases |
| --- | --- | --- | --- | --- |
| [TypeScript inventory](typescript/inventory.json), [SBOM](typescript/sbom.cdx.json), [advisories](typescript/advisories.json) | 30: 11 installed, 19 other-platform | 30 | 0 | 0 / 0 |
| [Python inventory](python/inventory.json), [SBOM](python/sbom.cdx.json), [advisories](python/advisories.json) | 68: 15 installed, 36 vendored, 17 upstream native | 66 | 6 | 16 / 8 |
| [Rust inventory](rust/inventory.json), [SBOM](rust/sbom.cdx.json), [advisories](rust/advisories.json) | 74 target-resolved crates | 74 | 0 | 0 / 0 |
| [Go inventory](go/inventory.json), [SBOM](go/sbom.cdx.json), [advisories](go/advisories.json) | 5: 3 compiled, 2 unused locked entries | 6 including stdlib | 1 | 1 / 1 |

Python matches include installed setuptools 80.9.0 and wheel 0.45.1, plus
vendored jaraco.context 5.3.0, msgpack 1.1.2, setuptools 70.3.0 and urllib3 2.7.0.
GHSA and PYSEC aliases describe the same eight CVEs, not sixteen distinct
vulnerabilities. Several are rated high by their upstream advisory database.
All remain unremediated and reachability is not-tested; neither installing
wheels nor avoiding a particular build command accepts these risks.

Go matches [GO-2026-5970](https://pkg.go.dev/vuln/GO-2026-5970) /
CVE-2026-56852 in x/text v0.14.0. The upstream report names Unicode normalization
handling before v0.39.0; no actual candidate exploit/reachability verdict is
claimed. Zero TypeScript/Rust matches is only the observed database response,
not a passed security gate.

The inventories retain 46 observed artifact receipts, all source/lock digests,
15 Python wheel hashes, Rust archive checksums/build-script/macro inventories,
Go package/link metadata, and separately verified cached tool archives.
CPython download provenance remains unavailable. Python has 34 NOASSERTION
license entries; Go retains five unclassified module license expressions,
with available cached license-file hashes and two uncached test-only gaps.
These are visible review work, not a complete accepted license/native closure.

All four SBOM structures were validated with Ajv 8.20.0 against the official
CycloneDX 1.6 schema and its two auxiliary schemas; annotation formats were
not asserted. [Validation receipt](sbom-validation.json) records exact schema
URLs/hashes and scope. CI verifies saved inventory/SBOM/advisory consistency,
exact source/collector Git blobs and 28 synthetic control/rejection cases.
It does not rerun the network-backed database or certify native artifacts.

Supply-chain acceptance remains partial for all four candidates; outcome is
not-ready. No candidate locks, sources, corpus, scorecards, versions or releases
changed, and no vulnerability repair was performed.
