# FAQ

## Is NexFlow an AI agent?

No. NexFlow describes agents, teams, workflows, permissions, context, memory, and integrations.

## Does NexFlow run workflows today?

No. Runtime execution is future work.

## Why specification first?

AI developer tooling is fragmented. A shared declarative model is useful before any runtime exists because teams can review, compare, and audit intended behavior.

## Does NexFlow depend on a provider?

No. Provider abstraction is part of the spec, but no provider is required.

## Does NexFlow require YAML?

YAML is the reference authoring format. The data model should remain compatible with JSON and JSON Schema validation.

## Can companies use this?

Yes. The MIT License is intentionally permissive.

## Can open-source communities use this without a runtime?

Yes. Manifests can serve as reviewable project policy and coordination documents.

## Will there be a CLI?

Probably, but only after the manifest model stabilizes. The first CLI should validate and inspect manifests, not orchestrate work.

## What is the difference between capabilities and permissions?

A capability says an actor or integration can technically do something. A permission rule applies an `allow`, `deny`, or `approval_required` effect to that capability.

For example, an integration may expose `create_pull_request`, but an agent still needs a permission rule that allows or gates `create_pull_request` before a runtime should let it open a pull request.

## What is the most important model?

Context and memory are especially important because they define what agents can know, retain, and reuse.
