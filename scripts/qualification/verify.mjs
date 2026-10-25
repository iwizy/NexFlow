import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {inventory,installVerified,activateVerified,activeVersion,verifyPayload} from '../../evaluation/delivery/install.mjs';
import {sha,fileSha,json,git,candidates} from './common.mjs';
const phase=process.argv[2]??'lifecycle';assert.equal(phase,'lifecycle');
const scope=mkdtempSync(path.join(os.tmpdir(),'nf-installer-check-'));let controls=0;
try{const source=path.join(scope,'source'),store=path.join(scope,'versions');mkdirSync(source);writeFileSync(path.join(source,'payload'),'first');const manifest=inventory(source);installVerified({source,store,version:'v1',manifest});activateVerified({store,version:'v1',manifest});assert.equal(activeVersion(store).version,'v1');
  for(const f of [()=>installVerified({source,store,version:'../escape',manifest}),()=>installVerified({source,store,version:'v1',manifest}),()=>activateVerified({store,version:'absent',manifest}),()=>verifyPayload(source,[...manifest,{path:'../escape',bytes:1,sha256:'0'.repeat(64)}])]){assert.throws(f);controls++;}
  writeFileSync(path.join(source,'payload'),'second');const second=inventory(source);installVerified({source,store,version:'v2',manifest:second});activateVerified({store,version:'v2',manifest:second});assert.equal(activeVersion(store).version,'v2');activateVerified({store,version:'v1',manifest});assert.equal(activeVersion(store).version,'v1');
  const pointer=fileSha(path.join(store,'active.json'));writeFileSync(path.join(store,'v2/payload'),'damaged');assert.throws(()=>activateVerified({store,version:'v2',manifest:second}));assert.equal(fileSha(path.join(store,'active.json')),pointer);controls++;
}finally{rmSync(scope,{recursive:true});}
const policy=json('evaluation/delivery/unsigned-policy.json');assert.equal(policy.signing,'not-performed');assert.equal(policy.notarization,'not-performed');assert.equal(policy.productDistributionSupported,false);
const root='evaluation/lifecycle/completion',folders=['linux-amd64','macos-arm64','windows-amd64'];let records=0;
if(folders.some(f=>existsSync(root+'/'+f))){for(const folder of folders){const cohort=json(root+'/'+folder+'/cohort.json');assert.equal(cohort.beforeAfterIdentical,true);assert.equal(cohort.allFourInSameNativeJob,true);
  for(const id of candidates){const r=json(root+'/'+folder+'/'+id+'.json');assert.equal(r.task,'NF-102-03');assert.equal(r.candidate,id);assert.equal(r.result,'passed-amended-unsigned-scope');assert.equal(r.environmentSha256,cohort.environmentSha256);assert.equal(sha(JSON.stringify(r.environment)),r.environmentSha256);assert.equal(r.previous.genuineRetainedPackage,true);assert.equal(r.previous.runId,'39406341776');assert.notEqual(r.previous.archiveSha256,r.current.archiveSha256);assert.equal(r.distribution.signing,'not-performed');assert.equal(r.distribution.originalSigningCriterionSatisfied,false);assert.equal(r.architectureAccepted,false);assert.equal(r.controls.positive.exitCode,0);assert.equal(r.controls.denied.exitCode,13);assert.equal(r.steps.length,3);assert.deepEqual(r.steps.map(s=>s.stage),['install-previous','upgrade','rollback']);assert.equal(r.tamperedUpgradeRefused,true);assert.ok(Object.values(r.uninstall).every(Boolean));
    for(const step of r.steps){assert.equal(step.passed,true);assert.equal(step.checkoutSchemasUnavailable,true);assert.equal(step.cases.length,11);for(const c of step.cases){assert.deepEqual(c.errors,[]);assert.equal(c.runs.length,2);assert.equal(c.runs[0].stdoutSha256,c.runs[1].stdoutSha256);}}
    for(const source of r.producer.sources){assert.equal(fileSha(source.path),source.sha256);assert.equal(sha(Buffer.from(git('show',r.producer.revision+':'+source.path)+'\n')),source.sha256);}
    records++;
  }
}}
console.log(JSON.stringify({task:'NF-102-03',installerControls:controls,storedNativeRecords:records,signing:'not-performed',distribution:'unsigned-evaluation-developer-only',nativeAcceptance:records===12?'amended-scope-passed':'not-yet-recorded'}));
