#!/usr/bin/env node
// Import real native observations and independently verify their capsule bytes.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,readdirSync,mkdirSync,mkdtempSync,lstatSync,rmSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import os from "node:os";
import {digest} from "./lib/runtime-evaluation.mjs";
import {nativeCandidates,nativeRecordErrors} from "./lib/native-lifecycle-evidence.mjs";
const [download,runId]=process.argv.slice(2);assert.ok(download&&/^\d+$/u.test(runId));
const root="evaluation/lifecycle/requalification",contract=JSON.parse(readFileSync(root+"/contract.json")),results=[];
const walk=at=>readdirSync(at,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,"en")).flatMap(e=>{const f=path.join(at,e.name);if(e.isDirectory())return walk(f).map(r=>({...r,path:e.name+"/"+r.path}));assert.ok(e.isFile());return[{path:e.name,bytes:lstatSync(f).size,sha256:digest(readFileSync(f))}];});
for(const target of contract.targets){const slug=target.id.replaceAll("/","-"),folder=readdirSync(download).find(f=>f.startsWith("current-native-"+slug+"-"));assert.ok(folder,"missing native target "+target.id);const source=path.join(download,folder),dest=root+"/"+slug;mkdirSync(dest,{recursive:true});const cohortBytes=readFileSync(path.join(source,"cohort.json")),cohort=JSON.parse(cohortBytes);assert.equal(cohort.target,target.id);assert.equal(cohort.runId,runId);
 for(const id of nativeCandidates){const bytes=readFileSync(path.join(source,id+".json")),r=JSON.parse(bytes);assert.deepEqual(nativeRecordErrors(r,contract),[]);assert.equal(r.environmentSha256,cohort.environmentSha256);
  if(r.artifact){const archive=path.join(source,r.artifact.filename);assert.equal(digest(readFileSync(archive)),r.artifact.sha256);assert.equal(lstatSync(archive).size,r.artifact.bytes);const temp=mkdtempSync(path.join(os.tmpdir(),"nf-native-archive-check-"));try{const listing=spawnSync("tar",["-tf",archive],{encoding:"utf8"});assert.equal(listing.status,0);for(const member of listing.stdout.trim().split("\n"))assert.ok(!path.isAbsolute(member)&&!member.split("/").includes(".."));assert.equal(spawnSync("tar",["-xzf",archive,"-C",temp]).status,0);assert.deepEqual(walk(temp),r.artifact.files);results.push({target:target.id,candidate:id,archiveSha256:r.artifact.sha256,files:r.artifact.files.length,passed:true});}finally{rmSync(temp,{recursive:true});}}
  writeFileSync(dest+"/"+id+".json",bytes);
 }writeFileSync(dest+"/cohort.json",cohortBytes);
}
const revision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();writeFileSync(root+"/archive-verification.json",JSON.stringify({task:"NF-102-03",recordedAt:new Date().toISOString(),collectorRevision:revision,runId,results,failed:0,scope:"Exact archive bytes and all regular files independently extracted/hashed; no product/signing/upgrade acceptance",collectorSources:[{path:"scripts/runtime-native-lifecycle-import.mjs",sha256:digest(readFileSync("scripts/runtime-native-lifecycle-import.mjs"))}]},null,2)+"\n");
console.log(JSON.stringify({verifiedArchives:results.length,files:results.reduce((n,r)=>n+r.files,0)}));
