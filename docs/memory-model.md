# Memory Model

Memory describes retained information and reuse boundaries.

## Scopes

### `ephemeral`

Short-lived memory for a single interaction.

- Retention: minutes or session duration.
- Ownership: runtime or actor.
- Visibility: current actor.
- Update rules: automatic, discarded after use.
- Sensitivity: may include transient task context.
- Allowed consumers: current task only.

### `task`

Memory retained for a task.

- Retention: until task completion or project policy limit.
- Ownership: project.
- Visibility: task participants.
- Update rules: task events and notes.
- Sensitivity: depends on task.
- Allowed consumers: task participants and reviewers.

### `project`

Memory retained for a project.

- Retention: project-defined.
- Ownership: project maintainers.
- Visibility: project actors with permission.
- Update rules: reviewable updates.
- Sensitivity: internal by default.
- Allowed consumers: declared project actors.

### `team`

Memory shared by a team across projects or workstreams.

- Retention: team-defined.
- Ownership: team maintainers.
- Visibility: team members and authorized agents.
- Update rules: governed by team policy.
- Sensitivity: internal or confidential.
- Allowed consumers: declared team actors.

### `user`

Memory associated with an individual human.

- Retention: user-controlled.
- Ownership: user.
- Visibility: user-approved actors only.
- Update rules: explicit or user-policy controlled.
- Sensitivity: potentially sensitive.
- Allowed consumers: actors approved by the user.

### `organization`

Memory retained across an organization.

- Retention: organization policy.
- Ownership: organization.
- Visibility: explicitly authorized actors.
- Update rules: governed and auditable.
- Sensitivity: confidential by default.
- Allowed consumers: authorized teams, agents, and systems.

## Memory Rules

Memory access MUST be declared separately from context access.

Writing memory SHOULD require stricter review than reading task-local context.

Sensitive memory MUST NOT be silently used across scopes.

Future runtimes SHOULD emit events for meaningful memory writes.
