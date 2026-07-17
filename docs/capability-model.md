# Capability Model

Capabilities describe what an actor or integration can technically do. Permission rules apply an `allow`, `deny`, or `approval_required` effect to capabilities.

Capabilities are intentionally separate from roles, skills, and permissions.

## Why Capabilities and Permissions Are Separate

NexFlow separates "can do" from "may do".

- A **skill** says an actor is suited for work.
- A **capability** says an actor or integration has a technical action available.
- A **permission** says whether using that capability is allowed, denied, or requires approval.
- An **approval gate** says who or what must approve a gated action before it proceeds.

This separation keeps manifests auditable. A reviewer can see that an agent may be technically connected to a repository, issue tracker, MCP server, or deployment system without assuming the agent is authorized to use every action exposed by that system.

## Rules

- A capability does not grant access by itself.
- A permission must reference capabilities to authorize or gate them.
- Risky capabilities should have approval gates.
- Integrations should declare which capabilities they expose.
- Future runtimes should audit high-risk capability use.
- When permission rules conflict, explicit deny rules should be treated as stronger than allow rules.
- Approval-required rules should be treated as pending authorization, not as successful authorization.

## Standard Draft Capabilities

| Capability | Description | Typical Risk |
| --- | --- | --- |
| `read_repository` | Read repository files, history, metadata, or pull request state. | Low |
| `write_repository` | Modify repository files in an approved scope. | High |
| `create_branch` | Create a source control branch. | Medium |
| `create_pull_request` | Open or update a pull request. | Medium |
| `execute_command` | Run local, CI, or sandboxed commands. | High |
| `read_documentation` | Read declared documentation sources. | Low |
| `modify_documentation` | Modify documentation, changelog, or specification files. | Medium |
| `read_context` | Read declared context sources. | Low to medium |
| `access_linear` | Access declared Linear workspace data or actions. | Medium |
| `access_jira` | Access declared Jira project data or actions. | Medium |
| `access_figma` | Access declared Figma files, components, or design metadata. | Medium |
| `access_mcp` | Access declared MCP servers for context, tools, or both. | High |
| `manage_tasks` | Create, update, or transition tasks in declared systems. | Medium |
| `approve_changes` | Approve gated changes, reviews, or workflow transitions. | High |
| `deploy_application` | Trigger or approve application deployment. | Critical |

## Capability Definition Example

```yaml
- id: execute_command
  description: Run approved local commands such as tests or linters.
  risk: high
  category: runtime
  requiresApprovalByDefault: true
  auditRecommended: true
```

## Permission Example

```yaml
- id: qa_test_execution
  description: QA agent may run approved test commands.
  subjects:
    - qa-agent
  capabilities:
    - read_repository
    - execute_command
  effect: approval_required
  approvalGate: code_review
```

## Permission Effects

NexFlow defines three draft permission effects:

| Effect | Meaning | Example Use |
| --- | --- | --- |
| `allow` | The subject may use the listed capabilities within the declared scope. | A maintainer may read repository files and approve changes. |
| `deny` | The subject may not use the listed capabilities, even if another broader rule might allow them. | A docs agent may not deploy an application. |
| `approval_required` | The subject may use the listed capabilities only after the referenced approval gate is satisfied. | An implementation agent may write repository files after review. |

## Practical Scenarios

### Capability Exists, Permission Missing

An integration may expose `execute_command`, but an agent that has no permission referencing `execute_command` should not be allowed to run commands.

```yaml
capabilities:
  - execute_command
permissions: []
```

The capability is visible. It is not authorized.

### Capability Allowed

Low-risk read access may be allowed directly.

```yaml
- id: repository_read
  subjects:
    - docs-agent
  capabilities:
    - read_repository
  effect: allow
```

### Capability Denied

High-risk actions can be denied explicitly for a subject.

```yaml
- id: docs_agent_no_deploy
  subjects:
    - docs-agent
  capabilities:
    - deploy_application
  effect: deny
```

### Capability Requires Approval

Writable or externally visible actions should usually be gated.

```yaml
- id: implementation_write_with_review
  subjects:
    - implementation-agent
  capabilities:
    - write_repository
    - create_pull_request
  effect: approval_required
  approvalGate: code_review
```

### Integration Capability Is Not Actor Permission

An extension or integration may declare that it can create pull requests:

```yaml
requiredCapabilities:
  - create_pull_request
```

That declaration means the integration needs the capability to operate. It does not mean every agent using that integration can create pull requests.

## Review Checklist

When reviewing capabilities and permissions, check:

- every risky capability has an explicit permission rule
- high-risk capabilities are denied or approval-gated by default
- no extension grants access by presence alone
- permissions reference existing capabilities
- agents do not list capabilities that their permissions never allow or gate
- deployment and destructive capabilities require human approval
- audit-recommended capabilities are represented in event expectations

## Future Work

The draft vocabulary will likely grow through RFCs. New capabilities should include risk level, category, default approval expectations, and audit guidance.
