# AGENTS.md

This file defines working rules for human and AI contributors to the NexFlow repository.

## Repository Purpose

NexFlow is a specification-first open-source project for describing, validating, and eventually orchestrating AI developer teams.

The repository provides:

- specification documentation
- YAML manifest semantics
- practical JSON Schemas
- reference examples
- governance and RFC process

The repository does not currently provide:

- a production runtime
- provider integrations
- a real orchestration engine
- a hosted service
- an agent implementation

Agents must never introduce behavior that is not represented in the specification.

## Repository Structure

- `README.md`: project overview for new visitors.
- `docs/`: canonical specification documentation.
- `schemas/`: JSON Schemas for core manifests.
- `examples/`: complete example configurations.
- `rfcs/`: design proposals and accepted decisions.
- `.github/`: issue and pull request templates.
- `AGENTS.md`: repository contribution rules for humans and agents.

If implementation packages are added later, they should live under `packages/` and must remain subordinate to the specification.

## Specification-First Rule

All behavior must be specified before it is implemented.

Before adding runtime behavior, provider logic, command execution, workflow execution, memory persistence, or integration behavior:

1. Update the relevant docs.
2. Update schemas if manifests change.
3. Update examples.
4. Add or update an RFC for meaningful design changes.
5. Document compatibility and migration impact.

## Coding Standards

There is currently no runtime code. If tooling is introduced:

- keep it minimal and validation-focused
- prefer boring, readable code
- avoid provider-specific assumptions
- avoid hidden network behavior
- avoid background execution
- include tests for manifest compatibility
- do not build orchestration features ahead of the spec

## Documentation Standards

Documentation is the primary product.

Docs should:

- distinguish specified, implemented, and planned behavior
- avoid marketing claims that imply runtime capabilities
- use stable terminology from `docs/concepts.md`
- include examples for new manifest fields
- describe safety and approval implications
- explain compatibility impact for changes

Use `specVersion: "0.1"` in examples until a new version is accepted.

## Schema Update Rules

When changing a manifest:

1. Update `docs/manifest-reference.md`.
2. Update the matching schema in `schemas/`.
3. Update at least one example under `examples/`.
4. Note breaking changes in `docs/compatibility.md`.
5. Add a changelog entry.

Schemas are practical validation aids. They should be useful without pretending to encode every semantic rule.

## Example Update Rules

Examples must remain coherent as complete team configurations.

When adding or changing an example:

- include agents, tasks, handoffs, dependencies, context, memory, permissions, capabilities, and events where relevant
- keep IDs consistent across files
- avoid fake provider lock-in
- avoid unsafe defaults
- show approval gates for dangerous actions
- keep examples small enough to read in a pull request

## RFC Process

Use RFCs for:

- new core concepts
- manifest structure changes
- breaking schema changes
- versioning policy changes
- security model changes
- runtime architecture decisions
- extension lifecycle changes

RFCs live in `rfcs/` and follow the process in `rfcs/README.md`.

## Safety Rules

NexFlow must preserve human authority.

Agents and automation must treat the following as sensitive:

- file writes
- command execution
- dependency installation
- credential access
- network access
- git commits
- pull request creation
- deployments
- production actions
- destructive operations

Dangerous actions must be represented as explicit capabilities, permissions, and approval gates.

## Synchronization Requirements

The following must stay synchronized:

- docs and schemas
- schemas and examples
- examples and RFC decisions
- README status and actual repository contents
- changelog and meaningful user-visible changes

If a contributor cannot update all affected areas in one change, they should open an issue or RFC explaining the gap.

## Contribution Expectations

Contributors should:

- keep changes scoped
- prefer clarity over cleverness
- preserve provider neutrality
- preserve runtime neutrality
- document assumptions
- avoid monolithic product assumptions
- design for hobby projects, open-source communities, startups, enterprises, and researchers

## Prohibited Changes Without RFC

Do not add any of the following without an accepted RFC:

- provider-specific runtime behavior
- long-term memory storage behavior
- credential handling implementation
- autonomous command execution
- deployment execution
- hosted cloud assumptions
- normative telemetry requirements
- incompatible manifest changes

## Review Checklist

Before merging a change, reviewers should ask:

- Is the behavior represented in the spec?
- Are permissions and approval gates explicit?
- Are context and memory boundaries clear?
- Are docs, schemas, and examples synchronized?
- Does the change preserve provider and runtime neutrality?
- Are breaking changes documented?
- Does the README still describe reality?

## Master Vault Inbox Handoff Rules

This repository participates in the shared Obsidian master vault memory workflow.

Future agents in fresh chats will not remember prior chat context, so every meaningful task must leave a durable handoff in the master vault Inbox.

Master vault Inbox path:

`/Users/iwizard/Library/Mobile Documents/iCloud~md~obsidian/Documents/Inbox`

After each user-requested task, or before ending a substantial work chunk, create or update a task folder under Inbox using this pattern:

`YYYY-MM-DD__<repo-name>__<short-task-slug>/`

Do not write into `Inbox/Done`.

Minimum handoff files:

- `00-index.md` — short task title, repo, branch, date, agent/chat identity if known, and status.
- `01-work-summary.md` — what changed, why, and user-visible behavior.
- `02-decisions.md` — decisions made, tradeoffs, assumptions, rejected options.
- `03-changed-files.md` — changed files and purpose of each change.
- `04-checks.md` — tests/checks run and results; if not run, explain why.
- `05-risks-open-questions.md` — risks, open questions, follow-ups.

Rules:

- Be factual and source-grounded.
- Do not invent project state, decisions, test results, or user intent.
- Include exact repo path, current branch, commit hash after commit, and whether push succeeded.
- Record cross-repo impacts, API/contract changes, schema changes, migrations, release/deploy notes, and documentation gaps when relevant.
- Do not store secrets, tokens, passwords, private keys, raw personal data, or sensitive medical/financial/legal details.
- Do not process, reorganize, or summarize other Inbox folders unless the user explicitly asks.
- Do not modify master-vault documents outside Inbox from this repo unless the user explicitly asks.
- Before the final response, ensure the Inbox handoff reflects the final state of the task.
