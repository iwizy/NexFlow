# NF-102-01 — public diagnostic projection repair supplement

The maintainer separately authorized correction of the public branch-diagnostic
defect found during requalification. At source/collector revision
`49d78ff5fe84a3b4c0650ccbbff96e97cac7624c`, Python/Rust/Go now preserve failed
branch reasons alongside enclosing constraints and select diagnostics by their
final public locators before limiting. TypeScript is unchanged. Schema verdicts,
dependency locks, frozen specification/corpus/catalog/oracle and historical
reports are unchanged.

See the [new source-bound snapshot and limits](../../evaluation/requalification/diagnostic-projection-repair/README.md)
and [complete derived comparison](../../evaluation/requalification/diagnostic-projection-repair/comparison.json).
The original failed [requalification supplement](2026-10-12-validation-diagnostics-requalification.md)
remains a correct record of the prior revision.

All four candidates retain identical per-candidate library observations on the
unchanged 352-case catalog; portable library parity is 352/352. Public JSON CLI
parity improves from 56/57 to 57/57 on the same original inputs. Each candidate
passes all 59 CLI scope assertions plus 10 strict supplemental projection
regressions for validate/inspect, including exact branch reasons, multiplicity,
redaction, ordering before the 200-record limit and input immutability.

This closes the observed public branch-projection defect, **not mandatory gates
2/3/5/10 as a whole**. Native library detail differences remain visible; stable
public library API boundaries and full-project semantic conformance remain
not-established/not-tested. Runtime, profile validation, cross-target delivery,
isolation, signing, supply-chain and measurement gates are not changed. Native
macOS and Linux replays are supplemental, not frozen-target acceptance.

The architecture remains Draft/not-ready, no language is selected, and NF-102
remains closed only as a completed review. No release, version bump, dependency
repair or automatic merge is authorized by this supplement.
