# Example Matrix

This matrix compares the reference examples by learning order, complexity, context shape, autonomy posture, approval gates, integrations, and validation focus.

Use it to choose an example to read, adapt, or validate. The examples are specification material, not runtime fixtures, and no example grants access or executes work by itself.

## Learning Path

| Order | Example | Start Here When | Main Concepts To Learn |
| --- | --- | --- | --- |
| 1 | [Minimal Team](minimal-team/) | You want the smallest complete manifest set. | Project policy, one assistant, capabilities, permissions, context, memory, one simple workflow. |
| 2 | [Software Team](software-team/) | You want a conventional repository workflow. | Implementation, review, QA, docs handoff, dependency approval, GitHub and task context. |
| 3 | [Startup Team](startup-team/) | You want fast iteration with human launch control. | Product decisions, design review, release review, safe autonomy, product context. |
| 4 | [Product Delivery Team](product-delivery-team/) | You want cross-functional delivery. | Product acceptance, UX handoff, QA evidence, launch readiness, many-to-many handoffs. |
| 5 | [Open Source Maintainer](open-source-maintainer/) | You want public maintenance workflows. | Issue triage, maintainer decisions, PR review, docs review, release notes. |
| 6 | [Enterprise Team](enterprise-team/) | You want governed sensitive change control. | Architecture review, security review, compliance evidence, release approval, restricted memory. |
| 7 | [Research Lab](research-lab/) | You want evidence-heavy research workflows. | Literature review, citations, experiment evidence, reproducibility review, publication claim boundaries. |

## Comparison Matrix

| Example | Complexity | Context Sources | Autonomy Posture | Approval Gates | Integration Footprint | Best Validation Focus |
| --- | --- | --- | --- | --- | --- | --- |
| [Minimal Team](minimal-team/) | 1 - Small | Local files, docs | `manual_only`, `ask_before_changes` | Human documentation review | Local repository extension | Required fields, minimal references, basic workflow order |
| [Software Team](software-team/) | 2 - Standard | GitHub, Linear, docs, MCP | Mostly `ask_before_changes`, human review | Code review, dependency approval, docs review | GitHub and Linear extensions | Task ownership, capability use, dependency and review gates |
| [Startup Team](startup-team/) | 3 - Product-heavy | GitHub, Linear, Figma, research, docs | `autonomous_safe` for low-risk work, human release control | Product review, design review, release review | GitHub, Linear, Figma extensions | Product scope, launch gates, design and release handoffs |
| [Product Delivery Team](product-delivery-team/) | 3 - Cross-functional | GitHub, Jira, Figma, customer docs | Safe autonomy with staged review | Product acceptance, quality gate, launch gate | GitHub, Jira, Figma extensions | Many-to-many handoffs, QA evidence, launch readiness |
| [Open Source Maintainer](open-source-maintainer/) | 3 - Community-facing | GitHub issues, PRs, docs, release history | `suggest_only` and `ask_before_changes` under maintainer authority | Maintainer decision, docs review, PR review, release note approval | GitHub and docs extensions | Public contribution flow, maintainer authority, release notes |
| [Enterprise Team](enterprise-team/) | 4 - Governed | GitHub, Jira, Confluence, knowledge base, MCP | Strict, mostly human-owned approvals | Architecture review, security review, compliance review, release approval | GitHub, Jira, MCP extensions | Least privilege, restricted memory, compliance evidence, release controls |
| [Research Lab](research-lab/) | 4 - Evidence-heavy | Papers, citations, datasets, lab notes, experiment artifacts, web | `suggest_only` research support, approval-gated experiment work | Research scope review, experiment approval, reproducibility review, publication review | Web, GitHub, local files, docs extensions | Citation boundaries, artifact provenance, memory limits, claim approval |

## Selection Guide

| Question | Prefer |
| --- | --- |
| Do you need the smallest possible example? | `minimal-team` |
| Are you modeling normal software delivery? | `software-team` |
| Are product decisions and launch readiness the main risk? | `startup-team` or `product-delivery-team` |
| Are public issues, PRs, and release notes central? | `open-source-maintainer` |
| Are compliance, security, and release control central? | `enterprise-team` |
| Are citations, experiments, reproducibility, and publication claims central? | `research-lab` |
| Are you testing validators rather than learning a workflow? | Use several examples together and compare failures against the [Example Consistency Checklist](CHECKLIST.md). |

## Gate Pattern Matrix

| Gate Pattern | Examples | What It Teaches |
| --- | --- | --- |
| Single human review | `minimal-team` | The smallest useful approval model. |
| Code and dependency review | `software-team` | Repository work should separate technical capability from approval. |
| Product and release review | `startup-team`, `product-delivery-team` | Launch authority should remain explicit even when low-risk work is delegated. |
| Maintainer-owned review | `open-source-maintainer` | Public repository authority remains with maintainers, not helper agents. |
| Security and compliance review | `enterprise-team` | High-risk work needs separate approvers, evidence, and audit expectations. |
| Research and reproducibility review | `research-lab` | Evidence and citations do not become publication claims without human review. |

## Context And Memory Pattern Matrix

| Pattern | Examples | Notes |
| --- | --- | --- |
| Local or documentation context | `minimal-team` | Good first place to inspect context access and memory scope basics. |
| Repository plus task tracker context | `software-team`, `startup-team`, `product-delivery-team` | Shows how delivery context can be declared without implying hidden external access. |
| Public collaboration context | `open-source-maintainer` | Shows issue, PR, docs, and release history boundaries. |
| Restricted organizational context | `enterprise-team` | Shows confidential context, compliance evidence, restricted memory, and audit pressure. |
| Research evidence context | `research-lab` | Shows citations, datasets, lab notes, artifacts, sensitivity, and retention limits. |

## Practical Use

When adding or changing examples:

- update [README.md](README.md) if the example set or quick-selection guidance changes
- update this matrix if complexity, context, autonomy, gates, integrations, or learning order changes
- run the YAML parse check from the README
- use [CHECKLIST.md](CHECKLIST.md) before committing
