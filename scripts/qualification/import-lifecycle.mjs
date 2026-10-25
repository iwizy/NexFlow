import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync,cpSync,mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {inventory,verifyPayload} from '../../evaluation/delivery/install.mjs';
import {candidates,json,fileSha,writeRecord,extract,sourceBinding} from './common.mjs';
const [downloadRoot,runId]=process.argv.slice(2);assert.match(runId,/^\d+$/u);const folders=['linux-amd64','macos-arm64','windows-amd64'],root='evaluation/lifecycle/completion',checks=[];
for(const folder of folders){const matches=readdirSync(downloadRoot).filter(f=>f.startsWith('lifecycle-completion-'+folder+'-'));assert.equal(matches.length,1);const from=path.join(downloadRoot,matches[0]),cohort=json(path.join(from,'cohort.json'));assert.equal(cohort.runId,runId);mkdirSync(path.join(root,folder),{recursive:true});
  for(const id of candidates){const r=json(path.join(from,id+'.json'));assert.equal(r.result,['rust','go'].includes(id)&&folder==='windows-amd64'?'failed':'passed-amended-unsigned-scope');assert.equal(r.runId,runId);assert.equal(r.environmentSha256,cohort.environmentSha256);const previous=json('evaluation/lifecycle/requalification/'+folder+'/'+id+'.json');assert.equal(r.previous.archiveSha256,previous.artifact.sha256);assert.equal(r.previous.genuineRetainedPackage,true);
    const archive=path.join(from,r.current.filename);assert.equal(fileSha(archive),r.current.archiveSha256);assert.equal(readFileSync(archive).length,r.current.bytes);const temp=mkdtempSync(path.join(os.tmpdir(),'nf-capsule-verify-'));try{extract(archive,temp);verifyPayload(temp,r.current.manifest);for(const file of previous.artifact.files){const current=r.current.manifest.find(f=>f.path===file.path);assert.ok(current);assert.equal(current.sha256,file.sha256,'Candidate payload changed rather than only delivery layer');}checks.push({target:r.target,candidate:id,archiveSha256:r.current.archiveSha256,files:r.current.manifest.length,previousFilesUnchanged:previous.artifact.files.length,passed:true});}finally{rmSync(temp,{recursive:true});}
    cpSync(path.join(from,id+'.json'),path.join(root,folder,id+'.json'));
  }cpSync(path.join(from,'cohort.json'),path.join(root,folder,'cohort.json'));
}
writeRecord(path.join(root,'archive-verification.json'),{task:'NF-102-03',recordedAt:new Date().toISOString(),runId,producer:sourceBinding(['scripts/qualification/import-lifecycle.mjs']),results:checks,archives:checks.length,files:checks.reduce((n,r)=>n+r.files,0),failed:0,sourcePayloadUnchanged:true,scope:'Independent extraction/hash checks of actual retained native v2 archives against unchanged v1 payload plus shipped delivery layer'});
console.log(JSON.stringify({archives:checks.length,files:checks.reduce((n,r)=>n+r.files,0),signed:false,amendedScope:true}));
