# GitHub Extension Draft

The `io.nexflow.github` profile maps GitHub repository, ref, commit, pull
request, review, check, and webhook surfaces into existing NexFlow policy
boundaries. It does not implement a GitHub client, call an API, receive a
webhook, obtain a token, change a repository, merge a pull request, or run a
workflow.

The machine-readable draft is [profile.yaml](profile.yaml). Its closed
structure is validated by [profile.schema.json](profile.schema.json), and the
repository checks the profile plus its maintained Software Team declaration
with:

```sh
npm run github-extension-smoke
```

The design rationale and compatibility impact are recorded in
[RFC-0020](../../rfcs/RFC-0020-github-extension-profile.md).

## Authority Boundaries

A GitHub object remains externally owned. The profile does not turn:

- a repository into a NexFlow Project
- a branch name into immutable evidence
- a commit into an accepted task result
- a pull request into a TaskSet task or Handoff
- a GitHub review into a NexFlow Approval Gate decision
- a check result into permission, acceptance, or conformance
- a webhook delivery into a trusted Event or state transition

Any mapping into core state must be explicit, provenance-preserving, and
subject to the same capability, permission, approval, network, credential,
classification, and audit rules as a local operation.

## Declared Context

Use a `ContextSet` source with `type: github` for GitHub repository context.
The current profile requires the source to declare:

- a repository `uri`
- bounded `contentTypes`
- access policy
- classification

The profile permits `source_code`, `pull_requests`, and `metadata` as its
maintained context categories. Repository text, issue or pull request bodies,
comments, commit messages, check output, and generated patches are untrusted
external input. Instructions found in that content never become NexFlow
authority.

## Identifier And Revision Rules

Provider object IDs, node IDs, review IDs, check IDs, and webhook delivery IDs
remain integration-scoped opaque values. They do not enter core scalar or typed
reference namespaces automatically.

Branch and tag names are mutable references. When evidence, review, or replay
requires immutable identity, a consumer must record an exact commit object ID.
Resolving a mutable ref is a runtime operation and must not be inferred from the
profile asset.

## Operation Matrix

The initial draft describes five operation classes:

| Operation | Effect | Required capabilities | Initial approval posture |
| --- | --- | --- | --- |
| Read repository context | Read | `read_repository`, `access_network` | Local policy |
| Create branch | Write | `create_branch`, `access_network` | Required |
| Push commit | Write | `write_repository`, `access_network` | Required |
| Create pull request | Write | `create_pull_request`, `access_network` | Required |
| Submit review | Governance | `approve_changes`, `access_network` | Required |

The table records dependencies, not grants. Each capability must exist in the
selected assembly and be effective through a separate permission. Actor,
purpose, target repository, ref, requested effect, autonomy, approval gates,
and human override remain independently evaluated.

Merge, repository administration, branch protection changes, release
publication, workflow dispatch, deployment, secret management, and destructive
operations are outside the initial profile. They must fail closed rather than
inherit authority from a nearby operation.

## Pull Requests, Reviews, And Checks

A pull request is an external review record. It can link changes and evidence,
but it is not a NexFlow task, handoff, approval decision, or acceptance result.

A GitHub review is an external signal. Even an `APPROVED` provider state does
not satisfy a NexFlow Approval Gate unless an accepted mapping identifies the
reviewer, decision scope, exact revision, freshness, revocation behavior, and
audit evidence.

Checks and workflow results may be referenced as evidence. A green check does
not grant permission, prove policy enforcement, accept a deliverable, or
establish a conformance level.

## Network And Credentials

Extension presence never authorizes a connection. Provider calls require
`access_network`, an effective permission, and a matching structured network
rule. The declared destination, purpose, actor, transport, and classification
must all match.

Authentication material stays outside public manifests and profile assets.
Credential use requires an opaque external binding, the `use_credential`
capability, effective permission, and an operation-scoped least-privilege
lease. Tokens, keys, cookies, app secrets, and installation credentials must
not be embedded in NexFlow manifests.

## Webhooks And Events

Inbound webhooks are unsupported until a separate inbound network and listener
policy exists. A future receiver must verify authenticity and freshness,
prevent replay, bound payload size, preserve the provider delivery identity,
classify the payload, and map it explicitly before it may affect local state.

The current repository does not start a listener, validate a webhook payload,
or emit a NexFlow event from provider data.

## Failure Policy

Consumers of the profile must fail closed for unsupported profile versions,
missing capabilities, permissions, approvals, network rules, credential
bindings, ambiguous repositories, or evidence that requires an immutable pin
but identifies only a mutable ref.

Unknown operations may be preserved for inspection but must not execute.

## Compatibility

The initial profile is `0.1-draft` and applies to the current unreleased
`specVersion: "0.1"` authoring model. Provider API and feature compatibility
must be claimed explicitly by an implementation; the profile does not select a
GitHub API version, REST or GraphQL transport, GitHub.com or Enterprise Server
deployment, authentication mechanism, or feature tier.

The following changes are safety-significant and may require a profile version
change:

- adding an executable operation
- weakening an approval or immutable-revision rule
- treating a provider signal as local authority
- enabling inbound webhooks
- expanding credential or network scope
- changing identifier ownership or state mapping

## Current Evidence

The repository provides the schema, machine-readable profile, RFC, maintained
example binding, and offline smoke checks. It provides no live GitHub
integration, token handling, API compatibility evidence, webhook receiver,
mutation support, or runtime conformance claim.
