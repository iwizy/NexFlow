# Offline And Denied-Effects Evidence

NF-056-10 evaluates the unchanged TypeScript, Python, Rust and Go source
candidates with one independent macOS ARM64 OS deny harness. It does not
repair their unsupported semantics, select a language or pass every architecture
security/target gate.

## Method And Result Scope

Each report pins the [complete prototype source](../fidelity/source-pins.json),
its published prerequisite PR/CI, the frozen specification, corpus and catalog,
the committed harness, native executable/entry digests, C control source/binary
and the exact instantiated policy hash. Local paths are not published.

Provision and build separately with the approved exact toolchains and unchanged
locks. The TypeScript runtime is Node 22.23.2/npm 10.9.8, Python uses its
hash-locked CPython 3.12.14 environment, Rust is built with frozen Cargo 1.99.0
and Go with Go 1.27.1, read-only modules and CGO disabled. Reused prepared caches
are not a sandbox or signed provenance; supply-chain acceptance is a separate
experiment.

Before **each candidate**, run the compiled [synthetic control](deny-canary.c)
outside and inside that candidate's exact Seatbelt profile. All seven operations
must succeed unrestricted and fail with EPERM/EACCES under the policy:

- read a synthetic credential file outside the allowed fixture;
- write an outside marker;
- connect to a harness-owned loopback listener and bind a loopback socket;
- fork, spawn a harmless executable and spawn the allowed control itself.

Socket creation alone is deliberately not a network denial test. Controls use
no real credentials, external destination, customer data or production service.
The candidate is not run if controls, startup or reviewed inputs are unavailable.

Then run all 11 unchanged frozen CLI cases plus ten supplementary scenarios,
each twice: absolute/parent/remote file selection, a file symlink, a reviewed
root alias, a root symlink to a protected directory, an unsupported effect command,
inert command/remote/credential declarations, inert inspection and synthetic
schema-value redaction. A reviewed root alias is allowed, not falsely labeled
an escape; a symlink outside the granted read area must fail. Candidate envelopes,
diagnostics, deterministic stdout, no execution authority, input/outside-file
immutability and absence of synthetic secret/local-root disclosure are checked.
Supplementary cases do not replace or simplify the frozen corpus/oracle.

The profile denies network, process creation/execution, file data reads outside
reviewed sources/fixtures/runtime roots and writes except the null device.
Required system reads, parent-directory enumeration and global file metadata
are explicit exceptions. The launcher passes only an allowlisted environment
and the standard spawn stdio contract; this is not a full inherited-facility audit.

Historical [Seatbelt design background](https://www.chromium.org/developers/design-documents/sandbox/osx-sandboxing-design/)
notes that already-open OS facilities can survive applying a policy. This
experiment does not assume all IPC, brokers or inherited resources are closed.
Its modern behavior is evidenced by the actual controls, not by that older guide.

## Reproduce

Use macOS ARM64 and a reviewed clean checkout. Compile the control separately:

```sh
clang -O2 -Wall -Wextra evaluation/isolation/deny-canary.c -o TASK_CANARY
```

Prepare exact-source checkouts from the fidelity pins and their native CLI builds.
With the pinned Node runtime, run:

```sh
node scripts/runtime-isolation-run.mjs typescript '{"sources":{"typescript":"TASK_TYPESCRIPT","python":"TASK_PYTHON","rust":"TASK_RUST","go":"TASK_GO"},"python":"TASK_PYTHON_VENV_EXECUTABLE","rustBinaries":"TASK_RUST_BINARIES","canary":"TASK_CANARY","runtimeRoots":{"typescript":["TASK_NODE_RUNTIME"],"python":["TASK_PYTHON_BASE","TASK_PYTHON_VENV"],"rust":[],"go":[]}}'
```

Repeat with the other three IDs and the same configuration. Runtime read roots
must be narrowly reviewed directories, never a home directory or filesystem root.
The runner preserves the Python venv invocation path while binding its real
executable to the policy. Fixtures use canonical OS paths. It prints one report,
does not save reports into the repository and refuses missing prerequisites or
inactive controls. Native profile execution may be unavailable inside an already
sandboxed process; do not treat that failure as candidate success or bypass the
host's permission policy.

The consistency check is:

```sh
npm run runtime-isolation-smoke
```

CI checks the committed records, exact harness source bindings, full scenario
inventory and rejection paths. It does not rerun the native macOS experiment or
turn failed/not-tested results into passes.

## Reports And Remaining Gates

The four [TypeScript](typescript.json), [Python](python.json),
[Rust](rust.json) and [Go](go.json) reports each passed all 21 scenarios twice
after their seven paired OS controls. Harness commit:
`598caa4163f63ba5481cc4851e488fcfd5b4ef3d`. The local environment is
macOS 27.0.1 ARM64, **not** the frozen macos-15 image/cohort. Scoped
offlineOperation is passed only if all 21 scenarios pass with active controls;
securityBoundary remains **partial**, and overall architecture is **not-ready**.
Linux/Windows deny experiments and all install/distribution lifecycles remain
not-tested.

Mach IPC, keychain brokers, replacement races, devices, resource exhaustion,
complete secret detection and every inherited OS facility remain unproven.
Passing these bounded controls is not a general security certificate, OS support
promise or runtime effect authorization. Initial candidate scorecards, unsupported
semantics, failed fidelity gates and full diagnostics limitations remain unchanged.

## Honest Preflight Repairs

Early controls failed startup because directory data reads needed explicit
parent-directory permissions. Socket creation was permitted even with network
denial, so actual loopback connect/bind controls replaced that insufficient probe.
Both failures were detected before candidate passes were recorded.

The first CLI preflight used an uncanonical temporary path in the OS allowlist
and denied legitimate inputs. A later invocation normalized Python's executable
and accidentally lost venv selection. Both shared harness errors were repaired.
The initial root-symlink assertion also incorrectly rejected a reviewed alias;
the final experiment separately tests that permitted alias and a protected
outside directory. Candidate source, baseline, corpus and oracle did not change.
Final evidence is rerun on the committed repaired harness, not an earlier draft.
