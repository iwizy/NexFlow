# Event Interoperability

NexFlow defines event declarations and a future event-instance envelope for
auditable state transitions. CloudEvents and OpenTelemetry define external
representations with different purposes. This document maps those models
without selecting a transport, broker, collector, storage engine, or runtime.

Related documents:

- [Event Model](events.md)
- [RFC-0009: Event Envelope](../rfcs/RFC-0009-event-envelope.md)
- [Conformance](conformance.md)
- [Compatibility](compatibility.md)
- [Security Model](security-model.md)

## Review Baselines

| Target | Review baseline | NexFlow mapping profile | Repository status |
| --- | --- | --- | --- |
| CloudEvents | [CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md) | `nexflow-cloudevents/0.1-draft` | Specified mapping only. |
| OpenTelemetry | [Stable Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/) and [event semantic conventions 1.43.0](https://github.com/open-telemetry/semantic-conventions/blob/v1.43.0/docs/general/events.md) | `nexflow-opentelemetry/0.1-draft` | Specified mapping only. |

The external specifications remain authoritative for their own data models.
These baselines identify the material reviewed for the draft; they do not claim
SDK, protocol, wire-format, exporter, or collector compatibility.

The OpenTelemetry Logs Data Model is stable at this review baseline. Its event
semantic conventions and CloudEvents semantic attributes remain development
surfaces and must be versioned explicitly by implementations.

An implementation MUST publish the exact external specification, semantic
convention, mapping profile, and implementation versions it supports.

## Layer Ownership

| Layer | Owner | Purpose |
| --- | --- | --- |
| Event type declaration | NexFlow `EventSet` | Declares vocabulary, expected payload fields, retention, and audit requirements. |
| Event instance | NexFlow event envelope | Records one auditable state transition. |
| Portable event representation | CloudEvents | Describes event data and context for interoperable exchange. |
| Observability event representation | OpenTelemetry EventRecord | Records a named point-in-time occurrence as telemetry. |
| Transport and delivery | Runtime or deployment | Selects HTTP, messaging, OTLP, retries, ordering, authentication, and delivery guarantees. |
| Storage and retention | Runtime, sink, and project policy | Selects event stores, telemetry backends, indexes, retention, deletion, and access control. |

CloudEvents and OpenTelemetry are projections of a NexFlow event instance. They
do not replace the authored `EventSet`, project policy, or local state model.

## Interoperability Invariants

Every mapping MUST preserve these rules:

- One NexFlow transition keeps one stable `eventId` across equivalent export
  projections.
- Export does not create another local transition merely because another format
  or signal is emitted.
- A received CloudEvent or telemetry record is external evidence, not automatic
  proof that a local Task, Workflow, Handoff, approval, Actor, or artifact
  changed state.
- Event representations do not grant capabilities, permissions, autonomy,
  context access, memory access, network access, or approval.
- Correlation, causation, and trace context remain distinct concepts.
- Mapping versions and lossy fields must be visible in conformance evidence.
- Redaction and classification happen before export. A sink must not weaken
  project policy.

## Interoperable Event Names

For a NexFlow-defined event type in the current draft, the interoperable name
is:

```text
dev.nexflow.<nexflow-event-type>
```

Examples:

| NexFlow event type | Interoperable name |
| --- | --- |
| `task.completed` | `dev.nexflow.task.completed` |
| `handoff.accepted` | `dev.nexflow.handoff.accepted` |
| `override.applied` | `dev.nexflow.override.applied` |

The prefix is used for CloudEvents `type` and OpenTelemetry `EventName`. It
keeps the event class low-cardinality and identifies NexFlow as the owner of
the standardized meaning.

The current NexFlow-defined vocabulary is the event list documented by the
[Event Model](events.md) plus event types accepted through the RFC process. A
project may add optional payload detail without changing the interoperable
name, but it must preserve the documented base meaning and projection
structure. An incompatible required payload or meaning needs a separately
owned and versioned event name.

Project-specific or extension-owned event types MUST NOT be placed under
`dev.nexflow` automatically. Their owner must define an explicit, stable,
reverse-DNS event name and a reversible mapping to the declared NexFlow type.
An exporter without such a mapping must fail, omit that export target, or report
the unsupported type according to its declared failure policy.

Dynamic IDs, project names, actor IDs, and workflow run IDs MUST NOT appear in
the interoperable event name.

## CloudEvents Mapping

The `nexflow-cloudevents/0.1-draft` profile maps one NexFlow event instance to
one CloudEvent.

### Core Attributes

| NexFlow value | CloudEvents value | Mapping rule |
| --- | --- | --- |
| Event occurrence | `specversion` | MUST be `1.0`; this is the CloudEvents version, not NexFlow `specVersion`. |
| `eventId` | `id` | Copy exactly. Uniqueness is evaluated with CloudEvents `source`. |
| Event source identity | `source` | Use a stable URI-reference for the occurrence context. Do not use the Actor as a fallback. |
| `type` | `type` | Use the interoperable event name. |
| `occurredAt` | `time` | Copy as an RFC 3339 timestamp. Do not substitute `recordedAt` silently. |
| `subject` | `subject` | MAY use a reversible string projection such as `task/write-manifest-reference`; retain the complete structured subject in `data`. |
| Structured NexFlow content | `data` | Store the structured `source`, `actor`, `subject`, `outcome`, `payload`, `audit`, `links`, and namespaced extensions under `data.nexflow`. |
| JSON representation | `datacontenttype` | Set to `application/json`. |
| Future event-instance schema | `dataschema` | Omit until NexFlow publishes a versioned event-instance schema with a stable canonical URI. |

CloudEvents `source` identifies where the occurrence happened; NexFlow `actor`
identifies who or what was responsible for it. They are not interchangeable.
When public project and source IDs are sufficient, an exporter may use a stable
relative URI-reference such as:

```text
/nexflow/projects/minimal-team/sources/runtime/reference-runtime
```

An implementation may use another stable URI-reference, but it MUST document
its construction, escaping, uniqueness scope, and privacy behavior. Source URIs
must not contain credentials, tokens, personal data, or secret infrastructure
identifiers.

### NexFlow CloudEvents Attributes

The mapping defines these CloudEvents extension attributes:

| Attribute | CloudEvents type | NexFlow source | Requirement |
| --- | --- | --- | --- |
| `nexflowspecversion` | String | `specVersion` | Required. |
| `nexflowcorrelationid` | String | `correlationId` | Required when present in the NexFlow event. |
| `nexflowcausationid` | String | `causationId` | Required when present. |
| `nexflowrecordedat` | Timestamp | `recordedAt` | Required when present. |
| `nexflowsequence` | Integer | `sequence` | Required when present. |
| `nexflowseverity` | String | `severity` | Required when present. |

These names follow the CloudEvents context-attribute character and length
constraints. They are part of the NexFlow mapping profile, not CloudEvents core.
Complex Actor, subject, audit, link, and payload values remain in `data` because
CloudEvents context attributes use a restricted type system and may be exposed
to routers or logs.

### Structured Example

```yaml
specversion: "1.0"
id: evt_task_completed_001
source: /nexflow/projects/minimal-team/sources/runtime/reference-runtime
type: dev.nexflow.task.completed
subject: task/write-manifest-reference
time: "2026-05-29T10:00:00Z"
datacontenttype: application/json
nexflowspecversion: "0.1"
nexflowcorrelationid: workflow-docs-refresh-001
nexflowcausationid: evt_review_completed_001
nexflowrecordedat: "2026-05-29T10:00:02Z"
nexflowsequence: 42
nexflowseverity: info
data:
  nexflow:
    source:
      kind: runtime
      id: reference-runtime
    actor:
      kind: agent
      id: docs-agent
    subject:
      kind: task
      id: write-manifest-reference
    outcome: completed
    payload:
      artifacts:
        - docs/manifest-reference.md
    audit:
      required: true
      redactionApplied: false
```

The example is a logical structured representation. It does not select the
CloudEvents JSON format, HTTP binding, broker, topic, delivery guarantee, or
consumer behavior for a NexFlow runtime.

### Consistency And Import

Top-level CloudEvents attributes and `data.nexflow` MUST be derived from the
same canonical event instance. An importer that finds conflicting identity,
type, time, subject, or correlation values must reject or quarantine the event;
it must not guess which copy is authoritative.

The presence of `dev.nexflow.*` in CloudEvents `type` is not sufficient for
local import. A future importer must also verify:

- supported CloudEvents and NexFlow mapping versions
- accepted source identity and project association
- known event type mapping and expected payload
- duplicate, replay, ordering, and stale-event behavior
- authentication, integrity, classification, and redaction policy
- local transition preconditions, permissions, approvals, and audit rules

This repository does not implement CloudEvents import or export.

## OpenTelemetry Mapping

The `nexflow-opentelemetry/0.1-draft` profile maps one NexFlow event instance to
one OpenTelemetry EventRecord. An EventRecord is a LogRecord with a non-empty
`EventName`; the mapping does not create a span or metric.

### EventRecord Fields

| NexFlow value | OpenTelemetry field | Mapping rule |
| --- | --- | --- |
| `type` | `EventName` | Use the interoperable event name. |
| `occurredAt` | `Timestamp` | Copy the occurrence time. |
| Collector observation | `ObservedTimestamp` | Let the observing SDK, collector, or receiver set it. Do not map `recordedAt` automatically unless the implementation proves both timestamps have the same meaning. |
| `severity` | `SeverityNumber` | Use the normalized table below. Preserve the original value in `dev.nexflow.event.severity`; the profile does not set `SeverityText`. |
| Structured NexFlow content | `Attributes` | Store the complete safe projection in the complex `dev.nexflow.event.data` attribute, or publish a protected `dev.nexflow.event.data_ref` when the data is omitted. |
| Optional display summary | `Body` | MAY contain a policy-filtered string for human display. The profile does not define a structured Body. |
| Searchable event metadata | `Attributes` | Use the flat `dev.nexflow.*` attributes below. Do not flatten arbitrary payload fields. |
| Stable event source | `Resource` | Describe the stable entity that generated the records. Do not place occurrence-specific Actors in Resource. |
| Exporting library | `InstrumentationScope` | Identify the adapter or instrumentation library and its version, not the NexFlow Actor. |
| Explicit W3C trace context | `TraceId`, `SpanId`, `TraceFlags` | Copy only when valid trace context is independently available. |

### Severity Mapping

| NexFlow severity | OpenTelemetry `SeverityNumber` |
| --- | --- |
| `debug` | `5` (`DEBUG`) |
| `info` | `9` (`INFO`) |
| `warning` | `13` (`WARN`) |
| `error` | `17` (`ERROR`) |
| `critical` | `21` (`FATAL`) |

The smallest value in each OpenTelemetry severity range is used because
NexFlow does not currently define finer levels within a range. The original
NexFlow string is recorded in `dev.nexflow.event.severity`. This profile does
not define `SeverityText`, in line with OpenTelemetry event conventions.

### NexFlow OpenTelemetry Attributes

| Attribute | Value |
| --- | --- |
| `dev.nexflow.spec_version` | NexFlow `specVersion`. |
| `dev.nexflow.event.id` | Stable `eventId`. |
| `dev.nexflow.event.correlation_id` | `correlationId`, when present. |
| `dev.nexflow.event.causation_id` | `causationId`, when present. |
| `dev.nexflow.event.recorded_at` | Original `recordedAt`, when present. |
| `dev.nexflow.event.sequence` | Original `sequence`, when present. |
| `dev.nexflow.event.outcome` | Normalized `outcome`, when present. |
| `dev.nexflow.event.severity` | Original NexFlow severity, when present. |
| `dev.nexflow.event.data` | Complete structured NexFlow source, Actor, subject, outcome, payload, audit, links, and extensions when safe and within limits. |
| `dev.nexflow.event.data_ref` | Protected reference to canonical event data when the structured projection is intentionally omitted. |
| `dev.nexflow.actor.kind` | Actor kind, when safe and available. |
| `dev.nexflow.actor.id` | Actor ID, when safe and available. |
| `dev.nexflow.subject.kind` | Subject kind. |
| `dev.nexflow.subject.id` | Subject ID, when safe and available. |
| `dev.nexflow.subject.scope` | Subject scope, when present. |

Stable source information may use `dev.nexflow.source.kind`,
`dev.nexflow.source.id`, and `dev.nexflow.source.version` as Resource
attributes. Standard OpenTelemetry Resource attributes such as `service.name`
should be used only when their published semantics actually match the source.

An EventRecord SHOULD carry either `dev.nexflow.event.data` or
`dev.nexflow.event.data_ref`. A data reference is an opaque, policy-approved
string that identifies protected canonical event data. Consumers must not
dereference it without independent network, credential, permission, and data
access authorization.

Flat attribute values are intended for filtering and correlation. The complex
`dev.nexflow.event.data` value preserves structure but must not be promoted into
an unbounded set of indexed fields. When payload size, sensitivity, or SDK
limits make the value unsafe, omit it, provide a protected
`dev.nexflow.event.data_ref` when policy permits, and declare the mapping as
lossy. Raw prompts, context excerpts, memory content, and credentials remain
prohibited. `Body`, when used, is only a safe human-readable string.

### EventRecord Example

```yaml
EventName: dev.nexflow.task.completed
Timestamp: "2026-05-29T10:00:00Z"
SeverityNumber: 9
Attributes:
  dev.nexflow.spec_version: "0.1"
  dev.nexflow.event.id: evt_task_completed_001
  dev.nexflow.event.correlation_id: workflow-docs-refresh-001
  dev.nexflow.event.causation_id: evt_review_completed_001
  dev.nexflow.event.recorded_at: "2026-05-29T10:00:02Z"
  dev.nexflow.event.sequence: 42
  dev.nexflow.event.outcome: completed
  dev.nexflow.event.severity: info
  dev.nexflow.actor.kind: agent
  dev.nexflow.actor.id: docs-agent
  dev.nexflow.subject.kind: task
  dev.nexflow.subject.id: write-manifest-reference
  dev.nexflow.event.data:
    source:
      kind: runtime
      id: reference-runtime
    actor:
      kind: agent
      id: docs-agent
    subject:
      kind: task
      id: write-manifest-reference
    outcome: completed
    payload:
      artifacts:
        - docs/manifest-reference.md
Resource:
  dev.nexflow.source.kind: runtime
  dev.nexflow.source.id: reference-runtime
InstrumentationScope:
  name: dev.nexflow.event
  version: "0.1-draft"
```

The example uses human-readable timestamps to explain the logical mapping.
Actual OpenTelemetry encodings and attribute limits follow the selected SDK and
protocol data model.

## Correlation Is Not Trace Context

The following substitutions are invalid:

| NexFlow field | Must not become automatically |
| --- | --- |
| `eventId` | OpenTelemetry `SpanId` or `TraceId`. |
| `correlationId` | OpenTelemetry `TraceId` or CloudEvents `id`. |
| `causationId` | OpenTelemetry `SpanId`, parent span, or span link. |
| NexFlow `links` | OpenTelemetry span links. |
| Actor or subject ID | OpenTelemetry Resource identity. |

NexFlow correlation groups related project activity. A trace identifies one
distributed request or operation according to W3C and OpenTelemetry rules.
They may overlap, but neither can be derived safely from the other.

When valid trace context is explicitly available, an exporter may copy it to
OpenTelemetry trace fields and to a supported CloudEvents distributed-tracing
extension. The exporter must preserve NexFlow correlation and causation fields
separately. Missing trace context is not an error for a NexFlow event.

An operation with meaningful duration may have a separate OpenTelemetry span.
The NexFlow event can be correlated with that span, but the event mapping itself
does not define span names, parentage, sampling, or lifecycle.

## Combined CloudEvents And OpenTelemetry Use

A runtime may export the same transition as CloudEvents and OpenTelemetry, but
it must keep the same NexFlow `eventId` and record both export outcomes without
creating duplicate local transitions.

OpenTelemetry publishes development-status
[`cloudevents.*` semantic attributes](https://opentelemetry.io/docs/specs/semconv/cloudevents/)
for instrumenting CloudEvents processing. Those attributes describe a
CloudEvent on a transport-related span; they do not replace the NexFlow
EventRecord mapping or its `dev.nexflow.*` attributes.

## Direction And Authority

| Direction | Draft status | Authority rule |
| --- | --- | --- |
| NexFlow event -> CloudEvent | Specified | Export projection only. |
| CloudEvent -> NexFlow event | Conditional future work | Requires an explicit accepted importer and local transition policy. |
| NexFlow event -> OpenTelemetry EventRecord | Specified | Observability projection only. |
| OpenTelemetry EventRecord -> NexFlow event | Unsupported | Telemetry is not a control-plane or state-reconstruction input. |
| CloudEvents or OpenTelemetry -> `EventSet` | Unsupported | Instance data never authors or mutates declarations automatically. |

## Conformance Claims

An implementation claiming either mapping MUST state:

- mapping profile and version
- CloudEvents or OpenTelemetry versions used
- supported direction: export, import, or both
- supported event types and custom type mappings
- source identity construction
- field omissions, transformations, and lossy behavior
- severity and trace-context behavior
- duplicate, replay, ordering, and failure behavior
- redaction, classification, retention, and sink limitations
- evidence showing representative successful and rejected cases

CloudEvents support does not imply OpenTelemetry support, and the reverse is
also true. Mapping support does not establish `NF-RUNTIME` conformance.

## Validation Boundary

The current repository validates `EventSet` declarations, not emitted event
instances or external projections. It provides no event-instance schema,
CloudEvents encoder or decoder, OpenTelemetry instrumentation, exporter,
collector configuration, or interoperability conformance suite.

Future validation may check:

- known and owner-qualified interoperable event names
- required mapping fields and types
- agreement between projected and structured values
- severity normalization
- trace-context syntax without inventing context
- redaction and prohibited attribute placement
- round-trip preservation for explicitly lossless profiles

No `EventSet` manifest field is added for a transport, broker, collector, or
sink. Implementation configuration belongs to a future runtime or a namespaced
extension and cannot grant authority.

## Security And Data Handling

Exporters MUST apply least privilege and project policy before serialization.
They should assume CloudEvents context attributes and OpenTelemetry Resource and
Attributes fields are widely indexed and visible to operators.

Do not export:

- credentials, tokens, cookies, private keys, or authorization headers
- raw prompts, retrieved context, memory content, or request and response bodies
- personal or regulated data without explicit policy and protection
- secret infrastructure identifiers in source URIs or Resource attributes
- unbounded or high-cardinality payload fields as searchable attributes

Redaction must be recorded without placing the removed value in another field.
Sampling, dropped telemetry, broker loss, or backend retention must be visible
limitations; absence from telemetry is not proof that an event did not occur.

## Out Of Scope

This mapping does not define:

- a NexFlow runtime or event store
- CloudEvents protocol bindings, topics, brokers, routing, retries, or delivery
  guarantees
- OpenTelemetry SDK selection, OTLP transport, collector pipelines, sampling,
  processors, exporters, or telemetry backends
- event sourcing, state reconstruction, or command handling
- cryptographic signing, schema publication, or public event registries
- automatic state changes from received events or telemetry
