# RFC-0013: Actor Model

## Status

Draft

## Summary

This RFC proposes a first-class actor model for NexFlow.

The proposal distinguishes five actor kinds:

- `human`
- `agent`
- `automation`
- `service`
- `authority`

The goal is to give every participant in project work a stable identity without
modeling humans, CI jobs, external services, or policy authorities as AI agents.

This RFC proposes:

- a shared `Actor` resource and optional `actors.yaml` manifest
- common identity, role, responsibility, and policy bindings
- kind-specific constraints and references
- explicit relationships between actors and AI agent configuration
- rules for ownership, delegation, approval, events, handoffs, and audit
- a staged migration from the current mixed `AgentSet` model
- validation, compatibility, and safety expectations

This RFC does not change schemas or examples by itself. The proposed manifest
shape remains draft until the RFC is accepted and an implementation change is
approved.

## Motivation

NexFlow describes teams made of humans, AI agents, automation systems, external
services, and approval authorities. These participants already appear throughout
tasks, handoffs, permissions, context rules, memory rules, approvals, and events.

The current draft does not give them one consistent identity model.

In particular, `agents.yaml` currently contains both AI agents and human
participants. That creates several problems:

- a human may be required to declare an `autonomyLevel`
- a human may appear to have provider preferences or an agent definition
- CI jobs and scheduled automation have no clear home
- external services may be confused with integrations or providers
- policy authorities may be confused with people, roles, or teams
- references to an `actor` do not identify which resource kind should resolve
- validators cannot apply kind-specific rules reliably
- audit records may hide the actual person or system that performed an action

Calling every participant an agent also weakens the meaning of `Agent` as an AI
participant with model, prompt, retrieval, memory, provider, and autonomy
configuration.

NexFlow needs a common actor layer above participant-specific configuration.

## Goals

The actor model should:

- give each project participant a stable, reviewable identity
- keep humans distinct from AI agents
- distinguish AI behavior from deterministic automation
- distinguish service identities from integration declarations
- represent governance and approval authority explicitly
- support least-privilege permissions for every active actor
- make task ownership, handoffs, events, and approvals auditable
- remain provider neutral and runtime neutral
- support gradual migration from current draft manifests
- avoid granting access or authority from actor kind alone

## Non-Goals

This RFC does not:

- define a human identity provider or employee directory
- define authentication, credentials, tokens, or secret storage
- choose a runtime language or orchestration engine
- define the complete effective agent configuration precedence model
- define provider-specific service accounts
- turn roles, teams, or authorities into implicit permissions
- require public manifests to contain personal data
- define legal identity, employment, or organizational reporting structures
- implement schema validation or runtime enforcement

## Terminology

### Actor

An actor is a declared project participant that may own responsibility, perform
work, initiate or receive a handoff, appear in an event, receive policy bindings,
or participate in an approval decision.

An actor identity answers:

> Who or what is participating in this project action?

It does not answer:

- what the actor is allowed to do
- what the actor can technically do
- what context the actor may read
- what memory the actor may retain
- how independently the actor may act
- which credentials a runtime should use

Those questions remain governed by capabilities, permissions, context, memory,
autonomy, approval gates, runtime policy, and external credential systems.

### Actor Kind

Actor kind describes what type of participant an actor represents.

Actor kind is not a role, permission, trust level, or security clearance.

### Role

A role describes a function or responsibility, such as `maintainer`,
`reviewer`, `release_manager`, or `documentation_architect`.

Different actor kinds may hold the same role. A human reviewer and an AI review
agent may both have review responsibilities, but they are not equivalent actors
and need not have the same authority.

### Active Actor

An active actor can directly perform or initiate a project action.

Humans, agents, automations, and services may be active actors.

An authority actor is primarily a governance or accountability principal. A
concrete action attributed to an authority should also identify the human,
automation, or service that resolved or executed the action on its behalf.

## Proposed Actor Kinds

### Human

A `human` actor represents a natural person participating in project work.

Examples:

- maintainer
- developer
- security reviewer
- product owner
- release approver
- external contributor

A human actor:

- is not an AI agent
- does not require a model, prompt set, retrieval profile, or provider preference
- does not need an agent autonomy level
- may hold capabilities and permissions when a project needs to describe them
- may be an approver when an approval gate explicitly allows it
- may remain pseudonymous or use a project-local identity

Declaring `kind: human` does not grant unrestricted authority. Human authority
for a sensitive action must still be represented by project policy, permission,
role, or approval gate.

### Agent

An `agent` actor represents an AI participant whose behavior may depend on model,
prompt, retrieval, provider, memory, tool, and autonomy configuration.

Examples:

- implementation agent
- documentation agent
- review agent
- research agent
- release note drafting agent

An agent actor should reference agent-specific configuration rather than embed
the full configuration in the common actor record.

An agent actor:

- must remain provider neutral at the actor layer
- may reference one or more versioned agent definitions through a future accepted
  agent configuration model
- may have declared autonomy
- must not gain permissions from its model or provider
- must not approve its own high-risk actions by default
- must remain traceable to the effective agent definition used for an action

The exact source-of-truth and precedence rules for effective agent configuration
are proposed in [RFC-0014](RFC-0014-effective-agent-configuration.md).

### Automation

An `automation` actor represents a process whose project identity is primarily a
job, rule, schedule, pipeline, or deterministic system behavior rather than an AI
participant or long-lived service.

Examples:

- CI validation job
- scheduled dependency scan
- release workflow
- policy rule evaluator
- repository synchronization job

An automation actor:

- should declare how it is triggered or operated when that information matters
- should identify a responsible owner or operator
- may hold narrowly scoped capabilities and permissions
- should not declare model or prompt configuration unless it is actually acting
  as an agent
- should identify a downstream agent separately when it invokes AI behavior

Labeling model-backed behavior as automation must not be used to avoid agent
audit, provider, prompt, or autonomy requirements.

### Service

A `service` actor represents a software principal that participates through an
API, daemon, hosted system, bot account, or other continuing system identity.

Examples:

- GitHub application identity
- issue tracker bot
- deployment controller
- artifact registry service
- external validation service

A service actor is not the same as an integration declaration.

- An integration describes a connection and its extension metadata.
- A service actor identifies the software principal responsible for actions
  through that connection.

A service actor:

- should reference its integration when applicable
- should identify an owner or operator
- may hold narrowly scoped capabilities and permissions
- must not contain raw credentials
- should not be treated as an AI agent unless it exposes agent behavior that is
  modeled separately

### Authority

An `authority` actor represents a governance, approval, or accountability
principal that may not correspond to one natural person or executable system.

Examples:

- project maintainers
- security approval authority
- release board
- organization policy authority
- low-risk automated policy authority

An authority actor helps a manifest express who owns a decision without
pretending that a role, team name, or policy document performed the action.

An authority actor:

- should declare how it is represented or delegated
- must not hide the concrete actor that made or executed a decision
- does not receive capabilities merely because it is an authority
- may be referenced by approval gates and project policy
- may require quorum, separation of duty, or delegation semantics in future RFCs

For high-risk actions, an authority should normally be represented by one or more
declared human actors. Low-risk automated authority must be explicitly scoped by
project policy.

## Actor Kind Boundaries

The following table summarizes the proposed distinctions.

| Kind | Represents | Can be an active executor | Agent configuration | Typical authority use |
| --- | --- | --- | --- | --- |
| `human` | Natural person | Yes | No | Human approval and override |
| `agent` | AI participant | Yes | Required by agent policy | Evidence, drafts, delegated work |
| `automation` | Job, rule, schedule, or pipeline | Yes | No, unless a separate agent is invoked | Explicit low-risk policy only |
| `service` | Continuing software principal | Yes | No, unless a separate agent is invoked | External-system actions |
| `authority` | Governance or accountability principal | Not by itself | No | Approval, ownership, delegation |

These boundaries are semantic. A runtime implementation may host several actor
kinds in one process, but it should preserve their distinct identities in audit
records and policy evaluation.

## Proposed Manifest Model

This RFC proposes an optional `actors.yaml` manifest with kind `ActorSet`.

Candidate shape:

```yaml
specVersion: "0.1"
kind: ActorSet
metadata:
  project: minimal-team
actors:
  - id: human-maintainer
    kind: human
    displayName: Human Maintainer
    description: Final human authority for accepted project changes.
    roles:
      - maintainer
    responsibilities:
      - Review proposed changes.
      - Resolve project policy ambiguity.
    skills:
      - project_review
    capabilities:
      - read_repository
      - approve_changes
    permissions:
      - maintainer_full_review
    contextAccess:
      - repository
      - docs
    memoryAccess:
      - task
      - project

  - id: docs-agent
    kind: agent
    displayName: Documentation Agent
    description: Drafts specification documentation for review.
    roles:
      - technical_writer
    responsibilities:
      - Keep documentation aligned with accepted specification behavior.
    agentRef: docs-agent
    capabilities:
      - read_repository
      - modify_documentation
    permissions:
      - docs_write_with_review
    contextAccess:
      - repository
      - docs
    memoryAccess:
      - ephemeral
      - task

  - id: schema-check
    kind: automation
    displayName: Schema Validation Job
    description: Runs deterministic manifest validation in CI.
    roles:
      - validator
    operatedBy:
      - human-maintainer
    capabilities:
      - read_repository
      - execute_command
    permissions:
      - ci_validation

  - id: repository-service
    kind: service
    displayName: Repository Service
    description: Represents repository API actions used by the project.
    roles:
      - repository_integration
    integrationRef: github
    operatedBy:
      - human-maintainer
    capabilities:
      - create_pull_request
    permissions:
      - repository_service_actions

  - id: project-change-authority
    kind: authority
    displayName: Project Change Authority
    description: Owns final acceptance decisions for project changes.
    roles:
      - change_approver
    representedBy:
      - human-maintainer
```

The example uses the current draft `specVersion` only to illustrate the
proposal. Acceptance must decide whether the change remains in the `0.1` draft
or requires a later manifest version.

## Common Actor Fields

Candidate common fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Stable project-local actor identity. |
| `kind` | Yes | `human`, `agent`, `automation`, `service`, or `authority`. |
| `displayName` | Yes | Human-readable actor name. |
| `description` | Yes | Plain-language purpose and boundary. |
| `roles` | Yes | Functional roles held by the actor. |
| `responsibilities` | Yes | Expected work or accountability. |
| `skills` | No | Declared areas of competence or suitability. |
| `capabilities` | No | Technical actions available to the actor. |
| `permissions` | No | Policy rules applying to the actor. |
| `contextAccess` | No | Declared context source references. |
| `memoryAccess` | No | Declared memory scope references. |
| `operatedBy` | Conditional | Actors responsible for an automation or service. |
| `representedBy` | Conditional | Actors allowed to represent an authority. |
| `agentRef` | Conditional | Agent-specific configuration identity for an agent actor. |
| `integrationRef` | Conditional | Integration used by a service actor. |
| `extensions` | No | Namespaced extension attachments. |

The final schema should use conditional validation by actor kind. Fields that do
not apply to an actor kind should be absent instead of filled with artificial
values.

## Identity Rules

Actor IDs should follow normal NexFlow identifier rules.

Within one project:

- actor IDs must be unique across all actor kinds
- actor kind is part of the declaration, not part of the ID
- changing actor kind is behavior-significant and potentially breaking
- display names may change without changing identity
- personal email addresses or provider-native account IDs should not be required
- aliases must not silently create a second authority or permission identity

An actor ID is a project identity, not proof of authentication.

Future runtimes must bind declared actor IDs to authenticated principals using
runtime-specific mechanisms outside public manifests.

## Actor And Agent Relationship

An `agent` actor represents the stable participant identity used by tasks,
handoffs, permissions, context, memory, approvals, and events.

Agent-specific resources describe how that participant behaves.

Conceptually:

```text
Actor identity
  -> active agent definition
  -> model profile
  -> prompt set
  -> retrieval profile
  -> provider selection
  -> permissions, capabilities, context, memory, autonomy, extensions
```

The actor layer must not duplicate the complete effective agent configuration.

This RFC proposes `agentRef` as a candidate bridge, but does not decide:

- whether agent identity and actor identity use the same ID
- whether `agents.yaml` becomes an agent configuration set
- how active agent definitions are selected
- which source wins when bindings appear in more than one manifest
- how task-level or workflow-level overrides compose

Those questions are addressed by the draft effective configuration model in
[RFC-0014](RFC-0014-effective-agent-configuration.md).

## Relationship To Runtime And Integration Identities

`runtime` and `integration` should not become additional actor kinds by default.

A runtime action can usually be attributed as:

- `automation` when a finite job or pipeline performed it
- `service` when a continuing runtime service performed it
- `agent` when model-backed agent behavior performed it

An integration remains a connection declaration. A `service` actor may represent
the software principal using that integration.

This prevents the actor taxonomy from mixing participant identity with hosting
technology or connection metadata.

## Roles, Teams, And Authorities

Roles, teams, and authorities are related but distinct.

- An actor is an identity.
- A role is a function.
- A team is a collection of participants.
- An authority is a governance or accountability principal.

Roles and teams must not grant permission merely because an actor references
them. Permission inheritance, if supported later, must be explicit and
inspectable.

An authority may be represented by humans, automations, services, or another
carefully scoped authority. Delegation cycles should be rejected.

## Task Ownership

The current `owner` field can mean either accountability or execution.

A future task model should distinguish:

- the actor accountable for the outcome
- the actors assigned to perform work
- the authority that accepts or approves the result

Candidate vocabulary:

```yaml
owner: project-change-authority
assignees:
  - docs-agent
acceptanceAuthority: human-maintainer
```

This RFC does not require those fields yet. It establishes that every such
reference should resolve to an actor with semantics appropriate to the field.

## Handoffs

Handoff `from` and `to` references should resolve to declared actors.

Humans, agents, automations, and services may send or receive work.

An authority may own or accept a governance handoff, but a handoff that triggers
concrete work should identify the active actors responsible for the next action.

Many-to-many handoffs remain supported.

Handoff acceptance does not grant capabilities, permissions, context, memory,
or approval authority.

## Permissions And Capabilities

Capabilities and permissions may apply to active actors of any kind.

Evaluation must not infer access from actor kind:

- a human is not automatically allowed every action
- an agent is not allowed an action because its model supports a tool
- an automation is not trusted because it runs in CI
- a service is not authorized because an integration is configured
- an authority does not gain executable capability from decision ownership

Explicit deny remains stronger than allow or approval-required behavior.

Actor kind may inform validation warnings and policy requirements, but it must
not become an implicit permission grant.

## Approval And Authority

Approval gates should reference declared human or authority actors when human or
governance approval is required.

An approval record should distinguish:

- the authority that owns the decision
- the concrete actor that made or recorded the decision
- the actor requesting approval
- the actor expected to perform the approved action

Candidate representation:

```yaml
decision:
  authority: project-change-authority
  decidedBy: human-maintainer
  requestedBy: docs-agent
  actionActor: repository-service
  state: approved
```

The exact approval record shape remains under RFC-0007.

An authority reference must not make an approval valid unless the deciding actor
is an authorized representative and the decision satisfies gate scope, evidence,
expiry, revocation, and separation-of-duty rules.

## Events And Attribution

Event actor identity should resolve to the actor model.

When one actor invokes another, audit records should preserve the chain instead
of attributing every action to the outer runtime or integration.

Candidate attribution:

```yaml
actor:
  kind: agent
  id: docs-agent
initiatedBy:
  kind: automation
  id: scheduled-docs-check
authority:
  id: project-change-authority
```

The exact envelope fields remain under RFC-0009.

At minimum, a future event model should make it possible to distinguish:

- the actor that performed the behavior
- the actor or system that initiated it
- the authority under which it happened
- the effective agent definition, when the actor is an agent

## Context And Memory

Context allowlists, context denylists, memory consumers, and memory writers should
reference declared actors.

Actor kind does not override source classification or memory sensitivity.

Examples:

- a human still needs explicit access to restricted organization context when
  the manifest describes that boundary
- an automation should not inherit the context of its operator
- a service should not retain integration data as memory by default
- an agent should not receive user or organization memory because it shares a
  role with an authorized human
- an authority should not be treated as a concrete memory consumer without a
  representing actor

## Delegation

Delegation should be explicit, scoped, and auditable.

Candidate delegation relationships include:

- human represents authority
- automation operates on behalf of authority
- service acts for a project integration
- agent performs a delegated task for a human owner
- human temporarily delegates approval within a narrow scope

Delegation must not:

- broaden permissions silently
- bypass approval gates
- transfer credentials through manifests
- remove the original actor from audit history
- create circular authority chains
- turn task assignment into approval authority

The complete delegation protocol is outside this RFC.

## Validation Expectations

If accepted, structural validation should check:

- `ActorSet` manifest shape
- required common actor fields
- supported actor kinds
- unique actor IDs
- kind-specific fields
- `agentRef` only where agent semantics apply
- `integrationRef` only where service semantics apply
- arrays and references use valid ID syntax

Semantic validation should check:

- actor references resolve to declared actors
- `agent` actors reference declared agent configuration
- automation and service operators resolve when required by policy
- authority representatives resolve to valid active actors
- authority and delegation graphs do not contain cycles
- task owners and assignees use actor kinds allowed by their field semantics
- handoff endpoints resolve
- permission and capability subjects resolve
- approval actors and authorities resolve
- event actor identities and kinds agree with declarations
- context and memory actor references resolve
- AI-backed behavior is not mislabeled as automation or service to avoid policy
- legacy human entries in `AgentSet` receive migration diagnostics

Validation is not authentication or runtime enforcement.

## Conformance Impact

An accepted actor model would affect several conformance surfaces.

| Claim | Expected impact |
| --- | --- |
| `NF-MANIFEST` | Adds or requires understanding of `ActorSet`. |
| `NF-SCHEMA` | Adds actor schema and kind-specific structural checks. |
| `NF-SEMANTIC` | Adds actor resolution, kind, delegation, and reference rules. |
| `NF-CLI` | Adds actor inventory, inspection, graph, and diagnostics. |
| `NF-RUNTIME` | Adds actor binding, authorization, attribution, and audit requirements. |

Tools should not claim actor-model support merely because they can parse an
`actors.yaml` file.

## Compatibility Impact

This RFC is planning-oriented and does not change current manifests by itself.

If accepted, introducing an optional `ActorSet` is additive. Making it the
authoritative source for all participant identities is potentially breaking.

Potentially breaking changes include:

- removing human entries from `AgentSet`
- requiring `actors.yaml`
- changing actor reference resolution from `AgentSet` to `ActorSet`
- requiring explicit actor kinds
- changing task owner semantics
- changing event actor kind values
- requiring agent actors to reference separate configuration
- rejecting previously accepted ambiguous actor references

Because NexFlow remains pre-`1.0`, these changes may be appropriate if they
materially improve clarity, safety, and interoperability. They still require
migration guidance, synchronized docs, schemas, examples, and changelog updates.

## Migration Strategy

If accepted, migration should be staged.

### Stage 1: Introduce Actor Vocabulary

- accept the actor kind definitions
- document that humans are not agents
- add draft `ActorSet` schema and manifest reference
- keep current examples valid during a short transition
- add diagnostics for ambiguous participant declarations

### Stage 2: Split Identity From Agent Configuration

- add `actors.yaml` to examples
- move humans, automations, services, and authorities out of `AgentSet`
- keep AI participants in agent-specific configuration
- add explicit actor-to-agent references
- update task, handoff, permission, context, memory, approval, and event references

### Stage 3: Make Actor Resolution Authoritative

- require participant references to resolve through `ActorSet`
- deprecate legacy non-agent entries in `AgentSet`
- report duplicate or conflicting identity declarations as errors
- document the supported migration window

### Stage 4: Remove Legacy Interpretation

- stop treating every `AgentSet` entry as a generic actor
- remove temporary compatibility behavior in a declared spec version
- retain migration documentation for older manifests

Migration tooling should preserve IDs whenever possible so task, handoff,
permission, memory, context, approval, and event references remain stable.

## Security And Safety Impact

The actor model improves safety by making identity and authority boundaries
visible.

Security requirements:

- actor kind must never grant implicit permission
- raw credentials must never appear in actor declarations
- human records should avoid unnecessary personal data
- service and automation ownership should be visible
- agent behavior should remain linked to effective configuration
- authority delegation should be explicit and cycle-free
- high-risk agent self-approval should remain prohibited by default
- automation should not inherit operator credentials or context implicitly
- services should not gain access merely because an integration exists
- event and approval records should preserve concrete actor attribution
- unsupported actor kinds or unresolved actors should fail closed where safety
  depends on identity

The model also reduces the risk that a human reviewer is accidentally treated as
an autonomous AI participant or that model-backed behavior is hidden behind a
generic automation identity.

## Privacy Impact

Actor manifests can contain identity information.

Projects should:

- use project-local IDs
- use role-based display names when personal names are unnecessary
- avoid personal email addresses, account IDs, or contact details by default
- keep sensitive identity mappings in runtime or organization systems
- avoid copying identity provider records into public manifests
- apply normal repository review before publishing actor declarations

The specification should not require public disclosure of legal names or private
organizational structure.

## Alternatives Considered

### Keep Humans In AgentSet

This preserves the current file shape but continues to imply that humans and AI
agents share one configuration model. It also forces irrelevant fields onto
humans and leaves automation, services, and authorities underspecified.

### Add A Type Field To Existing Agent Entries

`agents.yaml` could add `type: human | agent | automation | service | authority`.

This is smaller structurally, but it keeps `AgentSet` as a misleading name and
mixes common identity with AI-specific model, prompt, retrieval, provider, and
autonomy fields.

### Use Roles As Actor Identity

Roles could stand in for actors.

This loses concrete attribution. Several humans or agents may hold the same role,
and a role does not identify who performed or approved an action.

### Use Teams As Authority

Teams could be referenced directly as approval authorities.

This may be useful in some cases, but team membership alone does not define
quorum, delegation, separation of duty, or the concrete actor that decided.

### Treat Integrations As Actors

An integration could be the actor for every external-system action.

This confuses the connection with the software principal using it and can hide
whether a human, agent, automation, or service initiated the action.

### Let Every Runtime Define Actor Kinds

Runtime-specific kinds are flexible but weaken portability, semantic validation,
audit, policy evaluation, and cross-tool event interpretation.

### Model Authority Only As Permission

Permissions can say what is allowed, but they do not identify who owns a decision,
who may represent that authority, or who actually approved an action.

## Open Questions

- Should `ActorSet` become a required core manifest for `0.1`, or should it first
  be optional?
- Should actor identity and agent configuration share the same ID or use an
  explicit `agentRef`?
- Which fields belong on the common actor record versus participant-specific
  manifests?
- Should `authority` be a distinct actor kind or a separate governance resource?
- Should authorities support quorum and separation of duty in the first schema?
- Should automation and service actors require `operatedBy`?
- How should short-lived external contributors or anonymous webhook senders be
  represented?
- Should task ownership be split into accountability, assignment, and acceptance
  fields?
- How should event envelopes represent actor, initiator, delegate, and authority
  without duplicating identity data?
- How should actor references interact with future typed reference and namespace
  rules?
- Which compatibility stage should introduce a manifest `specVersion` change?
- Should validators warn when actor kind and declared capability combinations are
  unusual but not structurally invalid?
