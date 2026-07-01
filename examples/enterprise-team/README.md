# Enterprise Team Example

An enterprise configuration with architecture, implementation, security, compliance, audit, and release controls.

This example emphasizes least privilege, auditability, restricted memory, and approval gates for deployment and production actions.

## What This Example Teaches

Use this example when a change needs more than ordinary code review. It models a governed delivery path where architecture, implementation, security review, compliance signoff, and release approval are separate responsibilities.

The example demonstrates:

- human-owned approval gates for architecture, security, compliance, and release decisions
- explicit evidence artifacts for each stage of work
- restricted context sources for security knowledge, compliance evidence, audit records, and approved MCP tools
- task and workflow dependencies that make review order inspectable
- memory scopes that prevent durable or organization-wide memory writes without approval
- release readiness notes that include rollback planning and residual risk review

This is still a specification example. It does not run a change-control process, execute commands, open pull requests, read enterprise systems, deploy software, or enforce runtime policy.

## Governed Change Walkthrough

| Stage | Task | Owner | Required Evidence | Gate |
| --- | --- | --- | --- | --- |
| Assessment | `architecture-assessment` | `enterprise-architect` | `architecture_note`, `system_boundary_map`, `dependency_inventory` | `architecture_review` |
| Implementation | `implement-enterprise-change` | `implementation-agent` | `enterprise_branch`, `command_log`, `implementation_evidence` | `architecture_review` |
| Assurance | `security-review` | `security-reviewer` | `security_report`, `risk_acceptance_record` | `security_review` |
| Assurance | `compliance-signoff` | `compliance-reviewer` | `compliance_evidence_packet`, `audit_trail_summary` | `compliance_review` |
| Release | `release-approval` | `release-manager` | `enterprise_pr`, `release_approval_record`, `rollback_plan` | `release_approval` |

The task statuses are initial planning states. A future runtime or validator may interpret events and state transitions, but this repository only declares the intended workflow shape.

## Evidence And Audit Pattern

The example treats evidence as first-class workflow output:

- architecture assessment records affected boundaries, dependencies, and sensitive areas
- implementation records the branch, command log, changed areas, and validation evidence
- security review records risks, findings, mitigations, and residual risk acceptance
- compliance signoff records the evidence packet and audit trail summary
- release approval records the pull request, approval decision, rollback plan, and release constraints

Events in `events.yaml` describe the minimum payload fields that should be retained for audit. Sensitive evidence should be referenced by artifact ID or approved system reference, not copied into public manifests.

## Restricted Context And Memory Pattern

Enterprise context is separated by source and classification:

- `repository` and `issue_tracker` are confidential working sources
- `architecture_docs` provide approved design constraints
- `security_knowledge` is restricted and requires security review
- `compliance_evidence` and `audit_register` are restricted evidence sources
- `mcp_tools` exposes only approved build-log and dependency-inventory tools

Memory follows the same posture. Ephemeral and task memory can support active work, but project, team, and organization memory require review or approval. Restricted memory must not retain raw secrets, credential values, customer identifiers, production incident details, or provider-private outputs.

## Release Control Pattern

Release authority is intentionally narrow:

- the implementation agent can draft an approved branch, but cannot approve release readiness
- security and compliance reviewers provide assurance evidence, but do not deploy
- the release manager can create the pull request and approve deployment only after required evidence is present
- production-facing actions require `release_approval`
- destructive actions remain out of scope unless separately approved and audited

This keeps enterprise release decisions visible without implying that NexFlow includes a deployment engine.

## Handoff Pattern

| Handoff | Purpose |
| --- | --- |
| `architecture-to-implementation` | Moves approved architecture scope, dependency inventory, and boundaries into implementation. |
| `implementation-to-assurance` | Moves implementation evidence, command log, and branch context into security and compliance review. |
| `assurance-to-release` | Moves security, compliance, risk, and audit evidence into release approval. |

Each handoff should expose blockers and missing evidence. A handoff is not approval by itself; approval remains tied to the declared gates.

## Safety Notes

- Capabilities describe what an actor may technically do; permissions and approval gates decide whether the action is allowed.
- Restricted sources require explicit actors, classifications, freshness, and review expectations.
- MCP access is declared as a context source and remains approval-gated for tool use.
- Durable memory promotion is reviewed or approval-gated.
- Release and deployment actions require human authority.
- The example references enterprise systems with placeholder URIs and IDs only.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/enterprise-team/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
