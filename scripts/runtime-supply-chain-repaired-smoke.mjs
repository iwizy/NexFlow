#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {digest,evidenceErrors,ids,sbomFor} from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",json=f=>JSON.parse(readFileSync(root+"/"+f));
const qualification=JSON.parse(readFileSync("evaluation/qualification/supply-chain-repair/manifest.json")),source=qualification.sourceRevision;
const frozen=JSON.parse(readFileSync("evaluation/fidelity/source-pins.json")),tools=JSON.parse(readFileSync("evaluation/repairs/supply-chain/toolchains.json"));
const blob=(revision,file)=>{const p=spawnSync("git",["show",revision+":"+file],{maxBuffer:64*1024*1024});assert.equal(p.status,0,file);return p.stdout;};
const bind=(revision,files,current=false)=>{for(const f of files){assert.equal(digest(blob(revision,f.file)),f.sha256,f.file);if(current)assert.equal(digest(readFileSync(f.file)),f.sha256,"current input drift: "+f.file);}};
for(const [file,hash]of Object.entries(tools.locks))assert.equal(digest(readFileSync(file)),hash);
for(const id of ids){
 const r=json(id+"/inventory.json"),s=json(id+"/advisories.json"),b=json(id+"/sbom.cdx.json");
 assert.equal(r.sourceRevision,source);assert.equal(r.collectorVersion,"nf-102-02-repair-v1");
 const pins={...frozen,stdlibVersion:tools.go,reproducibleBuild:"two-clean-roots-byte-identical",evaluationPackageRevision:source,candidates:{[id]:{sourceRevision:source,publishedHead:source,pullRequest:null}}};
 assert.deepEqual(evidenceErrors({...r,task:"NF-056-11",collectorVersion:"nf-056-11-v1"},s,b,pins),[]);
 bind(source,r.sourceManifest,true);bind(r.collectorRevision,r.collectorSources);bind(source,r.locks,true);
 assert.equal(r.sbomSha256,digest(readFileSync(root+"/"+id+"/sbom.cdx.json")));assert.equal(r.advisoriesSha256,digest(readFileSync(root+"/"+id+"/advisories.json")));
 assert.equal(s.advisoryCount,0,"candidate version matches require renewed disposition");
 if(id==="go")assert.ok(r.components.every(c=>c.lockCoverage==="go.sum"));
}
const closure=json("tool-closure.json"),rebuild=json("rebuild.json"),licenses=json("license-index.json"),review=json("disposition.json");
for(const r of [closure,rebuild,licenses,review])assert.equal(r.sourceRevision,source);
assert.equal(closure.node.versions.node,tools.node);assert.equal(closure.node.versions.openssl,"3.5.9");assert.equal(closure.python.observed.cpython,tools.python);assert.equal(closure.python.observed.libyaml,"0.2.5");
assert.ok(closure.provisioning.receipts.some(r=>r.tool==="python"&&r.sha256.length===64));assert.ok(closure.python.buildMetadata.sha256.length===64);
assert.ok(closure.python.native.every(n=>n.version&&n.selection));
for(const file of closure.tools.python.files.filter(f=>/\.(so|dylib)$/u.test(f.file)&&f.file.startsWith("install/lib/")))assert.equal(closure.nativeLinking.find(n=>n.file==="python/"+file.file)?.sha256,file.sha256,"missing native regular-file/symlink receipt");
assert.ok(closure.nativeLinking.some(n=>n.file==="rust/lib/rustlib/aarch64-apple-darwin/bin/rust-objcopy"));
assert.equal(closure.externalOperatingSystem.redistributed,false);assert.equal(closure.signing,"not-tested-no-signing-authority-used");
for(const id of ids){const a=rebuild.runs[0].artifacts[id],b=rebuild.runs[1].artifacts[id];assert.ok(a.length);assert.deepEqual(a,b,id+" clean-root byte drift");assert.equal(rebuild.repeatability[id].status,"byte-identical");const r=json(id+"/inventory.json");assert.equal(r.rebuildSha256,digest(readFileSync(root+"/rebuild.json")));for(const artifact of r.artifacts)assert.equal(a.find(item=>item.file===artifact.file)?.sha256,artifact.sha256);}
const installation=json("installation.json");assert.equal(installation.baseToolClosureSha256,digest(readFileSync(root+"/tool-closure.json")));assert.equal(installation.binaryPayloadModified,false);assert.equal(installation.globalInstallationModified,false);assert.equal(installation.verification.exitCode,0);bind(installation.collectorRevision,installation.collectorSources);
assert.equal(rebuild.cohort.classification,"supplemental-not-frozen-target");assert.equal(rebuild.architectureAccepted,false);
const allComponents=[];
for(const id of ["npm","pip","rustCompiler","goCompiler","cargo"]){
 const r=json(id+"-inventory.json"),b=json(id+"-sbom.cdx.json"),s=json(id+"-advisories.json");assert.equal(r.sourceRevision,source);assert.deepEqual(b,sbomFor(r));
 if(r.scanReuse){assert.equal(r.scanReuse.file,id+"-advisories.json");assert.equal(r.scanReuse.sha256,digest(readFileSync(root+"/"+r.scanReuse.file)));assert.equal(s.sourceRevision,source);assert.equal(s.queryCount,new Set(r.components.map(c=>JSON.stringify([c.ecosystem,c.name,c.version]))).size);}
 assert.equal(new Set(r.components.map(c=>c.ref)).size,r.components.length,"duplicate tool SBOM refs");
 for(const c of r.components){assert.ok(licenses.rows.find(row=>row.owner===id&&row.ref===c.ref)?.licenseFiles.length);assert.ok(s.queries.some(q=>q.query.package.name===c.name&&q.query.version===c.version&&q.refs.includes(c.ref)));}
 assert.deepEqual(s.advisories.map(a=>a.id).sort(),[...new Set(s.queries.flatMap(q=>q.matches.map(m=>m.id)))].sort());
 allComponents.push(...r.components.map(c=>id+":"+c.ref));
 if(id==="npm")assert.equal(s.advisoryCount,0);
}
assert.equal(licenses.unresolvedExpressionRows,0);assert.equal(licenses.legalApproval,false);assert.ok(licenses.rows.every(r=>r.expression&&r.expression!=="NOASSERTION"&&r.licenseFiles.length));
const expected=[...allComponents,...ids.flatMap(id=>json(id+"/inventory.json").components.map(c=>id+":"+c.ref))].sort();assert.deepEqual(licenses.rows.map(r=>r.owner+":"+r.ref).sort(),expected);
const native=json("native-inventory.json");assert.equal(native.sourceRevision,source);assert.deepEqual(json("native-sbom.cdx.json"),sbomFor(native));
const sbomValidation=json("sbom-validation.json");assert.equal(sbomValidation.results.length,10);bind(sbomValidation.collectorRevision,sbomValidation.collectorSources);for(const r of sbomValidation.results)assert.ok(r.passed&&r.sbomSha256===digest(readFileSync(root+"/"+r.file)));
const scans=["npm","pip","rustCompiler","goCompiler","cargo"].map(id=>[id,json(id+"-advisories.json")]);
const expectedReviews=scans.flatMap(([id,s])=>s.advisories.map(a=>id+":"+a.id)).sort();
assert.deepEqual(review.current.map(r=>r.inputId).sort(),expectedReviews);assert.ok(review.current.every(r=>r.verdict&&r.evidence.length&&r.limits.length));
const old=json("../2026-10-15/static-review.json");assert.deepEqual(review.previous.map(r=>r.inputId).sort(),old.results.map(r=>r.inputId).sort());assert.ok(review.previous.every(r=>r.disposition&&r.reason));
const nvd=json("native-advisories.json");assert.equal(nvd.queryCount,nvd.expectedQueries);assert.equal(nvd.sourceRevision,source);
for(const q of nvd.queries){assert.equal(q.status,"query-completed");assert.ok(q.pages.length);assert.deepEqual(q.ids,[...new Set(q.pages.flatMap(p=>p.response.vulnerabilities.map(v=>v.cve.id)))].sort());}
assert.deepEqual(review.native.map(r=>r.inputId).sort(),nvd.queries.flatMap(q=>q.ids.map(id=>q.owner+":"+q.name+":"+id)).sort());
const result=json("completion.json");assert.equal(result.task,"NF-102-02");assert.equal(result.sourceRevision,source);assert.equal(result.taskStatus,"completed");assert.deepEqual(result.originalCriteria.map(c=>c.status),["passed","passed","passed"]);
assert.equal(result.architectureAccepted,false);assert.equal(result.technicalAcceptanceRequirementsWaived,false);assert.deepEqual(result.remainingCards,["NF-102-03","NF-102-04","NF-102-05","NF-102-06"]);
assert.ok(!/\/Users\/|\/private\/|\/var\/folders\//u.test(JSON.stringify([closure,rebuild,licenses,review,result])));
console.log("NF-102-02 current candidate/tool/native/license/provenance evidence verified; architecture remains Draft, signing and target lifecycle remain separate.");
