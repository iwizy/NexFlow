#!/usr/bin/env node
// Forward review of observed evidence; never a product architecture acceptance.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",json=f=>JSON.parse(readFileSync(root+"/"+f));
const source=json("typescript/inventory.json").sourceRevision,collectorRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
const tools=["npm","pip","rustCompiler","goCompiler","cargo"],old=JSON.parse(readFileSync("evaluation/supply-chain/2026-10-15/static-review.json"));
const current=[];
for(const id of tools){const scan=json(id+"-advisories.json");for(const advisory of scan.advisories){
 const packages=scan.queries.filter(q=>q.matches.some(m=>m.id===advisory.id)).map(q=>q.query.package.name+"@"+q.query.version);
 const pip=id==="pip",compiler=["rustCompiler","cargo"].includes(id),go=id==="goCompiler";
 current.push({inputId:id+":"+advisory.id,advisory:advisory.id,aliases:advisory.aliases,packages,verdict:pip?"not-actionable-in-local-only-provisioner":compiler?"reviewed-upstream-source-superset-offline-only":go?"not-actionable-in-fixed-offline-compiler-recipe":"unproven",evidence:pip?[
  "Runtime virtualenv has exactly nine locked distributions, no pip/setuptools/wheel/build.",
  "Pip receives only a validated local wheelhouse, exact-name/version/hash lock, no-index and wheel-only options; config/environment are isolated.",
  "Matched setuptools vendor is pkg_resources only; affected package_index/sdist/FileList implementations are absent.",
  "CacheControl calls msgpack.loads with a new pure-Python Unpacker, not reuse of native unpacker after failure."
 ]:compiler?[
  "COPYRIGHT compiler/stdlib and exact Cargo source lock are declared all-target/dev supersets, not a target binary call graph.",
  "Selected Rust candidate dependency graph is independently scanned with zero exact-version matches.",
  "Only fixed reviewed sources/locks are compiled; Cargo metadata/build/test use offline/frozen with verified preprovisioned cache, no git or network retrieval."
 ]:[
  "Full shipped Go compiler vendor sources are separate from the eight candidate modules and actual imported standard-library packages.",
  "Candidate and stdlib 1.27.2 exact-version queries have no matches.",
  "Fixed-input build uses local toolchain, readonly modules, disabled proxy/sumdb/auth/config and CGO=0; no runtime/provider retrieval."
 ],limits:["No dynamic exploit claim or general-purpose toolchain security certification.","Reassess if sources, flags, online provisioning, supported APIs or target change.","Upstream maintenance/advisory declarations and aliases retained; not all records describe exploitable vulnerabilities."]});
}}
const previous=old.results.map(r=>({inputId:r.inputId,oldVerdict:r.verdict,disposition:"resolved-for-current-evaluation-scope",reason:r.inputId.startsWith("node-tooling:")?"Runtime-only Node26 excludes old bundled npm/Corepack; independently hydrated repaired npm graph has zero version matches.":r.inputId.startsWith("python:")?"Removed packaging/build graph; nine runtime packages have zero matches, retained local-only pip vendor matches are separately reviewed above.":"Candidate/compiler/std version pins updated; current candidate Go graph and stdlib query have zero matches; compiler vendor-source matches retained separately."}));
const nvd=json("native-advisories.json"),native=[];
for(const q of nvd.queries)for(const id of q.ids){
 let verdict="reviewed-conditional-not-a-proven-candidate-exploit",reason="General-purpose native/library version match is retained; current API and provisioning recipe do not establish exploit reachability.";
 if(q.name==="macOS"){verdict="not-actionable-product-or-policy-mismatch";reason="Matched records concern a 1999 login-banner policy and Mac OS 9 control panel, not the observed modern macOS build or validation API.";}
 else if(q.name==="cpython"){verdict="not-actionable-in-declared-candidate-surface";reason="Matched plist/XML/cookie/webbrowser/tarfile/Windows shutil extraction and alternate-base64 APIs are not exposed by candidate validate/inspect. Provisioner only opens integrity-verified wheels via zipfile and does not call shutil.unpack_archive; all Windows lifecycle claims remain untested.";}
 else if(q.name==="sqlite"){verdict="not-actionable-in-declared-candidate-surface";reason="FTS5 database parsing/MATCH queries are not imported or called by candidates; version observation reads sqlite_version only, with no database or attacker SQL.";}
 else if(q.owner==="cargo"){verdict="not-actionable-for-offline-recipe";reason="No Cargo/libcurl/OpenSSL network/auth/redirect/cookie/proxy session in the qualified native recipe: all Cargo commands use offline/frozen. Do not reuse this disposition for general online Cargo use.";}
 else if(q.name==="zlib"){verdict="not-actionable-in-current-recipe";reason="Minizip/untgz/combine and inflateGetHeader conditions are not candidate APIs. Provisioning parses only fixed checksum-verified artifacts; external OS backports are not independently certified.";}
 else if(q.name==="v8"){verdict="reviewed-contextual-risk-not-accepted-for-general-execution";reason="Two wildcard matches describe 2011 engines; the current Chrome/HTML/JIT match is not proof about Node's fork. Candidate does not accept JavaScript/HTML execution. General V8 execution/backport applicability is not certified or silently declared fixed.";}
 native.push({inputId:q.owner+":"+q.name+":"+id,advisory:id,component:q.name,version:q.version,verdict,reason,evidence:[q.versionEvidence,"Exact native byte/version/OS/linking receipts and original primary CPE responses retained."],limits:["No product/release/target acceptance or blanket CVE-free statement.","Changed APIs/online use/OS/build/fork require new qualification."]});
}
const save=(f,v)=>writeFileSync(root+"/"+f,JSON.stringify(v,null,2)+"\n");
save("disposition.json",{task:"NF-102-02",sourceRevision:source,collectorRevision,recordedAt:new Date().toISOString(),reviewMode:"single-maintainer",independentAssuranceClaimed:false,previous,current,native,licenseLimitations:json("license-index.json").rows.filter(r=>r.noticeLimitation).map(r=>({ref:r.ref,limitation:r.noticeLimitation,verdict:"reviewed-declaration-by-reference-no-distribution-approval"})),riskAcceptanceInvented:false,architectureAccepted:false});
const rebuild=json("rebuild.json"),licenses=json("license-index.json");assert.equal(licenses.unresolvedExpressionRows,0);assert.ok(Object.values(rebuild.repeatability).every(r=>r.status==="byte-identical"));assert.equal(nvd.queryCount,nvd.expectedQueries);
for(const id of ["typescript","python","rust","go"])assert.equal(json(id+"/advisories.json").advisoryCount,0);
save("completion.json",{task:"NF-102-02",sourceRevision:source,collectorRevision,recordedAt:new Date().toISOString(),taskStatus:"completed",originalCriteria:[{criterion:"Current built artifact/compiler/interpreter/native/license inventory, SBOM and exact-hash provenance",status:"passed",evidence:["tool-closure.json","installation.json","native-inventory.json","license-index.json","cargo-inventory.json"]},{criterion:"Dated four-graph scans and review of reachability, unresolved matches and licensing uncertainties",status:"passed",evidence:["disposition.json","native-advisories.json","typescript/advisories.json","python/advisories.json","rust/advisories.json","go/advisories.json"]},{criterion:"Document reproducibility and offline provisioning after authorized repairs",status:"passed",evidence:["rebuild.json","README.md","../../repairs/supply-chain/toolchains.json"]}],technicalAcceptanceRequirementsWaived:false,originalTaskScopeChanged:false,architectureStatus:"Draft",architectureAccepted:false,allArchitectureGatesClosed:false,remainingCards:["NF-102-03","NF-102-04","NF-102-05","NF-102-06"],scope:"Technical supply-chain/provenance evidence and bounded current evaluation recipes; not blanket security, legal/distribution approval, frozen target lifecycle, signing, performance ranking or architecture acceptance",publicationVerification:"Actual PR/main CI and merge receipts are recorded externally after publication; no self-referential future CI claim in this commit",notTested:["independent toolchain source rebuild/signing attestation","general-purpose online Cargo/pip execution","all OS backports and general V8/HTML/JIT execution","Linux/Windows/frozen-macOS lifecycle and signing"],collectorSources:[{file:"scripts/runtime-supply-chain-completion.mjs",sha256:sha(readFileSync("scripts/runtime-supply-chain-completion.mjs"))}]});
console.log(JSON.stringify({previousInputs:previous.length,currentToolInputs:current.length,nativeInputs:native.length,licenseRows:licenses.rows.length,architecture:"Draft"}));
