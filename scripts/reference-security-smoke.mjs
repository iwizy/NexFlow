// Actual installed-entry security regressions; not an operating-system sandbox.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,symlinkSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {npm,repository,sha256} from "./reference-packages.mjs";

const option=name=>{const i=process.argv.indexOf(name);assert.ok(i>0&&process.argv[i+1]);return path.resolve(process.argv[i+1]);};
const candidate=option("--candidate"),reportPath=option("--report");
const provenance=JSON.parse(readFileSync(path.join(candidate,"PROVENANCE.json")));
const scratch=realpathSync(mkdtempSync(path.join(tmpdir(),"nexflow-security-")));
const consumer=path.join(scratch,"consumer"),root=path.join(scratch,"project"),cache=path.join(scratch,"empty-cache"),home=path.join(scratch,"home");
for(const dir of [consumer,root,cache,home])mkdirSync(dir);
const config=path.join(scratch,"empty.npmrc");writeFileSync(config,"");
const effects=path.join(repository,"scripts/test/no-runtime-deny.mjs"),reads=path.join(repository,"scripts/test/reference-cli-read-guard.mjs"),network=path.join(repository,"scripts/test/package-network-deny.mjs");
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^(npm_|NODE_OPTIONS$|NODE_PATH$|HOME$|USERPROFILE$)/iu.test(k))),HOME:home,USERPROFILE:home,
  PATH:path.dirname(process.execPath)+path.delimiter+(process.env.PATH??""),NEXFLOW_TEST_SECRET:"NF108_PRIVATE_CANARY"};
const records=[];
function checked(name,body){body();records.push({name,result:"passed"});}
try {
  for(const artifact of provenance.artifacts)assert.equal(sha256(readFileSync(path.join(candidate,artifact.file))),artifact.sha256);
  const archive=provenance.artifacts.find(a=>a.name==="@nexflow/cli");assert.ok(archive);
  writeFileSync(path.join(consumer,"package.json"),'{"private":true,"type":"module"}\n');
  const install=spawnSync(process.execPath,["--import",network,npm,"install","--prefix",consumer,"--offline","--ignore-scripts","--no-audit","--no-fund","--update-notifier=false","--cache",cache,"--userconfig",config,path.join(candidate,archive.file)],{env,cwd:consumer,encoding:"utf8",timeout:60000});
  checked("actual candidate offline install with scripts and network disabled",()=>assert.equal(install.status,0,install.stderr));
  const cli=path.join(consumer,"node_modules/@nexflow/cli"),entry=path.join(consumer,"node_modules/.bin/nexflow"),library=path.join(cli,"node_modules/@nexflow/validation");
  const api=await import(pathToFileURL(path.join(library,"dist/index.js")));
  const fixture=readFileSync(path.join(repository,"fixtures/cli/valid/minimal-project/project.yaml"),"utf8");
  const base=api.parseYaml(fixture).value;assert.ok(base);
  function run(args,readRoot=root) {
    const child=spawnSync(entry,args,{cwd:consumer,env:{...env,NODE_OPTIONS:`--import=${JSON.stringify(effects)} --import=${JSON.stringify(reads)}`,
      NEXFLOW_TEST_MODULE_ROOT:path.join(consumer,"node_modules"),NEXFLOW_TEST_READ_ROOT:readRoot??""},encoding:"utf8",timeout:5000,maxBuffer:4*1024*1024});
    assert.equal(child.error,undefined);assert.equal(child.signal,null);assert.equal(child.stderr,"");
    assert.ok(child.stdout.endsWith("\n"));assert.ok(!child.stdout.includes("NF108_PRIVATE_CANARY"));assert.ok(!child.stdout.includes(scratch));
    const output=JSON.parse(child.stdout);assert.equal(child.status,output.exitCode);assert.equal(output.executionAuthorized,false);return output;
  }
  const selected=(command,file="project.yaml")=>[command,"--root",root,"--file",file,"--format=json"];
  const projectFile=path.join(root,"project.yaml");
  writeFileSync(projectFile,JSON.stringify({...base,manifests:{actors:" ".repeat(200000)}}));
  for(const command of ["validate","inspect","graph"])checked("bounded whitespace-hint refusal: installed "+command,()=>{
    const result=run(selected(command));assert.equal(result.exitCode,1);assert.equal(result.result,null);
    assert.ok(result.diagnostics.some(d=>d.code==="NF-SCHEMA"&&d.keyword==="pattern"));
  });
  for(const method of ["validateManifest","validateDocuments","inspectDocuments"])checked("bounded whitespace-hint refusal: public "+method,()=>{
    const value={...base,manifests:{actors:" ".repeat(200000)}};
    const argument=method==="validateManifest"?value:[{file:"project.yaml",kind:"Project",value}];
    const code=`const api=await import(${JSON.stringify(pathToFileURL(path.join(library,"dist/index.js")).href)});const result=api.createValidator()[${JSON.stringify(method)}](${JSON.stringify(argument)});console.log(JSON.stringify({valid:result.valid,codes:result.diagnostics.map(d=>d.code)}));`;
    // Use a temporary script to keep the bounded payload out of argv.
    const script=path.join(scratch,"library-case.mjs");writeFileSync(script,code);
    const child=spawnSync(process.execPath,["--import",effects,script],{cwd:consumer,env,encoding:"utf8",timeout:5000});
    assert.equal(child.error,undefined);assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,"");
    const result=JSON.parse(child.stdout);assert.equal(result.valid,false);assert.ok(result.codes.includes("NF-SCHEMA"));
  });
  checked("linear matcher preserves short Unicode/whitespace acceptance and diagnostic keyword",()=>{
    const validator=api.createValidator();
    for(const value of [""," ","\t\n","a"," a ","\n\ta\n","\u00a0","\u2003","\ufeff","\u2028","\ud83d\ude00","agents.yaml"]){
      const document={...base,manifests:{actors:value}},result=validator.validateManifest(document,"project.yaml");
      assert.equal(result.valid,/\S/u.test(value),JSON.stringify(value));
      if(!result.valid)assert.ok(result.diagnostics.some(d=>d.keyword==="pattern"));
    }
  });
  const malformed=[
    ["duplicate-key","kind: Project\nkind: ActorSet\nspecVersion: '0.1'\n"],
    ["multiple-documents","kind: Project\n---\nkind: Project\n"],
    ["executable-tag","specVersion: '0.1'\nkind: !!js/function NF108_PRIVATE_CANARY\n"],
    ["alias-cycle","specVersion: '0.1'\nkind: Project\nproject: &a [*a]\n"],
    ["malformed-raw-value","project: [NF108_PRIVATE_CANARY"],
    ["invalid-utf8",Buffer.from([255])],
    ["byte-limit",Buffer.alloc(1024*1024+1,32)],
  ];
  for(const [name,data] of malformed)checked("installed parser refusal: "+name,()=>{writeFileSync(path.join(root,"case.yaml"),data);const result=run(selected("validate","case.yaml"));assert.equal(result.exitCode,1);assert.equal(result.result,null);});
  writeFileSync(projectFile,fixture);
  for(const file of ["../NF108_PRIVATE_CANARY.yaml","/NF108_PRIVATE_CANARY.yaml","https://invalid.example/NF108_PRIVATE_CANARY.yaml","bad\u001bNF108_PRIVATE_CANARY.yaml"])checked("unsafe locator refusal "+records.length,()=>assert.equal(run(selected("validate",file)).exitCode,1));
  checked("duplicate file locators reject",()=>assert.equal(run([...selected("validate"),"--file=project.yaml"]).exitCode,1));
  mkdirSync(path.join(root,"directory.yaml"));checked("nonregular input rejects",()=>assert.equal(run(selected("validate","directory.yaml")).exitCode,1));
  symlinkSync(projectFile,path.join(root,"linked.yaml"));checked("symlinked selected file rejects",()=>assert.equal(run(selected("validate","linked.yaml")).exitCode,1));
  const linkedRoot=path.join(scratch,"linked-root");symlinkSync(root,linkedRoot,"dir");checked("symlinked root rejects",()=>assert.equal(run(["validate","--root",linkedRoot,"--format=json"],linkedRoot).exitCode,1));
  for(const command of ["validate","inspect","graph"])checked("authored schema/reference cannot cause remote loading: "+command,()=>{
    const value=structuredClone(base);delete value.manifests;value.$schema="https://invalid.example/NF108_PRIVATE_CANARY";value.$ref="file:///NF108_PRIVATE_CANARY";
    writeFileSync(projectFile,JSON.stringify(value));assert.equal(run(selected(command)).exitCode,0);
  });
  for(const command of ["run","init","discover"])checked("unsupported effectful command: "+command,()=>assert.equal(run([command,"--format=json"],null).exitCode,2));
  checked("installed current closure contains fixed URI parser",()=>assert.equal(JSON.parse(readFileSync(path.join(library,"node_modules/fast-uri/package.json"))).version,"3.1.9"));
  const report={task:"NF-108",candidateSourceRevision:provenance.sourceRevision,artifacts:provenance.artifacts,
    recordedAt:new Date().toISOString(),verifierSha256:sha256(readFileSync(new URL(import.meta.url))),node:process.versions.node,records,
    scope:"actual installed CLI and public API; application effect/read guards; five-second regression deadline, not performance ranking",
    notTested:["OS-level sandbox/race containment","native three-target lifecycle","publisher authentication","full semantic/runtime conformance"]};
  writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({task:report.task,passed:records.length,candidateSourceRevision:provenance.sourceRevision}));
}finally{rmSync(scratch,{recursive:true,force:true});}
