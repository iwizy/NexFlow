# Autonomy Model

Autonomy describes how independently an agent or automation may act.

## Levels

### `manual_only`

The actor may not act without direct human instruction.

### `suggest_only`

The actor may analyze and propose changes, but cannot modify state.

### `ask_before_changes`

The actor may inspect and plan, but must ask before modifying files, tasks, branches, pull requests, dependencies, or external systems.

### `autonomous_safe`

The actor may perform low-risk actions within declared permissions, such as reading context, drafting docs, or updating non-sensitive examples.

### `autonomous_extended`

The actor may perform broader actions within explicit permissions and approval gates. This level is not a bypass for dangerous actions.

## Approval Requirements

Projects SHOULD define approval requirements for:

- file writes
- git commits
- pull request creation
- dependency installation
- network access
- deployment
- production actions
- destructive actions
- credential access
- memory writes beyond task scope

## Default Approval Matrix

| Action | Recommended Gate |
| --- | --- |
| Read repository | None or project policy |
| Modify documentation | Review gate |
| Write source code | Review gate |
| Execute command | Explicit approval or sandbox policy |
| Install dependency | Maintainer approval |
| Create branch | Project policy |
| Create pull request | Review policy |
| Deploy application | Deployment approval |
| Production action | Human approval |
| Destructive action | Human approval plus audit event |

## Human Override

Humans must remain able to pause, revoke, or override agent activity in future runtimes.

## Runtime Responsibility

A future runtime MUST enforce autonomy limits. Documentation alone is not sufficient enforcement.
