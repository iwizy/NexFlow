# Concepts

This page defines the core NexFlow domain model.

For a quick terminology reference, see [Glossary](glossary.md).

## Project

A repository, product, service, or workstream governed by NexFlow manifests.

## Profile

A named authoring and validation contract for a minimum declaration purpose.
Profiles qualify conformance claims; they do not execute work or grant
authority.

The implemented [Core Profile](core-profile.md) requires one Project and one
authoritative participant inventory. Optional module qualifiers become required
when claimed, and referenced modules become required through dependency closure.

## Module

A coherent optional area of the manifest vocabulary, such as policy, workflow,
context, memory, provider inventory, events, or extensions. An omitted module
contributes no declaration or authority.

## Logical Manifest Assembly

The normalized set of manifest documents associated with one Project for one
validation or inspection operation. Discovery records source locations for
diagnostics, but `specVersion`, `kind`, project identity, resource IDs, and
scope determine meaning.

The focused [Manifest Discovery](manifest-discovery.md) implementation accepts
explicit local files or Project source hints and retains multiple unique
Workflow documents. A logical assembly is derived validation input, not an
authored manifest or runtime execution plan.

## Team

A collection of humans, agents, and automation systems that collaborate on a project.

## Actor

A first-class participant identity with kind `human`, `agent`, `automation`,
`service`, or `authority`.

Use `Agent` only for AI participants. Actor identity does not grant capabilities, permissions, context access, memory access, autonomy, or approval authority.

The optional `ActorSet` manifest implements the first migration slice in the
`0.1` draft. See [Actor Model](actor-model.md) and
[Actor Model Migration](actor-model-migration.md).

## Agent

An AI participant with a stable identity, role, description, responsibilities,
and skills in `AgentSet`.

Agents are not assumed to be powered by any specific provider or runtime.

Projects without `ActorSet` may still carry legacy human participant entries in
`AgentSet`. This is a compatibility shape, not a redefinition of humans as
agents. Migrated projects keep only AI identities in `AgentSet` and link them
from agent actors explicitly.

Behavior-specific model, prompt, retrieval, permission, capability, context,
memory, autonomy, provider, and extension requests belong to versioned agent
definitions and their referenced resources. Legacy AgentSet fields for these
domains remain schema-valid but deprecated during migration. See
[Agent Identity Migration](agent-identity-migration.md).

## Agent Assembly

A read-only inspection projection of an Effective Agent Configuration. It shows
the selected identity and definition, requested components, applicable
constraints, provenance, unresolved facts, and blockers.

Agent assembly is not a separate manifest kind, another behavioral version, or
an authored source of authority. It cannot be re-ingested as a grant or
override, does not run agents, and does not grant access by itself.

## Agent Definition

A versioned behavioral release of an agent assembled from model profile, prompt set, retrieval profile, permission, capability, context source, memory scope, autonomy, and extension references.

The unique unscoped active definition for an agent is authoritative for
requested behavior. Agent definitions do not run agents and do not grant access
by themselves; domain policy can only authorize or narrow their requests. See
[Effective Agent Configuration](effective-agent-configuration.md).

## Role

A named function within a team, such as `maintainer`, `reviewer`, `implementation_agent`, `security_reviewer`, or `documentation_architect`.

Roles describe responsibility. They do not grant access by themselves.

## Skill

A declared area of competence such as `typescript_refactor`, `schema_design`, `security_review`, or `release_notes`.

Skills describe suitability for work. They do not grant access by themselves.

## Task

A unit of work with ownership, status, dependencies, acceptance criteria, artifacts, and optional approval gates.

## Workflow

A structured process that coordinates tasks, dependencies, events, approvals, and handoffs.

## Dependency

A relationship indicating that one task, workflow step, artifact, approval, or external condition depends on another.

## Handoff

A structured transfer of responsibility from one or more actors to one or more actors.

## Artifact

A produced or consumed work product such as a branch, patch, pull request, design, document, test report, build log, or deployment record.

Task artifact IDs are unique across the logical manifest assembly so handoffs
can reference them without inferring a task-local scope.

## Capability

A technical action an actor or integration can perform, such as `read_repository`, `execute_command`, or `create_pull_request`.

Capabilities do not authorize action by themselves.

## Permission

A policy rule with an `allow`, `deny`, or `approval_required` effect for capabilities in a specific actor, role, team, workflow, or context.

## Context Source

A declared source of information such as a repository, docs site, issue tracker, design file, MCP server, web source, or custom knowledge base.

Context sources describe information boundaries, freshness expectations, access modes, and sensitivity classification. They do not grant permission to modify systems or retain memory.

## Memory Scope

A boundary for retaining and reusing information. NexFlow defines `ephemeral`, `task`, `project`, `team`, `user`, and `organization` scopes.

Memory scopes describe retention, ownership, visibility, update rules, sensitivity, allowed consumers, and cross-scope reuse boundaries. Memory access is declared separately from context access.

## Provider

A model or service provider abstraction. Providers can describe model support
features, preferences, and constraints without granting project action
capabilities or becoming vendor requirements in the core specification.

Provider features and action capabilities are separate namespaces.

Provider constraints describe candidate eligibility facts and policy
boundaries. Model-profile constraints describe requirements for a behavioral
use. Neither layer grants access, and future selection must compose both with
project policy.

## Model Profile

A provider-neutral declaration of model selection expectations, constraints, fallback behavior, and audit requirements for a behaviorally meaningful use of a model.

Model profiles may describe pinned model references, floating aliases, or policy-based selection. They do not select providers by themselves and do not grant permissions, context access, tool access, or autonomy.

## Prompt Set

A provider-neutral declaration of versioned prompt material, prompt revisions, source references, ownership, safety review status, compatibility impact, and audit expectations.

Prompt sets may describe system, role, workflow, task, review, safety, tool, handoff, memory, or custom prompt material. They do not execute prompts and do not grant permissions, context access, tool access, memory access, or autonomy.

## Retrieval Profile

A provider-neutral declaration of retrieval expectations for selecting, indexing, assembling, citing, and auditing context from declared context sources.

Retrieval profiles may describe context source references, index or corpus versions, chunking policy, retriever strategy, freshness, citations, sensitivity, and review triggers. They do not retrieve data and do not grant permissions, context access, tool access, memory access, or autonomy.

## Runtime

A future implementation that validates, interprets, or executes NexFlow manifests.

## Project Policy

Rules that apply across a project, such as default autonomy, required reviews, secret handling, and network access boundaries.

The structured [Network Access Policy](network-access-policy.md) defines
fail-closed outbound connection rules separately from capabilities,
permissions, context access, provider selection, and credentials.

The structured [Human Override](human-override.md) policy defines
human-controlled pause, stop, cancellation, blocking, revocation, fail-closed
response, approval-gated resume, and audit requirements.

## Approval Gate

A condition requiring explicit authorization before an action can proceed.

## Human Override

A fail-closed project policy that allows explicitly declared human-controlled
actors to pause, stop, cancel, block, or revoke activity. Override can only
narrow behavior. Resume requires a declared approval gate and reason.

## Event

An auditable state transition emitted by a workflow, task, agent, integration, or runtime.

## Extension

A namespaced addition to the specification for integrations, custom fields, or implementation-specific metadata.

The experimental `io.nexflow.mcp` profile maps MCP context and action surfaces
to existing NexFlow policy domains without implementing or replacing the
external protocol.

The experimental `io.nexflow.a2a` profile treats Agent Cards, remote agents,
skills, messages, tasks, and artifacts as externally owned protocol surfaces.
They do not become NexFlow Actors, capabilities, Handoffs, TaskSet entries, or
task artifacts automatically. See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Integration

A connection to an external system or protocol such as GitHub, GitLab, Jira,
Linear, Figma, Slack, Discord, Telegram, MCP, A2A, notes, or a custom service.
