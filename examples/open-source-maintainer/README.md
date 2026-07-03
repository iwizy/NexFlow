# Open Source Maintainer Example

An open-source project workflow for issue triage, maintainer scope decisions, documentation updates, pull request review, and release notes.

This example emphasizes transparent maintainer authority, community-visible evidence, careful repository permissions, and reviewable handoffs between helper agents and a human maintainer.

## What This Example Teaches

Use this example when modeling a public repository where maintainers may delegate research, triage, documentation drafting, and review preparation to AI agents while keeping merge and release authority human-owned.

It demonstrates:

- a human maintainer as final authority for scope, labels, pull request review, and release notes
- issue triage that separates facts, reproduction notes, labels, and unanswered questions
- documentation updates that are linked to accepted issue scope
- pull request review evidence that does not approve its own changes
- release notes that cite accepted PR and issue artifacts
- public context and memory boundaries for open-source collaboration

This is still specification-only. It does not call GitHub, label issues, create branches, run tests, merge pull requests, publish releases, or moderate a community.

## Maintainer Workflow

| Stage | Task | Owner | Evidence | Gate |
| --- | --- | --- | --- | --- |
| Triage | `triage-issue` | `issue-triage-agent` | `issue_triage_report`, `suggested_labels`, `reproduction_notes` | `maintainer_triage` |
| Scope | `accept-maintainer-scope` | `maintainer` | `maintainer_decision`, `accepted_scope` | `maintainer_triage` |
| Documentation | `update-docs` | `docs-agent` | `docs_branch`, `docs_change_summary` | `docs_review` |
| Pull Request Review | `review-pull-request` | `pr-review-agent` | `review_report`, `review_risk_summary` | `pr_review` |
| Release Notes | `prepare-release-notes` | `release-notes-agent` | `release_notes_draft`, `release_summary` | `release_note_approval` |

The task statuses are initial planning states. A future runtime or validator may emit events, but this repository only declares the workflow shape.

## Public Evidence Pattern

Open-source work often happens in public. The example therefore distinguishes public evidence from maintainer decisions:

- `issue_triage_report` records what is known, unknown, and reproducible
- `maintainer_decision` records accepted scope and rejected scope
- `docs_change_summary` records user-visible documentation changes
- `review_report` records review findings, test evidence, and follow-ups
- `release_notes_draft` records public release communication before human approval

Agents may prepare evidence, but the maintainer remains the approval authority.

## Handoff Pattern

| Handoff | Purpose |
| --- | --- |
| `triage-to-maintainer` | Moves issue facts, labels, and reproduction notes to maintainer scope review. |
| `maintainer-to-docs` | Moves accepted scope and documentation impact into docs drafting. |
| `docs-to-pr-review` | Moves docs branch and change summary into review. |
| `review-to-release-notes` | Moves accepted review evidence into release note drafting. |

Each handoff should make unresolved questions visible. A handoff does not imply that an issue is accepted, a PR is approved, or a release is ready.

## Safety Notes

- Issue labels and task management are maintainer-gated.
- Repository writes and pull request creation are approval-gated.
- PR review agents may prepare review evidence, but cannot merge or approve their own output.
- Release notes remain draft until the human maintainer approves them.
- Public memory should not retain private maintainer notes, raw personal data, credentials, or security-sensitive exploit details.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/open-source-maintainer/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
