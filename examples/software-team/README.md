# Software Team Example

A conventional software delivery team with implementation, QA, review, and documentation roles.

This example emphasizes task dependencies, pull request review, and capability separation.

## What This Example Teaches

Use this example when modeling a familiar repository-based delivery loop:

1. an implementation agent drafts a scoped branch
2. a QA agent validates the branch with approved commands
3. a human reviewer opens and reviews the pull request
4. a docs agent updates user-facing documentation after review

The example is still specification-only. It does not create branches, run tests, open pull requests, call providers, or orchestrate agents.

## Lifecycle Walkthrough

| Stage | Task | Primary Actor | Review Evidence | Next Handoff |
| --- | --- | --- | --- | --- |
| Implementation | `implement-feature` | `implementation-agent` | `feature_branch`, `implementation_summary` | `implementation-to-qa` |
| Validation | `test-feature` | `qa-agent` | `test_report`, `qa_risk_summary` | `qa-to-reviewer` |
| Review | `review-change` | `reviewer` | `pull_request`, `review_decision` | `reviewer-to-docs` |
| Documentation | `update-docs` | `docs-agent` | `docs_update` | Workflow completion |

The task statuses are initial planning states, not runtime state. A future runtime or validator may emit task events, but this repository only declares the expected workflow shape.

## Pull Request Review Pattern

The reviewer owns pull request creation and approval in this example because `create_pull_request` and `approve_changes` are governance-sensitive capabilities.

The `review-change` task expects the pull request to link:

- the feature branch
- implementation summary
- test report
- QA risk summary
- review decision

This keeps review evidence explicit without giving the implementation or QA agents authority to approve their own work.

## QA Handoff Pattern

The QA handoff is evidence-driven:

- `implementation-to-qa` passes the branch and implementation summary to QA
- QA records passed, failed, skipped, and not-run checks in `test_report`
- QA records risks, coverage gaps, and blockers in `qa_risk_summary`
- `qa-to-reviewer` moves implementation and test evidence to the human reviewer

Skipped checks should be visible. They should not be treated as successful validation.

## Safety Notes

- Repository writes, command execution, and documentation writes are approval-gated.
- Dependency installation is explicitly outside normal implementation permission and requires `dependency_approval`.
- The reviewer is the only actor that can approve changes.
- QA may run approved checks, but does not approve release readiness.
- Extensions declare integration surfaces but do not grant access without matching capabilities and permissions.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/software-team/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
