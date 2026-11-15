# Offline Runtime Prototype

NF-112 implements the [NF-111 fixture scope](../docs/0.6/runtime-prototype-scope.md)
in TypeScript. Host contracts are inert. The fixture host uses the released pure
validator and owns admission. The static CLI has no dependency on either
prototype package.

The harness supplies one explicit request, four in-memory manifest inputs and
synthetic authority facts. `preflight` checks support without dispatching.
`runFixture` consumes one attempt ID, records intent and rechecks authority before
the single synchronous fixture read. The host retains bounded receipts and
exposes outcome gaps. The harness can simulate revocation at intent recording,
an unavailable adapter result and a failed outcome recorder.

## Run the fixture checks

Use Node.js 26.13.1, npm 11.20.0 and a clean checkout. Download the
[released validation archive](https://github.com/iwizy/NexFlow/releases/download/v0.5.0-alpha.1/nexflow-validation-0.5.0-alpha.1.tgz)
to a temporary directory and verify SHA-256
`07e3966c54bf3c15345811396b84f47677cdfeed99fef4e357676eb306d9f1e1`.
The following commands use that verified archive as `$archive`.

```sh
npm ci --prefix packages/validation --ignore-scripts --no-audit --no-fund
npm install --prefix prototype --offline --ignore-scripts --no-audit --no-fund \
  --no-save --no-package-lock "$archive"
cp -R packages/validation/node_modules/yaml prototype/node_modules/yaml
node packages/validation/node_modules/typescript/bin/tsc -p prototype/tsconfig.json
NEXFLOW_TEST_REVISION="$(git rev-parse HEAD)" \
  node --import ./scripts/test/no-runtime-deny.mjs prototype/tests/admission.mjs
```

The compiler, its type declarations and the YAML syntax visitor come from the
existing validation lock. The host uses the same pinned YAML version to reject
aliases before delegating parsing and static validation to the released API.
Setup uses package provisioning. The fixture run uses the existing effect
guardrails and needs no external inputs. The output records decisions, receipts,
adapter call counts, toolchain, revision and platform.

## NF-113 qualification

The Runtime Prototype workflow runs the same fixture on Ubuntu 24.04 AMD64,
macOS 15 ARM64 and Windows Server 2025 AMD64. Each job records its exact image,
kernel, architecture and source revision. The comparison job requires identical
decisions, call counts and projected receipts on all three targets. It retains
the 66 NF-112 cases and verifies their normalized digest against the prior
Linux and macOS evidence. The workflow retains each native report and the
platform comparison as artifacts.

Additional cases exercise an unsupported adapter and loss of availability
before and after intent recording. The host selects only the fixed fixture
adapter and supplies only the admitted resource key. A refused selection makes
zero calls. An unclear result leaves a gap with at most one attempted call and
no fallback or replay. The filesystem, network and credential request budgets
are zero. The harness checks the application read/write and network guardrails
and monitors a synthetic credential environment variable during an approved run.

The public receipt projects an event ID unique within the process, the scoped
requester and fixture subject, the attempt correlation ID, the intent ID as
causation for a post-intent decision, and the policy epoch used for the decision.
Fields without safely attributable scope or policy use null. The projection
omits manifest bodies, paths, synthetic credentials, approval data and raw
exceptions. It exposes neither a real identity authentication claim nor the
full event interoperability envelope. Tests assert that caller-supplied
receipts cannot be used as authority and that modifying returned data leaves
the stored copy intact.

This is a source-only prototype. The synchronous recheck covers the synthetic
host's state changes before dispatch. Receipts, attempt consumption and outcome
gaps live only in that host instance. A fresh host starts empty and has no
recovery or receipt-import path. Cross-restart deduplication and reconciliation
are unsupported. Real identity authentication, durable audit, distributed
revocation, OS isolation, real adapters and production execution remain outside
the scope. The prototype carries no NF-RUNTIME conformance claim.
