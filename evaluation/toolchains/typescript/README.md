# TypeScript Toolchain Plan

Node 22.23.2, npm 10.9.8 and TypeScript 7.0.2 are exact pins. Runtime dependencies
are AJV 8.20.0, ajv-formats 3.0.1 and yaml 2.9.0; @types/node 22.20.5 is build-only.
[package-lock.json](package-lock.json) includes transitive integrity hashes and
all platform-specific compiler packages, not just the one installed natively.
Later targets must install their own locked compiler package and record evidence.

Provision inside this directory with npm ci --ignore-scripts --no-audit --fund=false.
After provisioning/cache preparation, build with:

~~~sh
npm ci --ignore-scripts --offline --no-audit --fund=false
npm run build
~~~

From the repository root, run the command in the [common instructions](../README.md).
[src/probe.ts](src/probe.ts) is compiled by the pinned compiler; it does not import
the historical repository CLI or semantic validator.
[probe-result.json](probe-result.json) records only the dependency capability cases.

The proposed CLI uses built-in
[parseArgs](https://nodejs.org/api/util.html#utilparseargsconfig), then a private
package built with [npm pack](https://docs.npmjs.com/cli/v10/commands/npm-pack/)
with --ignore-scripts --offline. Runtime dependencies must be provisioned from the
lock, not fetched when validation starts. A tarball does not bundle Node or prove
offline installation, signing or lifecycle support. No SEA artifact is claimed.

[AJV's dialect documentation](https://ajv.js.org/json-schema.html) requires its
2020 export for Draft 2020-12. The probe uses that export, explicit format checks
and preloaded schemas, with no async/network schema loader.
[yaml options](https://eemeli.org/yaml/) select YAML 1.2, unique string keys and
bounded alias conversion for the tested input. Full-corpus fidelity remains later work.
