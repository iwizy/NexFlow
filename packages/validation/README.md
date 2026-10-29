# @nexflow/validation

Unreleased `0.5.0-alpha.1` ESM validation library, extracted in NF-105 from the
reviewed TypeScript candidate. This is not the executable reference CLI.

The main entry is pure application code: it parses supplied YAML/data and uses
embedded, immutable-schema inputs. It does not read a project, access network or
credentials, spawn processes, load extensions or initialize a future runtime.
Normal module loading reads installed JavaScript/JSON code and dependency
meta-schemas; that is distinct from application-level filesystem access.

## API

```js
import { createValidator, parseSource } from "@nexflow/validation";

// yamlText is supplied by the caller; the library opens no file.
const parsed = parseSource("project.yaml", yamlText, "Project");
const validator = createValidator();
const outcome = parsed.document
  ? validator.validateManifest(parsed.document.value, parsed.document.file)
  : parsed.diagnostics;
```

- `createValidator()` owns a fresh fixed-schema compilation cache and returns
  `validateManifest(value, file?)`, `validateDocuments(documents)` and
  `inspectDocuments(documents)`. Single-manifest validation does not imply an
  entire Project assembly. Assembly methods require one unambiguous Project.
- Results expose `apiVersion: "validation-api-v1-preview"`, `valid`, explicit
  `valid`/`invalid`/`unsupported`/`error` status, bounded safe diagnostics, layer
  states, `truncated`, and `executionAuthorized: false`. No result is published
  on error; whole-project semantic/Core/extension/runtime checks remain not-run.
- `parseYaml`, `parseSource`, `projectSources` and `checkAssociation` are the
  low-level data/planning helpers used by the separate workspace adapter. Parsed
  values are authored data, not redacted display output: callers must not print
  their raw document objects as inspection or diagnostics.
- `schemaSnapshot` identifies the exact 18-file payload: 17 manifest kinds and
  common definitions. Callers cannot substitute schemas through the main entry.

Diagnostics retain safe locations and fixed meanings, never raw parser errors,
arbitrary values, absolute roots or native dependency exceptions. Unknown kind
and version are explicitly unsupported. Preview-owned `NEXFLOW-VALIDATION-*`
failures are not new standard `NF-*` codes. Resource caps are 128 assembly
documents, 1 MiB YAML/source, 100 YAML alias expansions, 100 structural levels,
10,000 supplied JSON nodes, 200 diagnostics, 1,000 inspection resources and 2,000
references. Truncation is failure, never partial success. An implementation
exception returns a fixed internal diagnostic from validation methods.

## Build And Verify From The Repository

Use Node 26.13.0, its npm 11.20.0 and the pinned TypeScript 6.0.3 toolchain:

```sh
npm ci --ignore-scripts
npm ci --prefix packages/validation --ignore-scripts
npm run build --prefix packages/validation
node scripts/reference-validation-smoke.mjs
```

The compiler/dependency lock is copied from the reviewed candidate graph with
new package-root metadata only; the candidate's sources/locks stay unchanged.
Build checks all schema/rule hashes before embedding data, emits declarations,
copies exact raw schemas and the MIT license, and never installs anything by
itself. `npm pack --ignore-scripts` after build bundles the fixed runtime closure.
No registry publication is part of this task.

The focused verification builds and packs twice, relocates the tarball outside
the checkout, imports it without checkout dependencies, compiles a TypeScript
consumer, verifies safe failures/no mutation/denied effects and compares all
352 frozen library cases. Internal semantic-fragment and local-schema cases
exercise migration fidelity, not additional public exports or full semantic
conformance. Extraction/import is not final CLI install/upgrade/rollback evidence.
