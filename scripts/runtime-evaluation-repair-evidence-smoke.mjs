#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { verifyCorpus } from "./lib/runtime-evaluation.mjs";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
assert.deepEqual(verifyCorpus(),[]);
for(const candidate of ["typescript","python","rust","go"]) {
  const report=JSON.parse(readFileSync("evaluation/repairs/"+candidate+".json"));
  assert.equal(report.scope,"validation-function-repair");assert.equal(report.candidate,candidate);
  assert.match(report.sourceRevision,/^[a-f0-9]{40}$/u);
  assert.equal(report.cohort,"supplemental-native-macos-arm64-not-frozen-target-acceptance");
  assert.deepEqual(report.frozen,{passed:352,failed:0,"not-tested":0});
  assert.deepEqual(report.renamed,{passed:224,failed:0,"not-tested":0});
  assert.deepEqual(report.supplemental,{passed:14,failed:0,"not-tested":0});
  assert.equal(report.results.length,590);assert.equal(new Set(report.results.map(r=>r.id)).size,590);
  assert.ok(report.results.every(r=>r.result==="passed"&&r.errors.length===0));
  assert.ok(report.exclusions.includes("human-review")&&report.exclusions.includes("cross-target-lifecycle"));
  for(const source of report.sources) {
    assert.ok(/^(evaluation\/prototypes\/|schemas\/|scripts\/runtime-evaluation-|\.github\/workflows\/)/u.test(source.path));
    assert.doesNotMatch(source.path,/(?:^|\/)\.\.(?:\/|$)|[:\\]/u);
    assert.match(source.sha256,/^[a-f0-9]{64}$/u);
    const committed=execFileSync("git",["show",report.sourceRevision+":"+source.path],{maxBuffer:4*1024*1024});
    assert.equal(hash(committed),source.sha256);
    assert.equal(hash(readFileSync(source.path)),source.sha256,"Repair evidence must describe the current candidate sources.");
  }
  assert.ok(report.sources.some(s=>s.path.includes("semantics.")));
  assert.equal(report.catalogSha256,hash(readFileSync("evaluation/library-cases.json")));
  assert.doesNotMatch(JSON.stringify(report),/(?:CANARY|\/Users\/|\/private\/)/u);
}
console.log("Four exact-source repair reports verified; historical evidence and acceptance gates remain unchanged.");
