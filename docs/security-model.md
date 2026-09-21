# Security Model

NexFlow treats safety as part of the specification, not an implementation afterthought.

## Scope And Status

This model covers authored policy, offline repository tooling, and conditional
future runtime behavior. It does not establish that a deployment is secure.

| Surface | Current evidence | Boundary |
| --- | --- | --- |
| Manifests, schemas, examples, and maintained profiles | Structural validation and selected reference checks. | Valid data is not an authenticated identity, permission decision, or execution grant. |
| Repository CLI prototype | Offline discovery, validation, inspection, graphing, and bounded authoring, with regression guardrails. | No runtime preflight, provider invocation, credential resolution, executable extension loading, or workflow execution. |
| Future runtime and integrations | Specification contracts and draft proposals. | Authentication, policy enforcement, isolation, cancellation, and audit durability remain unimplemented. |

The owning domain documents below retain their status and authority.
[RFC-0022](../rfcs/RFC-0022-security-policy-composition.md) proposes the
cross-boundary evaluation and failure handling described in the **Draft Policy
Composition** section. It remains Draft; documenting that proposal does not
accept it or add a policy evaluator. The [Threat Model](threat-model.md) supplies
attacker stories and assumptions, while [Validation](validation.md) and the
[Compatibility Matrix](compatibility-matrix.md) bound implementation claims.

## Trust Boundaries

Each boundary needs its own evidence. Trust in one layer does not transfer
automatically to another.

| Input or transition | Required distinction | Owning contract |
| --- | --- | --- |
| Authored identity to acting principal | A declared actor ID is not authentication; a future host binds the principal to the intended project and actor. | [Actor Model](actor-model.md), [Human Override](human-override.md) |
| Manifest assembly to requested configuration | Unique active selection describes a request; project and domain policy may only narrow it. | [Effective Agent Configuration](effective-agent-configuration.md) |
| Context, prompts, retrieved documents, and remote output to local action | Content may propose an action, but cannot become permission, approval, or policy. | [Context Model](context-model.md), [Prompt Sets](prompt-sets.md), [MCP And A2A Boundaries](mcp-a2a-boundaries.md) |
| Extension metadata to executable implementation | Discovery, integrity, installation, and action authorization are separate decisions. | [Extension Registry Model](extension-registry.md), [Extension Loading Boundary](extension-loading-boundary.md) |
| Selected provider to invocation | Selection and adapter support do not grant disclosure, connectivity, credentials, or tool execution. | [Provider Adapter Boundary](provider-adapter-boundary.md) |
| Task-local data to durable or shared memory | Persistence, promotion, reuse, and deletion need explicit scope and handling. | [Memory Model](memory-model.md) |
| Decision or external event to audit storage | Evidence must be classified and redacted; persistence cannot authorize the recorded action. | [Event And Audit Storage Boundary](event-audit-storage-boundary.md) |

## Principles

### Least Privilege

Actors receive only the capabilities, permissions, context, and memory access needed for their responsibilities.

### Explicit Permissions

Capabilities do not authorize action. Permissions decide whether a capability is allowed, denied, or gated.

Future runtimes should evaluate permission rules before using any capability. A declared capability without a matching permission should be treated as unavailable for that actor.

### Approval Gates

Sensitive actions should require explicit approval.

Approval gates are described in [Approval Gates](approval-gates.md). They should be scoped, auditable, and human-owned for high-risk actions.

[RFC-0007](../rfcs/RFC-0007-approval-gates.md) proposes draft approval semantics for declarations, requests, decisions, evidence, scope, expiry, revocation, and future runtime enforcement boundaries.

### Auditability

Important state changes should emit events and preserve enough context for later review.

[RFC-0009](../rfcs/RFC-0009-event-envelope.md) proposes draft event envelope semantics for event identity, actor, subject, correlation, causation, payload, audit metadata, redaction, ordering, and future runtime boundaries.

[Event Interoperability](event-interoperability.md) defines how those fields may
be projected to CloudEvents and OpenTelemetry while keeping external records
non-authoritative and transport, collectors, and storage out of scope.

[Event And Audit Storage Boundary](event-audit-storage-boundary.md) requires
classification, minimization, and redaction before persistence or export;
separates audit records from telemetry and evidence; and makes ordering,
retention, deletion, access, integrity, durability, and failure claims explicit.
Audit persistence never grants authority for the recorded action.

### Credential Handling

Credentials must never be implied by context, provider, extension, integration,
network, or capability access. Raw values and secret-store locators must remain
outside manifests.

The structured [Credential Handling](credential-handling.md) policy declares
opaque requirement references, exact actor, capability, purpose, and target
scope, operation-only leases, independent approval, fixed no-ambient and
no-direct-exposure controls, fail-closed outcomes, and redacted audit events.
A matching rule only permits a future runtime to request an external binding;
it does not grant the protected action or prove that a credential exists.

This repository does not implement credential storage, a broker,
authentication, injection, rotation, revocation, or runtime isolation.

### Secret Management

Secret creation, storage, rotation, and revocation remain external operational
responsibilities. Manifests should not contain raw secrets or secret-store
locators. A credential reference names a project requirement only; it is not a
deployable secret binding.

### Destructive Operations

Destructive operations require human approval and audit events.

### Network Access

Outbound network access must be fail-closed, declared, and scoped by actor,
purpose, destination, transport, data classification, permission, and approval.

The structured [Network Access Policy](network-access-policy.md) uses an explicit
deny default and deterministic rules. Context sources, provider declarations,
extensions, capabilities, permissions, and approvals remain independent policy
layers; none grants connectivity by reference or presence alone.

Legacy free-text `networkAccess` values remain advisory during the `0.1` draft
migration. A future runtime must not parse them into allow rules.

### Provider Selection

Provider preferences and provider declarations do not grant access. Future runtimes should apply project policy, permissions, approval gates, context boundaries, memory boundaries, model profile constraints, and fallback rules before calling a provider.

[RFC-0010](../rfcs/RFC-0010-provider-selection.md) proposes draft provider selection semantics for preferences, constraints, fallback, explainability, audit, and future runtime boundaries.

Selection does not authorize invocation. The future
[Provider Adapter Boundary](provider-adapter-boundary.md) keeps provider-specific
translation subordinate to host policy, requires mediated credential and
network handles, forbids adapter-local fallback and direct tool execution, and
requires normalized redacted audit evidence.

### Context Boundaries

Context sources should be classified conservatively and should not be expanded through provider defaults, extensions, cached data, or MCP tools. Web context should define freshness and domain boundaries where possible.

### Memory Boundaries

Memory writes are higher risk than context reads because they can persist and reuse information after the task ends. Durable or sensitive memory should declare ownership, visibility, allowed consumers, allowed writers, prohibited content, promotion paths, audit events, and approval gates where needed.

[RFC-0008](../rfcs/RFC-0008-memory-retention.md) proposes draft memory retention semantics for scopes, ownership, visibility, consumers, writers, sensitivity, promotion, correction, deletion, expiry, audit, and future runtime boundaries.

### Prompt Boundaries

Prompt sets can contain sensitive operational guidance even when they do not contain credentials. Public manifests should prefer prompt source references, revisions, digests, ownership, and review metadata over raw prompt text when disclosure would expose internal controls, private workflows, or sensitive escalation rules.

Raw prompt text must not contain secrets, tokens, passwords, private keys, raw personal data, or sensitive regulated details.

### Retrieval Boundaries

Retrieval profiles can combine context from multiple sources. Future runtimes should treat assembled context as at least the strictest classification among retrieved sources unless project policy explicitly defines a stricter rule.

Retrieval profiles should not broaden context access. They should reference declared context sources, respect freshness and citation requirements, avoid silent cross-scope reuse, and preserve approval gates for restricted or tool-backed sources.

### Agent Definition Boundaries

The unique unscoped active agent definition is authoritative for requested
model, prompt, retrieval, permission, capability, context, memory, autonomy, and
extension references. A future runtime must not treat those requests as grants.
Permission, context, memory, provider, project, task, workflow, human-control,
and runtime policy can only narrow the request.

Safety-significant definition changes, such as broader context access, broader
memory scopes, higher autonomy, new high-risk capabilities, or less restrictive
approval gates, require a complete approved active definition. Missing or
ambiguous active selection must fail closed.

### Extension Loading Boundaries

Extension declarations and maintained profiles are data, not trusted executable
code. Future runtimes must separate project declaration discovery from
implementation discovery, resolve implementations only from explicit
runtime-owned sources, verify immutable artifact identity, reject ambiguity,
and isolate loaded code from ambient filesystem, network, process, credential,
context, memory, and provider access.

Installation, enablement, loading, and activation do not grant authority. Every
extension operation must still satisfy capability, permission, approval,
autonomy, context, memory, network, credential, and human-override policy.
Unsupported behavior must remain inert and fail closed. See
[Extension Loading Boundary](extension-loading-boundary.md).

### Validation Tool Boundaries

The initial reference CLI must operate offline on explicit local inputs. Static
validation, inspection, and graph commands may not resolve credentials, load
executable extensions, call providers or integrations, start manifest-selected
processes, perform runtime preflight, or mutate project state. `init` and
explicit output files are the only bounded authoring writes.

Shared parsing and validation libraries must not initialize runtime services or
ambient authority when a validation command is selected. A successful CLI
result is not approval or evidence that the current deployment can execute the
project. See
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md).

### Human Override

Humans must be able to stop or override future runtime activity through an
explicit, fail-closed policy.

The structured [Human Override](human-override.md) model declares
human-controlled authorities, supported pause, stop, cancel, block, and
revocation operations, in-flight response, approval-gated resume, and audit
events. Override can only narrow behavior. It cannot grant access, approve an
action, erase a deny, or raise autonomy.

[RFC-0017](../rfcs/RFC-0017-human-override.md) records the broader proposal and
remaining runtime questions.

## Unsafe Defaults to Avoid

- global repository write access
- treating capabilities as permissions
- implicit command execution
- implicit access through integrations or extensions
- provider access to all context
- ambient credential discovery or direct credential exposure to an actor
- credential reuse across actors, targets, purposes, operations, or provider fallback
- unbounded memory writes
- automatic cross-scope memory promotion
- retaining secrets or credential values in memory
- storing sensitive raw prompt text in public manifests
- retrieving undeclared sources or silently broadening retrieval scope
- using stale context without citation or warning when freshness matters
- activating broader agent definitions without review
- automatic resume after a human override or failed interruption
- allowing agents, automations, or services to act as human override authorities
- silent network access
- treating context, provider, extension, DNS, redirect, or proxy metadata as an implicit network grant
- discovering executable extensions through ambient paths or installing them because a namespace is declared
- treating an extension signature, installation, enablement, or activation as an action grant
- following redirects or resolved private addresses without re-evaluating policy
- automatic deployment
- destructive actions without approval

## Permission Evaluation Expectations

Future runtimes should use conservative permission evaluation.

Recommended behavior:

1. Confirm the actor has the requested capability declared.
2. Find permission rules that apply to the actor, role, workflow, or project scope.
3. Treat explicit `deny` as strongest.
4. Treat `approval_required` as blocked until the approval gate is satisfied.
5. Treat `allow` as valid only inside the declared scope and conditions.
6. Reject the action if no applicable permission exists.
7. Emit audit events for high-risk or approval-gated actions.

This order prevents broad allow rules from accidentally bypassing narrower deny or approval-gated rules.

## Draft Policy Composition

This section summarizes the proposal in
[RFC-0022](../rfcs/RFC-0022-security-policy-composition.md). The sequence is a
review model for a future host, not an implemented algorithm, runtime API, new
manifest kind, or replacement for domain-specific rule matching.

### One Operation, All Applicable Boundaries

A proposed action should identify its project, authenticated actor, requested
capability, purpose, exact target, input classification, and relevant task or
workflow scope. For an agent, it also identifies the selected active definition
and component revisions. Descriptions, display names, remote identities, and
tool-provided scope must not silently substitute for these bindings.

The future host should resolve all applicable policy layers for that operation:

1. Resolve identity and configuration without ambiguous or implicit fallback.
2. Check human override and effective autonomy. A stop, pause, or revocation
   cannot be cleared by an allow rule or an approval elsewhere.
3. Confirm the action capability and evaluate every applicable permission.
   Explicit deny wins; all applicable approval requirements remain blocking
   until satisfied. No matching allow or satisfied approval-required rule means
   no permission. Rule order or a broad allow must not hide a narrower deny.
4. Constrain data reads, disclosure, retrieval, writes, and memory promotion
   using the relevant context, memory, classification, and provider policies.
5. Check extension and adapter support when used. For network or credential
   use, independently check the relevant capabilities, permissions, structured
   policy rules, and approvals. Follow each domain's matching algorithm; do
   not combine rules from different layers to manufacture a grant.
6. Verify every applicable task, workflow, action, data, network, and credential
   approval against the intended scope, evidence, decision authority, expiry,
   and revocation state. One satisfied gate cannot discharge another gate.
7. Check enforcement support, operation limits, and required pre-effect audit.
   Recheck mutable authority immediately before the effect, then hand only the
   bounded operation to the responsible component.

Authorization is the intersection of applicable policy decisions. A layer may
be inapplicable only for a documented reason based on the operation: an offline
local read, for example, does not require a network connection or a credential
lease. Absence of required policy or evidence is not non-applicability.

An unresolved reference, ambiguous identity, unknown restrictive fact,
unsupported required control, failed policy lookup, or pending approval should
block the effect. Record the reason accurately; an unresolved check is not a
successful denial test or a successful authorization. These descriptions do
not add diagnostic codes or approval states to the current schemas.

### Freshness, Revocation, And Uncertain Outcomes

The proposal binds a decision to the reviewed operation and relevant policy,
configuration, target, artifact, approval, and input revisions. A decision for
one scope is not reusable authority for another actor, project, purpose,
destination, or artifact. The same textual reference does not prove that its
underlying content is unchanged.

A change to a relevant revision, expired or revoked approval, human override,
changed destination, or provider fallback should invalidate the affected
decision and return it to evaluation. Newly required or invalidated approvals
must be obtained before proceeding. Retry, resume, delegation, and fallback
should each be reviewed in their actual scope; they cannot inherit authority
merely because the original operation passed.

Checking before an effect is necessary but does not by itself solve races.
A future implementation must state how it detects changes between evaluation
and use, blocks new effects after revocation, invalidates operation handles,
and reports effects already in flight. It must not claim that cancellation
rolls back a completed external action.

A timeout or lost acknowledgement may mean the effect completed. In that case,
block blind replay and record the uncertain outcome. Any reconciliation,
compensation, or retry is independently authorized, bounded, and audited.
Exactly-once execution and rollback are not promised by this model.

### Untrusted Content And Delegation

Repository text, retrieved documents, tool descriptions, remote messages,
model output, and imported events remain data at the authorization boundary.
Instructions embedded in them cannot change local policy, appoint an approver,
raise autonomy, disclose credentials, or suppress audit. Provenance and an
integrity digest can establish origin or content identity; they do not make
instructions authoritative or prove the content safe.

For example, a retrieved document that asks a reader to upload local files does
not authorize that upload. A proposed tool call needs its own exact action,
target, data-disclosure, permission, network, credential, and approval checks.
Filtering prompt text alone is not an enforcement boundary.

A handoff or remote task also conveys no implicit delegation of local grants.
The receiver needs its own actor binding and policy evaluation. Returned
artifacts retain provenance and classification and enter local namespaces only
through the explicit import rules of the relevant integration. Neither a
remote success message nor a stored approval event is a local approval token.

### Bounded Work And Audit Failure

The proposed host should set explicit limits for execution time, requests,
retries, concurrency, data volume, output, and retained state where relevant.
Exhaustion or unsupported limit enforcement blocks further work rather than
selecting a less restrictive provider, integration, or storage path. This does
not add configurable budget fields to current manifests or claim that the
prototype is protected against every resource-exhaustion attack.

Audit evidence should identify the operation, actor, target, relevant revisions,
applied policy and approval references, outcome, and uncertainty using minimal
redacted metadata. Do not copy raw prompts, credentials, or sensitive payloads
into a denial record. Follow the
[audit storage failure contract](event-audit-storage-boundary.md): failure to
record required pre-effect audit blocks the effect; loss after an effect must
be reported as an audit gap with the actual known outcome. A logging failure
cannot turn an executed or uncertain action into a claim that nothing happened.

## Security Review Scenarios

These are manual specification review cases, not executable fixtures or proof
that runtime enforcement exists. Cases involving composition apply to the
Draft proposal above; linked domain controls keep their existing status.

| Case | Expected boundary | Evidence to review |
| --- | --- | --- |
| An offline local read has a bound actor, declared capability, matching permission, and allowed context, with no applicable gate or override. | Eligible only within that exact scope in a future runtime; it grants no write, network, or credential access. | Capability, permission, context, autonomy, and override decisions. |
| A broad allow and a narrower applicable deny cover the same write. | Block the write regardless of rule order or approval. | All matching permission rules and scope resolution. |
| A task gate is approved while a required network or credential gate is pending. | Block the effect; approvals do not substitute across layers. | Every applicable gate and the corresponding domain decisions. |
| Approval covers one artifact revision, but the artifact or target changes before use. | Re-evaluate and satisfy any invalidated approvals before acting. | Reviewed and current revisions plus decision scope. |
| Retrieved content asks for an upload or returns a tool request naming a different target. | Treat it as an untrusted proposal and check the actual requested effect independently. | Provenance, data classification, target binding, and independent authorization. |
| A handoff names a local actor or carries a remote success or approval event. | Do not impersonate that actor or transition local state automatically. | Authenticated identity mapping, import rules, and local transition policy. |
| A provider fails and another target is available. | Re-evaluate the permitted fallback; do not reuse scoped credentials or drop restrictive data policy. | Model profile, adapter, provider constraints, network, and credential scope. |
| A stop arrives after evaluation or an effect times out without acknowledgement. | Block new work and blind replay; retain the known or uncertain in-flight outcome. | Override, cancellation, handle invalidation, and reconciliation evidence. |
| Required audit storage is unavailable before an effect. | Block the effect; do not silently use an unapproved sink. | Audit requirement, redaction, storage failure, and gap handling. |
| A required isolation control or operation limit is unsupported. | Block the affected operation and report unsupported enforcement. | Implementation support and explicit limit evidence. |
| Schema and CLI guardrail checks pass. | Report only the checked static and prototype behavior. | Exact revision, command results, limitations, and scoped conformance claim. |

## Review Evidence And Compatibility

A security review should record the exact revision and changed surfaces,
crossed trust boundaries, applicable scenarios, expected outcome, evidence,
unresolved assumptions, and reviewer decision. Distinguish manual contract
review, executable structural checks, and future runtime tests. Mark missing
evidence explicitly instead of treating a proposed control as implemented.

Focused repository checks include approval gate targets, active-definition
authority, credential handling, human override, provider constraints, extension
profiles, selected semantic references, and CLI no-runtime guardrails. Run the
complete suites in the [repository workflows](../.github/workflows/) as well.
None of those checks evaluates the complete proposed policy intersection,
authenticates a principal, proves isolation, or tests live cancellation races.

This documentation and Draft RFC add no fields, schema constraints, profile
version, CLI output, or executable behavior. No version bump or migration is
needed for this proposal. Acceptance that changes normative authorization
semantics requires an explicit compatibility and version decision even if the
manifest shape stays unchanged. See [Versioning](versioning.md).

## Example Safety Cases

### Read Access Without Write Access

An agent may have `read_repository` allowed while `write_repository` is absent or denied. A runtime should let the actor inspect files but reject file writes.

### Tool Access Without Command Execution

An MCP integration may expose tools, but `access_mcp` does not automatically imply `execute_command`. These capabilities should be granted or gated separately.

The initial [MCP Extension Draft](../extensions/mcp/README.md) additionally
requires an allow-list and approval posture for action-bearing surfaces. A
networked MCP transport must satisfy network policy separately, and credentials
must remain outside manifests.

### Remote Agent Metadata Without Local Authority

An A2A Agent Card may advertise agents, skills, authentication requirements,
and protocol capabilities, but none of that metadata grants local authority.
The [A2A Extension Draft](../extensions/a2a/README.md) requires explicit local
identity binding, `access_a2a`, action-specific capabilities, permissions,
approvals, network policy, external credentials, provenance, and audit.

Remote tasks cannot transition local work automatically. Remote artifacts must
not enter the NexFlow artifact namespace without explicit classification,
integrity checks, provenance-preserving import, and collision handling. A2A
push callbacks remain unsupported until an inbound network policy is defined.

See [MCP And A2A Boundaries](mcp-a2a-boundaries.md).

### Pull Request Creation With Review

An implementation agent may draft changes but require approval before `create_pull_request`. The review gate should be visible in permissions, tasks, or workflow steps.

### Deployment Requires Human Authority

`deploy_application` should be denied or gated for agents by default. Approval should come from a declared human authority or release policy.

## Future Runtime Security Requirements

A conforming runtime should:

- enforce capability and permission checks
- enforce approval gates
- honor declared human override blocking and fail-closed resume requirements
- isolate credentials
- log approval decisions
- log sensitive events
- reject unsupported manifest versions
- clearly report unsupported extension behavior
- resolve extension implementations from explicit sources, verify immutable artifacts, isolate loaded code, and authorize every operation independently
- keep provider selection host-owned, constrain adapters to one authorized target, and route fallback through a fresh policy decision
- classify, minimize, redact, and validate audit records before persistence or export, and fail closed when required pre-effect audit cannot be recorded
- distinguish designated audit storage from queues, indexes, telemetry, archives, and evidence stores, with explicit ordering, retention, deletion, access, integrity, and gap behavior
- deny outbound requests that lack a matching structured network policy rule
- re-evaluate DNS results and redirects against private-network, loopback, scheme, port, and destination constraints
- redact credentials, headers, query data, and payloads from network audit records

## Threat Model

The [NexFlow Threat Model](threat-model.md) applies these principles to the
current repository and the conditional future runtime. It identifies assets,
actors, trust boundaries, prioritized attacker stories, existing and planned
controls, assumptions, unknowns, and severity calibration. It is not a claim
that runtime controls are implemented or that a vulnerability has been found.
