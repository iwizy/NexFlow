import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {candidates,json,sha,fileSha} from './common.mjs';
import {modelChecks} from './boundary-model.mjs';
const controls=modelChecks(),root='evaluation/security-qualification',folders=['linux-amd64','macos-arm64','windows-amd64'];let records=0;
if(folders.some(folder=>existsSync(root+'/'+folder))){for(const folder of folders){const cohort=json(root+'/'+folder+'/cohort.json');assert.equal(cohort.beforeAfterIdentical,true);assert.equal(cohort.allFourInSameNativeJob,true);
  for(const id of candidates){const r=json(root+'/'+folder+'/'+id+'.json');assert.equal(r.task,'NF-102-04');assert.equal(r.candidate,id);const rejected=id==='rust'&&folder==='windows-amd64';assert.equal(r.result,rejected?'failed':'passed-declared-validation-boundary');if(rejected)assert.equal(r.selectionDisposition,'rejected-retain-failed-windows-gate');assert.equal(r.architectureAccepted,false);assert.equal(r.environmentSha256,cohort.environmentSha256);assert.equal(sha(JSON.stringify(r.environment)),r.environmentSha256);assert.equal(r.controls.beforeCandidate,true);
    for(const key of r.controls.effects){assert.equal(r.controls.positive[key],0);assert.ok(r.controls.denied[key]!==0);}
    if(r.target==='windows/amd64'){assert.equal(r.controls.actualToken.appContainer,true);assert.equal(r.controls.actualToken.capabilityCount,0);}
    assert.equal(r.results.length,19);if(rejected)assert.ok(r.results.some(x=>x.errors.length));for(const result of r.results){if(!rejected)assert.deepEqual(result.errors,[]);assert.equal(result.observations.length,2);assert.equal(result.observations[0].stdoutSha256,result.observations[1].stdoutSha256);}
    assert.equal(r.inheritedDescriptors.positiveExit,0);assert.equal(r.inheritedDescriptors.deniedExit,13);assert.equal(r.resourceBudget.deadlineControl.timedOut,true);assert.equal(r.immutableInputs,true);assert.equal(r.immutablePayload,true);assert.equal(r.preQueuePublicOutputsOnly,true);assert.equal(r.revocationModelPassed,true);assert.ok(r.modelChecks>=14);assert.ok(r.residuals.length>=6);
    for(const source of r.producer.sources){assert.equal(fileSha(source.path),source.sha256);const p=spawnSync('git',['show',r.producer.revision+':'+source.path],{maxBuffer:16*1024*1024});assert.equal(p.status,0);assert.equal(sha(p.stdout),source.sha256);}records++;
  }
}}
console.log(JSON.stringify({task:'NF-102-04',inertBoundaryControls:controls,storedNativeRecords:records,scope:'current validation-only candidates; no executable runtime/provider/credential implementation or general OS security certificate',nativeAcceptance:records===12?'declared-boundary-passed':'not-yet-recorded'}));
