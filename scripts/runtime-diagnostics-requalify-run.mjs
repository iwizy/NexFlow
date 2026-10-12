#!/usr/bin/env node
// Native candidates receive inputs only, never oracle expectations or mapped results.
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, lstatSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { parse } from "yaml";
import { catalogErrors, compareLibraryResult } from "./lib/evaluation-library.mjs";
import { baseline, digest, repositoryRoot, verifyCorpus, compareOutput } from "./lib/runtime-evaluation.mjs";
import { candidates, canonical, same, mappingId, libraryObservation, publicErrors, reportErrors, schemaProjection } from "./lib/diagnostic-requalification.mjs";

const [candidate, driverJson, cliJson, outputFile] = process.argv.slice(2);
assert.ok(candidates.includes(candidate));
const command = value => { const result = JSON.parse(value); assert.ok(Array.isArray(result) && result.length && result.every(v => typeof v === "string")); return result; };
const driver = command(driverJson), cli = command(cliJson);
const git = (...args) => { const p = spawnSync("git", args, {cwd: repositoryRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024}); assert.equal(p.status, 0, "source binding unavailable"); return p.stdout.trim(); };
const revisionOption = process.argv.indexOf("--source-revision");
const sourceRevision = revisionOption < 0 ? "e1b7d65d86194b0848c219be76010f7f7460fa2b" : process.argv[revisionOption + 1];
assert.match(sourceRevision, /^[0-9a-f]{40}$/u);
const repairRevision = revisionOption < 0 ? "9e13a54311735a36398eb89c4a39ff2949998998" : sourceRevision;
const harnessRevision = git("rev-parse", "HEAD");
const harnessFiles = ["scripts/runtime-diagnostics-requalify-run.mjs", "scripts/lib/diagnostic-requalification.mjs", "scripts/lib/evaluation-library.mjs", "scripts/lib/runtime-evaluation.mjs", "evaluation/command-result.schema.json", "evaluation/baseline.json", "evaluation/library-cases.json"];
for (const file of harnessFiles) assert.equal(digest(readFileSync(path.join(repositoryRoot,file))), digest(spawnSync("git", ["show", harnessRevision + ":" + file], {cwd: repositoryRoot, maxBuffer: 32 * 1024 * 1024}).stdout), "commit collector before recording evidence");
assert.deepEqual(verifyCorpus(), []);
const catalogBytes = readFileSync(path.join(repositoryRoot, "evaluation/library-cases.json"));
const catalog = JSON.parse(catalogBytes);
assert.deepEqual(catalogErrors(catalog, baseline), []);
const pins = { sourceRevision, repairRevision, specificationRevision: baseline.specificationRevision, corpusSha256: baseline.corpus.sha256, catalogSha256: digest(catalogBytes) };
const sourceInventory = git("ls-files", "evaluation/prototypes/" + candidate, "schemas").split("\n").filter(Boolean).map(file => {
  const bytes = readFileSync(path.join(repositoryRoot, file));
  const atSource = spawnSync("git", ["show", sourceRevision + ":" + file], {cwd: repositoryRoot, maxBuffer: 8 * 1024 * 1024});
  const atRepair = spawnSync("git", ["show", repairRevision + ":" + file], {cwd: repositoryRoot, maxBuffer: 8 * 1024 * 1024});
  assert.equal(atSource.status, 0); assert.equal(atRepair.status, 0);
  assert.equal(digest(bytes), digest(atSource.stdout)); assert.equal(digest(bytes), digest(atRepair.stdout));
  return {path: file, sha256: digest(bytes)};
});
const invoke = (cmd, args = [], input) => spawnSync(cmd[0], [...cmd.slice(1), ...args], {cwd: repositoryRoot, input, encoding: "utf8", timeout: 60000, maxBuffer: 16 * 1024 * 1024, shell: false});
const packet = catalog.cases.map(({id, operation, input}) => ({id, operation, input: structuredClone(input)}));
const packetBefore = JSON.stringify(packet);
const awaitLibrary = candidate === "typescript" ? await import("../evaluation/prototypes/typescript/dist/library.js") : null;
let runs, rawHashes;
if (candidate === "typescript") {
  const {evaluateLibraryCase, repositorySchemas} = awaitLibrary;
  runs = [0,1].map(() => {
    const schemas = repositorySchemas();
    return packet.map(entry => {
      const before = JSON.stringify(entry.input);
      const first = evaluateLibraryCase(entry, repositoryRoot, schemas);
      assert.deepEqual(evaluateLibraryCase(entry, repositoryRoot, schemas), first);
      assert.equal(JSON.stringify(entry.input), before);
      return first;
    });
  });
  rawHashes = runs.map(r => digest(JSON.stringify(r)));
} else {
  const processes = [0,1].map(() => invoke(driver, [repositoryRoot], packetBefore));
  for (const p of processes) { assert.equal(p.status, 0, "native library driver failed"); assert.equal(p.stderr, ""); assert.ok(!p.error); }
  rawHashes = processes.map(p => digest(p.stdout));
  runs = processes.map(p => JSON.parse(p.stdout));
}
assert.equal(JSON.stringify(packet), packetBefore);
assert.ok(runs.every(r => r.length === catalog.cases.length));
const libraryResults = catalog.cases.map((entry, index) => {
  const actual = runs[0][index];
  const repeatable = same(actual, runs[1][index]);
  const errors = compareLibraryResult(entry, actual);
  if (!repeatable) errors.push("not-repeatable");
  if (JSON.stringify(actual).includes(repositoryRoot)) errors.push("source-path-leak");
  return {id: entry.id, operation: entry.operation, actual, observations: actual.diagnostics.map(d => libraryObservation(entry.operation,d)),
    repeatable, inputUnchanged: true, secondResultSha256: digest(JSON.stringify(canonical(runs[1][index]))), errors};
});

const temporary = mkdtempSync(path.join(os.tmpdir(), "nexflow-diagnostics-"));
const canary = "NF_PRIVATE_VALUE_7f1c9";
const cases = [];
const minimal = "fixtures/cli/valid/minimal-project";
const usage = "NEXFLOW-PROTOTYPE-USAGE";
const add = (id, args, expected, options = {}) => cases.push({id, root: minimal, args, expected, ...options});
const expectedSuccess = (cmd, mode) => ({exitCode: 0, reportedCommand: cmd, inputMode: mode, discovery:"passed", schema:"passed", diagnosticCodes:[]});
const expectedUsage = {exitCode:2, reportedCommand:null,inputMode:null,discovery:"not-run",schema:"not-run",diagnosticCodes:[usage]};
for (const item of baseline.cases) cases.push({...item, args:[item.command, ...item.args, "--root", "{root}", "--format", "json"], origin:"frozen-cli"});
for (const cmd of ["validate", "inspect"]) {
  add(cmd + "-explicit-files", [cmd,"--root","{root}","--file","project.yaml","--file","actors.yaml","--file","agents.yaml","--format=json"], expectedSuccess(cmd,"explicit-file-list"));
  add(cmd + "-project-equals", [cmd,"--root={root}","--project=project.yaml","--format=json"], expectedSuccess(cmd,"project-source-hints"));
  add(cmd + "-directory-json-equals", [cmd,"--root","{root}","--format=json"], expectedSuccess(cmd,"directory-project"));
  add(cmd + "-text", [cmd,"--root","{root}","--format","text"], {exitCode:0}, {text:true});
}
for (const cmd of ["run","init","discover","graph","help","version"]) add("unsupported-"+cmd, [cmd,"--root","{root}","--format=json"], expectedUsage);
for (const [id, args] of [
  ["missing-root",[]], ["duplicate-root",["--root","{root}","--root","{root}"]],
  ["duplicate-project",["--root","{root}","--project","project.yaml","--project","project.yaml"]],
  ["duplicate-format",["--root","{root}","--format","json"]],
  ["mixed-project-file",["--root","{root}","--project","project.yaml","--file","actors.yaml"]],
  ["unknown-option",["--root","{root}","--unknown="+canary]], ["positional",["--root","{root}",canary]],
  ["empty-root",["--root="]], ["empty-project",["--root","{root}","--project="]], ["empty-file",["--root","{root}","--file="]],
  ["invalid-format",["--root","{root}","--format="+canary]],
]) add(id,["validate",...args,"--format=json"],expectedUsage);
for (const entry of catalog.cases.filter(c => c.operation === "manifest-schema" && c.input.file.endsWith("/project.yaml") && c.expected.valid)) {
  for (const cmd of ["validate","inspect"]) add(cmd+"-"+entry.id,[cmd,"--root","{root}","--project","project.yaml","--format=json"],expectedSuccess(cmd,"project-source-hints"),{root:path.dirname(entry.input.file),origin:"maintained-project"});
}
add("redacted-outside-file",["validate","--root","{root}","--file","../"+canary,"--format=json"],null,{check: output => output.exitCode === 1 && output.diagnostics.some(d => d.code === "NF-DISCOVERY-OUTSIDE-ROOT")});
// The explicit root is canonicalized by the frozen policy. Source symlinks below it are denied.
add("symlink-root",["validate","--root","{symlink}","--format=json"],expectedSuccess("validate","directory-project"));
add("symlink-source",["validate","--root","{root}","--format=json"],null,{edit:"symlink-source",check:output => output.exitCode === 1 && output.checks.discovery === "failed" && output.diagnostics.some(d=>d.code==="NF-DISCOVERY-UNSAFE-SOURCE")});
add("absent-root",["validate","--root","{absent}","--format=json"],null,{check:output => output.exitCode === 1 && output.checks.discovery === "failed"});
add("schema-value-redaction",["validate","--root","{root}","--format=json"],null,{edit:"schema-redaction",check:output => output.exitCode === 1 && output.diagnostics.length > 1 && output.diagnostics.every(d => d.code === "NF-SCHEMA")});
add("diagnostic-limit",["validate","--root","{root}","--format=json"],null,{edit:"diagnostic-limit",check:output => output.exitCode === 1 && output.truncated && output.diagnostics.length === 200 && output.result === null});
add("semantic-project-gap",["validate","--root","{root}","--format=json"],expectedSuccess("validate","directory-project"),{edit:"semantic-gap",scopeObservation:"schema-valid unresolved agent bridge; CLI semantic remains not-run"});
function inventory(root) {
  const walk = dir => readdirSync(dir).sort().flatMap(name => { const file=path.join(dir,name), stat=lstatSync(file); return stat.isDirectory() ? walk(file) : [{path:path.relative(root,file).split(path.sep).join("/"),sha256:stat.isSymbolicLink()?"symlink":digest(readFileSync(file))}]; });
  return walk(root);
}
let cliResults;
try {
  cliResults = cases.map(item => {
    const home = path.join(temporary,item.id); cpSync(path.join(repositoryRoot,item.root),home,{recursive:true});
    if(item.append) { const file=path.join(home,item.append.file); writeFileSync(file,readFileSync(file,"utf8")+item.append.text); }
    if(item.edit === "schema-redaction") {
      const doc=parse(readFileSync(path.join(home,"project.yaml"),"utf8")); doc.project.defaultAutonomy=canary; doc.project.maintainers=[canary+"://private"]; delete doc.project.displayName;
      writeFileSync(path.join(home,"project.yaml"),JSON.stringify(doc));
    }
    if(item.edit === "diagnostic-limit") {
      const doc=parse(readFileSync(path.join(home,"actors.yaml"),"utf8")); doc.actors=Array.from({length:230},(_,i)=>({id:"invalid-"+i,kind:canary})); writeFileSync(path.join(home,"actors.yaml"),JSON.stringify(doc));
    }
    if(item.edit === "semantic-gap") {
      const file=path.join(home,"actors.yaml"), doc=parse(readFileSync(file,"utf8")); doc.actors[1].agentRef.id="missing-agent"; writeFileSync(file,JSON.stringify(doc));
    }
    if(item.edit === "symlink-source") {
      const file=path.join(home,"actors.yaml"); rmSync(file); symlinkSync(path.join(home,"agents.yaml"),file);
    }
    const link=home+"-link"; if(item.id === "symlink-root") symlinkSync(home,link,"dir");
    const args=item.args.map(v=>v.replaceAll("{root}",home).replaceAll("{symlink}",link).replaceAll("{absent}",home+"-absent"));
    const before=inventory(home), processes=[0,1].map(()=>invoke(cli,args));
    const errors=[];
    let outputs=[];
    for(const p of processes) {
      if(p.error || p.signal || p.status === null) { errors.push("cli-process-unavailable"); continue; }
      if(item.text) {
        if(p.status!==item.expected.exitCode || p.stderr!=="" || !p.stdout.includes("no execution is authorized")) errors.push("invalid-text-result");
      } else {
        try {
          const output=JSON.parse(p.stdout); outputs.push(output);
          errors.push(...publicErrors(output,p.status,p.stderr,p.stdout,[repositoryRoot,temporary,canary]));
          if(item.expected) errors.push(...compareOutput(item,output,p.status,p.stderr));
          if(item.check && !item.check(output)) errors.push("wrong-supplemental-result");
        } catch { errors.push("invalid-json-output"); }
      }
    }
    const repeatable=processes.every(p=>p.status===processes[0].status && p.stdout===processes[0].stdout && p.stderr===processes[0].stderr);
    const inputUnchanged=same(before,inventory(home));
    if(!repeatable) errors.push("cli-not-repeatable"); if(!inputUnchanged) errors.push("cli-mutated-input");
    // Actual schema-to-public bridge, checked independently of the public emitter.
    let bridgeObservation=null;
    if(["schema-redaction","semantic-gap"].includes(item.edit) && outputs[0]) {
      const output=outputs[0];
      const entry=item.edit === "schema-redaction" ? {id:"projection-probe",operation:"manifest-schema",input:{file:item.id+"/project.yaml"}} :
        {id:"project-semantic-probe",operation:"semantic-fragment",input:{documents:Object.fromEntries(["project.yaml","actors.yaml","agents.yaml"].map(file=>{const doc=parse(readFileSync(path.join(home,file),"utf8"));return [doc.kind,doc];}))}};
      let raw;
      if(candidate==="typescript") {
        const {evaluateLibraryCase,repositorySchemas}=awaitLibrary;
        raw=evaluateLibraryCase(entry,temporary,repositorySchemas());
      } else { const p=invoke(driver,[temporary],JSON.stringify([entry])); if(p.status===0 && p.stderr==="") raw=JSON.parse(p.stdout)[0]; }
      bridgeObservation=raw??null;
      if(item.edit === "schema-redaction") {
        if(!raw || !same(raw.diagnostics.map(d=>schemaProjection(d,"project.yaml","Project")).sort((a,b)=>JSON.stringify(canonical(a)).localeCompare(JSON.stringify(canonical(b)))),
          output.diagnostics.map(({code,file,kind,severity,keyword,path})=>({code,file,kind,severity,keyword,path})).sort((a,b)=>JSON.stringify(canonical(a)).localeCompare(JSON.stringify(canonical(b)))))) errors.push("schema-public-projection-mismatch");
      } else if(!raw || raw.valid!==false || !raw.diagnostics.some(d=>d.category==="unresolved-reference")) errors.push("semantic-gap-probe-not-invalid");
    }
    return {id:item.id,origin:item.origin??"supplemental-cli",args:item.args,expected:item.expected,scopeObservation:item.scopeObservation??null,
      inputSha256:digest(JSON.stringify(before)),bridgeObservation,actual:outputs[0]??{exitCode:processes[0].status,text:processes[0].stdout},
      stdoutSha256:processes.map(p=>digest(p.stdout??"")),stderrSha256:processes.map(p=>digest(p.stderr??"")),repeatable,inputUnchanged,errors:[...new Set(errors)]};
  });
} finally { rmSync(temporary,{recursive:true,force:true}); }
assert.deepEqual(verifyCorpus(),[]);
const artifactPaths = candidate === "typescript" ? ["evaluation/prototypes/typescript/dist/library.js","evaluation/prototypes/typescript/dist/cli.js"] : [driver.at(-1),cli.at(-1)].filter(p=>!p.startsWith("-"));
const artifacts=[...new Set(artifactPaths)].map((file,index)=>({role:index===0?"library-entry":"cli-entry",sha256:digest(readFileSync(path.resolve(repositoryRoot,file)))}));
if(["typescript","python"].includes(candidate)) artifacts.push({role:"interpreter",sha256:digest(readFileSync(candidate==="typescript"?process.execPath:path.resolve(repositoryRoot,driver[0])))});
const toolchain = candidate === "typescript" ? {node:process.version} : candidate === "python" ? {
  python:invoke([driver[0]], ["-I","-B","-c","import platform; print(platform.python_version())"]).stdout.trim(),
  distributions:JSON.parse(invoke([driver[0]], ["-I","-B","-c","import importlib.metadata as m,json; print(json.dumps({d.metadata['Name']:d.version for d in m.distributions()}))"]).stdout),
} : {compiler:invoke([candidate==="rust"?"rustc":"go"],[candidate==="rust"?"--version":"version"]).stdout.trim()};
const report={formatVersion:1,task:"NF-102-01",candidate,mappingId,recordedAt:new Date().toISOString(),pins,harnessRevision,sourceInventory,artifacts,toolchain,
  environment:{platform:process.platform,architecture:process.arch,kernel:os.release(),osVersion:process.platform==="darwin"?invoke(["sw_vers"],["-productVersion"]).stdout.trim():null,
    cpuModel:os.cpus()[0]?.model??null,cpuCount:os.cpus().length,cohort:"supplemental-native; not frozen target qualification"},
  library:{outerRuns:2,evaluationsPerCase:4,innerRepeatAndInputAssertion:"native library driver or direct TypeScript calls",rawResultSha256:rawHashes,
    passed:libraryResults.filter(r=>!r.errors.length).length,failed:libraryResults.filter(r=>r.errors.length).length,results:libraryResults},
  cli:{runsPerCase:2,passed:cliResults.filter(r=>!r.errors.length).length,failed:cliResults.filter(r=>r.errors.length).length,results:cliResults},
  limitations:{cliCommands:["validate","inspect"],cliProfiles:["discovery","schema","declared-only-inspection"],fullProjectSemanticConformance:"not-tested",coreAndExtensionProfileConformance:"not-tested",stablePublicApi:"not-established",
    nativeLibraryDetails:"retained, not portable; CLI forbids native detail fields",semanticLibraryToPublicCli:"not-implemented",targetLifecycle:"not-tested",isolationAndOffline:"not-tested",supplyChainClosure:"not-tested",performance:"not-tested"},
  architectureOutcome:"not-ready"};
const errors=reportErrors(report,catalog,pins);
assert.ok(outputFile,"output path required"); writeFileSync(outputFile,JSON.stringify(report,null,process.argv.includes("--compact")?undefined:2)+"\n");
console.log(JSON.stringify({candidate,library:report.library.passed,cli:report.cli.passed,cliTotal:cliResults.length,errors,failed:cliResults.filter(r=>r.errors.length).map(r=>({id:r.id,errors:r.errors,actual:r.actual}))},null,2));
process.exitCode=errors.length?1:0;
