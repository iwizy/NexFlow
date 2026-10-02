# Disposable Python Validation Candidate

NF-056-06 is an independent source implementation of local structural validation
and declared-only inspection. It does not call the historical JavaScript CLI or
use any other candidate as a backend. This is a source-bound private experiment,
not a published package, CLI alpha, runtime or accepted architecture.

## Pinned Provisioning And Checks

Use CPython 3.12.14. The direct requirements and complete 15-package hash lock
are identical to the reviewed NF-056-04 plan: PyYAML 6.0.3, jsonschema 4.26.0,
referencing 0.37.0 and the pinned format/build tools. From the repository root,
provision a task-local environment and wheelhouse separately:

```sh
python3.12 -I -m venv .venv
.venv/bin/python -I -m pip --isolated download --require-hashes --only-binary=:all: \
  -r evaluation/prototypes/python/requirements.lock --dest TASK_WHEELHOUSE
.venv/bin/python -I -m pip --isolated install --no-index --find-links TASK_WHEELHOUSE \
  --require-hashes --only-binary=:all: -r evaluation/prototypes/python/requirements.lock
.venv/bin/python -I -m pip check
.venv/bin/python -I -m compileall -q evaluation/prototypes/python
.venv/bin/python -I -B evaluation/prototypes/python/self_test.py
```

Compiler caches and the venv are ignored. On Windows adapt the reviewed executable
to `.venv/Scripts/python.exe`; this is not evidence of a tested Windows install.
Prepare platform-native wheels without silently falling back to source builds.
The current source candidate needs this evaluation checkout's schemas; wheel
packaging, installed entry points and distribution lifecycle are later tasks.

Provision the maintenance harness separately with `npm ci --ignore-scripts`.
It compares native Python results; it supplies no JavaScript validation backend:

```sh
node scripts/runtime-evaluation-run.mjs --command '[".venv/bin/python","-I","-B","evaluation/prototypes/python/cli.py"]'
node scripts/runtime-python-library-run.mjs .venv/bin/python
```

The shared CLI runner executes every case twice. The trusted library driver
receives only identities and inputs, not expected results, and evaluates each
twice without mutating the input. The Node harness owns the unchanged common
comparison contract and frozen corpus checks.

## CLI And Library

Only `validate` and `inspect`, explicit `--root`, optional `--project` or repeated
`--file`, and `--format json|text` are accepted. Unsupported commands/options,
duplicate singletons and mixed selection fail before reading manifests.
`-I -B` prevents ambient Python paths and bytecode writes for the documented
invocation; the entry scripts add only their own trusted source directory,
never a caller-selected root. This is not OS isolation.

Import `nexflow_python_evaluation` from its reviewed source directory to access
`Selection`, `Manifest`, `evaluate`, `discover`, `inspect`, `parse_yaml`,
`SchemaEngine`, `repository_schemas` and `evaluate_library_case`. Library APIs
return data without printing or exiting. Lower-level projection/schema helpers
do not themselves assert a complete validated assembly; use `evaluate` for
ordered discovery, schema checks and failure-suppressed inspection.

## Boundaries And Remaining Evidence

Input selection does not recurse or load manifest-named executable code. Sources
are root-relative, regular UTF-8 YAML, at most 128 files and 1 MiB each; symlinks,
traversal and remote-like locators are rejected. Final opens use no-follow and
non-blocking flags where available. Parent-component replacement races and
platform-specific behavior remain independent isolation work.

The SafeLoader subclass enforces one document, unique scalar-string mapping
keys, core-style scalar parsing, 100 alias occurrences, depth 100, acyclic
JSON-compatible values and 200,000 expanded value visits. These extra bounded
parser policies do not prove complete YAML dialect parity. Unknown tags and
non-finite values fail closed. Schemas are reviewed local draft 2020-12 resources
in a registry with an explicit deny-retrieval callback, never fetched from URLs.

Fixed diagnostic messages omit exception/source contents and input values;
relative locators and allowlisted schema pointers sort deterministically with
200-entry truncation. Inspection projects only selected declaration/reference
fields, at most 1,000 resources and 2,000 references. IDs and relative filenames
are intentionally visible and must not contain secrets; this is not a detector.

There are no runtime/provider/credential/network/executable-extension APIs.
`executionAuthorized` is always false; semantic/core-profile/extension CLI checks
are `not-run`. Structural success grants no execution or policy authority.

The initial library implements manifest/local-schema, YAML and discovery cases.
Semantic-fragment and workflow/artifact namespace cases return `valid: null`,
`status: not-implemented`, never a false success. Full parity belongs to NF-056-09.
128 library cases pass; 224 remain not-tested. See the
[candidate record](../../candidates/python.json) for immutable source/evidence
revisions. Initial unit hooks and static source checks are not an OS deny harness.
Offline enforcement, supply-chain acceptance, artifact lifecycle, comparable
measurements, target support and independent review remain not-tested.
