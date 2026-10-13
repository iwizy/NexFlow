# NF-102-01: complete declared validation/diagnostic qualification

**Task scope complete; architecture remains Draft/not-ready.** Source and
collector: `63c86bc4a010bdca79af8190a9a521838f421b75`. The four compact JSON
reports contain the complete current-source inventory, original raw experiments,
CLI results, public outputs, repeated observations, checks and retained limits.
The [manifest](manifest.json) hashes all four reports; the
[comparison](comparison.json) records complete public parity and raw differences.

## Actual bounded results

- 352/352 unchanged frozen library cases for each candidate, all seven operations.
- 362/362 public library cases per candidate and complete ordered cross-parity:
  352 frozen plus ten additional contract probes, four evaluations per case.
- 59/59 repeated legacy CLI scope/safety/transport cases per candidate, covering
  validate/inspect and all eight maintained projects. Public JSON parity: 57/57.
- 10/10 existing strict CLI projection regressions per candidate, both commands.
- 16/16 additional unsupported profile/effect option probes per candidate,
  repeated, using an absent root; usage rejection precedes discovery.
- 15 fail-closed consumer controls for version, fields, native details, locator,
  outcome, ordering/meaning/authority boundaries.

The additional library probes cover failed oneOf/anyOf branches, terminal not,
escaped required-property pointers, globally ordered 230-error local input,
YAML syntax/duplicates and value redaction, correlation-ID redaction, the original
230-actor branch/limit workload and the same project-semantic boundary probe.
Native implementations receive only inputs, never expected results. The harness
checks the independent complete public projection and explicit supplemental
expectations, as well as the unchanged raw oracle. All native raw results on the
352 original cases equal the prior repaired snapshot for that candidate.

Raw native differences are retained, including original prefixItems details and
supplemental combinator/limiting differences. Public equality does not assert raw
native equality; it verifies the deliberate versioned boundary. Historical
snapshots are verified at their original revisions using explicit historical
mode. New current-source binding is checked by this qualification, not inferred
from those old records.

## Scope and limits

See the normative [public contract and mapping](../../../docs/validation-diagnostic-contract.md)
and [task closure](../../../rfcs/reviews/2026-10-13-nf-102-01-closure.md).
The new contract is a validation-only data interface, not a stable product CLI,
SDK/package/binary ABI, NF-CLI/NF-RUNTIME claim or release. CLI full-project
semantics/Core Profile/extension profiles and all runtime effects remain
unsupported/not-run. Native semantic fragments are not full assembled-project
conformance. The paired unresolved-bridge result makes this limit observable.

Exact native local cohort/toolchains and legacy entry/interpreter build hashes
are in each report's `legacy` section. These macOS ARM64 runs are supplemental,
not the frozen target. Ordinary Linux CI replays are supplemental too. Lifecycle,
signing, supply-chain/provenance closure, OS denial, cross-target measurements
and full architecture acceptance remain untested here and mandatory elsewhere.
The other five NF-102 remediation cards remain open. No dependency locks,
frozen inputs, historical observations or product versions are changed.

## Reproduce

Build the native candidates with their existing pinned toolchains/locks. Invoke
`scripts/runtime-validation-contract-run.mjs <candidate> '<native-driver-json>'
'<native-cli-json>' <fresh-output.json>` from a committed checkout. It replays
the full original library/CLI scope, the existing branch regressions and the new
public contract/profile probes. On CI it can reuse the same job's freshly bound
legacy/branch reports with `--legacy` and `--branches`, never a different revision.
Do not overwrite these dated observations during an ordinary replay.

`npm run runtime-validation-contract-smoke` verifies all complete current-source
records, the contract rejection controls and bounded closure. CI additionally
compares all four fresh native artifacts via `--observations <artifact-dir>`.
The snapshot generator writes this snapshot's manifest/comparison only; original
partial/failed records and oracle remain unchanged. CI success is required for
delivery, not an architecture acceptance signature.
