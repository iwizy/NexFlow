# Current Validation Boundary Qualification

NF-102-04 tests the exact repaired native candidate bytes under real target OS
controls, not a virtual environment or fixture pretending to be a sandbox.
Actual native records are required before any target acceptance.
The maintainer-delegated [candidate disposition](../delivery/candidate-disposition.json)
excludes Rust and Go after their actual failed Windows confinement gates. Their results
stay failed and unscored; this does not waive any selected candidate's boundary
requirement. Completed evaluation is distinct from all four candidates qualifying.

Linux combines unprivileged Landlock read roots and a seccomp syscall policy:
network, process creation, foreign process tracing, namespace changes, keyring
and io_uring setup are denied; runtime threads remain possible. macOS uses the
reviewed Seatbelt policy with exact entry/runtime/input read roots. Windows
uses a task-scoped, capability-free AppContainer, restricted child creation,
only three explicit inherited standard handles and a kernel Job memory limit.
No global firewall, user installation, keychain or external credentials change.

Independent positive and restricted controls precede each candidate. Filesystem
read/write, a synthetic credential file, real loopback traffic and subprocesses
are tested. POSIX fork/bind controls are preserved; Windows packet isolation is
not mislabeled as denying every socket/bind syscall. The actual child token must
be an AppContainer with zero capabilities. OS drop-style connection timeouts are
separate from the test harness's own deadline timeout.

All eleven unchanged shared CLI cases and eight justified supplemental cases
run twice. The supplemental cases cover escaping paths/symlinks, remote locators,
runtime rejection, inert extension declarations and synthetic value redaction.
Only validated public outputs can enter the inert queue model. Forged/revoked
grants, native-detail injection, secret markers and post-publication mutation
are rejected before a queue receives data. A synthetic extra file descriptor
is explicitly inherited in a positive control and withheld under confinement.

Resource policy includes deadline cancellation, bounded public output/packet
interfaces and memory limits. Unix memory enforcement is an external 50ms RSS
watchdog with disclosed overshoot, not an instantaneous kernel memory cap;
Windows uses its native process committed-memory Job limit. Sampled RSS is not
reported as an exact peak-memory performance benchmark. Runtime system reads,
platform-private cache paths and standard IO are explicit exceptions.

The inert contract has no provider/credential/extension backend. Relevant future
IPC, revocation and state failure behavior is a model, not a certified production
runtime. Kernel compromise and an adversarial privileged parent remain outside
the declared threat model. A future executable runtime needs its own native
security qualification; this task does not authorize implementation or effects.

See [Landlock](https://docs.kernel.org/userspace-api/landlock.html),
[seccomp](https://docs.kernel.org/userspace-api/seccomp_filter.html) and the
[AppContainer launch contract](https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer)
for mechanism contracts. Only the recorded paired controls establish behavior.

Run `node scripts/qualification/verify-security.mjs` for source-bound records
and inert contract regressions. Zero native records means no native acceptance.
