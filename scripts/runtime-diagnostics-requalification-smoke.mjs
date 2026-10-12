#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { baseline, repositoryRoot, digest, compareOutput } from "./lib/runtime-evaluation.mjs";
import { same, canonical, libraryObservation, portableDiagnostic, schemaProjection, publicErrors, reportErrors, candidates } from "./lib/diagnostic-requalification.mjs";
import { compareReports } from "./runtime-diagnostics-comparison.mjs";
import Ajv2020 from "ajv/dist/2020.js";
const read = file => readFileSync(new URL("../"+file,import.meta.url));
const catalog = JSON.parse(read("evaluation/library-cases.json"));
const validateReport=new Ajv2020({allErrors:true,strict:false}).compile(JSON.parse(read("evaluation/requalification/validation-diagnostics/report.schema.json")));
const pins = {sourceRevision:"e1b7d65d86194b0848c219be76010f7f7460fa2b",repairRevision:"9e13a54311735a36398eb89c4a39ff2949998998",specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(read("evaluation/library-cases.json"))};
assert.ok(same({b:1,a:[2,1]},{a:[2,1],b:1}));
assert.ok(!same([2,1],[1,2]));
const raw={code:"NF-SCHEMA",category:"items",instancePath:"",nativeDiagnostic:{category:"falseSchema",instancePath:"/1"}};
const observed=libraryObservation("local-schema",raw);
assert.deepEqual(observed.nativeDetails,raw.nativeDiagnostic);
assert.equal(observed.severity,null);
assert.equal(observed.meaning,"local-schema:NF-SCHEMA:items");
assert.equal(portableDiagnostic(observed).nativeDetails,undefined);
assert.deepEqual(schemaProjection({code:"NF-SCHEMA",category:"required",instancePath:"/project",missingProperty:"displayName"},"project.yaml","Project"),
  {code:"NF-SCHEMA",file:"project.yaml",kind:"Project",severity:"error",keyword:"required",path:"/project/displayName"});
const output={formatVersion:"0.4-draft",tool:{name:"fixture",version:"unreleased"},supportedSpecVersions:["0.1"],command:"validate",success:false,exitCode:1,inputMode:"directory-project",checks:{discovery:"passed",schema:"failed",semantic:"not-run",coreProfile:"not-run",extensionProfiles:"not-run"},executionAuthorized:false,truncated:false,result:null,
  diagnostics:[{severity:"error",code:"NF-SCHEMA",message:"fixed",file:"project.yaml",kind:"Project",path:"/project/displayName",keyword:"required",related:[]}]};
assert.deepEqual(publicErrors(output,1,"",JSON.stringify(output)+"\n"),[]);
for(const mutate of [o=>o.diagnostics[0].nativeDiagnostic={},o=>o.diagnostics[0].file="/private/value",o=>o.success=true,o=>o.result={},o=>o.checks.semantic="passed"]) {
  const copy=structuredClone(output); mutate(copy); assert.ok(publicErrors(copy,1,"",JSON.stringify(copy)+"\n").length);
}
const unordered=structuredClone(output); unordered.diagnostics.push({...unordered.diagnostics[0],path:"/a"});
assert.ok(publicErrors(unordered,1,"",JSON.stringify(unordered)+"\n").includes("unordered-public-diagnostics"));
assert.ok(publicErrors(output,1,"debug",JSON.stringify(output)+"\n").includes("invalid-json-transport"));
assert.ok(publicErrors(output,1,"",JSON.stringify(output)+"\n",["fixed"]).includes("sensitive-output"));

const reports=[];
if(process.argv.includes("--contract-only")) { console.log("Observation contract negative tests passed."); process.exit(0); }
for(const candidate of candidates) {
  const file="evaluation/requalification/validation-diagnostics/"+candidate+".json";
  if(!existsSync(new URL("../"+file,import.meta.url))) continue; // First collector-only commit has no observations yet.
  const report=JSON.parse(read(file)); reports.push(report);
  assert.ok(validateReport(report),JSON.stringify(validateReport.errors));
  assert.deepEqual(reportErrors(report,catalog,pins),[],candidate+" report");
  const inventory=spawnSync("git",["ls-files","evaluation/prototypes/"+candidate,"schemas"],{cwd:repositoryRoot,encoding:"utf8"});
  assert.equal(inventory.status,0); assert.deepEqual(report.sourceInventory.map(e=>e.path),inventory.stdout.trim().split("\n"),"complete candidate/lock/schema inventory required");
  for(const file of ["scripts/runtime-diagnostics-requalify-run.mjs","scripts/lib/diagnostic-requalification.mjs","scripts/lib/evaluation-library.mjs","scripts/lib/runtime-evaluation.mjs","evaluation/command-result.schema.json","evaluation/baseline.json","evaluation/library-cases.json"]) {
    const p=spawnSync("git",["show",report.harnessRevision+":"+file],{cwd:repositoryRoot,maxBuffer:16*1024*1024});
    assert.equal(p.status,0); assert.equal(digest(p.stdout),digest(read(file)),"collector binding changed");
  }
  for(const entry of report.sourceInventory) {
    assert.equal(digest(read(entry.path)),entry.sha256,"candidate source changed after observation");
    for(const revision of [pins.sourceRevision,pins.repairRevision]) {
      const p=spawnSync("git",["show",revision+":"+entry.path],{cwd:repositoryRoot,maxBuffer:8*1024*1024});
      assert.equal(p.status,0); assert.equal(digest(p.stdout),entry.sha256);
    }
  }
  for(const result of report.cli.results) {
    assert.equal(new Set(result.stdoutSha256).size,1); assert.equal(new Set(result.stderrSha256).size,1);
    if(!result.id.endsWith("-text")) {
      assert.deepEqual(publicErrors(result.actual,result.actual.exitCode,"",JSON.stringify(result.actual)+"\n"),[],result.id);
      if(result.expected) assert.deepEqual(compareOutput({expected:result.expected},result.actual,result.actual.exitCode,""),[],result.id);
    }
  }
  const missing=structuredClone(report); missing.library.results.pop(); assert.ok(reportErrors(missing,catalog,pins).length);
  const forged=structuredClone(report); forged.library.results[0].actual.valid=!forged.library.results[0].actual.valid; assert.ok(reportErrors(forged,catalog,pins).includes("library-failure"));
  const inflated=structuredClone(report); inflated.limitations.fullProjectSemanticConformance="passed"; assert.ok(reportErrors(inflated,catalog,pins).includes("inflated-qualification"));
}
if(reports.length) {
  assert.equal(reports.length,4,"all four reports are mandatory together");
  const views=reports.map(r=>r.library.results.map(x=>({id:x.id,valid:x.actual.valid,diagnostics:x.observations.map(portableDiagnostic)})));
  for(const view of views) assert.ok(same(view,views[0]),"portable library diagnostic mismatch");
  const nativeDifferences=reports[0].library.results.filter((x,i)=>reports.some(r=>!same(x.actual,r.library.results[i].actual))).map(x=>x.id);
  assert.deepEqual(nativeDifferences,["draft-2020-prefixitems-rejected"],"raw differences must be acknowledged, not silently normalized away");
  const comparison=JSON.parse(read("evaluation/requalification/validation-diagnostics/comparison.json"));
  const {reportHashes,...stored}=comparison;
  assert.deepEqual(stored,compareReports(reports),"comparison must be derived from complete observations");
  assert.deepEqual(reportHashes,reports.map(r=>({candidate:r.candidate,sha256:digest(read("evaluation/requalification/validation-diagnostics/"+r.candidate+".json"))})));
  assert.deepEqual(comparison.cli.publicFailures.map(f=>f.id),["diagnostic-limit"],"retain the actual public parity failure");
  assert.equal(comparison.acceptance.status,"not-ready");
}
console.log("Evidence integrity passed; retained public diagnostic parity failure: diagnostic-limit. Qualification remains not-ready.");
