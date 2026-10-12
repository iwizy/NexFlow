# NF-102-01 — 2026-10-12 requalification supplement

Evidence deliverable: complete. Acceptance disposition: **not-ready; blocker
remains open**. This forward-only supplement does not amend the original
NF-102 review or its completed-review closure. RFC-0023 remains Draft.

See the [complete evidence/mapping and reproduction instructions](../../evaluation/requalification/validation-diagnostics/README.md)
and [derived four-candidate comparison](../../evaluation/requalification/validation-diagnostics/comparison.json).

At integration revision `e1b7d65d86194b0848c219be76010f7f7460fa2b`, every
candidate source, lock and schema matches repaired revision
`9e13a54311735a36398eb89c4a39ff2949998998`. Collector
`224b968ce633c8e964d97819180fb468ab0c7762` re-runs the unchanged full
352-case frozen catalog, with native inputs only and four evaluations per case.
All four pass that oracle; original partial records remain original partial
records, not rewritten current results.

Each candidate passes 59 repeated CLI scope/safety/transport assertions,
covering the two commands and all eight maintained projects. However public
diagnostic cross-parity fails on `diagnostic-limit`: different schema branch
errors yield different paths/keywords in the first 200 records. Retained
native library detail also differs on the prefixItems negative case; it is
explicitly outside the portable observation view and absent from public CLI.
The mapping records missing library fields honestly, not synthesized candidate
messages/severities. CLI project semantics, core and extension profiles remain
not-run; an unresolved bridge probe demonstrates the gap.

Mandatory gates 2/3/5/10 gain exact-source requalification evidence, **not
closure**. Full-project semantics, stable public library diagnostics and failed
public branch-diagnostic parity remain explicit. Other supply-chain, isolation,
delivery, signing, measurement and architectural-mechanism gates are not tested
or changed by this supplement. Native supplemental macOS results and ordinary
Linux CI are not frozen target or product acceptance.

Next action requires a separately authorized candidate repair: deterministic
cross-validator branch projection before limiting, preserving code/category/
path/severity/meaning and the failing fixture, then repeat full validation.
Do not treat evidence-integrity CI success as passing the retained parity gate.
No runtime, dependency change, release, version change, architecture selection
or acceptance is authorized or performed.
