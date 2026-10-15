# NF-102-02: Authorized Supply-chain Repair And Closure

Status: completed within the original three evidence criteria. Owner/review mode:
Alexander Agafonov, single maintainer. RFC-0023 remains Draft/not-ready.
The maintainer explicitly authorized dependency/toolchain repair, separate PR,
and merge after checks on 2026-10-15. No technical criterion is waived.

The [completion record](completion.json) maps the original criteria to current
evidence. The [previous evidence-only record](../2026-10-15/README.md) and all
NF-056 reports retain their original bytes, dates, failures and limits.

## Immutable Inputs And Repairs

Candidate/package revision: `23e576efd0dda0f00f5462eda9295c1ae4ec8fee`.
Collectors have their own exact revisions and source hashes in each record;
later evidence-tool changes do not change candidate sources. Specification:
`1d1fa238ab5729a79bee9389d5c66cfd20a61256`; corpus SHA-256:
`01b116005f0650ac980194b22c02188289eaf1e8626b227aecf3684ece0d8f6b`;
full catalog SHA-256:
`f1bf8cb786442a212e14c79eb39279a2cdbf05ec20b09901374359d545d74e90`.
No schemas, corpus, catalog, oracle or candidate implementation was simplified.

[Repair pins and lock hashes](../../repairs/supply-chain/toolchains.json) select
Node 26.12.0 (runtime-only, OpenSSL 3.5.9), npm 12.2.0 with five compatible
transitive overrides, TypeScript 6.0.3, CPython 3.12.15, Go 1.27.2 with x/text
0.43.0, and Rust/Cargo 1.99.0. These are evaluation pins, not product support or
version decisions. TypeScript remains an independent native-library candidate;
the pure-JavaScript compiler removes the old compiler's vulnerable Go runtime.
All twelve emitted declaration files also match the three previously verified
original build sets, whose hashes were checked against the historical closure.

The npm provisioner does not execute the upstream bundled dependency tree.
It verifies the pinned npm source archive, copies its unchanged program files,
then hydrates each exact repaired lock entry only after archive integrity and
member checks. Scripts and ambient npm configuration are disabled. The complete
derived manifest and lock are retained separately from candidate locks.

Python has exactly nine runtime distributions, no pip/build/setuptools/wheel
inside its isolated virtualenv. The verified outer pip 26.2.1 provisioner accepts
only exact-name/version/hash locks and a local wheelhouse with no-index,
require-hashes and binary-only installation. Runtime/importable inventory does
not include the base interpreter archive's unused pip/ensurepip bootstrap
payload; those archived bytes are retained in the full file inventory. This is
not a claim that every general-purpose CPython API is vulnerability-free.

## Evidence And Original Criteria

1. Current built artifact/compiler/interpreter/native/license closure, SBOM and
   exact-hash provenance: four candidate inventories/SBOMs, [tool closure](tool-closure.json),
   [installation delta](installation.json), [Cargo source closure](cargo-inventory.json),
   [native inventory](native-inventory.json), [license index](license-index.json)
   and [ten official-schema SBOM validations](sbom-validation.json).
2. Dated four-graph vulnerability evidence and reviewed applicability/uncertainty:
   candidate advisory records, [tool/native dispositions](disposition.json),
   [primary native CPE responses](native-advisories.json) and source-bound scans.
3. Reproducibility and offline provisioning after authorized repairs:
   [two clean-root observations](rebuild.json), identical primary artifact hashes,
   exact pins/caches and the recipes below. Real earlier errors are retained in
   [the attempt record](attempts.json); no unsuccessful attempt is called a pass.

| Graph | Components | Current version-match advisory records |
| --- | ---: | ---: |
| TypeScript candidate | 10 | 0 |
| Python runtime and wheel source closure | 26 | 0 |
| Rust candidate | 74 | 0 |
| Go candidate | 8, plus standard-library query | 0 |
| npm provisioner | 146 | 0 |
| Outer pip and vendored sources | 19 | 12 |
| Rust compiler/stdlib all-target declarations | 1,455 | 59 |
| Go shipped compiler vendor sources | 15 | 14 |
| Exact Cargo source lock | 523 | 13 |

The 98 remaining tool advisory inputs and 79 native inputs are retained and
reviewed for the fixed local-only/offline recipe, not hidden by candidate zeros.
Compiler/dev/all-target source declarations are conservative supersets, not a
binary reachability proof. Online Cargo, arbitrary source builds, general V8/HTML
execution and all OS backports are not approved by those bounded dispositions.
Native scanning completed 30 primary CPE queries; no-match/unsupported databases
are not certification. The maintenance graph and three Node embedded npm
components have separate zero-match scans, never substitutes for candidate scans.

All 2,276 package/license rows and 46 native/version rows are mapped. The exact
upstream publications of `@npmcli/agent@5.0.2` and
`proxy-agent-negotiate@1.1.0` declare ISC/MIT but omit their own copyright/license
notice. Their declarations and canonical SPDX reference text are recorded with
that limitation; no publisher notice, legal consent or distribution approval
is invented. Full upstream texts, exceptions, Apache notices/patents, MPL source
obligations and external OS licenses must be retained where applicable.

## Reproduction And Checks

Provision only the exact checksum-verified archives/wheels/crates/modules in the
receipts. The private config supplies task-local paths, never public credentials
or candidate-selected commands. The Rust installation needs the recorded relative
LLVM library symlink for `rust-objcopy`; no verified binary or global installation
is patched. Final `cargo test --release --frozen --offline` passes 18 tests without
the earlier dyld/strip warnings. The two final clean roots and primary artifacts
use the same release profile and normalized source/target/cache paths.

```sh
node scripts/evaluation-npm-provision.mjs <new-scoped-tool-directory>
python3 -I scripts/evaluation-python-provision.py --help
node scripts/runtime-supply-chain-repaired-rebuild.mjs <private-config>
node scripts/runtime-supply-chain-repaired-run.mjs <private-config>
node scripts/runtime-supply-chain-tool-closure.mjs <private-config> --reuse-scans
node scripts/runtime-supply-chain-installation-receipt.mjs <private-config>
node scripts/runtime-supply-chain-cargo-closure.mjs <private-config>
node scripts/runtime-supply-chain-license-review.mjs <private-config> <verified-source-cache>
node scripts/runtime-supply-chain-sbom-validate.mjs
node scripts/runtime-supply-chain-completion.mjs
npm run runtime-validation-contract-smoke
npm run runtime-supply-chain-repaired-smoke
```

Inspect the checked provisioning sources before supplying paths. Reuse-scans accepts only an identical exact
query graph and hash-binds the original dated primary responses. The native scan
is deliberately separate, rate-limited and checkpointed; do not replay unchanged
queries just to replace their timestamps. Cache misses fail rather than fetch
during qualified builds. A new machine must explicitly provision verified caches
first. Normalized paths and checked-hash Python bytecode make the two roots
byte-identical; this is neither OS network denial nor a hermetic sandbox claim.

[Full public qualification](../../qualification/supply-chain-repair/comparison.json)
retains 362/362 public cases per candidate, 352/352 frozen native cases, 59/59
legacy CLI cases, ten regressions and sixteen explicit unsupported probes.
All 57 shared JSON CLI cases agree. Final repository checks and schema validation
are recorded in [checks](checks.json); actual PR/main CI and merge receipts are
recorded in the task card after publication, not predicted inside their own commit.

The observed native environment is supplemental macOS ARM64, not the frozen
Linux/macOS/Windows target contract. Native lifecycle/relocation, OS-denied
effects, signing/notarization, independent toolchain rebuild/attestation,
cross-target measurements and architecture choice are not passed here.
NF-102-03 through NF-102-06 remain open. No product release, tag, package,
version bump, production runtime or architecture acceptance was performed.
