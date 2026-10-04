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
failed/not-tested results. Final four records and immutable job links are added
only after actual native collection finishes.
