# Linux AMD64 Evaluation Lifecycle

NF-056-12 evaluates private, source-layout capsules on the existing standard
`ubuntu-24.04` AMD64 hosted runner. It does not publish a product package,
select an architecture, change versions, or certify a supported CLI.

The prerequisite supply-chain evidence is immutable revision
`fed105367da915347a92896eb67c0446d9e9b2d7`, [PR #104](https://github.com/iwizy/NexFlow/pull/104).
This change is stacked on that still-open task branch; source and dependency
locks are unchanged. The [prerequisite receipt](prerequisites.json) identifies
NF-056-02/05/06/07/08/11 commits and successful CI. Supply-chain gates remain
partial, including disclosed Python/Go advisory matches and unknown licenses.

## Method

The [workflow](../../../.github/workflows/linux-lifecycle.yml) provisions exact
reviewed tools and hash-locked caches online first. Trusted evaluation tooling
then builds without network connectivity and creates a source-revision/collector-
revision versioned `.tar.gz` capsule with an ordered file/checksum inventory.
Build commands, native tools, environment fingerprint, capsule bytes/checksum,
source and lock digests are recorded. Capsules are temporary evaluation CI
artifacts, not npm/Python/Cargo/Go registry publications or NexFlow releases.

Installation extracts the verified capsule into a fresh task-owned prefix in
private Linux mount/network/IPC/PID namespaces, with capabilities dropped, a
clean environment and read-only synthetic input fixtures. Source-checkout schemas
are masked with an empty read-only directory. A synthetic network attempt and
an input write must fail before installed candidate commands run. All unchanged
11 shared CLI cases run twice; actual outputs, digests, errors, determinism and
input immutability are retained, including failures. A passing collector job
means evidence was captured, **not** that every lifecycle operation passed.

TypeScript preserves reviewed `dist/` and the seven runtime package graph entries
installed offline from its lock. Node 22.23.2 remains an external prerequisite.
Python packages reviewed source, schemas and hash-locked native wheels; a fresh
venv installs offline using pinned CPython 3.12.14 and pip 26.2.1. It is not a
standalone wheel distribution or an OS sandbox. Rust creates a native release
executable; its unchanged CLI embeds its build-checkout schema location, so
relocation is expected to expose an unsupported packaging boundary. Go preserves
its documented executable-relative source layout and bundled schemas, with cgo
disabled; this does not establish a stable installed package contract.

Uninstall removes only the temporary installation prefix and verifies that the
capsule remains unchanged. External interpreters, compilers and dependency
caches are prerequisites, not installed/removed product components.

## Open Gates

The full previous-artifact query on 2026-10-04 found 40 artifacts, all environment
receipts and no candidate package. Upgrade and rollback therefore remain
`not-tested`; a second identical capsule is not invented as a product version.
Signing and signature lifecycle are not tested. Artifact hashes and CI provenance
are not signatures or reproducible-build certification.

Native Linux observations do not make a rotated image match the frozen NF-056-02
measurement cohort. Fingerprint drift remains recorded; no contract, performance
score, complete security/license/provenance gate or distribution support claim
is approved. Full candidate semantics and diagnostics retain their prior failures.

## Reproduce

Use the exact workflow source commit and reviewed candidate source pins. After
provisioning the applicable compiler/cache as above, run on native Linux AMD64:

~~~sh
node scripts/runtime-linux-lifecycle.mjs typescript /tmp/lifecycle.json /tmp/evaluation-capsules
npm run runtime-linux-lifecycle-smoke
~~~

Do not run on ARM, translated execution or macOS and call it Linux evidence.
The consistency check is offline; it does not re-run installation or promote
failed/not-tested results.

## Actual Native Results — 2026-10-04

Collector revision `de6b25428e040a2968493c442e8f2e68d12e48b0` ran in
[native run 37209662888](https://github.com/iwizy/NexFlow/actions/runs/37209662888).
All four jobs captured real native Linux AMD64 evidence and temporary versioned
capsules. [Independent archive verification](archive-verification.json) recomputed
each capsule checksum and compared every unpacked file against its manifest.
ELF header inspection confirms x86-64 Rust/Go payloads, but that inspection was
not an additional native execution. Dynamic-linking/runtime closure remains
not-tested, not silently approved from a successful invocation.

| Candidate record | Capsule bytes | Build / clean extract | Shared cases passed / failed | Offline installed use | Scoped uninstall |
| --- | ---: | --- | ---: | --- | --- |
| [TypeScript](typescript.json) | 488720 | passed / passed | 11 / 0 | passed | passed |
| [Python](python.json) | 4574884 | passed / passed | 11 / 0 | passed | passed |
| [Rust](rust.json) | 2881007 | passed / passed | 1 / 10 | failed | passed |
| [Go](go.json) | 3685596 | passed / passed | 11 / 0 | passed | passed |

Each case ran twice: 88 installed process invocations in total, 68 satisfying
the unchanged expectations and 20 failing. Rust's ten failures returned exit 4
and `NEXFLOW-PROTOTYPE-INTERNAL` after source schemas were hidden. Only rejecting
`run` passed. This reproduces its documented source-checkout schema dependency;
extracting an executable is not a working portable install. The source candidate
was not repaired and the common expectations were not weakened.

All four namespace controls observed no network routes, `ENETUNREACH` from the
synthetic TCP attempt and `EROFS` from the read-only input write. Sources, locks,
corpus and installed capsule content stayed unchanged during invocations.
These are scoped offline/relocation observations, not complete security gates.

Upgrade, rollback and signing remain `not-tested` for every candidate. Every
distribution gate stays `partial`, with overall `not-ready`. No second historical
artifact or product version is invented. Linux image drift occurs in every
record; CPU/memory drift also occurs in some jobs. The unchanged environment
probe's cohort result concerns measurement eligibility, not the separate actual
CLI executions. No comparable benchmark or new frozen cohort is claimed.

The records retain immutable source/tooling revisions, lock hashes, all structured
attempts, artifact manifests/checksums, runtime/compiler prerequisites and job/
artifact receipts. Finite seven-day capsule retention is explicit; durable
records do not make an expired archive available. Root npm tooling, macOS runs
and fixture checks do not replace these native Linux observations.

When committed records match the current candidate and collector source hashes,
the workflow verifies their immutable evidence without repeating confirmed
installation runs or minting a second identical capsule. Native collection is
performed only when evidence is absent or those source bytes change.
