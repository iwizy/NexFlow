#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,cpSync,mkdirSync,rmSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import os from "node:os";
import {parse} from "yaml";
import {baseline,digest,repositoryRoot,verifyCorpus} from "./lib/runtime-evaluation.mjs";
import {compareLibraryResult} from "./lib/evaluation-library.mjs";
import {same,publicErrors,reportErrors} from "./lib/diagnostic-requalification.mjs";
import {contractVersion,contractFiles,projectNative,publicContractErrors,supplementalCases,supplementalExpected,verifyPublicReport,canonicalBytes} from "./lib/validation-diagnostic-contract.mjs";
const [candidate,driverJson,cliJson,outputFile]=process.argv.slice(2),driver=JSON.parse(driverJson),cli=JSON.parse(cliJson);
assert.ok(["typescript","python","rust","go"].includes(candidate));
for(const command of [driver,cli]) assert.ok(Array.isArray(command)&&command.length&&command.every(x=>typeof x==="string"));
const git=(...args)=>{const p=spawnSync("git",args,{cwd:repositoryRoot,encoding:"utf8",maxBuffer:16*1024*1024});assert.equal(p.status,0);return p.stdout.trim();};
const revision=git("rev-parse","HEAD");
for(const file of contractFiles) assert.equal(digest(readFileSync(path.join(repositoryRoot,file))),digest(spawnSync("git",["show",revision+":"+file],{cwd:repositoryRoot}).stdout),"commit collector before recording evidence");
const run=(command,args=[],input)=>spawnSync(command[0],[...command.slice(1),...args],{cwd:repositoryRoot,input,encoding:"utf8",timeout:120000,maxBuffer:32*1024*1024,shell:false});
const temporary=mkdtempSync(path.join(os.tmpdir(),"nexflow-public-contract-"));
try {
  assert.deepEqual(verifyCorpus(),[]);
  const option=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
  const cachedLegacy=option("--legacy"),cachedBranches=option("--branches");
  assert.equal(Boolean(cachedLegacy),Boolean(cachedBranches));
  const legacyFile=cachedLegacy??path.join(temporary,"legacy.json"),branchFile=cachedBranches??path.join(temporary,"branches.json");
  if(!cachedLegacy) for(const args of [["scripts/runtime-diagnostics-requalify-run.mjs",candidate,driverJson,cliJson,legacyFile,"--source-revision",revision,"--compact"],
    ["scripts/runtime-diagnostic-projection-regression.mjs",candidate,cliJson,branchFile]]) {
    const p=run([process.execPath],args);assert.equal(p.status,0,p.stdout+"\n"+p.stderr);
  }
  const legacy=JSON.parse(readFileSync(legacyFile)),branchRegressions=JSON.parse(readFileSync(branchFile));
  const catalog=JSON.parse(readFileSync(path.join(repositoryRoot,"evaluation/library-cases.json")));
  assert.equal(legacy.pins.sourceRevision,revision);assert.equal(legacy.harnessRevision,revision);assert.deepEqual(reportErrors(legacy,catalog,legacy.pins),[]);
  assert.equal(branchRegressions.sourceRevision,revision);assert.equal(branchRegressions.harnessRevision,revision);assert.equal(branchRegressions.results.length,10);
  cpSync(path.join(repositoryRoot,"fixtures/cli/valid/minimal-project"),path.join(temporary,"public-limit"),{recursive:true});
  const actorsPath=path.join(temporary,"public-limit/actors.yaml"),actors=parse(readFileSync(actorsPath,"utf8"));
  actors.actors=Array.from({length:230},(_,i)=>({id:"invalid-"+i,kind:"NF_PRIVATE_VALUE_7f1c9"}));writeFileSync(actorsPath,JSON.stringify(actors));
  const actorBytes=digest(readFileSync(actorsPath));
  const documents=Object.fromEntries(["project.yaml","actors.yaml","agents.yaml"].map(file=>{const doc=parse(readFileSync(path.join(repositoryRoot,"fixtures/cli/valid/minimal-project",file),"utf8"));return [doc.kind,doc];}));
  documents.ActorSet.actors[1].agentRef.id="missing-agent";
  const supplemental=supplementalCases(documents),entries=[...catalog.cases,...supplemental];
  const ts=candidate==="typescript"?await import("../evaluation/prototypes/typescript/dist/public.js"):null;
  const rawTs=candidate==="typescript"?await import("../evaluation/prototypes/typescript/dist/library.js"):null;
  const collect=(batch,root)=>{
    const packet=batch.map(({id,operation,input})=>({id,operation,input:structuredClone(input)})),before=JSON.stringify(packet);
    let observations,hashes;
    if(ts) {
      observations=[0,1].map(()=>{const schemas=rawTs.repositorySchemas();return packet.map(entry=>{
        const native=rawTs.evaluateLibraryCase(entry,root,schemas),first=ts.evaluatePublicLibraryCase(entry,root,schemas);
        assert.ok(same(native,rawTs.evaluateLibraryCase(entry,root,schemas)));assert.ok(same(first,ts.evaluatePublicLibraryCase(entry,root,schemas)));
        return {native,public:first};
      });});hashes=observations.map(r=>digest(JSON.stringify(r)));
    } else {
      const processes=[0,1].map(()=>run(driver,[root,"--public"],before));
      for(const p of processes) {assert.equal(p.status,0,p.stderr);assert.equal(p.stderr,"");}
      observations=processes.map(p=>JSON.parse(p.stdout));hashes=processes.map(p=>digest(p.stdout));
    }
    assert.equal(JSON.stringify(packet),before);assert.equal(observations[0].length,batch.length);
    return {observations,hashes};
  };
  const original=collect(catalog.cases,repositoryRoot),extra=collect(supplemental,temporary);
  const observations=original.observations.map((r,i)=>[...r,...extra.observations[i]]);
  const bridge=legacy.cli.results.find(r=>r.id==="semantic-project-gap").bridgeObservation;
  const results=entries.map((entry,i)=>{
    const {native,public:output}=observations[0][i],repeatable=same(observations[0][i],observations[1][i]);
    const errors=publicContractErrors(output,[repositoryRoot,temporary,"NF_PRIVATE_VALUE_7f1c9"]);
    if(i<catalog.cases.length) {
      errors.push(...compareLibraryResult(entry,native));
      if(!same(native,legacy.library.results[i].actual)) errors.push("changed-native-experiment");
    }
    const expected=i<catalog.cases.length?projectNative(native):supplementalExpected(entry,native,bridge);
    if(!same(expected,output)) errors.push("wrong-complete-public-projection");
    if(entry.id==="public-project-semantic-boundary"&&!same(native.diagnostics,bridge.diagnostics)) errors.push("changed-project-semantic-boundary");
    if(!repeatable) errors.push("not-repeatable");
    return {id:entry.id,operation:entry.operation,native,public:output,repeatable,inputUnchanged:true,secondResultSha256:digest(canonicalBytes(observations[1][i])),errors};
  });
  const unsupportedCli=[];
  for(const command of ["validate","inspect"]) for(const flags of [["--semantic"],["--profile","core"],["--profile","mcp"],["--profile","a2a"],["--profile","extension"],["--runtime"],["--execute"],["--backend","NF_PRIVATE_VALUE_7f1c9"]]) {
    const args=[command,"--root",path.join(temporary,"absent-root"),...flags,"--format=json"],processes=[0,1].map(()=>run(cli,args));
    const first=processes[0],output=JSON.parse(first.stdout);
    assert.equal(first.status,2);assert.deepEqual(publicErrors(output,2,first.stderr,first.stdout,[temporary,repositoryRoot,"NF_PRIVATE_VALUE_7f1c9"]),[]);
    assert.ok(processes.every(p=>p.status===first.status&&p.stdout===first.stdout&&p.stderr===first.stderr));
    assert.equal(output.checks.discovery,"not-run");assert.equal(output.result,null);
    unsupportedCli.push({command,flags,exitCode:first.status,actual:output,repeatable:true,stdoutSha256:processes.map(p=>digest(p.stdout))});
  }
  const report={task:"NF-102-01",contractVersion,candidate,recordedAt:new Date().toISOString(),sourceRevision:revision,harnessRevision:revision,
    specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(readFileSync(path.join(repositoryRoot,"evaluation/library-cases.json"))),
    contractSha256:digest(readFileSync(path.join(repositoryRoot,"evaluation/contracts/validation-diagnostics-v1.schema.json"))),sourceInventory:legacy.sourceInventory,
    legacy,branchRegressions,publicLibrary:{runsPerCase:4,rawHashes:[original.hashes,extra.hashes],passed:results.filter(r=>!r.errors.length).length,failed:results.filter(r=>r.errors.length).length,results},unsupportedCli,
    scope:{libraryOperations:[...new Set(catalog.cases.map(c=>c.operation))],cliCommands:["validate","inspect"],cliProjectChecks:["discovery","schema","declared-only-inspection"],fullProjectSemantics:"unsupported",coreAndExtensionProfiles:"unsupported",runtime:"unsupported",productPublicAbi:"not-established",nativeDetails:"separate-experimental-api-only",targetAcceptance:"not-tested"},
    taskOutcome:"completed",architectureOutcome:"Draft/not-ready"};
  const errors=verifyPublicReport(report,catalog);
  assert.deepEqual(verifyCorpus(),[]);assert.equal(digest(readFileSync(actorsPath)),actorBytes);
  assert.ok(outputFile);mkdirSync(path.dirname(path.resolve(outputFile)),{recursive:true});writeFileSync(outputFile,JSON.stringify(report)+"\n");
  console.log(JSON.stringify({candidate,publicLibrary:report.publicLibrary.passed,total:results.length,legacyLibrary:legacy.library.passed,legacyCli:legacy.cli.passed,branches:branchRegressions.results.length,unsupportedProfiles:unsupportedCli.length,errors,failed:results.filter(r=>r.errors.length).map(r=>({id:r.id,errors:r.errors,public:r.public}))}));
  process.exitCode=errors.length?1:0;
} finally {rmSync(temporary,{recursive:true,force:true});}
