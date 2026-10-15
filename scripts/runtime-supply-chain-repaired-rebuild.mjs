#!/usr/bin/env node
// Rebuild selected evaluation artifacts twice; no candidate-selected commands.
import assert from "node:assert/strict";
import {mkdirSync,mkdtempSync,readFileSync,readdirSync,realpathSync,statSync,writeFileSync} from "node:fs";
import {join,dirname,relative,basename} from "node:path";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
const config=JSON.parse(readFileSync(process.argv[2]));
const root="evaluation/supply-chain/2026-10-15-repaired";
const run=(command,args,cwd,extra={})=>{
 const p=spawnSync(command,args,{cwd,encoding:"utf8",timeout:600000,maxBuffer:64*1024*1024,env:{PATH:dirname(config.node)+":/usr/bin:/bin:/usr/sbin:/sbin",LANG:"C",LC_ALL:"C",...extra}});
 assert.equal(p.status,0,basename(command)+": "+(p.stderr??"").replace(/\/(?:private|Users)\/[^\s]*/gu,"<private-path>").slice(0,500));return p.stdout;
};
const walk=at=>readdirSync(at,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(at,e.name)):e.isFile()?[join(at,e.name)]:[]).sort();
const receipt=(file,label)=>({file:label,sha256:sha(readFileSync(file)),bytes:statSync(file).size});
const runs=[];
for(let index=0;index<2;index++){
 const staging=realpathSync(mkdtempSync(join(tmpdir(),"nf-102-02-repaired-build-")));
 const archive=spawnSync("git",["archive",config.sourceRevision,"evaluation/prototypes","schemas","evaluation/repairs/supply-chain/toolchains.json"],{maxBuffer:64*1024*1024});assert.equal(archive.status,0);
 assert.equal(spawnSync("tar",["-xf","-","-C",staging],{input:archive.stdout}).status,0);
 const artifacts={};
 const ts=join(staging,"evaluation/prototypes/typescript");
 run(config.npm,["ci","--offline","--ignore-scripts","--no-audit","--fund=false","--allow-remote=all"],ts,{npm_config_cache:config.npmCache,npm_config_userconfig:"/dev/null"});
 run(config.npm,["run","build"],ts);
 artifacts.typescript=walk(join(ts,"dist")).map(f=>receipt(f,relative(ts,f)));
 const py=join(staging,"evaluation/prototypes/python"),venv=join(staging,"venv");
 run(config.pythonBase,["-I","scripts/evaluation-python-provision.py","--offline","--lock",join(py,"requirements.lock"),"--venv",venv,"--wheelhouse",config.wheelhouse,"--provisioner",config.pipProvisioner],process.cwd());
 run(join(venv,"bin/python"),["-I","-m","compileall","-q","-f","--invalidation-mode","checked-hash","-s",py,"-p","evaluation/prototypes/python",py]);
 artifacts.python=walk(py).filter(f=>/\.pyc?$/u.test(f)).map(f=>receipt(f,relative(py,f)));
 artifacts.python.push(...readdirSync(config.wheelhouse).filter(n=>n.endsWith(".whl")).sort().map(n=>receipt(join(config.wheelhouse,n),"wheels/"+n)));
 const rs=join(staging,"evaluation/prototypes/rust"),target=join(staging,"target");
 const flags="--remap-path-prefix="+staging+"=/evaluation --remap-path-prefix="+config.cargoHome+"=/cargo";
 run(config.cargo,["build","--release","--frozen","--offline"],rs,{CARGO_HOME:config.cargoHome,RUSTC:config.rustc,RUSTDOC:config.rustdoc,CARGO_TARGET_DIR:target,CARGO_INCREMENTAL:"0",RUSTFLAGS:flags,DYLD_FALLBACK_LIBRARY_PATH:join(dirname(dirname(config.rustc)),"lib"),PATH:dirname(config.rustc)+":/usr/bin:/bin"});
 artifacts.rust=["nexflow-rust-evaluation","library-driver","libnexflow_rust_evaluation.rlib"].map(n=>receipt(join(target,"release",n),n));
 const go=join(staging,"evaluation/prototypes/go"),env={GOTOOLCHAIN:"local",GOPROXY:"off",GOSUMDB:"off",CGO_ENABLED:"0",GOPATH:config.goPath,GOCACHE:join(staging,"go-cache")};
 run(config.go,["mod","verify"],go,env);mkdirSync(join(go,"bin"));
 for(const [name,cmd]of[["nexflow-go-evaluation","cli"],["library-driver","library-driver"]])run(config.go,["build","-mod=readonly","-trimpath","-buildvcs=false","-o","bin/"+name,"./cmd/"+cmd],go,env);
 artifacts.go=["nexflow-go-evaluation","library-driver"].map(n=>receipt(join(go,"bin",n),n));
 runs.push({runId:"repaired-clean-root-"+(index+1),sourceRevision:config.sourceRevision,artifacts,completedAt:new Date().toISOString()});
 console.log("clean rebuild "+(index+1)+" completed");
}
const repeatability=Object.fromEntries(Object.keys(runs[0].artifacts).map(id=>{
 const a=runs[0].artifacts[id],b=runs[1].artifacts[id],differentFiles=a.filter((r,i)=>r.sha256!==b[i]?.sha256||r.file!==b[i]?.file).map(r=>r.file);
 return[id,{status:a.length===b.length&&!differentFiles.length?"byte-identical":"different-bytes",differentFiles,artifactCount:a.length}];
}));
const record={task:"NF-102-02",sourceRevision:config.sourceRevision,collectorRevision:run("git",["rev-parse","HEAD"]).trim(),recordedAt:new Date().toISOString(),target:"macos/arm64",cohort:{os:run("sw_vers",["-productVersion"]).trim(),build:run("sw_vers",["-buildVersion"]).trim(),architecture:run("uname",["-m"]).trim(),cpu:run("sysctl",["-n","machdep.cpu.brand_string"]).trim(),classification:"supplemental-not-frozen-target"},runs,repeatability,recipes:{typescript:"offline exact npm lock, TS6.0.3",python:"nine verified runtime wheels, separate local-only pip, no installed pip, checked-hash source bytecode with normalized filenames",rust:"release, frozen/offline, no incremental, entire clean-root and registry source remapped",go:"readonly/offline, CGO disabled, trimpath, buildvcs=false, independent empty build caches"},offlineBoundary:"package-manager deny-fetch recipes, not OS sandbox or target lifecycle acceptance",architectureAccepted:false};
writeFileSync(root+"/rebuild.json",JSON.stringify(record,null,2)+"\n");
console.log(JSON.stringify(repeatability));
assert.ok(Object.values(repeatability).every(r=>r.status==="byte-identical"),"different artifact bytes retained; do not claim reproducibility");
