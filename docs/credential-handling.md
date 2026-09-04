# Credential Handling

Credentials are a first-class safety boundary for work that authenticates to a
provider, integration, context source, package registry, artifact service, or
other protected system.

NexFlow manifests describe credential requirements and policy. They MUST NOT
contain credential values, secret-store locators, environment-variable names,
private keys, passwords, tokens, cookies, authorization headers, recovery
codes, or other material that can authenticate a request.

This repository specifies and structurally validates the declaration model. It
does not implement a credential broker, inspect a secret store, authenticate an
actor, mint a token, inject a value, contact a target, rotate a credential, or
enforce runtime isolation.

## Scope

The initial model covers outbound operations that require authentication:

- provider requests
- remote context reads
- integration reads and writes
- package downloads
- artifact transfers
- webhook delivery
- extension-defined custom purposes

The model defines opaque requirement references, actor and target scope,
capability narrowing, approval, operation-scoped leases, fail-closed behavior,
and redacted audit expectations.

Interactive login, user account enrollment, secret creation, secret-manager
administration, browser sessions, inbound service authentication, signing key
custody, certificate issuance, hardware security modules, and recovery flows
remain outside the initial core model.

## Terms

| Term | Meaning |
| --- | --- |
| Credential material | A value or cryptographic capability that can authenticate or authorize a request. It never belongs in a NexFlow manifest. |
| Credential reference | A non-secret, project-local handle such as `coding-provider-access`. It names a requirement, not a secret-store path or proof that a credential exists. |
| Credential rule | A project policy entry that narrows which actor may request one credential reference for a purpose, target, and capability set. |
| External binding | A runtime-owned association between a credential reference and a credential broker entry. It is deployment state, not specification state. |
| Credential broker | A future host-controlled component that resolves an authorized reference without exposing unrelated credentials. NexFlow does not select an implementation. |
| Lease | Short-lived runtime authority to use one resolved binding for one operation. A lease is not reusable project permission. |
| Mediated use | Applying authentication inside a trusted adapter or transport boundary without returning raw material to the requesting actor or model. |

## Core Rules

- Credential values remain outside manifests, bundles, examples, diagnostics,
  graphs, inspection output, conformance claims, events, and audit records.
- Omission of `credentialHandling` grants nothing.
- The structured policy default is always `deny`.
- `project.policies.secretHandling` remains human-readable guidance only. A
  runtime MUST NOT parse it into credential authority.
- A credential reference is not proof that a usable external binding exists.
- A matching credential rule does not grant a capability, permission,
  approval, network access, provider selection, context access, integration
  access, autonomy, or execution authority.
- Explicit deny takes precedence over approval-required and allow rules.
- Missing, ambiguous, expired, revoked, mismatched, or unavailable bindings
  fail closed.
- Ambient process state, inherited environment variables, user keychains,
  default cloud profiles, browser sessions, and local configuration MUST NOT be
  discovered as implicit bindings.
- Credential use is operation-scoped. Renewal requires a new policy and
  authorization decision.
- A runtime may apply stricter organization, deployment, sandbox, broker, or
  target policy.

## Project Policy Shape

Structured credential policy lives at `project.policies.credentialHandling`.

```yaml
project:
  policies:
    credentialHandling:
      default: deny
      rules:
        - id: coding-provider-credential
          description: Permit reviewed model requests through the selected provider adapter.
          credentialRef: coding-provider-access
          kind: api_key
          effect: approval_required
          actors:
            - implementation-agent
          capabilities:
            - use_credential
          purposes:
            - provider_request
          targets:
            providers:
              - coding_reasoning
          lease:
            scope: operation
            renewal: reauthorize
            maxDurationSeconds: 900
          approvalGate: credential_access_review
      controls:
        valuesInManifests: forbidden
        ambientDiscovery: deny
        directActorExposure: deny
        delegation: deny
        persistence: deny
      audit:
        events:
          - credential.decision
        recordDecisions: true
        recordActor: true
        recordCredentialRef: true
        recordTarget: true
        redactValues: true
```

The fixed control values are safety invariants in the initial model. They are
not implementation preferences and cannot be weakened by a rule.

## Policy Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `default` | Yes | Unmatched requests are denied. The only initial value is `deny`. |
| `rules` | Yes | Credential rules. An empty list denies every credential request. |
| `controls` | Yes | Fixed rules for values, discovery, exposure, delegation, and persistence. |
| `audit` | Yes | Required decision evidence and value redaction. |

Unknown fields are rejected inside this policy. Credential behavior is too
sensitive for an implementation to infer authority from undeclared keys.
Future extensions require a reviewed schema and compatibility decision.

## Rule Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable project-local policy rule ID. |
| `description` | Yes | Human-readable purpose and boundary. |
| `credentialRef` | Yes | Opaque, non-secret requirement handle resolved by future runtime deployment policy. |
| `kind` | Yes | Expected authentication mechanism, not a stored value. |
| `effect` | Yes | `allow`, `deny`, or `approval_required` at the credential policy layer. |
| `actors` | Yes | Actors for which the rule may match. |
| `capabilities` | No | Capabilities that narrow the rule. They are not granted by the rule. |
| `purposes` | Yes | Operations for which this reference may be requested. |
| `targets` | Yes | Exact protected resources or domains for which the reference may be used. |
| `lease` | Yes | Operation-only scope and mandatory reauthorization for renewal. |
| `approvalGate` | Conditional | Required only for `approval_required`. |

Rule order, YAML order, source-file order, and extension loading order have no
effect on the decision.

## Credential Kinds

The initial vocabulary is:

| Kind | Intended requirement |
| --- | --- |
| `api_key` | API-key authentication applied by a trusted adapter. |
| `access_token` | Bearer or service access token. |
| `oauth_token` | OAuth-derived access authority. Refresh behavior remains broker-owned. |
| `password` | Password authentication mediated without direct actor exposure. |
| `ssh_key` | SSH authentication through a trusted transport or signing boundary. |
| `client_certificate` | Client certificate and associated private-key authority. |
| `workload_identity` | Federated or platform workload identity without a manifest-held secret. |
| `custom` | Reviewed extension-defined mechanism. Unknown semantics fail closed. |

`kind` supports compatibility and broker selection checks. It does not reveal
the credential, identify an account, select a secret manager, or authorize a
fallback to another kind.

## Purpose And Target Scope

Credential purposes use the same initial operation vocabulary as the network
policy where the concepts overlap:

- `context_read`
- `provider_request`
- `integration_read`
- `integration_write`
- `package_download`
- `artifact_transfer`
- `webhook_delivery`
- `custom`

Targets may name exact `ContextSet`, `ProviderSet`, or `ExtensionSet` IDs, or
exact lowercase domains. At least one target category is required. When a rule
declares multiple categories, the actual operation must match every applicable
category; values within one category are alternatives.

A credential authorized for `integration_read` cannot be reused for
`integration_write`. A provider-targeted reference cannot be sent to a context
source or extension merely because the endpoint is on the same domain.

Domain selectors do not grant connectivity and do not accept wildcards, URL
paths, query strings, user information, or credential-bearing authorities.
The independent network policy must still authorize the resolved destination.

## Opaque References And External Bindings

`credentialRef` is part of authored policy because reviewers need a stable way
to discuss one credential requirement. It SHOULD describe purpose rather than
vendor account or secret location. For example, prefer
`coding-provider-access` over an email address, account number, vault path, or
environment-variable name.

A credential reference:

- is not a typed reference to another manifest resource
- is not a URI or secret-store locator
- is not evidence that a binding exists
- is not permission to inspect credential metadata or values
- is not transferable between projects, tenants, environments, or actors

A future runtime deployment may bind the reference to an external broker entry.
That binding must be established and reviewed outside public manifests. Runtime
preflight must verify the exact project, environment, actor, target, purpose,
kind, expiry, revocation state, and operation scope before use.

## Evaluation

A future runtime should evaluate one credential request in this order:

1. Identify the authenticated actor, project, task and workflow scope, action,
   required capability, purpose, exact target, and requested credential
   reference.
2. Evaluate autonomy, capability, permission, approval, human override,
   context, provider, extension, integration, and network policy independently.
3. Load the structured credential policy. Missing policy or free-text secret
   guidance provides no machine authority.
4. Collect every credential rule matching the actor, reference, kind, purpose,
   optional capability, and every applicable target category.
5. Deny when no rule matches.
6. Deny when any matching rule has `effect: deny`.
7. Require all applicable approval decisions when any matching rule has
   `effect: approval_required`.
8. Ask the runtime-owned broker for the exact external binding only after the
   preceding checks pass.
9. Reject missing, ambiguous, kind-mismatched, expired, revoked, incorrectly
   scoped, or broker-unavailable bindings.
10. Create an operation-scoped lease and apply it only through the authorized
    adapter or transport boundary.
11. End the lease at operation completion or failure and discard derived
    material.
12. Record a redacted decision without recording credential material, broker
    locators, authorization headers, or sensitive target metadata.

Every retry, redirect, fallback provider, changed extension surface, changed
target, or lease renewal is a new request and requires re-evaluation. A prior
success is not reusable authority.

## Capabilities And Permissions

`use_credential` is the standard draft capability for requesting mediated use
of one credential reference. It is high risk, approval-recommended, and does
not permit reading, exporting, copying, listing, rotating, or deleting
credential material.

A future runtime should require all of the following:

1. `use_credential` exists in the effective capability set.
2. An applicable permission allows or approval-gates `use_credential`.
3. The action-specific capability and permission are independently effective.
4. A credential rule matches and any credential approval is satisfied.
5. Network and target-specific policies independently allow the operation.
6. A valid external binding exists at runtime.

No item substitutes for another. A credential rule cannot turn
`provider_request`, `manage_tasks`, `access_mcp`, `access_a2a`,
`read_context`, or any repository capability into an authorized action.

## Direct Exposure And Process Boundaries

The initial model requires `directActorExposure: deny`. A model, prompt,
retrieval result, context source, memory scope, handoff, task artifact, event,
diagnostic, or graph must not receive the raw value.

Mediated use means a trusted runtime-owned component applies authentication at
the narrowest supported boundary. Passing a secret through command-line
arguments, generated files, prompt text, generic process environments, standard
input, logs, or tool results is direct exposure, not mediation.

The initial credential model does not authorize manifest-selected subprocess
injection. A future process credential profile would require its own isolation,
child-process inheritance, crash-report, environment, filesystem, debugging,
and cleanup rules.

## Lease, Rotation, And Revocation

Every declared lease has `scope: operation`. `maxDurationSeconds`, when present,
is an upper bound rather than a requested token lifetime. The runtime or broker
may issue a shorter lease.

`renewal: reauthorize` means a runtime must repeat policy evaluation and broker
checks. Silent refresh, lease pooling, cross-operation reuse, cross-agent reuse,
and fallback to an ambient credential are prohibited.

Credential creation, storage, rotation, and revocation remain external
operational responsibilities. A future runtime must observe broker-reported
expiry and revocation, terminate affected leases where possible, block new use,
and avoid retrying with another credential reference unless a new operation is
explicitly authorized.

## Approval Semantics

An approval decision should bind at least:

- actor
- credential rule and reference
- purpose and action capability
- exact target
- project, environment, task, and workflow scope when applicable
- decision time and expiry

Approval evidence must not contain credential values or broker locators. An
approval to use one reference for one target does not approve another target,
purpose, actor, operation, fallback, or renewal.

## Audit And Redaction

Credential decisions should record, when safe:

- actor and runtime identity
- project, task, and workflow scope
- credential rule ID and opaque credential reference
- purpose, target, and requested capability
- allow, deny, approval-required, unavailable, expired, revoked, or failed
  outcome
- approval decision reference
- lease start and end metadata without material
- correlation and causation IDs
- redaction status

Audit records MUST NOT include credential values, derived tokens, private keys,
passwords, cookies, authorization headers, complete certificate material,
secret-store paths, environment-variable values, provider-private account data,
request payloads, or response payloads.

The initial policy fixes `recordDecisions` and `redactValues` to `true`.
`credential.decision` is the standard draft event type for this boundary.

## Failure Behavior

| Condition | Required result |
| --- | --- |
| Policy omitted or malformed | Deny credential use. |
| No matching rule | Deny credential use. |
| Conflicting allow and deny | Deny credential use. |
| Approval absent, expired, revoked, or out of scope | Keep the operation blocked. |
| Reference has zero or multiple external bindings | Deny without guessing. |
| Binding kind or target differs from the request | Deny. |
| Credential expired or revoked | Deny and end affected leases where possible. |
| Broker unavailable or outcome uncertain | Deny and report a redacted failure. |
| Safe audit required but cannot be recorded | Fail closed before the protected effect. |
| Adapter would expose raw material to the actor | Deny. |

Error messages should identify the failed policy layer and safe reference, not
the credential value, broker path, account identity, or authentication response.

## Security Considerations

Implementations must account for:

- prompt injection requesting credential disclosure or reuse
- confused-deputy use against a different target or tenant
- environment and process inheritance
- logs, traces, crash reports, shell history, and debug output
- redirects, proxies, DNS changes, and provider fallback
- token refresh and retry races
- stale caches after rotation or revocation
- delegation through MCP, A2A, extensions, child agents, or automations
- credential material entering context, memory, artifacts, events, or handoffs
- secret scanning being mistaken for a credential broker

Manifest validation cannot prove runtime isolation. Secret scanning is useful
repository hygiene, but finding no leaked value does not prove that credential
use is authorized or correctly mediated.

## Validation Boundaries

JSON Schema validates:

- explicit deny default
- closed credential kind and purpose vocabularies
- non-empty actor, purpose, capability, and target selectors where present
- exact domain syntax without wildcards or URLs
- approval-gate presence for approval-required rules
- operation-only leases and reauthorization
- fixed external-only, no-ambient, no-exposure, no-delegation, and
  no-persistence controls
- mandatory decision audit and value redaction
- rejection of unknown or value-bearing policy fields

Semantic validation should additionally check:

- duplicate rule IDs
- actor, capability, context source, provider, extension, approval gate, and
  event references
- incompatible or redundant rules
- matching action permissions and network rules
- risky unscoped `custom` kinds or purposes

Runtime enforcement must additionally authenticate the actor, evaluate current
approval and override state, resolve the deployment-owned binding, verify
expiry and revocation, isolate mediated use, enforce target and operation
scope, clean up leases, and produce redacted audit evidence.

Passing schema or semantic validation does not prove that credentials exist or
that a runtime can use them safely.

## Compatibility And Migration

Existing `0.1` projects may contain only free text:

```yaml
project:
  policies:
    secretHandling: Use secret references only.
```

That text remains valid guidance but grants nothing. A project can add the
structured `credentialHandling` policy without removing the sentence. If the
required actors, purposes, targets, approvals, or external bindings are not
known, migrate to `default: deny` with an empty `rules` array.

Adding the optional structured policy is additive in the current schema
snapshot. Changing fixed controls, broadening target matching, permitting
longer lease scopes, allowing direct exposure, or rejecting legacy
`secretHandling` text may be security-significant or breaking and requires a
version and migration review.

## Conformance Boundary

A manifest implementation may claim structural support for the policy shape.
A semantic validator may additionally claim reference and conflict checks.
Neither claim implies credential storage, broker integration, runtime
enforcement, safe injection, rotation, revocation, or target authentication.

Runtime credential conformance remains future work and must include evidence
for isolation, no ambient discovery, exact target binding, operation-scoped
leases, approval, revocation, failure behavior, redaction, and audit.

## Related Models

- [Security Model](security-model.md)
- [Capability Model](capability-model.md)
- [Approval Gates](approval-gates.md)
- [Network Access Policy](network-access-policy.md)
- [Provider Adapter Boundary](provider-adapter-boundary.md)
- [Extension Loading Boundary](extension-loading-boundary.md)
- [Integrations](integrations.md)
- [Event Model](events.md)
- [Event And Audit Storage Boundary](event-audit-storage-boundary.md)
- [Validation](validation.md)
- [Conformance](conformance.md)
