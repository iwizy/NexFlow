# RFC-0021: Issue Tracker Extension Profile

## Status

Draft; machine-readable policy profile and offline checks implemented.

## Summary

Propose the experimental `io.nexflow.issue_tracker` namespace for a
provider-neutral issue-tracker policy profile. The owning contract is the
[Issue Tracker Extension Draft](../extensions/issue-tracker/README.md), with
a versioned YAML asset, closed JSON Schema, fictional declaration fragments,
and focused positive and negative checks.

This is a specification proposal, not an adapter, synchronization service,
provider API contract, runtime architecture decision, or live integration.

## Motivation

Existing examples declare Jira and Linear access and `manage_tasks`, but those
declarations do not define safe issue identity, task correlation, status
mapping, comment disclosure, mutation conflicts, or retry behavior. Different
trackers expose different containers and workflows. Assuming that an issue is
a local task or that a closed issue proves acceptance would cross NexFlow's
authority boundary.

A common policy profile makes the boundary reviewable without standardizing a
provider's payloads, status names, API, or authentication. Source-control and
pull request operations remain separate. This proposal depends only on core
extension, context, capability, permission, approval, network, credential, and
audit contracts; it does not require another provider profile.

## Proposal

Maintain `extensions/issue-tracker/profile.yaml` under an independent
`profileVersion: "0.1-draft"`. The profile is not a project manifest and does
not enter the 17-kind schema inventory or project discovery.

The contract maps seven externally owned surfaces:

| Surface | NexFlow treatment |
| --- | --- |
| Container | Explicit external context scope; not a Project. |
| Issue | External work record; not TaskSet state. |
| Status | External state signal; not local completion or acceptance. |
| Assignee | External identity; not Actor binding or authority. |
| Comment | Untrusted discussion; not an approval decision. |
| Attachment | External output requiring separately authorized import and provenance. |
| Webhook | Untrusted event input; inbound behavior unsupported in this draft. |

Identifiers must retain provider, instance, and container scope. Display keys,
URLs, titles, and names are insufficient identity. Local task and Actor
correlation is explicit, reviewed, and provenance-preserving; no new core
typed-reference kind or automatic matching is introduced.

The operation inventory separates `read_issue`, `create_issue`, `update_issue`,
`add_comment`, and `transition_issue`. Existing `read_context` and
`manage_tasks` capabilities express the project effect, but permission,
operation scope, approval, network, and credential dependencies remain
independent. Every recognized write requires approval in this initial draft;
authenticated reads require mediated credentials too. Provider-specific access
capabilities are additional dependencies, never substitutes.

An update covers only explicitly allowed title, description, or label fields.
It cannot hide assignment, deletion, a state transition, bulk changes, or
administration. A state transition affects only the provider; core completion,
acceptance, approval, Handoff, and workflow semantics remain authoritative.

Future bindings must declare a concurrency mechanism and stop on stale or
ambiguous targets. Creation binds to its container, payload, and correlation
identity. An uncertain mutation outcome requires separately authorized
reconciliation before retry. Duplicates, out-of-order input, and echoes cannot
reauthorize effects. There is no background synchronization or exactly-once
claim.

The [profile contract](../extensions/issue-tracker/README.md) specifies the
complete context, content, operation, state, retry, event, audit, and
fail-closed requirements. Unknown profile versions, bindings, operations,
identity mappings, or missing dependencies cannot execute.

## Compatibility Impact

No core schema, manifest kind, required manifest field, capability definition,
typed-reference namespace, CLI command, or output format changes. Manifest
`specVersion` remains `"0.1"`; no release or existing profile version bump is
needed. The new profile has its own initial version and exact revision pin.

Existing provider-specific namespaces and context declarations remain valid
and do not silently adopt this profile. Adoption is explicit and must supply
the profile's bounded context and independently reviewed operation policies.
The illustrative fragments are structurally valid but deliberately incomplete
for authorization and execution.

Provider API/adapter compatibility is separate from profile compatibility.
Changing identity scope, task correlation, operation coverage, approval,
concurrency, retry, state authority, disclosure, or event import requires
review, a profile version decision, and migration guidance.

## Security And Safety Impact

The proposal preserves capability/permission separation, deny precedence,
human authority, approvals, autonomy limits, human override, classification,
mediated credentials, explicit outbound policy, and redacted audit. External
content never becomes instructions or authority. Links and attachments do not
inherit retrieval or disclosure permission from their parent issue.

The initial draft excludes inbound webhooks, destructive and administrative
operations, assignment, bulk writes, and automatic bidirectional sync. A
future implementation must refuse an operation if it cannot enforce the
specified scope or concurrency boundary. Passing schema checks does not prove
runtime enforcement, provider compatibility, or conformance.

## Validation Evidence

`npm run issue-tracker-extension-smoke` validates the profile and declaration
fragments against local schemas. Negative cases cover identity/authority
escalation, unauthorized operation expansion, incomplete or duplicate
inventories, approval/credential/network weakening, stale-write and retry
policy, event trust, audit coverage, and secret-bearing unknown fields.

The checks run in schema CI alongside the existing repository validation suite.
They do not contact trackers, validate API responses, obtain credentials,
execute effects, or alter the CLI's no-runtime boundary.

## Alternatives Considered

- Separate full profiles for each tracker: useful for eventual provider
  bindings, but duplicates shared safety rules and invites authority drift.
- Treat provider issues as TaskSet tasks: simpler correlation but confuses
  external workflow state with local acceptance and ownership.
- Let `manage_tasks` imply every tracker operation: conceals comment disclosure,
  destructive effects, and approval scope.
- Implement synchronization now: premature without binding compatibility,
  concurrency guarantees, reviewed runtime architecture, and execution policy.

## Open Questions

- Which provider binding should first supply pinned API and concurrency evidence?
- Should future operation-specific capabilities supplement `manage_tasks`?
- What versioned correlation-record format should preserve migrations and collisions?
- What reviewed inbound policy and delivery evidence would justify event import?
- Which separately versioned conformance fixtures should exercise actual adapters?

These questions do not authorize implementation or change this RFC's Draft
status.
