# FAQ

## Is NexFlow an AI agent?

No. NexFlow describes agents, teams, workflows, permissions, context, memory, and integrations.

## Does NexFlow run workflows today?

No. Runtime execution is future work.

## Why specification first?

AI developer tooling is fragmented. A shared declarative model is useful before any runtime exists because teams can review, compare, and audit intended behavior.

## Does NexFlow depend on a provider?

No. Provider abstraction is part of the spec, but no provider is required.

## Does NexFlow implement MCP or A2A?

No. NexFlow can declare policy around MCP and A2A interoperability, but it does
not discover endpoints, negotiate protocol versions, authenticate, invoke
tools or remote agents, synchronize external tasks, import artifacts, stream,
receive callbacks, or run protocol clients and servers. External protocol
metadata never grants local NexFlow authority by itself. See
[MCP And A2A Boundaries](mcp-a2a-boundaries.md).

## Does NexFlow implement CloudEvents or OpenTelemetry?

No. NexFlow specifies draft mappings from its future event-instance envelope to
CloudEvents and OpenTelemetry EventRecords. It does not provide an encoder,
importer, SDK, protocol binding, OTLP exporter, collector, broker, sink, or
event store. External event and telemetry records do not change local NexFlow
state automatically. See [Event Interoperability](event-interoperability.md)
and [Event And Audit Storage Boundary](event-audit-storage-boundary.md).

## Does NexFlow require YAML?

YAML is the reference authoring format. The data model should remain compatible with JSON and JSON Schema validation.

## Can companies use this?

Yes. The MIT License is intentionally permissive.

## Can open-source communities use this without a runtime?

Yes. Manifests can serve as reviewable project policy and coordination documents.

## Does human override stop agents today?

No. NexFlow now specifies and structurally validates a fail-closed human
override policy, but no runtime exists to authenticate authorities, interrupt
work, revoke live authorization, or enforce resume gates.

## Does an active agent definition run an agent?

No. `active` makes the unique unscoped definition authoritative for requested
behavior during specification inspection and validation. It does not call a
provider, load prompts, retrieve context, grant access, emit events, or execute
work.

## Will there be a CLI?

Probably, but only after the manifest model stabilizes. The first CLI should validate and inspect manifests, not orchestrate work.

## Do I need every manifest to start?

No. The [Core Profile](core-profile.md) requires one `Project` and one
authoritative participant inventory. Other modules are optional until claimed
or referenced, and omission never grants behavior. The maintained examples are
complete learning fixtures rather than the minimum required project shape.

## Can one project declare multiple workflows?

Yes. A Project may use `manifests.workflows` to list multiple local Workflow
documents. Every workflow needs a unique `workflow.id`; stage and step IDs stay
local to that workflow. The focused discovery helper validates inventory only.
It does not select, schedule, merge, or execute workflows.

## What is the difference between capabilities and permissions?

A capability says an actor or integration can technically do something. A permission rule applies an `allow`, `deny`, or `approval_required` effect to that capability.

For example, an integration may expose `create_pull_request`, but an agent still needs a permission rule that allows or gates `create_pull_request` before a runtime should let it open a pull request.

## What is the most important model?

Context and memory are especially important because they define what agents can know, retain, and reuse.
