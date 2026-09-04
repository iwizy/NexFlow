# CLI Static Graph

Status: implemented experimental repository `graph`, not a distributed
reference CLI alpha, runtime plan, or orchestration graph.

The [repository CLI prototype](cli-prototype.md) can derive a static graph from
the bounded [declared inspection](cli-inspection.md). It performs discovery and
schema validation first, projects the same allowlisted resources and reference
fields as `inspect`, then matches those selected references against the selected
declaration inventory. It never executes manifests or reads external systems.

## Usage

```sh
node scripts/cli-prototype.mjs graph --root examples/minimal-team
node scripts/cli-prototype.mjs graph --root examples/software-team --format json
node scripts/cli-prototype.mjs graph --root fixtures/discovery/multi-workflow --project project.yaml
node scripts/cli-prototype.mjs graph --root examples/minimal-team --file project.yaml --file actors.yaml --file agents.yaml
```

Only `text` and `json` are supported. Mermaid, DOT, image rendering, output
files, and external renderers remain outside this alpha. The explicit root,
source-selection modes, containment, schema selection, and limits are inherited
from `validate` and `inspect`. Explicit file mode graphs only the listed files;
an unresolved target can therefore mean that its declaration was not selected.

## Graph Model

A successful JSON result retains `documentCount` and `documents` and adds:

```json
{
  "graph": {
    "mode": "static-declared",
    "referenceCoverage": "selected-fields",
    "nodeCount": 4,
    "edgeCount": 2,
    "nodes": [],
    "edges": []
  }
}
```

Every declaration occurrence becomes a node. Duplicate identities remain
separate nodes so ambiguity is visible rather than silently collapsed. Node IDs
such as `n0` are deterministic only for the same selected inputs and repository
revision. They are invocation-local locators, not NexFlow resource identities.

| Node field | Meaning |
| --- | --- |
| `id` | Invocation-local `n<number>` graph locator. |
| `kind`, `identity`, `scope` | Allowlisted declaration namespace, displayed identity, and optional Workflow scope. |
| `file`, `path` | Safe relative source and JSON Pointer for the declaration occurrence. |

Every selected authored reference becomes one edge. The edge source is the
deepest containing declaration in the same file. The `relation` is a normalized
label from the authored reference field, while `file` and `path` remain the
authoritative source location. Edge IDs such as `e0` are also invocation-local.

| Edge field | Meaning |
| --- | --- |
| `from` | Declaring node locator. |
| `to` | Exactly matched declaration node, otherwise `null`. |
| `candidates` | Candidate node locators only when matching is ambiguous. |
| `target` | Authored target namespace, identity, and scope. |
| `relation` | Normalized authored field label; not a new semantic relation type. |
| `status` | `resolved`, `unresolved`, `ambiguous`, or `redacted`. |
| `file`, `path` | Safe relative source and exact reference-field pointer. |

`nodeCount` and `edgeCount` equal the corresponding array lengths. Nodes retain
the deterministic declaration order from `inspect`; edges retain deterministic
reference order. Reordering an authored array changes JSON Pointers and may
change invocation-local graph IDs.

## Static Resolution

Resolution is deliberately narrow:

- non-participant references match the selected declaration with the same
  namespace, displayed identity, and Workflow scope
- a selected participant reference matches Actor declarations when any
  ActorSet is selected; otherwise it matches legacy AgentSet declarations
- exactly one match is `resolved`
- no match is `unresolved`
- multiple matches are `ambiguous` and listed in `candidates`
- redacted target identity or scope is `redacted` and is never matched

Workflow-step references match only inside their declared Workflow scope.
Task artifacts remain assembly-wide. These rules do not validate every
reference described by the specification. They do not establish policy
correctness, dependency acyclicity, approval coverage, execution order,
external existence, or current runtime state.

The target namespace `participant` is the inspection compatibility label, not
a new typed-reference kind. ActorSet authority in the graph is a target lookup
boundary only; it does not authenticate an actor, grant authority, or merge
Agent Definition behavior.

## Failure And Safety

Discovery or schema failure prevents inspection and graph construction. The
inspection limit of 1,000 declarations and 2,000 selected references also bounds
graph nodes and edges. Overflow returns exit `1` with no partial graph. An
unexpected inspection or graph failure returns exit `4` without exception
content or a partial result.

Graph output uses the same field allowlist and source redaction as `inspect`.
It omits names, descriptions, notes, prompts, credentials, content URIs,
environment values, provider-native selectors, and arbitrary metadata. Declared
identities and safe relative filenames remain visible and must not contain
secrets. A graph is explanatory output and must not be re-ingested as project
authority or treated as a secret detector.

The command performs no network access, subprocess execution, renderer launch,
extension loading, provider call, credential lookup, workflow scheduling, event
replay, task update, or file write. `checks.semantic` remains `not-run` and
`executionAuthorized` remains `false`, even when every selected edge is resolved.

## Compatibility And Verification

Static graph output was introduced when the experimental contract advanced
from `0.2-draft` to `0.3-draft`. The previous closed schema did not permit successful `graph` or
`result.graph`. Consumers must update the accepted output schema and version
together; there is no old-format switch. The current shared envelope is
`0.4-draft` after adding starter initialization; graph fields remain unchanged.
Manifest `specVersion`, schema snapshots, release tags, and the README release
badge do not change.

```sh
npm run cli-graph-smoke
```

Focused checks cover all maintained examples, schema-first construction, all
source modes, Workflow-scoped identities, resolved, unresolved, ambiguous, and
redacted edges, deterministic output, closed projection, and no execution.
This remains repository prototype evidence, not `NF-CLI`, full semantic,
Agent Assembly, or runtime conformance.
