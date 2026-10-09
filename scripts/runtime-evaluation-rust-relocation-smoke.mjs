#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
assert.equal(process.platform,"darwin","Source-denial proof requires the native macOS sandbox.");
assert.equal(process.argv.length,3,"Provide the freshly built Rust CLI.");
const root=process.cwd(), temporary=mkdtempSync(join(tmpdir(),"nexflow-rust-relocation-"));
const executable=join(temporary,"relocated-rust");
try {
  copyFileSync(resolve(process.argv[2]),executable);chmodSync(executable,0o700);
  const profile='(version 1)(allow default)(deny network*)(deny file-read* (subpath '+JSON.stringify(join(root,"schemas"))+'))';
  for(const command of ["validate","inspect"]) {
    const run=spawnSync("/usr/bin/sandbox-exec",["-p",profile,executable,command,"--root",join(root,"fixtures/cli/valid/minimal-project"),"--format","json"],{cwd:temporary,encoding:"utf8",timeout:15000});
    assert.equal(run.status,0,command+": relocated CLI failed with source schemas denied");
    assert.equal(run.stderr,"");const out=JSON.parse(run.stdout);
    assert.equal(out.success,true);assert.equal(out.checks.schema,"passed");assert.equal(out.executionAuthorized,false);
    assert.equal(out.checks.semantic,"not-run");assert.equal(out.checks.extensionProfiles,"not-run");
  }
  console.log("Relocated Rust validate/inspect pass with source-schema reads and network denied; macOS supplemental proof only.");
} finally { rmSync(temporary,{recursive:true,force:true}); }
