# Product Delivery Team Example

A cross-functional product delivery team with product, UX, implementation, QA, and launch coordination.

This example demonstrates many-to-many handoffs across discovery, design, build, validation, product acceptance, and launch planning.

## What This Example Teaches

Use this example when multiple delivery functions need to work from the same product goal without hiding ownership boundaries.

It demonstrates:

- product acceptance owned by a human product manager
- UX criteria that flow into both implementation and QA planning
- implementation evidence that is handed to QA, product, and launch coordination
- QA evidence that supports both product acceptance and launch readiness
- launch planning that depends on product acceptance, quality evidence, release notes, and rollback notes
- many-to-many handoffs where more than one sender or receiver shares responsibility

This is still specification-only. It does not read product tools, call Figma, run tests, open pull requests, deploy software, or publish release notes.

## Delivery Walkthrough

| Stage | Task | Owner | Evidence | Gate |
| --- | --- | --- | --- | --- |
| Discovery | `define-delivery-goal` | `product-manager` | `delivery_goal`, `acceptance_matrix`, `stakeholder_constraints` | `product_acceptance` |
| Design | `prepare-ux-criteria` | `ux-agent` | `ux_criteria`, `design_gap_log`, `product_ux_decisions` | `product_acceptance` |
| Build | `implement-delivery-slice` | `implementation-agent` | `delivery_branch`, `implementation_notes`, `change_summary` | `product_acceptance` |
| Validation | `validate-delivery` | `qa-agent` | `quality_report`, `validation_matrix`, `launch_risk_summary` | `quality_gate` |
| Acceptance | `accept-delivery` | `product-manager` | `product_acceptance_record`, `accepted_delivery_scope` | `product_acceptance` |
| Launch | `prepare-launch` | `launch-coordinator` | `launch_plan`, `release_notes`, `launch_decision`, `rollback_notes` | `launch_gate` |

The workflow models the shape of collaboration, not runtime state. Task statuses are initial planning states.

## Many-To-Many Handoff Pattern

| Handoff | Shape | Purpose |
| --- | --- | --- |
| `discovery-to-design-build` | one-to-many | Product moves accepted goals to UX, implementation, QA, and launch planning. |
| `design-to-build-validation` | many-to-many | Product and UX pass criteria, decisions, and open gaps to implementation and QA. |
| `build-to-quality-product` | one-to-many | Implementation passes branch and change evidence to QA, product, and launch coordination. |
| `quality-to-product-launch` | one-to-many | QA passes quality evidence and launch risks to product, launch, and implementation. |
| `product-to-launch` | many-to-one | Product and QA pass accepted scope and quality evidence to launch coordination. |

The handoff records are intentionally evidence-driven. A receiver should be able to see what is ready, what is still risky, and which approval gate still owns the decision.

## Product Acceptance Pattern

Product acceptance is separate from QA approval:

- `quality_gate` says whether validation evidence is sufficient
- `product_acceptance` says whether the delivered behavior satisfies the intended product outcome
- `launch_gate` says whether the release can proceed operationally

The `accept-delivery` task creates the `product_acceptance_record` and `accepted_delivery_scope` artifacts. Launch planning should not treat QA approval as product approval.

## Launch Readiness Pattern

Launch readiness combines several inputs:

- accepted scope and non-goals
- UX criteria and design decisions
- implementation notes and changed areas
- quality report, validation matrix, and launch risk summary
- release notes, launch decision, and rollback notes

The launch coordinator owns launch authority, but does not own product acceptance or quality approval. This keeps production-facing decisions visible without granting hidden deployment authority to earlier workflow stages.

## Safety Notes

- Repository writes and command execution remain approval-gated.
- Figma access is read-only in this example.
- Customer documentation must be sanitized and cited before use.
- Launch planning may prepare deployment evidence, but no deployment happens in this repository.
- Extensions describe integration surfaces; they do not grant access without matching capabilities and permissions.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/product-delivery-team/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
