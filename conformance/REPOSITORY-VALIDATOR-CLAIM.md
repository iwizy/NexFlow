# NexFlow Conformance Claim: Repository Schema Validator

> Draft, self-declared statement for one repository revision. It is not current
> published validator support, NexFlow certification, a permission grant, an
> approval, or evidence of runtime safety. The matching
> [YAML claim](repository-validator-claim.yaml) is authoritative.

## Claim Metadata

| Field | Value |
| --- | --- |
| Claim format | `0.1` |
| Claim ID | `nexflow-repository-validator-bb8d559` |
| Status | `draft` |
| Issued | `2026-09-29T08:21:09Z` |
| Updated | Not applicable |

## Subject

| Field | Value |
| --- | --- |
| Name | NexFlow repository schema validator |
| Version | `bb8d559b665337b1a9f4c007bfa8335dec92a79a` |
| Type | `validator` |
| Description | Repository maintenance script checking maintained example manifests against the adjacent schema snapshot. |
| Homepage and source | [NexFlow repository](https://github.com/iwizy/NexFlow) |

This statement evaluates [`scripts/validate-schemas.mjs`](https://github.com/iwizy/NexFlow/blob/bb8d559b665337b1a9f4c007bfa8335dec92a79a/scripts/validate-schemas.mjs)
at the pinned commit. It does not evaluate the separate disposable CLI prototype
or promise a distributable validator.

## Evaluated Scope

- **NexFlow spec versions:** `0.1` only.
- **Schema snapshot:** [17-kind schema tree at `bb8d559b665337b1a9f4c007bfa8335dec92a79a`](https://github.com/iwizy/NexFlow/tree/bb8d559b665337b1a9f4c007bfa8335dec92a79a/schemas).
- **Profiles:** none claimed; structural success does not prove Core Profile dependency closure.
- **Manifest kinds:** `ActorSet`, `AgentDefinitionSet`, `AgentSet`, `CapabilitySet`, `ContextSet`, `EventSet`, `ExtensionSet`, `HandoffSet`, `MemorySet`, `ModelProfileSet`, `PermissionSet`, `Project`, `PromptSet`, `ProviderSet`, `RetrievalProfileSet`, `TaskSet`, and `Workflow`.
- **Extension namespaces:** none claimed.
- **Input corpus:** maintained YAML manifests under `examples/` at the pinned commit. Arbitrary projects are outside this command's input contract.
- **Unsupported fields:** no field-level exception is separately claimed; this does not enlarge the evaluated corpus or imply semantic support.

## Level Claims

| Level | Status | Summary | Evidence | Limitations |
| --- | --- | --- | --- | --- |
| `NF-MANIFEST` | `not-applicable` | This validator is not a manifest set or authoring profile. | None required | No manifest authoring claim. |
| `NF-SCHEMA` | `partial` | `npm run validate` structurally checks the maintained examples against the adjacent schema snapshot. | [Successful Schema Validation CI run](https://github.com/iwizy/NexFlow/actions/runs/36409277463) at `bb8d559b665337b1a9f4c007bfa8335dec92a79a` | No arbitrary project input; unsupported versions have no dedicated version diagnostic. |
| `NF-SEMANTIC` | `unsupported` | The script does not resolve cross-manifest references or policy relationships. | None required | Focused smoke checks elsewhere do not expand this subject's claim. |
| `NF-CLI` | `unsupported` | The maintenance command is not a released reference CLI or public command contract. | None required | No CLI conformance claim. |
| `NF-RUNTIME` | `not-applicable` | The script does not execute projects or enforce runtime policy. | None required | No runtime conformance claim. |
| `NF-EXTENSION` | `not-applicable` | Extension implementation, loading, and execution are out of scope. | None required | No extension conformance claim. |

## Validation Behavior

The script parses repository example YAML with aliases and duplicate mapping
keys disallowed, compiles the adjacent JSON Schemas, checks bidirectional
kind-to-schema coverage, and validates every maintained example structurally.
Unknown kinds and schema-invalid examples fail. It does not accept arbitrary
project roots, resolve cross-manifest references, evaluate policy, or check
external systems. Unsupported `specVersion` values fail through schema
validation but do not receive a dedicated version diagnostic.

## Enforcement Behavior

No runtime preflight or enforcement. The script reads local repository files
and reports validation results; success does not authorize execution.

## Overall Limitations

- This draft covers one exact repository commit, not a published validator
  package, certification, or general support promise.
- It claims no authoring profile, semantic, CLI, runtime, or executable
  extension conformance.
- The CI result covers this revision and its maintained example corpus, not all
  possible inputs or runtime safety.

## Evidence

| Type | Description | Location | Revision |
| --- | --- | --- | --- |
| `test-suite` | Successful Schema Validation workflow including `npm run validate`. | [CI run](https://github.com/iwizy/NexFlow/actions/runs/36409277463) | `bb8d559b665337b1a9f4c007bfa8335dec92a79a` |

Reproduce the narrower command from a clean checkout of that commit with
Node.js 20 or newer: `npm ci --ignore-scripts`, then `npm run validate`.
Installing dependencies may contact the package registry; the validation
command itself reads local repository files.

## Attestation

- **Assurance:** Self-declared.
- **Responsible party:** NexFlow maintainers.
- **Contact:** [NexFlow issues](https://github.com/iwizy/NexFlow/issues).

The responsible party describes only the pinned subject and evidence above.
Re-evaluate and replace this draft for a different validator revision or scope.
