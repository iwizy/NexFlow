# NexFlow Examples

This directory contains complete reference manifest sets for different team shapes.

The examples are not runtime fixtures. They are readable specification examples that show how agents, permissions, capabilities, context, memory, tasks, workflows, handoffs, events, providers, model profiles, and extensions fit together.

## Example Matrix

| Example | Best For | Team Shape | Autonomy Posture | Main Context Sources | Approval Emphasis |
| --- | --- | --- | --- | --- | --- |
| [Minimal Team](minimal-team/) | Learning the smallest useful NexFlow setup | One human maintainer and one docs agent | Conservative | Local files and docs | Human review for documentation changes |
| [Software Team](software-team/) | Conventional feature delivery | Implementation, QA, reviewer, docs | Review-gated | GitHub, Linear, docs, MCP | Code review and dependency approval |
| [Startup Team](startup-team/) | Fast product iteration | Product, design, fullstack, release | Safe autonomy with human launch control | GitHub, Linear, Figma, research, docs | Product and release review |
| [Enterprise Team](enterprise-team/) | Governed sensitive change control | Architecture, implementation, security, compliance, release | Strict and audit-heavy | GitHub, Jira, Confluence, knowledge base, MCP | Architecture, security, compliance, and release gates |
| [Product Delivery Team](product-delivery-team/) | Cross-functional delivery | Product, UX, implementation, QA, launch | Safe autonomy with staged gates | GitHub, Jira, Figma, customer docs | Product acceptance, quality gate, launch gate |

## Common File Set

Each example contains the same core manifest files:

| File | Purpose |
| --- | --- |
| `project.yaml` | Project identity, maintainers, policies, approval gates, and manifest locations. |
| `agents.yaml` | Agents, human actors, roles, responsibilities, skills, capabilities, permissions, context access, memory access, autonomy, providers, and extensions. |
| `workflow.yaml` | Workflow stages, steps, dependencies, approval gates, and emitted events. |
| `tasks.yaml` | Tasks, owners, participants, dependencies, artifacts, required capabilities, approval gates, and acceptance criteria. |
| `handoffs.yaml` | Transfers of responsibility between actors, including artifacts and next actions. |
| `permissions.yaml` | Allow, deny, and approval-required policies for capabilities. |
| `capabilities.yaml` | Capability definitions, risk levels, categories, default approval expectations, and audit guidance. |
| `context.yaml` | Context sources, source types, access modes, classifications, and refresh policies. |
| `memory.yaml` | Memory scopes, retention, ownership, visibility, update rules, sensitivity, and allowed consumers. |
| `providers.yaml` | Provider-neutral model classes and selection constraints. |
| `model-profiles.yaml` | Provider-neutral model selection profiles, pinned or floating references, constraints, fallback, review triggers, and audit expectations. |
| `events.yaml` | Event names, payload expectations, retention, and audit requirements. |
| `extensions.yaml` | Integration namespaces, lifecycle state, applicable manifests, and required capabilities. |

## How to Read an Example

Start with `project.yaml` to understand the project policy and approval gates. Then read `agents.yaml` and `capabilities.yaml` together: capabilities describe what actors can technically do, while permissions decide what is allowed or approval-gated.

After that, follow the work:

1. `tasks.yaml` shows units of work and required capabilities.
2. `workflow.yaml` shows ordering and dependency structure.
3. `handoffs.yaml` shows how responsibility moves between actors.
4. `events.yaml` shows the audit trail expected from meaningful state changes.

Finally, check `context.yaml` and `memory.yaml` to understand what actors may know, read, retain, or reuse.

Read `providers.yaml` and `model-profiles.yaml` together: providers describe available provider abstractions, while model profiles describe how model selection should be reviewed, constrained, and audited.

## Choosing an Example

Use `minimal-team` when learning the manifest model for the first time.

Use `software-team` when modeling a normal repository-based engineering workflow.

Use `startup-team` when product scope, design context, and release readiness matter more than enterprise governance.

Use `enterprise-team` when least privilege, restricted memory, compliance evidence, and explicit release control are central.

Use `product-delivery-team` when the workflow spans product, UX, engineering, QA, and launch coordination.

## Safety Pattern

All examples follow the same safety pattern:

- capabilities are declared separately from permissions
- risky capabilities are approval-gated
- context access is explicit
- memory access is scoped
- model profile selection is explicit and provider-neutral
- handoffs include artifacts and next actions
- event declarations make audit expectations visible
- provider declarations remain abstract

## Validation

The examples should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/**/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

See [Validation](../docs/validation.md) for current validation guidance and known limits.

## Extension Guidance

Example extension declarations are illustrative and draft-level. They do not implement integrations and do not grant access by themselves.

An extension should always be paired with explicit capabilities, permissions, context declarations, and approval gates where needed.
