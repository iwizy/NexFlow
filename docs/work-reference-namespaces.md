# Work Reference Namespaces

This document defines deterministic namespaces for workflow stages, workflow
steps, task artifacts, and the references that connect them.

The current `0.1` contract preserves existing scalar authoring:

- workflow step dependencies resolve inside the containing workflow
- workflow step IDs are unique across all stages in that workflow
- task artifact IDs are unique across the logical manifest assembly
- handoff artifact references resolve in that assembly-wide artifact namespace

Stage and task nesting records structure and provenance. It does not create an
implicit nearest-container lookup rule.

Related documents:

- [Typed References](typed-references.md)
- [Manifest Discovery](manifest-discovery.md)
- [Semantic Reference Inventory](semantic-reference-inventory.md)
- [Manifest Reference](manifest-reference.md#identifier-namespaces)
- [Workflow and Task Concepts](concepts.md)
- [Handoff Protocol](handoff-protocol.md)
- [RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md)
- [RFC-0016: Core Profile And Logical Discovery](../rfcs/RFC-0016-core-profile-and-discovery.md)

## Why These Namespaces Matter

Workflow steps are nested under stages, but dependencies may cross stage
boundaries. Artifacts are declared under tasks, but handoffs may transfer
artifacts produced by different tasks.

If tools resolve by nearest stage or nearest task, the same manifest can acquire
different meaning depending on traversal order or implementation details. A
validator might accept `review` from the current stage while another selects a
same-named step from an earlier stage. A handoff might select whichever
`report` artifact was loaded first.

NexFlow avoids those outcomes by establishing the namespace before lookup.

## Canonical Identities

The logical identities are:

```text
(workflow, workflow-stage, workflow:<workflow-id>, <stage-id>)
(workflow, workflow-step, workflow:<workflow-id>, <step-id>)
(assembly, artifact, <artifact-id>)
```

The tuple is conceptual. It does not introduce a compact string syntax, URI
scheme, file path, or new manifest field.

Physical file names, stage order, task order, YAML order, and bundle entry order
do not change these identities.

When discovery retains multiple Workflow documents, each `workflow.id` owns an
independent stage and step namespace. The same stage or step ID may appear in a
different workflow. Current scalar step references never cross that boundary;
cross-workflow syntax and ordering remain unsupported.

## Workflow Stage Namespace

`Workflow.workflow.stages[].id` is unique within the containing workflow.

The same stage ID may appear in a different workflow because the workflow ID is
the owner scope. No current field references a stage from outside its workflow,
but preserving unique stage identity keeps future inspection and typed
references deterministic.

Duplicate stage IDs in one workflow are invalid semantic input even though JSON
Schema cannot compare IDs across array entries.

## Workflow Step Namespace

`Workflow.workflow.stages[].steps[].id` is unique across every stage in the
containing workflow.

A stage groups steps for authoring and presentation. It is not an identity
scope for steps.

This workflow is valid:

```yaml
workflow:
  id: delivery
  stages:
    - id: build
      displayName: Build
      steps:
        - id: implement
          task: implement-change
          dependsOn: []
    - id: review
      displayName: Review
      steps:
        - id: verify
          task: verify-change
          dependsOn:
            - implement
```

`verify.dependsOn` resolves `implement` in the `delivery` workflow, regardless
of stage boundaries.

This workflow is invalid:

```yaml
workflow:
  id: delivery
  stages:
    - id: build
      displayName: Build
      steps:
        - id: review
          task: technical-review
    - id: release
      displayName: Release
      steps:
        - id: review
          task: release-review
```

The two `review` declarations collide in one workflow-wide step namespace.
Validators must report the duplicate and must not select one based on stage
order.

## Step Reference Fields

The following fields use the containing workflow as implicit scope:

| Source field | Target | Resolution |
| --- | --- | --- |
| `steps[].dependsOn[]` | Workflow step | Exact ID in the containing workflow. |
| `workflow.dependencies[].from` | Workflow step | Exact ID in the containing workflow. |
| `workflow.dependencies[].to` | Workflow step | Exact ID in the containing workflow. |

These fields share one symbol table. A step referenced by `dependsOn` and the
same step referenced by a workflow dependency edge have the same identity.

The current fields accept scalar IDs. They do not accept cross-workflow
references. A tool must not search another workflow when a local target is
missing.

A future cross-workflow contract would require an explicit owner scope:

```yaml
kind: workflow-step
id: security-review
scope:
  kind: workflow
  id: governed-release
```

The generic typed-reference primitive can represent this tuple, but current
workflow fields do not accept it.

## Artifact Namespace

`TaskSet.tasks[].artifacts[].id` is unique across all task artifact declarations
in one logical manifest assembly.

The declaring task records where the artifact is expected to originate. It does
not create a task-local artifact identity.

This permits a handoff to reference an artifact from any task without guessing
an owner:

```yaml
tasks:
  - id: implement-change
    artifacts:
      - id: change_set
        type: patch
  - id: verify-change
    artifacts:
      - id: verification_report
        type: report

handoffs:
  - id: implementation-to-review
    from:
      - implementation-agent
    to:
      - review-agent
    reason: The change is ready for verification.
    status: pending
    artifacts:
      - change_set
    nextAction: Review the declared change set.
```

`change_set` resolves in the assembly artifact namespace. The resolver does not
search only the handoff sender's tasks, the recipient's tasks, or a nearby
task.

## Duplicate Artifact IDs

This input is invalid:

```yaml
tasks:
  - id: implementation
    artifacts:
      - id: evidence
        type: patch
  - id: review
    artifacts:
      - id: evidence
        type: report
```

Both declarations create `(assembly, artifact, evidence)`. Different task IDs,
artifact types, URIs, or `producedBy` values do not make the identities
different.

A validator must report the duplicate and must not choose the first, latest, or
closest declaration.

## Handoff Artifact References

`HandoffSet.handoffs[].artifacts[]` contains exact scalar IDs from the
assembly-wide artifact namespace.

A reference is unresolved when no task declares that exact ID. Resolution does
not prove:

- that the artifact was produced
- that the declaring task completed
- that the artifact content exists at its URI
- that the sender may disclose it
- that the recipient may access it
- that acceptance criteria were satisfied
- that the handoff occurs after production

Those checks belong to graph, provenance, permission, context, policy, and
runtime layers.

## Deterministic Resolution

A validator should process these namespaces in this order:

1. Select the logical manifest assembly.
2. Index workflow IDs.
3. For each workflow, index stage IDs and all step IDs across every stage.
4. Reject duplicate stage or step IDs in their workflow scope.
5. Resolve `dependsOn`, `dependencies.from`, and `dependencies.to` only against
   the containing workflow's step index.
6. Index every task artifact ID into one assembly-wide artifact table.
7. Reject duplicate artifact IDs regardless of declaring task.
8. Resolve handoff artifact IDs only against the assembly artifact table.
9. Preserve source locations and owner information for diagnostics.

Tools must not use file paths, array order, stage proximity, task proximity,
display names, aliases, or fuzzy matching.

## Validation Evidence

Run the focused namespace cases:

```sh
npm run work-reference-namespace-smoke
```

The command covers:

- cross-stage step dependencies
- duplicate steps within one stage
- duplicate steps across stages
- the same step ID in separate workflows
- missing inline and explicit dependency endpoints
- duplicate workflow stage IDs
- cross-task handoff artifact resolution
- duplicate artifacts within and across tasks
- missing handoff artifacts
- the same artifact ID in separate assemblies

The repository semantic smoke command uses the same namespace implementation
for all maintained examples:

```sh
npm run semantic-smoke
```

These checks do not establish complete workflow graph, provenance, policy, or
runtime conformance.

## Compatibility And Migration

This contract is a compatible clarification for current maintained `0.1`
examples. Existing scalar references remain valid, and no manifest field changes
shape.

Projects that relied on duplicate step IDs in different stages or duplicate
artifact IDs in different tasks were already ambiguous under documented
NexFlow naming guidance. They should migrate by:

1. choosing stable unique replacement IDs
2. updating all references in the same change
3. preserving old-to-new mappings in migration notes when external tooling
   consumes the IDs
4. rerunning schema and semantic validation

Changing steps to stage-scoped identity, changing artifacts to task-scoped
identity, or permitting cross-workflow lookup would be reference-breaking and
requires an explicit compatibility and `specVersion` decision.

## Current Boundaries

Implemented:

- workflow-wide step and stage duplicate detection
- exact workflow step dependency resolution
- assembly-wide artifact duplicate detection
- exact handoff artifact resolution
- focused positive and negative namespace cases
- repository semantic smoke coverage for maintained examples

Not implemented:

- workflow cycle, reachability, or terminal-state validation
- cross-workflow dependencies
- task-scoped artifact references
- artifact production ordering or provenance verification
- artifact URI integrity or content validation
- permission or disclosure enforcement
- runtime execution or handoff transport
