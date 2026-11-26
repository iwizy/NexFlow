# Unsupported Extension Compatibility

These offline fixtures cover how NexFlow tools preserve extension declarations
and distinguish structural validity, compatibility evidence, implementation
support, and execution authority. They supplement the [Conformance Guide](../conformance.md)
and [Extension Registry Model](../extension-registry.md).

## Support matrix

| Surface | Implemented behavior and evidence | Support limits |
| --- | --- | --- |
| `ExtensionSet` schema, manifest `specVersion: "0.1"` | Checks the shape of a declaration. Accepts a structurally valid unknown namespace and opaque metadata. Rejects invalid core values such as a registry-only `revoked` lifecycle on an authored declaration. | No registry lookup, profile-version selection, or operation authorization. |
| Published `@nexflow/validation` and `@nexflow/cli` `0.5.0-alpha.1` | The library preserves parsed metadata and caller input. The installed CLI preserves input bytes across `validate`, `inspect`, and `graph`. `inspect` includes the declared resource and omits opaque fixture values from its output. All three commands emit `NF-DISCOVERY-UNSUPPORTED-VERSION` with exit 3 for an unsupported manifest dialect and `NF-SCHEMA` with exit 1 for an invalid lifecycle. | Structurally valid cases return exit 0 with `checks.extensionProfiles: "not-run"`, `checks.runtime: "not-run"`, and `executionAuthorized: false`. This includes declarations paired with a revoked entry or an incompatible profile in the separate fixture registry. The CLI emits no per-profile support diagnostic. |
| Registry schema and policy `0.1-draft` / `0.2-draft` | Validate standalone metadata and check consistency, including duplicate entries and known-history downgrade. Revoked and withdrawn rows can remain structurally valid historical records. | Registry evidence carries no operation authority. |
| NF-117 fixture compatibility check | Compares the exact namespace, profile version, profile source pin, manifest dialect, and attachment area. For unsupported or untrusted metadata it emits the reasons below. Every outcome has `executionAuthorized: false`. | Fixture reason labels have no public CLI or library API contract. A compatible pair establishes only fixture metadata compatibility. |
| [v0.6.0 fixture host](../../prototype/README.md) | Its [input contract](../../prototype/host/src/input.ts) accepts exactly four named manifests, ActorSet, CapabilitySet, PermissionSet, and Project, for the synthetic admission fixture. An extra or substituted ExtensionSet falls outside that contract. | This is a source-level boundary check. Extension admission and live integrations are outside the qualified prototype surface. |

## Offline outcomes

The [common fixture catalog](../../fixtures/extension-registry/compatibility.yaml)
uses a fictional source pin and records each expected outcome. The
[smoke check](../../scripts/extension-compatibility-smoke.mjs) reads it with
the repository schemas and registry policy. For each case it also tests the
published validator and the three installed CLI commands against the same
synthetic project declaration.

| Case | Fixture compatibility diagnostic |
| --- | --- |
| Exact known pair and source | `compatible-metadata` |
| Unknown namespace, unrecognized catalog profile, or unknown exact version | `unsupported-namespace`, `unsupported-profile`, or `unsupported-profile-version` |
| Unsupported dialect/attachment pairing or a different source pin | `incompatible-pair` or `profile-pin-mismatch` |
| Revoked or withdrawn record, disputed owner, or unpublished row | `revoked-profile`, `withdrawn-profile`, `disputed-ownership`, or `unpublished-profile` |
| Malformed registry, duplicate row, or legacy downgrade with known history | `invalid-registry` or `inconsistent-registry` |
| Standalone historical snapshot | `legacy-registry` |

A tool that evaluates profile compatibility should preserve structurally valid
metadata, report the reason it cannot support the exact selection, and leave
the extension inert. A revoked version stays denied when its successor is
present. Selecting a replacement requires an explicit new reference and review.
No authored declaration, registry entry, or compatibility result grants
capabilities, permissions, context, memory, network access, or credentials.

## Migration

The retained `0.1-draft` fixture remains readable as historical metadata.
The migration fixture copies its already exact single-version row into a new
`0.2-draft` snapshot, preserves the original row and its `self_asserted` owner,
and keeps the migrated draft unpublished. After a newer snapshot has been
recorded, the previous legacy format fails the history check for that registry.
The core manifest stays at `specVersion: "0.1"`. See the
[registry migration procedure](../extension-registry.md#migration-from-01-draft)
for snapshots that need replacement and retention metadata.

## Reproduction

Use Node.js `26.13.1` and the two package archives from the
[v0.5.0-alpha.1 release](https://github.com/iwizy/NexFlow/releases/tag/v0.5.0-alpha.1).
The smoke check validates their SHA-256 digests before offline installation in
empty, separate consumers. CI publishes the exact checkout revision, archive
digests, platform, and observed diagnostic codes with the fixture report.

```sh
npm ci --ignore-scripts --no-audit --no-fund
node scripts/extension-compatibility-smoke.mjs \
  nexflow-cli-0.5.0-alpha.1.tgz nexflow-validation-0.5.0-alpha.1.tgz
```

This evidence covers structural validation and offline metadata handling.
Executable loading, hosted registry operations, live services, and
`NF-EXTENSION` conformance remain outside its scope.
