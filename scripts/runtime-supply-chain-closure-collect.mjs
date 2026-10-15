#!/usr/bin/env node
// Trusted local evidence collection; never invoked by a candidate manifest.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { sha } from "./runtime-supply-chain-current-collect.mjs";
import { scan } from "./runtime-supply-chain-scan.mjs";

const config = JSON.parse(readFileSync(process.argv[2]));
const root = "evaluation/supply-chain/2026-10-15";
const json = file => JSON.parse(readFileSync(file));
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(e => e.isDirectory()
  ? e.name === "__pycache__" ? [] : walk(join(folder,e.name)) : e.isFile() ? [join(folder,e.name)] : []).sort();
const receipt = (file,label) => ({ file: label, sha256: sha(readFileSync(file)), bytes: statSync(file).size });
const exec = (command,args,cwd,extra = {}) => {
  const r = spawnSync(command,args,{cwd,encoding:"utf8",maxBuffer:64*1024*1024,timeout:600000,
    env:{PATH:dirname(config.node)+":/usr/bin:/bin:/usr/sbin:/sbin",LANG:"C",LC_ALL:"C",...extra}});
  assert.equal(r.status,0,"evidence command failed: "+basename(command)+" "+args[0]+"; "+(r.stderr??"")
    .replace(/\/(?:Users|private)\/[^\s]*/gu,"<private-path>").slice(0,400));
  return r.stdout;
};
const clean = value => value.replaceAll(config.pythonBase,"<interpreter>").replaceAll(dirname(dirname(config.rustc)),"<rust-toolchain>")
  .replace(/\/(?:Users|private)\/[^\s]*/gu,"<private-path>");
const linking = file => exec("/usr/bin/otool",["-L",file]).split("\n").slice(1).map(s=>clean(s.trim())).filter(Boolean);
const save = (file,value) => {
  const bytes=JSON.stringify(value,null,2)+"\n";
  assert.ok(!/\/Users\/|\/private\/|file:\/\/|\/var\/folders\//iu.test(bytes),"private path in evidence");
  writeFileSync(root+"/"+file,bytes);
};
config.pythonBase=exec(config.python,["-I","-c","import sys;print(sys.base_prefix)"]).trim();
const toolRoots={node:dirname(dirname(config.node)),python:config.pythonBase,rust:dirname(dirname(config.rustc)),go:dirname(dirname(config.go))};
const tools={};
for(const [id,folder] of Object.entries(toolRoots)){
  const files=walk(folder);
  tools[id]={files:files.map(f=>receipt(f,relative(folder,f))),
    licenses:files.filter(f=>/^(license|copying|copyright|notice)/iu.test(basename(f))).map(f=>receipt(f,relative(folder,f)))};
}
tools.node.versions=JSON.parse(exec(config.node,["-p","JSON.stringify(process.versions)"]));
tools.python.versions=JSON.parse(exec(config.python,["-I","-c", "import sys,ssl,zlib,sqlite3,yaml,json;print(json.dumps(dict(cpython=sys.version.split()[0],openssl=ssl.OPENSSL_VERSION,zlib=zlib.ZLIB_RUNTIME_VERSION,sqlite=sqlite3.sqlite_version,libyaml=yaml._yaml.get_version_string())))"]));
tools.rust.version=exec(config.rustc,["-Vv"]).trim();
tools.go.version=exec(config.go,["version"]).trim();
const provisionRoot=dirname(toolRoots.node);
tools.rust.archiveLicenses=[];
tools.rust.archivePayloadComparison=[];
for(const a of config.archiveReceipts.rust){
  const archiveName=a.url.split("/").at(-1);
  assert.equal(sha(readFileSync(join(provisionRoot,archiveName))),a.sha256);
  const unpacked=join(provisionRoot,archiveName.replace(/\.tar\.xz$/u,""));
  tools.rust.archiveLicenses.push(...walk(unpacked).filter(f=>/^(license|copying|copyright|notice)/iu.test(basename(f)))
    .map(f=>receipt(f,archiveName+"/"+relative(unpacked,f))));
  const payload=join(unpacked,a.tool==="rust-std"?"rust-std-aarch64-apple-darwin":a.tool);
  for(const f of walk(payload).filter(f=>existsSync(join(toolRoots.rust,relative(payload,f))))) {
    const installed=join(toolRoots.rust,relative(payload,f));
    const matched=sha(readFileSync(f))===sha(readFileSync(installed));
    assert.ok(matched,"installed Rust bytes differ from verified distribution");
    tools.rust.archivePayloadComparison.push({file:relative(payload,f),archive:archiveName,matched});
  }
}
const nativeFiles=[{file:config.node,label:"node/bin/node"},
  {file:realpathSync(config.python),label:"python/bin/python"},
  ...walk(join(config.pythonBase,"lib")).filter(f=>/\.(so|dylib)$/u.test(f)).map(f=>({file:f,label:"python/"+relative(config.pythonBase,f)})),
  ...walk(dirname(dirname(config.rustc))).filter(f=>/\.(dylib)$/u.test(f)||["rustc","cargo","rustdoc"].includes(basename(f)))
    .map(f=>({file:f,label:"rust/"+relative(dirname(dirname(config.rustc)),f)})),
  ...["python"].flatMap(id=>json(root+"/"+id+"/inventory.json").components.flatMap(c=>(c.nativeFiles??[])
    .map(f=>({file:join(dirname(dirname(config.python)),"lib/python3.12/site-packages",f.file),label:"python-wheel/"+f.file}))))];
const native=nativeFiles.map(({file,label})=>({...receipt(file,label),libraries:linking(file)}));
const installedNpm=[];
function npmPackages(folder){
  for(const e of readdirSync(folder,{withFileTypes:true}).filter(e=>e.isDirectory())){
    const at=join(folder,e.name);
    if(e.name.startsWith("@")){npmPackages(at);continue;}
    if(!existsSync(join(at,"package.json")))continue;
    const p=json(join(at,"package.json"));
    if(p.name&&p.version) installedNpm.push({ref:"pkg:npm/"+p.name.replace(/^@/u,"%40")+"@"+p.version,
      ecosystem:"npm",name:p.name,version:p.version,license:p.license??"NOASSERTION",metadataSource:"installed-npm-tooling-package.json",
      metadataSha256:sha(readFileSync(join(at,"package.json")))});
    if(existsSync(join(at,"node_modules")))npmPackages(join(at,"node_modules"));
  }
}
npmPackages(join(toolRoots.node,"lib/node_modules"));
const npmToolRecord={candidate:"node-tooling",sourceRevision:config.sourceRevision,
  collectorRevision:exec("git",["rev-parse","HEAD"]).trim(),components:[...new Map(installedNpm.map(c=>[c.ref,c])).values()]};
save("node-tooling-inventory.json",npmToolRecord);
save("node-tooling-advisories.json",await scan(npmToolRecord));
const goToolRecord={candidate:"go-toolchain",sourceRevision:config.sourceRevision,
  collectorRevision:exec("git",["rev-parse","HEAD"]).trim(),components:[{ref:"pkg:golang/toolchain@1.27.1",ecosystem:"Go",name:"toolchain",version:"1.27.1"}]};
save("go-toolchain-advisories.json",await scan(goToolRecord));

const runs=[];
for(let index=0;index<2;index++){
  const staging=mkdtempSync("/private/tmp/nf-102-02-rebuild-");
  const archive=spawnSync("git",["archive",config.sourceRevision,"evaluation/prototypes","schemas"],{maxBuffer:64*1024*1024});
  assert.equal(archive.status,0);
  assert.equal(spawnSync("/usr/bin/tar",["-x","-C",staging],{input:archive.stdout}).status,0);
  const artifacts={};
  const ts=join(staging,"evaluation/prototypes/typescript");
  exec(config.npm,["ci","--ignore-scripts","--offline","--no-audit","--fund=false"],ts,{npm_config_cache:config.npmCache});
  exec(config.npm,["run","build"],ts);
  artifacts.typescript=walk(join(ts,"dist")).map(f=>receipt(f,relative(ts,f)));
  const py=join(staging,"evaluation/prototypes/python"), venv=join(staging,"venv");
  exec(config.python,["-I","-m","venv","--without-pip",venv]);
  const interpreter=join(venv,"bin/python");
  exec(config.python,["-I","-m","pip","--python",interpreter,"install","--no-index","--find-links",config.wheelhouse,
    "--require-hashes","--only-binary=:all:","-r",join(py,"requirements.lock")]);
  exec(interpreter,["-I","-m","pip","check"]);
  exec(interpreter,["-I","-m","compileall","-q","-f","--invalidation-mode","checked-hash","-s",py,"-p","evaluation/prototypes/python",py]);
  // Include bytecode, intentionally excluded from the tool-distribution walker.
  const pyFiles=exec("/usr/bin/find",[py,"-type","f"]).trim().split("\n").filter(f=>f.endsWith(".py")||f.endsWith(".pyc")).sort();
  artifacts.python=pyFiles.map(f=>receipt(f,relative(py,f)));
  const rs=join(staging,"evaluation/prototypes/rust"), target=join(staging,"target");
  exec(config.cargo,["build","--frozen","--offline"],rs,{CARGO_HOME:config.cargoHome,RUSTC:config.rustc,RUSTDOC:config.rustdoc,
    CARGO_TARGET_DIR:target,PATH:dirname(config.rustc)+":/usr/bin:/bin"});
  artifacts.rust=["nexflow-rust-evaluation","library-driver","libnexflow_rust_evaluation.rlib"].map(n=>receipt(join(target,"debug",n),n));
  const go=join(staging,"evaluation/prototypes/go"), goEnv={GOTOOLCHAIN:"local",GOPROXY:"off",GOSUMDB:"off",CGO_ENABLED:"0",
    GOPATH:config.goPath,GOCACHE:join(staging,"go-cache")};
  exec(config.go,["mod","verify"],go,goEnv);
  mkdirSync(join(go,"bin"));
  for(const [name,cmd] of [["nexflow-go-evaluation","cli"],["library-driver","library-driver"]])
    exec(config.go,["build","-mod=readonly","-trimpath","-buildvcs=false","-o",join(go,"bin",name),"./cmd/"+cmd],go,goEnv);
  artifacts.go=["nexflow-go-evaluation","library-driver"].map(n=>receipt(join(go,"bin",n),n));
  runs.push({runId:"clean-root-"+(index+1),sourceRevision:config.sourceRevision,artifacts,completedAt:new Date().toISOString()});
  console.log("independent clean rebuild "+(index+1)+" completed");
}
const repeatability=Object.fromEntries(Object.keys(runs[0].artifacts).map(id=>[id,{
  status:JSON.stringify(runs[0].artifacts[id])===JSON.stringify(runs[1].artifacts[id])?"byte-identical":"different-bytes",
  scope:"two-clean-source-and-output-roots-same-native-cohort-preprovisioned-caches",
  differentFiles:runs[0].artifacts[id].filter((a,i)=>a.sha256!==runs[1].artifacts[id][i]?.sha256).map(a=>a.file)}]));
const closure={task:"NF-102-02",sourceRevision:config.sourceRevision,collectorRevision:exec("git",["rev-parse","HEAD"]).trim(),
  collectorSources:["scripts/runtime-supply-chain-closure-collect.mjs","scripts/runtime-supply-chain-current-collect.mjs","scripts/runtime-supply-chain-scan.mjs"]
    .map(file=>({file,sha256:sha(readFileSync(file))})),
  recordedAt:new Date().toISOString(),target:"macos/arm64",cohort:{os:exec("/usr/bin/sw_vers",["-productVersion"]).trim(),
    kernel:exec("/usr/bin/uname",["-r"]).trim(),architecture:exec("/usr/bin/uname",["-m"]).trim(),
    cpu:exec("/usr/sbin/sysctl",["-n","machdep.cpu.brand_string"]).trim(),classification:"supplemental-not-frozen-target"},
  tools,native,runs,repeatability,archiveProvenance:config.archiveReceipts,
  schemaInputs:exec("git",["ls-files","schemas"]).trim().split("\n").map(file=>receipt(file,file)),
  interpreterProvenance:"unavailable-existing-exact-runtime-no-origin-receipt",
  offlineScope:"package-manager-offline-no-index-frozen-readonly-only; not OS-denied networking",
  compilerInternalClosure:"partial: exact distribution file hashes and license receipts, not complete compiler-internal versioned SBOM",
  osNativeClosure:"install names retained; macOS shared-cache libraries are external OS prerequisites, not independently hashed or vulnerability-qualified",
  signing:"not-tested-no-signing-authority-used",outcome:"not-ready"};
save("closure.json",closure);
console.log(JSON.stringify(repeatability));
