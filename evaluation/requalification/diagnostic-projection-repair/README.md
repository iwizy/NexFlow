# NF-102-01: targeted public diagnostic projection repair

**The public branch-diagnostic parity defect is repaired. Architecture remains
Draft/not-ready.** The maintainer separately authorized this candidate repair
after the [requalification](../validation-diagnostics/README.md) found the
`diagnostic-limit` failure. That original report and its failed comparison are
unchanged. This snapshot is the new result, not a retrospective pass.

## Change and authority boundary

Candidate/collector revision: `49d78ff5fe84a3b4c0650ccbbff96e97cac7624c`.
The three changed implementations are Python, Rust and Go public schema
projection. TypeScript already exposes failed branch reasons and is unchanged.
All candidate sources, dependency locks and local schemas are inventoried and
hash-bound to that commit; all collector/oracle inputs are checked as well.

Public schema diagnostics retain both a failed `oneOf`/`anyOf` constraint and
its failed-branch reasons, including duplicate occurrences of the same
constraint. Required properties extend the instance pointer. Structural
reference/group/allOf wrappers do not create extra constraint diagnostics.
A failed `not` emits the `not` constraint, not the successful forbidden
schema's context. Go's native `Not` kind has no keyword path, so it is mapped
explicitly from the structured error kind. No native error prose is exposed.

Selection is by the final public locator/keyword, before the global public
sort and 200-record limit. Each document retains its earliest 201 projected
records while traversing all native errors; the extra record preserves the
truncation flag without retaining an unbounded output list. The eight public
fields, fixed messages, redaction, validation decisions, commands and execution
authority are unchanged. Library experiment entries deliberately retain their
original native observations and limits; no stable library API is implied.

No dependency, lock, version, runtime, provider, credential, network effect,
frozen specification/corpus/catalog/oracle or historical evidence is changed.
The PR is stacked on the separate requalification PR #118, not an implicit
merge or architecture decision.

## Actual results

The four full, compact JSON reports each preserve 352 ordered library results
with four evaluations per case and 59 repeated CLI results. The complete
library observations equal the original requalification results for each
candidate, including native details. Every original CLI input hash, argument
list and expectation is checked against that prior snapshot.

- Library oracle: **352/352 per candidate**, unchanged. Portable parity:
  **352/352**. Raw native differences on `draft-2020-prefixitems-rejected`
  remain explicitly retained; they are not a portable public library contract.
- CLI scope/transport/safety: **59/59 per candidate**, two runs per case.
  Cross-candidate public JSON parity: **57/57**, including the original
  unchanged `diagnostic-limit` workload, previously 56/57.
- Strict supplemental projection regressions: **10/10 per candidate**, both
  `validate` and `inspect`, each repeated twice. Expectations enumerate every
  retained diagnostic field and occurrence, not only counts or parity.

For the original 230 invalid actors, the schema-derived full expectation has
3,450 projected diagnostics; the actual retained first 200 match exactly.
The retained `/actors/100` records establish that
ordering precedes limiting, rather than truncating native traversal order.
Additional probes cover one invalid actor (15 constraints), an agent missing
its bridge (13), a human with a forbidden bridge (12, including four `not`
constraints), and a failing allOf/local-reference pattern with value redaction.
All inputs remain unchanged, output is repeatable, stderr is empty, rejected
inputs exit 1 and inspection has no result. Expected sequences are derived
from the unchanged reviewed schema, outside the candidate implementations.

The [manifest](manifest.json) hashes all eight reports. The
[comparison](comparison.json) is derived from complete observations. The new
smoke verifies current sources and collectors against this new snapshot;
historical checks use explicit `--historical` mode to verify old observations
against their immutable original revisions, including their retained failure.
Without that flag those historical checks still reject source drift.

Local native self-tests pass for all four candidates. The original broader
repair runner also passes 590/590 cases each: 352 frozen, 224 identifier-renamed
and 14 supplemental cases. Repository checks and native CI are required before
publishing the final result. CI collects new full native Linux reports and
regressions, then compares all four downloaded artifacts with this snapshot;
stored evidence alone is not treated as a native execution receipt.

## Limits retained

The local cohort is native macOS ARM64 and explicitly supplemental, not the
frozen target. Exact OS/kernel/CPU/toolchains and artifact hashes are in each
report. Ordinary native Linux CI is also supplemental. No sandbox/network
denial, signing, lifecycle, supply-chain closure or comparable benchmark is
established by these runs.

Only `validate` and `inspect` are supported. CLI full-project semantics, core
and extension profiles remain `not-run`; the unresolved bridge probe is still
retained. A stable public library native-detail boundary is not established.
These other acceptance blockers remain open; no language is selected and
RFC-0023 is not Accepted. NF-102 remains a closed review with not-ready outcome.

## Reproduce without overwriting history

Build the four candidates with their existing pinned locks. Run
`scripts/runtime-diagnostics-requalify-run.mjs` with the same native driver/CLI
commands documented in the prior snapshot, but give a fresh output path and
`--source-revision <exact-current-commit> --compact`. Run
`scripts/runtime-diagnostic-projection-regression.mjs <candidate>
'[<native-cli-command>]' <fresh-regression-output>` at that same committed
source. Do not replace dated observations during a routine replay.

`npm run runtime-diagnostic-projection-repair-smoke` verifies the stored new
snapshot. CI additionally supplies `--observations <downloaded-artifact-dir>`
to compare all four fresh reports and regressions. The snapshot generator
writes only this new snapshot's index after all four complete reports exist;
it never updates the historical directory.
