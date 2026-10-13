# Validation Diagnostic Data Contract v1

This is the **versioned validation-only library data boundary** of the four
evaluation candidates, not a released SDK, binary ABI, product CLI, language
selection or architecture acceptance. Its identifier is
`nf-validation-diagnostics-v1`; incompatible field or meaning changes require
a different identifier. No package or specification version is changed.

The normative shape is
[`validation-diagnostics-v1.schema.json`](../evaluation/contracts/validation-diagnostics-v1.schema.json),
outside the authored-manifest schema registry. A consumer must reject unknown
versions, missing fields, extra fields, malformed output and failed calls.
`valid: true` means only that the requested declared check found no error;
`executionAuthorized` is always false. No output grants runtime authority.

## Native library entries

| Candidate | Versioned entry |
| --- | --- |
| TypeScript | `evaluatePublicLibraryCase` from `evaluation/prototypes/typescript/dist/public.js` |
| Python | `evaluate_public_library_case` from `nexflow_python_evaluation` |
| Rust | `nexflow_rust_evaluation::public::evaluate_public_library_case` |
| Go | `candidate.EvaluatePublicLibraryCase` |

Each calls its own native validation implementation. No candidate calls another
language backend or imports the qualification harness. The existing
`evaluateLibraryCase` equivalents remain **experimental native-detail APIs**:
their raw records are deliberately not this public contract. The trusted
experiment drivers' `--public` switch produces paired native/public receipts
for qualification, not a public end-user CLI or a claim that native details are
safe to expose. Application consumers use the versioned functions above.

Arguments identify an operation, correlation ID and declarative input, plus an
explicit reviewed input root and local schemas where required. Only
`manifest-schema` and `discovery` read selected local files. The other operations
use the supplied data/local resources. Schema retrieval remains denied by the
existing native engines. This is not an OS sandbox or an installed-artifact
denial receipt. Unsupported operations fail the call; callers must not turn an
exception, absent result or driver failure into a valid result.

Supported operations are `semantic-fragment`, `workflow-namespace`,
`artifact-namespace`, `manifest-schema`, `local-schema`, `yaml-parse` and
`discovery`. They retain the existing frozen catalog's specification meanings
and oracle, not a new simplified corpus.

## Envelope and diagnostic mapping

The result contains `contractVersion`, redacted/allowlisted `caseId`,
`operation`, `valid`, `diagnostics`, `truncated`, `executionAuthorized`, `checks`
and `result`. The only inventory result is successful discovery's document
count and allowlisted workflow IDs. A failed check always has `result: null`.
Runtime and executable-extension checks are always `not-run`.

Every public diagnostic has exactly six fields:

| Field | Normative meaning |
| --- | --- |
| `code` | The native coarse diagnostic code, or `NF-DISCOVERY-UNSAFE-SOURCE` for parser failures, matching the unsafe-input boundary. No raw parser prose. |
| `category` | Schema keyword, semantic rule category or YAML category; `null` when discovery did not emit a category. Missing information is not invented. |
| `path` | Sanitized instance pointer, with JSON Pointer-escaped required property appended; `null` when no native location is available. Empty pointer and missing pointer are distinct. |
| `severity` | Contract-defined `error` for a validation rejection. It is an adapter property, not a claim that every native engine emitted severity. |
| `meaning` | `operation:code:category`, using `not-emitted` for a missing category. This is a stable routing key; specification meaning still comes from the catalog's `specificationRule`, not human-message equality. |
| `context` | Only emitted `kind`, `sourceKind`, `targetNamespace`, `targetId`; native redaction is retained. No arbitrary fields, values, native exception text or native diagnostics. |

Schema operations use the already qualified public branch projection: enclosing
failed oneOf/anyOf plus failed-branch reasons, required locators, multiplicity,
terminal failed not constraints and normalized items:false. Structural group,
reference and allOf wrappers add no spurious diagnostics. No native details are
silently erased from the raw experiment channel; full paired observations are
saved. The historical prefixItems raw differences remain visible.

Order is lexical by `(path-or-empty, severity, code, category-or-empty, meaning,
context.kind-or-empty, context.sourceKind-or-empty,
context.targetNamespace-or-empty, context.targetId-or-empty)`. Duplicate
constraints remain duplicates. Ordering precedes the 200-diagnostic limit;
`truncated: true` retains rejection and never publishes an inventory. The same
input is repeatable and inputs are unchanged. Native/prose fields cannot enter
the public output through a permissive extra-properties channel.

The CLI's eight-field diagnostic shape is a **different, contextual boundary**:
it adds the selected source file/kind, fixed message and related locators;
schema category maps to keyword and the same required-property pointer is used.
The library does not invent source files for code-only discovery errors, and
semantic fragment diagnostics are not misrepresented as CLI project checks.
See [CLI diagnostics](cli-diagnostics.md) and the full paired evidence below.

## Complete declared project/CLI scope

The independent candidates support `validate` and `inspect`, with directory,
project-source-hint and explicit-file-list selection. They check discovery and
local manifest schemas. `inspect` adds declared-only inspection after successful
structural validation. Both commands are checked for all eight maintained
projects, frozen negatives, usage/selection failures, redaction and limiting.

They **do not implement full-project semantics, Core Profile, extension profiles,
runtime execution, graph/init/help/version or a stable product CLI ABI**.
Those are explicit unsupported capabilities, not successful omitted checks.
Schema-valid input with an unresolved bridge remains structurally valid in the
CLI while the public semantic-fragment library rejects the same declarations.
This paired probe establishes the boundary; it does not qualify full-project
semantic conformance. Six unsupported commands and sixteen unsupported-profile/
effect option probes are rejected; the latter use an absent root and confirm
discovery never starts. No option silently enables a backend or profile.

This scope is unchanged from the candidates' declared validation-only scope.
NF-102-01 explicitly requires covering unsupported commands/profiles, not
implementing every future CLI feature. Closing that bounded diagnostic task
does **not** remove the remaining architecture conformance, target, security,
compatibility or product-surface gates. They stay mandatory and not-ready.

## Qualification and compatibility boundary

The [four complete source-bound reports](../evaluation/qualification/validation-diagnostics-v1/README.md)
verify all 352 frozen cases plus ten additional public-boundary cases, with
actual native/public results and four evaluations per case. Public field
equality is complete and ordered, not only a count or expected subset.
The existing raw oracle is unchanged and checked separately. Raw details and
supplemental raw differences are retained rather than counted as public failures
or silently discarded to improve a score.

Legacy experimental CLI outputs and the raw experiment API remain unchanged.
The new public data entry is additive; clients opt into its distinct identifier.
Legacy data must not be relabeled v1, a mixed-version result must be rejected,
and native exceptions/detail fields must not be copied into v1. Runtime/package
version pairs, binary ABI, installed lifecycle, signing, security denial and
product releases are not established by this data contract.
