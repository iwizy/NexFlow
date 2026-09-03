# CLI Declared Inspection

Status: implemented experimental repository `inspect`, not a distributed
reference CLI alpha or an Agent Assembly resolver.

The [repository CLI prototype](cli-prototype.md) summarizes selected local
manifests without running an agent. It performs bounded discovery, validates
every selected document against the repository schemas, then projects
declarations and selected reference fields. It does not select an active Agent
Definition, resolve references, compute effective configuration, evaluate
permissions, or authorize execution. Success is not evidence of semantic
validity or source completeness.

## Usage

```sh
node scripts/cli-prototype.mjs inspect --root examples/minimal-team
node scripts/cli-prototype.mjs inspect --root examples/software-team --format json
node scripts/cli-prototype.mjs inspect --root fixtures/discovery/multi-workflow --project project.yaml
node scripts/cli-prototype.mjs inspect --root examples/minimal-team --file project.yaml --file agents.yaml --file actors.yaml
```

The explicit root, three source-selection modes, one-Project requirement,
containment rules, and schema snapshot are identical to `validate`. Explicit
file lists do not follow Project hints. There is no recursive scan, remote
fetch, environment lookup, schema override, or output-file option. Invalid
arguments fail before reading input; failed discovery prevents schema loading;
failed schema validation prevents inspection and suppresses partial results.

For `examples/minimal-team`, text output is:

```text
Inspected 3 manifest(s) (directory-project).
Project "minimal-team" at "project.yaml" "/project"
ActorSet: 1 document(s), 2 declaration(s)
AgentSet: 1 document(s), 1 declaration(s)
Project: 1 document(s), 1 declaration(s)
Resources:
  "actors.yaml" "/actors/0" actor "human-maintainer"
  "actors.yaml" "/actors/1" actor "docs-agent"
  "agents.yaml" "/agents/0" agent "docs-agent"
  "project.yaml" "/project" project "minimal-team"
Selected references (not resolved):
  "actors.yaml" "/actors/1/agentRef/id" agent "docs-agent"
  "project.yaml" "/project/maintainers/0/id" participant "human-maintainer"
Declared inventory only. References are not resolved; effective configuration and Agent Assembly are not computed.
Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.
```

Counts describe occurrences, not unique identities. Duplicate IDs remain
separate rows at their authored pointers. Missing reference targets are still
shown, not resolved or rejected on semantic grounds. Discovery's existing
association and Workflow identity checks still apply before this projection.

## JSON Contract

Use the direct Node invocation for machine consumers, avoiding npm lifecycle
logging. The [JSON envelope](cli-diagnostics.md) has `formatVersion: "0.3-draft"`.
Successful `inspect` retains `result.documentCount` and `result.documents`, and
adds `result.inspection`. Any failure has `result: null`.

| Inspection field | Meaning |
| --- | --- |
| `mode` | Always `declared-only`. |
| `referencesResolved` | Always `false`. |
| `referenceCoverage` | Always `selected-fields`, not an exhaustive inventory. |
| `project` | Declared Project `id`, safe relative `file`, and `/project` pointer. |
| `summary` | Per-kind `documentCount` and `resourceCount`, for selected kinds only. |
| `resources` | Declaration occurrences with `file`, `path`, `kind`, `id`, and `scope`. |
| `references` | Selected authored references with the same fields; `path` points to the reference field, not its target. |

Discovery and schema checks are `passed` on success. Core Profile, semantic,
and extension-profile checks remain `not-run`; `executionAuthorized` is always
`false`. Inspection is a projection, not a new validation layer.

## Declaration Coverage

All 17 supported manifest kinds contribute declarations:

| Manifest kind | Resource namespaces |
| --- | --- |
| `Project` | `project`, nested `approval-gate` |
| `ActorSet` | `actor` |
| `AgentSet` | `agent` |
| `AgentDefinitionSet` | `agent-definition` |
| `CapabilitySet` | `capability` |
| `PermissionSet` | `permission` |
| `TaskSet` | `task`, nested `artifact` |
| `Workflow` | `workflow`, nested `workflow-stage` and `workflow-step` |
| `HandoffSet` | `handoff` |
| `ContextSet` | `context-source` |
| `MemorySet` | `memory-scope`, identified by `scope` |
| `ProviderSet` | `provider` |
| `ModelProfileSet` | `model-profile` |
| `PromptSet` | `prompt-set` |
| `RetrievalProfileSet` | `retrieval-profile` |
| `EventSet` | `event`, identified by `type` |
| `ExtensionSet` | `extension` |

The `agent` label identifies an AgentSet slot. It does not classify a legacy
entry as human or AI or perform migration. Workflow stages, steps, and step
references carry `scope: { "kind": "workflow", "id": "<workflow-id>" }`.
Other rows have `scope: null`. Repeated step IDs in different workflows remain
distinguishable. Task artifacts and handoff artifact references are
assembly-wide, not Task- or Workflow-scoped. See
[Work Reference Namespaces](work-reference-namespaces.md).

## Selected Reference Coverage

Only these fields are projected, relative to the declaring resource. Array
notation `[]` denotes each authored occurrence.

| Declaring resource | Selected fields and target namespaces |
| --- | --- |
| Project | `maintainers[].id` -> participant |
| Actor | `agentRef.id` -> agent; `operatedBy[].id`, `representedBy[].id` -> actor; `integrationRef.id` -> extension |
| Agent Definition | `agentRef` -> agent; `owner` -> participant; `components.modelProfileRef`, `components.promptSetRef`, `components.retrievalProfileRef`, `components.permissionRefs[]`, `components.capabilityRefs[]`, `components.contextSourceRefs[]`, `components.memoryScopes[]`, `components.extensionRefs[]` -> corresponding namespaces |
| Task | `owner`, `participants[]` -> participant; `dependsOn[]` -> task; `capabilitiesRequired[]` -> capability; `approvalGates[]` -> approval-gate |
| Workflow | `dependencies[].from`, `dependencies[].to` -> workflow-step within that Workflow |
| Workflow step | `task` -> task; `dependsOn[]` -> workflow-step within that Workflow; `approvalGates[]` -> approval-gate; `emits[]` -> event |
| Handoff | `from[]`, `to[]` -> participant; `artifacts[]` -> artifact |
| Permission | `subjects[]` -> participant; `capabilities[]` -> capability; `approvalGate` -> approval-gate |
| Context source | `access.allowedActors[]`, `access.deniedActors[]` -> participant; `approvalGates[]` -> approval-gate |
| Memory scope | `allowedConsumers[]`, `allowedWriters[]` -> participant; `allowedSourceScopes[]` -> memory-scope; `approvalGate` -> approval-gate |
| Model profile | `selection.providerRefs[]`, `selection.pinnedModel.providerRef`, `fallback.candidateProviderRefs[]` -> provider |
| Prompt set | `owner` -> participant |
| Retrieval profile | `owner` -> participant; `sources[].contextSourceRef`, `excludedSources[]` -> context-source; `index.embeddingModelProfileRef` -> model-profile |
| Extension | `requiredCapabilities[]` -> capability |

`participant` labels fields that may still contain legacy scalar participant
identities. It is not a new typed-reference kind and does not choose between
ActorSet and AgentSet targets. A row's namespace is not proof that the target
exists or that policy grants access. Omitted fields are not covered, including
approval-gate target resolution, extension configuration, selection policies,
and embedded metadata. There is no recursive search for arbitrary `Ref` keys.
This is not the [Semantic Reference Inventory](semantic-reference-inventory.md).

## Disclosure And Limits

Projection uses explicit field allowlists. Names, descriptions, notes, prompt
bodies, roles, statuses, arbitrary metadata, version selectors, provider-native
model names, content URIs, credential references, and environment values are
not printed. It does not traverse prompt content or fetch context and artifacts.

Declared IDs and relative filenames are intentionally visible and must not
contain secrets; this is not a general secret detector. Identity display values
are limited to 128 characters in the supported lowercase identity alphabet.
Longer schema-valid event types become `<redacted-id>` while retaining their
source pointer. Redaction can make different display IDs equal; it must not be
used for identity resolution. Source redaction and control-character escaping
follow the JSON diagnostics contract. Escape decoded strings for their display
surface before rendering them.

Summary rows sort lexically by manifest kind. Resources and references sort by
declared source path, JSON Pointer, namespace, and ID using lexical string
comparison before source redaction. Collapsed redacted locators do not reorder
the rows. Output is independent of input-file ordering, working directory, timestamps, and
environment values for the same selected manifests. Reordering an authored
array changes pointers and therefore changes the inspection.

Discovery byte and document limits still apply. Inspection additionally allows
at most 1,000 resource rows and 2,000 reference rows per invocation. These limits
are inclusive and have no override flag. Overflow returns exit `1` and
`NEXFLOW-PROTOTYPE-INSPECTION-LIMIT`, without a partial result. `truncated`
remains `false` for this single error: it describes omitted diagnostics, not an
omitted inspection. Select a smaller explicit file set when appropriate;
omitting related documents still prevents completeness claims.

Unexpected projection failure returns exit `4` without exception content or
partial output. Schema validation may already be `passed`; consumers must
check the overall failure state, not infer success from that field.

## Compatibility And Verification

The current output contract is `0.3-draft`. Inspection was introduced in
`0.2-draft`; static graph output subsequently advanced the shared envelope.
Update the accepted version and schema together. Existing inspection fields are
unchanged by `0.3-draft`. Manifest `specVersion`, schemas, release tags, and the
README release badge do not change with this experimental tooling format.

```sh
npm run cli-inspection-smoke
```

CI exercises all maintained examples and manifest kinds, schema-first failures,
all source-selection modes, scoped references, unresolved and duplicate
declarations, exact limits and overflow, deterministic JSON and text,
redaction, and non-mutation. The command does not require a dedicated example
project.
The Runtime Architecture Decision, reference CLI distribution, full semantic
validation, Agent Assembly resolution, and runtime execution remain separate.
