# Concepts

This page defines the core NexFlow domain model.

## Project

A repository, product, service, or workstream governed by NexFlow manifests.

## Team

A collection of humans, agents, and automation systems that collaborate on a project.

## Agent

An AI participant with a declared identity, role, responsibilities, skills, context access, memory access, capabilities, permissions, autonomy level, provider preferences, and extensions.

Agents are not assumed to be powered by any specific provider or runtime.

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

A policy decision that allows, denies, or gates a capability for a specific actor, role, team, workflow, or context.

## Context Source

A declared source of information such as a repository, docs site, issue tracker, design file, MCP server, web source, or custom knowledge base.

Context sources describe information boundaries, freshness expectations, access modes, and sensitivity classification. They do not grant permission to modify systems or retain memory.

## Memory Scope

A boundary for retaining and reusing information. NexFlow defines `ephemeral`, `task`, `project`, `team`, `user`, and `organization` scopes.

Memory scopes describe retention, ownership, visibility, update rules, sensitivity, allowed consumers, and cross-scope reuse boundaries. Memory access is declared separately from context access.

## Provider

A model or service provider abstraction. Providers can describe capabilities and preferences without becoming part of the core specification.

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

A connection to an external system such as GitHub, GitLab, Jira, Linear, Figma, Slack, Discord, Telegram, Obsidian, MCP, or a custom service.
