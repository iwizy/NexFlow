#!/usr/bin/env node
// Full immutable upstream Cargo source lock; target binary selection is separate.
import assert from "node:assert/strict";
import {existsSync,mkdtempSync,readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
import {scan} from "./runtime-supply-chain-repaired-scan.mjs";
import {sbomFor} from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",json=f=>JSON.parse(readFileSync(root+"/"+f));
const closure=json("tool-closure.json"),declared=json("rustCompiler-inventory.json").components;
const revision=closure.rust.cargo.match(/commit-hash: ([a-f0-9]{40})/u)[1],url="https://raw.githubusercontent.com/rust-lang/cargo/"+revision+"/Cargo.lock";
const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);const bytes=await response.text();
const entries=bytes.split("[[package]]").slice(1).map(block=>({name:block.match(/^name = "([^"]+)"/mu)?.[1],version:block.match(/^version = "([^"]+)"/mu)?.[1],checksum:block.match(/^checksum = "([^"]+)"/mu)?.[1]})).filter(e=>e.checksum);
assert.ok(entries.length>400);const temporary=mkdtempSync(join(tmpdir(),"nf-cargo-notices-")),components=[];
for(const entry of entries){assert.match(entry.checksum,/^[a-f0-9]{64}$/u);const existing=declared.find(c=>c.name===entry.name&&c.version===entry.version);
 let license=existing?.license,licenseFiles=existing?.licenseFiles;
 if(!existing){
  const download="https://static.crates.io/crates/"+entry.name+"/"+entry.name+"-"+entry.version+".crate",r2=await fetch(download,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(r2.status,200);const archiveBytes=Buffer.from(await r2.arrayBuffer());assert.equal(sha(archiveBytes),entry.checksum);const file=join(temporary,entry.name+".crate");writeFileSync(file,archiveBytes);
  const toml=spawnSync("tar",["-xOf",file,entry.name+"-"+entry.version+"/Cargo.toml"],{encoding:"utf8"});assert.equal(toml.status,0);license=toml.stdout.match(/^license = "([^"]+)"/mu)?.[1];assert.ok(license,"source manifest license absent");
  const listing=spawnSync("tar",["-tf",file],{encoding:"utf8"});assert.equal(listing.status,0);const names=listing.stdout.split("\n").filter(n=>/(?:^|\/)[^/]*(?:licen[cs]e|copying|notice)[^/]*$/iu.test(n)&&!n.endsWith("/"));licenseFiles=names.map(n=>{const p=spawnSync("tar",["-xOf",file,n]);assert.equal(p.status,0);return{file:n,sha256:sha(p.stdout),bytes:p.stdout.length};});assert.ok(licenseFiles.length,entry.name+" lacks a source notice");
 }
 components.push({ref:"pkg:cargo/"+entry.name+"@"+entry.version,name:entry.name,version:entry.version,ecosystem:"crates.io",license,licenseFiles,archiveSha256:entry.checksum,scope:"exact-Cargo-source-lock-all-targets",metadataSource:"verified Cargo binary commit + immutable source Cargo.lock + versioned copyright/source notices",licenseAssessment:"upstream-declared-not-legal-approval"});
}
const collectorRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
const record={candidate:"tool-cargo",sourceRevision:closure.sourceRevision,collectorRevision,collectorSources:[{file:"scripts/runtime-supply-chain-cargo-closure.mjs",sha256:sha(readFileSync("scripts/runtime-supply-chain-cargo-closure.mjs"))}],recordedAt:new Date().toISOString(),sourceLock:{url,revision,sha256:sha(bytes)},components,dependencies:[{ref:"candidate:tool-cargo",dependsOn:components.map(c=>c.ref)},...components.map(c=>({ref:c.ref,dependsOn:[]}))],selection:"full upstream source lock is a superset; not a claim that every target/dev dependency is linked into the native Cargo binary"};
const save=(name,value)=>writeFileSync(root+"/"+name,JSON.stringify(value,null,2)+"\n");save("cargo-inventory.json",record);save("cargo-sbom.cdx.json",sbomFor(record));save("cargo-advisories.json",await scan(record));console.log("Cargo source closure: "+components.length+" components, "+components.filter(c=>!declared.some(d=>d.ref===c.ref)).length+" additional exact-version notice mappings");
