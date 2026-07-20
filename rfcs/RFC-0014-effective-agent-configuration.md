# RFC-0014: Effective Agent Configuration

## Status

Draft

## Cross-RFC Review

The [Foundational Model Cross-RFC Review](reviews/2026-07-foundational-model-review.md)
accepts the precedence and fail-closed selection direction for implementation
planning, starts with one unscoped active definition per agent, and records the
remaining binding and migration blockers. This RFC remains Draft.

## Summary

This RFC proposes how NexFlow derives an effective configuration for an AI
agent from declarations spread across the manifest set.

The proposal defines:

- the difference between declared, selected, effective, and resolved
  configuration
- the source of truth for agent identity and each behavioral domain
- deterministic agent definition selection
- domain-specific precedence instead of generic file-order merging
- conservative composition of capabilities, permissions, context, memory, and
  autonomy
- model, prompt, retrieval, provider, extension, task, and workflow boundaries
- conflict, ambiguity, validation, compatibility, migration, and audit rules
- the relationship to the Actor Model, Agent Definition Versioning, Provider
  Selection, Approval Gates, Memory Retention, and Event Envelope RFCs

The central rule is:

> Agent definitions select reviewed behavior. Policy manifests authorize and
> constrain that behavior. No reference, default, task, extension, provider, or
> runtime setting may silently broaden authority.

This RFC does not add a runtime, change current schemas, activate current draft
agent definitions, or define a generic deep-merge algorithm.

## Motivation

NexFlow currently distributes agent-related information across several
manifests:

- `agents.yaml` contains identity, responsibilities, skills, permissions,
  capabilities, context access, memory access, autonomy, provider preferences,
  and extensions
- `agent-definitions.yaml` contains versioned component references, permissions,
  capabilities, context sources, memory scopes, autonomy, review, and audit
  expectations
- `model-profiles.yaml` describes model selection constraints
- `prompt-sets.yaml` describes versioned prompt material
- `retrieval-profiles.yaml` describes context retrieval expectations
- `permissions.yaml` declares authorization effects and approval gates
- `capabilities.yaml` declares technical action vocabulary
- `context.yaml` declares information sources and actor access boundaries
- `memory.yaml` declares retention, visibility, consumers, writers, and update
  policy
- `project.yaml` declares default autonomy, project policy, and approval gates
- task and workflow manifests declare ownership, required capabilities, and
  additional gates
- provider and extension manifests describe available integration surfaces

The current examples intentionally keep duplicated identity and definition
references aligned. That demonstrates the component model, but it does not
answer what happens when the values differ.

The current examples also mark agent definitions as `draft`. No specification
rule says which definition becomes active, whether the identity record remains
authoritative, whether task configuration can override the definition, or how a
future runtime should explain the resulting configuration.

Without shared resolution rules, tools could make incompatible and unsafe
choices:

- one runtime may treat `agents.yaml` as authoritative
- another may let an agent definition replace all standing policy
- another may merge arrays by union and accidentally broaden access
- another may select the definition with the highest version string
- another may let a task or extension override autonomy or permissions
- another may apply provider defaults that bypass model profile constraints
- validators may report different results for the same manifest set

NexFlow needs one reviewable configuration model before a runtime or reference
CLI attempts to assemble agents.

## Goals

The effective configuration model should:

- preserve stable actor and agent identity
- make one behavioral release selection explicit and auditable
- identify one source of truth per configuration domain
- avoid file-order, parser-order, and last-writer-wins semantics
- fail closed on ambiguity, unresolved references, and unsafe broadening
- let task and workflow policy narrow behavior without silently expanding it
- keep capabilities separate from authorization
- keep context separate from memory
- keep provider selection separate from permission and data access
- preserve human authority and approval requirements
- support structural and semantic validation
- support migration from the current duplicated `0.1` draft shape
- remain provider neutral and runtime neutral

## Non-Goals

This RFC does not:

- implement agent execution or orchestration
- choose a runtime language
- define provider SDK calls
- define prompt rendering or concatenation syntax
- define a retrieval engine or vector store
- define credential binding or secret storage
- make current draft agent definitions executable
- accept the Actor Model RFC automatically
- accept new task or workflow fields automatically
- define canonical configuration hashing
- define organization policy formats outside NexFlow manifests
- turn validation into runtime enforcement

## Terminology

### Declared Configuration

Declared configuration is the complete set of authored manifest values that may
participate in agent resolution.

Declared values can include alternatives, drafts, denied permissions, unused
profiles, inactive definitions, and unsupported extensions. A declared value is
not automatically selected, authorized, or executable.

### Selected Agent Definition

The selected agent definition is the one versioned behavioral release chosen for
an agent invocation or execution scope.

Selection does not grant access. It identifies the requested component set that
must still pass policy evaluation.

### Effective Agent Configuration

The effective agent configuration is the deterministic, policy-bounded result of
resolving an agent identity, one selected definition, referenced components,
project policy, task and workflow constraints, permissions, context, memory,
autonomy, extensions, and runtime support.

It answers:

- which identity is acting
- which reviewed behavioral release was selected
- which component references apply
- which capabilities are available
- which actions are allowed, denied, or awaiting approval
- which context sources may be read
- which memory scopes may be read or written
- which autonomy limit applies
- which provider and model constraints remain to be resolved
- which diagnostics or blockers prevent execution

Effective configuration is a derived view, not a new authored source of truth.

### Resolved Execution Snapshot

A resolved execution snapshot adds invocation-time and runtime facts to the
effective configuration.

Examples:

- selected provider and model revision
- prompt revisions actually loaded
- retrieval index or corpus version
- runtime-supported capabilities
- task and workflow scope
- approval decisions
- context sources actually used
- memory scopes actually read or written
- extension versions
- runtime and validator versions

An effective configuration may be computed before a provider or runtime exists.
A resolved execution snapshot exists only when a tool has resolved operational
choices.

### Standing Constraint

A standing constraint is a project or identity-level limit that a behavioral
release must not silently exceed.

The current `0.1` `AgentSet` fields may serve as transitional standing
constraints while behavior-specific references move toward agent definitions.

### Requested Configuration

Requested configuration is the behavior and access surface named by a selected
agent definition, task, workflow step, or invocation.

Requested configuration is not authorization.

## Core Principles

### No Generic Merge

NexFlow should not define effective configuration as a generic YAML merge.

Different domains require different semantics:

- a single model profile needs one unambiguous selector
- capabilities are intersected with runtime support
- permissions require policy evaluation with deny precedence
- context and memory use allowlists, denylists, classification, and scope rules
- autonomy uses the most restrictive applicable ceiling
- approval gates accumulate rather than overwrite each other
- extensions remain namespace-scoped

File order, array order, map insertion order, lexical file names, and parser
behavior must not decide authority.

### References Select; They Do Not Grant

An agent definition reference selects a declared component.

It does not:

- grant a capability
- authorize a permission
- permit context access
- permit memory reads or writes
- satisfy an approval gate
- increase autonomy
- activate an extension
- provide credentials
- call a provider

### Constraints Narrow

Project policy, organization policy, explicit deny rules, context denylists,
memory policy, task scope, workflow gates, runtime sandboxing, and human decisions
may narrow effective behavior.

They must not be interpreted as fallback sources that broaden configuration.

### Defaults Fill Missing Values Only

A default applies only when the relevant value is absent and the specification
defines that default for the domain.

Defaults must not override explicit values, denials, gates, classifications,
retention rules, or reviewed component selections.

### Ambiguity Is A Blocker

If a tool cannot select exactly one agent identity, definition, model profile,
prompt set, retrieval profile, or other required single-valued component, it
should report an error.

It must not guess from:

- the newest file modification time
- the highest-looking version
- declaration order
- file name order
- provider availability
- runtime preference
- previous execution state

## Source Of Truth By Domain

NexFlow should use domain-specific authority rather than one globally dominant
manifest.

| Domain | Source of truth | Selection or constraint role |
| --- | --- | --- |
| Actor identity | Future accepted `ActorSet`, or transitional `AgentSet` | Identifies who acts; does not grant access. |
| Agent identity | `AgentSet` during the current draft migration | Stable AI participant metadata and transitional standing constraints. |
| Behavioral release | Selected entry in `AgentDefinitionSet` | Selects versioned component references and requested behavior. |
| Model selection policy | Selected `ModelProfileSet` entry | Defines acceptable model class, selection mode, constraints, fallback, and audit. |
| Prompt material | Selected `PromptSet` entry and prompt revisions | Defines reviewed prompt material and metadata. |
| Retrieval behavior | Selected `RetrievalProfileSet` entry | Defines requested sources, indexes, retrieval strategy, freshness, citations, and sensitivity. |
| Capability vocabulary | `CapabilitySet` | Defines technical actions and risk metadata; runtime support determines availability. |
| Permission effects | `PermissionSet` | Defines `allow`, `deny`, and `approval_required` rules and scope. |
| Context policy | `ContextSet` | Defines sources, classification, actor access, freshness, and source boundaries. |
| Memory policy | `MemorySet` | Defines scopes, retention, visibility, sensitivity, consumers, writers, update modes, and promotion. |
| Autonomy request | Selected agent definition | Requests an autonomy level for the behavioral release. |
| Autonomy ceiling | Identity standing constraint, project policy, task or workflow policy, and human control | Narrows the requested level. |
| Provider inventory | `ProviderSet` | Defines available provider abstractions and provider-level constraints. |
| Extension declarations | `ExtensionSet` | Defines namespace, lifecycle, compatibility, and declared requirements. |
| Task scope | `TaskSet` | Selects work, participants, required capabilities, artifacts, and gates; does not grant access. |
| Workflow scope | `Workflow` | Adds ordering, dependencies, and gates; does not grant access. |
| Approval decisions | Future approval records under RFC-0007 semantics | Satisfy a specific gate in a specific scope; do not erase other constraints. |
| Runtime support | Runtime implementation and sandbox | May narrow available behavior; must not broaden manifest authority. |

No row replaces another row. Effective configuration is the validated
composition of these domain authorities.

## Agent Identity Resolution

Resolution begins with exactly one actor and, when that actor is an AI agent,
exactly one agent identity.

During the current `0.1` draft:

- `agentRef` resolves to an `agents[].id`
- the referenced entry represents the stable agent identity
- human entries in the mixed `AgentSet` must not receive agent definitions
- a definition whose `agentRef` does not resolve is invalid
- a definition must not silently change the agent identity

If RFC-0013 is accepted, actor resolution should happen first:

1. Resolve an actor with `kind: agent`.
2. Resolve that actor's agent-specific configuration identity.
3. Select an agent definition for that identity.
4. Resolve and constrain the behavioral components.

The exact actor-to-agent reference shape remains subject to Actor Model review.

## Agent Definition Selection

Definition selection must be deterministic and explicit.

Recommended order:

1. Resolve the requested agent identity.
2. Look for an explicit agent definition binding in the invocation, task,
   workflow, or project activation scope if a future accepted schema defines one.
3. If an explicit binding exists, verify that the definition's `agentRef` matches
   the requested identity.
4. Verify that the selected definition is eligible for the requested scope.
5. In the absence of an explicit binding, select the only `active` definition
   for the agent.
6. If no active definition exists, stop unless a declared legacy identity-only
   compatibility mode is supported.
7. If more than one active definition exists and no accepted scope selector
   disambiguates them, report an error.

Selection must not infer recency from `definitionVersion`.

Version strings are identifiers for behavioral releases. They are not an
ordering algorithm unless a future RFC defines ordering semantics.

### Definition Lifecycle

Lifecycle state affects selection:

| Status | Selection behavior |
| --- | --- |
| `draft` | Must not be selected for normal execution by default. May be inspected or validated. |
| `active` | Eligible for selection when identity and scope match. |
| `deprecated` | May remain selectable only under explicit compatibility policy; warn and identify a replacement. |
| `retired` | Must not be selected for new work. Historical audit references remain valid. |

A one-off evaluation of a draft definition, if allowed later, should require an
explicit evaluation mode and approval. It must not silently change project
activation state.

### Current Example Status

Current reference examples use draft agent definitions for specification review.

They do not declare an executable active configuration. A future runtime must not
treat example declaration order or the existence of one draft definition as
activation.

## Component Resolution

After selecting a definition, a tool should resolve each referenced component by
exact ID and expected target kind.

Required behavior:

- unresolved required references are errors
- ambiguous references are errors
- a reference to the wrong resource kind is an error
- inactive, deprecated, or retired components follow their domain lifecycle
  rules
- unknown extension references do not gain core semantics
- referenced component contents remain authoritative in their own domains
- an agent definition must not copy and silently override referenced component
  contents

Typed reference syntax and namespace rules are proposed in
[RFC-0015](RFC-0015-typed-references.md). This RFC defines the effective
configuration outcome, not the final reference encoding.

## Capability Resolution

Capabilities describe technical actions, not authorization.

Effective capability availability should be based on:

- capability IDs requested by the selected agent definition
- transitional standing capability constraints on the agent identity
- declarations in `capabilities.yaml`
- runtime, sandbox, integration, and extension support
- task-required capabilities
- project and organization policy

During migration, if both identity and definition capability lists exist:

- the definition list is the requested release surface
- the identity list is a standing ceiling
- a definition capability absent from the identity ceiling is a conflict, not an
  implicit expansion
- a capability missing from `CapabilitySet` is unresolved
- a capability unavailable in the runtime is unavailable even if declared

Task `capabilitiesRequired` means the task cannot proceed without those
capabilities. It does not grant them.

Permission evaluation happens after capability availability is known.

## Permission Resolution

`permissions.yaml` is authoritative for permission effects, subjects,
capabilities, conditions, scope, and approval gates.

Identity and definition permission references identify expected policy
dependencies. They do not create permission effects.

A future resolver should:

1. Collect permission rules applicable to the actor, role, task, workflow,
   project, and requested capability.
2. Verify referenced permission rules exist and apply to the agent or scope.
3. Apply conditions and scope.
4. Treat explicit `deny` as strongest.
5. Treat `approval_required` as blocked until the referenced gate is satisfied
   for the exact action and scope.
6. Treat `allow` as valid only inside its declared conditions and scope.
7. Reject capability use when no applicable rule authorizes it.

Omitting a deny rule from an agent definition must not suppress that deny.

During the current duplicated draft shape, mismatched identity and definition
permission references should be reported. A resolver must not union allow rules
to maximize access.

## Context Resolution

A retrieval profile requests context selection behavior. It does not authorize a
context source.

Effective readable context should be the intersection of:

- context sources requested by the selected definition
- transitional identity `contextAccess` standing constraints
- retrieval profile source references
- `ContextSet` actor allowlists and denylists
- source access mode
- source classification and project sensitivity policy
- applicable capabilities and permissions
- task and workflow scope
- provider data-use constraints
- runtime support

Rules:

- a context deny must win over an allow
- a retrieval profile must not add an undeclared or unauthorized source
- provider availability must not broaden context access
- cached content must retain source classification and policy
- task assignment must not grant context automatically
- stale content rules and citation requirements remain authoritative
- tool exposure from an MCP-like source must be evaluated separately from context
  read access

If a source is requested but not authorized, it should be excluded and reported.
If the source is required for the selected definition or task, resolution should
block rather than continue with silent degradation.

## Memory Resolution

Memory access is distinct from context access.

Effective memory use should consider:

- memory scopes requested by the selected definition
- transitional identity `memoryAccess` standing constraints
- `MemorySet` scope declarations
- allowed consumers and allowed writers
- retention, visibility, sensitivity, update mode, and prohibited content
- source-scope promotion rules
- project and organization policy
- task and workflow scope
- approval gates
- runtime support

Rules:

- a scope reference does not grant read or write access by itself
- write access must not be inferred from read access
- a broader definition scope must not exceed the identity standing ceiling during
  migration
- stricter sensitivity and retention constraints win
- memory promotion must satisfy both source and destination rules
- `approval_required` writes remain blocked until approval is valid
- unsupported durable memory must not fall back to an untracked local store
- runtime caches must not be reclassified as durable NexFlow memory silently

If read and write intent cannot be distinguished by the current draft shape, a
future runtime should use the safer interpretation and require explicit policy
for durable writes.

## Autonomy Resolution

Autonomy is an independence limit, not permission.

The ordered autonomy levels are:

```text
manual_only
  < suggest_only
  < ask_before_changes
  < autonomous_safe
  < autonomous_extended
```

The selected agent definition requests an autonomy level for that behavioral
release.

Applicable ceilings may come from:

- the current identity `autonomyLevel`
- explicit project or organization policy
- task or workflow constraints
- runtime sandbox policy
- human pause, revocation, or override

Effective autonomy should be the most restrictive applicable limit.

`project.defaultAutonomy` is a default, not an implicit maximum. It should fill a
missing value only when the relevant schema allows omission. A broader explicit
autonomy request still needs project policy to permit it.

An approval decision may permit one gated action. It does not permanently raise
the agent's autonomy level.

Task or workflow configuration may narrow autonomy. Broadening autonomy should
require a reviewed agent definition or another future explicit, scoped, and
approved mechanism.

## Model And Provider Resolution

The selected agent definition should identify the model profile used by the
behavioral release.

Resolution then follows RFC-0010:

1. Resolve the selected model profile.
2. Apply project and organization policy.
3. Apply model profile constraints.
4. Filter provider declarations by allowed references and capabilities.
5. Apply data residency, training-use, tool-use, sensitivity, cost, and latency
   constraints.
6. Apply pinned, floating, or policy selection behavior.
7. Apply an approved fallback only when the profile permits it.
8. Check approval requirements.
9. Record the resolved provider, model, revision, constraints, and fallback use.

Agent `providerPreferences` may rank candidates that remain after filtering.
They must not broaden the candidate set or override the model profile.

No model profile means no model-backed execution unless a declared legacy mode
defines a safe and explainable fallback. Provider runtime defaults must not
become hidden core semantics.

## Prompt Resolution

The selected agent definition should identify the prompt set used by the
behavioral release.

The prompt set is authoritative for:

- prompt IDs
- prompt kinds
- revisions
- source references or inline material
- variables
- classification
- review state
- compatibility and audit metadata

Prompt ordering and composition must not be inferred from YAML object order
unless a future accepted schema explicitly gives that order semantic meaning.

Runtime safety instructions may impose stricter behavior, but a runtime should
make behavior-significant hidden layers visible in its conformance and audit
claims when disclosure is safe. A hidden runtime prompt must not grant access,
remove an approval gate, broaden context, or weaken memory policy.

Task instructions and human invocation input may narrow goals or request actions.
They do not override permissions, context, memory, autonomy, or project policy.

If required prompt variables are missing, resolution should block or request the
missing input rather than silently substitute behavior-changing defaults.

## Retrieval Resolution

The selected agent definition should identify the retrieval profile used by the
behavioral release.

The retrieval profile is authoritative for requested retrieval behavior:

- source references
- excluded sources
- index or corpus metadata
- chunking policy
- retriever strategy
- query rewrite
- freshness
- citations
- sensitivity and redaction
- review triggers
- audit expectations

The context model remains authoritative for source access.

Retrieval resolution is therefore a constrained selection:

```text
requested retrieval sources
  intersect authorized context sources
  intersect provider data-use constraints
  intersect task and workflow scope
  intersect runtime support
```

A retrieval profile must not turn a context reference into permission.

## Extension Resolution

Extensions can contribute namespaced configuration but cannot replace core
precedence rules.

An extension is effective only when:

- it is declared
- its lifecycle state permits use
- the selected definition references it when required
- the runtime supports the namespace and compatible version
- its required capabilities and permissions are satisfied
- project policy permits it

Unknown extensions should be preserved when possible and treated as inactive or
unsupported. They must not grant capabilities, permissions, context, memory,
autonomy, provider access, or approval.

If an extension conflicts with core policy, core policy wins.

## Task And Workflow Composition

Tasks and workflows provide execution scope, not a second agent definition.

Current task and workflow fields can:

- select owners and participants
- require capabilities
- add approval gates
- constrain ordering and dependencies
- identify artifacts and acceptance criteria

They do not currently select model profiles, prompt sets, retrieval profiles, or
agent definitions.

A future schema may add explicit definition bindings or narrowing constraints.
If so:

- bindings must resolve by exact ID
- task and workflow scopes may narrow effective configuration
- additional gates accumulate
- required capabilities remain requirements, not grants
- a task must not replace the selected definition through arbitrary inline fields
- broadening behavior requires explicit review and compatibility treatment

## Invocation And Runtime Inputs

Invocation inputs include user requests, runtime parameters, environment facts,
and external approval decisions.

They may:

- provide required prompt variables
- select among explicitly eligible definitions or task scopes
- supply non-secret runtime parameters
- narrow requested actions
- satisfy a scoped approval gate through a valid decision

They must not:

- change agent identity silently
- select an ineligible or retired definition
- inject undeclared capabilities
- turn deny into allow
- broaden context or memory
- increase autonomy silently
- bypass provider constraints
- activate unknown extensions

Runtime support may always narrow behavior. A runtime that cannot enforce a
required boundary should report unsupported configuration and stop.

## Resolution Algorithm

A future resolver should use explicit phases.

### Phase 1: Parse And Validate Structure

- parse the manifest set
- verify supported `specVersion` values
- verify known manifest kinds
- validate each manifest against its schema
- preserve unknown extension data safely

### Phase 2: Resolve Identity

- resolve one actor
- confirm the actor is an AI agent
- resolve one agent identity
- reject missing or conflicting identity declarations

### Phase 3: Select Definition

- apply an explicit accepted binding when present
- otherwise select the unique active definition
- verify lifecycle and scope
- reject ambiguous, draft, retired, or identity-mismatched selection

### Phase 4: Resolve Components

- resolve model profile
- resolve prompt set
- resolve retrieval profile
- resolve permission, capability, context, memory, and extension references
- reject unresolved or wrong-kind references

### Phase 5: Apply Standing Constraints

- compare the definition with transitional identity ceilings
- apply project and organization policy
- apply explicit deny rules
- apply context and memory policy
- apply autonomy ceilings

### Phase 6: Apply Task And Workflow Scope

- confirm assignment and participation
- confirm required capabilities are available
- add task and workflow gates
- narrow context, memory, autonomy, and action scope when declared

### Phase 7: Resolve Runtime Choices

- intersect requested capabilities with runtime support
- resolve provider and model
- resolve prompt revisions and variables
- resolve retrieval index and source availability
- resolve extension compatibility

### Phase 8: Evaluate Approval And Safety

- evaluate permission effects
- locate required gates
- verify approval decisions and scope
- verify credentials remain external and authorized
- fail closed on unsupported enforcement

### Phase 9: Produce Snapshot

- record selected definition and component references
- record effective constraints and blockers
- record resolved provider, model, prompt, retrieval, runtime, and extension facts
- record task, workflow, approvals, context, and memory use
- emit or prepare auditable events

Each phase should produce diagnostics tied to source files and fields.

## Candidate Effective Configuration View

A future `inspect` command or runtime preflight may expose a derived view such as
the following, assuming the referenced definition is eligible and active:

```yaml
effectiveAgentConfiguration:
  agentRef: docs-agent
  definitionRef: docs_agent_active_2026_07
  definitionVersion: "2026.07.0"
  resolutionMode: active_definition
  components:
    modelProfileRef: docs_agent_balanced
    promptSetRef: docs_agent_prompts
    retrievalProfileRef: docs_agent_retrieval
  capabilities:
    requested:
      - read_repository
      - modify_documentation
    available:
      - read_repository
      - modify_documentation
  permissions:
    applicable:
      - docs_write_with_review
    pendingApprovalGates:
      - human_review
  context:
    readable:
      - repository
      - docs
  memory:
    readable:
      - ephemeral
      - task
    writable:
      - ephemeral
  autonomyLevel: ask_before_changes
  provider:
    modelProfileRef: docs_agent_balanced
    resolutionStatus: unresolved
  blockers: []
  sources:
    - agents.yaml
    - agent-definitions.yaml
    - model-profiles.yaml
    - prompt-sets.yaml
    - retrieval-profiles.yaml
    - permissions.yaml
    - context.yaml
    - memory.yaml
```

This is illustrative output, not a proposed authored manifest.

The view should explain why a value is effective and which source constrained it.
It should avoid embedding raw prompts, retrieved content, memory contents,
credentials, tokens, or sensitive approval evidence.

## Conflict Handling

Conflict handling should be deterministic.

| Conflict | Required behavior |
| --- | --- |
| Multiple eligible active definitions | Error unless an accepted scope selector resolves exactly one. |
| Selected definition belongs to another agent | Error. |
| Draft or retired definition selected for normal work | Error. |
| Required component reference is missing | Error. |
| Reference resolves to the wrong resource kind | Error. |
| Definition requests capability beyond identity ceiling during migration | Error or explicit migration diagnostic; never broaden silently. |
| Permission rules disagree | Apply scope and conditions; explicit deny wins. |
| Approval is missing or invalid | Block the gated action. |
| Context source is requested but denied | Exclude and report; block if required. |
| Memory scope is requested but not authorized | Exclude and report; block if required. |
| Autonomy limits differ | Use the most restrictive applicable level. |
| Provider preference conflicts with model profile | Model profile and policy win. |
| Runtime lacks a required capability | Mark unsupported and block the dependent task or action. |
| Unknown extension affects core behavior | Treat as unsupported; do not apply the behavior. |
| Two non-comparable constraints conflict | Error; do not guess. |

Warnings are appropriate only when safe behavior remains deterministic.

## Validation Expectations

Structural validation may check:

- required fields and enums
- reference lexical form
- lifecycle values
- component object shape
- autonomy values
- prompt, retrieval, permission, context, memory, and extension field shape

Semantic validation should check:

- `agentRef` resolves to an AI agent identity
- each definition references the correct identity
- no more than one unscoped active definition exists per agent
- draft and retired definitions are not treated as active
- selected component references resolve to the expected kinds
- identity and definition standing constraints are compatible during migration
- definition permissions apply to the agent or relevant scope
- definition capabilities exist
- context source references exist and access rules are coherent
- memory scopes exist and consumer or writer policy is coherent
- autonomy does not exceed applicable ceilings
- model profile provider references exist
- provider preferences do not broaden model profile eligibility
- prompt and retrieval lifecycle or review state is compatible with activation
- required task capabilities are effectively available
- approval gates exist and referenced events are declared
- extension namespaces and lifecycle state are supported

Candidate diagnostics:

| Code | Meaning |
| --- | --- |
| `NF-EFFECTIVE-CONFIG-NO-ACTIVE-DEFINITION` | No eligible active definition can be selected. |
| `NF-EFFECTIVE-CONFIG-AMBIGUOUS-DEFINITION` | More than one definition is eligible without an accepted selector. |
| `NF-EFFECTIVE-CONFIG-INELIGIBLE-DEFINITION` | A draft, retired, wrong-agent, or out-of-scope definition was selected. |
| `NF-EFFECTIVE-CONFIG-UNRESOLVED-COMPONENT` | A required component reference does not resolve. |
| `NF-EFFECTIVE-CONFIG-STANDING-CONFLICT` | A definition exceeds a transitional identity constraint. |
| `NF-EFFECTIVE-CONFIG-CONTEXT-DENIED` | Requested context is denied or outside policy. |
| `NF-EFFECTIVE-CONFIG-MEMORY-DENIED` | Requested memory use is denied or outside policy. |
| `NF-EFFECTIVE-CONFIG-APPROVAL-PENDING` | A required gate lacks a valid approval decision. |
| `NF-EFFECTIVE-CONFIG-RUNTIME-UNSUPPORTED` | The runtime cannot enforce or provide a required feature. |

Diagnostic codes remain candidates until validation diagnostics are standardized.

## Audit Expectations

An effective configuration decision should be explainable.

Future audit records should preserve, when safe:

- actor and agent identity
- selected agent definition ID and version
- definition lifecycle and review state
- model profile reference
- prompt set reference and prompt revisions
- retrieval profile reference and resolved corpus or index version
- applicable capability and permission references
- permission decision and approval gate state
- effective context sources and classifications
- effective memory scopes and read or write intent
- effective autonomy level and constraining source
- provider and model resolution
- extension namespaces and versions
- task, workflow, and invocation scope
- runtime and validator versions
- diagnostics, fallbacks, and deviations

Audit records should prefer references, versions, digests, and decision summaries
over raw content.

They must not store raw credentials, private keys, tokens, sensitive prompt text,
retrieved confidential content, raw memory contents, or unnecessary personal
data.

## Relationship To Actor Model

RFC-0013 separates common actor identity from AI-specific configuration.

This RFC assumes that effective agent configuration applies only after a
participant is identified as an AI agent.

If ActorSet is accepted:

- actor identity becomes the common participant source
- agent-specific identity or binding remains separate
- human, automation, service, and authority actors do not receive model, prompt,
  retrieval, provider, or agent autonomy configuration by accident
- events preserve both actor identity and effective agent definition when the
  actor is an agent

## Relationship To Agent Definition Versioning

RFC-0004 defines versioned behavioral releases.

This RFC defines how one release is selected and constrained into an effective
configuration.

Agent definition versioning answers:

> Which reviewed behavior release exists?

Effective configuration answers:

> Which release applies here, what does it resolve to, and what is actually
> authorized?

## Relationship To Provider Selection

RFC-0010 defines provider and model resolution after the model profile is known.

Provider selection is one phase of effective configuration. It cannot run safely
before permissions, context, memory, project policy, and model constraints are
known.

## Relationship To Approval Gates

RFC-0007 defines gate declarations, requests, decisions, scope, expiry, and
revocation.

Effective configuration identifies which gates apply. It does not satisfy them.

A valid approval narrows a blocker for one scoped action. It does not rewrite the
agent definition, permission manifest, autonomy level, or standing policy.

## Relationship To Memory Retention

RFC-0008 defines memory ownership, retention, visibility, sensitivity, consumers,
writers, promotion, correction, deletion, expiry, and audit semantics.

Effective configuration applies those rules to requested memory scopes. It must
not reinterpret a scope reference as read and write authorization.

## Relationship To Event Envelope

RFC-0009 defines event identity, actor, subject, correlation, causation, payload,
audit, redaction, and ordering expectations.

Future events should be able to cite the effective agent definition and resolved
component metadata without embedding the entire configuration or sensitive
content.

## Relationship To Reference CLI

RFC-0011 keeps the reference CLI validation-focused.

A future `nexflow inspect` command may display an effective configuration view or
preflight explanation without executing an agent.

A future `nexflow graph` command may show identity, definition, component, policy,
task, and workflow edges.

The CLI must distinguish:

- declared configuration
- selected definition
- effective preflight configuration
- unresolved runtime choices
- unsupported enforcement

Inspection must not be described as orchestration.

## Conformance Impact

An accepted effective configuration model affects several conformance surfaces.

| Claim | Expected impact |
| --- | --- |
| `NF-MANIFEST` | Must preserve the authored configuration inputs and lifecycle states it claims to support. |
| `NF-SCHEMA` | May validate future activation or binding fields but cannot prove effective meaning alone. |
| `NF-SEMANTIC` | Must resolve identity, definitions, components, policy dependencies, conflicts, and ambiguity consistently. |
| `NF-CLI` | May inspect and explain effective preflight configuration without execution. |
| `NF-RUNTIME` | Must enforce the resolved permissions, context, memory, autonomy, approvals, provider constraints, and runtime boundaries it claims. |
| `NF-EXTENSION` | Must report extension participation without letting unknown namespaces alter core precedence. |

Parsing all related manifests is not enough to claim effective configuration
support.

## Compatibility Impact

This RFC is planning-oriented and does not change current manifest validity.

If accepted, the semantics may expose incompatible assumptions in early tools.

Potentially breaking changes include:

- changing which active definition is selected
- rejecting multiple active definitions
- refusing implicit latest-version selection
- treating identity fields as ceilings instead of runtime defaults
- refusing union-based capability, context, or memory broadening
- changing autonomy composition to the most restrictive applicable level
- treating task-required capabilities as requirements rather than grants
- requiring provider selection to use the selected model profile
- rejecting hidden runtime defaults that affect behavior
- requiring effective configuration audit metadata
- moving behavior-specific fields out of `AgentSet`

Changes to effective configuration semantics may affect `NF-SEMANTIC`,
`NF-RUNTIME`, `NF-CLI`, security, privacy, cost, audit, and reproducibility.

No manifest `specVersion` change is required merely to publish this draft RFC.
Implementation may require a version change if accepted schema fields are added,
removed, renamed, or given new normative meaning.

## Migration Strategy

Migration should be staged.

### Stage 1: Document And Diagnose

- accept source-of-truth vocabulary
- document definition selection and lifecycle rules
- compare duplicated identity and definition fields
- warn about unresolved, conflicting, or ambiguous configuration
- keep current examples valid as specification examples

### Stage 2: Add Explicit Activation

- define where project, task, workflow, or invocation definition bindings live
- define any scope selector needed for multiple active definitions
- add semantic checks for active, deprecated, and retired definitions
- avoid implicit version ordering

### Stage 3: Separate Identity From Behavior

- coordinate with the Actor Model migration
- keep stable identity and standing policy separate from versioned release
  components
- move behavior-specific model, prompt, retrieval, provider, and autonomy
  selection into agent definitions
- preserve IDs where possible

### Stage 4: Expose Effective Inspection

- add deterministic preflight output
- report source provenance for effective values
- report pending approvals and unsupported runtime requirements
- define machine-readable diagnostics

### Stage 5: Enforce Runtime Claims

- require one eligible selected definition for execution
- enforce policy-bounded capability, context, memory, autonomy, and provider
  resolution
- emit effective configuration audit metadata
- remove legacy identity-only behavior in a declared spec version

Current examples mirror identity and definition policy references. Migration
should preserve that consistency while making the source roles explicit.

## Security And Safety Impact

The effective configuration model is security-sensitive because precedence can
change authority.

Security requirements:

- no file-order or last-writer-wins policy
- no implicit capability, permission, context, memory, or autonomy broadening
- explicit deny wins
- approval-required actions remain blocked until valid approval
- context denylists and classifications remain authoritative
- memory sensitivity, consumers, writers, and update modes remain authoritative
- provider and model selection cannot bypass data-use constraints
- hidden runtime defaults cannot weaken project policy
- unknown extensions cannot change core behavior
- draft and retired definitions do not execute by default
- ambiguous definition or component selection fails closed
- credentials remain outside effective configuration artifacts
- human pause, revocation, and override remain available

An unsafe resolver can turn harmless duplicated metadata into unintended access.
Resolution and provenance therefore belong in conformance, audit, and security
review.

## Privacy Impact

Effective configuration can reveal what context, memory, provider, and prompt
material an agent may use.

Inspection and audit output should:

- record references instead of raw content
- redact private provider or account identifiers when unnecessary
- avoid embedding prompt text
- avoid embedding retrieved context or memory contents
- avoid exposing private approval evidence
- preserve classification and sensitivity metadata
- minimize personal identity data
- separate public configuration summaries from restricted runtime evidence

## Alternatives Considered

### Make Agents Manifest The Only Source

This is simple but loses versioned behavioral releases and makes model, prompt,
retrieval, provider, review, and audit changes difficult to reference.

### Make Agent Definition Replace Everything

This gives one convenient object but risks letting a behavioral release override
project policy, deny rules, context boundaries, memory policy, and human gates.

### Generic Deep Merge

Merging all YAML objects by file or array order is easy to implement but has no
portable meaning for security-sensitive domains.

### Union Every Referenced Set

Union makes more capabilities and sources available, but that is the unsafe
direction when identity, definition, task, context, and runtime sets differ.

### Intersect Every Value

Intersection is appropriate for many access sets, but not for single selectors,
permission rule evaluation, fallback chains, prompt components, or lifecycle
state. Domain-specific rules are still required.

### Select Highest Definition Version

Version strings may use different schemes and do not prove review, activation,
scope, or safety. Activation must be explicit.

### Let Runtime Defaults Decide

Runtime defaults are operationally convenient but weaken portability,
explainability, provider neutrality, and auditability.

### Require Duplicated Fields To Match Forever

This supports migration checks but leaves two permanent sources of truth and
creates avoidable update churn.

### Use Git History As Effective Configuration

Git history explains authored changes but does not identify the selected release,
runtime resolution, approvals, provider choice, or execution scope.

### Introduce A Lockfile As The Source Of Truth

A future lock or resolved snapshot may improve reproducibility. It should record
resolution output, not replace authored policy manifests or grant authority.

## Open Questions

- Where should an explicit active agent definition binding live?
- Should project activation, task binding, workflow binding, and invocation
  binding use one field shape?
- Should more than one active definition per agent be allowed before scoped
  selectors are standardized?
- Which current `AgentSet` fields remain as standing constraints after ActorSet
  migration?
- Should `project.defaultAutonomy` remain only a fallback, or should a separate
  project maximum autonomy field be added?
- Should context and memory references distinguish read, write, and promotion
  intent directly in agent definitions?
- Should permission references be required policy dependencies, review hints, or
  selectors for applicable rules?
- How should runtime safety prompt layers be disclosed without exposing sensitive
  implementation details?
- Should prompt composition order become explicit in `PromptSet`?
- Should required versus optional model, prompt, retrieval, context, and memory
  components be represented differently?
- Should effective configuration output have a canonical JSON form and digest?
- Which provenance fields belong in event envelopes versus inspection output?
- How should deprecated definitions remain available for reproducibility without
  becoming normal defaults?
- Which effective configuration diagnostics should become stable before a
  reference CLI is implemented?
- Which migration step requires the next manifest `specVersion`?
