# Security Policy

NexFlow is currently a specification repository. It does not execute workflows, call providers, store secrets, or run agents.

Security still matters because the specification describes future systems that may execute sensitive actions.

## Reporting Security Issues

Please do not open public issues for vulnerabilities involving:

- credential handling
- privilege escalation
- unsafe autonomy defaults
- destructive operation approval bypasses
- schema ambiguity that could authorize unintended behavior
- future runtime security flaws

Until a dedicated security email is established, open a private maintainer contact channel if available. If none exists, open a public issue with minimal detail and request a private disclosure path.

## Security Principles

- Least privilege by default.
- Explicit capabilities and permissions.
- Human override for dangerous actions.
- Approval gates for sensitive operations.
- No implicit credential access.
- No unsafe default network access.
- Auditable events for meaningful state changes.
- Clear memory retention and visibility boundaries.

## Supported Versions

Only the current draft specification is maintained:

| Version | Supported |
| --- | --- |
| 0.1 draft | Yes |

## Runtime Warning

Any future runtime MUST treat NexFlow manifests as policy-bearing configuration, not merely descriptive metadata. Runtime implementations are responsible for enforcing approval gates, permissions, credential isolation, and auditability.
