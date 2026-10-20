#!/usr/bin/env node
// Trusted provisioning only. Never called by manifests or candidate APIs.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root=fileURLToPath(new URL("..",import.meta.url)), target=resolve(process.argv[2]??"");
assert.equal(process.versions.node,"26.12.0","use the qualified evaluation Node runtime");
assert.ok(process.argv[2]&&!existsSync(target),"use a new scoped tool directory");
const source=join(root,"evaluation/repairs/supply-chain/npm");
const manifest=JSON.parse(readFileSync(join(source,"package.json")));
const lock=JSON.parse(readFileSync(join(source,"package-lock.json")));
for(const [key,p] of Object.entries(lock.packages)) if(key) {
  assert.ok(key.startsWith("node_modules/")&&!key.split("/").some(part=>["..","."].includes(part)));
  assert.equal(new URL(p.resolved).origin,"https://registry.npmjs.org");
  assert.equal(new URL(p.resolved).username,"");assert.equal(new URL(p.resolved).password,"");
  assert.match(p.integrity,/^sha512-[A-Za-z0-9+/]+=*$/u);
  assert.equal(p.inBundle,undefined,"bundled dependencies bypass overrides");
}
const url="https://registry.npmjs.org/npm/-/npm-12.2.0.tgz";
const integrity="sha512-ZsJjKpTnlmSXOLLXiU1xDCzC4Wlok4IwZmh/aw2KUuXytU7q6qMv/cUT7MoeSf95Slwuw/lRXYefGzGCspHPNQ==";
const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(120000)});
assert.equal(response.status,200);
const bytes=Buffer.from(await response.arrayBuffer());
assert.equal("sha512-"+createHash("sha512").update(bytes).digest("base64"),integrity);
const temporary=mkdtempSync(join(tmpdir(),"nf-package-manager-")), archive=join(temporary,"npm.tgz");
writeFileSync(archive,bytes);
assert.equal(spawnSync("tar",["-xf",archive,"-C",temporary]).status,0);
const upstream=join(temporary,"package"), original=JSON.parse(readFileSync(join(upstream,"package.json")));
assert.equal(original.version,manifest.version);assert.deepEqual(original.dependencies,manifest.dependencies);
mkdirSync(target);
for(const name of ["bin","lib","docs","man","LICENSE","README.md"]) if(existsSync(join(upstream,name))) cpSync(join(upstream,name),join(target,name),{recursive:true});
for(const name of ["package.json","package-lock.json"]) cpSync(join(source,name),join(target,name));
for(const name of ["user.npmrc","global.npmrc"]) writeFileSync(join(temporary,name),"");
const system=process.platform==="win32"?{SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,TEMP:process.env.TEMP,TMP:process.env.TMP}:{};
const env={...system,PATH:[dirname(process.execPath),...(process.platform==="win32"?[join(process.env.SystemRoot,"System32")]:["/usr/bin","/bin"])].join(delimiter),LANG:"C",LC_ALL:"C",npm_config_userconfig:join(temporary,"user.npmrc"),npm_config_globalconfig:join(temporary,"global.npmrc"),npm_config_cache:join(temporary,"cache")};
// Do not execute the upstream bundled dependency graph, even for bootstrap.
// Every archive is trusted only after matching its committed integrity hash.
let index=0;
for(const [key,p]of Object.entries(lock.packages))if(key){
 const response=await fetch(p.resolved,{redirect:"error",signal:AbortSignal.timeout(120000)});assert.equal(response.status,200);
 const payload=Buffer.from(await response.arrayBuffer());assert.equal("sha512-"+createHash("sha512").update(payload).digest("base64"),p.integrity);
 const archive=join(temporary,"dependency-"+(index++)+".tgz");writeFileSync(archive,payload);
 const listing=spawnSync("tar",["-tf",archive],{env,encoding:"utf8"});assert.equal(listing.status,0);
 for(const name of listing.stdout.trim().split("\n"))assert.ok(name.startsWith("package/")&&!name.split("/").includes(".."),"unsafe archive member");
 const kinds=spawnSync("tar",["-tvf",archive],{env,encoding:"utf8"});assert.equal(kinds.status,0);assert.ok(kinds.stdout.trim().split("\n").every(line=>/^[d-]/u.test(line)),"archive links/devices are not accepted");
 const destination=join(target,key);mkdirSync(destination,{recursive:true});
 assert.equal(spawnSync("tar",["-xf",archive,"--strip-components=1","--no-same-owner","--no-same-permissions","-C",destination],{env}).status,0);
 const installed=JSON.parse(readFileSync(join(destination,"package.json")));assert.equal(installed.version,p.version);
}
writeFileSync(join(target,"bin/npm"),'#!/usr/bin/env node\nrequire("./npm-cli.js");\n');chmodSync(join(target,"bin/npm"),0o755);
const version=spawnSync(process.execPath,[join(target,"bin/npm-cli.js"),"--version"],{env,encoding:"utf8"});
assert.equal(version.status,0);assert.equal(version.stdout.trim(),"12.2.0");
writeFileSync(join(target,"provenance.json"),JSON.stringify({sourceUrl:url,integrity,sourceSha256:createHash("sha256").update(bytes).digest("hex"),selection:"verified upstream bin/lib/docs/man/LICENSE/README; bundled dependencies replaced by reviewed lock; no upstream implementation changes",manifestSha256:createHash("sha256").update(readFileSync(join(source,"package.json"))).digest("hex"),lockSha256:createHash("sha256").update(readFileSync(join(source,"package-lock.json"))).digest("hex")},null,2)+"\n");
console.log(join(target,"bin"));
