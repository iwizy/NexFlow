# Semantic Reference Inventory

This document inventories the cross-manifest references that NexFlow semantic
validators should resolve first.

It defines implementation priority, target namespaces, current repository
coverage, and fail-closed resolution expectations for the current
`specVersion: "0.1"` draft. It is not a manifest, schema, generated registry,
diagnostic catalog, CLI contract, or runtime implementation.

Related documents:

- [Validation](validation.md)
- [Schema Design Notes](schema-design-notes.md)
- [Typed References](typed-references.md)
- [Approval Gate Targets](approval-gate-targets.md)
- [Work Reference Namespaces](work-reference-namespaces.md)
- [RFC-0015: Typed References](../rfcs/RFC-0015-typed-references.md)
- [Effective Agent Configuration](effective-agent-configuration.md)
- [Core Profile](core-profile.md)
- [Core Profile And Logical Discovery](../rfcs/RFC-0016-core-profile-and-discovery.md)

The machine-readable Core Profile records major field-to-module dependency
edges for closure checks. This inventory remains authoritative for exact target
namespaces and semantic coverage. Changes to either table must keep both views
consistent.

## Why An Inventory Is Needed

JSON Schema can check that a reference has the expected lexical shape. It
cannot prove that the target exists in another manifest, belongs to the
expected resource kind, is unique in its namespace, or is eligible for the
requested use.

Without one shared inventory, validators could:

- resolve the same scalar ID against different target kinds
- accept a wrong-kind resource because its ID happens to match
- normalize case or separators and create aliases
- use file order or file names as authority
- continue after ambiguous identity or policy resolution
- treat opaque external handles as NexFlow resource references
- report full semantic support while checking only selected examples

The inventory makes those boundaries reviewable before a general semantic
validator or reference CLI exists.

## Coverage Terms

| Status | Meaning |
| --- | --- |
| **Checked** | `npm run semantic-smoke` currently resolves the reference for maintained examples. |
| **Partial** | The smoke command resolves the target but does not implement all related lifecycle, graph, policy, or safety semantics. |
| **Gap** | The field is schema-valid, but the smoke command does not currently resolve it. |
| **Deferred** | The field lacks a sufficiently precise target-kind or scope contract; validators must not guess. |
| **Not a core reference** | The value is a locator, external handle, content identifier, domain label, or derived output rather than an authored cross-manifest reference. |

Current coverage is repository evidence, not a conformance promise. The smoke
command reads maintained examples only and emits a generic `NF-SEMANTIC`
diagnostic family.

## Priority Model

Priority defines validator implementation order, not diagnostic severity.
Every present reference with an accepted field contract must resolve exactly.

| Priority | Purpose | Failure posture |
| --- | --- | --- |
| **P0** | Establish project, participant, agent, and human-control identity before behavior is selected. | Stop dependent resolution; identity or authority is missing, ambiguous, or wrong-kind. |
| **P1** | Resolve behavior, permission, capability, context, memory, provider, extension, approval, and audit boundaries. | Fail closed for affected behavior; never broaden access or autonomy. |
| **P2** | Resolve task, workflow, dependency, handoff, artifact, and event topology. | Reject the affected graph edge or evidence chain; do not infer ordering or ownership. |
| **P3** | Resolve lifecycle, replacement, review, compatibility, recommendation, and migration references. | Reject invalid required relationships and report advisory relationship failures precisely. |

P0 and P1 should be implemented before a tool claims useful effective
configuration or safety-oriented semantic validation. P2 should precede graph
or workflow inspection claims. P3 completes review and migration evidence but
does not grant authority.

## P0: Identity And Authority Roots

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `Project.project.maintainers[].id` | `ActorSet.actors[].id` when ActorSet mode is active | Checked | Resolve each maintainer as an actor. Legacy projects without ActorSet keep the documented participant fallback. |
| `Project.project.approvalGates[].requiredApprovers[]` | Actor identity | Checked | Resolve every approver exactly; presence does not prove a valid approval decision. |
| `ActorSet.actors[].agentRef` | `AgentSet.agents[].id` | Checked | Require typed kind `agent`, exact assembly scope, one explicit bridge, and no implicit same-ID bridge. |
| `ActorSet.actors[].operatedBy[]` | `ActorSet.actors[].id` | Checked | Require typed kind `actor`; detect missing targets and relationship cycles. |
| `ActorSet.actors[].representedBy[]` | `ActorSet.actors[].id` | Checked | Require typed kind `actor`; detect missing targets and relationship cycles. |
| `ActorSet.actors[].integrationRef` | `ExtensionSet.extensions[].id` | Checked | Require typed kind `extension`; the reference does not activate or authorize the extension. |
| `AgentDefinitionSet.agentDefinitions[].agentRef` | `AgentSet.agents[].id` | Checked | Resolve exact agent identity before definition selection. |
| `Project.project.policies.humanOverride.authorities[]` | `ActorSet.actors[].id` | Checked | Require typed actor references and verify each target is human or fully human-represented. |
| `Project.project.policies.humanOverride.resume.approvalGate` | `Project.project.approvalGates[].id` | Checked | Resolve the gate; declaration does not satisfy it or implement resume. |

Definition selection is a related P0 semantic rule rather than a reference
field: the current unscoped model requires exactly one eligible active
definition for normal effective configuration. Missing or multiple active
definitions fail closed.

## P1: Behavior And Safety Boundaries

### Effective Agent Configuration

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `AgentDefinitionSet.agentDefinitions[].owner` | Actor identity | Checked | Resolve the accountable owner; ownership does not grant behavior. |
| `components.modelProfileRef` | `ModelProfileSet.modelProfiles[].id` | Checked | Resolve the requested model profile exactly. |
| `components.promptSetRef` | `PromptSet.promptSets[].id` | Partial | Resolve exactly; active definitions also require eligible lifecycle and approved safety review where required. |
| `components.retrievalProfileRef` | `RetrievalProfileSet.retrievalProfiles[].id` | Partial | Resolve exactly; active definitions also require eligible lifecycle. |
| `components.permissionRefs[]` | `PermissionSet.permissions[].id` | Checked | Select applicable permission policy; the reference does not grant permission. |
| `components.capabilityRefs[]` | `CapabilitySet.capabilities[].id` | Checked | Resolve requested technical actions; availability and authorization remain separate. |
| `components.contextSourceRefs[]` | `ContextSet.contextSources[].id` | Checked | Resolve requested sources; ContextSet allow and deny policy may narrow them. |
| `components.memoryScopes[]` | `MemorySet.memoryScopes[].scope` | Checked | Resolve requested scopes; consumers, writers, sensitivity, and promotion policy may narrow them. |
| `components.extensionRefs[]` | `ExtensionSet.extensions[].id` | Checked | Resolve requested extension declarations without activating unknown behavior. |
| `review.approvers[]` | Actor identity | Checked | Resolve declared reviewers; existence does not authenticate review evidence. |
| `review.approvalGate` | `Project.project.approvalGates[].id` | Checked | Resolve the activation gate; existence does not satisfy it. |
| `audit.events[]` | `EventSet.events[].type` | Checked | Resolve declared audit event types without implying emission. |

`components.memoryPolicyRef` is intentionally absent: the field had no target
namespace and is rejected by the AgentDefinitionSet schema. Memory intent uses
`components.memoryScopes[]`, while MemorySet owns the corresponding policy.

Deprecated AgentSet fields `permissions`, `capabilities`, `contextAccess`,
`memoryAccess`, `providerPreferences[].provider`, and `extensions` are checked
against their corresponding namespaces for migration compatibility. They are
not merge inputs, standing grants, or effective behavior sources.

### Permissions, Context, And Memory

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `PermissionSet.permissions[].subjects[]` | Actor identity | Checked | Resolve policy subjects without treating actor presence as authority. |
| `PermissionSet.permissions[].capabilities[]` | `CapabilitySet.capabilities[].id` | Checked | Resolve the capability vocabulary before applying `allow`, `deny`, or `approval_required`. |
| `PermissionSet.permissions[].approvalGate` | `Project.project.approvalGates[].id` | Checked | Require a resolvable gate when the permission contract calls for approval. |
| `Project.project.approvalGates[].targets[]` | Kind-specific agent definition, capability, permission, context source, memory scope, provider, task, workflow, workflow stage, workflow step, or extension ID | Checked | Require a typed target, exact kind-specific lookup, and explicit workflow scope for stages or steps. Target resolution does not satisfy the gate or grant access. |
| `ContextSet.contextSources[].access.allowedActors[]` | Actor identity | Checked | Resolve allow-list entries; this does not override explicit deny or broader policy. |
| `ContextSet.contextSources[].access.deniedActors[]` | Actor identity | Gap | Resolve deny-list entries before calculating readable context. |
| `ContextSet.contextSources[].approvalGates[]` | `Project.project.approvalGates[].id` | Checked | Resolve every gate associated with source access. |
| `MemorySet.memoryScopes[].allowedConsumers[]` | Actor identity | Checked | Resolve readers without implying write access. |
| `MemorySet.memoryScopes[].allowedWriters[]` | Actor identity | Checked | Resolve writers independently from consumers. |
| `MemorySet.memoryScopes[].approvalGate` | `Project.project.approvalGates[].id` | Checked | Resolve the gate for approval-controlled updates or access. |
| `MemorySet.memoryScopes[].auditEvents[]` | `EventSet.events[].type` | Gap | Resolve audit event types without implying persistence or emission. |

### Network, Provider, Extension, And Audit

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `networkAccess.rules[].actors[]` | Actor identity | Checked | Resolve the actors constrained by the rule. |
| `networkAccess.rules[].capabilities[]` | `CapabilitySet.capabilities[].id` | Checked | Resolve required network-related capabilities; the rule does not grant them. |
| `networkAccess.rules[].destinations.contextSources[]` | `ContextSet.contextSources[].id` | Checked | Resolve context-bound destinations without bypassing ContextSet policy. |
| `networkAccess.rules[].destinations.providers[]` | `ProviderSet.providers[].id` | Checked | Resolve provider destinations without providing credentials or model eligibility. |
| `networkAccess.rules[].destinations.extensions[]` | `ExtensionSet.extensions[].id` | Checked | Resolve extension destinations without activating integrations. |
| `networkAccess.rules[].approvalGate` | `Project.project.approvalGates[].id` | Checked | Resolve approval-required network rules; existence does not authorize a request. |
| `networkAccess.audit.events[]` | `EventSet.events[].type` | Checked | Resolve required network decision event types. |
| `humanOverride.audit.events[]` | `EventSet.events[].type` | Checked | Resolve human-control audit event types. |
| `Project.project.approvalGates[].events[]` | `EventSet.events[].type` | Gap | Resolve gate lifecycle event types. |
| `ModelProfileSet.modelProfiles[].selection.providerRefs[]` | `ProviderSet.providers[].id` | Checked | Resolve eligible providers. |
| `selection.pinnedModel.providerRef` | `ProviderSet.providers[].id` | Checked | Resolve the provider while keeping `modelId` provider-local. |
| `fallback.candidateProviderRefs[]` | `ProviderSet.providers[].id` | Checked | Resolve fallback candidates; policy still determines eligibility. |
| `ModelProfileSet.modelProfiles[].audit.events[]` | `EventSet.events[].type` | Gap | Resolve model selection audit event types. |
| `ExtensionSet.extensions[].requiredCapabilities[]` | `CapabilitySet.capabilities[].id` | Checked | Resolve declared requirements; extension presence does not grant them. |

## P2: Work Graph And Evidence

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `TaskSet.tasks[].owner` | Actor identity | Checked | Resolve one task owner. |
| `TaskSet.tasks[].participants[]` | Actor identity | Checked | Resolve collaborators without implying ownership or permission. |
| `TaskSet.tasks[].dependsOn[]` | `TaskSet.tasks[].id` | Partial | Resolve exact task edges; cycle, reachability, and terminal-state checks remain broader graph work. |
| `TaskSet.tasks[].capabilitiesRequired[]` | `CapabilitySet.capabilities[].id` | Checked | Resolve requirements; task declaration does not grant capabilities. |
| `TaskSet.tasks[].approvalGates[]` | `Project.project.approvalGates[].id` | Checked | Resolve task gates without satisfying them. |
| `TaskSet.tasks[].artifacts[].producedBy` | Actor identity | Gap | Resolve the declared producer; producer identity does not prove that the artifact was created or accepted. |
| `Workflow.workflow.stages[].steps[].task` | `TaskSet.tasks[].id` | Checked | Resolve the task represented by each step. |
| `Workflow.workflow.stages[].steps[].dependsOn[]` | Workflow-wide step ID in the containing workflow | Partial | Exact resolution and duplicate detection are checked; cycles, reachability, and terminal-state validity remain future work. |
| `Workflow.workflow.dependencies[].from` and `.to` | Workflow-wide step ID in the containing workflow | Partial | Exact endpoint resolution and duplicate detection are checked; cross-workflow ordering is unsupported. |
| `Workflow.workflow.stages[].steps[].approvalGates[]` | `Project.project.approvalGates[].id` | Checked | Resolve gates attached to workflow steps. |
| `Workflow.workflow.stages[].steps[].emits[]` | `EventSet.events[].type` | Checked | Resolve declared event types without implying emission. |
| `HandoffSet.handoffs[].from[]` and `.to[]` | Actor identity | Checked | Resolve all handoff endpoints for one-to-one, one-to-many, and many-to-many transfers. |
| `HandoffSet.handoffs[].artifacts[]` | Assembly-wide artifact IDs declared by `TaskSet.tasks[].artifacts[]` | Partial | Exact existence and duplicate declaration checks are implemented; producer order and acceptance evidence remain broader semantic checks. |

Workflow stages group steps but do not scope step identity. Task declarations
record artifact provenance but do not scope artifact identity. See
[Work Reference Namespaces](work-reference-namespaces.md) for the normative
lookup and compatibility rules.

## P3: Review, Lifecycle, And Migration Links

| Source field | Target namespace | Current coverage | Required semantic behavior |
| --- | --- | --- | --- |
| `AgentDefinitionSet.agentDefinitions[].replaces` | Agent definition ID | Gap | Resolve a prior definition for the same agent and reject replacement cycles. |
| `compatibility.affectedAgents[]` | `AgentSet.agents[].id` | Checked | Resolve affected stable agent identities. |
| `compatibility.affectedWorkflows[]` | Workflow ID | Gap | Resolve affected workflows once workflow identity and cardinality rules are accepted. |
| `ModelProfileSet.modelProfiles[].review.approvers[]` | Actor identity | Checked | Resolve reviewers without authenticating approval. |
| `ModelProfileSet.modelProfiles[].recommendedFor[]` | `AgentSet.agents[].id` | Checked | Resolve advisory agent targets; recommendation does not select behavior. |
| `PromptSet.promptSets[].owner` | Actor identity | Checked | Resolve the prompt set owner. |
| `PromptSet.promptSets[].review.approvers[]` | Actor identity | Checked | Resolve prompt reviewers. |
| `PromptSet.promptSets[].compatibility.replaces` | Prompt set ID | Gap | Resolve the prior prompt set and reject replacement cycles. |
| `compatibility.affectedAgents[]` | `AgentSet.agents[].id` | Checked | Resolve affected agents. |
| `compatibility.affectedWorkflows[]` | Workflow ID | Gap | Resolve affected workflows when the workflow identity contract is active. |
| `PromptSet.promptSets[].audit.events[]` | `EventSet.events[].type` | Gap | Resolve prompt audit event types. |
| `PromptSet.promptSets[].recommendedFor[]` | `AgentSet.agents[].id` | Checked | Resolve advisory targets without selecting the prompt set. |
| `RetrievalProfileSet.retrievalProfiles[].owner` | Actor identity | Checked | Resolve the profile owner. |
| `sources[].contextSourceRef` | `ContextSet.contextSources[].id` | Checked | Resolve retrieval sources before lifecycle or sensitivity checks. |
| `review.approvers[]` | Actor identity | Checked | Resolve retrieval reviewers. |
| `compatibility.replaces` | Retrieval profile ID | Gap | Resolve the prior profile and reject replacement cycles. |
| `compatibility.affectedAgents[]` | `AgentSet.agents[].id` | Checked | Resolve affected agents. |
| `compatibility.affectedWorkflows[]` | Workflow ID | Gap | Resolve affected workflows when the workflow identity contract is active. |
| `audit.events[]` | `EventSet.events[].type` | Gap | Resolve retrieval audit event types. |
| `recommendedFor[]` | `AgentSet.agents[].id` | Checked | Resolve advisory targets without selecting the profile. |

## Deferred Field Contracts

The following fields contain identifier-shaped values but cannot be resolved
safely through a generic ID search:

| Field | Current ambiguity | Required direction |
| --- | --- | --- |
| `PromptSet.promptSets[].prompts[].appliesTo[]` | A prompt may target roles, agents, tasks, workflows, tools, or other prompt-local concepts. | Define the allowed target kinds and scope per prompt kind. |

A validator MUST preserve this value, may report that its semantic contract
is unsupported, and MUST NOT resolve it by searching every namespace.

## Reference-Like Values Outside This Inventory

These values are not core cross-manifest references:

| Value | Meaning |
| --- | --- |
| `Project.manifests.*` | Discovery locator or authoring hint, not resource identity. The focused discovery helper verifies supported hint keys, expected kinds, project association, source safety, and Workflow cardinality without treating paths as references. |
| Prompt `sourceRef` and review `evidenceRefs` | Content or evidence locators whose schemes are not core resource namespaces. |
| Context `mcp.serverId` | Integration-local server handle, not an `ExtensionSet` resource reference. |
| Provider `features` and deprecated provider `capabilities` | Provider feature labels, not `CapabilitySet` resource references. Maintained manifests use `features`; semantic smoke reports legacy `capabilities`. |
| Provider constraint values, region labels, and retention durations | Policy vocabulary or opaque policy values, not resource references. They participate in future eligibility comparison, not ID lookup. |
| Provider `modelId` and model revision | Provider-local identifiers resolved after provider eligibility. |
| Extension `namespace` and `appliesTo` | Extension ownership and domain labels, not resource IDs. |
| MCP profile surface IDs and `allowedTools` | Extension-owned surface and tool labels; they do not resolve as core capabilities or authorize execution. |
| Event payload field names | Payload expectations, not references to declared resources. |
| Agent Assembly provenance entries | Derived inspection output, not authored resolution inputs. |

Extensions may define namespaced reference semantics, but they must not alter
core resolution or grant authority.

## Deterministic Resolution Contract

A semantic validator should process references in this order:

1. Parse and schema-validate supported documents.
2. Discover one logical project assembly without treating file names as
   resource identity.
3. Build case-sensitive declaration indexes for every supported target
   namespace.
4. Reject duplicate declarations before resolving dependent references.
5. Resolve P0 references and active-definition selection.
6. Resolve P1 safety-bound references.
7. Resolve P2 graph and evidence references.
8. Resolve P3 review and migration references.
9. Run lifecycle, policy, graph, and compatibility checks only after their
   required references resolve.

For every accepted field contract, a validator MUST:

- use the target kind defined by the containing field or typed reference
- compare IDs exactly without case folding or separator normalization
- honor explicit scope and reject unsupported scope
- distinguish missing, ambiguous, wrong-kind, duplicate, and unsupported
  resolution
- avoid cascading dependent checks when their source reference failed
- report the source resource, field path, expected target kind, target ID, and
  related declaration locations when safe
- treat reference resolution as selection or association, never as permission,
  capability, context, memory, autonomy, provider, extension, or approval grant

Scalar references remain valid only where the field has one deterministic
target kind and scope. Typed references must match the declared kind even when a
same-ID resource exists elsewhere.

## Current Repository Evidence

`npm run semantic-smoke` currently:

- scans the seven maintained project examples
- builds in-memory indexes for current manifest kinds and nested resources
- checks duplicate IDs in selected namespaces
- rejects duplicate workflow stages, workflow steps, and task artifacts
- resolves step dependencies in the containing workflow and handoff artifacts
  in the assembly artifact namespace
- resolves the fields marked **Checked** or **Partial**
- checks typed ActorSet relationship kinds and actor relationship cycles
- resolves typed approval gate targets and reports deprecated ambiguous
  `appliesTo`
- checks unique unscoped active agent definition selection
- checks selected prompt and retrieval lifecycle requirements
- reports one generic semantic diagnostic family

`npm run work-reference-namespace-smoke` exercises the same workflow step and
artifact namespace implementation with 13 focused positive and negative cases.

`npm run approval-gate-target-schema-smoke` exercises approval target authored
kind and scope boundaries with 16 focused positive and negative cases.

It does not:

- accept arbitrary user-selected project roots
- implement every field marked **Gap**
- define stable per-failure diagnostic codes
- prove complete workflow, permission, context, memory, provider, extension, or
  audit semantics
- compute an Agent Assembly view
- perform runtime preflight or enforcement
- establish full `NF-SEMANTIC` conformance

## Maintenance Rules

When a cross-manifest reference is added or changed:

1. Define its source field, target kind, scope, cardinality, and grant boundary
   in specification documentation.
2. Update this inventory.
3. Update the owning schema for structural shape only.
4. Add or update a maintained example.
5. Add positive and negative semantic fixtures or smoke coverage when the field
   is supported.
6. Document diagnostic and compatibility impact.
7. Update migration guidance for a changed or newly typed field.

Do not add semantic behavior to a script that is absent from the written
specification. Do not claim a reference is checked merely because both source
and target happen to appear in a schema-valid example.
