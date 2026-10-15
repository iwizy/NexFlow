#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { digest, evidenceErrors, ids } from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15";
const json=f=>JSON.parse(readFileSync(f));
const source="a3dea0a3de7018e14057a9bc15307325439b500d";
const frozen=json("evaluation/fidelity/source-pins.json");
const gitBytes=(revision,file)=>{
  const r=spawnSync("git",["show",revision+":"+file],{maxBuffer:32*1024*1024});
  assert.equal(r.status,0,"missing immutable input: "+file);return r.stdout;
};
const bind=(revision,receipts,current=true)=>{
  assert.match(revision,/^[a-f0-9]{40}$/u);
  for(const r of receipts){
    assert.equal(digest(gitBytes(revision,r.file)),r.sha256,"Git input changed: "+r.file);
    if(current)assert.equal(digest(readFileSync(r.file)),r.sha256,"current input changed: "+r.file);
  }
};
function recordErrors(record,scan,bom){
  const pins={...frozen,evaluationPackageRevision:source,candidates:{[record.candidate]:{
    sourceRevision:source,publishedHead:source,pullRequest:120}}};
  // Reuse preserved generic graph/pagination checks without altering historical
  // task records or pretending current evidence was the original collection.
  return evidenceErrors({...record,task:"NF-056-11",collectorVersion:"nf-056-11-v1"},scan,bom,pins);
}
const records={};
for(const id of ids){
  const at=root+"/"+id, r=json(at+"/inventory.json"),s=json(at+"/advisories.json"),b=json(at+"/sbom.cdx.json");
  assert.equal(r.task,"NF-102-02");assert.equal(r.collectorVersion,"nf-102-02-v1");
  assert.deepEqual(recordErrors(r,s,b),[]);
  assert.equal(r.sbomSha256,digest(readFileSync(at+"/sbom.cdx.json")));
  assert.equal(r.advisoriesSha256,digest(readFileSync(at+"/advisories.json")));
  bind(source,r.sourceManifest,false);bind(r.collectorRevision,r.collectorSources);
  for(const input of r.sourceManifest.filter(f=>!f.file.endsWith("/README.md")))
    assert.equal(digest(gitBytes(r.baselineCandidateSource,input.file)),input.sha256,"qualified candidate drift");
  records[id]=r;
}
const closure=json(root+"/closure.json"), license=json(root+"/licenses.json"),review=json(root+"/static-review.json");
function closureErrors(r){
  const errors=[];
  if(r.sourceRevision!==source||r.outcome!=="not-ready")errors.push("identity/non-approval");
  if(r.target!=="macos/arm64"||r.cohort?.classification!=="supplemental-not-frozen-target")errors.push("target");
  if(r.signing!=="not-tested-no-signing-authority-used"||!r.interpreterProvenance?.startsWith("unavailable-"))errors.push("provenance limit");
  if(r.runs?.length!==2)errors.push("two independent builds");
  for(const id of ids){
    const a=r.runs?.[0]?.artifacts?.[id],b=r.runs?.[1]?.artifacts?.[id];
    if(!a?.length||a.length!==b?.length){errors.push("missing artifact set");continue;}
    if(a.some(x=>!x.file||!/^[a-f0-9]{64}$/u.test(x.sha256)))errors.push("receipt");
    const changed=a.filter((x,i)=>x.sha256!==b[i].sha256).map(x=>x.file);
    if(JSON.stringify(changed)!==JSON.stringify(r.repeatability?.[id]?.differentFiles))errors.push("artifact divergence");
    if(r.repeatability?.[id]?.status!==(changed.length?"different-bytes":"byte-identical"))errors.push("repeatability verdict");
  }
  return errors;
}
assert.deepEqual(closureErrors(closure),[]);
bind(closure.collectorRevision,closure.collectorSources);bind(source,closure.schemaInputs);
assert.ok(closure.native.length>0&&Object.values(closure.tools).every(t=>t.files.length>0));
assert.equal(closure.tools.rust.archivePayloadComparison.length,54);
assert.ok(closure.tools.rust.archivePayloadComparison.every(x=>x.matched));
assert.equal(license.sourceRevision,source);assert.equal(license.outcome,"partial-not-approved");
bind(license.collectorRevision,license.collectorSources);
const refs=ids.flatMap(id=>records[id].components.map(c=>id+":"+c.ref)).sort();
assert.deepEqual(license.rows.map(r=>r.candidate+":"+r.ref).sort(),refs);
assert.equal(records.go.components.length,8);assert.equal(records.go.components.filter(c=>c.lockCoverage!=="go.sum").length,3);
assert.equal(records.go.standardLibraryPackages.includes("html/template"),false);
const scans=[...ids.map(id=>json(root+"/"+id+"/advisories.json")),json(root+"/node-tooling-advisories.json"),json(root+"/go-toolchain-advisories.json")];
const inputs=scans.flatMap(s=>s.advisories.map(a=>s.candidate+":"+a.id)).sort();
assert.deepEqual(review.results.map(r=>r.inputId).sort(),inputs);
assert.equal(review.confirmed,0);assert.equal(review.needsReview,53);assert.equal(review.notActionable,9);
assert.equal(review.results.filter(r=>r.verdict==="needs_review").length,review.needsReview);
assert.equal(review.results.filter(r=>r.verdict==="not_actionable").length,review.notActionable);
assert.deepEqual(review.results.filter(r=>r.verdict==="needs_review").map(r=>r.rank.rank).sort((a,b)=>a-b),Array.from({length:53},(_,i)=>i+1));
for(const r of review.results)assert.ok(r.counterevidence.length&&r.proofGaps.length&&r.nextStep);
const tooling=json(root+"/node-tooling-inventory.json"), toolScan=scans.at(-2);
assert.equal(tooling.components.length,toolScan.queryCount);
assert.ok(tooling.components.every(c=>toolScan.queries.some(q=>q.refs.includes(c.ref))));
const validation=json(root+"/sbom-validation.json");
assert.ok(validation.results.length===4&&validation.results.every(r=>
  r.passed&&r.sbomSha256===digest(readFileSync(root+"/"+r.candidate+"/sbom.cdx.json"))));
const copy=x=>JSON.parse(JSON.stringify(x));
for(const mutate of [r=>r.sourceRevision="0".repeat(40),r=>r.outcome="passed",r=>r.target="linux/amd64",
  r=>r.signing="passed",r=>r.runs.pop(),r=>r.repeatability.rust.status="byte-identical",r=>r.runs[0].artifacts.go=[],r=>r.runs[0].artifacts.python[0].sha256="invalid"]){
  const altered=copy(closure);mutate(altered);assert.ok(closureErrors(altered).length,"fail-open evidence consumer");
}
console.log("NF-102-02: four current source-bound bundles, tool/native/license receipts, 62 static reviews and 8 rejection controls verified; acceptance remains blocked.");
