# Shared Library Experiment

Status: preparation and historical-library rehearsal, not candidate evaluation.

The [toolchain capability probes](toolchains/README.md) test the selected YAML
and schema dependencies separately. Their smaller generic cases are not substitutes
for this complete shared library catalog or evidence of candidate diagnostic parity.

[library-cases.json](library-cases.json) provides the same declarative inputs,
expected result properties and pinned specification rule links for TypeScript,
Python, Rust and Go. It supplements, but does not replace or change,
[baseline.json](baseline.json), its specification revision or its 176-file digest.
Every candidate must pin one identical committed evaluation package and the
library catalog digest in its evidence. A shared change requires a new reviewed
package revision for all candidates, never a language-specific exception.

[library-inventory.json](library-inventory.json) fixes the catalog byte digest
and counts: 352 cases, including 211 semantic fragments, 13 namespace cases,
113 maintained/negative manifest cases, five local-schema cases, three YAML
cases and seven discovery cases. The preparation smoke rejects inventory drift.

## Scope And Input Modes

The catalog separates seven library operations:

- `manifest-schema`: all 109 maintained example manifests and four existing
  negative fixtures, with local Draft 2020-12 schemas and expected keyword/path
  properties rather than a library's verbatim error wording.
- `local-schema`: isolated local reference resolution, unavailable-reference
  rejection without fetching, and Draft 2020-12 `prefixItems`/`items` behavior.
- `yaml-parse`: unique keys, duplicate mapping rejection and malformed YAML.
- `discovery`: selected pinned positive/negative CLI inputs and the maintained
  multiple-workflow fixture, through a library API rather than a new CLI command.
- `semantic-fragment`: minimal normalized document projections exercising the
  75 supported field bindings, duplicates, actor bridges, cycles, human authority,
  active-definition ambiguity, component lifecycle and approval-target scope.
- `workflow-namespace`: all eight pinned workflow namespace cases.
- `artifact-namespace`: all five pinned task-artifact namespace cases.

Semantic fragments are **not complete schema-valid manifests**. They isolate
one supported semantic rule after parsing; do not run schema validation on these
fragments or confuse success with validating a full authored assembly. Full
maintained manifests are independently schema-checked. Broader integration and
all unsupported inventory fields remain explicitly outside this packet.

Runtime and executable extension checks are always `not-run`. The CLI remains
structural `validate`/declared `inspect`; its semantic, core-profile and extension
states do not change. No credential lookup, provider call, workflow execution,
remote schema fetch, permission decision or event-store operation is permitted.

## Result Comparison

Each candidate's library harness returns the case ID, operation, `valid`,
`diagnostics`, and `checks.runtime`/`checks.extensions` set to `not-run`.
Compare every property in `expected`, including family/category, source kind,
JSON Pointer, namespace, target ID or schema keyword where provided. Diagnostic
arrays use the catalog order; sort additional equivalent diagnostics by their
stable semantic keys before comparison. Extra explanatory fields and translated
message wording are allowed; missing expected properties or extra diagnostics
are mismatches. Do not hide a failure under an aggregate success percentage.

The language matrix additionally requires human-readable and JSON diagnostics.
Candidate tasks must retain equivalent meaning in both renderings and provide
that evidence in the parity review; the historical JSON-only CLI rehearsal
does not satisfy this requirement by itself.

These are experimental result labels, not additions to the public diagnostic
catalog or a claim that the historical smoke emits structured pointers. The
`maintenanceOracle` message fragments apply only to the pinned historical smoke
rehearsal. They are **not** candidate wording requirements. Raw messages must not
contain secrets, absolute personal paths or host identities.

Run each case twice with the same bytes and verify deterministic results and
input immutability. Report unsupported operations as explicit missing evidence;
never swap in another language's validator. Scorecards and architecture review
still require actual candidate evidence and independent people.

## Preparation Rehearsal And Limits

`npm run runtime-evaluation-library-smoke` checks catalog integrity, the complete
maintained-example inventory, pinned rule sections, local schemas and the
declarative expectations against the reviewed historical helpers. For normalized
semantic fragments it reuses only function declarations from the digest-verified
semantic smoke source; no traversal, CLI, installation or runtime code executes.
The VM is an execution convenience for trusted maintenance code, not a security
sandbox or candidate isolation mechanism.

The catalog's `unsupported` list preserves Gap/Deferred fields, broader graph
and lifecycle checks, missing-active-definition enforcement, full multi-workflow
semantic assembly, Core Profile closure, extension profiles and runtime effects.
In particular, positive multiple-workflow discovery does not cure the historical
semantic smoke's one-Workflow-per-directory limitation. Candidate fidelity,
diagnostic parity, isolation and architecture acceptance remain later tasks.
