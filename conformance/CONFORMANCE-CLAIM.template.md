# NexFlow Conformance Claim: [Subject Name]

> This is a self-declared compatibility claim. It is not NexFlow certification,
> a permission grant, an approval, or proof that runtime safety is enforced.

## Claim Metadata

| Field | Value |
| --- | --- |
| Claim format | `0.1` |
| Claim ID | `[claim-id]` |
| Status | `draft` |
| Issued | `[ISO 8601 timestamp]` |
| Updated | `[ISO 8601 timestamp or not applicable]` |

## Subject

| Field | Value |
| --- | --- |
| Name | [tool, project, service, or extension name] |
| Version | [evaluated version] |
| Type | [project, validator, cli, runtime, extension, library, service, or other] |
| Description | [factual description of the evaluated artifact] |
| Homepage | [URL] |
| Source | [repository URL or not public] |

## Evaluated Scope

- **NexFlow spec versions:** [for example, `0.1`]
- **Schema snapshots:** [tag or commit for each spec version]
- **Profiles:** [complete list such as `core`, or none]
- **Manifest kinds:** [complete list, or none]
- **Extension namespaces:** [complete list, or none]
- **Unsupported fields:** [complete list, or none known]

## Level Claims

Use only `supported`, `partial`, `unsupported`, `not-applicable`, or
`not-evaluated`. Every supported or partial row must link to evidence. Every
partial row must state its limitations.

| Level | Status | Summary | Evidence | Limitations |
| --- | --- | --- | --- | --- |
| `NF-MANIFEST` | `not-evaluated` | [scope] | [links or none] | [limits] |
| `NF-SCHEMA` | `not-evaluated` | [scope] | [links or none] | [limits] |
| `NF-SEMANTIC` | `not-evaluated` | [scope] | [links or none] | [limits] |
| `NF-CLI` | `not-evaluated` | [scope] | [links or none] | [limits] |
| `NF-RUNTIME` | `not-evaluated` | [scope] | [links or none] | [limits] |
| `NF-EXTENSION` | `not-evaluated` | [scope] | [links or none] | [limits] |

## Validation Behavior

[Describe exactly what is parsed, validated, rejected, preserved, or skipped.
Distinguish syntax, schema, cross-manifest, policy, and graph behavior where
relevant.]

## Enforcement Behavior

[Describe exactly what is enforced during execution. Write "No runtime
enforcement" when the subject does not execute or enforce NexFlow behavior.]

## Overall Limitations

- [Limitation that applies to the claim as a whole.]

## Evidence

| Type | Description | Location | Revision |
| --- | --- | --- | --- |
| [documentation, test-suite, fixture-suite, audit, or other] | [what the evidence proves] | [URL] | [tag, commit, or version] |

## Attestation

- **Assurance:** Self-declared
- **Responsible party:** [person or organization responsible for the claim]
- **Contact:** [public contact URI]

The responsible party confirms that this claim describes the named subject
version and evaluated evidence. Withdraw or replace the claim when it is no
longer accurate.
