# Prompt Sets

Prompt sets describe versioned prompt material for agents, agent definitions, workflows, tasks, reviews, and safety checks.

They are specification metadata. They do not execute prompts, call a provider, store credentials, grant tool access, or bypass permissions.

## Purpose

A prompt set makes behavior-changing prompt material reviewable without requiring NexFlow to become a prompt registry.

It can describe:

- stable prompt set identifiers
- prompt revisions
- prompt kinds such as system, role, workflow, task, review, safety, tool, handoff, and memory prompts
- prompt source references
- optional content digests
- prompt owners and maintainers
- variable expectations
- safety review status
- compatibility impact
- audit metadata expected from a future runtime
- intended agent definitions or agents

Prompt sets are versioned component vocabulary used by agent assembly and proposed in [RFC-0004](../rfcs/RFC-0004-agent-definition-versioning.md).

## Manifest

Prompt sets may be declared in `prompt-sets.yaml`.

```yaml
specVersion: "0.1"
kind: PromptSet
metadata:
  project: example-project
promptSets:
  - id: backend_reviewer_prompts
    description: Prompt material for backend review and migration risk analysis.
    version: "2026.06.0"
    status: draft
    owner: human-tech-lead
    prompts:
      - id: backend_reviewer_system
        kind: system
        revision: "3"
        sourceRef: prompts/backend-reviewer/system.md
        contentDigest: sha256:example-backend-reviewer-system
        variables:
          - repository_summary
          - task_context
        classification: internal
        notes: Defines review boundaries and required evidence.
      - id: backend_reviewer_safety
        kind: safety
        revision: "2"
        sourceRef: prompts/backend-reviewer/safety.md
        contentDigest: sha256:example-backend-reviewer-safety
        variables:
          - approval_gate_refs
        classification: confidential
    review:
      required: true
      approvers:
        - human-tech-lead
      safetyReviewStatus: pending
    compatibility:
      impact: behavior_changing
      notes: Changes may alter review strictness, risk scoring, and required evidence.
      replaces: backend_reviewer_prompts_2026_05
    audit:
      recordPromptSetRef: true
      recordPromptRevisions: true
      recordContentDigest: true
      recordReviewStatus: true
    recommendedFor:
      - backend-reviewer
```

The schema is intentionally practical. It validates useful structure, but deeper checks such as whether referenced prompt files, approvers, or agents exist are semantic validation work.

## Prompt Set Identity

A prompt set identity should be stable and meaningful within a project.

Prompt set IDs SHOULD:

- follow the common [identifier rules](manifest-reference.md#identifier-rules)
- describe the behavioral purpose, not the provider
- remain stable across prompt revisions
- avoid embedding secrets, account names, private URLs, or raw credentials

The `version` field describes the prompt set release. It is separate from manifest `specVersion`, which only describes the NexFlow schema version.

## Prompt Revisions

Each prompt entry SHOULD declare a `revision`.

Prompt revisions can use simple integers, date-based versions, or project-specific version strings. The format is intentionally flexible because teams may store prompts in Git, external prompt registries, internal documents, or private configuration stores.

Projects SHOULD update the prompt revision when prompt material changes in a way that may affect behavior, safety, privacy, compatibility, output style, or required evidence.

## Prompt Kinds

The draft prompt kind vocabulary is:

| Kind | Purpose |
| --- | --- |
| `system` | High-level operating instructions for a model-backed agent. |
| `role` | Role-specific expectations, voice, boundaries, and responsibilities. |
| `workflow` | Instructions tied to a workflow stage or process. |
| `task` | Instructions tied to a task class or task instance. |
| `review` | Review, critique, quality, or acceptance instructions. |
| `safety` | Safety, refusal, escalation, approval, or sensitive-action instructions. |
| `tool` | Tool-use guidance that does not grant tool access by itself. |
| `handoff` | Handoff summary, acceptance, and transfer instructions. |
| `memory` | Memory read, write, correction, or promotion instructions. |
| `custom` | Project-specific prompt material that should be explained in notes. |

Prompt kind does not grant permissions, context access, tool access, autonomy, or memory access.

## Source References And Digests

Prompt text may contain sensitive operational details. Public manifests SHOULD NOT require raw prompt text.

Prompt entries may use:

- `sourceRef` for a repository path, document reference, prompt registry key, or extension-scoped pointer
- `contentDigest` for an optional integrity or audit marker
- `inline` for small public prompt snippets where disclosure is acceptable
- `classification` for the highest sensitivity of the prompt material

Digest values are metadata. This draft does not require a specific digest algorithm, although `sha256:<digest>` is recommended when a digest is available.

Raw prompt text MUST NOT contain secrets, tokens, private keys, passwords, raw personal data, or sensitive regulated details.

## Ownership And Review

Prompt sets SHOULD identify an owner or maintainer.

Review metadata SHOULD describe:

- whether review is required
- who may approve changes
- current safety review status
- review notes or external evidence references when useful

A prompt set referenced by an agent with broad autonomy, sensitive context, durable memory access, high-risk capabilities, or deployment-related workflows SHOULD require safety review before becoming active.

## Compatibility

Adding an unused prompt set is usually additive.

Changing a prompt set can be behavior-breaking even when manifests remain schema-valid.

Examples:

| Change | Compatibility impact |
| --- | --- |
| Add a new unused prompt set | Usually compatible. |
| Change display-only description text | Usually compatible. |
| Change a prompt revision used by an active agent definition | Behavior-breaking. |
| Change safety prompts | Safety-significant and may be breaking. |
| Remove required variables | May break runtime prompt assembly. |
| Broaden tool-use guidance | Runtime safety breaking if permissions and gates are not aligned. |
| Lower prompt classification | Privacy or compliance breaking if incorrect. |
| Store sensitive prompt text publicly | Security and privacy breaking. |

Compatibility notes should identify affected agent definitions, workflows, approval gates, context sources, memory scopes, and future audit events when known.

## Audit Expectations

Future events involving a model-backed agent SHOULD be able to include prompt set metadata.

Example:

```yaml
agent:
  id: backend-reviewer
  definitionRef: backend_reviewer_2026_06
  promptSetRef: backend_reviewer_prompts
promptSet:
  ref: backend_reviewer_prompts
  version: "2026.06.0"
  promptRevisions:
    backend_reviewer_system: "3"
    backend_reviewer_safety: "2"
  safetyReviewStatus: approved
  contentDigestsRecorded: true
```

Prompt content should be recorded in events only when project policy allows it. References, revisions, and digests are usually safer audit fields than raw prompt text.

## Relationship To Agent Definitions

Agent definitions reference prompt sets through `promptSetRef`. The unique
active definition selects the requested set, while prompt lifecycle, safety
review, and future runtime support remain separate constraints.

Both manifests remain draft vocabulary. Selection does not load or render a
prompt.

Prompt set references do not grant access. Capabilities, permissions, context access, memory access, autonomy, approval gates, and extension policies remain separate and authoritative.

## Current Status

Prompt sets are draft specification vocabulary in `0.1`.

This repository provides documentation, schema, and examples only. It does not implement prompt loading, prompt rendering, prompt registries, provider calls, event emission, or runtime enforcement.
