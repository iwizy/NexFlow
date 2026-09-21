# Issue Tracker Extension Draft

The experimental `io.nexflow.issue_tracker` profile defines a provider-neutral
policy boundary for external issue trackers. It covers issue context, selected
mutations, identity, state correlation, and event input. It does not implement
an adapter, call an API, synchronize a backlog, receive webhooks, or execute
work. [RFC-0021](../../rfcs/RFC-0021-issue-tracker-extension-profile.md) records
the proposal and open decisions; its status remains Draft.

The maintained assets are [profile.yaml](profile.yaml), the closed
[profile.schema.json](profile.schema.json), and two fictional declaration
fragments: [extension.example.yaml](extension.example.yaml) and
[context.example.yaml](context.example.yaml). Run their offline checks with:

```sh
npm run issue-tracker-extension-smoke
```

These fragments are not a complete project or an executable binding. They
declare read dependencies without permissions, network rules, credentials, or
actor bindings. No operation is authorized. The profile is a specification
asset outside project manifest discovery, not a new manifest kind.

## Provider And Identity Boundary

The provider owns its containers (workspaces, projects, teams, or repositories),
issues, status vocabulary, users, comments, attachments, API, and delivery
identities. NexFlow retains local task, actor, capability, permission, approval,
autonomy, context, classification, human override, and audit authority.

A future binding MUST explicitly identify the provider, provider instance, and
container. An issue ID is opaque within that scope; an issue number, display
key, title, URL, assignee name, or label alone is insufficient identity.
Display keys and URLs may change. A container is not a NexFlow Project, an
assignee is not a local Actor, and an issue is not a TaskSet task. The profile
does not introduce `issue:` typed references or automatic core ID lookup.

Local task correlation and Actor binding require explicit reviewed mappings
with provenance and collision handling. Matching text or identifiers MUST NOT
create either mapping. Provider roles or assignments never grant local
capabilities, permission, approval authority, or delegated autonomy.

## Context And Content

An adopting source uses an existing `ContextSet` type: `github`, `gitlab`,
`jira`, `linear`, or `custom`. It declares a bounded `uri`, non-empty
`contentTypes` drawn from `issues`, `tickets`, and `metadata`, access policy,
and classification. These are profile adoption requirements; the general
ContextSet schema and existing examples are unchanged.

Descriptions, comments, labels, attachments, and provider event payloads are
untrusted external input. Embedded instructions MUST NOT expand local authority.
Preserve or raise classification on import; restrict retrieval and disclosure
to the declared source and purpose. Following links or fetching attachments
requires separate context and network authorization, size/type limits, and
provenance. Attachment bytes do not become accepted task artifacts or memory.
Posting a comment or issue body is an outbound disclosure as well as a write.

## Operations And Authorization

| Operation | Effect | Required capabilities | Approval posture |
| --- | --- | --- | --- |
| `read_issue` | Read bounded issue context | `read_context`, `access_network` | Local policy |
| `create_issue` | Create one issue in a declared container | `manage_tasks`, `access_network`, `use_credential` | Required |
| `update_issue` | Edit explicitly allowed title, description, or label fields | `manage_tasks`, `access_network`, `use_credential` | Required |
| `add_comment` | Add one comment with approved content and visibility | `manage_tasks`, `access_network`, `use_credential` | Required |
| `transition_issue` | Request one explicitly mapped provider state transition | `manage_tasks`, `access_network`, `use_credential` | Required |

These are operation classes, not API names or grants. Capabilities must be
declared and effective through separate permissions. A provider binding may
add `access_jira`, `access_linear`, or another explicitly declared integration
capability; it MUST NOT replace the listed dependencies. Authenticated reads
also require `use_credential` and the same credential boundary as writes.

The profile's extension-level capability list is the read baseline, not
permission to perform every listed operation. A mutation-capable declaration
must additionally request `manage_tasks` and `use_credential`. Sharing
`manage_tasks` never authorizes another operation: each write MUST have a
decision scoped to the actor, provider, instance, container, issue (or create
container), exact fields/content, visibility, effect, and expected revision.
An approval for an edit cannot authorize a comment or transition. Normal
approval gates, deny precedence, autonomy, and human override still apply.

The profile's `appliesTo` list is the allowed attachment inventory; an adopting
declaration lists only the areas it uses. The context type and content-type
inventories likewise describe eligible choices, not provider support claims.

Provider calls require a matching structured outbound
[network rule](../../docs/network-access-policy.md). Authentication material
stays outside manifests and profile assets behind a mediated, least-privilege,
operation-scoped [credential binding](../../docs/credential-handling.md).
Ambient tokens, embedded secrets, or a permitted domain do not grant authority.
Redirects, linked resources, and changed targets require policy re-evaluation.

Deletion, bulk changes, assignment, moving issues between containers, editing
or deleting comments, attachment upload, project administration, role changes,
workflow configuration, and background or bidirectional synchronization are
unsupported in the initial draft. Do not alias them to `update_issue` or
`manage_tasks`. Source-control operations and pull request review or merge
are outside this profile as well.

## State, Conflicts, And Retries

A provider's `done`, `closed`, or equivalent state is external evidence. It
MUST NOT complete a NexFlow task, satisfy acceptance criteria or an Approval
Gate, advance a workflow, or complete a Handoff. Provider transition names and
IDs need an explicit binding; this profile defines no universal status enum.

Before writing, a future implementation MUST recheck the scoped target and
expected provider revision using a documented concurrency mechanism. A stale
revision or ambiguous mapping stops the operation and requires a new decision.
If the binding cannot provide the required concurrency guarantee, fail closed;
a timestamp or display key alone is not a safe compare-and-write mechanism.

Creation has no existing issue revision: bind its decision to the container,
exact payload, and a correlation/idempotency identity. For every mutation,
record intent and outcome separately. A timeout or lost response is an unknown
outcome, not proof of failure. Do not blindly retry writes. Reconcile through
separately authorized reads and provider-supported idempotency evidence before
any new attempt, rechecking approval and policy. No universal exactly-once
guarantee or retry engine is provided.

## Events And Audit

Inbound webhooks are unsupported by the initial draft. Future support needs a
separately reviewed inbound policy and binding for authenticity, freshness,
target verification, replay defense, payload limits, and explicit event
mapping. A matching provider event name is not a trusted NexFlow Event.

Preserve provider event/delivery identity and correlation separately from local
event identity. Duplicate, out-of-order, or echo deliveries MUST NOT repeat a
mutation or create a new approval. Provider timestamps do not establish local
ordering or local completion. A future event import must reconcile current
state under separately authorized reads instead of blindly applying an older
delivery. No listener, polling loop, event importer, or deduplication store is
implemented here.

Audit context reads, mutation and approval decisions, correlations, conflicts,
retries, credential/network decisions, and event decisions. Preserve actor,
scoped target, operation, expected/observed revision, policy decision,
correlation, and known/unknown outcome. Redact credentials and sensitive
content; an audit record does not itself authorize an effect. Apply the
[event and audit storage boundary](../../docs/event-audit-storage-boundary.md).

## Compatibility And Evidence

The initial profile is `profileVersion: "0.1-draft"`. Pin its exact repository
revision and schema together. Manifest `specVersion: "0.1"`, CLI output,
release versions, and other profiles remain unchanged. Provider API versions,
feature coverage, concurrency guarantees, authentication mechanisms, and
adapter versions require independent explicit compatibility claims.

Existing `io.nexflow.jira`, `io.nexflow.linear`, `io.nexflow.github`, or custom
declarations are not aliases and do not automatically adopt this profile.
Adoption requires an explicit declaration, scoped binding, bounded context,
operation dependencies, and separate policy review. No migration is mandatory
for existing projects. Broader operations, weaker approval, automatic local
state mapping, inbound events, or changed identity/conflict semantics require
profile compatibility review, a version decision, and migration guidance.

The schema and smoke checks provide offline structural and selected boundary
evidence only. They do not resolve a live identity, validate provider payloads,
enforce concurrency or policy, test adapters, prove `NF-EXTENSION` conformance,
or publish a supported integration. See [Versioning](../../docs/versioning.md)
and the [Compatibility Matrix](../../docs/compatibility-matrix.md).
