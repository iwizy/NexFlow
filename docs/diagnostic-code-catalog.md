# Diagnostic Code Catalog

This document is the central draft catalog for NexFlow validation diagnostics.
It defines code families, default severities, suggested message patterns,
remediation guidance, and the status of codes already emitted or proposed by
the repository.

The catalog does not implement a reference CLI, standardize a machine-readable
output envelope, or claim complete semantic, policy, graph, safety, extension,
audit, or runtime validation.

Related documents:

- [Validation](validation.md)
- [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md)
- [Conformance](conformance.md)
- [Compatibility](compatibility.md)
- [Semantic Reference Inventory](semantic-reference-inventory.md)
- [RFC-0005: Validation Strategy](../rfcs/RFC-0005-validation-strategy.md)
- [RFC-0011: Reference CLI Scope](../rfcs/RFC-0011-reference-cli-scope.md)
- [RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md)
- [RFC-0016: Core Profile And Logical Discovery](../rfcs/RFC-0016-core-profile-and-discovery.md)

## Catalog Status

The catalog is part of the unreleased `specVersion: "0.1"` draft. It is
identified by the repository revision until a future independently versioned
diagnostic artifact or CLI output contract exists.

No code is marked stable yet. Existing repository scripts provide implementation
evidence for a bounded subset, but their text output is maintenance tooling and
not a public CLI compatibility promise.

| Status | Meaning |
| --- | --- |
| **Implemented draft** | A maintained repository check emits the code, but the code and output format are not a stable public CLI contract. |
| **Candidate** | The code and meaning are specified for review but are not emitted consistently by current tools. |
| **Reserved** | The family is allocated; exact conditions and codes remain future work. |
| **Stable** | The code has an accepted compatibility commitment. No current code has this status. |
| **Deprecated** | Consumers should migrate to a documented replacement during a compatibility window. |
| **Removed** | The code is no longer emitted by the identified catalog version. |

Promotion to Stable requires reviewed semantics, fixtures, deterministic
structured output, remediation guidance, compatibility policy, and conformance
evidence. Merely mentioning a code in an RFC does not make it stable.

## Diagnostic Codes And Conformance Levels

Diagnostic codes and conformance levels are different namespaces even when a
token looks similar.

- `NF-SCHEMA` in a diagnostic reports a schema-related failure.
- `NF-SCHEMA` in a conformance claim identifies a support level.
- `NF-SEMANTIC` may currently appear as a coarse repository diagnostic and as a
  conformance level.
- `NF-EXT` is the reserved diagnostic family for extension validation.
- `NF-EXTENSION` is the conformance level; it is not a diagnostic family.
- `NF-RUNTIME` is a conformance level and the reserved root for future
  `NF-RUNTIME-<CONDITION>` diagnostics; the context must remain explicit.
- `NF-MANIFEST` and `NF-CLI` are conformance levels, not diagnostic families.

Receiving a diagnostic code proves neither conformance nor non-conformance
beyond that observed check. Conformance claims require their own scope,
evidence, version, and limitations.

## Severity Levels

| Severity | Default effect | Meaning |
| --- | --- | --- |
| `error` | Unsuccessful validation | Input is invalid, ambiguous, unsupported for a required surface, or cannot be evaluated safely. |
| `warning` | Successful unless explicit project or CI policy promotes it | Input may remain valid, but compatibility, migration, completeness, or safety review is required. |
| `info` | Successful | Context or migration guidance that does not invalidate the input. |

Tools may promote a catalog warning to an error through explicit policy. They
must not silently demote a catalog error while still claiming successful
validation against the affected rule. A machine-readable result should expose
the effective severity if policy changes it.

Severity is not encoded into the code. Changing a stable code's default
severity may be compatibility-breaking.

## Code Construction

Standard NexFlow diagnostics use uppercase ASCII tokens separated by hyphens:

```text
NF-<FAMILY>-<CONDITION>
```

Rules:

- `NF` identifies the NexFlow diagnostic namespace.
- A family may contain more than one token, such as `EFFECTIVE-CONFIG`.
- The condition describes one durable failure class, not a file, field, actor,
  provider, extension package, or vendor name.
- Dynamic values belong in structured details and messages, never in the code.
- Codes must not encode severity, language, source path, or array index.
- New standard `NF-*` codes require a synchronized catalog change.

The coarse `NF-SYNTAX`, `NF-SCHEMA`, and `NF-SEMANTIC` codes predate this
specific-code convention. They remain Implemented draft transition codes.
Future tools should prefer cataloged specific codes when the failure condition
is known, while preserving the broad family in structured classification when
useful.

Implementation-specific codes must not be presented as standard NexFlow codes.
Tools should publish and document a separate implementation-owned prefix rather
than minting unreviewed `NF-*` values.

## Diagnostic Shape

A future machine-readable diagnostic should include:

- `severity`
- `code`
- `message`
- project-relative physical file path when known
- logical manifest path when different from the physical path
- manifest `kind` when known
- JSON Pointer field path when known
- structured details needed to interpret the code
- related source locations when ambiguity or duplication is involved
- a suggested remediation when it is safe and actionable

Example shape:

```json
{
  "severity": "error",
  "code": "NF-REF-UNRESOLVED",
  "file": "examples/software-team/workflow.yaml",
  "kind": "Workflow",
  "path": "/workflow/stages/0/steps/1/dependsOn/0",
  "message": "Workflow step reference \"test\" does not resolve.",
  "details": {
    "targetKind": "WorkflowStep",
    "reference": "test"
  },
  "related": [],
  "suggestion": "Declare workflow step \"test\" or correct the reference."
}
```

This is an illustrative diagnostic, not a versioned CLI output schema.

Consumers must use `code` and structured fields for automation. Suggested
message templates in this catalog are human guidance and may be localized or
clarified without changing code meaning.

## Message And Remediation Rules

Messages should:

- state the observed condition directly
- name identifiers and expected values only when safe
- avoid blame, speculation, and claims about intent
- avoid raw secrets, credentials, prompt contents, personal data, or sensitive
  payloads
- avoid absolute machine paths when a project-relative path is sufficient
- keep remediation separate from the factual failure message

Remediation should:

- propose the smallest safe action
- identify the affected declaration or reference
- offer an automatic edit only when the result is deterministic
- preserve explicit denials, approval gates, human override, least privilege,
  context classification, memory boundaries, and network restrictions
- never recommend adding a broad permission, disabling a gate, raising autonomy,
  exposing a credential, or weakening isolation merely to make validation pass

When no safe deterministic fix exists, the suggestion should ask for review and
identify the conflicting sources instead of guessing.

## Determinism And Redaction

For identical inputs, catalog revision, configuration, and environment facts, a
validator should emit diagnostics in deterministic order. Recommended sort keys
are normalized file, field path, severity rank, code, and stable structured
details. Related locations should also be sorted.

Diagnostics must preserve enough identity to locate a problem without leaking
protected content. Redaction may hide a sensitive value, but it must not hide
the existence, severity, code, affected field, or required remediation class.

## Family Registry

| Family | Status | Validation area |
| --- | --- | --- |
| `NF-SYNTAX` | Implemented draft; specific refinements Candidate | YAML or JSON parsing, duplicate keys, root shape, and parser resource limits. |
| `NF-SCHEMA` | Implemented draft; specific refinements Candidate | JSON Schema and manifest-kind selection failures. |
| `NF-DISCOVERY` | Implemented draft | Explicit source loading, containment, document identity, cardinality, and discovery limits. |
| `NF-PROFILE` | Implemented draft; one Candidate warning | Core Profile completeness, dependencies, supported modules, and policy sufficiency. |
| `NF-SEMANTIC` | Implemented draft transition code | Coarse current cross-manifest validation failures awaiting specific families. |
| `NF-REF` | Candidate | Typed reference shape, kind, scope, resolution, ambiguity, and duplicate targets. |
| `NF-EFFECTIVE-CONFIG` | Candidate | Active agent definition selection and requested behavior resolution. |
| `NF-BUNDLE` | Candidate; feature deferred | Future bundle structure and logical path failures. |
| `NF-POLICY` | Reserved | Permission, approval, autonomy, context, memory, provider, and project policy consistency. |
| `NF-GRAPH` | Reserved | Workflow, task, dependency, handoff, reachability, and terminal-state checks. |
| `NF-SAFETY` | Reserved | Destructive operations, credentials, production actions, network use, and high-risk autonomy. |
| `NF-EXT` | Reserved | Extension namespace, lifecycle, compatibility, loading, and unsupported behavior. |
| `NF-AUDIT` | Reserved | Required audit identity, correlation, evidence, redaction, and completeness. |
| `NF-RUNTIME` | Reserved | Future runtime preflight and enforcement support failures. |

NF-046 and later focused validation work may add exact codes to Reserved
families. Those tasks must update this catalog rather than inventing codes only
inside implementation output.

## Currently Emitted Base Codes

| Code | Status | Default severity | Suggested message | Remediation |
| --- | --- | --- | --- | --- |
| `NF-SYNTAX` | Implemented draft | Error | `Input cannot be parsed as valid YAML or JSON.` | Correct the parser error at the reported source location without changing manifest meaning. |
| `NF-SCHEMA` | Implemented draft | Error | `Value does not satisfy the schema at <path>.` | Use the schema keyword, instance path, and expected value details to correct the declaration. |
| `NF-SEMANTIC` | Implemented draft | Error | `Manifest relationship does not satisfy a semantic rule.` | Review the reported sources and resolve the missing, duplicate, ambiguous, deprecated, or inconsistent relationship. |

Current `npm run validate` emits the broad `NF-SYNTAX` and `NF-SCHEMA` codes.
Current `npm run semantic-smoke` emits the broad `NF-SEMANTIC` code. Their
messages and console layout are not stable CLI output.

## Discovery Codes

All codes in this table are Implemented draft and default to Error.

| Code | Suggested message | Remediation |
| --- | --- | --- |
| `NF-DISCOVERY-NO-PROJECT` | `No eligible Project document was discovered.` | Add exactly one Project source inside the allowed root or select the correct input. |
| `NF-DISCOVERY-MULTIPLE-PROJECTS` | `More than one Project document is eligible for this assembly.` | Select one Project explicitly or separate the project assemblies. |
| `NF-DISCOVERY-PROJECT-MISMATCH` | `Document project identity does not match <project>.` | Correct the document metadata or remove the foreign document from the source list. |
| `NF-DISCOVERY-UNSUPPORTED-VERSION` | `Document uses unsupported specVersion <version>.` | Use a supported schema snapshot or migrate the document explicitly. |
| `NF-DISCOVERY-UNSUPPORTED-KIND` | `Manifest kind <kind> is not supported.` | Correct the kind or use a tool whose support claim includes it; do not reinterpret it as another kind. |
| `NF-DISCOVERY-KIND-MISMATCH` | `Source expects <expectedKind> but contains <actualKind>.` | Correct the source hint or the document kind after verifying author intent. |
| `NF-DISCOVERY-DUPLICATE-SOURCE` | `Source <source> is declared more than once.` | Keep one canonical source entry and remove incompatible duplicate hints. |
| `NF-DISCOVERY-DUPLICATE-SINGLETON` | `More than one <kind> document exists in the assembly.` | Retain exactly one document for the singleton kind and merge content deliberately if needed. |
| `NF-DISCOVERY-DUPLICATE-WORKFLOW` | `Workflow ID <id> is declared more than once.` | Give each workflow a unique ID or remove the unintended duplicate. |
| `NF-DISCOVERY-OUTSIDE-ROOT` | `Source <source> is outside the allowed discovery root.` | Move the source inside the root or configure a different explicit root; do not weaken containment implicitly. |
| `NF-DISCOVERY-UNSAFE-SOURCE` | `Source <source> violates discovery safety policy.` | Replace the symlink, remote-like locator, unsupported file, unsafe YAML, or other rejected source with an allowed explicit local source. |
| `NF-DISCOVERY-LIMIT-EXCEEDED` | `Discovery limit <limit> was exceeded.` | Reduce the bounded input; repository helper overrides may lower limits only. Raising defaults requires resource and trust review. |
| `NF-DISCOVERY-UNSUPPORTED-HINT` | `Project source hint <hint> is unsupported.` | Use a supported explicit source key or a supported direct file list. |

The focused implementation currently emits Error for unsupported kinds rather
than preserving them as warnings. A future preservation mode must publish its
severity policy and must never interpret unsupported behavior.

The bounded directory entry selector reuses `NO-PROJECT` when neither
`project.yaml` nor `project.yml` exists and `MULTIPLE-PROJECTS` when both exist.
Version checks reject anything other than the exact supported string `"0.1"`,
including an entire assembly authored at the same unknown version. Invalid
limit options and unsafe YAML conversion use `UNSAFE-SOURCE`; count and byte
overruns use `LIMIT-EXCEEDED`.

The [repository CLI prototype](cli-prototype.md) emits these existing draft
codes with generic messages and redacted rejected locators. It does not
stabilize the catalog or add standard codes for its usage and internal errors.
Its `validate` command additionally emits the coarse `NF-SCHEMA` code for
structural failures, with a known kind, sanitized JSON Pointer, safe constraint
keyword, and generic message. Required fields extend the pointer; unknown or
rejected additional property names are redacted. Schema diagnostics are
bounded, and truncation remains a failure. Parser failures retain their
discovery codes. This does not implement candidate schema-code refinements,
full semantic validation, or a stable JSON diagnostic envelope.

## Core Profile Codes

| Code | Status | Default severity | Suggested message | Remediation |
| --- | --- | --- | --- | --- |
| `NF-PROFILE-INCOMPLETE` | Implemented draft | Error | `Required Core Profile slot <slot> is missing or incomplete.` | Add the required document or declaration without inventing optional authority. |
| `NF-PROFILE-MISSING-DEPENDENCY` | Implemented draft | Error | `Module <module> requires missing dependency <dependency>.` | Add the declared dependency or remove the dependent module after reviewing intent. |
| `NF-PROFILE-UNSUPPORTED-MODULE` | Implemented draft | Error | `Required module <module> is not supported by this tool.` | Use a tool with explicit support or remove the requirement; do not treat the module as enforced. |
| `NF-PROFILE-ELEVATED-AUTONOMY-WITHOUT-POLICY` | Candidate | Warning | `Elevated autonomy is declared without sufficient policy modules.` | Add the needed permission, approval, human-control, and audit policy or lower autonomy deliberately. |

## Candidate Syntax Refinements

Current repository tooling emits `NF-SYNTAX`. These refinements are Candidate
codes for a future structured validator.

| Code | Default severity | Suggested message | Remediation |
| --- | --- | --- | --- |
| `NF-SYNTAX-PARSE` | Error | `Input cannot be parsed as <format>.` | Correct the reported syntax at the source location. |
| `NF-SYNTAX-DUPLICATE-KEY` | Error | `Mapping key <key> is declared more than once.` | Keep one value and reconcile duplicates explicitly. |
| `NF-SYNTAX-ROOT-TYPE` | Error | `Manifest root must be a mapping.` | Replace the scalar, sequence, or null root with a mapping containing manifest metadata. |
| `NF-SYNTAX-LIMIT-EXCEEDED` | Error | `Parser limit <limit> was exceeded.` | Reduce aliases, nesting, size, or other bounded input; raise limits only through explicit policy. |

## Candidate Schema Refinements

Current repository tooling emits `NF-SCHEMA`. Future validators should map
standard JSON Schema keywords to these Candidate codes and preserve the keyword
and schema path in structured details.

| Code | Default severity | Suggested message | Remediation |
| --- | --- | --- | --- |
| `NF-SCHEMA-REQUIRED` | Error | `Required property <property> is missing.` | Add the property with a value valid for the selected schema and project intent. |
| `NF-SCHEMA-TYPE` | Error | `Value at <path> must be <expectedType>.` | Change the value shape without coercing ambiguous strings, numbers, or booleans silently. |
| `NF-SCHEMA-ENUM` | Error | `Value <value> is not one of the allowed values.` | Select a documented enum value; do not choose a less restrictive value automatically. |
| `NF-SCHEMA-PATTERN` | Error | `Value at <path> does not match the required pattern.` | Correct the identifier or field syntax and update exact references when identity changes. |
| `NF-SCHEMA-FORMAT` | Error | `Value at <path> does not satisfy format <format>.` | Replace it with a valid value after preserving its intended meaning. |
| `NF-SCHEMA-ADDITIONAL-PROPERTY` | Error | `Property <property> is not allowed at <path>.` | Remove a typo or move custom metadata into a documented extension location. |
| `NF-SCHEMA-UNKNOWN-KIND` | Error | `No schema is available for manifest kind <kind>.` | Correct the kind or use an explicitly compatible schema snapshot. |
| `NF-SCHEMA-CONSTRAINT` | Error | `Value at <path> violates schema keyword <keyword>.` | Follow the keyword-specific expected and actual details; use this fallback only when no specific catalog code exists. |
| `NF-SCHEMA-UNAVAILABLE` | Error | `Schema for manifest kind <kind> is unavailable or could not be compiled.` | Restore the matching trusted schema snapshot or fix the schema before validating manifests. |

Field-specific codes such as `NF-SCHEMA-INVALID-AUTONOMY` are not cataloged.
Use `NF-SCHEMA-ENUM` with structured `path`, `allowedValues`, and `actualValue`
details so automation does not require one code per field.

## Candidate Reference Codes

These codes are proposed by RFC-0015 and remain Candidate. All default to Error
except `NF-REF-LEGACY-UNQUALIFIED`, whose migration-stage default is Info or
Warning.

| Code | Suggested message | Remediation |
| --- | --- | --- |
| `NF-REF-MALFORMED` | `Reference at <path> does not match an accepted shape.` | Rewrite it using the field's documented scalar or typed-reference form. |
| `NF-REF-UNKNOWN-KIND` | `Reference target kind <kind> is unknown.` | Use a kind supported by the selected specification version. |
| `NF-REF-KIND-NOT-ALLOWED` | `Target kind <kind> is not allowed at <path>.` | Select one of the field contract's allowed target kinds. |
| `NF-REF-UNRESOLVED` | `Reference <reference> does not resolve.` | Declare the exact target or correct kind, ID, and scope. |
| `NF-REF-AMBIGUOUS` | `Reference <reference> matches more than one target.` | Replace the legacy reference with an exact typed and scoped reference. |
| `NF-REF-DUPLICATE-TARGET` | `Canonical target <identity> is declared more than once.` | Keep one authoritative declaration or assign distinct IDs within the correct namespace. |
| `NF-REF-SCOPE-REQUIRED` | `Reference <reference> requires explicit scope.` | Add the field contract's required scope owner. |
| `NF-REF-SCOPE-NOT-ALLOWED` | `Reference scope is not allowed at <path>.` | Remove the explicit scope and use the field's fixed namespace. |
| `NF-REF-SCOPE-UNRESOLVED` | `Reference scope <scope> does not resolve.` | Correct or declare the scope owner before resolving the target. |
| `NF-REF-CROSS-PROJECT-UNSUPPORTED` | `Cross-project reference <reference> is unsupported.` | Keep the reference inside the current assembly or use a future explicitly supported import contract. |
| `NF-REF-LEGACY-UNQUALIFIED` | `Legacy unqualified reference <reference> remains accepted for migration.` | Migrate to the deterministic typed form when the field contract provides one. |
| `NF-REF-ALIAS-UNSUPPORTED` | `Reference <reference> relies on an undeclared alias.` | Use the exact authored canonical ID; do not infer case, separator, or spelling aliases. |

## Candidate Effective Configuration Codes

These codes are proposed by RFC-0014 and classified as Candidate. Their default
severity is Error because unresolved or unsupported effective configuration
must block activation.

| Code | Suggested message | Remediation |
| --- | --- | --- |
| `NF-EFFECTIVE-CONFIG-NO-ACTIVE-DEFINITION` | `No eligible active definition exists for agent <agent>.` | Add or activate one complete reviewed definition for the agent. |
| `NF-EFFECTIVE-CONFIG-AMBIGUOUS-DEFINITION` | `More than one active definition exists for agent <agent>.` | Retain exactly one eligible unscoped active definition. |
| `NF-EFFECTIVE-CONFIG-INELIGIBLE-DEFINITION` | `Definition <definition> is not eligible for active selection.` | Select a definition with the correct agent, lifecycle, review, and scope. |
| `NF-EFFECTIVE-CONFIG-UNRESOLVED-COMPONENT` | `Required component <reference> does not resolve.` | Declare or correct the exact model, prompt, retrieval, policy, memory, or extension component. |
| `NF-EFFECTIVE-CONFIG-INCOMPLETE-ACTIVE-DEFINITION` | `Active definition <definition> is incomplete.` | Supply every required component, review, compatibility, and audit field. |
| `NF-EFFECTIVE-CONFIG-CONTEXT-DENIED` | `Requested context <source> is denied by effective policy.` | Narrow the request or obtain the explicit policy and approval required for that source. |
| `NF-EFFECTIVE-CONFIG-MEMORY-DENIED` | `Requested memory use <scope> is denied by effective policy.` | Narrow the memory request or define an allowed, visible, auditable scope. |
| `NF-EFFECTIVE-CONFIG-APPROVAL-PENDING` | `Approval gate <gate> has no valid decision for this request.` | Keep the operation blocked until an eligible authority records a valid scoped decision. |
| `NF-EFFECTIVE-CONFIG-RUNTIME-UNSUPPORTED` | `Runtime cannot enforce required behavior <behavior>.` | Use a runtime with explicit support or keep the configuration blocked; do not downgrade enforcement silently. |

## Other Candidate And Reserved Codes

`NF-BUNDLE-DUPLICATE-PATH` is a Candidate code in draft RFC-0012. Its suggested
message is `Logical bundle path <path> is declared more than once.` The safe
remediation is to retain one canonical entry or assign distinct logical paths.
Manifest bundling remains deferred and no repository tool emits this code.

The `NF-POLICY`, `NF-GRAPH`, `NF-SAFETY`, `NF-EXT`, `NF-AUDIT`, and
`NF-RUNTIME` families are Reserved. Their future tasks must define exact
conditions, default severity, structured details, message templates,
remediation, fixtures, and conformance impact before tools present the codes as
standard NexFlow diagnostics.

Lowercase helper identifiers such as `duplicate-workflow-step` and
`unknown-artifact` currently used inside focused repository smoke libraries are
test-local values, not standard diagnostic codes. NF-047 and later semantic
work should map reviewed conditions into cataloged families rather than expose
those helper strings as public contracts.

## Suppression And Policy

A future tool may support explicit suppression or promotion policy, but the
policy must identify code, scope, rationale, owner, and expiry when applicable.

- Suppressing display must not erase the diagnostic from machine evidence.
- A suppressed Error must not produce a successful conformance result for the
  affected rule.
- Broad wildcard suppression of safety, permission, approval, credential,
  network, or human-control diagnostics should be rejected.
- Policy must not change code meaning.

No suppression format is defined by the current manifest schemas.

## Compatibility Rules

Until a code becomes Stable, maintainers may refine it with synchronized docs,
fixtures, implementation notes, and migration guidance. Even in draft form,
changes should avoid needless churn for implemented repository checks.

For a Stable code:

- adding a new code is usually additive
- clarifying message prose is usually compatible when code meaning and
  structured details remain unchanged
- adding optional structured detail is usually compatible
- changing condition meaning, default severity, required detail, or remediation
  safety may be breaking
- renaming, merging, splitting, or removing a code requires deprecation and
  migration guidance

Consumers must tolerate unknown codes and preserve their raw value. They must
not reinterpret an unknown Error as Warning or infer success because an older
consumer lacks the code.

Diagnostic evolution does not automatically require a manifest `specVersion`
bump because codes are tool output rather than authored manifest fields. It may
require a CLI, validator, conformance claim, or future diagnostic-catalog
version change. If diagnostic meaning reflects changed manifest semantics, the
underlying specification compatibility must also be reviewed.

## Maintenance Rules

A change that adds or changes a standard code must update:

1. this catalog
2. the owning specification or RFC
3. message and remediation guidance
4. focused positive and negative fixtures
5. implemented emitters when applicable
6. Validation, Conformance, and Compatibility evidence
7. changelog and migration guidance when compatibility is affected

Repository checks should eventually verify that emitted `NF-*` codes are
cataloged and that Stable codes have owning fixtures. That automated catalog
check is not implemented yet.
