# Retrieval Profiles

Retrieval profiles describe how project context is selected, indexed, assembled, cited, and audited for agents, agent definitions, workflows, tasks, and reviews.

They are specification metadata. They do not retrieve data, build indexes, call embedding models, grant context access, grant tool access, or bypass permissions.

## Purpose

A retrieval profile makes RAG-style context behavior reviewable without requiring NexFlow to define a retrieval engine.

It can describe:

- context source references
- included and excluded sources
- corpus or index versions
- chunking policy
- retriever strategy
- embedding model or reranker references
- freshness expectations
- citation requirements
- sensitivity and redaction expectations
- audit metadata expected from a future runtime
- intended agent definitions or agents

Retrieval profiles are part of the agent assembly versioning vocabulary proposed in [RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md).

## Manifest

Retrieval profiles may be declared in `retrieval-profiles.yaml`.

```yaml
specVersion: "0.1"
kind: RetrievalProfileSet
metadata:
  project: example-project
retrievalProfiles:
  - id: backend_reviewer_retrieval
    description: Retrieval expectations for backend review and migration analysis.
    version: "2026.06.0"
    status: draft
    owner: human-tech-lead
    sources:
      - contextSourceRef: repository
        purpose: Source code, diffs, and pull request metadata.
        accessMode: read
        required: true
        maxClassification: confidential
      - contextSourceRef: docs
        purpose: Architecture and API documentation.
        accessMode: read
        required: false
        maxClassification: internal
    excludedSources:
      - production_logs
    index:
      corpusRef: backend-review-corpus
      version: "2026-06-01"
      updatePolicy: on_request
      embeddingModelProfileRef: backend_embedding_model
      rerankerRef: approved-code-reranker
    chunking:
      strategy: structure_aware
      maxChunkTokens: 1200
      overlapTokens: 120
      preserveBoundaries:
        - function
        - class
        - markdown_section
    retriever:
      strategy: hybrid
      topK: 12
      scoreThreshold: 0.2
      queryRewrite: static_policy
    freshness:
      maxAge: 7d
      staleAllowed: false
      requiresRefreshBeforeUse: true
    citations:
      required: true
      style: source_path
      includeLineRefs: true
      includeRetrievedAt: true
    sensitivity:
      maxClassification: confidential
      allowCrossScopeReuse: false
      redactionPolicy: redact_secrets_and_personal_data
    review:
      required: true
      approvers:
        - human-tech-lead
      reviewTriggers:
        - source_added
        - index_version_change
        - broader_classification
        - stale_allowed
    compatibility:
      impact: behavior_changing
      notes: Changes may alter evidence, citations, and review conclusions.
    audit:
      recordRetrievalProfileRef: true
      recordContextSources: true
      recordIndexVersion: true
      recordFreshness: true
      recordCitations: true
      recordRetrieverConfig: true
    recommendedFor:
      - backend-reviewer
```

The schema is intentionally practical. It validates useful structure, but deeper checks such as whether referenced context sources, model profiles, approvers, or agents exist are semantic validation work.

## Retrieval Profile Identity

A retrieval profile identity should be stable and meaningful within a project.

Retrieval profile IDs SHOULD:

- use lowercase letters, numbers, hyphens, and underscores
- describe the retrieval purpose, not the provider or runtime
- remain stable across index or corpus versions
- avoid embedding credentials, private URLs, account names, or raw query secrets

The `version` field describes the retrieval profile release. It is separate from manifest `specVersion`, which only describes the NexFlow schema version.

## Sources

Retrieval profile sources reference declared context sources.

Source entries SHOULD describe:

- `contextSourceRef`: a context source ID from `context.yaml`
- `purpose`: why the source is retrieved
- `accessMode`: expected read or query mode
- whether the source is required
- maximum expected classification for content retrieved from the source

Referencing a context source does not grant access to it. Actors still need context access, capabilities, permissions, autonomy allowance, and approval gates where required.

## Index And Corpus Metadata

Retrieval profiles may describe the corpus or index used to assemble context.

Index metadata can include:

- `corpusRef`: a project-local corpus or index name
- `version`: an index, corpus, or snapshot version
- `updatePolicy`: when the corpus is refreshed
- `embeddingModelProfileRef`: optional model profile for embeddings
- `rerankerRef`: optional reranker policy or component reference
- `sourceDigest`: optional digest of the indexed corpus
- `lastIndexedAt`: optional timestamp

Index metadata is not a lockfile. A future runtime that resolves an index should record what was actually used when safe and available.

## Chunking

Chunking policy describes how source content is divided before retrieval.

Common strategies include:

| Strategy | Purpose |
| --- | --- |
| `fixed_size` | Split content by approximate size. |
| `semantic` | Split content by semantic boundaries. |
| `structure_aware` | Preserve code, markdown, document, or issue structure. |
| `none` | Do not chunk; use whole documents or records. |
| `custom` | Project-specific chunking policy. |

Chunking changes can be behavior-changing because they affect what evidence an agent sees.

## Retriever Configuration

Retriever configuration describes retrieval expectations without implementing retrieval.

Common strategies include:

- `keyword`
- `vector`
- `hybrid`
- `graph`
- `custom`

Retriever configuration may include `topK`, `scoreThreshold`, filters, and query rewrite expectations.

These fields are declarations. They do not require NexFlow to choose a vector database, embedding provider, search engine, or runtime language.

## Freshness And Citations

Retrieval profiles SHOULD document freshness expectations.

Freshness metadata may include:

- maximum age
- whether stale context may be used
- whether refresh is required before use
- whether stale context requires a citation or warning

Citation metadata SHOULD describe whether citations are required and what kind of reference should be produced.

Examples:

- source path
- URL
- artifact ID
- issue or document reference
- line reference when available
- retrieval timestamp

Tasks that rely on web, customer, legal, security, release, or production context SHOULD prefer explicit freshness and citation rules.

## Sensitivity

Retrieval can combine information from multiple sources, so sensitivity should be conservative.

Retrieval profiles SHOULD declare:

- maximum classification expected
- whether cross-scope reuse is allowed
- redaction policy
- excluded classifications when relevant

If retrieved content mixes classifications, future tooling SHOULD treat the assembled context as the strictest applicable classification unless project policy says otherwise.

## Audit Expectations

Future events involving a model-backed agent SHOULD be able to include retrieval profile metadata.

Example:

```yaml
agent:
  id: backend-reviewer
  definitionRef: backend-reviewer-2026-06
  retrievalProfileRef: backend_reviewer_retrieval
retrieval:
  profileRef: backend_reviewer_retrieval
  version: "2026.06.0"
  contextSources:
    - repository
    - docs
  corpusRef: backend-review-corpus
  corpusVersion: "2026-06-01"
  freshness:
    maxAge: 7d
    staleAllowed: false
  citationsRequired: true
```

Events should prefer retrieval profile references, source IDs, index versions, freshness decisions, and citation metadata over raw retrieved content.

## Review Triggers

The following changes SHOULD be reviewed before a retrieval profile becomes active:

- adding a new source
- removing an excluded source
- broadening maximum classification
- allowing stale context where it was previously prohibited
- disabling required citations
- changing index or corpus version
- changing chunking policy
- changing retriever strategy, score threshold, or `topK`
- enabling query rewrite that may broaden retrieval scope
- allowing cross-scope context reuse

Review requirements are especially important when retrieval profiles are referenced by agent definitions with broad autonomy, sensitive context, durable memory access, high-risk capabilities, or deployment-related workflows.

## Compatibility

Adding an unused retrieval profile is usually additive.

Changing a retrieval profile can be behavior-breaking even when manifests remain schema-valid.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add a new unused retrieval profile | Usually compatible. |
| Change a description only | Usually compatible. |
| Change source set | Behavior-breaking. |
| Change index or corpus version | Behavior-breaking. |
| Change chunking strategy | Behavior-breaking. |
| Disable citations | Audit and review breaking. |
| Allow stale context | Correctness and safety breaking. |
| Broaden maximum classification | Privacy or compliance breaking. |
| Allow cross-scope reuse | Memory and context boundary breaking. |

Compatibility notes should identify affected agent definitions, workflows, context sources, memory scopes, approval gates, and future audit events when known.

## Relationship To Context Sources

Context sources describe where information may come from and who may access it.

Retrieval profiles describe how declared context should be selected, assembled, refreshed, cited, and audited for a behaviorally meaningful purpose.

Retrieval profile references do not grant access. Capabilities, permissions, context access, memory access, autonomy, approval gates, and extension policies remain separate and authoritative.

## Current Status

Retrieval profiles are draft specification vocabulary in `0.1`.

This repository provides documentation, schema, and examples only. It does not implement retrieval, indexing, embeddings, reranking, query rewriting, citation generation, event emission, or runtime enforcement.
