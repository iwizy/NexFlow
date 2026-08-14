# NexFlow Extension Profiles

This directory contains maintained, versioned policy profiles for non-core
integration behavior.

| Namespace | Profile | Status |
| --- | --- | --- |
| `io.nexflow.mcp` | [MCP Extension Draft](mcp/README.md) | Draft / experimental |
| `io.nexflow.a2a` | [A2A Extension Draft](a2a/README.md) | Draft / experimental |

Profiles are specification assets, not NexFlow manifests. They are not
discovered as part of a project assembly and do not load code, install
integrations, obtain credentials, or grant runtime authority.

The [Extension Loading Boundary](../docs/extension-loading-boundary.md) defines
how a future runtime must keep these profiles separate from executable package
discovery, verification, enablement, loading, and per-operation authorization.

Each maintained profile should include:

- a stable namespace
- a machine-readable profile version
- a schema for the profile asset
- authority and failure boundaries
- compatibility and migration guidance
- offline validation evidence
- an RFC for material semantic or safety decisions

General namespace and lifecycle rules live in
[Extension Model](../docs/extensions.md) and
[RFC-0006](../rfcs/RFC-0006-extension-namespaces.md).
