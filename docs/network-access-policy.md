# Network Access Policy

Network access is a first-class project safety boundary. It controls whether a
declared actor may ask a future runtime to initiate an outbound connection for a
specific purpose and destination.

The policy is declarative. This repository does not open connections, enforce
firewall rules, resolve DNS, acquire credentials, or execute integrations.

## Scope

The initial model covers outbound connections initiated on behalf of project
actors, including:

- reading remote context
- calling a model provider
- reading from or writing to an integration
- downloading a package
- transferring an artifact
- delivering a webhook

Inbound listeners, service exposure, peer-to-peer networking, service meshes,
VPN configuration, and general firewall administration are outside the initial
core model.

## Core Rules

- Network access is denied unless a structured rule matches.
- Omission of `networkAccess` never grants access.
- A legacy string is human-readable guidance only and never a machine grant.
- Every rule names actors, purposes, and destinations.
- A network rule does not grant a capability, permission, context access,
  provider access, integration access, autonomy, approval, or credentials.
- Explicit deny takes precedence over approval-required and allow rules.
- Approval-required remains blocked until a valid scoped decision exists.
- Unknown, ambiguous, unresolved, redirected, or newly resolved destinations
  fail closed.
- A runtime may apply stricter sandbox, organization, or deployment policy.

## Project Policy Shape

Structured network policy lives at `project.policies.networkAccess`.

```yaml
project:
  policies:
    networkAccess:
      default: deny
      rules:
        - id: approved_project_services
          description: Approved agents may reach declared project services.
          effect: approval_required
          actors:
            - implementation-agent
            - qa-agent
          capabilities:
            - access_network
          purposes:
            - context_read
            - provider_request
          destinations:
            domains:
              - api.github.com
            contextSources:
              - repository
              - issue_tracker
            providers:
              - coding_reasoning
            schemes:
              - https
            ports:
              - 443
          maxDataClassification: internal
          approvalGate: network_access_review
      transport:
        requireTls: true
        allowPrivateNetworks: false
        allowLoopback: false
        followRedirects: false
        maxRedirects: 0
      audit:
        events:
          - network.decision
        recordDecisions: true
        recordDestination: true
        recordPurpose: true
        redactQuery: true
        redactHeaders: true
```

`default` is fixed to `deny` in the initial model. Broad allow-by-default policy
is intentionally not expressible through the core schema.

## Policy Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `default` | Yes | Unmatched requests are denied. The initial value is always `deny`. |
| `rules` | Yes | Explicit destination rules. An empty list means no outbound request can pass this policy layer. |
| `transport` | Yes | TLS, private network, loopback, and redirect constraints. |
| `audit` | Yes | Decision event references, minimum metadata choices, and mandatory redaction. |

Unknown namespaced extension fields may add stricter metadata. They must not
change the meaning of core fields or create an implicit allow path.

## Rule Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable project-local rule ID. |
| `description` | Yes | Human-readable reason and boundary. |
| `effect` | Yes | `allow`, `deny`, or `approval_required`. |
| `actors` | Yes | Actors to which the rule may apply. |
| `capabilities` | No | Capabilities that further narrow the match. This field does not grant them. |
| `purposes` | Yes | Declared reasons for the connection. |
| `destinations` | Yes | Declared resource or domain selectors plus transport constraints. |
| `maxDataClassification` | No | Highest classification that the rule permits to be sent. |
| `approvalGate` | Conditional | Required when `effect` is `approval_required`. |

An allow rule without a separately effective capability and permission remains
unusable. A permission to use `access_network` without a matching network rule
also remains unusable.

## Purpose Vocabulary

| Purpose | Meaning |
| --- | --- |
| `context_read` | Read or query a declared remote context source. |
| `provider_request` | Send an approved request to a selected model provider. |
| `integration_read` | Read from a declared integration action surface. |
| `integration_write` | Mutate a declared external integration. |
| `package_download` | Download package metadata or content from an approved registry. |
| `artifact_transfer` | Upload or download a declared artifact. |
| `webhook_delivery` | Deliver an event to an approved webhook destination. |
| `custom` | Extension-defined purpose whose semantics remain namespaced. |

Purpose is part of the decision. A connection allowed for `context_read` must
not be reused for `integration_write` or arbitrary data transfer.

## Destination Selectors

The initial destination object supports:

| Selector | Meaning |
| --- | --- |
| `domains` | Exact lowercase host names. Values are hosts, not URLs, paths, or credential-bearing authorities. |
| `contextSources` | IDs from `ContextSet`. |
| `providers` | IDs from `ProviderSet`. |
| `extensions` | IDs from `ExtensionSet`. |
| `schemes` | Allowed transport schemes: `https`, `wss`, or explicitly reviewed `http`. |
| `ports` | Allowed destination ports. |

At least one identity selector from `domains`, `contextSources`, `providers`, or
`extensions` is required. A request must match at least one declared identity
selector. When `schemes` or `ports` are present, they additionally constrain the
match.

Domain entries are exact host names. The core model does not accept wildcard,
suffix, URL-prefix, CIDR, or regular-expression matching. Those forms have
different security behavior and require a future reviewed extension or RFC.

A resource reference does not make every endpoint returned by that resource
safe. A future runtime must resolve the actual destination and apply transport,
DNS, redirect, private-network, and organization policy before connecting.

## Evaluation

A future semantic evaluator or runtime should process one network request as
follows:

1. Identify the actor, requested action, capability, purpose, logical resource,
   resolved host, scheme, port, and outbound data classification.
2. Confirm the actor, capability, permission, autonomy, context, provider,
   integration, task, and workflow constraints independently.
3. Load the structured project network policy. Missing policy or a legacy string
   provides no machine authorization.
4. Reject prohibited TLS, loopback, private-network, redirect, DNS, or sandbox
   conditions before sending data.
5. Collect every network rule matching actor, purpose, optional capability,
   destination identity, scheme, port, and data classification.
6. Deny when no rule matches.
7. Deny when any matching rule has `effect: deny`.
8. Require every applicable approval when any matching rule has
   `effect: approval_required`.
9. Continue only when at least one matching allow or satisfied approval-required
   rule exists and every independent policy layer also permits the request.
10. Re-evaluate the destination after DNS resolution and every redirect.
11. Record a redacted decision event without storing credentials or sensitive
    payloads.

Rule order, YAML order, file order, and extension loading order have no effect.

## Capabilities And Permissions

`access_network` is the standard draft capability for initiating an outbound
connection. It is high risk, approval-recommended, and intentionally broad only
at the technical capability layer.

A future runtime should require both:

1. an effective permission for `access_network` and the domain action capability
   such as `read_context`, `manage_tasks`, or a provider-specific operation
2. a matching structured network rule

Neither condition replaces the other. Network policy narrows connectivity; it
does not authorize the business action performed over that connection.

## Context, Providers, And Integrations

Context source `allowedDomains` and `disallowedDomains` describe source-specific
boundaries. They do not replace project network policy. Both must permit the
request.

A provider declaration or model selection does not grant provider connectivity.
The selected provider, model profile constraints, context disclosure policy,
permissions, approvals, and network rule must all remain effective.

An extension declaration identifies an integration surface. It does not load
code, acquire credentials, authorize an action, or grant network access.

## Transport Safety

The structured model makes the following controls visible:

- `requireTls`: require encrypted application transport except where a stricter
  sandbox rejects the request entirely
- `allowPrivateNetworks`: permit resolved private or link-local destinations
- `allowLoopback`: permit loopback destinations
- `followRedirects`: permit redirects only when each destination is re-evaluated
- `maxRedirects`: maximum accepted redirects when redirect following is enabled

Recommended defaults are TLS required, private networks denied, loopback denied,
redirects denied, and zero redirects. Enabling private networks, loopback,
unencrypted transport, or redirects is behavior-significant and should require
review.

DNS rebinding, proxy behavior, environment proxy variables, alternate IP
representations, and IPv4/IPv6 resolution can bypass naive hostname checks.
Future runtimes must enforce policy on the final resolved destination, not only
on the authored string.

## Audit And Privacy

Network decisions should record, when safe:

- actor and task or workflow scope
- rule IDs considered and effective result
- purpose and logical destination reference
- resolved host, scheme, and port
- approval decision references
- timestamp, correlation ID, and runtime identity
- denial or failure reason

`audit.events` names one or more declared event types used for network policy
decisions. The standard draft event is `network.decision`; its payload records
the actor, purpose, result, matched rule IDs, and redaction status. Logical or
resolved destination details remain subject to `recordDestination` and
classification policy.

Audit records must redact authorization headers, cookies, tokens, credentials,
secret query parameters, request bodies, response bodies, and sensitive DNS or
proxy metadata unless a separate policy explicitly permits narrowly scoped
retention.

`recordDecisions`, `redactQuery`, and `redactHeaders` are fixed to `true` in the
initial structured schema. This makes an auditable result and basic secret
redaction safety invariants rather than runtime preferences. A future version
may add more granular redaction vocabulary without weakening those invariants.

## Legacy String Compatibility

Current `0.1` project manifests may contain a sentence such as:

```yaml
networkAccess: Allowed only through declared integrations.
```

The schema continues to accept this form during the draft migration. It is
advisory text only. Validators and runtimes must not parse natural language to
infer domains, actors, approvals, or permission.

Migration should replace the sentence with a structured object. If the sentence
cannot be translated unambiguously, migrate to `default: deny` with no rules and
require a human to add explicit destinations.

Accepting the structured object is additive within the current draft. Rejecting
legacy strings later would be breaking and requires an explicit `specVersion`
decision, migration guidance, synchronized schemas and examples, and release
notes.

## Validation Boundaries

JSON Schema can validate the structural shape, controlled purpose vocabulary,
port ranges, required approval gate field, audit event references, mandatory
redaction choices, and explicit deny default.

Semantic validation should additionally check:

- actor, capability, context source, provider, extension, and approval gate
  references
- duplicate rule IDs
- domain syntax and prohibited wildcard forms
- contradictory or redundant rules
- classification ordering
- rule coverage for declared network-dependent behavior

Runtime enforcement must additionally check resolved destinations, DNS,
redirects, proxies, credentials, payload classification, sandbox restrictions,
and actual approval state.

Passing schema or semantic validation does not prove that a runtime enforces the
policy.

## Related Models

- [Security Model](security-model.md)
- [Capability Model](capability-model.md)
- [Approval Gates](approval-gates.md)
- [Context Model](context-model.md)
- [Provider Abstraction](provider-abstraction.md)
- [Integrations](integrations.md)
- [Event Model](events.md)
- [Conformance](conformance.md)
