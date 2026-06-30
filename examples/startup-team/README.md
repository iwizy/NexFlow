# Startup Team Example

A fast-moving startup configuration for product discovery, design, implementation, and release readiness.

This example shows broader context access while keeping approvals explicit for writes, PRs, and launch decisions.

## What This Example Teaches

Use this example when product discovery, design interpretation, implementation, and launch readiness all happen close together.

It demonstrates:

- product owner approval for scope, research interpretation, and launch scope
- release reviewer approval for production-facing launch actions
- sanitized customer research and cited web research as explicit context sources
- design handoff before implementation
- build evidence before release review
- release readiness evidence before deployment or production action

This is still a specification example. It does not call live product tools, fetch web pages, deploy software, or run a real release process.

## Delivery Walkthrough

| Stage | Task | Owner | Evidence | Gate |
| --- | --- | --- | --- | --- |
| Discovery | `shape-scope` | `product-owner` | `scope_note`, `product_decision` | `product_review` |
| Design | `review-design` | `design-agent` | `design_review`, `research_brief` | `product_review` |
| Build | `build-slice` | `fullstack-agent` | `product_branch`, `build_summary` | `product_review` |
| Release | `release-check` | `release-reviewer` | `release_note`, `release_readiness_report`, `launch_decision` | `product_review`, `release_review` |

The workflow models a startup-friendly delivery path, but the gates make the risky decisions explicit.

## Research Context Pattern

The example separates three kinds of product evidence:

- `product_backlog` for planned work and acceptance criteria
- `customer_research` for sanitized customer evidence
- `web_research` for approved market or standards research

Research should be cited when it influences product scope or launch readiness. Stale or uncited research should be treated as an assumption until the product owner accepts it.

The `research_brief` artifact is the bridge from design review into implementation. It should summarize evidence without raw customer identifiers.

## Release Readiness Pattern

Release readiness requires both product and release approval:

- `product_review` confirms the launch scope and user-facing behavior
- `release_review` confirms production-facing safety

The `release_readiness_report` should include validation evidence, known risks, product approval status, and rollback notes. The `launch_decision` records whether launch is approved, blocked, or deferred.

## Handoff Pattern

| Handoff | Purpose |
| --- | --- |
| `product-to-design-and-build` | Moves accepted scope and product decision into design and implementation planning. |
| `design-to-build` | Moves design review and research assumptions into implementation planning. |
| `build-to-release` | Moves branch, build summary, product decision, design evidence, and research brief into release review. |

Each handoff should make unresolved assumptions visible rather than treating them as implicit approval.

## Safety Notes

- Product scope changes require `product_review`.
- Production-facing launch actions require `release_review`.
- Customer research must remain sanitized.
- Web research must remain within declared sources and citation expectations.
- Fullstack implementation remains scoped to accepted product and design evidence.
- Extensions describe integration surfaces; they do not grant access without matching capabilities and permissions.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/startup-team/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
