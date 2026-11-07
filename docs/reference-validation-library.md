# Reference Validation Library Preview

NF-105 implements the separate TypeScript validation package and read-only
workspace adapter required by the [0.5 CLI contract](0.5-cli-contract.md).
The [library API/build instructions](../packages/validation/README.md) and
[adapter boundary](../packages/cli/README.md) describe actual source behavior.
Neither package is published. NF-106 adds a separate
[executable source preview](reference-cli-preview.md); final CLI installation
and release remain subsequent work.

## Extraction And Evidence

The implementation derives from the exact reviewed candidate sources at
`23e576efd0dda0f00f5462eda9295c1ae4ec8fee`, read from current source baseline
`80e58939be45c097cbda58f20bfeb47739324dcd`. Original candidate files, lockfiles,
corpus, schemas, oracle and historical reports remain unchanged.

The separate package retains pure schema and implemented fragment algorithms,
embeds the 18-file schema snapshot and semantic rule data at build time, and
exports one constrained main entry. Arbitrary-schema compilation and semantic
fragment regression surfaces are internal. In particular, passing those frozen
cases does not expose full project semantics or custom schema overrides publicly.

The public API adds safe data results and explicit unsupported kind/version
handling. It is not a drop-in ABI for the experimental `evaluateLibraryCase`,
`evaluatePublicLibraryCase`, filesystem-capable facade or `0.4-draft` CLI output.
Raw schema diagnostic normalization is retained internally for comparison;
preview-facing required-field locations use the sanitized field pointer and
unknown kind values are not echoed. The executable CLI envelope/exit contract
is implemented separately by [NF-106](reference-cli-preview.md), without
changing this library's frozen qualification record or source API.

The focused [qualification record](../evaluation/reference-validation/nf-105.json)
binds schema/catalog/corpus hashes, complete 352-case observations, safe public
API/adapter checks and the actual reproducible tarball digest. The current
[qualification workflow](../.github/workflows/reference-validation.yml) runs the
same verification on its own exact checkout, rather than reusing a local pass.

## Verification Scope

`node scripts/reference-validation-smoke.mjs` requires the selected Node 26.13.0 and npm
11.20.0. It builds twice, compares complete output inventories and packed bytes,
then relocates/extracts the library outside the source tree. It checks actual
entry exports, declarations, all maintained example manifests, unchanged inputs,
safe errors, bounded discovery and package-local module loading with application
effect APIs denied. These are focused application checks, not an OS sandbox.

The catalog's 211 semantic-fragment, 8 workflow-namespace, 5 artifact-namespace
and 5 local-schema cases are private-kernel regressions. The remaining cases
exercise parsing, manifest schemas and workspace discovery. Separate checks
exercise the new public entry and safe declared inspection; the report does
not claim all seven catalog operations are a public product API.

Local macOS results are supplemental library/build evidence. Linux CI verifies
its exact library workload; neither substitutes for the three-target native
CLI lifecycle in NF-109. The NF-105 record did not test CLI commands; NF-106 has
separate source-command evidence. Complete semantic/Core/extension claims, OS
containment, current public-artifact supply-chain/security acceptance,
signing/notarization and release readiness remain outside this library record.

The pinned dependencies are not upgraded or newly declared vulnerability-free.
NF-108 must assess the actual new graph and distribution route, including prior
advisories; 0.4's dated dispositions are not automatic approval of this package.
