# Capability Model

Capabilities describe what an actor or integration can technically do. Permissions decide whether that capability is allowed, denied, or approval-gated.

Capabilities are intentionally separate from roles, skills, and permissions.

## Rules

- A capability does not grant access by itself.
- A permission must reference capabilities to authorize or gate them.
- Risky capabilities should have approval gates.
- Integrations should declare which capabilities they expose.
- Future runtimes should audit high-risk capability use.

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

## Future Work

The draft vocabulary will likely grow through RFCs. New capabilities should include risk level, category, default approval expectations, and audit guidance.
