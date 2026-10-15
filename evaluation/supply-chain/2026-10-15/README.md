# NF-102-02: Current Supply-chain And Provenance Evidence

Status: evidence collected; acceptance **blocked / not-ready**. This is not a
security approval, release, architecture acceptance, or dependency repair.
All original NF-056-11 reports remain unchanged. The review mode is the adopted
single-maintainer mode; no independent review or legal consent is invented.

## Immutable Inputs And Actual Scope

Candidate/package checkout: `a3dea0a3de7018e14057a9bc15307325439b500d`, the merge
of [PR #120](https://github.com/iwizy/NexFlow/pull/120), head
`f5526e6a88774ac7149c36c06a39b7235cf29ee6`. Candidate source bytes are unchanged
from the public-contract qualification at
`63c86bc4a010bdca79af8190a9a521838f421b75`; the manifests bind every candidate
source and lock to the current checkout. The frozen specification revision is
`1d1fa238ab5729a79bee9389d5c66cfd20a61256`; corpus and complete library catalog
digests remain `01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`
and `f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.

The current collection/rebuild source is
`2dda6a5e3eb3cc4f71cd4f491eea7fffb2ba4a4a` (the exact source is also recorded
in each JSON record); license collection has its own recorded source revision.
These are trusted evidence tools, not candidate runtime dependencies. They do
not execute manifest-selected tools, extensions, providers or credentials.

Actual cohort: native macOS 27.0.1 / Darwin 27.0.0 / ARM64, Apple M4 Pro.
It is supplemental, **not** the frozen macOS 15 cohort and not evidence for
Linux AMD64 or Windows AMD64. [Closure](closure.json) records exact tool/file
hashes, runtime versions, native install names and independent build receipts;
[build inputs](build-inputs.json) record the observed compiler/linker/SDK.
The latter is a host fingerprint, not a traced proof of every compiler input.

## Candidate Graphs, SBOMs And Current Advisory Results

All scans were fetched on 2026-10-15 by the committed `nf-056-11-osv-v1`
scanner against the [OSV v1 API](https://google.github.io/osv.dev/).
Queries, versions, pagination, match IDs, affected ranges, upstream references,
response/source digests and timestamps are retained. The live service supplies
no database snapshot identifier. Version matches are not exploit findings.

| Graph | Components / version queries | Advisory records | Result |
| --- | --- | --- | --- |
| [TypeScript](typescript/inventory.json) / [SBOM](typescript/sbom.cdx.json) / [scan](typescript/advisories.json) | 30 / 30 | 0 | No observed version match, not security approval |
| [Python](python/inventory.json) / [SBOM](python/sbom.cdx.json) / [scan](python/advisories.json) | 68 / 66 | 16, representing 8 CVE families | Open build/provisioning risk review |
| [Rust](rust/inventory.json) / [SBOM](rust/sbom.cdx.json) / [scan](rust/advisories.json) | 74 / 74 | 0 | No observed version match, not security approval |
| [Go](go/inventory.json) / [SBOM](go/sbom.cdx.json) / [scan](go/advisories.json) | 8 / 9 including stdlib | 18 | Module, target and stdlib surfaces separated |

Go now includes the full selected module set, not only compiled imports or the
five archive identities in the original go.sum. The additional x/mod v0.8.0,
x/sys v0.5.0 and x/tools v0.6.0 are non-compiled transitive modules with observed
cache archive hashes; **no new go.sum entries were retained**. The selected
module graph is in [licenses.json](licenses.json); the SBOM dependency edges
describe compiled module imports, not an invented complete test-import graph.

The Node distribution's npm/Corepack tools are inventoried separately:
[186 package versions](node-tooling-inventory.json),
[26 advisory records](node-tooling-advisories.json). This tooling graph was
absent from the old candidate-only scan. The separate exact
[Go toolchain query](go-toolchain-advisories.json) returned two records.
The [maintenance npm graph](maintenance-advisories.json) has seven queries and
zero matches; it substitutes for none of the above.

All four SBOMs passed structural validation against the hash-pinned official
CycloneDX 1.6 schemas with Ajv 8.20.0. See [validation](sbom-validation.json).
Their composition remains **incomplete**: schema validity does not establish
complete compiler/interpreter/native closure.

## Static Advisory And License Review

[Static review](static-review.json) retains all 62 advisory inputs in order,
including aliases: 0 confirmed candidate exploits, 9 bounded not-actionable
verdicts, 53 needs-review verdicts. Queue ranks prioritize plausible archive
and network provisioning exposure; they are not severity or language scores.
This first pass used static source and metadata only, with no PoC or dynamic
exploit validation. Unknown preconditions remain unknown.

Go's norm/precis, x/sys/windows and x/mod affected packages and html/template
are absent from the recorded compiled package set. The two cmd/go malicious
project prerequisites are excluded by trusted fixed module inputs and
GOTOOLCHAIN=local. These narrow exclusions do not approve those versions for
other targets, alternate builds or future runtime use. Remaining stdlib paths
retain review gaps despite the unconditional local schema loader.

Python's candidate API imports YAML/jsonschema/referencing, not archive unpack,
legacy PackageIndex, jaraco tarball or reusable msgpack Unpacker APIs. Pip's
cache uses msgpack.loads; its download path disables content decoding, a
counterexample to the deflate-stream claim for that path. This does not clear
all pip/proxy/build-tool usages. npm's --ignore-scripts suppresses lifecycle
scripts, **not** pacote/tar archive parsing. Hash locks constrain selected
archives but do not constitute a complete vulnerability disposition.

[License review](licenses.json) has one row for each of 180 candidate
components, eight Go license-text mappings, and 32 distinct exact-version
public PyPI declaration receipts for 34 original NOASSERTION entries. All Go
license files are now available, including non-compiled modules. Go yaml/v3
requires MIT **and** Apache-2.0 obligations for different files, not a guessed
single permissive license. Python vendored text attribution and distribution
obligations remain unaccepted; upstream metadata is not legal approval.

## Provenance, Offline Provisioning And Repeatability

Current builds used Node 22.23.2 / npm 10.9.8 / TypeScript 7.0.2, CPython
3.12.14, rustc/Cargo 1.99.0 and Go 1.27.1. Node and Go were freshly acquired
from official distribution URLs and checked against exact SHA-256 receipts.
All three Rust archives were checked against the frozen approved hashes;
54 installed compiler/stdlib files matched archive payload bytes. The Rust
archives retain 14 license/notice receipts. CPython's observed bytes are hashed,
but its original distribution/build provenance is unavailable.

The closure records the tool distributions' file manifests and native library
install names, plus the actual interpreter-reported OpenSSL 3.5.8, zlib 1.2.12,
SQLite 3.53.1 and PyYAML libyaml 0.2.5. These observations do not create a full
versioned compiler-internal SBOM, independently verify the rpds-py embedded
all-target SBOM, qualify shared-cache OS libraries, or perform exhaustive
Node/CPython/LLVM/native vulnerability matching.

Network-backed provisioning and advisory collection are separate from builds.
Prepare exact official tools and immutable caches first. Candidate recipes are:

- TypeScript: `npm ci --ignore-scripts --offline --no-audit --fund=false`, then
  `npm run build`.
- Python: fresh venv without bootstrap pip, wheel-only `pip --python` install
  with `--no-index --require-hashes --only-binary=:all:`, then `pip check` and
  checked-hash bytecode compilation with source-relative filenames.
- Rust: `cargo build --frozen --offline` with pinned rustc/Cargo/stdlib and a
  distinct clean target directory. The frozen schemas are compile inputs.
- Go: `GOTOOLCHAIN=local GOPROXY=off GOSUMDB=off CGO_ENABLED=0`, `go mod verify`,
  and `go build -mod=readonly -trimpath -buildvcs=false` with a distinct empty
  build cache. Module cache provisioning is done in a disposable manifest copy.

Two clean source/output roots were exported from the exact candidate/package
revision, including schemas. Both builds completed for all four candidates.
Selected TypeScript (24), Python source/bytecode (26) and Go (2) artifact sets
were byte-identical between roots. All three Rust debug executable/library
receipts differed. No cause is asserted from hash differences alone; this
recipe is not byte-reproducible across those roots. This is same-cohort evidence,
not general hermetic reproducibility or lifecycle acceptance. Package-manager
offline flags and venvs are not OS-denied networking or a sandbox.

Two preparatory harness failures are retained in [attempts](attempts.json):
an incomplete temporary npm distribution, then a source export that omitted
Rust's schema compile inputs. Both were corrected in tooling/provisioning only;
neither is presented as a candidate defect or hidden successful run.

## Remaining Acceptance Blockers And Handoff

1. Obtain independently verifiable CPython origin/build provenance.
2. Close compiler-internal, interpreter-bundled, rpds/libyaml and native/OS
   versioned SBOM/advisory/license coverage, or obtain a separately reviewed
   explicit prerequisite boundary; file hashes alone do not close it.
3. Disposition the 53 unresolved static advisory inputs, including npm's bundled
   graph, and Python vendored licensing/distribution obligations. No risk was
   silently accepted and no automatic update/fix was applied.
4. Qualify a byte-reproducible Rust build recipe or explicitly review its
   distribution requirement; the two observed debug builds differ.

These findings require a separate scoped repair/qualification or explicit
maintainer decision. Candidate sources/locks, corpus, oracle, historical
qualification reports, versions and releases are unchanged. NF-102-02 remains
an open acceptance blocker; NF-102's review closure and RFC-0023 Draft status
are not altered. CI verifies evidence consistency and fail-closed controls,
not new native, legal, security or distribution acceptance.

To reproduce collection, supply a private task-local configuration to
`runtime-supply-chain-current-run.mjs`, `runtime-supply-chain-closure-collect.mjs`
and `runtime-supply-chain-license-collect.mjs`. Keep configuration paths out of
public evidence. Run `npm run runtime-supply-chain-current-smoke` offline to
check the saved source-bound records.
