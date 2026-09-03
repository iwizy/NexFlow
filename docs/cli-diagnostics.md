# CLI Machine-Readable Diagnostics

Status: implemented experimental repository output, `formatVersion: "0.3-draft"`.
This is not a stable public CLI contract, catalog release, or `NF-CLI` claim.
The [repository CLI prototype](cli-prototype.md) remains unreleased maintenance
tooling and does not resolve the pending architecture decision.

## Usage And Streams

Select `--format json` or `--format=json`. The default is `text`; explicit
`--format text` preserves it. The format applies to discovery, validation,
inspection, graphing,
help, version, usage errors, reserved commands, and internal failures.

For machine consumers, invoke the entry point directly:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team --format json
node scripts/cli-prototype.mjs discover --root examples/minimal-team --format=json
node scripts/cli-prototype.mjs inspect --root examples/minimal-team --format json
node scripts/cli-prototype.mjs graph --root examples/minimal-team --format json
node scripts/cli-prototype.mjs --version --format json
```

The process emits exactly one JSON object followed by a newline on stdout.
Diagnostics are inside that object, including on failure; the CLI writes no
text to stderr in JSON mode. This does not control errors emitted before the
entry point loads, OS termination, or a broken output stream. `npm run` can add
its own lifecycle logging, so use the direct invocation above when parsing
stdout. JSON mode creates no report files and does not mutate inputs.

Unknown formats and duplicate format options are usage errors, not fallbacks.
If tolerant argument tokenization finds an explicit JSON format option, usage
errors also use JSON, even when another option is invalid or the format is
duplicated. A format-like string consumed as another option's value, or placed
after the `--` terminator, does not select JSON. Without a recognized JSON
option, usage errors retain text output. No invalid argument value is echoed.

Exit classes are `0` success or informational output, `1` discovery or schema
failure or inspection output limit, `2` usage error, `3` unsupported input or
reserved command, and `4` internal failure. Consumers should require process status `0` and
a well-formed successful envelope. Missing, malformed, truncated transport,
or unknown-version output is not success.

## Envelope

The local contract is
[`scripts/contracts/cli-output.schema.json`](../scripts/contracts/cli-output.schema.json).
Its `$id` is an identifier, not a network dependency. It is separate from
`schemas/`: diagnostic output is not an authored NexFlow manifest and does not
add a manifest kind or enter the manifest schema registry.

| Field | Meaning |
| --- | --- |
| `formatVersion` | Experimental envelope version, currently `0.3-draft`. |
| `tool` | Fixed repository prototype name and `version: "unreleased"`; not the specification release. |
| `supportedSpecVersions` | Accepted input versions, currently `["0.1"]`; never copied from unsupported input. |
| `command` | Validated command name, or `null` for usage failures. Command help is reported as `help`. |
| `success`, `exitCode` | Process outcome, not project safety or conformance. Success is true only for exit code `0`. |
| `inputMode` | Discovery's `directory-project`, `project-source-hints`, or `explicit-file-list`, or `null` before a discovery result exists. |
| `checks` | Status of each named layer, as described below. |
| `executionAuthorized` | Always `false`; output grants no authority. |
| `diagnostics` | Ordered error records. Empty on success. |
| `truncated` | More diagnostics exist than were retained. This never turns failure into success. |
| `result` | Successful inventory or informational text; always `null` on any error. |

`checks.discovery` and `checks.schema` use `not-run`, `passed`, `failed`, or
`unavailable`. `unavailable` means that an attempted layer did not return a
result because of an internal failure. It is not a declaration that input is
invalid. After a discovery failure, schema validation remains `not-run`.
Schema setup or evaluation failure leaves schema `unavailable`; earlier
successful discovery can still be recorded as `passed`, but no inventory is
published with the failure.

An unexpected inspection or graph failure can leave discovery and schema `passed` while
the command fails with exit `4` and `result: null`. These check states alone do
not establish successful output projection.

`checks.coreProfile`, `checks.semantic`, and `checks.extensionProfiles` remain
`not-run`. Discovery association checks are not full semantic validation.
Core `ExtensionSet` schema validation is not MCP or A2A profile validation.

On successful `discover` or `validate`, `result` contains `documentCount` and
`documents`, each with only `file` and known `kind`. No project or resource IDs,
manifest bodies, or resolved configuration are serialized. `validate` success
covers the selected files only, not source completeness or execution readiness.
Successful `inspect` adds `result.inspection`: a declared-only Project identity,
per-kind counts, resource occurrences, and selected unresolved references.
Only this command intentionally exposes allowlisted authored IDs and reference
targets. See [CLI Declared Inspection](cli-inspection.md) for coverage, workflow
scope, limits, and disclosure rules; it is not an Agent Assembly view.
Successful `graph` instead adds `result.graph`: static declaration nodes and
selected reference edges with explicit resolution status. See
[CLI Static Graph](cli-graph.md). Graph output is not an execution plan.
For help and version, `result` contains `text` and all checks remain `not-run`.

## Diagnostic Fields

Every record contains `severity`, `code`, `message`, `file`, `kind`, `path`,
`keyword`, and `related`. Current emitted severities are all `error`; no new
warning or suppression policy is introduced.

- `code` preserves implemented draft `NF-DISCOVERY-*` and coarse `NF-SCHEMA`
  identities from the [Diagnostic Code Catalog](diagnostic-code-catalog.md).
- `file` is a safe root-relative source locator, `<input>` for an assembly or
  other non-file input location, or `<redacted-source>` for a rejected locator.
  It is `null` for usage, unimplemented-command, and internal failures.
- `kind` is known for schema errors and otherwise `null`. Unsupported kind
  values are not echoed or guessed.
- `path` is the sanitized JSON Pointer for schema errors, otherwise `null`.
  An empty string denotes the document root. Required fields extend the
  pointer; unknown and rejected additional property names become `<redacted>`.
  Overlong pointers become `<redacted-field>`, which is not a JSON Pointer.
- `keyword` is the safe schema constraint keyword, otherwise `null`.
- `related` contains safe `{ "file": "..." }` locations from discovery when
  available. The same locator redaction applies to every related source.

Line numbers, column numbers, raw parser excerpts, raw AJV parameters, and
automatic fixes are not supplied. Consumers must branch on code and structured
fields, not human-readable message prose. Redacted locators are display hints,
not instructions to open a file or automatically modify a field.

The following implementation-owned JSON codes are not standard `NF-*` codes:

| Code | Exit | Meaning and next step |
| --- | ---: | --- |
| `NEXFLOW-PROTOTYPE-INSPECTION-LIMIT` | 1 | Inspection exceeds its resource or reference budget; no partial result is available. Review the selected input set. |
| `NEXFLOW-PROTOTYPE-USAGE` | 2 | Invalid arguments; consult the prototype help. |
| `NEXFLOW-PROTOTYPE-UNIMPLEMENTED` | 3 | Reserved `init`; do not treat it as implemented. |
| `NEXFLOW-PROTOTYPE-INTERNAL` | 4 | No usable result from an attempted operation; review the trusted checkout and local schema setup. |

Default text mode retains its previous generic usage, reserved-command, and
internal-failure messages. Inspection limits use the new code in JSON and a
fixed failure message in text.

## Example Failure

Run against an existing negative fixture:

```sh
node scripts/cli-prototype.mjs validate --root fixtures/schema/invalid --file missing-required-field.yaml --format json
```

Exit code is `1`. The complete result is:

```json
{
  "formatVersion": "0.3-draft",
  "tool": { "name": "nexflow-repository-cli-prototype", "version": "unreleased" },
  "supportedSpecVersions": ["0.1"],
  "command": "validate",
  "success": false,
  "exitCode": 1,
  "inputMode": "explicit-file-list",
  "checks": {
    "discovery": "passed",
    "schema": "failed",
    "coreProfile": "not-run",
    "semantic": "not-run",
    "extensionProfiles": "not-run"
  },
  "executionAuthorized": false,
  "diagnostics": [{
    "severity": "error",
    "code": "NF-SCHEMA",
    "message": "Required field is missing.",
    "file": "missing-required-field.yaml",
    "kind": "Project",
    "path": "/project/description",
    "keyword": "required",
    "related": []
  }],
  "truncated": false,
  "result": null
}
```

## Ordering, Limits, And Redaction

JSON diagnostics sort lexically by sanitized file, pointer, severity, code,
kind, keyword, and message, with sorted related locations as the final tie
breaker. Null fields compare as empty strings. Related locations and success
inventories sort by file. Identical inputs and repository revisions produce
identical output without timestamps, random IDs, absolute roots, or environment
values. Diagnostic order in existing text mode is unchanged.

At most 200 JSON diagnostics are emitted, including discovery diagnostics.
The exit decision considers all discovery diagnostics before truncation.
Schema validation retains its existing 200-error bound. An underlying omission
or output cap sets `truncated: true`; the failure still has `result: null`.

Absolute, remote, escaping, Windows-style, and overlong source locators are
redacted. Non-ASCII and control characters are escaped in the JSON byte stream;
JSON decoding restores characters in legitimate filenames, so consumers must
escape decoded strings when displaying them in terminals or markup. Relative
filenames remain visible and should not contain secrets. Outside the explicit
inspection and graph identity and reference projections, raw manifest values,
private field names, prompt content, environment data, and caught exception
messages are not included.

## Compatibility And Evidence

Consumers should pin the repository revision and `formatVersion` together.
This version identifies the envelope, not a stable diagnostic catalog revision
or a released executable. JSON is opt-in; discovery and validation text callers
and exit codes do not need migration. No manifest schema, `specVersion`, dependency, or
package release changes are required.

### Migration From `0.1-draft` To `0.2-draft`

At that migration step, all output moved to `0.2-draft`, including errors,
help, and existing commands.
The prior closed schema could not represent successful `inspect` or its
additional `result.inspection`. Update the pinned output schema and accepted
version together; no old-format switch is provided. Discovery and validation
result shapes are unchanged. `inspect` is no longer reserved: it requires an
explicit root and follows discovery, schema, and inspection failure rules
instead of always returning exit `3`. Usage without its required root returns
exit `2`. The new inspection-limit error uses exit `1`.

### Migration From `0.2-draft` To `0.3-draft`

All output now uses `0.3-draft`. The prior closed schema could not represent
successful `graph` or `result.graph`. Update the pinned output schema and
accepted version together; no old-format switch is provided. `graph` is no
longer reserved: it requires an explicit root and performs discovery, schema
validation, declared inspection, and static graph construction. Existing
command result shapes are otherwise unchanged.

An incompatible change to fields, types, state meanings, stream or exit
contracts, ordering, or redaction requires a new output version and migration
notes. Code meaning remains governed by the diagnostic catalog. Unknown codes
must not be silently downgraded or treated as success. Stabilizing this format
requires a separate accepted public CLI compatibility decision.

Run `npm run cli-diagnostics-smoke` for schema-backed JSON contract checks,
all seven maintained examples, process and stream checks, no-read dispatch,
error classes, deterministic ordering, redaction, and truncation. CI runs it
alongside the existing text and structural-validation checks. No complete
catalog emitter, semantic validator, SARIF output, Agent Assembly serializer, or
runtime behavior is implemented by this output format.
