#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,readlinkSync,realpathSync,writeFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {spawnSync} from "node:child_process";
import {sha} from "./runtime-supply-chain-repaired-collect.mjs";
const config=JSON.parse(readFileSync(process.argv[2])),root="evaluation/supply-chain/2026-10-15-repaired",tool=dirname(dirname(config.rustc));
const file="lib/rustlib/aarch64-apple-darwin/lib/libLLVM.dylib",target="../../../libLLVM.dylib",path=join(tool,file);
assert.equal(readlinkSync(path),target);assert.equal(realpathSync(path),join(tool,"lib/libLLVM.dylib"));
const version=spawnSync(join(tool,"lib/rustlib/aarch64-apple-darwin/bin/rust-objcopy"),["--version"],{encoding:"utf8",env:{PATH:"/usr/bin:/bin"}});assert.equal(version.status,0);assert.equal(version.stderr,"");
const record={task:"NF-102-02",sourceRevision:config.sourceRevision,recordedAt:new Date().toISOString(),collectorRevision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),collectorSources:[{file:"scripts/runtime-supply-chain-installation-receipt.mjs",sha256:sha(readFileSync("scripts/runtime-supply-chain-installation-receipt.mjs"))}],baseToolClosureSha256:sha(readFileSync(root+"/tool-closure.json")),installationDelta:[{file,type:"relative-symlink",target,targetSha256:sha(readFileSync(path)),reason:"Rust LLVM tool rpath requires the verified shared library in the target lib directory"}],verification:{command:"rust-objcopy --version without custom loader environment",exitCode:version.status,stdout:version.stdout.trim()},binaryPayloadModified:false,globalInstallationModified:false,signingPerformed:false};
writeFileSync(root+"/installation.json",JSON.stringify(record,null,2)+"\n");
