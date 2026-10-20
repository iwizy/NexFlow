#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {nativeCandidates,nativeCollectorFiles,nativeRecordErrors} from "./lib/native-lifecycle-evidence.mjs";
import {digest,baseline} from "./lib/runtime-evaluation.mjs";
const root="evaluation/lifecycle/requalification",json=f=>JSON.parse(readFileSync(root+"/"+f)),contract=json("contract.json");
assert.equal(contract.architectureAccepted,false);assert.equal(contract.previousArtifacts.status,"unavailable");assert.equal(contract.signing.status,"unavailable");
const env={platform:"linux",architecture:"x64",runnerLabel:"ubuntu-24.04"};
const control={task:"NF-102-03",candidate:"rust",target:"linux/amd64",sourceRevision:contract.candidateSourceRevision,collectorRevision:"1".repeat(40),collectorSources:nativeCollectorFiles.map(path=>({path,sha256:"2".repeat(64)})),environment:env,environmentSha256:digest(JSON.stringify(env)),specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,sourceManifest:[{path:"schemas/project.schema.json",sha256:"2".repeat(64)}],previousArtifact:null,artifact:null,stages:Object.fromEntries(["build","package","install","validateInspect","offlineUse","uninstall","upgrade","rollback","signing","notarization"].map(s=>[s,{status:"not-tested",evidence:["explicit missing prerequisite"]}])),blockers:["previous artifact unavailable","signing unavailable"],immutability:{sources:true,corpus:true},taskStatus:"blocked",outcome:"not-ready",architectureAccepted:false};
assert.deepEqual(nativeRecordErrors(control,contract),[]);let negativeControls=0;
for(const mutate of [r=>r.sourceRevision="0".repeat(40),r=>r.architectureAccepted=true,r=>r.previousArtifact={version:"fabricated"},r=>r.stages.signing.status="passed",r=>r.immutability.sources=false,r=>r.environment.architecture="arm64",r=>r.stages.validateInspect.status="passed",r=>r.stages.offlineUse.status="passed",r=>r.sourceManifest=[]]){const r=structuredClone(control);mutate(r);assert.ok(nativeRecordErrors(r,contract).length);negativeControls++;}
const folders=["linux-amd64","macos-arm64","windows-amd64"],any=folders.some(f=>existsSync(root+"/"+f+"/cohort.json"));let records=0;
if(any){
 for(const [index,folder]of folders.entries()){
  const cohort=json(folder+"/cohort.json");assert.equal(cohort.target,contract.targets[index].id);assert.equal(cohort.beforeAfterIdentical,true);assert.equal(cohort.allFourInSameNativeJob,true);assert.deepEqual(cohort.candidates,nativeCandidates);assert.equal(cohort.environmentSha256,digest(JSON.stringify(cohort.environment)));
  for(const candidate of nativeCandidates){const r=json(folder+"/"+candidate+".json");assert.equal(r.candidate,candidate);assert.equal(r.environmentSha256,cohort.environmentSha256);assert.equal(r.collectorRevision,cohort.collectorRevision);assert.deepEqual(nativeRecordErrors(r,contract),[]);
   for(const f of [...r.sourceManifest,...r.collectorSources]){assert.equal(digest(readFileSync(f.path)),f.sha256,"current source/collector drift: "+f.path);const rev=r.sourceManifest.includes(f)?r.sourceRevision:r.collectorRevision;const blob=spawnSync("git",["show",rev+":"+f.path],{maxBuffer:16*1024*1024});assert.equal(blob.status,0);assert.equal(digest(blob.stdout),f.sha256,"immutable source mismatch");}records++;
  }
 }
 const verification=json("archive-verification.json");assert.equal(verification.failed,0);assert.ok(verification.results.length>0);for(const item of verification.results){const r=json(item.target.replaceAll("/","-")+"/"+item.candidate+".json");assert.equal(item.archiveSha256,r.artifact.sha256);assert.equal(item.files,r.artifact.files.length);assert.equal(item.passed,true);}assert.equal(verification.results.length,folders.flatMap(f=>nativeCandidates.map(c=>json(f+"/"+c+".json"))).filter(r=>r.artifact).length);
}
console.log(JSON.stringify({task:"NF-102-03",negativeControls,storedNativeRecords:records,nativeAcceptance:"not-ready",missing:"genuine predecessor and permitted signing; any recorded OS denial/build failures remain explicit"}));
