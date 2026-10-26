# NF-102-06: Reference Architecture Decision

**Accepted: TypeScript, layout B**, for unsigned developer validation and future
host interface design. The [decision record](decision.json) separately binds
the reviewed RFC/evidence revision `d0f3949543faff32bc579b243e92c177392dab42`
and committed review `4a1e2c350bf59be06a7ef9177bf4015ba61641f2`.
It exercises Alexander Agafonov's explicit delegation of technical decisions;
no separately received personal review, independent reviewer or signature is
invented. CI, publication and merge are verification steps, not the authority
for this decision. [The immutable review](review.md) records both lenses and
all eleven scoped gate assessments.

The original weights produce 55.8 for TypeScript and 52.8 for Python. TypeScript
leads the nine library-throughput pairs and the bounded type/API-maintenance
assessment; Python leads cold start, native memory and all build/CI comparisons.
Those tradeoffs and missing onboarding evidence are retained. Current Rust/Go
fail Windows confinement and remain rejected/unscored. Their 42 metric cells
stay excluded/null; the original all-four-success criterion is false.

Layout B separates spec, validation, CLI, host contracts, future host, adapters
and extensions without an unmeasured second-language bridge. The current
rooted library facade is not already a pure kernel. Pure-kernel extraction,
graph/init porting and broader semantic/CLI/ABI support need their own
implementation evidence. The 85 inert models specify failure contracts for
future authority and storage; they do not implement a production runtime or
durable backend.

The certificate-free developer route is a JavaScript source/declaration package
with separately provisioned Node. Actual TypeScript capsules contain identical
24-file distributions on all three native targets, with no detected native
project executable or nested archive. **Project signing/notarization was not
performed; the original signing criterion remains false.** Trusted public
publisher/runtime verification and any applicable future native app/installer
signing remain NF-103. No certificate, keychain change or OS security bypass is
used. The two retained npm build-tool notice gaps are absent from the selected
capsules; no legal/public redistribution approval is inferred.

Existing NF-101 ownership remains pre-release best effort, without a new SLA,
backup, on-call commitment, signing key or production access. No runtime
implementation, product release, package/tag publication or version change is
authorized. Historical RFC-0023, review/report snapshots, original failures,
sources, locks and frozen specification/corpus/catalog/oracle remain unchanged.
The forward [RFC-0025](../../../rfcs/RFC-0025-reference-implementation-architecture.md)
is the current developer/design direction within these explicit boundaries.
