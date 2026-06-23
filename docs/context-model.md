# Context Model

Context is a first-class NexFlow concept. Agents and workflows must explicitly declare which sources they can access, why those sources are available, how fresh the data should be, and what safety boundaries apply.

Context is information. It is not permission, memory, credential access, or tool execution.

## Goals

- Make available project knowledge visible before work starts.
- Prevent hidden or accidental access to sensitive information.
- Separate source discovery from permission to act.
- Give validators enough structure to catch common manifest mistakes.
- Give future runtimes enough policy to fetch, cache, cite, or reject context safely.

## Context Source Types

NexFlow defines the following draft source types.

| Type | Typical Content | Common Access | Notes |
| --- | --- | --- | --- |
| `github` | Repositories, issues, pull requests, discussions, actions metadata. | `read`, `query`, gated `write`. | Repository write actions require separate capabilities and permissions. |
| `gitlab` | Repositories, merge requests, issues, pipelines. | `read`, `query`, gated `write`. | Similar to GitHub, but provider-specific fields should remain extension-scoped. |
| `docs` | Project docs, API docs, runbooks, decision records. | `read`, sometimes gated `write`. | Public docs may still contain project-sensitive intent. |
| `notes` | Local or synced notes and project knowledge bases. | `read`, `query`. | Usually has stronger ownership and privacy expectations. |
| `confluence` | Enterprise documentation, standards, runbooks. | `read`, `query`. | Often `internal` or `confidential`. |
| `local_files` | Repository files, local worktree folders, generated artifacts. | `read`, gated `write`. | File writes are separate sensitive actions. |
| `knowledge_base` | Curated project, product, support, or research knowledge. | `read`, `query`. | Should document curation and sensitivity assumptions. |
| `linear` | Product and engineering tasks, labels, comments, cycles. | `query`, gated `write`. | Task mutation requires explicit capabilities. |
| `jira` | Issues, projects, epics, workflow metadata. | `query`, gated `write`. | Enterprise workflows may require audit retention. |
| `figma` | Design files, components, prototypes, annotations. | `read`, `query`. | Design exports and edits require separate capabilities. |
| `mcp` | MCP-exposed context, tools, prompts, resources, or workflow actions. | `query`, gated `admin`. | MCP can expose both data and tools; model the boundary explicitly. |
| `web` | Public web pages, standards, vendor docs, research references. | `query`. | Freshness, allowed domains, and citation expectations are important. |
| `custom` | Project-specific sources not covered by the core taxonomy. | Any declared mode. | Define custom semantics under an extension namespace. |

Source type identifies the kind of system. It does not identify what an actor may do with that system.

## Source Declaration

A context source declaration should explain the source, its access boundary, sensitivity, and freshness expectations.

```yaml
id: repository
type: github
description: Main source repository and pull request metadata.
uri: https://github.com/example/project
contentTypes:
  - source_code
  - pull_requests
access:
  default: read
  allowedActors:
    - maintainer
    - implementation-agent
classification: internal
refreshPolicy: on_request
freshness:
  maxAge: 24h
  staleAllowed: true
  requiresCitation: false
approvalGates:
  - code_review
```

## Source Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Stable source identifier used by agents, tasks, and workflows. |
| `type` | Yes | One of the core source types or `custom`. |
| `description` | Yes | Human-readable explanation of what the source contains. |
| `uri` | No | Location or locator for the source. Avoid raw credentials. |
| `contentTypes` | No | Informational tags such as `source_code`, `issues`, `designs`, or `web_pages`. |
| `access` | Yes | Default access mode and actor allow/deny lists. |
| `classification` | Yes | Sensitivity classification for the source. |
| `refreshPolicy` | No | When a runtime should refresh or re-query the source. |
| `freshness` | No | Expected staleness tolerance and citation behavior. |
| `allowedDomains` | No | Domain allow-list for web-like sources. |
| `disallowedDomains` | No | Domain deny-list for web-like sources. |
| `mcp` | No | MCP-specific context/tool boundary metadata. |
| `approvalGates` | No | Approval gates that apply before sensitive use of the source. |
| `extensions` | No | Namespaced extension metadata. |

Schemas validate only practical structure. More complex rules, such as whether an actor exists or a domain belongs to a source, are future semantic validation work.

The current schema recognizes these draft `contentTypes`: `source_code`, `documentation`, `issues`, `pull_requests`, `tickets`, `designs`, `knowledge_articles`, `web_pages`, `tool_results`, `metadata`, and `custom`.

## Access Modes

Access modes describe how a source may be used as information.

| Mode | Meaning | Typical Use |
| --- | --- | --- |
| `none` | Source is declared but unavailable by default. | Reserved source, disabled integration, future source. |
| `read` | Source contents may be read. | Files, docs, design metadata, repository contents. |
| `query` | Source may be queried through a controlled interface. | Issue trackers, search indexes, MCP resources, web search. |
| `write` | Source may be modified where permissions also allow it. | Docs edits, issue comments, generated artifacts. |
| `admin` | Administrative access to source configuration or privileged data. | Integration setup, membership, sensitive settings. |

Access mode is not authorization by itself. A future runtime must also check capabilities, permissions, autonomy level, approval gates, and project policy.

## Classification

Classifications describe the sensitivity of source content.

| Classification | Meaning | Examples | Guidance |
| --- | --- | --- | --- |
| `public` | Safe to disclose publicly. | Published docs, public standards, open-source READMEs. | Still cite sources and respect licenses. |
| `internal` | Intended for project or team members. | Internal task notes, private repo metadata, draft specs. | Avoid sharing outside the declared project boundary. |
| `confidential` | Sensitive business, product, customer, or security information. | Customer research, roadmap details, private designs. | Prefer narrow actor access and audit logging. |
| `restricted` | High-risk information with strict handling requirements. | Secrets metadata, security findings, compliance evidence. | Require explicit gates and minimal exposure. |

Classification should be conservative. If a source mixes public and confidential content, declare the source at the higher classification or split it into separate sources.

## Freshness and Refresh

Context can become stale. NexFlow separates the refresh trigger from the freshness expectation.

`refreshPolicy` describes when a source should be refreshed:

- `manual`: refreshed only by an explicit human or process action.
- `on_request`: refreshed when an actor requests the source.
- `on_workflow_start`: refreshed once when a workflow starts.
- `scheduled`: refreshed on a schedule defined by an extension or runtime.
- `custom`: project-specific refresh behavior.

`freshness` describes whether stale data is acceptable:

```yaml
freshness:
  maxAge: 7d
  staleAllowed: false
  requiresCitation: true
  lastReviewed: 2026-06-01
```

Suggested fields:

- `maxAge`: expected maximum age, such as `24h`, `7d`, or `30d`.
- `staleAllowed`: whether work may proceed when the source is older than `maxAge`.
- `requiresCitation`: whether outputs using this source should cite or link evidence.
- `lastReviewed`: date when humans last reviewed the source declaration.

Future runtimes should treat freshness as policy input, not as proof that data is correct.

## Web Context

Web context is useful and unstable. A `web` source should define what may be accessed and how freshness is evaluated.

```yaml
id: web_research
type: web
description: Public standards and market research for approved tasks.
access:
  default: query
  allowedActors:
    - product-owner
    - research-agent
classification: public
refreshPolicy: on_request
freshness:
  maxAge: 14d
  staleAllowed: false
  requiresCitation: true
allowedDomains:
  - example.com
  - standards.example.org
disallowedDomains:
  - paste.example
approvalGates:
  - network_access_review
```

Projects should avoid broad unrestricted web access. If broad access is necessary, the project should document why, what must be cited, and which approvals are required.

Web context should not be used to bypass provider, network, credential, or license policy.

## MCP Context

MCP can expose context, tools, prompts, resources, or workflow actions. NexFlow models MCP explicitly because it can cross the boundary between reading data and performing actions.

```yaml
id: mcp_tools
type: mcp
description: Approved local development MCP server.
access:
  default: query
  allowedActors:
    - implementation-agent
classification: internal
refreshPolicy: manual
mcp:
  serverId: local-development-tools
  exposes:
    - context
    - tools
  allowedTools:
    - test-log-reader
    - dependency-graph-reader
  requiresApprovalForTools: true
```

If an MCP server only exposes resources, model it as context. If it performs actions, model it as both a context source and an integration. Tool execution through MCP still requires explicit capabilities, permissions, autonomy rules, and approval gates.

`access_mcp` does not imply `execute_command`, repository write access, credential access, or deployment permission.

## Context Access in Agents

Agents refer to context sources by ID.

```yaml
contextAccess:
  - repository
  - docs
```

An agent with `contextAccess` can only use a source if the source access policy, permissions, and project policy also allow it. Future semantic validators should check that referenced context source IDs exist.

## Relationship To Retrieval Profiles

Context sources declare what information exists and who may access it.

[Retrieval Profiles](retrieval-profiles.md) declare how selected context sources should be assembled for a behaviorally meaningful purpose, including source selection, index or corpus version, chunking, retriever strategy, freshness, citations, sensitivity, and audit metadata.

A retrieval profile does not grant access to a context source. Future runtimes and validators should still check agent context access, source allow/deny lists, capabilities, permissions, autonomy level, approval gates, and project policy.

## Runtime Expectations

Future runtimes should:

- reject undeclared context sources
- enforce actor allow/deny lists before fetching context
- keep context access separate from memory writes
- log meaningful source access events for sensitive sources
- preserve source identifiers in audit events and handoffs
- cite web or external sources when `requiresCitation` is true
- require approval before high-risk source use when gates are declared

Runtimes must not silently expand an actor's context through provider defaults, extensions, or cached data.

## Semantic Validation Candidates

Future validators may check:

- agent `contextAccess` IDs exist in `context.yaml`
- source `allowedActors` and `deniedActors` IDs exist
- `web` sources define `allowedDomains` or an explicit project exception
- `restricted` sources have approval gates or narrow actor lists
- MCP sources declare whether they expose context, tools, or both
- sources using `scheduled` refresh define extension-specific scheduling metadata
- freshness rules are present for web and other volatile sources
