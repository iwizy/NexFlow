# Glossary

This glossary defines stable NexFlow vocabulary. It is a quick reference for contributors, reviewers, implementers, and future runtime authors.

For fuller domain explanations, see [Concepts](concepts.md).

## Terminology Rules

- Use the terms below consistently across docs, schemas, examples, and RFCs.
- Do not use runtime terms to imply implemented behavior.
- Distinguish specified, implemented, and planned behavior.
- Treat capabilities, permissions, context, memory, autonomy, and approval gates as separate concepts.
- Prefer explicit source, owner, scope, and authority language over vague agent behavior.

## A

### Access Mode

A declared way to use a context source, such as `none`, `read`, `query`, `write`, or `admin`.

Access mode does not grant authorization by itself. Permissions, capabilities, autonomy, and approval gates still apply.

### Actor

A human, agent, automation system, runtime, integration, or policy authority that participates in project work.

### Agent

An AI participant with a declared identity, role, responsibilities, skills, context access, memory access, capabilities, permissions, autonomy level, provider preferences, and extensions.

An agent is not assumed to be powered by any specific model provider or runtime.

### Agent Assembly

A reviewable behavioral release of an agent that links an agent identity to agent definition, model profile, prompt set, retrieval profile, permission, capability, context source, memory scope, autonomy, and extension references.

Agent assembly is declarative metadata. It does not run agents or grant access.

### Agent Definition

A versioned behavioral release of an agent assembled from model profile, prompt set, retrieval profile, permission, capability, context source, memory scope, autonomy, and extension references.

Agent definitions make behavioral changes auditable. They do not execute agents or grant access.

### Approval Gate

A declared condition that must be satisfied before a gated action, task transition, workflow step, memory write, or sensitive operation may proceed.

Approval gates should identify approvers, evidence, decision state, scope, and audit expectations.

### Artifact

A produced or consumed work product, such as a branch, patch, pull request, design, document, test report, build log, deployment record, or decision note.

### Autonomy Level

A declared level of allowed agent independence. NexFlow defines `manual_only`, `suggest_only`, `ask_before_changes`, `autonomous_safe`, and `autonomous_extended`.

Autonomy level is not permission. A highly autonomous actor still needs declared capabilities, permissions, context, memory, and gates.

## C

### Capability

A technical action an actor or integration can perform, such as `read_repository`, `execute_command`, or `create_pull_request`.

Capability means "can technically do." It does not mean "may do."

### Classification

A sensitivity label for context or memory. NexFlow uses `public`, `internal`, `confidential`, and `restricted`.

When content mixes classifications, use the stricter classification or split it into separate sources or scopes.

### Conformance

A claim about how much of NexFlow a manifest set, validator, CLI, runtime, or extension supports.

Conformance claims should be specific. A schema validator, semantic validator, CLI, runtime, and extension do not all support the same surface area.

### Context

Information available to an actor from declared sources.

Context is not memory, permission, credential access, or tool execution.

### Context Source

A declared source of information, such as a repository, documentation system, issue tracker, design file, web source, MCP server, knowledge base, or custom system.

Context sources describe access mode, classification, freshness, ownership, and safety boundaries.

### Credential

A secret, token, key, certificate, password, or other sensitive material used to access systems.

NexFlow manifests should not contain raw credentials.

## D

### Dependency

A relationship indicating that one task, workflow step, artifact, approval, or external condition depends on another.

### Draft Specification

The current state of NexFlow before a stable release. Draft behavior may change, but changes should remain documented and reviewable.

## E

### Event

An auditable state transition emitted by a workflow, task, agent, integration, runtime, approval, or memory operation.

Events should preserve enough metadata to explain what happened and why.

### Extension

A namespaced addition to NexFlow for integrations, custom fields, implementation-specific metadata, or ecosystem behavior.

Extensions must not silently grant access or bypass permissions.

## H

### Handoff

A structured transfer of responsibility from one or more actors to one or more actors.

Handoffs should include reason, status, artifacts, notes, blocking issues, acceptance criteria, and next action.

### Human Authority

The principle that humans remain the final authority for risky, destructive, production, credential, deployment, or sensitive actions.

## I

### Identifier

A stable, case-sensitive machine-readable name for a declared NexFlow resource. IDs use lowercase letters and digits with non-empty hyphen- or underscore-separated segments.

An ID is not a display name, URI, file path, event type, or version string.

### Identifier Reference

An exact ID value used to point from one manifest field to a declared resource. The containing field determines the target resource kind.

Identifier references do not grant capabilities, permissions, context access, memory access, autonomy, or approval.

### Integration

A connection to an external system such as GitHub, GitLab, Jira, Linear, Figma, Slack, Discord, Telegram, MCP, notes, or a custom service.

An integration can expose capabilities or context, but it should not authorize actors by presence alone.

## M

### Manifest

A YAML document that declares one part of a NexFlow project, such as `project.yaml`, `agents.yaml`, `workflow.yaml`, `tasks.yaml`, `permissions.yaml`, `context.yaml`, or `memory.yaml`.

### Manifest Set

A coherent group of NexFlow manifests that together describe a project or team.

### Memory

Information retained for reuse after it has been observed, summarized, corrected, or produced.

Memory is higher risk than context because it can persist beyond the original task or interaction.

### Memory Scope

A declared boundary for retention and reuse. NexFlow defines `ephemeral`, `task`, `project`, `team`, `user`, and `organization`.

Memory scopes describe retention, ownership, visibility, update rules, sensitivity, allowed consumers, and cross-scope reuse boundaries.

### Model Profile

A provider-neutral declaration of model selection expectations for a behaviorally meaningful use of a model.

Model profiles can describe pinned model references, floating aliases, policy-based selection, fallback behavior, constraints, and audit expectations. They do not call providers or grant access.

## P

### Permission

A policy decision that allows, denies, or gates a capability for an actor, role, team, workflow, project, context, or other scope.

Permission means "may do."

### Project

A repository, product, service, workstream, or software effort governed by NexFlow manifests.

### Project Policy

Rules that apply across a project, such as default autonomy, required reviews, secret handling, network access, destructive actions, and production boundaries.

### Prompt Set

A provider-neutral declaration of versioned prompt material and prompt revisions for agents, agent definitions, workflows, tasks, reviews, safety checks, handoffs, tools, or memory behavior.

Prompt sets can describe prompt source references, content digests, ownership, safety review status, compatibility impact, and audit expectations. They do not execute prompts or grant access.

### Provider

A model or service provider abstraction. Providers can describe preferences and constraints without becoming part of the core specification.

NexFlow is provider neutral.

## R

### Retrieval Profile

A provider-neutral declaration of retrieval expectations for a behaviorally meaningful use of context.

Retrieval profiles can describe context source references, index or corpus versions, chunking policy, retriever strategy, freshness, citations, sensitivity, review triggers, compatibility impact, and audit expectations. They do not retrieve data or grant access.

### Role

A named function within a team, such as `maintainer`, `reviewer`, `implementation_agent`, `security_reviewer`, or `documentation_architect`.

Roles describe responsibility. They do not grant access by themselves.

### Runtime

A future implementation that validates, interprets, or executes NexFlow manifests.

This repository does not currently implement a runtime engine.

### Runtime Neutral

The principle that the specification should not depend on TypeScript, Python, Rust, Go, or any other implementation language.

## S

### Semantic Validation

Validation of cross-manifest meaning, such as whether referenced actors exist, task owners have permissions, approval gates cover risky actions, or memory promotion rules preserve sensitivity.

Semantic validation is future work.

### Skill

A declared area of competence, such as `typescript_refactor`, `schema_design`, `security_review`, or `release_notes`.

Skills describe suitability for work. They do not grant access by themselves.

### Specification-First

The project rule that behavior must be described before it is implemented.

NexFlow currently provides docs, schemas, examples, and RFC process. Runtime behavior is planned, not implemented.

### Spec Version

The version of the NexFlow specification used by a manifest. Current examples use `specVersion: "0.1"`.

## T

### Task

A unit of work with ownership, status, dependencies, required capabilities, acceptance criteria, artifacts, and optional approval gates.

### Team

A collection of humans, agents, and automation systems that collaborate on a project.

## V

### Validation

The process of checking manifest structure or meaning.

JSON Schema validation can check structure. Semantic validation can check project meaning. Validation is not runtime enforcement.

## W

### Workflow

A structured process that coordinates tasks, dependencies, events, approvals, and handoffs.

### Workflow Step

An individual step inside a workflow stage. A step may depend on tasks, emit events, require capabilities, and reference approval gates.
