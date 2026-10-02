# Rust Toolchain Plan

[rust-toolchain.toml](rust-toolchain.toml) pins minimal Rust 1.99.0; observed
rustc and Cargo executables both report 1.99.0.
[Cargo.toml](Cargo.toml) fixes jsonschema 0.58.4 with default features disabled,
serde_json 1.0.145 and yaml-rust2 0.11.0.
[Cargo.lock](Cargo.lock) fixes the full resolved crate graph and registry checksums,
including target-conditional entries. Do not regenerate it during offline runs.

Provision the compiler, native standard library and Cargo in a task-local prefix,
verify official archive hashes in [toolchains.json](../toolchains.json), and use
task-local CARGO_HOME, compiler path and caches. No global Rust installation
is needed. Other target toolchain archive receipts remain unverified.

After online cargo fetch --locked, the capability build is:

~~~sh
cargo build --frozen
~~~

From the repository root:

~~~sh
node scripts/runtime-toolchain-probe-run.mjs --candidate rust \
  --command '["evaluation/toolchains/rust/target/debug/nexflow-rust-capability-probe"]'
~~~

Use .exe for a native Windows program after an actual target build. The later
artifact plan is cargo build --release --frozen --target TARGET, where TARGET
is the native environment's reviewed target triple, not a supported-target claim.
No additional archive packager is chosen; record raw executable bytes/checksum.
CLI parsing will use pinned std::env, adding no argument-parser dependency.

[Cargo lock semantics](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)
do not make build scripts an isolation boundary.
[jsonschema options](https://docs.rs/jsonschema/0.58.4/jsonschema/index.html) are
configured explicitly for Draft 2020-12, format assertion, a local registry and
offline resolution.
[yaml-rust2](https://docs.rs/yaml-rust2/0.11.0/yaml_rust2/) rejects the probed
duplicate mapping; [src/main.rs](src/main.rs) converts its values to JSON.
[probe-result.json](probe-result.json) retains the /2 items:false diagnostic
difference and does not establish full YAML conversion or NexFlow parity.
