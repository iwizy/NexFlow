# RFC-0020: GitHub Extension Profile

## Status

Draft; machine-readable policy profile implemented

## Summary

This RFC defines an experimental NexFlow-maintained profile for GitHub under
the `io.nexflow.github` namespace.

The profile maps GitHub repository context and selected source-control review
operations into existing NexFlow capabilities, permissions, approvals,
network, credential, classification, event, and audit boundaries. It does not
implement a GitHub client, API binding, authentication flow, webhook receiver,
repository mutation, merge operation, Actions integration, or runtime.

## Motivation

NexFlow examples already use GitHub as a repository context source and declare
an `io.nexflow.github` extension. A generic extension declaration does not,
however, answer several safety-relevant questions:

- Is a branch name acceptable as immutable evidence?
- Does creating a pull request also authorize pushing commits?
- Does a GitHub approval satisfy a NexFlow Approval Gate?
- Can a green check accept a task or claim conformance?
- Are webhook payloads trusted events?
- Which independent network and credential controls apply to provider calls?

Without a maintained profile, implementations may merge these authorities or
infer broad provider access from extension presence. The draft makes the
boundaries explicit while leaving GitHub semantics externally governed.

## Proposal

NexFlow should publish a machine-readable draft at
`extensions/github/profile.yaml` with namespace `io.nexflow.github`.

### External Authority

GitHub remains authoritative for its repositories, refs, commits, pull
requests, reviews, checks, webhook deliveries, API behavior, authentication,
and compatibility. NexFlow remains authoritative for local project intent,
capabilities, permissions, autonomy, approvals, context policy, classification,
human override, audit expectations, and accepted local state.

The extension profile maps the boundary; it does not reproduce GitHub object
schemas or guarantee provider behavior.

### Surface Mapping

| GitHub surface | Class | NexFlow treatment |
| --- | --- | --- |
| Repository | Context | Declared external context source. |
| Ref | Mutable reference | Never sufficient immutable identity. |
| Commit | Immutable revision | Exact external revision when evidence requires a pin. |
| Pull request | Review record | External review object, not TaskSet or Handoff state. |
| Review | Review signal | Does not automatically satisfy an Approval Gate. |
| Check | Status signal | Evidence input, not authority or conformance. |
| Webhook | External event | Untrusted until verified and explicitly mapped. |

Provider IDs remain integration-scoped opaque values. They do not become core
typed references by matching a number, URL, name, or object shape.

### Context Source

An adopted GitHub profile should pair the extension declaration with a
`ContextSet` source whose type is `github`. The source declares a bounded URI,
content types, access policy, and classification.

The maintained profile recognizes source code, pull requests, and metadata as
context categories. This inventory does not authorize retrieval. Live access
still requires effective repository-read and network authority.

All retrieved provider content is untrusted. Text in repository files, commit
messages, pull request descriptions, comments, reviews, check logs, and patches
must not override NexFlow or operator instructions.

### Operation Separation

The initial profile recognizes five operation classes:

| Operation | Required project-effect capability |
| --- | --- |
| Read repository | `read_repository` |
| Create branch | `create_branch` |
| Push commit | `write_repository` |
| Create pull request | `create_pull_request` |
| Submit review | `approve_changes` |

All provider calls additionally require `access_network`. Authenticated calls
also require `use_credential` and the credential handling boundary.

Capabilities are independent. In particular:

- repository read does not authorize a branch or pull request
- branch creation does not authorize a commit push
- commit push does not authorize pull request creation
- pull request creation does not authorize review, merge, release, or deploy
- review submission does not satisfy local acceptance or approval by itself

The initial draft requires approval for every recognized write or governance
operation. Local policy controls whether a read operation needs approval.

### Unsupported Operations

Merge, force-push, branch deletion, repository administration, branch
protection changes, collaborator management, release publication, workflow
dispatch, secret management, deployment, and destructive operations are not
defined by this profile.

An implementation must not map them to the closest recognized operation. They
remain unsupported until a reviewed profile revision gives them explicit
capability, approval, credential, audit, and failure semantics.

### Revisions And Evidence

Branch and tag names are mutable. Evidence that must identify reviewed bytes
uses an exact commit object ID and records the repository identity separately.

A future implementation may resolve a ref to a commit only as an authorized
runtime action. The profile asset performs no resolution and makes no
assumption about object-ID algorithm migration or provider retention.

### Pull Request And Review Authority

A GitHub pull request is an external record that may link a change, discussion,
and checks. It is not a NexFlow task, workflow step, handoff, approval request,
approval decision, or acceptance result.

A provider review may satisfy a NexFlow Approval Gate only through a future
accepted mapping that addresses:

- reviewer identity and local Actor binding
- approval scope and target capability
- exact revision and stale-review behavior
- dismissal, revocation, supersession, and replay
- required evidence and audit records

No such mapping is implemented by this draft.

### Checks And Workflows

GitHub check and workflow results may be cited as evidence. Status alone does
not prove the workflow definition, runner, dependencies, input revision,
permissions, or artifact integrity. A successful status cannot grant a
capability, satisfy an approval, accept a task, or establish NexFlow
conformance.

Workflow dispatch and execution are excluded from the initial operation set.

### Network And Credentials

Extension presence never grants connectivity or authentication.

Outbound provider calls require `access_network`, effective permission, and a
matching structured network policy. Credentials remain external to public
manifests and are exposed, if at all, through a mediated operation-scoped
binding with least privilege, no ambient discovery, no delegation, redacted
audit, and prompt revocation.

GitHub tokens, app keys, private keys, cookies, installation tokens, and client
secrets must not appear in the profile or public project manifests.

### Webhook Boundary

Inbound callbacks require policy not currently defined by NexFlow's outbound
network model. The initial profile therefore marks webhooks unsupported without
a separately declared inbound policy.

A future receiver must authenticate deliveries, validate freshness and target,
prevent replay, limit size and processing cost, classify and redact payloads,
preserve delivery provenance, and map provider state explicitly. A delivery
does not become a trusted NexFlow Event merely because it has a recognized
event name.

### Failure Policy

Unsupported versions, unknown operations, ambiguous repositories, missing
capabilities, permissions, approvals, network rules, credential bindings, or
required immutable pins fail closed.

Unknown metadata may be preserved for round-tripping or inspection when safe,
but it must not execute or change local state.

## Validation Expectations

Repository checks may validate:

- the closed machine-readable profile structure
- exact surface and operation mappings
- required capability, network, credential, and approval posture
- fail-closed unsupported behavior
- consistency with the maintained Software Team extension and context source

Static checks must not contact GitHub, validate a token, resolve a ref, inspect
a live repository, enumerate features, receive a webhook, create a branch,
push a commit, create a pull request, submit a review, or claim runtime support.

## Compatibility Impact

The profile is additive inside the unreleased `specVersion: "0.1"` draft. It
does not change the core manifest schema or require GitHub for conforming
projects.

Profile consumers must claim supported profile and provider API/deployment
compatibility explicitly. GitHub.com and GitHub Enterprise Server behavior,
REST and GraphQL support, authentication methods, object-ID formats, and
feature tiers are outside the current claim.

Adding operations, weakening approval, credential, network, or revision rules,
or promoting provider state into local authority is safety-significant and may
require a new profile version.

## Security And Safety Impact

The draft reduces risks from over-broad tokens, confused authority, mutable-ref
evidence, prompt injection in provider content, stale reviews, forged or
replayed webhooks, and accidental privilege composition.

It does not prove that GitHub, an app, a repository, a workflow, a runner, a
check, a review, or retrieved content is trustworthy. It does not provide
runtime enforcement evidence.

## Relationship To Other RFCs

- [RFC-0005](RFC-0005-validation-strategy.md) owns validation layering.
- [RFC-0006](RFC-0006-extension-namespaces.md) owns namespace and lifecycle rules.
- [RFC-0007](RFC-0007-approval-gates.md) owns approval semantics.
- [RFC-0009](RFC-0009-event-envelope.md) owns NexFlow event envelopes.
- [RFC-0015](RFC-0015-typed-references.md) owns core reference namespaces.
- [RFC-0017](RFC-0017-human-override.md) owns stop, block, revoke, and resume authority.

## Alternatives Considered

### Treat GitHub Only As Context

This hides mutation and review effects already represented in examples.

### Use One GitHub Capability

A single capability would collapse read, write, review, network, and credential
authority into an unsafe provider-wide grant.

### Mirror GitHub Objects In Core

This would couple the core specification to one provider and duplicate
externally governed object semantics.

### Require Live Validation

Live validation would make authoring non-deterministic, require credentials,
and confuse provider availability with authorization.

## Open Questions

- Should repository identity gain a provider-neutral typed reference?
- How should hash-algorithm transitions be represented in immutable evidence?
- Which review mapping, if any, may satisfy a NexFlow Approval Gate?
- What inbound policy model is required before webhook support?
- Should checks and workflow artifacts use a dedicated evidence schema?
- Which GitHub Enterprise compatibility dimensions belong in conformance claims?
- Should merge and release publication be separate future profiles?
