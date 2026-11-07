// Verify selected alpha evidence and prepare reviewable assets. No publication API.
import assert from "node:assert/strict";
import {spawnSync,execFileSync} from "node:child_process";
import {cpSync,existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {createRequire} from "node:module";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {extract,inventory,npm,repository,sha256} from "./reference-packages.mjs";
import {verifyPackage} from "../packages/cli/distribution/verify-package.mjs";

const read=file=>JSON.parse(readFileSync(file,"utf8"));
const option=name=>{const i=process.argv.indexOf(name);assert.ok(i>0&&process.argv[i+1]);return path.resolve(process.argv[i+1]);};
const inputs=option("--inputs"),out=option("--out");assert.ok(!existsSync(out));
const directory=path.join(repository,"release/0.5-preview"),context=read(path.join(directory,"evidence.json")),record=read(path.join(directory,"record.json"));
const ajv=new Ajv2020({strict:false,allErrors:true});addFormats(ajv);
const valid=ajv.compile(read(path.join(repository,"release/candidate-readiness.schema.json")));
function decision(value,details){
  assert.ok(valid(value),JSON.stringify(valid.errors));
  assert.equal(value.candidate.commit,details.sourceRevision);
  assert.equal(value.candidate.proposedTag,"v0.5.0-alpha.1");assert.equal(value.decision.outcome,"ready-with-notes");
  assert.deepEqual(details.gates.map(g=>g.id),["B1","B2","B3","B4","B5","B6","B7","B8"]);
  assert.ok(details.gates.every(g=>g.status==="ready"&&g.scope==="pre-publication technical readiness"));
  assert.equal(details.publication.authority,"not-granted");assert.equal(details.publication.publicDownloadVerified,false);
  assert.equal(details.publication.tagCreated,false);assert.equal(details.conformance.nfCliClaim,false);
  assert.equal(details.personalReviewClaimed,false);assert.equal(details.independenceClaimed,false);
}
decision(record,context);
// Guard the consequences that would otherwise turn record validation into an
// approval or allow a missing mandatory technical result to disappear.
for(const change of [c=>c.gates[3].status="blocked",c=>c.publication.authority="granted",c=>c.publication.publicDownloadVerified=true,c=>c.conformance.nfCliClaim=true]){
  const altered=structuredClone(context);change(altered);assert.throws(()=>decision(record,altered));
}
const missing=structuredClone(record);delete missing.checks.validation;assert.equal(valid(missing),false);assert.ok(valid(record));
const git=args=>execFileSync("git",args,{cwd:repository,encoding:"utf8"}).trim();
const producerRevision=git(["rev-parse","HEAD"]);
execFileSync("git",["merge-base","--is-ancestor",context.sourceRevision,producerRevision],{cwd:repository});
assert.equal(git(["diff","--name-only",context.sourceRevision,"--","packages","schemas","package.json","package-lock.json","scripts/reference-packages.mjs","scripts/test/reference-security-policy.json"]),"","Selected package/build/policy inputs changed after qualification");
for(const pin of context.governancePins)assert.equal(sha256(readFileSync(path.join(repository,pin.path))),pin.sha256);
const reviewFiles=read(path.join(directory,"review-files.json"));
for(const item of reviewFiles)assert.equal(sha256(readFileSync(path.join(repository,item.path))),item.sha256,"Review input changed: "+item.path);
for(const group of context.inputs){
  assert.match(group.label,/^[a-z][a-z0-9-]+$/u);
  assert.deepEqual(inventory(path.join(inputs,group.label)).map(({path,bytes,sha256})=>({path,bytes,sha256})),group.files);
}
const candidate=path.join(inputs,"security/nf-107-candidate"),provenance=read(path.join(candidate,"PROVENANCE.json"));
assert.equal(provenance.sourceRevision,context.sourceRevision);assert.deepEqual(provenance.artifacts,context.artifacts);
for(const artifact of context.artifacts){
  assert.equal(sha256(readFileSync(path.join(candidate,artifact.file))),artifact.sha256);
  assert.equal(sha256(readFileSync(path.join(inputs,"native-inputs",artifact.file))),artifact.sha256);
  assert.equal(sha256(readFileSync(path.join(candidate,artifact.schemaIndex))),artifact.schemaIndexSha256);
}
for(const location of [candidate,path.join(inputs,"security/nf-108-supply-chain")])for(const line of readFileSync(path.join(location,"SHA256SUMS"),"utf8").trim().split("\n")){
  const [digest,file]=line.split("  ");assert.ok(file&&!file.includes("/")&&!file.includes("\\"));assert.equal(sha256(readFileSync(path.join(location,file))),digest);
}
const security=read(path.join(inputs,"security/nf-108-supply-chain/security-report.json"));
assert.equal(security.sourceRevision,context.sourceRevision);assert.deepEqual(security.unresolved,[]);assert.equal(security.outcome,"qualified-with-bounded-tooling-risks");
assert.ok(security.graphs.filter(g=>g.name.startsWith("delivered-")||g.name==="validation-build").every(g=>g.matchedAdvisoryInstances===0));
const packageChecks=read(path.join(inputs,"security/nf-107-qualification.json")),securityChecks=read(path.join(inputs,"security/nf-108-boundaries.json"));
assert.equal(packageChecks.sourceRevision,context.sourceRevision);assert.equal(packageChecks.records.length,54);assert.ok(packageChecks.records.every(r=>r.result==="passed"));
assert.equal(securityChecks.candidateSourceRevision,context.sourceRevision);assert.equal(securityChecks.records.length,30);assert.ok(securityChecks.records.every(r=>r.result==="passed"));
assert.equal(context.candidateCi.length,10);assert.ok(context.candidateCi.every(c=>c.status==="completed"&&c.conclusion==="success"));
assert.equal(context.sourceChecks.results.length,68);assert.ok(context.sourceChecks.results.every(c=>c.exitCode===0));
const targets=[];
for(const target of context.targets){
  const native=read(path.join(inputs,target.label,"lifecycle.json"));
  assert.equal(native.target,target.target);assert.equal(native.producer.revision,context.sourceRevision);assert.equal(native.outcome,"passed-unsigned-developer-scope");
  assert.deepEqual(native.candidates.current.artifacts,context.artifacts);assert.equal(native.environment.node,"26.13.0");
  assert.deepEqual([native.environment.platform,native.environment.architecture],target.platformArchitecture);
  assert.equal(native.network.positive.exitCode,0);assert.equal(native.network.denied.exitCode,13);
  if(target.target==="windows/amd64"){assert.equal(native.network.denied.appContainer,true);assert.equal(native.network.denied.capabilityCount,0);}
  const steps=new Map(native.records.map(s=>[s.name,s]));
  for(const name of ["install-previous","upgrade-current","reject-corrupt-update","reject-incompatible-update","rollback-previous","install-current","uninstall","environment fingerprint unchanged"]){assert.equal(steps.get(name)?.result,"passed");}
  for(const name of ["install-previous","upgrade-current","rollback-previous","install-current"]){
    const step=steps.get(name);assert.equal(step.realNpmWrapper.runs.length,4);assert.ok(step.realNpmWrapper.runs.every(r=>r.exitCode===0));assert.equal(step.inputBytesUnchanged,true);
  }
  assert.equal(sha256(readFileSync(path.join(inputs,target.label,"node-LICENSE.txt"))),native.runtime.licenseSha256);
  assert.ok(readFileSync(path.join(inputs,target.label,"node-SHASUMS256.txt"),"utf8").includes(native.runtime.archiveSha256));
  targets.push({target:native.target,outcome:native.outcome,environment:native.environment,method:native.network.method});
}
assert.deepEqual(targets.map(t=>t.target).sort(),["linux/amd64","macos/arm64","windows/amd64"]);

const scratch=realpathSync(mkdtempSync(path.join(tmpdir(),"nexflow-preview-review-"))),consumer=path.join(scratch,"consumer"),home=path.join(scratch,"home"),cache=path.join(scratch,"empty-cache"),project=path.join(scratch,"project");
for(const dir of [consumer,home,cache,project])mkdirSync(dir);
const quickstart=[];
try{
  const config=path.join(home,"empty.npmrc");writeFileSync(config,"");writeFileSync(path.join(consumer,"package.json"),'{"private":true,"type":"module"}\n');
  const env={PATH:path.dirname(process.execPath)+path.delimiter+"/usr/bin:/bin",HOME:home,LANG:"C.UTF-8",LC_ALL:"C.UTF-8",TMPDIR:scratch};
  const network=path.join(repository,"scripts/test/package-network-deny.mjs"),effects=path.join(repository,"scripts/test/no-runtime-deny.mjs"),reads=path.join(repository,"scripts/test/reference-cli-read-guard.mjs");
  const cli=context.artifacts.find(a=>a.name==="@nexflow/cli"),archive=path.join(candidate,cli.file),extracted=path.join(scratch,"extracted");extract(archive,extracted);await verifyPackage(extracted);
  const installed=spawnSync(process.execPath,["--import",network,npm,"install","--prefix",consumer,"--offline","--ignore-scripts","--no-audit","--no-fund","--update-notifier=false","--cache",cache,"--userconfig",config,archive],{env,cwd:scratch,encoding:"utf8",timeout:60000});assert.equal(installed.status,0,installed.stderr);
  const cliRoot=path.join(consumer,"node_modules/@nexflow/cli");await verifyPackage(cliRoot);
  const guide=readFileSync(path.join(repository,"docs/reference-cli-installation.md"),"utf8"),sample=guide.match(/```yaml\n([\s\S]*?)```/u)?.[1];assert.ok(sample);writeFileSync(path.join(project,"project.yaml"),sample);
  const before=sha256(readFileSync(path.join(project,"project.yaml")));
  const libraryRequire=createRequire(path.join(cliRoot,"node_modules/@nexflow/validation/package.json")),OutputAjv=libraryRequire("ajv/dist/2020.js");
  const outputValid=new OutputAjv({strict:false}).compile(read(path.join(cliRoot,"contracts/output.schema.json")));
  function run(args,expected,root=project){
    const r=spawnSync(process.execPath,["--import",effects,"--import",reads,path.join(cliRoot,"dist/main.js"),...args],{env:{...env,NEXFLOW_TEST_MODULE_ROOT:path.join(consumer,"node_modules"),NEXFLOW_TEST_READ_ROOT:root??""},cwd:scratch,encoding:"utf8",timeout:15000});
    assert.equal(r.status,expected,r.stderr);assert.equal(r.stderr,"");const parsed=JSON.parse(r.stdout);assert.ok(outputValid(parsed));assert.equal(parsed.exitCode,expected);assert.equal(parsed.executionAuthorized,false);
    assert.equal(parsed.checks.semantic,"not-run");assert.equal(parsed.checks.runtime,"not-run");quickstart.push({command:args[0],exitCode:r.status,stdoutSha256:sha256(Buffer.from(r.stdout))});
  }
  for(const flag of ["--help","--version"])run([flag,"--format=json"],0,null);
  for(const command of ["validate","inspect","graph"])run([command,"--root",project,"--format=json"],0);
  assert.equal(sha256(readFileSync(path.join(project,"project.yaml"))),before);
  writeFileSync(path.join(project,"project.yaml"),sample+"\nkind: Project\n");run(["validate","--root",project,"--format=json"],1);
  run(["run","--format=json"],2,null);

  mkdirSync(out,{recursive:true});
  for(const file of readdirSync(candidate).filter(f=>f!=="SHA256SUMS"))cpSync(path.join(candidate,file),path.join(out,file));
  cpSync(path.join(candidate,"SHA256SUMS"),path.join(out,"CANDIDATE-SHA256SUMS"));
  cpSync(path.join(directory,"record.json"),path.join(out,"candidate-readiness.json"));
  cpSync(path.join(repository,"release/0.5-preview-review.md"),path.join(out,"REVIEW.md"));
  cpSync(path.join(repository,"release/0.5-preview-release-notes.md"),path.join(out,"RELEASE-NOTES.md"));
  cpSync(path.join(repository,"release/0.5-preview-publication.md"),path.join(out,"PUBLICATION.md"));
  const stage=path.join(scratch,"evidence");mkdirSync(stage);
  for(const group of context.inputs)cpSync(path.join(inputs,group.label),path.join(stage,group.label),{recursive:true});
  cpSync(directory,path.join(stage,"review-inputs"),{recursive:true});
  const toolRequire=createRequire(path.resolve(path.dirname(npm),"../package.json")),tar=toolRequire("tar");
  await tar.c({file:path.join(out,"nexflow-0.5.0-alpha.1-evidence.tgz"),cwd:stage,gzip:true,portable:true,noMtime:true},inventory(stage).map(f=>f.path));
  const assessment={task:"NF-110",recordedAt:new Date().toISOString(),outcome:record.decision.outcome,scope:context.scope,reviewProducerRevision:producerRevision,
    selectedPackageRevision:context.sourceRevision,artifacts:context.artifacts,targets,sourceChecks:68,candidateCiWorkflows:10,installedPackageChecks:54,installedSecurityChecks:30,
    supplyChainOutcome:security.outcome,unresolved:security.unresolved,quickstart,publicationAuthorized:false,publicDownloadVerified:false,nfCliClaim:false,reviewFiles};
  writeFileSync(path.join(out,"ASSESSMENT.json"),JSON.stringify(assessment,null,2)+"\n");
  const assets=inventory(out).map(({path,bytes,sha256})=>({file:path,bytes,sha256}));
  writeFileSync(path.join(out,"ASSET-INVENTORY.json"),JSON.stringify({proposedTag:record.candidate.proposedTag,selectedPackageRevision:context.sourceRevision,reviewProducerRevision:producerRevision,assets},null,2)+"\n");
  writeFileSync(path.join(out,"SHA256SUMS"),readdirSync(out).sort().map(file=>sha256(readFileSync(path.join(out,file)))+"  "+file+"\n").join(""));
  console.log(JSON.stringify({task:"NF-110",outcome:assessment.outcome,source:context.sourceRevision,targets:targets.length,quickstartChecks:quickstart.length,publicationAuthorized:false}));
}finally{rmSync(scratch,{recursive:true,force:true});}
