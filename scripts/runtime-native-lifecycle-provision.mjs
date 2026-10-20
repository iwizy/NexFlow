#!/usr/bin/env node
// Trusted disposable tool/cache preparation, never a candidate capability.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {spawnSync} from "node:child_process";
const destination=path.resolve(process.argv[2]);assert.ok(process.argv[2]);mkdirSync(destination,{recursive:true});
const pins=JSON.parse(readFileSync("evaluation/repairs/supply-chain/toolchains.json"));assert.equal(process.versions.node,pins.node);
const commands=[];
function run(command,args,cwd=process.cwd(),extra={}){const p=spawnSync(command,args,{cwd,encoding:"utf8",timeout:600000,maxBuffer:16*1024*1024,env:{...process.env,...extra}});commands.push({program:path.basename(command),arguments:args.map(a=>a.startsWith(destination)?"<task-tools>"+a.slice(destination.length):a),exitCode:p.status,stdout:p.stdout??"",stderr:p.stderr??""});return p;}
const nativeTar=process.platform==="win32"?path.join(process.env.SystemRoot,"System32","tar.exe"):"tar";
assert.equal(run(nativeTar,["--version"]).status,0);
const bootstrapEnv=process.platform==="win32"?{PATH:path.join(process.env.SystemRoot,"System32")+path.delimiter+process.env.PATH}:{};
const npmRoot=path.join(destination,"npm"),bootstrap=run(process.execPath,["scripts/evaluation-npm-provision.mjs",npmRoot],process.cwd(),bootstrapEnv);assert.equal(bootstrap.status,0,bootstrap.stderr);
const npmArgs=[path.join(npmRoot,"bin/npm-cli.js")],config={node:process.execPath,npmCli:npmArgs[0],wheelhouse:path.join(destination,"wheelhouse"),pipProvisioner:path.join(destination,"pip"),statuses:{}};
const npm=(args,cwd=process.cwd())=>run(process.execPath,[...npmArgs,...args],cwd,{npm_config_ignore_scripts:"true"});
const maintenance=npm(["ci","--ignore-scripts","--no-audit","--fund=false"]);assert.equal(maintenance.status,0,maintenance.stderr);
if(process.argv[3]==="--maintenance-only"){console.log("Pinned evidence-consumer dependencies installed; candidate provisioning not requested.");process.exit(0);}
config.statuses.typescript=npm(["ci","--ignore-scripts","--no-audit","--fund=false"],"evaluation/prototypes/typescript").status===0;
const py=run("python",["-I","-c","import sys;print(sys.executable);print('.'.join(map(str,sys.version_info[:3])))"]);
let pyLines=(py.stdout??"").trim().split(/\r?\n/u);config.pythonBase=pyLines[0];
config.statuses.python=py.status===0&&pyLines[1]===pins.python;
if(!config.statuses.python){
 const catalog=JSON.parse(readFileSync("evaluation/lifecycle/requalification/python-runtimes.json")),asset=catalog[process.platform+"-"+process.arch];
 if(asset){const response=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256,"interpreter archive integrity");
  const archive=path.join(destination,"python-runtime.tar.gz"),prefix=path.join(destination,"python-runtime");writeFileSync(archive,bytes);mkdirSync(prefix);
  const listing=run(nativeTar,["-tf",archive]);assert.equal(listing.status,0);for(const member of listing.stdout.trim().split(/\r?\n/u))assert.ok(!path.posix.isAbsolute(member)&&!member.split("/").includes(".."));
  assert.equal(run(nativeTar,["-xf",archive,"-C",prefix]).status,0);config.pythonBase=path.join(prefix,...asset.interpreter.split("/"));
  const observed=run(config.pythonBase,["-I","-c","import sys;print(sys.executable);print('.'.join(map(str,sys.version_info[:3])))"]);pyLines=(observed.stdout??"").trim().split(/\r?\n/u);config.statuses.python=observed.status===0&&pyLines[1]===pins.python;
  config.pythonDistribution={url:asset.url,sha256:asset.sha256,version:pins.python,verifiedBeforeExtraction:true,selection:"native exact-version alternative distribution, not fallback to a different interpreter version"};
 }
}
if(config.statuses.python)config.statuses.python=run(config.pythonBase,["-I","scripts/evaluation-python-provision.py","--venv",path.join(destination,"build-venv"),"--wheelhouse",config.wheelhouse,"--provisioner",config.pipProvisioner]).status===0;
config.statuses.rust=run("rustup",["toolchain","install",pins.rust,"--profile","minimal","--no-self-update"]).status===0&&run("cargo",["+"+pins.rust,"fetch","--locked","--manifest-path","evaluation/prototypes/rust/Cargo.toml"]).status===0;
const go=run("go",["version"]);config.statuses.go=go.status===0&&go.stdout.includes("go"+pins.go+" ");
if(config.statuses.go)config.statuses.go=run("go",["mod","download"],"evaluation/prototypes/go").status===0&&run("go",["mod","verify"],"evaluation/prototypes/go").status===0;
config.provisioning=commands.map(({program,arguments:args,exitCode,stdout,stderr})=>({program,arguments:args,exitCode,output:((stdout??"")+"\n"+(stderr??"")).slice(-5000)}));
writeFileSync(path.join(destination,"config.json"),JSON.stringify(config,null,2)+"\n");console.log(JSON.stringify(config.statuses));
