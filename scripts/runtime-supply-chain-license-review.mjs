#!/usr/bin/env node
// Versioned notice mappings, not product distribution/legal approval.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
import {scan} from "./runtime-supply-chain-repaired-scan.mjs";
import {sbomFor} from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",json=f=>JSON.parse(readFileSync(root+"/"+f));
const closure=json("tool-closure.json"),rows=[];
const save=(f,v)=>writeFileSync(root+"/"+f,JSON.stringify(v,null,2)+"\n");
const goLicenses={"github.com/dlclark/regexp2":"MIT","github.com/santhosh-tekuri/jsonschema/v6":"Apache-2.0","go.yaml.in/yaml/v3":"MIT AND Apache-2.0","gopkg.in/check.v1":"BSD-2-Clause"};
for(const id of ["typescript","python","rust","go"]){const record=json(id+"/inventory.json");for(const c of record.components)rows.push({owner:id,ref:c.ref,expression:id==="go"?(goLicenses[c.name]??"BSD-3-Clause"):c.license,licenseFiles:c.licenseFiles??[],source:c.metadataSource,scope:c.scope,disposition:"retain applicable notices; no product redistribution or legal approval claimed"});}
const temporary=mkdtempSync(join(tmpdir(),"nf-native-notices-"));
for(const c of json("python/inventory.json").components.filter(c=>c.scope==="wheel-upstream-sbom")){
 const url="https://static.crates.io/crates/"+c.name+"/"+c.name+"-"+c.version+".crate";
 const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(sha(bytes),c.archiveSha256,"embedded rpds source hash mismatch");
 const archive=join(temporary,c.name+".crate");writeFileSync(archive,bytes);
 const listing=spawnSync("tar",["-tf",archive],{encoding:"utf8"});assert.equal(listing.status,0);
 const members=listing.stdout.trim().split("\n").filter(n=>/(?:^|\/)(?:LICENSE|COPYING|NOTICE)(?:[^/]*)$/iu.test(n));assert.ok(members.length,c.name+" has no source notice");
 const files=members.map(name=>{const r=spawnSync("tar",["-xOf",archive,name]);assert.equal(r.status,0);return{file:name,sha256:sha(r.stdout),bytes:r.stdout.length};});
 const row=rows.find(r=>r.owner==="python"&&r.ref===c.ref);row.licenseFiles=files;row.sourceArchive={url,sha256:sha(bytes),matchesWheelEmbeddedSbom:true};row.selection="all-target source declaration superset; not an independent wheel binary reverse-engineering claim";
}
for(const id of ["npm","pip","rustCompiler","goCompiler"]){const record=json(id+"-inventory.json");for(const c of record.components)rows.push({owner:id,ref:c.ref,expression:c.license,licenseFiles:c.licenseFiles,source:c.metadataSource,scope:c.scope,sectionSha256:c.licenseSectionSha256??null,disposition:"retain full verified upstream notices; compiler/interpreter tools are external prerequisites, not released NexFlow packages"});}
assert.ok(rows.every(r=>r.expression&&r.expression!=="NOASSERTION"&&r.licenseFiles?.length),"unmapped component or missing notice");
const nativeLicenses={node:"MIT",acorn:"MIT",ada:"Apache-2.0 OR MIT",amaro:"MIT",ares:"MIT",brotli:"MIT",cldr:"Unicode-3.0",icu:"Unicode-3.0",libffi:"MIT",lief:"Apache-2.0",llhttp:"MIT",merve:"MIT",nbytes:"MIT",ncrypto:"MIT",nghttp2:"MIT",openssl:"Apache-2.0",simdjson:"Apache-2.0",simdutf:"Apache-2.0 OR MIT",sqlite:"LicenseRef-Public-Domain",tz:"LicenseRef-Public-Domain",undici:"MIT",unicode:"Unicode-3.0",uv:"MIT",uvwasi:"MIT",v8:"BSD-3-Clause",zlib:"Zlib",zstd:"BSD-3-Clause"};
const components=[];
for(const [name,version]of Object.entries(closure.node.versions).filter(([name,v])=>v&&!['modules','napi'].includes(name))){assert.ok(nativeLicenses[name],"unmapped Node component: "+name);components.push({ref:"pkg:generic/"+name+"@"+version+"?owner=node",name,version,scope:"observed-node-runtime-and-data-versions",license:nativeLicenses[name],metadataSource:"process.versions + complete verified composite Node LICENSE",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:closure.node.licenseFiles});}
for(const n of closure.python.native.filter(n=>n.artifact)){const c={ref:"pkg:generic/"+n.component+"@"+n.version+"?owner=python",name:n.component,version:n.version,scope:"interpreter-static-input",license:n.license,metadataSource:"verified PYTHON.json + exact upstream downloads manifest",licenseAssessment:"upstream-declared-not-legal-approval",archiveSha256:n.sourceSha256,licenseFiles:n.licenseFiles};if(!components.some(x=>x.ref===c.ref))components.push(c);}
components.push({ref:"pkg:generic/CPython@"+closure.python.observed.cpython,name:"CPython",version:closure.python.observed.cpython,scope:"verified-interpreter",license:closure.python.metadata.licenses.join(" AND "),metadataSource:"verified full interpreter archive/PYTHON.json",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:closure.python.licenseFiles});
components.push({ref:"pkg:generic/libyaml@"+closure.python.observed.libyaml,name:"libyaml",version:closure.python.observed.libyaml,scope:"native-PyYAML-wheel",license:"MIT",metadataSource:"actual PyYAML native version + hash-locked wheel",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:json("python/inventory.json").components.find(c=>c.name==="pyyaml").licenseFiles});
components.push({ref:"pkg:generic/macOS@"+closure.externalOperatingSystem.build,name:"macOS",version:closure.externalOperatingSystem.build,scope:"external-not-redistributed-OS-prerequisite",license:"external-operating-system-license",metadataSource:"actual sw_vers plus all retained native install names",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:[]});
const native={candidate:"tool-native",sourceRevision:closure.sourceRevision,collectorRevision:closure.collectorRevision,recordedAt:new Date().toISOString(),components,dependencies:[{ref:"candidate:tool-native",dependsOn:components.map(c=>c.ref)},...components.map(c=>({ref:c.ref,dependsOn:[]}))]};
save("native-inventory.json",native);save("native-sbom.cdx.json",sbomFor(native));
const embeddedNpm=Object.entries(closure.node.versions).filter(([name])=>["acorn","amaro","undici"].includes(name)).map(([name,version])=>({ref:"pkg:npm/"+name+"@"+version,name,version,ecosystem:"npm"}));
save("node-embedded-advisories.json",await scan({candidate:"node-embedded",sourceRevision:closure.sourceRevision,collectorRevision:closure.collectorRevision,components:embeddedNpm}));
save("license-index.json",{task:"NF-102-02",sourceRevision:closure.sourceRevision,recordedAt:new Date().toISOString(),rows,nativeRows:components.map(c=>({ref:c.ref,expression:c.license,licenseFiles:c.licenseFiles,scope:c.scope})),unresolvedExpressionRows:0,obligations:["Keep complete copyright/license/notice texts with any future redistributed copies.","Preserve Apache patent/NOTICE and any license exceptions; MPL files require applicable source availability when redistributed.","Source/build/toolchain supersets are not proof that every component is linked into an evaluation artifact.","Operating-system libraries are external prerequisites and are not copied or sublicensed.","No product release or distribution approval; signing/lifecycle/support decisions remain separate."],legalApproval:false});
console.log("license mapping complete: "+rows.length+" component rows; 17 rpds source archives verified");
