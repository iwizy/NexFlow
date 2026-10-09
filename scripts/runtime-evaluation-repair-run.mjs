#!/usr/bin/env node
// Supplemental repair verification. The immutable original catalog is never edited.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { compareLibraryResult } from "./lib/evaluation-library.mjs";
import { verifyCorpus, baseline, repositoryRoot } from "./lib/runtime-evaluation.mjs";

const [candidate, encodedCommand] = process.argv.slice(2);
assert.ok(["typescript", "python", "rust", "go"].includes(candidate));
assert.deepEqual(verifyCorpus(), []);
const bytes = readFileSync("evaluation/library-cases.json");
const catalog = JSON.parse(bytes);
const semantic = catalog.cases.filter(e => ["semantic-fragment", "workflow-namespace", "artifact-namespace"].includes(e.operation));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const rulePaths = ["typescript/semantic-rules.json", "python/nexflow_python_evaluation/semantic-rules.json", "rust/semantic-rules.json", "go/semantic-rules.json"];
assert.equal(new Set(rulePaths.map(p => digest(readFileSync("evaluation/prototypes/" + p)))).size, 1);
// Rename identifiers, not schema vocabulary; expected values stay outside the candidate.
const ids = new Set(["known", "missing", "worker", "first", "second", "human", "authority", "service", "gate", "flow", "stage", "step", "same"]);
function rename(value, key = "") {
  if (typeof value === "string") return key !== "kind" && ids.has(value) ? "renamed-" + value : value;
  if (Array.isArray(value)) return value.map(v => rename(v, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rename(v,k)]));
  return value;
}
const transformed = semantic.map((e,i) => ({ ...e, id: "supplemental-renamed-" + i, input: rename(e.input), expected: rename(e.expected) }));
const diagnostic = (category, extra={}) => ({code:"NF-SEMANTIC",category,...extra});
const custom = [];
function test(id, input, diagnostics) { custom.push({ id, operation:"semantic-fragment", input:{documents:input}, expected:{valid:diagnostics.length===0,diagnostics} }); }
test("repair-composite-unresolved", { ActorSet:{actors:[{id:"reviewer",kind:"human"}]}, TaskSet:{tasks:[{id:"task",owner:"nobody",capabilitiesRequired:["absent"]}]} },
  [diagnostic("unresolved-reference",{sourceKind:"TaskSet",instancePath:"/tasks/0/owner",targetNamespace:"actor",targetId:"nobody"}),
   diagnostic("unresolved-reference",{sourceKind:"TaskSet",instancePath:"/tasks/0/capabilitiesRequired/0",targetNamespace:"capability",targetId:"absent"})]);
test("repair-wrong-namespace", { ProviderSet:{providers:[{id:"shared"}]},TaskSet:{tasks:[{id:"task",owner:"shared"}]} }, [diagnostic("unresolved-reference",{targetNamespace:"actor",targetId:"shared"})]);
test("repair-case-sensitive", {ActorSet:{actors:[{id:"worker",kind:"human"}]},TaskSet:{tasks:[{id:"task",owner:"Worker"}]}}, [diagnostic("unresolved-reference",{targetId:"<redacted-id>"})]);
test("repair-duplicate-no-dependent-selection", {ActorSet:{actors:[{id:"same",kind:"human"},{id:"same",kind:"human"}]},TaskSet:{tasks:[{id:"task",owner:"absent"}]}},[diagnostic("duplicate-identity")]);
test("repair-unresolved-authority-no-cascade", {ActorSet:{actors:[]},Project:{project:{policies:{humanOverride:{authorities:[{kind:"actor",id:"absent"}]}}}}},[diagnostic("unresolved-reference")]);
test("repair-unresolved-component-no-cascade", {AgentDefinitionSet:{agentDefinitions:[{id:"definition",status:"active",components:{promptSetRef:"absent"}}]}},[diagnostic("unresolved-reference")]);
test("repair-unresolved-active-definition-no-cascade", {AgentDefinitionSet:{agentDefinitions:[{id:"first",status:"active",agentRef:"absent"},{id:"second",status:"active",agentRef:"absent"}]}},[diagnostic("unresolved-reference"),diagnostic("unresolved-reference")]);
test("repair-pinned-provider", {ProviderSet:{providers:[{id:"native"}]},ModelProfileSet:{modelProfiles:[{id:"profile",selection:{pinnedModel:{providerRef:"native"}}}]}},[]);
test("repair-missing-pinned-provider", {ModelProfileSet:{modelProfiles:[{id:"profile",selection:{pinnedModel:{providerRef:"absent"}}}]}},[diagnostic("unresolved-reference",{instancePath:"/modelProfiles/0/selection/pinnedModel/providerRef"})]);
test("repair-redaction", {TaskSet:{tasks:[{id:"task",owner:"CANARY secret://private/value"}]}},[diagnostic("unresolved-reference",{targetId:"<redacted-id>"})]);
test("repair-workflow-duplicate-in-assembly", {Workflow:{workflow:{id:"flow",stages:[{id:"stage",steps:[{id:"one"},{id:"one"}]}]}}},[diagnostic("duplicate-workflow-step")]);
let deep = null; for(let i=0;i<70;i++) deep = {value:deep};
custom.push({id:"repair-depth-budget",operation:"semantic-fragment",input:{documents:{ignored:deep}},expected:{valid:false,diagnostics:[diagnostic("semantic-limit")]}});
custom.push({id:"repair-node-budget",operation:"semantic-fragment",input:{documents:{ignored:Array(10001).fill(null)}},expected:{valid:false,diagnostics:[diagnostic("semantic-limit")]}});
// A long reverse-ordered authority chain exercises fixed-point resolution without recursion.
const chain = Array.from({length:500},(_,i)=>({id:"authority-"+i,kind:"authority",representedBy:[{kind:"actor",id:i===499?"human":"authority-"+(i+1)}]}));
test("repair-long-human-chain",{ActorSet:{actors:[...chain,{id:"human",kind:"human"}]},Project:{project:{policies:{humanOverride:{authorities:[{kind:"actor",id:"authority-0"}]}}}}},[]);
const cases = [...catalog.cases,...transformed,...custom];
const packet = cases.map(({id,operation,input})=>({id,operation,input:structuredClone(input)}));
const before = JSON.stringify(packet);
let actual;
if(candidate==="typescript") {
  const {evaluateLibraryCase,repositorySchemas} = await import("../evaluation/prototypes/typescript/dist/library.js");
  const schemas=repositorySchemas();
  actual=packet.map(entry=>{
    const first=evaluateLibraryCase(entry,repositoryRoot,schemas);
    assert.deepEqual(evaluateLibraryCase(entry,repositoryRoot,schemas),first);
    return first;
  });
} else {
  const command=JSON.parse(encodedCommand);
  assert.ok(Array.isArray(command)&&command.length&&command.every(v=>typeof v==="string"));
  const run=spawnSync(command[0],[...command.slice(1),repositoryRoot],{input:JSON.stringify(packet),encoding:"utf8",timeout:60000,maxBuffer:8*1024*1024,shell:false});
  assert.equal(run.status,0,"Native repair driver failed"); assert.equal(run.stderr,"");
  actual=JSON.parse(run.stdout);
}
assert.equal(JSON.stringify(packet),before); assert.equal(actual.length,cases.length);
const results=cases.map((entry,i)=> {
  const result=actual[i]; const errors=compareLibraryResult(entry,result);
  assert.equal(result.checks.runtime,"not-run");assert.equal(result.checks.extensions,"not-run");
  assert.equal(JSON.stringify(result.diagnostics).includes("CANARY"),false);
  assert.equal(JSON.stringify(result.diagnostics).includes(repositoryRoot),false);
  return {id:entry.id,operation:entry.operation,result:errors.length?"failed":"passed",errors,diagnostics:result.diagnostics};
});
assert.deepEqual(verifyCorpus(),[]); assert.equal(digest(readFileSync("evaluation/library-cases.json")),digest(bytes));
const counts=items=>({passed:items.filter(i=>i.result==="passed").length,failed:items.filter(i=>i.result==="failed").length,"not-tested":0});
const report={formatVersion:1,scope:"validation-function-repair",candidate,
  specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(bytes),
  frozen:counts(results.slice(0,catalog.cases.length)),renamed:counts(results.slice(catalog.cases.length,catalog.cases.length+transformed.length)),
  supplemental:counts(results.slice(catalog.cases.length+transformed.length)),runsPerCase:2,
  platform:process.platform,architecture:process.arch,results,
  exclusions:["full-semantic-conformance","runtime","core-and-extension-profiles","cross-target-lifecycle","signing","security-advisory-closure","comparable-performance","human-review","architecture-acceptance"]};
console.log(JSON.stringify(process.argv.includes("--summary")?{...report,results:results.filter(i=>i.result==="failed")}:report,null,2));
process.exitCode=results.some(i=>i.result==="failed")?1:0;
