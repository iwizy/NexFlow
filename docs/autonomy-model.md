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

See [Approval Gates](approval-gates.md) for the draft semantics of approval actors, decisions, evidence, scope, expiry, and revocation.

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

Human override is stricter than every requested autonomy level.

An explicitly declared human-controlled authority may pause, stop, cancel,
block, or revoke activity under the project
[Human Override](human-override.md) policy. A conforming future runtime must
prevent new target actions after accepting an override, follow the declared
in-flight action policy, and remain blocked on failure.

Resume requires the policy's approval gate and a recorded reason. It does not
raise autonomy or restore an expired, revoked, denied, or otherwise unavailable
authorization.

## Runtime Responsibility

A future runtime MUST enforce autonomy limits. Documentation alone is not sufficient enforcement.
