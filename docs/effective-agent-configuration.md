# Effective Agent Configuration

Effective agent configuration is the deterministic, policy-bounded view of the
behavior requested for one AI agent.

The current `0.1` draft implements the first authoritative selection slice:

- `AgentSet` owns stable AI identity.
- The unique unscoped `active` entry in `AgentDefinitionSet` owns requested
  behavior for that identity.
- Referenced manifests remain authoritative for their own policy and component
  contents.
- Project, task, workflow, permission, context, memory, provider, human-control,
  and runtime constraints may only narrow the requested behavior.

This is specification and validation behavior. NexFlow does not yet provide a
runtime that executes the resulting configuration.

Related proposal:
[RFC-0014: Effective Agent Configuration](../rfcs/RFC-0014-effective-agent-configuration.md).

## Authority Boundary

An active agent definition is authoritative for these requests:

- model profile
- prompt set
- retrieval profile
- permission dependencies
- capabilities
- context sources
- memory scopes
- autonomy level
- extensions

Authoritative does not mean authorized.

The selected definition cannot:

- create a permission effect
- grant a capability
- bypass an approval gate
- override a context deny
- expand memory consumers or writers
- select a provider outside model profile policy
- raise a project or workflow autonomy ceiling
- disable human override
- activate an unsupported extension

The owning manifest for each domain remains authoritative for those decisions.

## Unscoped Selection Rule

The initial model has no project, task, workflow, or invocation binding field.
Selection uses lifecycle status only.

For one agent identity:

1. Resolve the `AgentSet` identity.
2. Find definitions whose `agentRef` matches that identity.
3. Select the only definition with `status: active`.
4. Reject selection when no active definition exists.
5. Reject selection when more than one active definition exists.
6. Never infer selection from version, declaration order, file name, file
   modification time, provider availability, or prior execution.

A project with no active definition remains valid for authoring and review, but
it cannot produce a normal effective configuration. Multiple active definitions
are ambiguous and must fail closed.

Scoped activation remains future work. Do not encode scopes through extension
fields or naming conventions.

## Lifecycle

| Status | Authoritative selection behavior |
| --- | --- |
| `draft` | Declaration and review only; never selected for normal use. |
| `active` | Eligible for authoritative selection when it is the only active definition for the agent. |
| `deprecated` | Preserved for migration and audit; not selected automatically. |
| `retired` | Historical reference only; never selected for new work. |

Changing lifecycle status is behavior-significant. Activating a definition
requires review of its complete requested behavior.

## Active Definition Requirements

An active definition must declare:

- model, prompt, and retrieval profile references
- permission and capability references
- context source and memory scope references
- an explicit extension reference list, including an empty list when none apply
- requested autonomy
- change summary
- compatibility impact and notes
- required review with `state: approved`
- at least one approver, approval gate, and activation criterion
- audit flags for definition, version, components, review state, and change
  summary
- at least one declared audit event

Draft definitions remain structurally useful before every active requirement is
complete.

## Example

```yaml
specVersion: "0.1"
kind: AgentDefinitionSet
metadata:
  project: minimal-team
agentDefinitions:
  - id: docs_agent_2026_06
    agentRef: docs-agent
    definitionVersion: "2026.06.0"
    status: active
    owner: human-maintainer
    description: Reviewed documentation agent behavior.
    components:
      modelProfileRef: docs_agent_balanced
      promptSetRef: docs_agent_prompts
      retrievalProfileRef: docs_agent_retrieval
      permissionRefs:
        - docs_write_with_review
      capabilityRefs:
        - read_repository
        - modify_documentation
      contextSourceRefs:
        - repository
        - docs
      memoryScopes:
        - ephemeral
        - task
      extensionRefs: []
    autonomyLevel: ask_before_changes
    changeSummary: Selects the reviewed documentation behavior.
    review:
      required: true
      state: approved
      approvers:
        - human-maintainer
      approvalGate: human_review
      activationCriteria:
        - Referenced components are reviewed.
    compatibility:
      impact: behavior_changing
      notes: Changes requested documentation behavior.
    audit:
      recordAgentDefinitionRef: true
      recordDefinitionVersion: true
      recordComponentRefs: true
      recordReviewState: true
      recordChangeSummary: true
      events:
        - agent.definition.selected
        - agent.definition.failed
```

## Resolution By Domain

| Domain | Requested by | Constrained or authorized by |
| --- | --- | --- |
| Model | Active definition `modelProfileRef` | Model profile, provider inventory, project policy, runtime support |
| Prompts | Active definition `promptSetRef` | Prompt lifecycle, safety review, runtime support |
| Retrieval | Active definition `retrievalProfileRef` | Retrieval profile, ContextSet, provider policy, runtime support |
| Capabilities | Active definition `capabilityRefs` | CapabilitySet, runtime, sandbox, integration support |
| Permissions | Active definition `permissionRefs` | PermissionSet effects, conditions, scope, approval gates |
| Context | Active definition `contextSourceRefs` | ContextSet allow and deny policy |
| Memory | Active definition `memoryScopes` | MemorySet retention, consumers, writers, update and promotion rules |
| Autonomy | Active definition `autonomyLevel` | Project, task, workflow, human-control, and runtime ceilings |
| Extensions | Active definition `extensionRefs` | ExtensionSet lifecycle, requirements, policy, and runtime support |

Deprecated behavior fields in `AgentSet` are compatibility data. They are not
merged, unioned, or treated as authority or standing constraints.

## Component Lifecycle

An active definition must not silently select an ineligible component.

The maintained semantic smoke currently checks that:

- the referenced prompt set is `active`
- a required prompt safety review is `approved`
- the referenced retrieval profile is `active`
- every referenced component exists

Other component lifecycle and policy compatibility checks remain future
semantic validation work.

## Audit Events

The maintained example declares:

- `agent.definition.selected`
- `agent.definition.failed`

A selection record should identify the agent, definition, definition version,
selection reason, and relevant component references. A failed selection should
identify whether the cause was missing, ambiguous, inactive, unreviewed, or
unresolved configuration without embedding prompts, context, memory, secrets,
credentials, or personal data.

## Compatibility And Migration

Projects with only draft definitions remain schema-valid and reviewable.

To adopt authoritative selection:

1. Keep one stable `AgentSet` identity.
2. Choose one reviewed definition for that identity.
3. Complete every active definition requirement.
4. Mark referenced prompt and retrieval resources active after their reviews.
5. Mark the definition `active`.
6. Keep all other definitions `draft`, `deprecated`, or `retired`.
7. Run structural and semantic validation.

The stricter active-definition contract remains in the unreleased
`specVersion: "0.1"` draft. Earlier `0.1` snapshots that used incomplete active
definitions require migration before candidate review. Draft-only projects do
not require a manifest change.

## Validation Boundary

JSON Schema checks active definition completeness, approved review shape,
compatibility metadata, and mandatory audit settings.

Repository semantic checks cover:

- exact component and policy references
- no more than one unscoped active definition per agent
- active prompt and retrieval lifecycle compatibility
- prompt safety review state
- audit event references

Validation does not load components, calculate full permission effects,
authenticate reviewers, satisfy approval gates, resolve a provider, execute an
agent, or prove runtime enforcement.
