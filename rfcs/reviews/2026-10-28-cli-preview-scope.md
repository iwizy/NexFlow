# 0.5 CLI Preview Scope Review — 2026-10-28

- Task: NF-104
- Review mode: single-maintainer, adopted policy commit `2cd3b442d4549f0e5c1cd4c4363f9449796010df`
- Accountable maintainer: Alexander Agafonov
- Authority: the maintainer's explicit instruction to complete NF-104 and prior delegation of technical implementation decisions; no separate personal signature or independent human review is asserted.
- Review outcome: adopt the bounded 0.5 implementation profile under that delegated task scope.
- Implementation/qualification state: not performed; release/package/tag authority: not granted by this review.

## Exact Inputs

Published-source documentation baseline: `0751e6c7f89d4aebf9815a1e056ece9141905f57` (post-publication main).
RFC-0025 architecture decision remains `0f6f9a863e62eaa53032fc5a28c4ac7c4de2e7b1`.
The new [CLI contract](../../docs/0.5-cli-contract.md) is bound by SHA-256:
`bcefbde5dc7ac1e539f44a47424f8b602fa38f3fa3b6b371791b5dfdec9cd338` (complete UTF-8 file bytes). This binds the profile before a commit
exists without using a moving branch or inventing a self-referential commit ID.
The NF-104 commit/PR contains that exact file; a changed digest needs a forward
review update. Baseline owning documents are identified by immutable Git blobs:

| Baseline file | Git blob at baseline |
| --- | --- |
| `rfcs/RFC-0011-reference-cli-scope.md` | `afc01d6d55eaa8af0ce094fbc5daa00d34e4551a` |
| `rfcs/RFC-0025-reference-implementation-architecture.md` | `592f5f8a9ff2b3688a2b52bf415163848c5eeb5d` |
| `docs/single-maintainer-governance.md` | `49ff6e7aa4f2c0cd83852591062c2e87085d33d8` |
| `rfcs/reviews/2026-10-11-single-maintainer-ownership.md` | `4068c0df1035409907207afec59c19a9ec34c825` |

The source-bound 0.4 publication receipt demonstrates the completed preceding
milestone. It is not executable CLI, package-security or new runtime qualification.
No frozen candidate source, lock, corpus/oracle or historical decision is modified.

Historical 0.4 verifiers compare technical documentation to their assessed
revision. Release-readiness CI now executes both unchanged verifiers in a
separate checkout of published commit
`5cb33caad080f61808949c1de17df2879da9996f`, while requiring the current historical
record directories and verifier scripts to remain identical to that release.
Current source checks and this profile's digest check run against the new branch.
This preserves the old integrity conditions without freezing all future docs.

## Architecture Lens

The chosen TypeScript/layout B direction is retained. Separate pure validation
and root-read CLI packages avoid a future host import and do not create runtime
stubs. The CLI does not initialize provider/credential/network/extension code.

The profile makes three commands plus help/version concrete. Explicit root and
three exclusive selection modes reuse bounded discovery; positional inputs,
parent/recursive search and implicit configuration are excluded. Init is deferred
so this preview has no input-project write budget. Graph remains a declared
static projection. Full project semantic/Core/extension checks are not-run;
fragment qualification is preserved without expanding its meaning.

Independent repository, package, schema, dialect and output version domains are
specified. Exact package-pair and runtime checks precede workspace reads. A new
preview envelope does not claim compatibility with either experimental output.
Unknown/invalid input and internal error paths have explicit classifications,
ordering, redaction, truncation and no partial-success projection. The actual
schema, API and command fixtures are implementation work, not evidence supplied
by this review.

## Security And Delivery Lens

Only the explicit read adapter can access selected local YAML; the pure kernel
has no filesystem or runtime constructor exports. Offline code-point diagnostic
projection, safe root-relative locations and fixed messages constrain disclosure.
No arbitrary schema/remote ref or manifest-selected executable is allowed.

Two local-install tarballs with bundled runtime dependency closure and external
Node avoid inventing a public registry namespace or native signing identities.
The selected Node 26.13.0 LTS version and native download architectures were
checked against the official release inventory on the review date. Actual empty-
cache install, notices, provenance, dependency graph, current advisory disposition
and native denied-effects/lifecycle results remain mandatory NF-107–NF-109 work.
The old Node 26.12.0 evaluation is not new public qualification.

Checksums do not authenticate a publisher independently. Project native signing
is unperformed; package/publisher/upstream-runtime trust still needs review. No
key borrowing, OS trust override or production/user installation change is part
of this decision. Native apps/embedded runtimes reopen the applicable signing path.

## Reconciliation And Decision

Adopt the linked, digest-bound profile for subsequent NF-105–NF-110 work. This is
a disclosed delegated technical scope decision, not two independent reviewers,
a new personal sign-off, blanket waiver or retroactive acceptance of all Draft
RFC-0011 options. The broader RFC stays Draft, with a link to this narrower
profile; no approval is inferred from CI, commit or a future PR merge.

The architecture and security lenses agree on the small validation-only target.
Deferred init, other output formats/Node versions, broader semantics and runtime
are explicit exclusions, rather than failed applicable checks represented as pass.
Existing NF-101 best-effort/no-SLA ownership is the applicable baseline; no new
on-call, backup, signing or external-review obligation is invented. Separately
required independent release/security assessment remains outside this policy's
headcount exception.

Open implementation gates are library/CLI behavior, installed tarball closure,
current actual-graph security and licenses, all claimed native lifecycle targets,
compatibility/conformance/support evidence and the final publication decision.
They block release, not this completed scope-preparation task. NF-110 must assess
one actual candidate through all applicable B1–B8 gates; no package, tag, version
file or runtime implementation changes in NF-104.
