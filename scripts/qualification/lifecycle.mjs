import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,cpSync,rmSync,existsSync,renameSync} from 'node:fs';
import {createServer} from 'node:net';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {inventory,verifyPayload,installVerified,activateVerified,activeVersion} from '../../evaluation/delivery/install.mjs';
import {baseline,compareOutput,verifyCorpus} from '../lib/runtime-evaluation.mjs';
import {candidates,sha,fileSha,json,run,checked,git,sourceBinding,writeRecord,extract,capsuleCommand,cleanEnvironment,windowsSession} from './common.mjs';
export const producerFiles=['scripts/qualification/lifecycle.mjs','scripts/qualification/common.mjs','scripts/qualification/windows-session.cs','scripts/qualification/windows-session.ps1','evaluation/delivery/install.mjs','evaluation/delivery/unsigned-policy.json','.github/workflows/native-lifecycle-completion.yml'];
const [target,configFile,predecessorDir,outputDir]=process.argv.slice(2),tools=json(configFile),platforms={'linux/amd64':['linux','x64'],'macos/arm64':['darwin','arm64'],'windows/amd64':['win32','x64']};
assert.deepEqual([process.platform,process.arch],platforms[target]);assert.equal(process.versions.node,'26.12.0');assert.deepEqual(verifyCorpus(),[]);
const producer=sourceBinding(producerFiles),scope=mkdtempSync(path.join(os.tmpdir(),'nf-lifecycle-complete-')),output=path.resolve(outputDir);mkdirSync(output,{recursive:true});
const environment=JSON.parse(checked(process.execPath,['scripts/runtime-evaluation-environment.mjs',target]));delete environment.cohortCheck;
const environmentSha256=sha(JSON.stringify(environment)),predecessorRoot=path.resolve(predecessorDir),runtime=path.join(scope,'runtime');mkdirSync(runtime);
const node=path.join(runtime,'node'+(process.platform==='win32'?'.exe':''));cpSync(process.execPath,node);
let pythonBase=tools.pythonBase;
if(process.platform==='win32'){cpSync(path.dirname(pythonBase),path.join(runtime,'python'),{recursive:true});pythonBase=path.join(runtime,'python/python.exe');}
const fixtureRoot=path.join(scope,'inputs space юникод');mkdirSync(fixtureRoot);
const networkCode='const n=require("node:net"),s=n.connect({host:"127.0.0.1",port:Number(process.argv[1])});s.setTimeout(2000,()=>process.exit(12));s.on("error",e=>{console.log(e.code);process.exit(13)});s.on("connect",()=>{s.destroy();process.exit(0)});';
const server=createServer(s=>s.destroy());await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const prepared=[],roots=[scope,process.cwd(),path.dirname(configFile),pythonBase],env=cleanEnvironment(scope);
let session;const schemas=path.resolve('schemas'),hidden=path.join(scope,'checkout-schemas-unavailable');
try{
  for(const id of candidates){
    const prior=json('evaluation/lifecycle/requalification/'+target.replace('/','-')+'/'+id+'.json');assert.equal(prior.collectorRevision,'3cbbd1bc02da0768c9c116a18f56dab9a3ef3cb6');
    const archive=path.join(predecessorRoot,prior.artifact.filename);assert.equal(fileSha(archive),prior.artifact.sha256);
    const original=path.join(scope,id,'previous-extracted');extract(archive,original);verifyPayload(original,prior.artifact.files);
    const bundle=path.join(scope,id,'next-bundle');cpSync(original,bundle,{recursive:true});mkdirSync(path.join(bundle,'delivery'));
    cpSync('evaluation/delivery/install.mjs',path.join(bundle,'delivery/install.mjs'));
    writeFileSync(path.join(bundle,'delivery/capsule.json'),JSON.stringify({format:'nexflow-evaluation-delivery-v2',candidate:id,target,sourceRevision:prior.sourceRevision,packageRevision:producer.revision,previousArchiveSha256:prior.artifact.sha256,installerSha256:fileSha('evaluation/delivery/install.mjs'),distributionMode:'unsigned-evaluation-developer-only',features:['exact-inventory-install','immutable-version-slots','verify-before-atomic-activation','refuse-tampered-activation']},null,2)+'\n');
    const manifest=inventory(bundle),filename=id+'-delivery-v2-'+producer.revision+'.'+target.replace('/','.')+'.tar.gz',currentArchive=path.join(output,filename),tar=process.platform==='win32'?path.join(process.env.SystemRoot,'System32/tar.exe'):'tar';
    checked(tar,['-czf',currentArchive,'-C',bundle,'.']);const fresh=path.join(scope,id,'current-extracted');extract(currentArchive,fresh);verifyPayload(fresh,manifest);
    const store=path.join(scope,id,'installed space юникод'),previousVersion='evaluation-v1-3cbbd1bc02da',currentVersion='evaluation-v2-'+producer.revision.slice(0,12);
    const previous=installVerified({source:original,store,version:previousVersion,manifest:prior.artifact.files});
    // Exercise the actual installer shipped in the new capsule, not a mock transaction.
    const installedApi=await import(pathToFileURL(path.join(fresh,'delivery/install.mjs')));
    const current=installedApi.installVerified({source:fresh,store,version:currentVersion,manifest});
    let python;
    if(id==='python'){const venv=path.join(runtime,'venv');checked(pythonBase,['-I','scripts/evaluation-python-provision.py','--offline','--venv',venv,'--lock',path.join(current,'evaluation/prototypes/python/requirements.lock'),'--wheelhouse',path.join(current,'wheelhouse'),'--provisioner',tools.pipProvisioner]);python=path.join(venv,process.platform==='win32'?'Scripts/python.exe':'bin/python');}
    prepared.push({id,prior,archive,currentArchive,filename,manifest,store,previous,current,previousVersion,currentVersion,python,installedApi});
  }
  if(process.platform==='win32')session=await windowsSession({scope,readable:[runtime,fixtureRoot,...prepared.map(p=>p.store)]});
  async function invoke(command,args,denied=true){if(!denied)return run(command,args,{cwd:scope,env,timeout:30000});if(session)return session.run(command,args,{cwd:runtime,env});if(process.platform==='darwin')return run('/usr/bin/sandbox-exec',['-p','(version 1)(allow default)(deny network*)',command,...args],{cwd:scope,env,timeout:30000});return run('sudo',['unshare','--net','setpriv','--reuid',String(process.getuid()),'--regid',String(process.getgid()),'--clear-groups','--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all',command,...args],{cwd:scope,env,timeout:30000});}
  const positive=await invoke(node,['-e',networkCode,String(server.address().port)],false),denied=await invoke(node,['-e',networkCode,String(server.address().port)]);
  assert.equal(positive.exitCode,0,'Positive network control failed');assert.equal(denied.exitCode,13,'OS network denial inactive');
  if(session){assert.equal(denied.appContainer,true);assert.equal(denied.capabilityCount,0);assert.match(denied.stdout,/EACCES|EPERM|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT/u);}else assert.match(denied.stdout,/EACCES|EPERM|ENETUNREACH|EHOSTUNREACH/u);
  renameSync(schemas,hidden);
  for(const p of prepared){
    const {id,prior,store,previous,current,previousVersion,currentVersion,manifest,installedApi}=p,canary=path.join(scope,id,'outside-canary');writeFileSync(canary,'synthetic-preserved');
    const record={task:'NF-102-03',candidate:id,target,recordedAt:new Date().toISOString(),producer,sourceRevision:prior.sourceRevision,specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:fileSha('evaluation/library-cases.json'),environment,environmentSha256,runId:process.env.GITHUB_RUN_ID,previous:{version:prior.artifact.version,archiveSha256:prior.artifact.sha256,runId:'39406341776',genuineRetainedPackage:true},current:{format:'nexflow-evaluation-delivery-v2',filename:p.filename,archiveSha256:fileSha(p.currentArchive),bytes:readFileSync(p.currentArchive).length,manifest,packageRevision:producer.revision,candidateCodeUnchanged:true,realPackagingChange:'Shipped verified immutable-slot installer and tamper-safe atomic activation, not only collector/date changes'},controls:{positive,denied},steps:[],distribution:{mode:'unsigned-evaluation-developer-only',signing:'not-performed',notarization:'not-performed',originalSigningCriterionSatisfied:false,scopeAmendment:'Explicit maintainer decision 2026-10-25; public distribution deferred to NF-103'},architectureAccepted:false};
    async function observe(stage,version,prefix,expected){installedApi.activateVerified({store,version,manifest:expected});assert.equal(activeVersion(store).version,version);const result=[];
      const command=capsuleCommand(id,prefix,{node,python:p.python});
      for(const item of baseline.cases){const fixture=path.join(fixtureRoot,id+'-'+stage+'-'+item.id);cpSync(item.root,fixture,{recursive:true});if(item.append){const at=path.join(fixture,item.append.file);writeFileSync(at,readFileSync(at,'utf8')+item.append.text);}
        const before=sha(JSON.stringify(inventory(fixture))),runs=[],errors=[];
        for(let n=0;n<2;n++){const r=await invoke(command[0],[...command.slice(1),item.command,'--root',fixture,...item.args,'--format','json']);let parsed;try{parsed=JSON.parse(r.stdout);errors.push(...compareOutput(item,parsed,r.exitCode,r.stderr));}catch{errors.push('invalid-json');}runs.push({exitCode:r.exitCode,stdoutSha256:sha(r.stdout),stderr:r.stderr,output:parsed??null});}
        if(runs[0].stdoutSha256!==runs[1].stdoutSha256)errors.push('not-repeatable');assert.equal(sha(JSON.stringify(inventory(fixture))),before);result.push({id:item.id,runs,errors});
      }
      record.steps.push({stage,version,cases:result,passed:result.every(c=>!c.errors.length),activePointerVerified:true,checkoutSchemasUnavailable:!existsSync(schemas),networkMode:'OS-denied'});
    }
    await observe('install-previous',previousVersion,previous,prior.artifact.files);
    await observe('upgrade',currentVersion,current,manifest);
    const pointerBefore=fileSha(path.join(store,'active.json')),targetFile=path.join(current,'delivery/capsule.json'),originalBytes=readFileSync(targetFile);writeFileSync(targetFile,Buffer.concat([originalBytes,Buffer.from('tampered')]));let refused=false;try{installedApi.activateVerified({store,version:currentVersion,manifest});}catch{refused=true;}finally{writeFileSync(targetFile,originalBytes);}assert.ok(refused);assert.equal(fileSha(path.join(store,'active.json')),pointerBefore);record.tamperedUpgradeRefused=true;
    await observe('rollback',previousVersion,previous,prior.artifact.files);
    verifyPayload(previous,prior.artifact.files);verifyPayload(current,manifest);
    const archiveBefore=fileSha(p.currentArchive),runtimeBefore=fileSha(node);rmSync(store,{recursive:true});record.uninstall={prefixAbsent:!existsSync(store),outsidePreserved:readFileSync(canary,'utf8')==='synthetic-preserved',archivePreserved:fileSha(p.currentArchive)===archiveBefore,runtimePreserved:fileSha(node)===runtimeBefore};
    record.result=record.steps.every(s=>s.passed)&&Object.values(record.uninstall).every(Boolean)?'passed-amended-unsigned-scope':'failed';writeRecord(path.join(output,id+'.json'),record,roots);assert.equal(record.result,'passed-amended-unsigned-scope',id+' real lifecycle failed');
  }
  renameSync(hidden,schemas);assert.deepEqual(verifyCorpus(),[]);
  const after=JSON.parse(checked(process.execPath,['scripts/runtime-evaluation-environment.mjs',target]));delete after.cohortCheck;assert.deepEqual(after,environment);
  writeRecord(path.join(output,'cohort.json'),{task:'NF-102-03',target,producer,environment,environmentSha256,allFourInSameNativeJob:true,beforeAfterIdentical:true,runId:process.env.GITHUB_RUN_ID,distributionMode:'unsigned-evaluation-developer-only'},roots);
}finally{if(existsSync(hidden)&&!existsSync(schemas))renameSync(hidden,schemas);if(session)await session.close();server.close();assert.ok(path.basename(scope).startsWith('nf-lifecycle-complete-'));rmSync(scope,{recursive:true});}
