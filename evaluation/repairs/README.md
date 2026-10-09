# Validation function repair

This repair implements previously absent native library operations in all four
disposable candidates: semantic fragments, workflow step namespaces and assembly
artifact namespaces. It is not a language selection or a runtime.

Bindings in each candidate's semantic-rules.json are identical, static
specification data derived from
[the reference inventory](../../docs/semantic-reference-inventory.md).
Each language implements its own indexes, exact lookup, duplicate rejection,
typed references, bridge checks, iterative cycle detection, human-authority
resolution, active-definition/component checks and approval target scope checks.
No candidate reads the case catalog, expectations, maintenance oracle or another
language's implementation. The Node harness alone compares results.

The native library boundary now covers all seven operations of the unchanged
352-case catalog. Supplemental checks rename identifiers and case identities,
exercise composed failures, namespace separation, case sensitivity, suppression
of dependent errors, pinned provider references, redaction, long authority chains
and finite depth/node budgets. Every case runs twice without changing its input.

The structural validate/inspect CLI contract is unchanged: its semantic,
core-profile and extension-profile checks remain not-run. Passing fragment
operations is not full project semantic conformance, an Agent Assembly, policy
enforcement or execution authority. Deferred fields and broader specification
gaps are not silently resolved by guessing namespaces.

Rust CLI and library driver use the exact reviewed schemas embedded at build
time. Installed execution no longer depends on the compiler's source checkout.
The native macOS supplemental relocation test copies the executable, changes its
working directory and denies network and reads of the original schema directory.
This does not replace complete install/upgrade/rollback/signing tests on every OS.

## Reproduction

Provision existing approved locks and toolchain versions first, then build and
test each native candidate using its existing workflow. No locks or versions
change in this repair. Each workflow now runs runtime-evaluation-repair-run.mjs
with its candidate name and native library driver command. The --summary option
prints counts and failures; without it the report includes every case result.

On native macOS, runtime-evaluation-rust-relocation-smoke.mjs accepts the freshly
built Rust CLI path and checks source-schema independence in the system sandbox.

## Evidence boundaries

Repair evidence uses a new exact source revision and source-file hashes.
Original candidate pins, initial reports, NF-056-09 comparisons, lifecycle
records, measurements and Draft review bundles remain historical evidence at
their recorded revisions. They are not retroactively changed to passing results.
New library passes do not close unresolved lifecycle, signing, supply-chain,
comparable-performance, reviewer/owner or architecture acceptance gates.
No release, package, tag, version change or human agreement is produced here.
