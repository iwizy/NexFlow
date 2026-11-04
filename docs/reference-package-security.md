# Reference Package Security Qualification

NF-108 reviews the actual installed [candidate](reference-package-candidate.md),
not only the repository's npm graph. This is a single-maintainer review through
two technical lenses: data/code boundaries and dependency/distribution risks.
It is not an independent human audit. Qualification binds the exact source
revision, both archive digests and dated inputs in the CI evidence; it grants
neither publication authority nor native target acceptance.

## Repairs And Closure

The original NF-107 source `54facf50320168e099f2909f0e9ae65ae46fb6b3`
produced these retained predecessor archives:

| Archive | SHA-256 |
| --- | --- |
| Validation | `e1d164c8300773f36b174420b846b4431766d6ca17cfd315b8fb66c0383f167b` |
| CLI | `d0047d2a7085c911fbffd0ad4213bc32da2ebd31910276913409dd153bcbd5fc` |

One applicable medium-severity availability defect (CWE-1333) was confirmed:
Project source hints reach a fixed unanchored `.*\S.*` pattern through explicit
file selection and the public validation API. A 200,000-space value fits the
input budget but exceeded a three-second child-process budget in the original
validation archive. Discovery by Project hints already refused that locator;
explicit-file/API paths still needed a repair.

The library compiles a clone of the fixed local schema with the equivalent
existence test `\S`. Original schema bytes, IDs, the `pattern` diagnostic keyword
and accepted strings are preserved. The installed regression exercises all
three CLI projections and all three public validator methods with five-second
deadlines, plus short Unicode/whitespace acceptance cases. This is a bounded
regression deadline, not a language/performance benchmark.

The delivered `fast-uri` dependency changes **3.1.8 → 3.1.9**, fixing the four
current URI advisories listed in the policy. This is the only dependency lock
repair: root maintenance and historical evaluation locks remain unchanged.
The corrected revision/digests form a substantive successor to NF-107 for later
upgrade/rollback qualification. Both private package versions remain
`0.5.0-alpha.1`; no release or invented lifecycle version is created.

## Actual Entry Verification

```sh
node scripts/reference-packages-smoke.mjs --out /absolute/new-candidate --report /absolute/package-checks.json
node scripts/reference-security-smoke.mjs --candidate /absolute/new-candidate --report /absolute/security-boundaries.json
node scripts/reference-security-collect.mjs --candidate /absolute/new-candidate --out /absolute/new-evidence
```

Use the exact pinned Node/npm/compiler route from the candidate instructions.
Provision locked dependencies with lifecycle scripts disabled, the official
HTTPS registry and no proxy configuration. The collector needs network only
for public advisory/release metadata; it never processes project manifests or
sends private source/data to that service. Dated exact npm names/versions are
queried through the OSV API, including pagination and full advisory records.
Unavailable inputs or unknown matches fail qualification rather than count as
a pass. An advisory match is an input for applicability review, not an automatic
exploit claim or a clean-bill-of-health certificate.

Installed-entry checks cover hostile YAML, duplicate keys/documents, unsafe
tags/cycles/UTF-8, byte limits, path escapes, symbolic links, nonregular files,
authored remote schema/reference identifiers, raw-value/secret/root leakage and
unsupported commands. Existing candidate checks retain all maintained valid
projects, prior negative fixtures, corruption refusals, exact schema indexes,
empty-cache offline installation and application-level read/effect guards.
`validate`, `inspect` and `graph` grant no runtime authority.

## Separate Dependency And License Evidence

The evidence artifact retains:

- Both **actual extracted archives** as separate delivered graphs, including
  the CLI's own nested library, each package's dependencies, legal texts and
  file hashes. Their seven third-party production components are not replaced
  by a root audit result.
- The root maintenance installation, the validation build installation
  (including compiler/types), and npm **11.20.0**'s actual installed dependency
  tree as three distinct graphs. Locks, integrities, dependency edges,
  lifecycle-hook/native-file inventories, legal hashes and a CycloneDX 1.6
  SBOM accompany the complete inventory. npm's development dependency list is
  not mistaken for its installed tool graph.
- Node **26.13.0** as an external prerequisite: binary digest, original combined
  license text/digest, embedded component versions, platform/architecture,
  official release-index response and latest security release in its major
  line. A newly available security release blocks the old line selection.
  HTTPS/same-origin checksums are not independent publisher authentication.
- Dated OSV batch queries, full responses/advisories, per-graph severity and
  dispositions, collector/policy digests, final archive/lock hashes and explicit
  unresolved/not-tested lists. The CI artifact has a checksum set and 90-day
  retention; retain verified copies before expiry.

Four npm-tool dependencies (`@npmcli/agent`, `@sigstore/verify`,
`spdx-exceptions`, `spdx-license-ids`) supply license metadata but no separate
license text in this upstream npm distribution. Their missing-text records
remain explicit. They are external build tools, not redistributed candidate
contents; every delivered dependency must retain its original legal text.

The dated policy is in
[`reference-security-policy.json`](../scripts/test/reference-security-policy.json).
The delivered graph must have **no undispositioned matches**. The currently
retained affected tool copies are visible rather than reported as repaired:

| Graph/component | Disposition and reviewed boundary |
| --- | --- |
| Root `fast-uri` 3.1.8, four URI advisories | Fixed repository schemas, no remote schema loader or URI-based authority/navigation decision ([validator](../scripts/lib/schema-validation.mjs)). Does not cover authored schemas or using URI parsing as an access-control boundary. |
| npm `brace-expansion` 5.0.9 / `minimatch` 10.2.5 / `glob` 13.0.6 | Bounded tool risk: reviewed fixed package lists, no manifest-controlled glob or cancellation security boundary; local pack/install is offline. Arbitrary package metadata/commands remain outside scope. |
| npm `ip-address` 10.5.0 | npm's `socks` consumer; qualified route has no SOCKS/proxy configuration or address-based allowlist. Affected classifiers/parsers remain outside the supported route. |
| npm `postcss-selector-parser` 7.1.4 | `@npmcli/query` consumer; qualified commands are `ci`, `pack`, local `install`, not arbitrary query selectors. |
| npm `undici` 6.28.0 | `node-gyp/lib/download.js` consumer; lifecycle/native downloads disabled by `--ignore-scripts`. No WebSocket/EventSource/custom TLS callback route; not shipped. Node's embedded 8.12.2 copy is separately queried. |

These decisions were freshly scoped to the preview build/install paths on
**2026-11-03**; they do not inherit v0.4 dispositions or declare npm globally
safe. Reassess at release review or on any version, schema-authority, command,
proxy/network-policy or advisory change. Unknown IDs or changed reviewed
advisory content fail closed.
Affected upstream versions remain in inventories; new tool versions require
an explicit toolchain update and requalification, not a silent transitive edit.

## Remaining Gates

The collector's npm advisory results do not fully assess Node's native C/C++
components, OS libraries, publisher compromise or all upstream source code.
Original combined Node license/component records and current upstream security
release inputs are retained, but native/CPE/OS scanning is explicitly not-tested.
Read/effect hooks are application instrumentation, not an OS sandbox or a
defense against a hostile process racing directory renames. Three-target
install/upgrade/rollback, OS network denial and external-runtime provisioning
belong to NF-109. Developer ID/notarization, Authenticode and independent
publisher signatures are not supplied by this unsigned preview. NF-110 must
review the final release candidate and residual risks separately.
