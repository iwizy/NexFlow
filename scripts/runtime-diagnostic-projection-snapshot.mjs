#!/usr/bin/env node
// Write only the new repair snapshot index, never historical observations.
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {candidates,same} from "./lib/diagnostic-requalification.mjs";
import {digest} from "./lib/runtime-evaluation.mjs";
import {compareReports} from "./runtime-diagnostics-comparison.mjs";
const directory="evaluation/requalification/diagnostic-projection-repair";
const read=file=>readFileSync(new URL("../"+file,import.meta.url));
const reports=candidates.map(candidate=>JSON.parse(read(directory+"/"+candidate+".json")));
assert.ok(reports.every(r=>same(r.pins,reports[0].pins)&&r.harnessRevision===reports[0].pins.sourceRevision));
assert.ok(reports.every(r=>r.library.failed===0&&r.cli.failed===0));
const comparison=compareReports(reports,{directory,candidateRepairAuthorized:true});
assert.deepEqual(comparison.cli,{jsonCases:57,publicPassed:57,publicFailures:[]});
const manifest={task:"NF-102-01",scope:"public-schema-branch-projection-repair",sourceRevision:reports[0].pins.sourceRevision,candidateRepairAuthorized:true,
  reports:candidates.map(candidate=>({candidate,sha256:digest(read(directory+"/"+candidate+".json")),regressionsSha256:digest(read(directory+"/"+candidate+"-regressions.json"))}))};
for(const [file,value] of [["comparison.json",comparison],["manifest.json",manifest]]) writeFileSync(new URL("../"+directory+"/"+file,import.meta.url),JSON.stringify(value,null,2)+"\n");
console.log(JSON.stringify({library:comparison.library,cli:comparison.cli,acceptance:comparison.acceptance}));
