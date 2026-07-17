# Concepts

This page defines the core NexFlow domain model.

For a quick terminology reference, see [Glossary](glossary.md).

## Project

A repository, product, service, or workstream governed by NexFlow manifests.

## Team

A collection of humans, agents, and automation systems that collaborate on a project.

## Actor

A general participant identity for a human, agent, automation system, runtime, integration, or policy authority involved in project work.

Use `Agent` only for AI participants. Actor identity does not grant capabilities, permissions, context access, memory access, autonomy, or approval authority.

## Agent

An AI participant with a declared identity, role, responsibilities, skills, context access, memory access, capabilities, permissions, autonomy level, provider preferences, and extensions.

Agents are not assumed to be powered by any specific provider or runtime.

The current `0.1` draft `AgentSet` also carries legacy human participant entries. This is a transitional manifest shape, not a redefinition of humans as agents. See [RFC-0013](../rfcs/RFC-0013-actor-model.md) for the proposed actor model and migration.

## Agent Assembly

A cross-manifest relationship and review checkpoint that links an agent identity to an agent definition and its model profile, prompt set, retrieval profile, permission, capability, context source, memory scope, autonomy, and extension references.

Agent assembly is not a separate manifest kind or another behavioral version. It is declarative specification metadata, does not run agents, and does not grant access by itself.

## Agent Definition

A versioned behavioral release of an agent assembled from model profile, prompt set, retrieval profile, permission, capability, context source, memory scope, autonomy, and extension references.

Agent definitions describe behaviorally meaningful releases. They do not run agents and do not grant access by themselves.

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

A model or service provider abstraction. Providers can describe capabilities and preferences without becoming part of the core specification.

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

## Approval Gate

A condition requiring explicit authorization before an action can proceed.

## Event

An auditable state transition emitted by a workflow, task, agent, integration, or runtime.

## Extension

A namespaced addition to the specification for integrations, custom fields, or implementation-specific metadata.

## Integration

A connection to an external system such as GitHub, GitLab, Jira, Linear, Figma, Slack, Discord, Telegram, MCP, notes, or a custom service.
