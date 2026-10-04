#!/usr/bin/env node
// Trusted evaluation tooling. Provision caches separately; never run on manifests.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

export const collectorVersion = "nf-056-11-v1";
export const sha = value => createHash("sha256").update(value).digest("hex");
const json = file => JSON.parse(readFileSync(file));
const hash = file => sha(readFileSync(file));
const normalized = name => name.toLowerCase().replace(/[-_.]+/gu, "-");
const purl = (type, name, version) => "pkg:" + type + "/" + name.replace(/^@/u, "%40") + "@" + version;
const walk = root => readdirSync(root, { withFileTypes: true }).flatMap(entry => {
  const file = join(root, entry.name);
  return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
}).sort();
const receipt = (file, label) => ({ file: label, sha256: hash(file), bytes: statSync(file).size });
const licenses = root => readdirSync(root).filter(name => /^(license|copying|notice)/iu.test(name))
  .filter(name => statSync(join(root, name)).isFile()).map(name => receipt(join(root, name), name));
const run = (command, args, cwd, extra = {}) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    timeout: 180000, env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "C", LC_ALL: "C", ...extra } });
  assert.equal(result.status, 0, "reviewed inventory/build command failed: " + basename(command) + " " + args[0]
    + "; " + (result.stderr ?? "").replace(/\/(?:Users|private)\/[^\s]*/gu, "<private-path>").slice(0, 500));
  return result.stdout;
};
const stream = text => {
  const values = []; let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; }
    else if (char === '"') quoted = true;
    else if (char === "{") { if (depth++ === 0) start = i; }
    else if (char === "}" && --depth === 0) values.push(JSON.parse(text.slice(start, i + 1)));
  }
  assert.equal(depth, 0); assert.equal(quoted, false);
  return values;
};
function component(type, name, version, scope, license, evidence = {}) {
  return { ref: purl(type, name, version), ecosystem: { npm: "npm", pypi: "PyPI", cargo: "crates.io", golang: "Go" }[type],
    name, version, scope, license: license || "NOASSERTION", licenseAssessment: "upstream-declared-not-legal-approval", ...evidence };
}
export function collect(config) {
  const pins = json("evaluation/fidelity/source-pins.json");
  const recordedAt = new Date().toISOString();
  const collected = {};
  for (const id of Object.keys(pins.candidates)) {
    const source = config.sources[id];
    assert.equal(run("git", ["rev-parse", "HEAD"], source).trim(), pins.candidates[id].sourceRevision);
    assert.equal(run("git", ["status", "--porcelain", "--untracked-files=no"], source).trim(), "");
    const files = run("git", ["ls-files", "evaluation/prototypes/" + id], source).trim().split("\n");
    const sourceManifest = files.map(file => receipt(join(source, file), file));
    for (const item of sourceManifest.filter(item => !item.file.endsWith("/README.md")))
      assert.equal(hash(item.file), item.sha256, "main code or lock differs from pinned candidate");
    collected[id] = { formatVersion: 1, task: "NF-056-11", candidate: id, collectorVersion, recordedAt,
      collectorRevision: run("git", ["rev-parse", "HEAD"], process.cwd()).trim(), ...pins.candidates[id],
      specificationRevision: pins.specificationRevision, evaluationPackageRevision: pins.evaluationPackageRevision,
      corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256, sourceManifest,
      target: "macos/arm64", components: [], dependencies: [], artifacts: [], commands: [],
      outcome: "not-ready", supplyChainAcceptance: "partial", signedProvenance: "not-tested",
      reproducibleBuild: "not-tested", distributionLifecycle: "not-tested",
      limitations: [
        "Dependency metadata and licenses are declarations, not independent legal approval.",
        "Checksums bind observed bytes; no signed build attestation, signing or reproducibility claim.",
        "This native macOS source-bound experiment is not a frozen target cohort or a Linux/Windows distribution.",
        "OS/runtime/compiler bundled dependency closure and operating-system vulnerability coverage are incomplete.",
        "No package manager offline flag or virtual environment establishes an OS security boundary.",
        "Package/version advisory matches do not establish reachability; absence does not certify security."
      ] };
  }
  const ts = collected.typescript, tsRoot = join(config.sources.typescript, "evaluation/prototypes/typescript");
  const tsLock = json(join(tsRoot, "package-lock.json"));
  const tsNames = new Map(Object.entries(tsLock.packages).filter(([key]) => key).map(([key, pkg]) =>
    [key, component("npm", key.split("node_modules/").at(-1), pkg.version,
      existsSync(join(tsRoot, key, "package.json")) ? pkg.dev ? "installed-build" : "installed-runtime" : "locked-other-platform",
      pkg.license, { integrity: pkg.integrity, downloadUrl: pkg.resolved, optional: !!pkg.optional,
        metadataSource: "package-lock.json", licenseFiles: existsSync(join(tsRoot, key)) ? licenses(join(tsRoot, key)) : [] })]));
  function resolveNpm(from, name) {
    let at = from;
    while (true) {
      const key = at ? at + "/node_modules/" + name : "node_modules/" + name;
      if (tsNames.has(key)) return tsNames.get(key).ref;
      if (!at) throw new Error("unresolved npm graph entry");
      at = at.includes("/node_modules/") ? at.slice(0, at.lastIndexOf("/node_modules/")) : "";
    }
  }
  for (const [key, pkg] of Object.entries(tsLock.packages)) {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies });
    ts.dependencies.push({ ref: key ? tsNames.get(key).ref : "candidate:typescript", dependsOn: [...new Set(deps.map(name => resolveNpm(key, name)))].sort() });
  }
  ts.components = [...tsNames.values()];
  ts.commands = ["npm ci --ignore-scripts --offline --no-audit --fund=false", "npm run build"];
  const nodeDir = dirname(config.node);
  const tsEnv = { PATH: nodeDir + ":/usr/bin:/bin", npm_config_cache: config.npmCache };
  run(config.npm, ["ci", "--ignore-scripts", "--offline", "--no-audit", "--fund=false"], tsRoot, tsEnv);
  run(config.npm, ["run", "build"], tsRoot, tsEnv);
  ts.artifacts = walk(join(tsRoot, "dist")).map(file => receipt(file, relative(tsRoot, file)));
  ts.runtime = { name: "Node", version: run(config.node, ["--version"], tsRoot).trim(), executableSha256: hash(config.node),
    requiredExternal: true, licenseFiles: licenses(dirname(nodeDir)) };
  ts.tools = { npm: run(config.npm, ["--version"], tsRoot, tsEnv).trim(), typescript: "7.0.2" };
  assert.equal(ts.runtime.version, "v22.23.2"); assert.equal(ts.tools.npm, "10.9.8");
  for (const [key,c] of tsNames) if (!c.scope.startsWith("locked-"))
    assert.equal(json(join(tsRoot, key, "package.json")).version, c.version);
  ts.nativeBuildInputs = ts.components.filter(c => c.scope === "installed-build" && c.name.startsWith("@typescript/")).map(c => c.ref);

  const py = collected.python, pyRoot = join(config.sources.python, "evaluation/prototypes/python");
  const pythonMetadata = readFileSync(new URL("./lib/supply-chain-python.py", import.meta.url), "utf8");
  const pyData = JSON.parse(run(config.python, ["-I", "-c", pythonMetadata], pyRoot));
  const installed = new Map(pyData.packages.map(pkg => [normalized(pkg.name), pkg]));
  const refs = new Map();
  for (const pkg of pyData.packages) {
    const c = component("pypi", normalized(pkg.name), pkg.version, "installed", pkg.license,
      { metadataSha256: pkg.metadataSha256, licenseFiles: pkg.licenseFiles, nativeFiles: pkg.nativeFiles,
        licenseClassifiers: pkg.classifiers, metadataSource: "installed-wheel-METADATA", requirements: pkg.requires });
    refs.set(normalized(pkg.name), c.ref); py.components.push(c);
  }
  for (const c of py.components) py.dependencies.push({ ref: c.ref, dependsOn: c.requirements.filter(r => r.active).map(r => {
    assert.ok(installed.has(normalized(r.name)), "missing active Python dependency");
    return refs.get(normalized(r.name));
  }).sort() });
  py.dependencies.push({ ref: "candidate:python", dependsOn: [...refs.values()].sort() });
  for (const pkg of pyData.vendored) {
    const c = component("pypi", normalized(pkg.name), pkg.version, "vendored-build", pkg.license,
      { licenseFiles: pkg.licenseFiles, metadataSha256: pkg.metadataSha256, owner: pkg.owner, metadataSource: "vendored-wheel-METADATA" });
    c.ref += "?owner=" + encodeURIComponent(pkg.owner);
    py.components.push(c); py.dependencies.push({ ref: c.ref, dependsOn: [] });
    py.dependencies.find(d => d.ref === refs.get(pkg.owner)).dependsOn.push(c.ref);
  }
  py.vendorLists = pyData.vendorLists;
  for (const list of pyData.vendorLists) for (const pkg of list.packages) {
    assert.ok(pkg.version && pkg.name, "unparsed vendored version");
    const c = component("pypi", normalized(pkg.name), pkg.version, "vendored-build", "NOASSERTION",
      { owner: list.owner, metadataSource: "vendor.txt", vendorListSha256: list.sha256,
        licenseEvidence: "Owner licenseFiles inventory retained; per-component mapping needs review." });
    c.ref += "?owner=" + encodeURIComponent(list.owner);
    if (!py.components.some(item => item.ref === c.ref)) {
      py.components.push(c); py.dependencies.push({ ref: c.ref, dependsOn: [] });
      const owner = list.owner === "setuptools/_vendor/wheel" ? "setuptools" : list.owner;
      py.dependencies.find(d => d.ref === refs.get(owner)).dependsOn.push(c.ref);
    }
  }
  const embeddedRefs = new Map(pyData.embedded.components.map(c => [c["bom-ref"], c.purl]));
  embeddedRefs.set(pyData.embedded.metadata.component["bom-ref"], refs.get("rpds-py"));
  for (const pkg of pyData.embedded.components) {
    const c = component("cargo", pkg.name, pkg.version, "wheel-upstream-sbom", pkg.licenses?.[0]?.expression,
      { metadataSource: "rpds-py-wheel-embedded-SBOM", upstreamSbomSha256: pyData.embeddedSha256,
        archiveSha256: pkg.hashes?.find(h => h.alg === "SHA-256")?.content ?? null,
        linkageAssessment: "upstream-all-targets-declaration-not-independent-binary-verification" });
    assert.equal(c.ref, pkg.purl); py.components.push(c);
  }
  for (const dep of pyData.embedded.dependencies) {
    const ref = embeddedRefs.get(dep.ref); assert.ok(ref);
    const dependsOn = (dep.dependsOn ?? []).map(r => { assert.ok(embeddedRefs.has(r)); return embeddedRefs.get(r); });
    const existing = py.dependencies.find(d => d.ref === ref);
    if (existing) existing.dependsOn.push(...dependsOn); else py.dependencies.push({ ref, dependsOn });
  }
  const pyLock = readFileSync(join(pyRoot, "requirements.lock"), "utf8");
  const lockVersions = [...pyLock.matchAll(/^([A-Za-z0-9_.-]+)==([^\s]+) \\/gmu)].map(m => [normalized(m[1]), m[2]]);
  assert.deepEqual([...installed].map(([name,p]) => [name,p.version]).sort(), lockVersions.sort());
  py.wheels = readdirSync(config.wheelhouse).filter(name => name.endsWith(".whl")).map(name => receipt(join(config.wheelhouse, name), name));
  assert.equal(py.wheels.length, installed.size);
  for (const wheel of py.wheels) assert.ok(pyLock.includes("sha256:" + wheel.sha256), "wheel absent from approved hash lock");
  py.commands = ["python -I -m pip check", "python -I -m compileall -q evaluation/prototypes/python"];
  run(config.python, ["-I", "-m", "pip", "check"], pyRoot);
  run(config.python, ["-I", "-m", "compileall", "-q", pyRoot], pyRoot);
  py.artifacts = walk(pyRoot).filter(file => file.endsWith(".py") || file.endsWith(".pyc"))
    .map(file => ({ ...receipt(file, relative(pyRoot, file)), kind: file.endsWith(".pyc") ? "compiled-bytecode" : "source-entry" }));
  py.runtime = { name: "CPython", version: pyData.python, executableSha256: hash(config.python),
    requiredExternal: true, downloadProvenance: "unavailable-existing-exact-runtime" };
  assert.equal(pyData.python, "3.12.14");
  py.limitations.push("Vendored tooling licenses with NOASSERTION require per-component mapping; upstream rpds SBOM is not proof of actual linked target closure.");
  py.limitations.push("PyYAML native wheel may bundle libyaml without a versioned SBOM; interpreter/wheel native closure is not independently complete.");

  const rs = collected.rust, rsRoot = join(config.sources.rust, "evaluation/prototypes/rust");
  const rsEnv = { CARGO_HOME: config.cargoHome, RUSTC: config.rustc, RUSTDOC: config.rustdoc,
    CARGO_TARGET_DIR: config.rustTarget, PATH: dirname(config.rustc) + ":/usr/bin:/bin" };
  const meta = JSON.parse(run(config.cargo, ["metadata", "--offline", "--locked", "--format-version", "1", "--filter-platform", "aarch64-apple-darwin"], rsRoot, rsEnv));
  const registryLocks = new Map(readFileSync(join(rsRoot, "Cargo.lock"), "utf8").split("[[package]]").slice(1).map(block => {
    const name = block.match(/^name = "([^"]+)"/mu)?.[1], version = block.match(/^version = "([^"]+)"/mu)?.[1];
    return [name + "@" + version, block.match(/^checksum = "([^"]+)"/mu)?.[1] ?? null];
  }));
  const rsRefs = new Map(meta.packages.map(pkg => [pkg.id, pkg.source ? purl("cargo", pkg.name, pkg.version) : "candidate:rust"]));
  for (const pkg of meta.packages.filter(pkg => pkg.source)) {
    const node = meta.resolve.nodes.find(n => n.id === pkg.id);
    const pkgRoot = dirname(pkg.manifest_path);
    const archiveSha256 = registryLocks.get(pkg.name + "@" + pkg.version);
    assert.match(archiveSha256, /^[a-f0-9]{64}$/u);
    const archive = join(config.cargoHome, "registry/cache", basename(dirname(pkgRoot)), pkg.name + "-" + pkg.version + ".crate");
    assert.equal(hash(archive), archiveSha256, "cached crate archive differs from lock");
    rs.components.push(component("cargo", pkg.name, pkg.version, node ? "resolved-target" : "locked-not-target-resolved", pkg.license,
      { archiveSha256, cachedArchiveVerified: true, licenseFiles: licenses(pkgRoot),
        metadataSource: "cargo-metadata-cached-Cargo.toml", features: node?.features ?? [],
        buildScript: pkg.targets.some(t => t.kind.includes("custom-build")),
        proceduralMacro: pkg.targets.some(t => t.kind.includes("proc-macro")) }));
  }
  rs.dependencies = meta.resolve.nodes.map(node => ({ ref: rsRefs.get(node.id),
    dependsOn: [...new Set(node.deps.map(d => rsRefs.get(d.pkg)))].sort(),
    kinds: node.deps.map(d => ({ ref: rsRefs.get(d.pkg), kinds: d.dep_kinds.map(k => ({ kind: k.kind ?? "normal", target: k.target })) })) }));
  for (const c of rs.components) if (!rs.dependencies.some(d => d.ref === c.ref)) rs.dependencies.push({ ref: c.ref, dependsOn: [] });
  rs.commands = ["cargo build --frozen --offline --manifest-path evaluation/prototypes/rust/Cargo.toml (debug, aarch64-apple-darwin)"];
  run(config.cargo, ["build", "--frozen", "--offline"], rsRoot, rsEnv);
  rs.artifacts = ["nexflow-rust-evaluation", "library-driver"].map(name => receipt(join(config.rustTarget, "debug", name), name));
  rs.runtime = { name: "Rust standard library", version: run(config.rustc, ["--version"], rsRoot).trim(), requiredExternal: false,
    compilerSha256: hash(config.rustc), cargoSha256: hash(config.cargo), nativeLinkage: rs.artifacts.map(a => ({
      file: a.file, libraries: run("/usr/bin/otool", ["-L", join(config.rustTarget, "debug", a.file)], rsRoot).split("\n").slice(1).map(s => s.trim()).filter(Boolean)
    })) };
  assert.ok(rs.runtime.version.startsWith("rustc 1.99.0 "));

  const go = collected.go, goRoot = join(config.sources.go, "evaluation/prototypes/go");
  const goEnv = { GOPATH: config.goPath, GOCACHE: config.goCache, GOPROXY: "off", GOTOOLCHAIN: "local", CGO_ENABLED: "0" };
  const deps = stream(run(config.go, ["list", "-mod=readonly", "-deps", "-json", "./cmd/cli", "./cmd/library-driver"], goRoot, goEnv));
  const modules = [...new Map(deps.filter(d => d.Module).map(d => [d.Module.Path, d.Module])).values()];
  const sums = readFileSync(join(goRoot, "go.sum"), "utf8").trim().split("\n").map(line => line.split(/\s+/u));
  for (const [name, version] of sums) if (!version.endsWith("/go.mod") && !modules.some(m => m.Path === name))
    modules.push({ Path: name, Version: version, Dir: null });
  const builtModules = new Set(deps.filter(d => d.Module).map(d => d.Module.Path));
  const goRefs = new Map(modules.map(m => [m.Path, m.Main ? "candidate:go" : purl("golang", m.Path, m.Version)]));
  for (const mod of modules.filter(m => !m.Main && m.Path !== "go" && m.Path !== "toolchain")) {
    go.components.push(component("golang", mod.Path, mod.Version, builtModules.has(mod.Path) ? "compiled-module" : "resolved-test-module", "NOASSERTION",
      { sum: sums.find(([name,version]) => name === mod.Path && version === mod.Version)?.[2] ?? null,
        goModSum: sums.find(([name,version]) => name === mod.Path && version === mod.Version + "/go.mod")?.[2] ?? null,
        licenseFiles: mod.Dir ? licenses(mod.Dir) : [], licenseAvailability: mod.Dir ? "cached-source-files" : "unavailable-uncached-test-module",
        metadataSource: mod.Dir ? "go-list-compiled-module-cache" : "go.sum-unused-test-identity",
        packages: deps.filter(d => d.Module?.Path === mod.Path).map(d => d.ImportPath).sort() }));
  }
  go.testModuleGraph = { status: "not-tested", reason: "Full test-only module metadata is not cached; offline go list -m all failed. No new sums or locks were added." };
  const edges = new Map(go.components.map(c => [c.ref, []])); edges.set("candidate:go", []);
  const imports = new Map(deps.map(d => [d.ImportPath, d.Module?.Path]));
  for (const pkg of deps) for (const name of pkg.Imports ?? []) {
    const parent = goRefs.get(pkg.Module?.Path), child = goRefs.get(imports.get(name));
    if (parent !== child && edges.has(parent) && edges.has(child)) edges.get(parent).push(child);
  }
  go.dependencies = [...edges].map(([ref, dependsOn]) => ({ ref, dependsOn: [...new Set(dependsOn)].sort() }));
  go.standardLibraryPackages = deps.filter(d => d.Standard).map(d => d.ImportPath).sort();
  go.commands = ["GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go mod verify",
    "GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go build -mod=readonly -trimpath -buildvcs=false -o bin/nexflow-go-evaluation ./cmd/cli",
    "GOTOOLCHAIN=local GOPROXY=off CGO_ENABLED=0 go build -mod=readonly -trimpath -buildvcs=false -o bin/library-driver ./cmd/library-driver"];
  run(config.go, ["mod", "verify"], goRoot, goEnv);
  for (const [output, pkg] of [["nexflow-go-evaluation", "./cmd/cli"], ["library-driver", "./cmd/library-driver"]])
    run(config.go, ["build", "-mod=readonly", "-trimpath", "-buildvcs=false", "-o", "bin/" + output, pkg], goRoot, goEnv);
  go.artifacts = ["nexflow-go-evaluation", "library-driver"].map(name => receipt(join(goRoot, "bin", name), name));
  go.runtime = { name: "Go runtime and standard library", version: run(config.go, ["version"], goRoot, goEnv).trim(), requiredExternal: false,
    compilerSha256: hash(config.go), cgoEnabled: false, binaryMetadata: go.artifacts.map(a => ({
      file: a.file, metadata: run(config.go, ["version", "-m", join(goRoot, "bin", a.file)], goRoot, goEnv).split("\n").slice(1).map(s => s.trim()).filter(Boolean) })) };
  assert.equal(go.runtime.version, "go version go1.27.1 darwin/arm64");
  go.limitations.push("License files are hashed; expression attribution must be reviewed for each module. Stdlib package list is version-bound, not OS library certification.");
  go.limitations.push("Compiled package/module closure is enumerated; extra uncached test-only transitive module resolution and its license closure remain not-tested.");
  for (const [id, record] of Object.entries(collected)) {
    const locks = { typescript: ["package-lock.json"], python: ["requirements.lock"], rust: ["Cargo.lock"], go: ["go.mod", "go.sum"] }[id];
    record.locks = locks.map(file => receipt(join(config.sources[id], "evaluation/prototypes", id, file), "evaluation/prototypes/" + id + "/" + file));
    record.components.sort((a,b) => a.ref.localeCompare(b.ref));
    for (const dep of record.dependencies) dep.dependsOn = [...new Set(dep.dependsOn)].sort();
    record.dependencies.sort((a,b) => a.ref.localeCompare(b.ref));
    const allRefs = new Set(["candidate:" + id, ...record.components.map(c => c.ref)]);
    assert.equal(allRefs.size, record.components.length + 1);
    for (const d of record.dependencies) assert.ok(allRefs.has(d.ref) && d.dependsOn.every(r => allRefs.has(r)), "unbound dependency edge");
    assert.equal(run("git", ["status", "--porcelain", "--untracked-files=no"], config.sources[id]).trim(), "");
    for (const item of record.sourceManifest) assert.equal(hash(join(config.sources[id], item.file)), item.sha256);
  }
  assert.ok(!/\/Users\/|\/private\/|file:\/\/|\/var\/folders\//iu.test(JSON.stringify(collected)), "private metadata in evidence");
  return collected;
}
if (process.argv[1]?.endsWith("runtime-supply-chain-collect.mjs")) {
  const records = collect(JSON.parse(process.argv[2]));
  if (process.argv[3] === "--interactive") {
    const { createInterface } = await import("node:readline");
    console.log(JSON.stringify({ ready: true, counts: Object.fromEntries(Object.entries(records).map(([id,r]) => [id,
      { components: r.components.length, dependencies: r.dependencies.length, vendorLists: r.vendorLists?.length ?? 0,
        digests: Object.fromEntries(["components","dependencies","vendorLists"].map(key => [key,sha(JSON.stringify(r[key] ?? []))])) }])) }));
    const input = createInterface({ input: process.stdin });
    for await (const line of input) {
      const request = JSON.parse(line);
      if (request.done) { input.close(); break; }
      const record = records[request.candidate]; assert.ok(record);
      const response = request.field === "header" ? Object.fromEntries(Object.entries(record).filter(([key]) =>
        !["components", "dependencies", "vendorLists"].includes(key))) : record[request.field].slice(request.start, request.start + request.count);
      console.log(JSON.stringify(response));
    }
  } else console.log(JSON.stringify(records, null, 2));
}
