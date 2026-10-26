# Conformance, Compatibility And Migration Plan

Owner: Alexander Agafonov under the existing bounded NF-101 roles. This plan
belongs to the proposed architecture, not a new conformance certification.
The implementation decision must identify its immutable revision and the
separate reviewed evidence set. No schema, corpus, oracle, candidate source,
lockfile, product version or existing public command changes here.

## Claim And Fixture Ownership

| Surface | Existing evidence and boundary | Required before a broader claim |
| --- | --- | --- |
| NF-SCHEMA | Frozen baseline, maintained schemas/examples/negative fixtures and the complete 352-case catalog; selected candidate validation and public-projection records remain source-bound. | Publish the exact implementation/spec pair and all required fixture results; a passed subset is not full conformance. |
| NF-SEMANTIC | The catalog exercises selected semantic fragments and workflow/artifact namespaces through the native library API. Current candidate CLI envelopes still report full project semantics as not-run. | Port and exercise complete project semantic/Core/extension layers before changing the CLI's advertised semantic support. |
| NF-CLI validate/inspect | Original eleven common CLI scenarios, public diagnostics, native offline/lifecycle/security records and successful/error measurements remain separate. | Preserve effect budgets and diagnostic/version compatibility for the actual shipped implementation, not only its experimental library API. |
| NF-CLI graph/init | Existing JavaScript reference commands and `cli-graph-smoke`, `cli-init-smoke`, `cli-no-runtime-guardrails-smoke` retain their current identity and scope. | A future port must rerun their original fixtures: graph is read-only; init writes only the explicit local destination without install, authentication, remote initialization or execution. |
| NF-RUNTIME | Inert grants/catalog/journal/version models exercise proposed design failures. No runtime implementation or runtime conformance is supplied. | Qualify actual host admission, effects, credentials, persistence/crash recovery, revocation and incident behavior before any runtime claim. |
| Extension/provider/protocol | Authored declarations remain data. Inert staged loading, exact-provider and unsupported-protocol models supplement the existing boundary specifications. | Independently qualify each executable implementation, pinned artifact, protocol mapping, native isolation and per-operation authority before offering execution. |
| Targets/distribution | Native Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows Server 2025 AMD64 evidence covers the explicitly unsigned evaluation capsules and their exact runtime prerequisites. | A supported product matrix needs fresh applicable publisher/trust, provisioning, compatibility and release evidence through NF-103. Evaluation hosts are not a support SLA. |

The sole maintainer owns fixture review and version mapping, including positive,
negative, discovery, semantic, diagnostic, boundary and native-target suites.
Oracle/fixture changes need a reviewed specification change; an implementation
failure cannot be fixed by changing expected meaning. CI and Git receipts prove
the bounded recorded commands, not human consent or a larger support claim.

## Compatibility Domains

| Domain | Current/proposed identifier | Failure and change rule |
| --- | --- | --- |
| Manifest specification | Frozen `0.1` dialect at the pinned baseline | Unsupported versions reject before initialization; schema changes require their own compatibility review. |
| Public diagnostic projection | Existing `nf-validation-diagnostics-v1`, experimental envelope `0.4-draft` | Keep code/category/path/severity/meaning/order/redaction stable. A changed projection needs explicit readers, fixtures and compatibility declaration. |
| Experimental library/CLI | Logical `evaluation-api-v1` / `evaluation-cli-v1` | No stable product ABI is promised. Native implementation entry points and caller inputs are tested separately from CLI dispatch. |
| Future spec/validation/CLI/host packages | Separately owned version pairs in layout B | Reject unknown or skewed pairs before constructing authority. Sharing a repository, language or version number is not compatibility proof. |
| Evaluation artifact | Immutable source/package revision, manifest and archive checksum | Install only a verified new immutable slot; tampered content never replaces the active slot. A genuine retained predecessor supplies upgrade/rollback evidence. |
| Future adapter/extension protocol | Design-only catalog and per-operation request contracts | Unknown/ambiguous/unavailable/digest-mismatched implementations reject. No implicit fallback or external authority import. |
| Future configuration and stored state | No deployed product state exists in this scope | Versioned reader, dry validation, backup, reversible activation and anchored recovery are prerequisites to any migration. An unknown receipt or unresolved effect gap cannot be replayed automatically. |

## Publication And Migration

Publish exact source/spec/corpus/catalog hashes, candidate locks, native run/job
identities, artifact inventories, commands, all failures and raw measurements.
Retain historical reports unchanged. Updated evidence is a new dated revision;
it does not replace a failed or not-tested result retroactively. Never pool
different OS/hardware or source cohorts into a successful candidate timing.

This architecture introduces no manifest migration or deployed stored-state
change. Future kernel extraction, graph/init porting and package separation
must preserve current command budgets and prove compatibility before switching
users. The actual evaluation V1-to-V2 rollback is installation evidence; it is
not proof of future product ABI, database or journal rollback. Public release,
package publication and broader runtime/conformance scope require their own
explicit decisions and verified artifacts.
