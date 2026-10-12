#!/usr/bin/env node
// Strict supplemental regression expectations. The frozen corpus/oracle are never edited.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,cpSync,mkdtempSync,rmSync,readdirSync} from "node:fs";
import path from "node:path";
import os from "node:os";
import {spawnSync} from "node:child_process";
import {parse} from "yaml";
import {repositoryRoot,digest} from "./lib/runtime-evaluation.mjs";
import {canonical,publicErrors,same} from "./lib/diagnostic-requalification.mjs";
import {fileURLToPath} from "node:url";
const canary="NF_PRIVATE_VALUE_7f1c9";
const make=(path,keyword)=>({severity:"error",code:"NF-SCHEMA",message:"Local schema constraint is not satisfied.",file:"actors.yaml",kind:"ActorSet",path,keyword,related:[]});
const key=d=>["file","path","severity","code","kind","keyword","message"].map(k=>d[k]??"").join("\0");
const branch=(count,kind)=>Array.from({length:count},(_,i)=>{
  const root="/actors/"+i;
  return [make(root,"oneOf"),...Array.from({length:kind===canary?5:4},()=>make(root+"/kind","const")),
    ...(kind===canary?[make(root+"/kind","enum")]:[]),
    ...["displayName","description","roles","responsibilities","agentRef","operatedBy","operatedBy","representedBy"].map(f=>make(root+"/"+f,"required"))];
}).flat();
export const regressionCases=[{id:"original-230-invalid-actors",count:230,kind:canary},{id:"single-invalid-actor",count:1,kind:canary},{id:"agent-missing-bridge",count:1,kind:"agent"},{id:"human-forbidden-bridge"},{id:"allof-local-ref-redaction"}];
export function expectedDiagnostics(id) {
  const item=regressionCases.find(c=>c.id===id);assert.ok(item,"unknown regression");
  const expected=item.count?branch(item.count,item.kind):item.id==="human-forbidden-bridge"?
    [make("/actors/0","oneOf"),...Array.from({length:4},()=>make("/actors/0","not")),...Array.from({length:4},()=>make("/actors/0/kind","const")),...["operatedBy","operatedBy","representedBy"].map(f=>make("/actors/0/"+f,"required"))]:
    [make("/actors/0/roles/0","pattern")];
  return expected.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0);
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
const [candidate,encodedCommand,outputFile]=process.argv.slice(2), cli=JSON.parse(encodedCommand);
assert.ok(["typescript","python","rust","go"].includes(candidate));
assert.ok(Array.isArray(cli)&&cli.length&&cli.every(x=>typeof x==="string"));
const git=(...args)=>{const p=spawnSync("git",args,{cwd:repositoryRoot,encoding:"utf8"});assert.equal(p.status,0);return p.stdout.trim();};
const revisionOption=process.argv.indexOf("--source-revision");
const sourceRevision=revisionOption<0?git("rev-parse","HEAD"):process.argv[revisionOption+1];
assert.match(sourceRevision,/^[0-9a-f]{40}$/u);
const harnessRevision=git("rev-parse","HEAD");
const harnessPath="scripts/runtime-diagnostic-projection-regression.mjs";
assert.equal(digest(readFileSync(new URL(import.meta.url))),digest(spawnSync("git",["show",harnessRevision+":"+harnessPath],{cwd:repositoryRoot}).stdout),"commit regression oracle before recording evidence");
const temporary=mkdtempSync(path.join(os.tmpdir(),"nexflow-projection-"));
const results=[];
try {
  for(const item of regressionCases) for(const command of ["validate","inspect"]) {
    const root=path.join(temporary,item.id+"-"+command);cpSync(path.join(repositoryRoot,"fixtures/cli/valid/minimal-project"),root,{recursive:true});
    const file=path.join(root,"actors.yaml"),doc=parse(readFileSync(file,"utf8"));const expected=expectedDiagnostics(item.id);
    if(item.count) {doc.actors=Array.from({length:item.count},(_,i)=>({id:"invalid-"+i,kind:item.kind}));}
    else if(item.id==="human-forbidden-bridge") {
      doc.actors=[doc.actors[0]];doc.actors[0].agentRef={kind:"agent",id:"fixture-agent"};
    } else {doc.actors=[doc.actors[0]];doc.actors[0].roles=[canary];}
    writeFileSync(file,JSON.stringify(doc));
    const total=expected.length, retained=expected.slice(0,200);
    const inventory=()=>readdirSync(root).sort().map(f=>({path:f,sha256:digest(readFileSync(path.join(root,f)))}));
    const before=inventory();const runs=[0,1].map(()=>spawnSync(cli[0],[...cli.slice(1),command,"--root",root,"--format=json"],{cwd:repositoryRoot,encoding:"utf8",timeout:60000,maxBuffer:4*1024*1024,shell:false}));
    const actual=runs.map(p=>{
      assert.equal(p.status,1,item.id);const output=JSON.parse(p.stdout);
      assert.deepEqual(publicErrors(output,p.status,p.stderr,p.stdout,[canary,temporary,repositoryRoot]),[],item.id);
      assert.deepEqual(canonical(output.diagnostics),canonical(retained),item.id+" complete projected diagnostic sequence");
      assert.equal(output.truncated,total>200);assert.equal(output.result,null);assert.equal(output.checks.schema,"failed");
      return output;
    });
    assert.ok(same(actual[0],actual[1]));assert.deepEqual(inventory(),before);
    if(item.count===230) assert.ok(actual[0].diagnostics.some(d=>d.path.startsWith("/actors/100")),"sort must precede diagnostic limiting");
    results.push({id:item.id,command,totalExpected:total,retainedExpected:retained.length,inputSha256:digest(JSON.stringify(before)),expectedSha256:digest(JSON.stringify(canonical(retained))),actual:actual[0],repeatable:true,inputUnchanged:true,stdoutSha256:runs.map(p=>digest(p.stdout)),status:"passed"});
  }
} finally {rmSync(temporary,{recursive:true,force:true});}
const report={task:"NF-102-01",scope:"public-schema-branch-projection-repair",candidate,sourceRevision,harnessRevision,commands:["validate","inspect"],runsPerCase:2,results};
assert.ok(outputFile);writeFileSync(outputFile,JSON.stringify(report)+"\n");console.log(JSON.stringify({candidate,regressions:results.length,passed:results.length}));
}
