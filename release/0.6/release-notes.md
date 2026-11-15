# NexFlow v0.6.0 — Runtime Prototype Boundary

Proposed notes for a source milestone. The preview introduces a TypeScript
fixture host and separate inert host contracts under the accepted layout B.
The host validates four synthetic manifests, assesses preflight and checks a
scoped approval and human override before reading one fixed in-memory record.
The 0.5 reference CLI remains a static authoring tool with its existing commands
and output.

The same 76 cases passed on Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows
Server 2025 AMD64 with Node.js 26.13.1, npm 11.20.0 and TypeScript 6.0.3.
The [setup guide](../../prototype/README.md) uses the SHA-256-verified 0.5
validation archive. [Technical review and provenance](review.md) record the
evaluated revision, native reports and current dependency findings.

The source preview supports one offline operation and a fixed fixture adapter.
It does not perform deployment, autonomous writes, destructive actions or
real provider calls. The audit projection redacts private inputs. Receipts,
outcome gaps and replay protection last only for the lifetime of the host.
The release provides no native installer, stable host ABI, `NF-RUNTIME` or
`NF-CLI` claim. Manifest `specVersion: "0.1"` stays in use. Support is best
effort under the existing project maintenance and security process.
