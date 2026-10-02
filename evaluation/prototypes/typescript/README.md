# Disposable TypeScript Validation Candidate

NF-056-05 adds an independent typed implementation; it does not rename, import,
or wrap the historical JavaScript CLI. This private experiment is not a runtime,
published package, accepted architecture, or supported release artifact.

## Reproduce

Use Node 22.23.2, npm 10.9.8 and the locked TypeScript 7.0.2 compiler. Dependencies
match the reviewed NF-056-04 lock graph (AJV 8.20.0, ajv-formats 3.0.1, YAML 2.9.0).
From the repository root:

```sh
npm ci --ignore-scripts
npm --prefix evaluation/prototypes/typescript ci --ignore-scripts
npm --prefix evaluation/prototypes/typescript run build
npm --prefix evaluation/prototypes/typescript test
node scripts/runtime-evaluation-run.mjs --command '["node","evaluation/prototypes/typescript/dist/cli.js"]'
node scripts/runtime-typescript-library-run.mjs
```

The compiler produces ignored `dist/` JavaScript and declarations. Import
`dist/library.js` for `evaluate`, `discover`, `inspect`, `parseYaml`, `SchemaEngine`
and `evaluateLibraryCase`. Library calls return data without printing or exiting.
The CLI exposes only `validate` and `inspect`, requires `--root`, and supports
`--project` or repeated `--file`, with `--format json` or human-readable text.
Unknown commands/options and ambiguous selection fail before loading inputs.

## Boundaries

Selection never walks directories or imports code named by a manifest. Local
draft 2020-12 schemas are loaded from the reviewed schema directory; unresolved
remote references fail instead of fetching. Schema IDs are identifiers, not
network authority. Input paths reject traversal, symlinks and non-regular files;
reads are bounded to 1 MiB per file and 128 selected files. YAML is one document,
unique-key, string-key and JSON-compatible, with bounded aliases and depth.
Diagnostics use fixed messages, relative locators, allowlisted schema pointers,
200-entry truncation and deterministic ordering. Inspection visits only declared
fields, with 1,000 resources and 2,000 reference records maximum.

There are no candidate APIs for workflow execution, provider requests, credential
resolution, environment interpolation, subprocesses, network calls or executable
extensions. `executionAuthorized` is always false; semantic, core-profile and
extension checks are `not-run`. A structural success grants no authority.

The shared harness owns copying fixtures and comparing unchanged expectations.
Candidate library code never receives the expected result. The initial library
entry implements schema, YAML and discovery operations; semantic-fragment,
workflow-namespace and artifact-namespace explicitly return `valid: null` and
`status: not-implemented`. NF-056-09 owns that common semantic port.

## Limits And Evidence

The initial run record will be committed after pinning this source revision. See the
[candidate record](../../candidates/typescript.json) for immutable revisions and
actual outcomes. Passing 11 shared CLI cases or 128 implemented library cases
does not pass full specification fidelity: 224 library cases remain not-tested.
The first library run had four diagnostic mismatches (missing kind information);
the implementation was repaired, without changing catalog expectations.

Self-tests cover usage rejection, input boundaries, FIFO rejection where
available, YAML hazards, redaction, budgets and dependency graph equality. They
are not an operating-system deny harness. Path component checks have a residual
parent-directory replacement race; platform-specific no-follow behavior and
resource exhaustion require later isolation experiments. Offline enforcement,
supply-chain review, distribution lifecycle, target measurements and independent
review are not tested. Native CI build success is not target distribution support.
