# Proposed Static And Future Host Boundaries

These are proposed design contracts with inert failure models, not an executable
runtime, a durable storage implementation or a claim of public distribution.
Actual validation-only native qualification is linked separately. The same
frozen dialect/corpus/oracle and experimental public diagnostics remain in use.

## Components, Imports And Startup

Layout B separates spec, validation, CLI, host contracts, future host, adapters
and executable-extension implementations. Package names are logical ownership
domains, not newly published packages. `layouts.json` fixes the inward graph.
Spec imports no authority; validation imports spec; CLI imports spec/validation.
Host imports validation and host contracts. Adapters/extensions import host
contracts only and cannot import a credential broker or a store implementation.

CLI startup parses local arguments, selects an explicitly supported version
pair and constructs only static file/schema inputs. It never constructs a
credential broker, provider SDK, catalog loader, scheduler, effect handler or
audit store. Import/version negative models reject outward edges, cycles and
unsupported spec/diagnostic/API pairs. Existing native sandbox tests establish
actual denied effects independently of this graph; a directory layout alone is
not a sandbox. The proposed future package graph is not already implemented.

The current experimental root-bound library facade performs declared read-only
filesystem work; it is not a filesystem-free kernel. The proposed package split
puts rooted discovery/byte reads in a CLI/host workspace adapter. Its pure kernel
accepts parsed documents, immutable local schema values and normalized fragments
and returns diagnostics/results without file, network, credential or store
constructors. That split is a future implementation contract, not a refactor
silently applied to the frozen candidate. Native confinement proves the existing
facade's bounded effects independently; inert graph tests prove the proposed
allowed dependency/initialization rules, not a shipped future package closure.

The current prototypes support validate/inspect and seven experimental
library operations. Full project semantic validation, Core/extension profile
conformance, graph/init, production runtime and a stable public ABI are not
established by the prototypes. The historical JavaScript reference graph/init
commands keep their existing source, tests, effect budgets and release status;
they are not renamed into the selected native candidate. Future porting must
prove those commands' budgets before an NF-CLI support claim is expanded.

## Host Authority, Catalog And Credentials

Authored manifests and protocol messages are data, never grants. A host-issued
grant binds provider, project, job, step, operation, resource, expiry and policy
epoch. Forged, expired, revoked, mismatched or ambiguous requests fail closed.
Check at admission and again immediately before the effect. No audit receipt,
adapter, model or transport can widen permissions, approval, context/memory,
network policy, human override or production/destructive-action authority.

The catalog separates declaration, discovery, resolution, immutable digest
verification, inert loading and activation. Stage skipping, wrong digests,
unknown/inactive entries and implicit fallback fail. Current declarations remain
nonexecutable and cannot enable network or credential access. Future executable
loading requires its own pinned artifact/native isolation implementation and
qualification; the model does not dynamically import candidate-selected code.

The host selects exactly one provider per operation. Fallback requires a new
explicit host selection, matching grant and audit receipt; an adapter cannot
choose a second target. Opaque credential handles are issuer-bound and scoped
to that same operation/epoch. The fake broker proves no public secret is returned
and rejects forged/revoked/cross-scope handles. No real store, token, provider or
network client is supplied by these models. MCP/A2A envelopes must pass the same
local admission checks; external identity, permissions, task/artifact/context
claims do not become local authority through transport support.

## Events, State, Durability And Recovery

Authored EventSet declarations remain schema data. Runtime instances, audit
receipts, projections, telemetry and credential state are distinct domains.
The proposed host-owned journal interface appends immutable sequence/previous-
digest records and rejects reordered, missing or corrupted recovery input.
Recovery also requires an externally retained host-owned trusted count/head
anchor. An unanchored hash chain does not authenticate a maliciously rewritten
journal; missing/mismatched anchors and recomputed replacement chains reject.
Every effect has a durable-intent precondition; failure before that receipt
means no effect. A failed post-effect receipt produces outcome-unknown with
automatic retry disabled. Explicit reconciliation records observed/no-effect
status. Idempotency keys bind the request digest; a different request under the
same key is rejected. Digest serialization sorts object keys while preserving
array order, so harmless JSON object-key reordering does not duplicate or reject
an already completed operation. Unknown request fields reject before admission.
Recovery restores receipts/gaps without replaying effects.

The in-memory model simulates these failures and recovery; its array is not a
disk durability proof. The future backend must implement atomic append+fsync,
bounded record size, access checks, crash-consistent recovery and integrity
verification before deployment. Journal authority does not imply workflow,
approval, permission or human-override authority. Access remains scoped to the
owning project/job and a separate operator export grant.

Correlation, causation, actor/operation identities, policy decision/revision,
grant epoch, redaction provenance and schema version are required future event
envelope fields. Unsupported/missing fields must reject publication. Public
projection happens before persistence/export; private/native-detail injection
fails closed before any queue. Downstream mutation cannot alter queued data.
Lossy telemetry is explicitly non-authoritative and cannot replace an audit
receipt. Export failure preserves the source journal and reports failure.
Deletion requires an authorized, verified export, acknowledged receipt and no
active run/gap; retention eligibility is a model decision, not an actual delete.

## Compatibility, Migration And Ownership

Spec `0.1`, diagnostics `nf-validation-diagnostics-v1`, `evaluation-api-v1` and
`evaluation-cli-v1` form the only proposed experimental pair. Unknown/skewed
pairs reject before initialization or effects. These are logical compatibility
IDs, not product version bumps. Separate package releases need explicit reviewed
pairs; colocating packages never grants compatibility automatically.

Existing manifests, frozen fixtures and public JSON projections are unchanged.
No product data or persistent runtime state exists to migrate here. Real V1→V2
evaluation install/upgrade/rollback is tested in NF-102-03; future package ABI,
configuration and journal migrations need versioned readers, dry validation,
backup and reversible activation. Unknown formats must reject; rollback cannot
reuse a receipt for a different operation or automatically replay a gap.

Alexander Agafonov retains the seven existing bounded NF-101 roles: pre-release
best effort, no SLA, no invented backup/on-call/signing authority. Production
runtime implementation, broader target claims, signed public delivery and
release publication remain separate work and require their own evidence.
The proposed journal/backend and executable adapter interfaces are design-only.

## Residual Risks

No kernel compromise, hostile privileged parent, arbitrary OS IPC/broker,
universal secret detection, public trust signature or future runtime security
certification is claimed. Unix sampled memory enforcement permits bounded poll
overshoot; Windows traffic isolation is not universal syscall denial. Public
OS/runtime read exceptions and interpreter prerequisites remain explicit.
Dependency/advisory records retain their original dates and bounded applicability;
zero version matches are not a proof that an entire ecosystem is safe. Refresh
qualification after source, locks, runtime, OS image or authority changes.
