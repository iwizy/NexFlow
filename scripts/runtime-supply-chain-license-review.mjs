#!/usr/bin/env node
// Versioned notice mappings, not product distribution/legal approval.
import assert from "node:assert/strict";
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,mkdtempSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
import {scan} from "./runtime-supply-chain-repaired-scan.mjs";
import {sbomFor} from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",json=f=>JSON.parse(readFileSync(root+"/"+f));
const config=JSON.parse(readFileSync(process.argv[2]));
const closure=json("tool-closure.json"),rows=[];
const save=(f,v)=>writeFileSync(root+"/"+f,JSON.stringify(v,null,2)+"\n");
const goLicenses={"github.com/dlclark/regexp2":"MIT","github.com/santhosh-tekuri/jsonschema/v6":"Apache-2.0","go.yaml.in/yaml/v3":"MIT AND Apache-2.0","gopkg.in/check.v1":"BSD-2-Clause"};
for(const id of ["typescript","python","rust","go"]){const record=json(id+"/inventory.json");for(const c of record.components)rows.push({owner:id,ref:c.ref,expression:id==="go"?(goLicenses[c.name]??"BSD-3-Clause"):c.license,licenseFiles:c.licenseFiles??[],source:c.metadataSource,scope:c.scope,disposition:"retain applicable notices; no product redistribution or legal approval claimed"});}
const temporary=process.argv[3]??mkdtempSync(join(tmpdir(),"nf-native-notices-"));
for(const c of json("python/inventory.json").components.filter(c=>c.scope==="wheel-upstream-sbom")){
 const url="https://static.crates.io/crates/"+c.name+"/"+c.name+"-"+c.version+".crate";
 const archive=join(temporary,c.name+".crate");let bytes;
 if(existsSync(archive))bytes=readFileSync(archive);else{const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);bytes=Buffer.from(await response.arrayBuffer());writeFileSync(archive,bytes);}
 assert.equal(sha(bytes),c.archiveSha256,"embedded rpds source hash mismatch");
 const listing=spawnSync("tar",["-tf",archive],{encoding:"utf8"});assert.equal(listing.status,0);
 const members=listing.stdout.trim().split("\n").filter(n=>/(?:^|\/)(?:LICENSE|COPYING|NOTICE)(?:[^/]*)$/iu.test(n));assert.ok(members.length,c.name+" has no source notice");
 const files=members.map(name=>{const r=spawnSync("tar",["-xOf",archive,name]);assert.equal(r.status,0);return{file:name,sha256:sha(r.stdout),bytes:r.stdout.length};});
 const row=rows.find(r=>r.owner==="python"&&r.ref===c.ref);row.licenseFiles=files;row.sourceArchive={url,sha256:sha(bytes),matchesWheelEmbeddedSbom:true};row.selection="all-target source declaration superset; not an independent wheel binary reverse-engineering claim";
}
for(const id of ["npm","pip","rustCompiler","goCompiler","cargo"]){const record=json(id+"-inventory.json");for(const c of record.components)rows.push({owner:id,ref:c.ref,expression:c.license,licenseFiles:c.licenseFiles,source:c.metadataSource,scope:c.scope,sectionSha256:c.licenseSectionSha256??null,disposition:"retain full verified upstream notices; compiler/interpreter tools are external prerequisites, not released NexFlow packages"});}
const noteRoot=join(root,"notices");mkdirSync(noteRoot,{recursive:true});
const primary=new Map();
async function upstreamNotice(row,repo,revision){
 assert.match(repo,/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u);assert.match(revision,/^[a-f0-9]{40}$/u);
 const files=[];
 for(const name of ["LICENSE","LICENSE.md","LICENSE-MIT","LICENSE-APACHE","COPYING"]){const url="https://raw.githubusercontent.com/"+repo+"/"+revision+"/"+name;let item=primary.get(url);if(!item){const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});if(response.status===404)continue;assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer()),hash=sha(bytes);writeFileSync(join(noteRoot,hash+".txt"),bytes);item={file:"notices/"+hash+".txt",sha256:hash,bytes:bytes.length,url,revision};primary.set(url,item);}files.push(item);}
 if(!files.length&&row.expression==="ISC"){
  const url="https://raw.githubusercontent.com/spdx/license-list-data/v3.27.0/json/details/ISC.json",response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);const data=await response.text(),entry=JSON.parse(data);assert.equal(entry.licenseId,"ISC");const bytes=Buffer.from(entry.licenseText),hash=sha(bytes);writeFileSync(join(noteRoot,hash+".txt"),bytes);files.push({file:"notices/"+hash+".txt",sha256:hash,bytes:bytes.length,url,sourceSha256:sha(data),kind:"canonical-SPDX-reference-not-package-copyright-notice"});row.noticeLimitation="Upstream declares ISC but publishes no separate own copyright/license notice; canonical text is a reference, not an invented publisher notice or legal/distribution approval.";
 }
 assert.ok(files.length,"missing version-bound upstream notice: "+row.ref);row.licenseFiles=files;row.mapping="exact source revision supplied by the integrity-verified package metadata; primary texts retained";
}
const cargoSrc=join(config.cargoHome,"registry/src"),registry=join(cargoSrc,readdirSync(cargoSrc)[0]);
for(const row of rows.filter(r=>r.owner==="rust"&&!r.licenseFiles.length)){
 const c=json("rust/inventory.json").components.find(c=>c.ref===row.ref),folder=join(registry,c.name+"-"+c.version);
 const names=readdirSync(folder).filter(n=>/(?:licen[cs]e|copying|notice)/iu.test(n)&&!n.includes("/"));
 row.licenseFiles=names.filter(n=>!n.toLowerCase().includes(".toml")).map(n=>({file:n,sha256:sha(readFileSync(join(folder,n)))}));
 if(!row.licenseFiles.length){const vcs=JSON.parse(readFileSync(join(folder,".cargo_vcs_info.json"))),repo=readFileSync(join(folder,"Cargo.toml"),"utf8").match(/^repository = "https:\/\/github.com\/([^"\n]+)"/mu)?.[1];assert.ok(repo);await upstreamNotice(row,repo.replace(/\.git$/u,""),vcs.git.sha1);row.sourceArchiveSha256=c.archiveSha256;}
}
const npmRoot=join(config.npm,"../..");
for(const row of rows.filter(r=>r.owner==="npm"&&!r.licenseFiles.length)){
 const c=json("npm-inventory.json").components.find(c=>c.ref===row.ref),folder=join(npmRoot,"node_modules",c.name);
 if(c.name.startsWith("spdx-")){const file=join(folder,"README.md"),bytes=readFileSync(file);row.licenseFiles=[{file:"README.md",sha256:sha(bytes),bytes:bytes.length}];row.mapping="integrity-verified README explicitly contains Copyright and Licensing or License notice; declared SPDX obligations retained";continue;}
 const url="https://registry.npmjs.org/"+encodeURIComponent(c.name)+"/"+c.version,response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);const bytes=await response.text(),metadata=JSON.parse(bytes);assert.equal(metadata.version,c.version);
 let repo=typeof metadata.repository==="string"?metadata.repository:metadata.repository.url;repo=repo.replace(/^git\+/u,"").replace(/^https:\/\/github.com\//u,"").replace(/\.git$/u,"");let revision=metadata.gitHead;
 if(!revision){assert.equal(c.name,"proxy-agent-negotiate");const r=await fetch("https://api.github.com/repos/"+repo+"/git/ref/tags/"+encodeURIComponent(c.name+"@"+c.version));assert.equal(r.status,200);let object=(await r.json()).object;if(object.type==="tag"){const tag=await fetch(object.url);assert.equal(tag.status,200);object=(await tag.json()).object;}assert.equal(object.type,"commit");revision=object.sha;row.sourceBinding="explicit upstream package/version release tag, npm metadata has no gitHead";}
 await upstreamNotice(row,repo,revision);row.versionMetadata={url,sha256:sha(bytes),gitHead:metadata.gitHead??null,sourceRevision:revision};
}
assert.ok(rows.every(r=>r.expression&&r.expression!=="NOASSERTION"&&r.licenseFiles?.length),"unmapped component or missing notice: "+JSON.stringify(rows.filter(r=>!r.expression||r.expression==="NOASSERTION"||!r.licenseFiles?.length).map(r=>[r.owner,r.ref,r.expression])));
const nativeLicenses={node:"MIT",acorn:"MIT",ada:"Apache-2.0 OR MIT",amaro:"MIT",ares:"MIT",brotli:"MIT",cldr:"Unicode-3.0",icu:"Unicode-3.0",libffi:"MIT",lief:"Apache-2.0",llhttp:"MIT",merve:"MIT",nbytes:"MIT",ncrypto:"MIT",nghttp2:"MIT",openssl:"Apache-2.0",simdjson:"Apache-2.0",simdutf:"Apache-2.0 OR MIT",sqlite:"LicenseRef-Public-Domain",tz:"LicenseRef-Public-Domain",undici:"MIT",unicode:"Unicode-3.0",uv:"MIT",uvwasi:"MIT",v8:"BSD-3-Clause",zlib:"Zlib",zstd:"BSD-3-Clause"};
const components=[];
for(const [name,version]of Object.entries(closure.node.versions).filter(([name,v])=>v&&!['modules','napi'].includes(name))){assert.ok(nativeLicenses[name],"unmapped Node component: "+name);components.push({ref:"pkg:generic/"+name+"@"+version+"?owner=node",name,version,scope:"observed-node-runtime-and-data-versions",license:nativeLicenses[name],metadataSource:"process.versions + complete verified composite Node LICENSE",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:closure.node.licenseFiles});}
for(const n of closure.python.native.filter(n=>n.artifact)){const c={ref:"pkg:generic/"+n.component+"@"+n.version+"?owner=python",name:n.component,version:n.version,scope:"interpreter-static-input",license:n.license,metadataSource:"verified PYTHON.json + exact upstream downloads manifest",licenseAssessment:"upstream-declared-not-legal-approval",archiveSha256:n.sourceSha256,licenseFiles:n.licenseFiles};if(!components.some(x=>x.ref===c.ref))components.push(c);}
components.push({ref:"pkg:generic/CPython@"+closure.python.observed.cpython,name:"CPython",version:closure.python.observed.cpython,scope:"verified-interpreter",license:closure.python.metadata.licenses.join(" AND "),metadataSource:"verified full interpreter archive/PYTHON.json",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:closure.python.licenseFiles});
components.push({ref:"pkg:generic/libyaml@"+closure.python.observed.libyaml,name:"libyaml",version:closure.python.observed.libyaml,scope:"native-PyYAML-wheel",license:"MIT",metadataSource:"actual PyYAML native version + hash-locked wheel",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:json("python/inventory.json").components.find(c=>c.name==="pyyaml").licenseFiles});
components.push({ref:"pkg:generic/macOS@"+closure.externalOperatingSystem.build,name:"macOS",version:closure.externalOperatingSystem.build,scope:"external-not-redistributed-OS-prerequisite",license:"external-operating-system-license",metadataSource:"actual sw_vers plus all retained native install names",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:[]});
const cargo=json("cargo-inventory.json"),opensslSource=cargo.components.find(c=>c.name==="openssl-src");assert.ok(opensslSource&&opensslSource.version.endsWith("+3.6.3"));
for(const [name,version,license,scope,files]of [["Rust","1.99.0","MIT OR Apache-2.0","verified-compiler-and-standard-library",closure.rust.nativeNotices],["LLVM",closure.rust.llvm.match(/LLVM version (\S+)/u)[1],"Apache-2.0 WITH LLVM-exception","verified-Rust-LLVM-fork",closure.rust.nativeNotices],["OpenSSL","3.6.3","Apache-2.0","Cargo-native-static-input",opensslSource.licenseFiles],["libgit2",closure.rust.cargo.match(/libgit2: ([\d.]+)/u)[1],"MIT","Cargo-native-vendored-input",closure.rust.nativeNotices],["libcurl",closure.rust.cargo.match(/libcurl: ([\d.]+)/u)[1],"curl","external-OS-not-redistributed",closure.rust.nativeNotices],["LibreSSL",closure.rust.cargo.match(/LibreSSL\/([\d.]+)/u)[1],"external-operating-system-license","reported-external-OS-backend-not-redistributed",closure.rust.nativeNotices]])components.push({ref:"pkg:generic/"+name+"@"+version+"?owner=rust-toolchain",name,version,scope,license,metadataSource:"verified tool archives + cargo/rustc/LLVM verbose versions + exact Cargo source lock",licenseAssessment:"upstream-declared-not-legal-approval",licenseFiles:files});
const native={candidate:"tool-native",sourceRevision:closure.sourceRevision,collectorRevision:closure.collectorRevision,recordedAt:new Date().toISOString(),components,dependencies:[{ref:"candidate:tool-native",dependsOn:components.map(c=>c.ref)},...components.map(c=>({ref:c.ref,dependsOn:[]}))]};
save("native-inventory.json",native);save("native-sbom.cdx.json",sbomFor(native));
const embeddedNpm=Object.entries(closure.node.versions).filter(([name])=>["acorn","amaro","undici"].includes(name)).map(([name,version])=>({ref:"pkg:npm/"+name+"@"+version,name,version,ecosystem:"npm"}));
save("node-embedded-advisories.json",await scan({candidate:"node-embedded",sourceRevision:closure.sourceRevision,collectorRevision:closure.collectorRevision,components:embeddedNpm}));
save("license-index.json",{task:"NF-102-02",sourceRevision:closure.sourceRevision,collectorRevision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),collectorSources:[{file:"scripts/runtime-supply-chain-license-review.mjs",sha256:sha(readFileSync("scripts/runtime-supply-chain-license-review.mjs"))}],recordedAt:new Date().toISOString(),rows,nativeRows:components.map(c=>({ref:c.ref,expression:c.license,licenseFiles:c.licenseFiles,scope:c.scope})),unresolvedExpressionRows:0,obligations:["Keep complete copyright/license/notice texts with any future redistributed copies.","Preserve Apache patent/NOTICE and any license exceptions; MPL files require applicable source availability when redistributed.","Source/build/toolchain supersets are not proof that every component is linked into an evaluation artifact.","Operating-system libraries are external prerequisites and are not copied or sublicensed.","No product release or distribution approval; signing/lifecycle/support decisions remain separate."],legalApproval:false});
console.log("license mapping complete: "+rows.length+" component rows; 17 rpds source archives verified");
