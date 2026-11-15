# 0.6 Runtime Prototype Scope

NF-111 review proposal for NF-112. The scope applies the accepted TypeScript
layout B in [RFC-0025](../../rfcs/RFC-0025-reference-implementation-architecture.md).
The baseline is the published [v0.5.0-alpha.1](https://github.com/iwizy/NexFlow/releases/tag/v0.5.0-alpha.1)
at `3aabaf610a5bd72f4f58f4ddb1b4a91dc5ee164b`. The
[public archive verification](https://github.com/iwizy/NexFlow/actions/runs/43292142506)
passed on Linux AMD64, macOS ARM64 and Windows AMD64 for that preview.

## One Offline Scenario

A test explicitly requests `read_fixture` for resource `sample-note` in project
`fixture-project`. A fixed in-memory adapter returns `sample record` for that
exact resource. The requester is the declared human actor `fixture-requester`.
The distinct declared human actor `fixture-reviewer` owns the `fixture-review`
approval gate and the applicable human override. The test host supplies
synthetic identities, a controlled clock and mutable policy/approval state.

Use a closed local assembly with `project.yaml` (`Project`), `actors.yaml`
(`ActorSet`), `capabilities.yaml` (`CapabilitySet`) and `permissions.yaml`
(`PermissionSet`). The Project binds the other three manifests by explicit
relative source hints, declares the gate with typed capability target
`read_fixture`, names `fixture-reviewer` as its approver, and declares that
actor's `block_action` and `revoke_approval` controls. The required override
resume declaration points to a separate `fixture-resume` gate. The prototype
provides no resume entry point. The `CapabilitySet` declares `read_fixture`
with approval required by default. The `PermissionSet` has one matching
`approval_required` entry for `fixture-requester`, `read_fixture` and
`fixture-review`. The host resolves
these exact relations and rejects ambiguous references and unsupported
applicable rules. The resource ID is a host fixture key. Paths, URLs, commands,
scripts and manifest-supplied adapter names are outside the request shape.

The successful case allows one bounded adapter call and produces a result and
receipt in memory. The same scenario exercises denial by varying one input or
host fact at a time. The operation budget is one read of one fixture record,
with zero filesystem access, writes, network requests, credential lookups,
subprocesses, provider calls, extension loading and destructive actions.
The host rejects a nonzero request for any of those effects before dispatch.
This uses the zero-access case of the [network](../network-access-policy.md),
[credential](../credential-handling.md) and [security](../security-model.md) policies.

## Layout And Entry Points

| Component | Responsibility and dependency |
| --- | --- |
| `@nexflow/validation` | Existing pure parser and pinned schema/assembly checks through `parseSource` and `createValidator().validateDocuments`. |
| `@nexflow/cli` | Existing `nexflow validate`, `inspect`, `graph`, help and version. CLI startup and package dependencies stay within the static boundary. |
| Host contracts | Separate TypeScript package boundary for inert input, decision and receipt types. Imports only specification types if needed. |
| Prototype host | Separate TypeScript package. Imports validation and host contracts, owns preflight, admission and the final dispatch check. |
| Fixture adapter | Fixed host-owned implementation behind the contract. Receives only the admitted resource key. |

The proposed library interface has `preflight(request)` for a read-only
assessment and `runFixture(request)` for a single explicit attempt. Both use
host-owned facts from the fixture setup. `runFixture` performs preflight again
and keeps admission internal to the host. Its inputs accept data only. A prior
preflight result, CLI JSON, caller-provided approval or adapter response carries
zero authority. There is no runtime CLI command, daemon, registry lookup,
ambient discovery or executable extension entry point in this slice.

The CLI can validate declared policy shape through its existing static checks.
The host evaluates the resolved operation and current facts. Keep the CLI
output contract and its `executionAuthorized: false` behavior. The host
explicitly checks the supported policy relations for this scenario because the
library reports broader semantic and runtime checks as `not-run`. See the
[CLI and runtime boundary](../cli-runtime-boundary.md).

## Inputs And State Transitions

The request binds one attempt ID to the exact operation tuple `(project, actor,
capability, resource)` and a copied, immutable assembly. The host receives
explicit UTF-8 manifest bytes and canonical root-relative logical names in
memory. It rejects duplicates, aliases, unsafe or ambiguous names, unexpected
documents, unknown request fields, and unrecognized applicable policy. Match
the Project source hints to the supplied names exactly, with no discovery or
filesystem reads. Apply the existing parser limits before normalization.
Hash each original file with SHA-256, sort `[logicalName, hexDigest]` pairs by
logical name, and hash their compact UTF-8 JSON array with SHA-256 for the
assembly identity. Parse and validate those same bytes. Caller-reported
validation results and hashes are insufficient. Admission binds the assembly
identity, validator/API and schema identity, operation tuple, selected fixture
adapter, policy epoch, approval identity and its expiry to that attempt.

The host supplies the exact supported version pair, known capability and
adapter availability, resolved requester and reviewer identities, permissions,
operation budget, clock, current approval and current override state. Required
facts distinguish `unknown` from a known negative. Missing, stale, failed or
ambiguous facts are `unknown`. A known inactive override is a positive check.
Network, credentials and filesystem grants are inapplicable because the fixture
operation budget is zero for those domains. A positive requirement in any of
those domains makes the operation unsupported.

| Stage | State | Meaning |
| --- | --- | --- |
| Preflight | `invalid` | Malformed or inconsistent inputs or unsuccessful static validation. |
| Preflight | `unsupported` | Unknown version pairing, operation or required control outside this slice. |
| Preflight | `blocked` | Recognized operation with an unknown required fact, inactive adapter, override, missing permission, deny or unsatisfied approval. |
| Preflight | `ready` | All supported facts are known and current for this exact operation. The assessment can be displayed. |
| Admission | `denied` | Preflight is other than `ready`, authority changed, budget is unavailable or the intent receipt cannot be recorded. Zero adapter calls. |
| Admission | `admitted` | Current scoped checks and intent recording succeeded. Internal, one-use decision for this synchronous attempt. |
| Attempt | `completed` | Exactly one fixture read and a recorded outcome. |
| Attempt | `outcome-unknown` | Dispatch happened and the adapter failed to confirm a result or the host failed to record the outcome. Keep the intent and a visible gap, and block automatic replay and fallback. |

Check input shape and compatibility first, then validate the assembly and
resolve the operation. A manifest dialect rejected by the parser maps to
`unsupported`, while malformed input maps to `invalid`. Any non-ready state
blocks admission. Report stable reasons with stage and scope, distinguishing
known denial from missing facts.
For example, pending approval, revoked approval and unknown override must have
different reasons. Preflight errors during fact resolution become `blocked`
with the affected fact identified.

## Approval, Override And Dispatch

Evaluate [approval gates](../approval-gates.md),
[typed targets](../approval-gate-targets.md) and [human override](../human-override.md)
within the supported fixture slice. An explicit deny takes precedence over an
allow. The required approval comes from the fixture host and binds its declared
reviewer, gate, exact operation tuple, assembly digest, policy epoch and expiry.
The fixture clock and expiry use integer Unix milliseconds. Only an authentic
`approved` decision when `now < expiresAt`, with no revocation or
supersession, satisfies the gate. All other approval states and unknown approval
status deny admission. Known active `block_action` or `revoke_approval` denies
even with an otherwise current approval. The fixture supports no automatic
resume, restoration of grants or in-flight interruption.

After preflight and before dispatch, record an in-memory intent and re-read the
mutable facts. Recheck the bound identities, capability, policy epoch, budget,
approval, time and override. Compare, consume the one-use decision and invoke
the adapter within one synchronous host-controlled turn, without yielding or
calling untrusted hooks between the final check and the adapter. If the facts
change or become unavailable, record a denial and make zero adapter calls. A
test can change state after preflight or at intent recording to exercise this
boundary. Duplicate attempt IDs never dispatch again. A changed tuple under the
same ID is refused. No fallback, background retry or replay follows a gap.

The host keeps bounded in-memory intent and outcome receipts with attempt ID,
operation and assembly identity, policy epoch, stage, decision and stable
reason. When recording intent fails, return a denial even if the recorder
cannot retain it. When recording the outcome fails after dispatch, preserve the
in-process attempt marker and expose the gap in the result. Project public
evidence from an allowlist before returning it. Omit
raw manifests, absolute paths, credentials, raw exceptions and private payloads.
`outcome-unknown` must be visible even if the normal outcome recorder fails.
Receipts carry evidence of the attempt. Durable audit, crash recovery and
distributed revocation races require later qualification.

## Applicable Specification Slices

| Source | Required slice for review and NF-112 |
| --- | --- |
| [RFC-0025](../../rfcs/RFC-0025-reference-implementation-architecture.md) and [RFC-0005](../../rfcs/RFC-0005-validation-strategy.md) | Layout B imports and startup, exact static inputs and schema checks, separate host authority. |
| [RFC-0011](../../rfcs/RFC-0011-reference-cli-scope.md) | Preserve the published static CLI surface. |
| [RFC-0013](../../rfcs/RFC-0013-actor-model.md), [RFC-0015](../../rfcs/RFC-0015-typed-references.md) and [RFC-0007](../../rfcs/RFC-0007-approval-gates.md) | Explicit actor identity, exact scoped target and approval. |
| [RFC-0017](../../rfcs/RFC-0017-human-override.md) and [RFC-0022](../../rfcs/RFC-0022-security-policy-composition.md) | Override narrows authority, deny wins, applicable controls intersect and mutable facts are rechecked. |
| [RFC-0009](../../rfcs/RFC-0009-event-envelope.md) and [RFC-0010](../../rfcs/RFC-0010-provider-selection.md) | Correlated attempt evidence and host-owned adapter selection with no implicit fallback. Full event interoperability and real providers remain NF-113 or later scope. |

This profile applies the named slices. The owning RFC stages and manifest
semantics remain as recorded in the [RFC index](../../rfcs/README.md).

## Compatibility And Support

| Domain | NF-112 qualification target |
| --- | --- |
| Manifest and schemas | `specVersion: "0.1"` and the schema payload in `@nexflow/validation@0.5.0-alpha.1` built at `89292102783454140671d706c234f8e6d17a337c`. Its published schema index SHA-256 is `48e16e4d7b4d8859193e740342cf3305b890064b2e03eb8fce259ee0db378bf8`. No manifest migration. |
| Library | `validation-api-v1-preview` with that exact package and schema payload. |
| Static CLI | Published `@nexflow/cli@0.5.0-alpha.1`, JSON `0.5-preview.1`. No host import or host command. |
| Host interface | Proposed `host-preflight-v1-preview`, paired only with the listed validator/API/schema tuple. Separate source-only fixture entry, no stable ABI or package version assigned. |
| Toolchain | TypeScript `6.0.3`, external Node.js `26.13.1` and npm `11.20.0` for the prototype qualification. |
| Platforms and support | NF-112 records actual OS, architecture and exact revisions for the fixture runs. NF-113 qualifies applicable targets and controls separately. Prototype-only, single-maintainer best effort. |

Incompatible or unknown pairings fail before constructing the fixture adapter.
The release line `0.6` is a planning target. The eventual claim can name only
the tested fixture, version pair, controls and actual platforms. This proposal
carries no `NF-RUNTIME`, `NF-CLI`, provider, production or OS sandbox claim.

## NF-112 Acceptance Evidence

| Case | Required observation |
| --- | --- |
| Valid fixture and current approval | Preflight is `ready` with zero adapter calls. An explicit attempt completes with one call, the fixed result and matching intent/outcome receipts. |
| Invalid or changed assembly, unknown fields, version skew, unsupported operation or missing capability | Explicit refusal and zero calls. Exercise changed bytes against the original approval binding. |
| Absent allow, explicit deny, pending/rejected/expired/revoked/superseded approval, wrong reviewer or scope | Admission denies with the applicable reason and zero calls. Test expiry at the boundary as well as after it. |
| Unknown state, active override, revocation or policy change after preflight | Admission denies with zero calls, including when the change is injected at intent recording before the final check. |
| Out-of-budget effect, intent recording failure, duplicate or changed request under the same attempt ID | Zero new calls, bounded failure receipt and no alternate dispatch. |
| Adapter outcome or outcome receipt unavailable | One attempted call at most, `outcome-unknown`, retained intent and gap. Retrying the same attempt causes zero additional calls. |
| Static CLI and public output | Existing CLI guardrails pass with no host initialization. Decision/receipt checks assert stable reasons and absence of raw private inputs. |

Record exact commits, inputs, toolchain and platform, ordered decisions,
adapter call counts, refused effects and redacted receipts. Test the positive
and negative paths using only synthetic data. Report failed and untested cases
explicitly. Review the fixture scope and proposed version pairing before
NF-112. NF-113 owns the broader policy, event and target qualification. NF-114
owns any later release review.
