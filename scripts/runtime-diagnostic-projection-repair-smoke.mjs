#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {baseline,digest,repositoryRoot,verifyCorpus} from "./lib/runtime-evaluation.mjs";
import {candidates,canonical,same,publicErrors,reportErrors} from "./lib/diagnostic-requalification.mjs";
import {compareReports} from "./runtime-diagnostics-comparison.mjs";
import {regressionCases,expectedDiagnostics} from "./runtime-diagnostic-projection-regression.mjs";
const directory="evaluation/requalification/diagnostic-projection-repair";
const historical=process.argv.includes("--historical");
const read=file=>readFileSync(new URL("../"+file,import.meta.url));
const committed=(revision,file)=>{const p=spawnSync("git",["show",revision+":"+file],{cwd:repositoryRoot,maxBuffer:16*1024*1024});assert.equal(p.status,0);return p.stdout;};
assert.deepEqual(verifyCorpus(),[]);
const manifest=JSON.parse(read(directory+"/manifest.json"));
assert.match(manifest.sourceRevision,/^[0-9a-f]{40}$/u);
assert.equal(manifest.candidateRepairAuthorized,true);
const pins={sourceRevision:manifest.sourceRevision,repairRevision:manifest.sourceRevision,specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(read("evaluation/library-cases.json"))};
const catalog=JSON.parse(read("evaluation/library-cases.json"));
const validate=new Ajv2020({allErrors:true,strict:false}).compile(JSON.parse(read("evaluation/requalification/validation-diagnostics/report.schema.json")));
const harnessFiles=["scripts/runtime-diagnostics-requalify-run.mjs","scripts/runtime-diagnostics-comparison.mjs","scripts/runtime-diagnostic-projection-regression.mjs","scripts/lib/diagnostic-requalification.mjs","scripts/lib/evaluation-library.mjs","scripts/lib/runtime-evaluation.mjs","evaluation/command-result.schema.json","evaluation/baseline.json","evaluation/library-cases.json"];
const reports=candidates.map(candidate=>{
  const bytes=read(directory+"/"+candidate+".json"),report=JSON.parse(bytes);
  assert.ok(validate(report),JSON.stringify(validate.errors));
  assert.deepEqual(reportErrors(report,catalog,pins),[],candidate);
  assert.equal(report.harnessRevision,manifest.sourceRevision);
  for(const file of harnessFiles) {const original=committed(report.harnessRevision,file);if(!historical) assert.equal(digest(original),digest(read(file)),"current collector/oracle binding changed: "+file);}
  const inventory=spawnSync("git",historical?["ls-tree","-r","--name-only",pins.sourceRevision,"--","evaluation/prototypes/"+candidate,"schemas"]:["ls-files","evaluation/prototypes/"+candidate,"schemas"],{cwd:repositoryRoot,encoding:"utf8"});
  assert.equal(inventory.status,0);assert.deepEqual(report.sourceInventory.map(e=>e.path),inventory.stdout.trim().split("\n"));
  for(const entry of report.sourceInventory) {
    if(!historical) assert.equal(digest(read(entry.path)),entry.sha256,"current candidate/lock/schema changed: "+entry.path);
    assert.equal(digest(committed(pins.sourceRevision,entry.path)),entry.sha256);
  }
  const previous=JSON.parse(read("evaluation/requalification/validation-diagnostics/"+candidate+".json"));
  assert.ok(same(report.library.results,previous.library.results),"public repair must not alter any library observation");
  assert.deepEqual(report.cli.results.map(r=>({id:r.id,args:r.args,inputSha256:r.inputSha256,expected:r.expected})),previous.cli.results.map(r=>({id:r.id,args:r.args,inputSha256:r.inputSha256,expected:r.expected})),"original CLI workloads/expectations must remain unchanged");
  for(const result of report.cli.results) {
    assert.equal(new Set(result.stdoutSha256).size,1);assert.equal(new Set(result.stderrSha256).size,1);
    if(!result.id.endsWith("-text")) assert.deepEqual(publicErrors(result.actual,result.actual.exitCode,"",JSON.stringify(result.actual)+"\n"),[]);
  }
  const regressionBytes=read(directory+"/"+candidate+"-regressions.json"),regression=JSON.parse(regressionBytes);
  assert.equal(regression.task,"NF-102-01");assert.equal(regression.scope,"public-schema-branch-projection-repair");assert.equal(regression.candidate,candidate);
  assert.equal(regression.sourceRevision,pins.sourceRevision);assert.equal(regression.harnessRevision,manifest.sourceRevision);
  assert.deepEqual(regression.commands,["validate","inspect"]);assert.equal(regression.runsPerCase,2);
  assert.deepEqual(regression.results.map(r=>[r.id,r.command]),regressionCases.flatMap(c=>["validate","inspect"].map(command=>[c.id,command])));
  for(const result of regression.results) {
    const expected=expectedDiagnostics(result.id),retained=expected.slice(0,200);
    assert.equal(result.totalExpected,expected.length);assert.equal(result.retainedExpected,retained.length);
    assert.equal(result.expectedSha256,digest(JSON.stringify(canonical(retained))));
    assert.ok(same(result.actual.diagnostics,retained),result.id+" exact constraint projection");
    assert.deepEqual(publicErrors(result.actual,1,"",JSON.stringify(result.actual)+"\n"),[]);
    assert.equal(result.actual.command,result.command);assert.equal(result.actual.truncated,expected.length>200);
    assert.equal(result.actual.result,null);assert.equal(result.actual.checks.schema,"failed");
    assert.equal(result.repeatable,true);assert.equal(result.inputUnchanged,true);assert.equal(result.status,"passed");
    assert.equal(result.stdoutSha256.length,2);assert.equal(new Set(result.stdoutSha256).size,1);
    assert.match(result.inputSha256,/^[a-f0-9]{64}$/u);
  }
  assert.deepEqual(manifest.reports.find(r=>r.candidate===candidate),{candidate,sha256:digest(bytes),regressionsSha256:digest(regressionBytes)});
  return report;
});
const comparison=compareReports(reports,{directory,candidateRepairAuthorized:true});
assert.deepEqual(JSON.parse(read(directory+"/comparison.json")),comparison);
assert.deepEqual(comparison.library,{cases:352,portablePassed:352,portableFailures:[],rawDifferences:["draft-2020-prefixitems-rejected"]});
assert.deepEqual(comparison.cli,{jsonCases:57,publicPassed:57,publicFailures:[]});
assert.equal(comparison.acceptance.status,"not-ready");assert.equal(comparison.acceptance.architecture,"Draft");
assert.ok(!comparison.acceptance.blockers.includes("public-branch-diagnostic-parity"));
const liveOption=process.argv.indexOf("--observations");
if(liveOption>=0) {
  const folder=process.argv[liveOption+1];assert.ok(folder);
  const head=spawnSync("git",["rev-parse","HEAD"],{cwd:repositoryRoot,encoding:"utf8"});assert.equal(head.status,0);
  const livePins={...pins,sourceRevision:head.stdout.trim(),repairRevision:head.stdout.trim()};
  const live=candidates.map((candidate,index)=>{
    const report=JSON.parse(readFileSync(path.join(folder,candidate+"-diagnostics.json")));
    assert.ok(validate(report),JSON.stringify(validate.errors));
    assert.deepEqual(reportErrors(report,catalog,livePins),[],candidate+" fresh observations");
    assert.equal(report.harnessRevision,livePins.sourceRevision);
    const current=spawnSync("git",["ls-files","evaluation/prototypes/"+candidate,"schemas"],{cwd:repositoryRoot,encoding:"utf8"});assert.equal(current.status,0);
    assert.deepEqual(report.sourceInventory.map(e=>e.path),current.stdout.trim().split("\n"));
    for(const entry of report.sourceInventory) {assert.equal(entry.sha256,digest(read(entry.path)));assert.equal(entry.sha256,digest(committed(livePins.sourceRevision,entry.path)));}
    if(!historical) assert.deepEqual(report.sourceInventory,reports[index].sourceInventory);
    assert.ok(same(report.library.results,reports[index].library.results),"fresh library replay differs");
    assert.ok(same(report.cli.results.map(r=>({id:r.id,actual:r.actual,bridgeObservation:r.bridgeObservation})),reports[index].cli.results.map(r=>({id:r.id,actual:r.actual,bridgeObservation:r.bridgeObservation}))),"fresh CLI replay differs");
    const regression=JSON.parse(readFileSync(path.join(folder,candidate+"-regressions.json")));
    const stored=JSON.parse(read(directory+"/"+candidate+"-regressions.json"));
    assert.equal(regression.candidate,candidate);assert.equal(regression.sourceRevision,livePins.sourceRevision);assert.equal(regression.harnessRevision,livePins.sourceRevision);
    assert.deepEqual(regression.commands,stored.commands);assert.equal(regression.runsPerCase,2);
    assert.ok(same(regression.results,stored.results),"fresh exact regression replay differs");
    return report;
  });
  assert.deepEqual(compareReports(live).cli,{jsonCases:57,publicPassed:57,publicFailures:[]});
  console.log("Fresh native four-candidate replays match every recorded library, CLI and supplemental regression result.");
}
console.log((historical?"Archived repair verified at its immutable source":"Current-source repair verified")+": 352 library cases unchanged; 57/57 public parity; 10 strict regressions per candidate. Architecture remains Draft/not-ready.");
