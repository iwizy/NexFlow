# Native Lifecycle Completion

NF-102-03 completes the maintainer-authorized unsigned evaluation scope. It does
not satisfy the historical signed public-distribution criterion or qualify all
four prototypes. The [scope amendment](../../delivery/unsigned-policy.json) and
[candidate disposition](../../delivery/candidate-disposition.json) retain these
distinctions. Public signing/notarization is deferred to NF-103.

Actual observations: [run 40234645590](https://github.com/iwizy/NexFlow/actions/runs/40234645590),
producer `2a28b632994eecd1ec41a7f20ec508313d6f2b64`, one shared native VM per target:
Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows Server 2025 AMD64. Each cohort
records exact image, OS, CPU and before/after fingerprints; hosted labels do not
claim reproduction of the old October 1 images.

| Candidate | Linux AMD64 | macOS ARM64 | Windows AMD64 | Disposition |
| --- | --- | --- | --- | --- |
| TypeScript | passed | passed | passed | eligible subject to security/measurement review |
| Python | passed | passed | passed | eligible subject to security/measurement review |
| Rust | passed | passed | failed | current prototype rejected; unscored |
| Go | passed | passed | failed | current prototype rejected; unscored |

Every candidate retains all eleven unchanged CLI cases, repeated twice for
previous installation, upgrade and rollback. Expected validation rejections
remain rejections. Tests cover Unicode/space prefixes, checkout schemas hidden,
OS network denial with a working unrestricted control, immutable-slot activation,
tampered upgrade refusal, and scoped uninstall preserving outside inputs.
Windows uses an actual capability-free AppContainer. Rust fails its canonical
root discovery; Go exits internally before discovery in that profile. These are
failures of the current prototypes, not claims about the languages generally.

Genuine previous archives were retained from
[run 39406341776](https://github.com/iwizy/NexFlow/actions/runs/39406341776),
producer `3cbbd1bc02da0768c9c116a18f56dab9a3ef3cb6`. V2 adds a shipped verified
installer and immutable-slot activation, rather than a date-only rebuild or a
simulated product release. Previous packages use the current compatibility
installer/launcher. Original candidate source/lock files remain unchanged.
Runtime/interpreter prerequisites remain external and explicit.

`archive-verification.json` independently extracts all twelve retained native
archives, verifies 2,937 file entries and checks every original V1 payload file
against its immutable manifest. `attempts.json` preserves earlier failed harness
observations. Run `node scripts/qualification/verify.mjs lifecycle` to verify raw
records, original results, source bindings and five installer controls. Capture
CI success means evaluation completed; it does not turn rejected prototypes or
unperformed signing into passes.
