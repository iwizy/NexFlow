# RFC-0022: Security Policy Composition

## Status

Draft

## Summary

Propose a common review model for composing independent NexFlow security
boundaries around one future runtime operation. Authority remains with the
host and applicable project policy. No declaration, extension, provider,
approval, or stored event can replace another required decision.

The expanded [Security Model](../docs/security-model.md#draft-policy-composition)
contains the proposed sequence and review scenarios. This RFC and that section
are documentation only. They do not implement a runtime, accept another Draft
RFC, or change the meaning of a currently accepted manifest.

## Motivation

NexFlow already separates capabilities, permissions, approvals, autonomy,
context, memory, network, credentials, extensions, provider invocation, human
override, and audit. Separate contracts alone leave room for unsafe composition:
an implementation might stop at the first allow, reuse a stale approval after
a target change, trust a remote instruction, or retry an uncertain effect.

The [Threat Model](../docs/threat-model.md) identifies these as conditional
future-runtime attacker stories. This proposal makes their review expectations
explicit without claiming a vulnerability in a runtime that does not exist.

## Proposal

### Operation Scope And Policy Intersection

The future host should bind each proposed operation to its project,
authenticated actor, capability, purpose, exact target, relevant task or
workflow, data classification, and applicable configuration revisions.
Authenticated identity binding remains a deployment responsibility; authored
IDs alone do not prove identity.

The host should evaluate all applicable domains, using their owning contracts:

- [Effective Agent Configuration](../docs/effective-agent-configuration.md) for
  unique active selection and narrowing of the request.
- [Capability Model](../docs/capability-model.md),
  [Approval Gates](../docs/approval-gates.md), and
  [Autonomy Model](../docs/autonomy-model.md) for action authority.
- [Context Model](../docs/context-model.md),
  [Memory Model](../docs/memory-model.md), and
  [Provider Constraints](../docs/provider-constraints.md) for data handling.
- [Network Access Policy](../docs/network-access-policy.md) and
  [Credential Handling](../docs/credential-handling.md) for independent,
  operation-scoped mediation.
- [Extension Loading Boundary](../docs/extension-loading-boundary.md) and
  [Provider Adapter Boundary](../docs/provider-adapter-boundary.md) for supported
  implementations with no ambient authority.
- [Human Override](../docs/human-override.md) and
  [Event And Audit Storage Boundary](../docs/event-audit-storage-boundary.md)
  for blocking state and truthful, redacted evidence.

Continue only when every applicable boundary permits the exact operation.
Explicit deny takes precedence, every applicable approval remains required,
and a missing permission grants nothing. Unknown restrictive facts, ambiguous
references, unsupported controls, and failed checks block the effect. A host
may omit an inapplicable domain only with an operation-specific reason; missing
required evidence cannot be treated as inapplicability.

This proposal does not introduce a global rule syntax or merge domain-specific
matching algorithms. It does not require network or credentials for an offline
operation or expand the effect budget of static tooling.

### Revalidation And Effects

Bind decisions to relevant policy, configuration, approval, input, artifact,
and target revisions. Re-evaluate after a relevant change, expiry, revocation,
override, fallback, retry, resume, or delegation; satisfy newly required or
invalidated approvals. A previous success is evidence, not reusable authority.

Before an effect, recheck mutable authority. A future implementation must
document how it detects changes between check and use, invalidates scoped
handles, blocks subsequent effects, and handles in-flight work. The proposal
does not choose a locking, transaction, credential broker, or cancellation API.

Unknown completion after a timeout or lost acknowledgement blocks blind replay.
Reconciliation, compensation, and retry require their own scoped decisions.
Cancellation is not proof of rollback, and this model promises neither
exactly-once execution nor atomicity across external systems.

### Content, Delegation, Limits, And Evidence

Untrusted context, tool metadata, model output, imported events, and remote
messages cannot rewrite local authority. Each resulting tool request or
handoff is a new proposal evaluated in its actual scope. Provenance and
integrity do not establish approval or safety; remote success cannot complete
local work without the required local transition policy.

The host should bound relevant execution time, requests, retries, concurrency,
input and output volumes, and retained state. Unsupported limits or exhausted
budgets block further effects. No new authored budget fields are proposed.

Record minimal, classified, redacted evidence of scope, revisions, decisions,
outcome, and uncertainty. Required pre-effect audit failure blocks execution;
post-effect audit loss is a gap requiring truthful outcome reporting. It is
never permission to replay an effect or fall back to weaker storage.

## Compatibility Impact

The proposal adds no manifest kind or field and changes no schema, maintained
profile, CLI output, diagnostic code, package, or runtime behavior. Existing
examples and fixtures remain unchanged. There is no version bump or migration
for publishing a Draft proposal.

Before acceptance, review normative semantics and each affected version domain
under [Versioning](../docs/versioning.md) and
[Compatibility](../docs/compatibility.md). Unchanged manifest shape does not
make a changed permission, approval, retry, or cancellation meaning compatible.
If acceptance changes an authored contract, synchronize its owning documents,
schemas, examples, fixtures, migration guidance, and conformance claims.

The proposal depends on existing domain contracts and retains the Draft status
of their related RFCs. It selects no runtime architecture or language.

## Security And Safety Impact

The proposal reduces ambiguity about cross-domain authority, stale decisions,
untrusted input, delegation, and uncertain effects. It adds no connectivity,
credential exposure, elevated autonomy, or executable code. It cannot protect
against a compromised host or establish implementation isolation by itself.
Authentication, race handling, cancellation guarantees, resource enforcement,
and audit durability still need implementation and deployment evidence.

## Validation And Acceptance Evidence

Review every [security scenario](../docs/security-model.md#security-review-scenarios)
against its owning contracts, including the scoped eligible case and denied,
pending, changed, unsupported, and uncertain cases. Record the exact revision,
manual conclusions, executable results, gaps, and reviewer decision.

Run the focused policy schema, reference, profile, and no-runtime checks plus
the full repository workflow suites. These establish compatibility of the
unchanged tooling and maintained data; they do not test this proposed evaluator.

Before any runtime enforcement claim, require implementation-specific tests for
policy intersection, multiple gates, identity and project separation, stale
scope, untrusted tool requests, revocation races, uncertain completion, bounded
retry, and audit failure. Keep this RFC Draft until maintainers resolve the
semantic and compatibility questions through the normal review process.

## Alternatives Considered

- Keep only separate domain documents. This avoids a new proposal but leaves
  reviewers without a common account of composition and partial failure.
- Define a policy engine or runtime API now. This would select architecture
  and serialization before the required runtime evidence and acceptance gates.
- Author one broad execution grant in manifests. This would blur independent
  policy boundaries and make scope changes and revocation harder to explain.

## Open Questions

- Which decision facts need immutable identity, and which require live checks
  at the effect boundary for each future runtime?
- How will implementations prove principal binding, project isolation,
  revocation visibility, and bounded in-flight behavior?
- Which uncertain outcomes can be reconciled safely without causing another
  effect, and what evidence is required before a retry?
- Which operation limits belong in later authored policy, and which remain
  deployment configuration?
- What runtime conformance fixtures and compatibility changes are required
  before any part of this proposal can become an accepted requirement?
