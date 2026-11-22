# Security Policy

NexFlow is a specification-first project with executable repository checks,
experimental validation candidates, published reference validation/CLI packages,
and a source-only host for one synthetic offline operation. Production workflow,
provider, credential and executable-extension support remains deferred.

Current security review covers untrusted manifest/data inputs, parsing and
validation dependencies, bounded filesystem reads, prototype initializer writes,
diagnostics, CI and release-artifact integrity. The
[reference validation library](packages/validation/README.md) has a pure data
entry; its separate [workspace adapter](packages/cli/README.md) owns permitted
project-file reads. The historical CLI prototype is a different executable
surface, including its bounded `init` command. Installable reference candidate
archives have separate [security](docs/reference-package-security.md) and
[native lifecycle](docs/reference-native-lifecycle.md) evidence. The
[published alpha](https://github.com/iwizy/NexFlow/releases/tag/v0.5.0-alpha.1)
contains the reference CLI and validator; `init` remains deferred.
The [preview support/correction policy](docs/reference-cli-compatibility.md)
retains the existing single-maintainer ownership and best-effort limits.

The public [Threat Model](docs/threat-model.md) separates current repository
risks from conditional future-runtime attacker stories and documents scope,
trust boundaries, mitigations, assumptions, and severity calibration. It does
not replace private vulnerability reporting.

## Reporting Security Issues

Report security issues privately, including weaknesses involving:

- YAML/data parsing, resource limits or dependency behavior
- path containment, symbolic links or unintended file reads/writes
- sensitive data or unsafe content reflected in diagnostics and inspection
- CI permissions, dependencies or artifact/provenance integrity
- credential handling
- privilege escalation
- unsafe autonomy defaults
- destructive operation approval bypasses
- schema ambiguity that could authorize unintended behavior

Distinguish a security-relevant specification weakness from an exploit in
implemented tooling. Hypothetical bugs in an absent runtime are design concerns,
not evidence that such a runtime is implemented or vulnerable.

Report vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/iwizy/NexFlow/security/advisories/new).
Include the affected file/component and exact commit, tag or package revision,
reproduction conditions, observed impact and any relevant limits. Use synthetic
inputs; do not send real credentials or customer data. Do not include
vulnerability details in a public issue. Non-security conduct reports follow
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), not security advisories.

The maintainer owns triage and coordinated follow-up under the adopted
[single-maintainer ownership record](rfcs/reviews/2026-10-11-single-maintainer-ownership.md).
Support is pre-release best-effort, with no response SLA, fixed availability or
backup responder. This does not promise a remediation deadline or independent
security certification.

## Security Principles

These principles constrain the specification and future runtime. Their presence
does not establish runtime enforcement. Current tooling must preserve its own
documented parsing, effect and output boundaries:

- The validation kernel uses supplied data and fixed local schemas; it does not
  open project files, fetch schemas, spawn processes, discover credentials or
  load executable extensions. Normal installed-module loading is separate.
- The read adapter confines selected inputs to an explicit root and rejects
  unsafe paths, symbolic links, non-regular files and exceeded input budgets.
  It is not an operating-system sandbox or a guarantee against parent-path races.
- Public validation/inspection results are bounded projections. Raw parser and
  document helpers return authored data and must not be printed as redacted
  diagnostics. A truncated or failed check must not become success or authority.

The specification's broader principles remain:

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

Security maintenance follows the current development revision in `develop`.
Report issues found in published snapshots with their exact tag or commit;
triage against current code does not promise backports to every historical tag.

| Surface | Current status |
| --- | --- |
| `develop` | Active pre-release specification and implemented-tooling maintenance. |
| `v0.6.0` | Latest published source milestone; the host supports one synthetic offline fixture with the limits in `prototype/README.md`. |
| Earlier release tags | Historical snapshots; include the exact revision when reporting an issue. |
| Manifest `specVersion: "0.1"` | The authored format, separate from release and package versions; not a security-support branch identifier. |
| CLI and validation packages `0.5.0-alpha.1` | Published unsigned developer preview; exact archive and target limits are recorded in the installation and support guides. |

See [Versioning](docs/versioning.md) for the independent version domains and
[library qualification scope](docs/reference-validation-library.md) for its
actual evidence. Frozen evaluation reports and dated advisory dispositions do
not establish current package security acceptance; that review remains separate.

## Runtime Warning

Any future runtime MUST treat NexFlow manifests as policy-bearing configuration, not merely descriptive metadata. Runtime implementations are responsible for enforcing approval gates, permissions, credential isolation, and auditability.
