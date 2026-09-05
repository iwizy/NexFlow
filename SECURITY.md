# Security Policy

NexFlow is currently a specification repository. It does not execute workflows, call providers, store secrets, or run agents.

Security still matters because the specification describes future systems that may execute sensitive actions.

The public [Threat Model](docs/threat-model.md) separates current repository
risks from conditional future-runtime attacker stories and documents scope,
trust boundaries, mitigations, assumptions, and severity calibration. It does
not replace private vulnerability reporting.

## Reporting Security Issues

Please do not open public issues for vulnerabilities involving:

- credential handling
- privilege escalation
- unsafe autonomy defaults
- destructive operation approval bypasses
- schema ambiguity that could authorize unintended behavior
- future runtime security flaws

Report vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/iwizy/NexFlow/security/advisories/new).
Repository maintainers own triage and coordinated follow-up. Do not include
vulnerability details in a public issue.

## Security Principles

- Least privilege by default.
- Explicit capabilities and permissions.
- Human override for dangerous actions.
- Approval gates for sensitive operations.
- No implicit credential access.
- No unsafe default network access.
- Auditable events for meaningful state changes.
- Clear memory retention and visibility boundaries.

The specification's [Credential Handling](docs/credential-handling.md) model
requires external-only values, deny-by-default policy, operation-scoped
mediation, no ambient discovery or direct actor exposure, and redacted audit.
This repository does not implement a credential broker or runtime enforcement.

## Supported Versions

Only the current draft specification is maintained:

| Version | Supported |
| --- | --- |
| 0.1 draft | Yes |

## Runtime Warning

Any future runtime MUST treat NexFlow manifests as policy-bearing configuration, not merely descriptive metadata. Runtime implementations are responsible for enforcing approval gates, permissions, credential isolation, and auditability.
