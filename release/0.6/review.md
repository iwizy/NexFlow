# 0.6 Runtime Prototype Boundary Review

The NF-114 technical assessment records **ready-with-notes** for a source-only
`v0.6.0` milestone. The evaluated implementation is `06ff15955f8bf5728351c8853c642a907f07c4b5`
on `develop`, with tree `9190c2e9cc68525ecec42584c24b78c371d399d6`.
The [readiness record](record.json) binds this revision. The [evidence index](evidence.json)
retains the exact CI runs, report digests, dependency inventory and advisory scope.
The release promotion, tag and publication require a separate maintainer decision.

## Release Plan Criteria

| [0.6 release-plan criterion](../../docs/release-plan.md#06-runtime-prototype-boundary) | Disposition in the evaluated scope |
| --- | --- |
| Runtime preflight checks are defined | Passed for the [NF-111 fixture](../../docs/0.6/runtime-prototype-scope.md). The host binds the exact validated manifest bytes, version and scope, distinguishes invalid, unsupported, blocked and ready, and returns preflight results without dispatching. |
| Approval enforcement boundaries are explicit | Passed for the fixture. The [NF-112 host](../../prototype/host/src/index.ts) checks a scope-bound approval and rechecks mutable facts after recording intent. Expiry, revocation, human override, explicit deny and unknown inputs prevent a call. The final recheck covers one synchronous host turn. |
| Event emission requirements are documented | Passed for the prototype projection. [NF-113](../../prototype/README.md#nf-113-qualification) verifies event identity, actor, subject, correlation, causation, policy revision, redaction and detached receipts. Missing recordable results remain visible as gaps. Durable storage, recovery and the complete interoperability envelope are outside the scope. |
| Provider abstraction maps to runtime responsibilities | Passed for one synthetic adapter. The host owns support and availability decisions and supplies only the admitted resource key. Unsupported or unavailable adapters produce zero calls. An uncertain result allows no automatic fallback or replay in the same host. Real adapters and provider operations remain unsupported. |
| Credential, network and filesystem policies precede dangerous actions | Passed for the zero-access fixture. Requests for filesystem reads, writes, network, credentials, subprocesses, extensions, provider use or destructive actions are refused. Application guardrails and the synthetic credential canary pass on all three targets. OS isolation and real credential mediation are outside the scope. |

The operation reads one fixed synthetic record in memory after one explicit
request. It provides no autonomous write, deployment or destructive behavior.
The prototype carries no `NF-RUNTIME`, `NF-CLI`, production or OS sandbox claim.
Earlier failed or untested evaluations retain their original dispositions.

## Architecture And Compatibility

[RFC-0025 layout B](../../rfcs/RFC-0025-reference-implementation-architecture.md)
keeps the TypeScript host contracts and fixture host separate from the pure
validator and static CLI. The host uses the published validation archive and a
locked YAML visitor to enforce the fixture's stricter alias boundary. Admission
belongs to the host. The CLI, validation package, schema snapshot, root locks
and published packages retain the bytes and identities of
[v0.5.0-alpha.1](https://github.com/iwizy/NexFlow/releases/tag/v0.5.0-alpha.1).
Manifest `specVersion: "0.1"`, CLI output `0.5-preview.1`, validation API
`validation-api-v1-preview` and host interface `host-preflight-v1-preview`
are separate domains. Existing manifests need no migration. The host interface
is source-only and experimental, with one qualified version pair.

## Native Evidence And Source Setup

NF-111, NF-112 and NF-113 were integrated in [#146](https://github.com/iwizy/NexFlow/pull/146),
[#147](https://github.com/iwizy/NexFlow/pull/147) and
[#148](https://github.com/iwizy/NexFlow/pull/148). All ten post-merge workflows
passed on the evaluated source. The
[platform comparison](https://github.com/iwizy/NexFlow/actions/runs/43707108591/artifacts/14158971517)
checked identical results, adapter call counts and receipts for 76 cases,
including the 66 retained NF-112 cases. All use Node.js 26.13.1, npm 11.20.0 and
TypeScript 6.0.3.

| Target | Actual image and OS build | Post-merge report |
| --- | --- | --- |
| Ubuntu 24.04 AMD64 | `ubuntu24` `20261111.370.1`, kernel `7.0.0-1017-azure` | [Linux](https://github.com/iwizy/NexFlow/actions/runs/43707108591/artifacts/14157729947) |
| macOS 15 ARM64 | `macos15` `20261104.0514.1`, Darwin `24.6.0` | [macOS](https://github.com/iwizy/NexFlow/actions/runs/43707108591/artifacts/14158707804) |
| Windows Server 2025 AMD64 | `win25-vs2026` `20261103.298.1`, build `10.0.26100` | [Windows](https://github.com/iwizy/NexFlow/actions/runs/43707108591/artifacts/14159335182) |

The same source also passed all 76 cases from a fresh local `git archive`
extraction on macOS ARM64 (Darwin `27.2.0`), without `.git` or prebuilt output.
The pinned compiler was provisioned from a seeded cache. The validator was
installed offline from the SHA-256-verified public 0.5 archive. Build and run
instructions are in the [prototype README](../../prototype/README.md). The
Linux and Windows rows above use clean native checkouts. They do not establish
download verification for a future 0.6 archive.

The proposed distribution is repository source, notes and evidence. It has no
separately distributed host packages, compiled runtime, native installer,
embedded Node or vendored dependency tarballs. No native install, update,
rollback or uninstall lifecycle applies to that source archive. A reader can
discard the isolated checkout and its local build outputs. The external 0.5
validator keeps its own [public installation evidence](https://github.com/iwizy/NexFlow/actions/runs/43292142506).

## Security, Dependencies And Provenance

The evaluated tree and the validator archive are pinned independently. The
archive was built at `89292102783454140671d706c234f8e6d17a337c` and contains its
own MIT license, notice and bundled license texts. The candidate source uses
the repository [MIT license](../../LICENSE). The evidence inventory names the
exact versions and declared licenses in the root and validation locks. The YAML
visitor comes from that unchanged validation lock. There is no new runtime
dependency graph or redistribution of the compiler/npm toolchain.

The November 15 registry audit found zero matches in the validation/build lock.
The separate root maintenance audit returned one affected package,
`fast-uri@3.1.8`, across four known advisories. The fixture provisions from the
validation lock, which uses `fast-uri@3.1.9`, and does not install the root
maintenance graph. Its schema references are fixed local inputs. The root
findings remain bounded maintenance risks and are not described as fixed.
The [0.5 security review](../0.5-preview-review.md#security-and-distribution-lens)
retains the original tool findings and missing upstream license texts. This
refresh covers the two locks, without reinterpreting those external-tool
findings as resolved. The pinned Node runtime is the November 11 security
release. [Node.js release notes](https://nodejs.org/en/blog/release/v26.13.1)

The candidate merge commit has verified GitHub provenance. Native signing and
notarization do not apply to the offered source archive. Source commit identity
and SHA-256 integrity checks provide traceability. Publisher signatures,
project signing credentials and native trust certification are not supplied.
Real identity, credentials, network and runtime authority are outside this
assessment. Audit and deduplication are in-memory and per host instance.
After restart, the prototype offers no receipt import, reconciliation or
cross-instance replay prevention.

## Maintainer Review And Publication Cut

The two technical lenses above are for single-maintainer review under
[RFC-0024](../../rfcs/RFC-0024-single-maintainer-governance.md). Alexander
Agafonov retains best-effort support, correction and withdrawal responsibility.
No personal review, independent sign-off or publisher authority is inferred.

Once separately authorized, promote the reviewed `develop` through a PR into
`main`. Verify CI on the exact release cut and compare its prototype, locks,
schemas and test workflow to the evaluated revision. Refresh dated advisory
inputs before publishing. A material change requires affected requalification.
Use the [proposed notes](release-notes.md) and bind `v0.6.0` to the approved
exact cut. This review neither creates a tag nor requires publishing a host
package to a registry.

After publication, download the actual public source archives into clean
directories, record SHA-256 and compare paths and payloads to the exact tag.
Repeat the documented source setup and fixture on the three claimed targets
using those public bytes. Retain the run references, exact environments and
digests. That check is pending until publication. A mismatch or failing fixture
blocks the publication verification result and needs explicit correction or
withdrawal by the maintainer.
