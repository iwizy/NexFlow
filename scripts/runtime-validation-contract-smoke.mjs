#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {baseline,digest,repositoryRoot,verifyCorpus} from "./lib/runtime-evaluation.mjs";
import {candidates,same,publicErrors,reportErrors} from "./lib/diagnostic-requalification.mjs";
import {compareLibraryResult} from "./lib/evaluation-library.mjs";
import {compareReports} from "./runtime-diagnostics-comparison.mjs";
import {expectedDiagnostics} from "./runtime-diagnostic-projection-regression.mjs";
import {contractVersion,contractFiles,projectNative,publicContractErrors,supplementalExpected,verifyPublicReport} from "./lib/validation-diagnostic-contract.mjs";
const directory="evaluation/qualification/validation-diagnostics-v1";
const read=file=>readFileSync(path.join(repositoryRoot,file));
const catalog=JSON.parse(read("evaluation/library-cases.json"));
const blob=(revision,file)=>{const p=spawnSync("git",["show",revision+":"+file],{cwd:repositoryRoot,maxBuffer:16*1024*1024});assert.equal(p.status,0);return p.stdout;};
assert.deepEqual(verifyCorpus(),[]);
const control=projectNative({caseId:"control",operation:"local-schema",valid:false,diagnostics:[{code:"NF-SCHEMA",category:"required",instancePath:"",missingProperty:"a/b~c",nativeDiagnostic:{secret:"not-public"}}]});
assert.deepEqual(publicContractErrors(control),[]);assert.equal(control.diagnostics[0].path,"/a~1b~0c");assert.ok(!JSON.stringify(control).includes("not-public"));
let negativeControls=0;
for(const mutate of [r=>r.contractVersion="unknown",r=>r.operation="run",r=>r.executionAuthorized=true,r=>r.checks.runtime="passed",r=>r.nativeDiagnostic={},
  r=>r.diagnostics[0].nativeDiagnostic={},r=>r.diagnostics[0].context.nativeDiagnostic={},r=>r.diagnostics[0].path="/x\nprivate",r=>r.valid=true,r=>r.truncated=true,
  r=>r.result={},r=>r.diagnostics[0].meaning="wrong",r=>r.diagnostics[0].code="secret://private",r=>{delete r.diagnostics[0].category;}] ) {
  const changed=structuredClone(control);mutate(changed);assert.ok(publicContractErrors(changed).length);negativeControls++;
}
const unordered=projectNative({caseId:"control",operation:"local-schema",valid:false,diagnostics:[{code:"NF-SCHEMA",category:"type",instancePath:"/a"},{code:"NF-SCHEMA",category:"type",instancePath:"/b"}]});
unordered.diagnostics.reverse();assert.ok(publicContractErrors(unordered).includes("unordered-public-diagnostics"));negativeControls++;
if(process.argv.includes("--contract-only")) {console.log(JSON.stringify({negativeControls}));process.exit(0);}
const manifest=JSON.parse(read(directory+"/manifest.json"));
assert.equal(manifest.contractVersion,contractVersion);assert.match(manifest.sourceRevision,/^[a-f0-9]{40}$/u);
const pins={sourceRevision:manifest.sourceRevision,repairRevision:manifest.sourceRevision,specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(read("evaluation/library-cases.json"))};
const reports=candidates.map(candidate=>{const report=JSON.parse(read(directory+"/"+candidate+".json"));assert.equal(report.candidate,candidate);return report;});
function verify(report,revision) {
  assert.deepEqual(verifyPublicReport(report,catalog),[],report.candidate);
  assert.equal(report.sourceRevision,revision);assert.equal(report.harnessRevision,revision);
  assert.equal(report.specificationRevision,pins.specificationRevision);assert.equal(report.corpusSha256,pins.corpusSha256);assert.equal(report.catalogSha256,pins.catalogSha256);
  assert.equal(report.contractSha256,digest(read("evaluation/contracts/validation-diagnostics-v1.schema.json")));
  for(const file of contractFiles) assert.equal(digest(blob(revision,file)),digest(read(file)),"collector/contract source drift");
  const inventory=spawnSync("git",["ls-files","evaluation/prototypes/"+report.candidate,"schemas"],{cwd:repositoryRoot,encoding:"utf8"});assert.equal(inventory.status,0);
  assert.deepEqual(report.sourceInventory.map(e=>e.path),inventory.stdout.trim().split("\n"));
  for(const e of report.sourceInventory) {assert.equal(e.sha256,digest(read(e.path)),e.path);assert.equal(e.sha256,digest(blob(revision,e.path)));}
  assert.deepEqual(report.sourceInventory,report.legacy.sourceInventory);
  assert.deepEqual(reportErrors(report.legacy,catalog,{...pins,sourceRevision:revision,repairRevision:revision}),[]);
  const previous=JSON.parse(read("evaluation/requalification/diagnostic-projection-repair/"+report.candidate+".json"));
  assert.ok(same(report.legacy.library.results,previous.library.results),"existing native experiments changed");
  assert.ok(same(report.legacy.cli.results,previous.cli.results),"existing CLI scope/results changed");
  assert.equal(report.branchRegressions.sourceRevision,revision);assert.equal(report.branchRegressions.harnessRevision,revision);assert.equal(report.branchRegressions.results.length,10);
  for(const r of report.branchRegressions.results) {assert.ok(same(r.actual.diagnostics,expectedDiagnostics(r.id).slice(0,200)));assert.equal(r.status,"passed");}
  const bridge=report.legacy.cli.results.find(r=>r.id==="semantic-project-gap").bridgeObservation;
  for(const [i,r] of report.publicLibrary.results.entries()) {
    if(i<catalog.cases.length) {assert.deepEqual(compareLibraryResult(catalog.cases[i],r.native),[]);assert.ok(same(r.native,report.legacy.library.results[i].actual));}
    const expected=i<catalog.cases.length?projectNative(r.native):supplementalExpected(r,r.native,bridge);
    assert.ok(same(r.public,expected),r.id+" complete public projection");
    assert.deepEqual(publicContractErrors(r.public,[repositoryRoot,"NF_PRIVATE_VALUE_7f1c9"]),[]);
  }
  const flags=[["--semantic"],["--profile","core"],["--profile","mcp"],["--profile","a2a"],["--profile","extension"],["--runtime"],["--execute"],["--backend","NF_PRIVATE_VALUE_7f1c9"]];
  assert.deepEqual(report.unsupportedCli.map(r=>({command:r.command,flags:r.flags})),["validate","inspect"].flatMap(command=>flags.map(flags=>({command,flags}))));
  for(const r of report.unsupportedCli) {assert.deepEqual(publicErrors(r.actual,2,"",JSON.stringify(r.actual)+"\n"),[]);assert.equal(r.actual.command,null);assert.ok(Object.values(r.actual.checks).every(value=>value==="not-run"));assert.equal(r.stdoutSha256.length,2);assert.equal(new Set(r.stdoutSha256).size,1);}
}
for(const report of reports) {
  verify(report,manifest.sourceRevision);
  assert.equal(manifest.reportHashes.find(r=>r.candidate===report.candidate).sha256,digest(read(directory+"/"+report.candidate+".json")));
}
const outputs=r=>r.publicLibrary.results.map(x=>x.public);
for(const report of reports) assert.ok(same(outputs(report),outputs(reports[0])),"complete public-library parity");
assert.deepEqual(compareReports(reports.map(r=>r.legacy)).cli,{jsonCases:57,publicPassed:57,publicFailures:[]});
const liveOption=process.argv.indexOf("--observations");
if(liveOption>=0) {
  const revision=spawnSync("git",["rev-parse","HEAD"],{cwd:repositoryRoot,encoding:"utf8"}).stdout.trim();
  for(const [i,candidate] of candidates.entries()) {
    const live=JSON.parse(readFileSync(path.join(process.argv[liveOption+1],candidate+"-contract.json")));assert.equal(live.candidate,candidate);verify(live,revision);
    assert.ok(same(live.publicLibrary.results,reports[i].publicLibrary.results));assert.ok(same(live.unsupportedCli,reports[i].unsupportedCli));
  }
}
const closure=JSON.parse(read("rfcs/reviews/2026-10-13-nf-102-01-closure.json"));
assert.equal(closure.taskStatus,"completed");assert.equal(closure.sourceRevision,manifest.sourceRevision);assert.equal(closure.architectureStatus,"Draft");assert.equal(closure.architectureAccepted,false);
assert.deepEqual(closure.originalCriteria.map(c=>c.status),["passed","passed","passed"]);assert.deepEqual(closure.remainingCards,["NF-102-02","NF-102-03","NF-102-04","NF-102-05","NF-102-06"]);
assert.equal(closure.allArchitectureGatesClosed,false);assert.equal(closure.fullProjectSemanticsImplemented,false);
assert.equal(closure.technicalAcceptanceRequirementsWaived,false);assert.equal(closure.originalTaskScopeChanged,false);
console.log(JSON.stringify({task:"NF-102-01",taskOutcome:"completed",publicLibraryCases:362,publicCliParity:"57/57",unsupportedProfileProbes:16,negativeControls,architecture:"Draft/not-ready"}));
