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
ln -s ../../packages/validation/node_modules/yaml prototype/node_modules/yaml
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

This is a source-only prototype. The synchronous recheck covers the synthetic
host's state changes before dispatch. Real identity authentication, durable audit,
crash recovery, distributed revocation, native OS isolation, real adapters and
production execution remain outside the scope. NF-113 covers broader policy and
event qualification. The prototype carries no NF-RUNTIME conformance claim.
