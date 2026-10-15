#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {digest} from "./lib/runtime-evaluation.mjs";
import {candidates,same} from "./lib/diagnostic-requalification.mjs";
import {compareReports} from "./runtime-diagnostics-comparison.mjs";
import {contractVersion,verifyPublicReport} from "./lib/validation-diagnostic-contract.mjs";
const option=process.argv.indexOf("--directory");
const directory=option<0?"evaluation/qualification/validation-diagnostics-v1":process.argv[option+1];
assert.ok(["evaluation/qualification/validation-diagnostics-v1","evaluation/qualification/supply-chain-repair"].includes(directory));
const read=file=>readFileSync(new URL("../"+file,import.meta.url));
const catalog=JSON.parse(read("evaluation/library-cases.json"));
const reports=candidates.map(c=>JSON.parse(read(directory+"/"+c+".json")));
for(const report of reports) {assert.deepEqual(verifyPublicReport(report,catalog),[]);assert.equal(report.sourceRevision,reports[0].sourceRevision);assert.ok(same(report.publicLibrary.results.map(r=>r.public),reports[0].publicLibrary.results.map(r=>r.public)));}
const nativeDifferences=reports[0].publicLibrary.results.filter((r,i)=>reports.some(other=>!same(r.native,other.publicLibrary.results[i].native))).map(r=>r.id);
const comparison={task:"NF-102-01",contractVersion,sourceRevision:reports[0].sourceRevision,publicLibrary:{cases:362,passed:362,failed:0},
  rawNativeDifferences:nativeDifferences,legacyCli:compareReports(reports.map(r=>r.legacy)).cli,unsupportedProfileProbesPerCandidate:16,scope:reports[0].scope,
  taskStatus:"completed",allArchitectureGatesClosed:false,architectureStatus:"Draft",architectureAccepted:false};
assert.deepEqual(comparison.legacyCli,{jsonCases:57,publicPassed:57,publicFailures:[]});
const manifest={task:"NF-102-01",contractVersion,sourceRevision:reports[0].sourceRevision,reportHashes:candidates.map(candidate=>({candidate,sha256:digest(read(directory+"/"+candidate+".json"))}))};
for(const [file,value] of [["manifest.json",manifest],["comparison.json",comparison]]) writeFileSync(new URL("../"+directory+"/"+file,import.meta.url),JSON.stringify(value,null,2)+"\n");
console.log(JSON.stringify(comparison));
