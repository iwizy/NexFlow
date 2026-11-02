import assert from "node:assert/strict";
import {spawnSync,execFileSync} from "node:child_process";
import {cpSync,existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,symlinkSync,writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {tmpdir,platform,arch} from "node:os";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {buildPackages,archiveEntries,extract,inventory,npm,repository,sha256} from "./reference-packages.mjs";
import {verifyPackage} from "../packages/cli/distribution/verify-package.mjs";

const option=name=>{const i=process.argv.indexOf(name);assert.ok(i!==-1 && process.argv[i+1]);return path.resolve(process.argv[i+1]);};
const output=option("--out"),reportFile=option("--report");
assert.ok(!reportFile.startsWith(output+path.sep));
const scratch=mkdtempSync(path.join(tmpdir(),"nexflow-install-"));
const records=[];
const check=(name,body)=>{body();records.push({name,result:"passed"});};
const deny=path.join(repository,"scripts/test/package-network-deny.mjs"),effects=path.join(repository,"scripts/test/no-runtime-deny.mjs"),reads=path.join(repository,"scripts/test/reference-cli-read-guard.mjs");
const baseEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^(?:npm_|NODE_OPTIONS$|NODE_PATH$|https?_proxy$|all_proxy$|no_proxy$|HOME$|USERPROFILE$)/iu.test(key)));
const env={...baseEnv,PATH:path.dirname(process.execPath)+path.delimiter+(process.env.PATH??""),HOME:path.join(scratch,"home"),USERPROFILE:path.join(scratch,"home")};
mkdirSync(env.HOME);const config=path.join(scratch,"empty.npmrc");writeFileSync(config,"");
const inputs=inventory(path.join(repository,"examples"));
try {
  const built=await buildPackages(output),again=await buildPackages(path.join(scratch,"second-build"));
  check("two clean builds produce identical actual tarballs and provenance",()=>{
    assert.deepEqual(built,again);assert.deepEqual(inventory(output),inventory(path.join(scratch,"second-build")));
  });
  check("detached checksums, indexes and archive inventories match exact bytes",()=>{
    const sums=readFileSync(path.join(output,"SHA256SUMS"),"utf8").trim().split("\n");assert.equal(sums.length,5);
    for(const line of sums){const [hash,file]=line.split("  ");assert.equal(sha256(readFileSync(path.join(output,file))),hash);}
    for(const artifact of built.artifacts){assert.equal(archiveEntries(path.join(output,artifact.file)).length,artifact.files);
      const stage=path.join(scratch,"inspect-"+artifact.name.split("/").pop());extract(path.join(output,artifact.file),stage);
      assert.equal(readFileSync(path.join(stage,"schema-bundle.json"),"utf8"),readFileSync(path.join(output,artifact.schemaIndex),"utf8"));
      const files=inventory(stage);assert.ok(files.every(f=>!/(?:^|\/)(?:test|tests|benchmark|spec|src|\.github|\.git)(?:\/|$)/u.test(f.path)));
      assert.ok(files.every(f=>!/[.](?:node|exe|dll|dylib|so|py|rs|go)$/u.test(f.path)));
    }
  });
  check("archive preflight rejects duplicate paths and links before extraction",()=>{
    const tar=createRequire(pathToFileURL(path.resolve(path.dirname(npm),"../package.json")))("tar");
    const cwd=path.join(scratch,"archive-refusals");mkdirSync(path.join(cwd,"package"),{recursive:true});writeFileSync(path.join(cwd,"package/file"),"data");
    const duplicate=path.join(scratch,"duplicate.tgz");tar.c({cwd,file:duplicate,sync:true,gzip:true,portable:true},["package/file","package/file"]);
    assert.throws(()=>archiveEntries(duplicate));
    symlinkSync("file",path.join(cwd,"package/link"));const linked=path.join(scratch,"link.tgz");
    tar.c({cwd,file:linked,sync:true,gzip:true,portable:true},["package/link"]);assert.throws(()=>archiveEntries(linked));
  });
  const installed={};
  for(const artifact of built.artifacts) {
    const name=artifact.name.split("/").pop(),consumer=path.join(scratch,"consumer "+name+" \u00e9"),cache=path.join(scratch,"cache-"+name);
    mkdirSync(consumer);mkdirSync(cache);writeFileSync(path.join(consumer,"package.json"),'{"private":true,"type":"module"}\n');
    assert.deepEqual(readdirSync(cache),[]);
    const child=spawnSync(process.execPath,["--import",deny,npm,"install","--prefix",consumer,"--offline","--ignore-scripts","--no-audit","--no-fund","--userconfig",config,"--cache",cache,"--registry=http://127.0.0.1:1",path.join(output,artifact.file)],{cwd:consumer,env,encoding:"utf8",timeout:60000});
    check("offline clean npm install from empty cache: "+name,()=>{assert.equal(child.status,0,child.stderr);assert.equal(child.signal,null);assert.doesNotMatch(child.stderr,/NEXFLOW-PACKAGE-NETWORK-DENIED/u);});
    const directory=path.join(consumer,"node_modules/@nexflow",name);installed[name]={consumer,directory};
    const verified=await verifyPackage(directory);
    check("installed inventory and offline schema closure: "+name,()=>{assert.equal(verified.schemas,18);assert.equal(verified.manifestKinds,17);assert.equal(verified.sourceRevision,built.sourceRevision);});
    const guardRun=spawnSync(process.execPath,["--import",effects,path.join(directory,"verify-package.mjs")],{cwd:consumer,env,encoding:"utf8",timeout:20000});
    check("shipped verifier runs without network or write effects: "+name,()=>{assert.equal(guardRun.status,0,guardRun.stderr);assert.equal(guardRun.stderr,"");assert.equal(JSON.parse(guardRun.stdout).signatureVerified,false);});
  }
  const {consumer,directory}=installed.cli,bin=path.join(consumer,"node_modules/.bin/nexflow");
  assert.ok(existsSync(bin));
  const schema=JSON.parse(readFileSync(path.join(directory,"contracts/output.schema.json")));
  const validate=new Ajv2020({strict:false,allErrors:true}).compile(schema);
  function cli(args,root=null) {
    const child=spawnSync(bin,args,{cwd:consumer,env:{...env,NODE_OPTIONS:`--import=${JSON.stringify(effects)} --import=${JSON.stringify(reads)}`,NEXFLOW_TEST_MODULE_ROOT:path.join(consumer,"node_modules"),NEXFLOW_TEST_READ_ROOT:root??""},encoding:"utf8",timeout:20000});
    assert.equal(child.signal,null);assert.equal(child.error,undefined);assert.equal(child.stderr,"");
    const value=JSON.parse(child.stdout);assert.ok(validate(value),JSON.stringify(validate.errors));assert.equal(child.status,value.exitCode);assert.ok(child.stdout.endsWith("\n"));return value;
  }
  for(const flag of ["--help","--version"])check("installed bin "+flag,()=>assert.equal(cli([flag,"--format=json"]).exitCode,0));
  const projects=readdirSync(path.join(repository,"examples"),{withFileTypes:true}).filter(e=>e.isDirectory()&&existsSync(path.join(repository,"examples",e.name,"project.yaml")));
  assert.equal(projects.length,8);
  for(const project of projects)for(const command of ["validate","inspect","graph"])check("installed bin "+command+"/"+project.name,()=>{
    const root=path.join(repository,"examples",project.name),value=cli([command,"--root",root,"--format=json"],root);assert.equal(value.exitCode,0);assert.equal(value.executionAuthorized,false);
  });
  const old=JSON.parse(readFileSync(path.join(repository,"fixtures/cli/index.json")));
  for(const item of old.cases)check("installed bin historical case "+item.id,()=>{
    const root=path.join(repository,"fixtures/cli",item.root),deferred=["discover","init","run"].includes(item.command);
    const value=cli([item.command,"--root",root,...item.args,"--format=json"],deferred?null:root);
    assert.equal(value.exitCode,deferred?2:item.expected.exitCode);
    assert.deepEqual(value.diagnostics.map(d=>d.code).sort(),(deferred?["NEXFLOW-CLI-USAGE"]:item.expected.diagnosticCodes.filter(c=>!(item.expected.exitCode===3&&c==="NF-DISCOVERY-NO-PROJECT"))).sort());
  });
  const pure=spawnSync(process.execPath,["--import",effects,"--input-type=module","-e",'import {createValidator} from "@nexflow/validation"; console.log(createValidator().validateDocuments([]).valid);'],{cwd:installed.validation.consumer,env,encoding:"utf8"});
  check("separately installed pure public package import",()=>{assert.equal(pure.status,0,pure.stderr);assert.equal(pure.stderr,"");});
  const mutated=path.join(scratch,"mutated");cpSync(directory,mutated,{recursive:true});
  const target=path.join(mutated,"schemas/0.1/project.schema.json"),original=readFileSync(target);
  writeFileSync(target,"{}\n");await assert.rejects(verifyPackage(mutated));writeFileSync(target,original);
  writeFileSync(path.join(mutated,"extra.txt"),"unlisted");await assert.rejects(verifyPackage(mutated));rmSync(path.join(mutated,"extra.txt"));
  rmSync(target);await assert.rejects(verifyPackage(mutated));writeFileSync(target,original);
  records.push({name:"consumer rejects modified, unlisted and missing schema files",result:"passed"});
  const indexSchema=JSON.parse(readFileSync(path.join(directory,"contracts/schema-bundle.schema.json"))),index=JSON.parse(readFileSync(path.join(directory,"schema-bundle.json")));
  const checkIndex=new Ajv2020({strict:false}).compile(indexSchema);
  check("closed index rejects unknown fields, unsafe paths, wrong version and incomplete catalog",()=>{
    assert.ok(checkIndex(index));for(const alter of [v=>v.extra=true,v=>v.specVersion="9.9",v=>v.schemas[0].path="../escape.json",v=>v.schemas.pop(),v=>delete v.schemas.find(e=>e.role==="manifest").manifestKind]){const value=structuredClone(index);alter(value);assert.equal(checkIndex(value),false);}
  });
  check("input examples and frozen contracts/sources remain unchanged",()=>{
    assert.deepEqual(inventory(path.join(repository,"examples")),inputs);
    const changed=execFileSync("git",["diff","--name-only","b8373b0784a376891098c6be8149be7a514e340e","--","package.json","package-lock.json","packages/validation","schemas","evaluation/prototypes","evaluation/baseline.json","evaluation/library-cases.json","fixtures/cli","fixtures/README.md","docs/0.5-cli-contract.md","scripts/lib/manifest-discovery.mjs"],{cwd:repository,encoding:"utf8"});assert.equal(changed,"");
  });
  const report={task:"NF-107",sourceRevision:built.sourceRevision,node:process.versions.node,npm:built.npm,environment:{platform:platform(),architecture:arch()},artifacts:built.artifacts,
    verifierSha256:sha256(readFileSync(fileURLToPath(import.meta.url))),provenanceSha256:sha256(readFileSync(path.join(output,"PROVENANCE.json"))),records,
    offlineInstall:{initialCache:"empty for each package",scripts:"disabled",network:"offline npm flag plus application-level network denial",sourceCheckoutDependency:false},
    notTested:["artifact vulnerability acceptance","native three-target lifecycle","genuine predecessor upgrade/rollback","publisher signature","release publication","OS sandbox enforcement"]};
  writeFileSync(reportFile,JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({task:report.task,passed:records.length,artifacts:built.artifacts.map(a=>({file:a.file,sha256:a.sha256,bytes:a.bytes})),sourceRevision:built.sourceRevision}));
} finally {rmSync(scratch,{recursive:true,force:true});}
