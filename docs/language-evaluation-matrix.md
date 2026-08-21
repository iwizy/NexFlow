# Runtime Language Evaluation Matrix

Status: Evaluation framework; no language selected

This document defines how NexFlow will compare TypeScript, Python, Rust, and Go
before a Runtime Architecture Decision. It records criteria, weights, hard
gates, required prototypes, and evidence rules. It does not recommend a winner
and does not authorize runtime implementation.

The NexFlow specification remains language-independent regardless of the
eventual implementation decision. Repository maintenance scripts written in a
particular language are not evidence that the language has been selected for a
reference CLI or runtime.

Related documents:

- [Runtime Options](runtime-options.md)
- [Architecture](architecture.md)
- [Security Model](security-model.md)
- [Validation](validation.md)
- [CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md)
- [Conformance](conformance.md)
- [RFC-0011: Reference CLI Scope](../rfcs/RFC-0011-reference-cli-scope.md)
- [Roadmap](roadmap.md)

## Decision Boundary

The future architecture decision must evaluate at least three layouts:

1. one language and shared packages for the validation CLI and runtime
2. one language with separate CLI and runtime packages
3. different languages for validation tooling and runtime execution

Using more than one language is not automatically modular. It adds release,
security, conformance, contributor, and interoperability costs that must be
measured. Using one language is not automatically simpler if it weakens
distribution, policy isolation, or integration boundaries.

The first comparison targets a validation-only executable and reusable
specification libraries. Workflow execution, provider calls, credential use,
extension loading, and remote mutation remain outside the prototype.

Every candidate layout must preserve the
[CLI And Runtime Responsibility Boundary](cli-runtime-boundary.md). Shared
packages or a shared binary must not initialize runtime authority for
validation commands; separate languages or repositories do not count as
isolation without testable effect boundaries.

## Hard Gates

A candidate is ineligible for the initial reference implementation if the
prototype cannot demonstrate all of these gates:

| Gate | Required evidence |
| --- | --- |
| Specification fidelity | Parse NexFlow YAML and validate JSON Schema draft 2020-12 with local references without changing accepted manifest meaning. |
| Deterministic diagnostics | Produce stable machine-readable diagnostic category, path, severity, and message fields for the shared fixture set. |
| Offline operation | Run validation with network access disabled after dependencies and test artifacts are provisioned. |
| Reproducible dependency graph | Pin the compiler or interpreter, direct and transitive dependencies, and build commands in reviewable files. |
| Supported distribution targets | Build and run reviewed artifacts for the selected macOS, Linux, and Windows architecture matrix. |
| Security boundary | Demonstrate fail-closed filesystem and network behavior for the prototype; language facilities may assist but do not replace application policy. |
| Supply-chain evidence | Produce dependency inventory, license inventory, vulnerability scan results, artifact checksums, and provenance for the evaluated revision. |
| Provider neutrality | Complete the prototype without requiring one model provider, hosted service, or proprietary SDK. |
| Scope integrity | Keep the prototype validation-only and make no `NF-RUNTIME` or orchestration claim. |

A failed gate is not offset by a high weighted score. The report must mark the
candidate ineligible or rerun the failed evidence after a documented change.

## Weighted Criteria

Candidates that pass every hard gate are scored from `0` to `5` for each
criterion. The weighted result is `weight * score / 5`. Weights total `100`.

| Criterion | Weight | What must be measured |
| --- | ---: | --- |
| Specification and validation fidelity | 20 | Draft 2020-12 behavior, YAML edge cases, local reference resolution, diagnostic precision, and parity with repository fixtures. |
| Security and isolation fit | 15 | Filesystem and network restriction, subprocess control, native extension boundary, secret redaction, dependency execution, and sandbox integration. |
| Cross-platform distribution | 15 | Artifact production, install and upgrade path, signing, checksums, target coverage, artifact size, and runtime prerequisites. |
| Ecosystem and integration fit | 10 | Maintained libraries for YAML, JSON Schema, CLI, graphs, policy, telemetry, MCP, A2A, and future provider-neutral adapters. |
| Contributor accessibility | 10 | Setup time, learning evidence, editor support, debugging, review clarity, and ability to recruit maintainers. |
| Maintainability | 10 | Type and error modeling, module boundaries, test ergonomics, API stability, upgrade work, and long-term ownership. |
| Performance and resource use | 8 | Cold start, validation throughput, peak memory, concurrency behavior, and artifact startup variance. |
| Observability and diagnostics | 5 | Structured logs, traces, profiling, crash reporting, redaction, and deterministic user-facing diagnostics. |
| Embedding and interoperability | 4 | Library API stability, foreign-function boundary, subprocess protocol cost, editor integration, and reuse by other implementations. |
| Operational footprint | 3 | Toolchain size, build time, CI minutes, cache behavior, and release matrix complexity. |

### Scoring Scale

| Score | Meaning |
| ---: | --- |
| `0` | Requirement cannot be met or no evidence exists. |
| `1` | A fragile proof exists with major unresolved blockers. |
| `2` | The prototype works only with material limitations or manual steps. |
| `3` | The requirement is met with documented, acceptable tradeoffs. |
| `4` | Evidence is strong across the target matrix with minor limitations. |
| `5` | Evidence is complete, repeatable, and materially stronger than the other candidates. |

Round only the final total. Every score must link to evidence; an unsupported
score is `0`, not an estimate.

## Comparison Matrix

The entries below are evaluation hypotheses, not scores. Each one identifies
what the common prototype must confirm or disprove.

| Criterion | TypeScript | Python | Rust | Go |
| --- | --- | --- | --- | --- |
| Validation fidelity | Strong alignment with JSON-oriented tooling is plausible; exact draft 2020-12 and YAML behavior must be tested. | Mature data and automation ecosystem is plausible; exact schema dialect, duplicate-key, and diagnostic parity must be tested. | Strong type modeling is plausible; library completeness and local-reference behavior must be tested. | Simple compiled tooling is plausible; schema dialect completeness and diagnostic parity must be tested. |
| Security boundary | Evaluate Node permission controls, dependency lifecycle scripts, native addons, subprocesses, and OS sandbox integration. | A virtual environment is dependency isolation, not a security sandbox; evaluate imports, subprocesses, native wheels, and OS sandbox integration. | Evaluate unsafe code, build scripts, native dependencies, subprocesses, and OS sandbox integration rather than assuming memory safety is complete isolation. | Evaluate subprocesses, cgo, module download behavior, and OS sandbox integration rather than treating a compiled binary as a policy boundary. |
| Distribution | Compare a managed Node installation with SEA artifacts; Node SEA remains an active-development surface and must not be assumed stable. | Compare wheels and console entry points with an explicitly selected self-contained packaging approach; record interpreter and native-wheel requirements. | Measure target-specific release binaries, libc and native dependency choices, signing, and cross-build reproducibility. | Measure target-specific executables, cgo-free and cgo-enabled cases, signing, and cross-build reproducibility. |
| Dependency integrity | Evaluate lockfile enforcement, registry policy, lifecycle scripts, vendoring options, and offline install. | Select and document one lock and build workflow; measure indexes, wheels, source builds, hashes, and offline install. | Evaluate `Cargo.lock`, `--locked` or `--frozen`, build scripts, registry policy, vendoring, and native crates. | Evaluate `go.mod`, `go.sum`, module proxy and checksum settings, vendoring, and cgo dependencies. |
| Contributor experience | Measure setup and review with contributors who use and do not use the JavaScript ecosystem. | Measure setup and review with software, research, and infrastructure contributors. | Measure compiler feedback, build latency, onboarding, and the cost of unsafe or native integration review. | Measure setup, explicit error handling, tooling consistency, and onboarding across CLI and service work. |
| Integration fit | Prototype only the interfaces NexFlow actually needs; ecosystem size alone is not evidence. | Prototype only the interfaces NexFlow actually needs; AI-library popularity alone is not evidence. | Measure adapters and protocol libraries without weakening core boundaries through native or generated code. | Measure adapters and protocol libraries without forcing protocol details into the core model. |
| Performance | Benchmark identical inputs, diagnostics, concurrency, and cold starts. | Benchmark identical inputs, diagnostics, concurrency, and cold starts. | Benchmark identical inputs, diagnostics, concurrency, and cold starts. | Benchmark identical inputs, diagnostics, concurrency, and cold starts. |
| Maintenance | Evaluate API stability, dependency churn, supported runtime versions, and refactoring safety. | Evaluate interpreter support windows, typing discipline, dependency churn, and packaging ownership. | Evaluate minimum supported Rust version, compile cost, dependency churn, and ownership of unsafe/native boundaries. | Evaluate Go version policy, module upgrades, dependency churn, and maintainability of explicit interfaces. |

## Official Review Baselines

These sources establish only language and toolchain behavior. They do not prove
that a NexFlow implementation will satisfy the matrix.

| Candidate | Baseline facts to verify during the spike |
| --- | --- |
| TypeScript | The [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) defines TypeScript as a static typechecker for JavaScript. Node documents a [Permission Model](https://nodejs.org/api/permissions.html) and [single executable applications](https://nodejs.org/api/single-executable-applications.html); SEA is documented as active development and must be evaluated as such. |
| Python | The [Python Packaging User Guide](https://packaging.python.org/en/latest/flow/) describes source distributions and wheels, and its [entry point specification](https://packaging.python.org/en/latest/specifications/entry-points/) defines console command wrappers. The standard library documents [virtual environments](https://docs.python.org/3/library/venv.html); they must not be treated as an application sandbox. |
| Rust | The [Cargo Book](https://doc.rust-lang.org/cargo/) documents package, dependency, and build management. `cargo build` supports explicit targets and release profiles, while `Cargo.lock` records dependency resolution; build scripts and native dependencies remain part of the security review. |
| Go | The Go documentation defines [executable builds](https://go.dev/doc/tutorial/compile-install) and the [module system](https://go.dev/ref/mod), including `go.mod`, `go.sum`, proxy behavior, and checksum verification. cgo and target-specific dependencies must be evaluated separately. |

The evidence report must pin the exact language, toolchain, schema library, YAML
library, CLI library, and packaging tool versions. A general documentation link
cannot substitute for prototype results.

## Common Prototype

Each candidate must implement the same disposable validation prototype from the
same NexFlow revision. The prototype must:

1. expose `validate` and `inspect` commands only
2. parse the maintained YAML manifests without modifying them
3. reject duplicate mapping keys and malformed YAML deterministically
4. validate all maintained manifests against the current draft 2020-12 schemas
   with local `$ref` resolution
5. exercise the maintained positive, negative, discovery, and semantic fixture
   boundaries selected for the evaluation
6. emit equivalent human-readable and JSON diagnostics
7. operate offline after a documented provisioning step
8. deny undeclared network access and writes outside an evaluation workspace
9. produce target artifacts, checksums, dependency and license inventories, and
   vulnerability results
10. record cold start, elapsed validation time, peak memory, artifact size,
    clean build time, cached build time, and CI time

The prototype must not call providers, execute workflows, resolve credentials,
load third-party extensions, mutate remote systems, or claim conformance beyond
the tested validation surface.

## Target And Test Matrix

The architecture RFC must choose exact supported targets. The evaluation should
at minimum test the targets available to project CI and record unsupported
combinations explicitly rather than treating them as successful by inference.

For each tested operating-system and architecture pair, capture:

- native or cross-build method
- required system libraries or interpreter/runtime
- artifact size and checksum
- signing and notarization path where applicable
- install, upgrade, rollback, and uninstall steps
- cold start and validation measurements
- filesystem, network, and subprocess restriction results

Native extensions, cgo, C libraries, and generated bindings must be evaluated
as separate variants because they can materially change portability, supply
chain, and sandbox assumptions.

## Evidence Record

Each language report should include:

```yaml
candidate: replace-with-typescript-python-rust-or-go
revision: 40-character-git-commit
evaluatedAt: RFC-3339-timestamp
reviewers:
  - reviewer-id
toolchain:
  version: exact-version
  dependencyLock: path
prototype:
  source: path-or-pull-request
  scope: validation-only
targets:
  - os: linux
    architecture: amd64
    result: not-tested
hardGates:
  specificationFidelity: passed | failed
  deterministicDiagnostics: passed | failed
  offlineOperation: passed | failed
  reproducibleDependencies: passed | failed
  distributionTargets: passed | failed
  securityBoundary: passed | failed
  supplyChainEvidence: passed | failed
  providerNeutrality: passed | failed
  scopeIntegrity: passed | failed
scores:
  specificationAndValidationFidelity: 0
  securityAndIsolationFit: 0
  crossPlatformDistribution: 0
  ecosystemAndIntegrationFit: 0
  contributorAccessibility: 0
  maintainability: 0
  performanceAndResourceUse: 0
  observabilityAndDiagnostics: 0
  embeddingAndInteroperability: 0
  operationalFootprint: 0
limitations: []
evidence: []
```

This is an evaluation record example, not a NexFlow manifest or a new
repository schema commitment.

## Decision Procedure

1. Freeze the specification and fixture revision used by all four prototypes.
2. Pin candidate toolchains and dependencies.
3. Run the same target matrix, security experiments, and measurements.
4. Have at least two reviewers score each criterion independently.
5. Reconcile score differences using evidence, not preference.
6. Record failed gates, confidence, maintenance ownership, and unresolved risk.
7. Compare single-language and split-language architecture costs.
8. Publish the evidence with the Runtime Architecture Decision RFC.

The highest numerical score does not automatically win. A decision may prefer
a lower-scoring candidate when a documented architectural constraint is more
important than the aggregate, but the RFC must explain the deviation. A tie is
a valid outcome and should trigger focused follow-up experiments rather than an
arbitrary selection.

## Current Outcome

No common prototypes, completed scorecards, or architecture decision exist.
TypeScript, Python, Rust, and Go remain candidates. Runtime implementation must
not begin until the evidence is reviewed and the Runtime Architecture Decision
is accepted.
