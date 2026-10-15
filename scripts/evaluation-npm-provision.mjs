#!/usr/bin/env node
// Trusted provisioning only. Never called by manifests or candidate APIs.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const root=resolve(new URL("..",import.meta.url).pathname), target=resolve(process.argv[2]??"");
assert.ok(process.argv[2]&&!existsSync(target),"use a new scoped tool directory");
const source=join(root,"evaluation/repairs/supply-chain/npm");
const manifest=JSON.parse(readFileSync(join(source,"package.json")));
const lock=JSON.parse(readFileSync(join(source,"package-lock.json")));
for(const [key,p] of Object.entries(lock.packages)) if(key) {
  assert.equal(new URL(p.resolved).origin,"https://registry.npmjs.org");
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
const env={PATH:dirname(process.execPath)+":/usr/bin:/bin",LANG:"C",LC_ALL:"C",npm_config_userconfig:join(temporary,"user.npmrc"),npm_config_globalconfig:join(temporary,"global.npmrc"),npm_config_cache:join(temporary,"cache")};
const result=spawnSync(process.execPath,[join(upstream,"bin/npm-cli.js"),"ci","--ignore-scripts","--no-audit","--fund=false","--allow-remote=all","--registry=https://registry.npmjs.org"],{cwd:target,env,encoding:"utf8",timeout:180000});
assert.equal(result.status,0,result.stderr);
writeFileSync(join(target,"bin/npm"),'#!/usr/bin/env node\nrequire("./npm-cli.js");\n');chmodSync(join(target,"bin/npm"),0o755);
const version=spawnSync(process.execPath,[join(target,"bin/npm-cli.js"),"--version"],{env,encoding:"utf8"});
assert.equal(version.status,0);assert.equal(version.stdout.trim(),"12.2.0");
writeFileSync(join(target,"provenance.json"),JSON.stringify({sourceUrl:url,integrity,sourceSha256:createHash("sha256").update(bytes).digest("hex"),selection:"verified upstream bin/lib/docs/man/LICENSE/README; bundled dependencies replaced by reviewed lock; no upstream implementation changes",manifestSha256:createHash("sha256").update(readFileSync(join(source,"package.json"))).digest("hex"),lockSha256:createHash("sha256").update(readFileSync(join(source,"package-lock.json"))).digest("hex")},null,2)+"\n");
console.log(join(target,"bin"));
