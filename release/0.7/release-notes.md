# Proposed v0.7.0 Integration And Extension Hardening Notes

The proposed source milestone adds exact-version namespace and source records,
ownership evidence, registry lifecycle/history checks and legacy migration.
Integration fixtures keep external GitHub, issue-tracker, MCP and A2A metadata
separate from local capability, permission, approval, network, credential and
audit decisions.

Seventeen compatibility scenarios cover unknown or incompatible profiles,
revoked/withdrawn records, disputed ownership, invalid/ambiguous snapshots and
legacy migration. They also exercise the published CLI and validator against
the same synthetic inputs and preserve the distinction between schema success,
profile support and execution authority.

Manifest `specVersion: "0.1"`, the published `0.5.0-alpha.1` tooling and the
v0.6 source fixture host keep their version domains. CLI extension profile
checks remain `not-run`. Live services, executable loading, hosted registry,
publisher signing and general extension/runtime conformance remain unsupported.
The [technical review](review.md) records the exact source, evidence, migration
and existing maintenance/security limits. Publication requires a separate
maintainer decision and verification of the resulting public source archives.
