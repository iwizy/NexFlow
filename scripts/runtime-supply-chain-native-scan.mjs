#!/usr/bin/env node
// Exact-version CPE matching is a review input, not binary reachability proof.
import assert from "node:assert/strict";
import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",closure=JSON.parse(readFileSync(root+"/tool-closure.json"));
const names={openssl:["openssl","openssl"],zlib:["zlib","zlib"],sqlite:["sqlite","sqlite"],brotli:["google","brotli"],ares:["c-ares_project","c-ares"],nghttp2:["nghttp2","nghttp2"],uv:["libuv","libuv"],icu:["icu-project","international_components_for_unicode"],v8:["google","v8"],zstd:["facebook","zstandard"],libyaml:["yaml","libyaml"],cpython:["python","python"],bzip2:["bzip","bzip2"],expat:["libexpat_project","libexpat"],libffi:["libffi_project","libffi"],mpdecimal:["bytereef","mpdecimal"],xz:["tukaani","xz"],uuid:["libuuid_project","libuuid"],tcl:["tcl","tcl"],tk:["tcl","tk"],llvm:["llvm","llvm"],libgit2:["libgit2","libgit2"],libcurl:["haxx","curl"]};
const requests=[];
const add=(owner,name,version,source)=>{const c=names[name.startsWith("openssl-")?"openssl":name];if(c){assert.ok(version);requests.push({owner,name,version:version.replace(/-node\..*$/u,""),cpeName:"cpe:2.3:a:"+c.join(":")+":"+version.replace(/-node\..*$/u,"")+":*:*:*:*:*:*:*",versionEvidence:source});}};
for(const [name,version]of Object.entries(closure.node.versions))add("node",name,version,"observed process.versions; Node backports may differ from upstream CPE");
add("python","cpython",closure.python.observed.cpython,"observed interpreter plus verified archive");add("python-wheel","libyaml",closure.python.observed.libyaml,"actual PyYAML native get_version_string");
for(const n of closure.python.native.filter(n=>n.artifact))add("python",n.component,n.version.replace(/\.0$/u,m=>n.component==="sqlite"?"":m),"verified PYTHON.json static input + exact upstream build manifest + archive hash");
add("external-os","zlib",closure.python.observed.zlib,"observed system zlib version; OS backports unknown");
add("rust-toolchain","llvm",closure.rust.llvm.match(/LLVM version (\d+\.\d+\.\d+)/u)[1],"Rust fork of LLVM; upstream version match requires patch review");
for(const [name,pattern]of [["openssl",/ssl: OpenSSL ([\d.]+)/u],["libgit2",/libgit2: ([\d.]+)/u],["libcurl",/libcurl: ([\d.]+)/u]]){const version=closure.rust.cargo.match(pattern)?.[1];if(version)add("cargo",name,version,"observed cargo -Vv native linkage");}
requests.push({owner:"external-os",name:"macOS",version:closure.externalOperatingSystem.os,cpeName:"cpe:2.3:o:apple:macos:"+closure.externalOperatingSystem.os+":*:*:*:*:*:*:*",versionEvidence:"actual sw_vers version/build, supplemental native cohort"});
const output=root+"/native-advisories.json";
const previous=existsSync(output)?JSON.parse(readFileSync(output)):null;
const rows=[],attempts=previous?.attempts??[];
const save=()=>writeFileSync(output,JSON.stringify({task:"NF-102-02",sourceRevision:closure.sourceRevision,recordedAt:new Date().toISOString(),api:"NVD CVE API 2.0",queryCount:rows.length,expectedQueries:requests.length,queries:rows,attempts,scope:"manual exact-version vulnerable CPE candidates; no-match is not certification; upstream/fork/OS backports require applicability review",unsupported:Object.keys(closure.node.versions).filter(n=>!names[n]),unsupportedMeaning:"ABI/data versions and libraries without a reviewed CPE mapping retained in versioned closure; not silently treated as scanned or passed"},null,2)+"\n");
for(const query of requests){const pages=[];let startIndex=0,total=1;
 const retained=previous?.queries.find(q=>q.owner===query.owner&&q.cpeName===query.cpeName&&q.pages.every(p=>new URL(p.url).searchParams.has("isVulnerable")));
 if(retained){rows.push(retained);save();continue;}
 while(startIndex<total){const url=new URL("https://services.nvd.nist.gov/rest/json/cves/2.0");url.searchParams.set("cpeName",query.cpeName);url.searchParams.set("isVulnerable","");url.searchParams.set("startIndex",String(startIndex));
  await new Promise(resolve=>setTimeout(resolve,6500));
  let response;
  for(let attempt=0;attempt<3;attempt++){response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});if(response.status!==429)break;attempts.push({query:query.cpeName,status:429,at:new Date().toISOString()});save();await new Promise(resolve=>setTimeout(resolve,31000));}
  assert.equal(response.status,200,"native advisory service unavailable: "+query.name);
  const bytes=await response.text(),value=JSON.parse(bytes);assert.equal(value.format,"NVD_CVE");assert.equal(value.startIndex,startIndex);total=value.totalResults;assert.ok(total<100000);pages.push({url:url.href,responseSha256:sha(bytes),response:value});if(!total)break;assert.ok(value.resultsPerPage>0);startIndex+=value.resultsPerPage;
 }
 rows.push({...query,status:"query-completed",pages,ids:[...new Set(pages.flatMap(p=>p.response.vulnerabilities.map(v=>v.cve.id)))].sort()});save();console.log(query.owner+"/"+query.name+" "+query.version+": "+rows.at(-1).ids.length+" CPE review inputs");
}
save();
