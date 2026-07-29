# Approval Gate Targets

Approval gate targets identify the declared resources governed by a reusable
project approval gate.

The target model replaces ambiguous scalar `appliesTo` values with typed
`kind`, `id`, and field-specific `scope` references. It makes approval policy
reviewable without turning a gate declaration into an approval decision,
permission, capability, or runtime enforcement mechanism.

Related documents:

- [Approval Gates](approval-gates.md)
- [Typed References](typed-references.md)
- [Semantic Reference Inventory](semantic-reference-inventory.md)
- [RFC-0007: Approval Gates](../rfcs/RFC-0007-approval-gates.md)

## Authored Shape

Project approval gates may declare `targets`:

```yaml
approvalGates:
  - id: security_review
    description: Security review is required for the task and restricted sources.
    requiredApprovers:
      - security-reviewer
    targets:
      - kind: task
        id: security-review
      - kind: context-source
        id: security_knowledge
      - kind: context-source
        id: mcp_tools
```

Each target is a closed typed reference. It contains:

| Field | Required | Meaning |
| --- | --- | --- |
| `kind` | Yes | One accepted approval target kind. |
| `id` | Yes | Exact, case-sensitive ID in that target namespace. |
| `scope` | For workflow stages and steps | Explicit owning workflow. |

Targets do not contain reasons, evidence, expiry, decisions, credentials,
provider configuration, or inline permission policy. Those concepts belong to
the gate description, future approval request and decision records, or their
authoritative domain manifests.

## Accepted Target Kinds

The `0.1` draft accepts:

| Kind | Namespace | Scope |
| --- | --- | --- |
| `agent-definition` | `AgentDefinitionSet.agentDefinitions[].id` | Manifest assembly |
| `capability` | `CapabilitySet.capabilities[].id` | Manifest assembly |
| `permission` | `PermissionSet.permissions[].id` | Manifest assembly |
| `context-source` | `ContextSet.contextSources[].id` | Manifest assembly |
| `memory-scope` | `MemorySet.memoryScopes[].scope` | Manifest assembly |
| `provider` | `ProviderSet.providers[].id` | Manifest assembly |
| `task` | `TaskSet.tasks[].id` | Manifest assembly |
| `workflow` | `Workflow.workflow.id` | Manifest assembly |
| `workflow-stage` | `Workflow.workflow.stages[].id` | Explicit workflow |
| `workflow-step` | Workflow-wide step ID | Explicit workflow |
| `extension` | `ExtensionSet.extensions[].id` | Manifest assembly |

The closed kind set intentionally excludes actors, agents, approval gates,
handoffs, artifacts, model profiles, prompt material, and retrieval profiles.
Those resources may appear in approval evidence or be constrained through
another policy relationship, but they are not direct reusable gate targets in
this slice.

Adding a kind requires a documented approval use, exact namespace and scope,
compatibility analysis, schema changes, and positive and negative checks.

## Scope Rules

Assembly-scoped target kinds MUST NOT declare `scope`.

Workflow stages and steps are nested resources, so a project-level gate cannot
derive their owner from its containing document. They require:

```yaml
targets:
  - kind: workflow-step
    id: publish-release
    scope:
      kind: workflow
      id: release-workflow
```

The scope kind MUST be `workflow`. The scope ID and target ID must both resolve
exactly. Validators must not select a workflow by file name, array order,
nearest declaration, or a same-ID target in another workflow.

Workflow step identity is workflow-wide rather than stage-local. The target
therefore names the workflow but not the stage. See
[Work Reference Namespaces](work-reference-namespaces.md).

## Applicability And Authority

Static `targets` describe resources the reusable gate is intended to govern.
They do not prove that the gate is attached at every required use site.

Other manifests continue to reference gate IDs:

- permissions name a gate for `approval_required` capability use
- tasks and workflow steps name gates that block execution or transition
- context and memory declarations name gates for sensitive access or writes
- network rules name gates for matching outbound access
- agent definitions name gates for review or activation
- human override policy names the gate required for resume

A semantic validator should compare these relationships when evaluating gate
coverage. That broader policy consistency work is separate from resolving the
typed target itself.

A target reference:

- does not grant the target capability
- does not create permission
- does not satisfy the gate
- does not authenticate an approver
- does not create an approval request or decision
- does not override deny, human override, or narrower policy
- does not execute or enforce anything

## Resolution

After schema validation, a semantic validator must:

1. read `kind`, `id`, and any required workflow scope
2. select only the namespace declared for that kind
3. reject an unsupported kind or invalid scope
4. resolve the exact case-sensitive ID
5. reject missing and duplicate declarations
6. avoid fallback to another kind with the same ID
7. keep target resolution separate from permission and approval evaluation

An ID collision across kinds is safe because the target kind is explicit:

```yaml
targets:
  - kind: task
    id: security-review
  - kind: context-source
    id: security-review
```

Each tuple resolves independently. A validator must not collapse them into one
untyped identifier.

## Legacy `appliesTo`

Earlier `0.1` drafts accepted:

```yaml
appliesTo:
  - security-review
```

The scalar does not identify whether the value is a task, capability, context
source, workflow step, or another resource. It remains schema-valid only as a
deprecated migration form.

Rules for legacy values:

- `appliesTo` and `targets` MUST NOT appear on the same gate.
- Maintained examples use `targets`.
- Semantic validators MUST NOT resolve `appliesTo` by searching all namespaces.
- Tools SHOULD report a migration diagnostic for each legacy gate.
- Legacy values do not gain a default target kind.
- A future version may remove `appliesTo` after migration notice.

Structural compatibility does not make the legacy field semantically complete.

## Migration

For each legacy scalar:

1. Find the declaration the author intended, using project documentation and
   actual gate attachment sites rather than ID search order.
2. Record its accepted target kind.
3. Add workflow scope when the target is a stage or step.
4. Replace the scalar list with `targets`.
5. Validate exact target existence.
6. Review every permission, task, workflow, context, memory, network, definition,
   and override reference to the gate.
7. Remove the legacy field.

Before:

```yaml
appliesTo:
  - security-review
  - security_knowledge
```

After:

```yaml
targets:
  - kind: task
    id: security-review
  - kind: context-source
    id: security_knowledge
```

If intent cannot be established, retain the legacy field, report the ambiguity,
and require human review. Do not guess.

## Validation Evidence

Repository checks include:

```sh
npm run approval-gate-target-schema-smoke
npm run semantic-smoke
```

The focused command checks accepted kinds, assembly and workflow scope,
legacy coexistence boundaries, duplicate rejection, ID syntax, and closed typed
objects across 16 positive and negative cases.

The semantic smoke command resolves maintained example targets against their
declared namespaces and reports legacy `appliesTo` as unsupported ambiguity.

These checks do not evaluate gate coverage, approver eligibility, approval
evidence, request or decision state, expiry, revocation, quorum, or runtime
enforcement.

## Compatibility

`targets` is additive inside the unreleased `specVersion: "0.1"` draft.
Legacy `appliesTo` remains structurally valid for migration but is deprecated
and excluded from semantic target support.

Removing `appliesTo`, changing accepted target kinds, changing workflow scope,
or accepting an implicit cross-kind fallback requires an explicit compatibility
and version decision.
