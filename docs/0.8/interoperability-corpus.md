# 0.8 Interoperability Corpus

Status: **NF-119 preparation only; independent comparison not yet performed**.
The [preliminary specification-version review](specification-version-review.md)
was recorded before this corpus was frozen. NF-121 owns the release decision.

## Exact Inputs And Provisioning

The [v1 manifest](../../fixtures/interoperability/v1/corpus.json) identifies
`nf-119-interop-v1`, its source Git revision, every input SHA-256, suite format,
case counts, team coverage, normalization rules and limitations. Its own digest
and the exact PR/commit identify this corpus revision. The
[supplemental cases](../../fixtures/interoperability/v1/supplemental.json) and
[draft observation schema](../../fixtures/interoperability/v1/result.schema.json)
are hashed local corpus artifacts; they are not manifest or CLI output versions.

Provision the exact source snapshot
`a7dd64df680babaf9dcf26fcea181c41f30f8ea2` and the corpus artifacts before an
offline run. Baseline file paths resolve **inside that snapshot**, never against
an unpinned moving checkout. The repository verifier reads Git blobs; a portable
consumer may use a byte-verified source archive. No implementation needs a
JavaScript backend to read the JSON/YAML input contracts. Adapters receive only
inputs and operation parameters; expected results and maintenanceOracle are
retained by the comparison controller, never supplied to the implementation.

```sh
npm ci --ignore-scripts
node scripts/interoperability-corpus-smoke.mjs
```

This validates preparation: catalog composition, hashes, schema expectations,
migration/registry variants, observation shape and retained compatibility facts.
It does not run independent implementations or publish a conformance result.
An optional `node scripts/interoperability-corpus-smoke.mjs --observations report.json`
checks report shape, the corpus digest, every case/profile and explicit missing
work. It does not assess implementation correctness. Each report must retain
all 447 cases, including unsupported/not-tested profiles.

Full Git history is needed only for the historical foundation compatibility
rehearsal; candidate workload inputs are the pinned snapshot plus JSON records.

## Coverage And Reuse

| Team shape | Existing source | Manifests | Treatment |
| --- | --- | --- | --- |
| Small | examples/minimal-team | 3 | Core Profile identity; not a runtime demonstration. |
| Solo | examples/solo-developer | 10 | Human-owned work/review path. |
| Conventional software | examples/software-team | 16 | Additional representative team; no live provider access. |
| Startup | examples/startup-team | 16 | Product/release responsibilities and review. |
| Enterprise | examples/enterprise-team | 16 | Sensitive/governed declarations. |
| Product | examples/product-delivery-team | 16 | Cross-functional delivery declarations. |
| Open source | examples/open-source-maintainer | 16 | Maintainer-controlled change/release declarations. |
| Research | examples/research-lab | 16 | Evidence and publication review declarations. |

All seven requested shapes are present among eight maintained projects and
109 schema-backed manifests. No duplicate example team was needed. These files
are input data and declarations, not real credentials or executable teams.

The complete 352-case frozen library catalog is included without filtering or
changing its oracle. Its 156 source files match the assessed snapshot. Seven
operation families remain separate: 113 manifest-schema cases, 3 YAML cases,
5 local-schema/ref cases, 224 semantic/namespace fragments and 7 discovery cases.
The 15 historical prototype CLI cases, 37 claim-format cases and 17 extension
metadata cases keep their own protocols. The supplement adds 15 migration,
7 public CLI and 4 unsupported-runtime boundary cases: **447 total cases**.

Reusing unchanged **inputs** does not reuse old candidate passes. NF-120 must
rerun the complete selected profiles on exact implementations. The semantic
fragments are normalized partial documents, sometimes structurally incomplete;
run them through a fragment interface, not full-manifest schema validation.
A pure validator without that interface reports unsupported for that profile.
Local-schema experiments similarly do not imply that the public fixed-schema
API accepts arbitrary caller-supplied schemas. Historical discovery/prototype
CLI behavior must not be relabeled as the public 0.5 CLI contract.

## Profiles And Expected Results

- Schema/parser/local-ref cases retain the original validity, category, code,
  path and relevant keyword expectations. Manifest schema success is structural.
- Static fragments retain exact typed-reference and namespace meaning. They do
  not establish full assembly, policy composition, cycles or workflow semantics.
- The public CLI cases cover validate/inspect/static graph, unsupported dialect
  and refusal of run/init/discover. Preserve exit status, check states, bounded
  diagnostics, executionAuthorized false and unchanged authored input bytes.
- Claim-format acceptance validates the claim document, not its external evidence.
- Extension metadata recipes are portable data-only add/remove/replace pointer
  operations over pinned fictional snapshots. Compare disposition separately
  from schema validity and CLI support. A schema-valid unknown profile can remain
  unsupported, and compatible metadata grants no execution authority.
- Runtime cases are explicit capability gaps. Do not attempt network, provider,
  credential or executable-extension effects. Public static tooling records
  unsupported; the source host's 76 synthetic cases remain a distinct fixture,
  not general workflow execution or production runtime conformance.

## Migration Fixtures

Five groups preserve before, preferred and conflict cases: provider capabilities
versus features; allowTrainingUse versus trainingUse; singular versus plural
Workflow hints; legacy versus typed approval targets; and opaque versus explicit
credential policy. Each has an owning source and explicit expected validity.

False training permission maps to prohibited only within the reviewed example.
True/unknown policies and untyped approval targets require a human decision;
never infer a target kind, grant or credential permission. The opaque credential
case preserves foundation-accepted/current-rejected behavior. The explicit deny
replacement is a reviewed structural example, **not** proof that arbitrary old
policy intent was preserved. Full semantic equivalence remains not-tested.
The registry legacy/migrated/downgrade cases separately preserve metadata format,
publication and history boundaries. No migration rewrites user files.

## Normalization And Comparison Rules

The manifest holds machine-readable rules; apply them per profile:

1. Record every selected case on every run. Run at least twice with identical
   source inputs, scope and case order. Preserve original output and ordering
   before creating a sorted comparison view. Missing cases and unsupported work
   remain visible; do not reduce a denominator or report a global success rate.
2. Keep operation/profile, validity or exit status and all performed/not-run
   layers. Unsupported **operation** is different from an implemented operation
   correctly rejecting unsupported **input**. Neither is full semantic support.
3. Diagnostics compare category, code, repository-relative file, exact JSON
   pointer, severity and structured meaning, including target namespace/identity
   or schema keyword where supplied. Missing information stays null/missing,
   never inferred from prose. Preserve diagnostics multiplicity.
4. Canonicalize only file separators and an explicit leading ./ in known relative
   file locators. Do not case-fold IDs, collapse fields, guess namespaces or
   discard unsupported diagnostics. JSON pointers preserve ~0/~1 escaping.
   Different native parser wording is supplementary, not a semantic oracle.
5. Within one implementation, changed diagnostic order across identical runs is
   a repeatability failure. For cross-implementation comparison only, sort by
   file, pointer, severity (error/warning/info), code and canonical structured
   meaning. Sorting must not erase that earlier repeatability finding.
6. Check public output for absolute paths, synthetic private canaries, raw authored
   values and native exceptions before normalization. A leak is a failure;
   stripping it afterward does not make the candidate pass. Record original and
   resulting input digests; unexpected mutation fails the case.
7. The draft observation schema separates observed, unsupported, not-tested and
   error. The controller assesses matches; an implementation never receives the
   oracle or self-awards a comparison pass. Runtime/extension execution checks
   stay not-run and executionAuthorized stays false for this entire corpus.

## Remaining Work

NF-119 produces prepared, source-bound inputs and a repository rehearsal. It
supplies no independent implementation results, winner, benchmark or release
acceptance. NF-120 must implement/qualify its adapters and record actual profile
support and failures. NF-121 must reconcile those results, decide specification
version/Draft status and review a release candidate before any publication.
