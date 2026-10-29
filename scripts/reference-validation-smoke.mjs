#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { arch, platform, release, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { baseline, digest, verifyCorpus } from "./lib/runtime-evaluation.mjs";
import { catalogErrors, compareLibraryResult } from "./lib/evaluation-library.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const library = path.join(root, "packages/validation");
const environment = { platform: platform(), architecture: arch(), kernelRelease: release(),
  osVersion: platform() === "darwin" ? execFileSync("sw_vers",["-productVersion"],{encoding:"utf8"}).trim()
    : platform() === "linux" ? readFileSync("/etc/os-release","utf8").match(/^VERSION_ID="?([^"\n]+)"?$/m)?.[1] ?? "unknown" : release() };
const npm = process.env.npm_execpath || fileURLToPath(new URL("../lib/node_modules/npm/bin/npm-cli.js", pathToFileURL(process.execPath)));
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
assert.equal(process.versions.node, "26.13.0", "Use the selected qualification runtime.");
assert.equal(JSON.parse(readFileSync(path.join(library, "package.json"))).engines.npm, run([npm, "--version"], root).trim());
assert.deepEqual(verifyCorpus(), []);
const catalogBytes = readFileSync(path.join(root, "evaluation/library-cases.json"));
const catalog = JSON.parse(catalogBytes);
assert.deepEqual(catalogErrors(catalog, baseline), []);
const scratch = realpathSync(mkdtempSync(path.join(tmpdir(), "nf-validation-package-")));
const consumer = path.join(scratch, "consumer");
mkdirSync(consumer);
const checks = [];
function check(name, body) { body(); checks.push({ name, result: "passed" }); }
function inventory(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name,"en")).flatMap(entry => {
    const rel = prefix + entry.name, absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? inventory(absolute, rel + "/") : [[rel, digest(readFileSync(absolute))]];
  });
}
let report;
try {
  // Two clean output builds, followed by two npm packs. No package is published.
  run(["scripts/build.mjs"], library);
  const firstBuild = inventory(path.join(library, "dist"));
  const firstPack = JSON.parse(run([npm, "pack", "--ignore-scripts", "--json", "--pack-destination", scratch], library))[0];
  const firstBytes = readFileSync(path.join(scratch, firstPack.filename));
  run(["scripts/build.mjs"], library);
  check("reproducible clean compiled payload", () => assert.deepEqual(inventory(path.join(library, "dist")), firstBuild));
  const packed = JSON.parse(run([npm, "pack", "--ignore-scripts", "--json", "--pack-destination", scratch], library))[0];
  const archive = path.join(scratch, packed.filename);
  check("reproducible npm tarball", () => assert.equal(digest(readFileSync(archive)), digest(firstBytes)));
  // Relocate the complete library tarball without retaining source-checkout paths.
  // This is extraction/import qualification, not the final CLI installation gate.
  const installed = path.join(consumer, "node_modules/@nexflow/validation");
  mkdirSync(installed, { recursive: true });
  execFileSync("tar", ["-xzf", archive, "--strip-components=1", "-C", installed]);
  writeFileSync(path.join(consumer, "package.json"), '{"type":"module","private":true}\n');
  const api = await import(pathToFileURL(path.join(installed, "dist/index.js")));
  const internalSchema = await import(pathToFileURL(path.join(installed, "dist/schema.js")));
  const internalSemantics = await import(pathToFileURL(path.join(installed, "dist/semantics.js")));
  run([path.join(library, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"], path.join(root,"packages/cli"));
  const adapterDirectory = path.join(consumer, "adapter"); mkdirSync(adapterDirectory);
  for (const file of ["files.js", "workspace.js"]) copyFileSync(path.join(root,"packages/cli/dist",file), path.join(adapterDirectory,file));
  const { readWorkspace } = await import(pathToFileURL(path.join(adapterDirectory, "workspace.js")));
  const schemas = internalSchema.repositorySchemas();
  const fixture = path.join(root,"fixtures/cli/valid/minimal-project");
  const validator = api.createValidator();
  const assembly = readWorkspace({ root: fixture });
  check("relocated public validation and declared inspection", () => {
    assert.deepEqual(assembly.diagnostics, []);
    assert.equal(validator.validateDocuments(assembly.documents).valid, true);
    const inspected = validator.inspectDocuments(assembly.documents);
    assert.equal(inspected.valid,true); assert.equal(inspected.result.inspection.mode,"declared-only");
    assert.equal(inspected.checks.semantic,"not-run");assert.equal(inspected.executionAuthorized,false);
  });
  check("public package exports no raw schema or semantic entry", () => {
    assert.deepEqual(Object.keys(api).sort(), ["apiVersion","checkAssociation","createValidator","parseSource","parseYaml","projectSources","schemaSnapshot"].sort());
    const code='import("@nexflow/validation/dist/schema.js").then(()=>process.exit(1),e=>process.exit(e.code==="ERR_PACKAGE_PATH_NOT_EXPORTED"?0:2))';
    assert.equal(spawnSync(process.execPath,["--input-type=module","-e",code],{cwd:consumer}).status,0);
  });
  check("all pinned schema bytes and local refs travel with package", () => {
    assert.equal(api.schemaSnapshot.schemas.length,18);
    for(const entry of api.schemaSnapshot.schemas)assert.equal(digest(readFileSync(path.join(installed,"dist/schemas",entry.file))),entry.sha256);
    assert.equal(new Set(assembly.documents.map(d=>d.kind)).size,3);
  });
  check("main entry import and validation do not call effect APIs", () => {
    const input=JSON.stringify(assembly.documents);
    const code=`import fs from 'node:fs';import net from 'node:net';import http from 'node:http';import https from 'node:https';import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';
      const deny=()=>{throw Error('effect API called')};
      const readModule=fs.readFileSync,openModule=fs.openSync,packageRoot=${JSON.stringify(installed + path.sep)};
      const moduleReadAllowed=file=>{
        const name=String(file).startsWith('file:')?fileURLToPath(String(file)):String(file);
        return name.startsWith(packageRoot)&&/\\.(?:c?js|json)$/.test(name)&&new Error().stack.includes('node:internal/modules/');
      };
      fs.readFileSync=(file,...args)=>moduleReadAllowed(file)?readModule(file,...args):deny();
      fs.openSync=(file,...args)=>moduleReadAllowed(file)?openModule(file,...args):deny();
      // Loading reviewed JS/JSON modules (including dependency meta-schemas) is
      // required; application-level data or caller-file reads are not permitted.
      for(const k of ['readdirSync','writeFileSync','mkdirSync','rmSync'])fs[k]=deny;
      for(const k of ['connect','createConnection','createServer'])net[k]=deny;
      for(const obj of [http,https])for(const k of ['get','request','createServer'])obj[k]=deny;
      for(const k of ['exec','execSync','execFile','execFileSync','spawn','spawnSync','fork'])cp[k]=deny;
      globalThis.fetch=deny;syncBuiltinESMExports();
      const api=await import('@nexflow/validation');const v=api.createValidator();
      const r=v.inspectDocuments(${input});if(!r.valid||r.executionAuthorized)process.exit(3);`;
    const child=spawnSync(process.execPath,["--input-type=module","-e",code],{cwd:consumer,encoding:"utf8",timeout:10000});
    assert.equal(child.status,0,child.stderr);
  });
  check("public declarations typecheck without checkout dependencies", () => {
    writeFileSync(path.join(consumer,"consumer.mts"),'import {createValidator,parseYaml,type ValidationResult} from "@nexflow/validation"; const r: ValidationResult=createValidator().validateManifest(parseYaml("key: value").value); if(r.executionAuthorized!==false)throw Error();\n');
    run([path.join(library,"node_modules/typescript/bin/tsc"),"--noEmit","--module","NodeNext","--moduleResolution","NodeNext","--target","ES2022","consumer.mts"],consumer);
  });
  check("caller inputs are repeatable and not mutated", () => {
    const before=JSON.stringify(assembly.documents);assert.deepEqual(validator.inspectDocuments(assembly.documents),validator.inspectDocuments(assembly.documents));assert.equal(JSON.stringify(assembly.documents),before);
    const changed=validator.inspectDocuments(assembly.documents);changed.result.documents.length=0;assert.equal(validator.validateDocuments(assembly.documents).result.documentCount,3);
  });
  check("JS accessors and cycles are rejected before evaluation", () => {
    let reads=0;const input={get kind(){reads++;return "Project";}};assert.equal(validator.validateManifest(input).valid,false);assert.equal(reads,0);
    const cycle={};cycle.self=cycle;assert.equal(validator.validateManifest(cycle).valid,false);
    const sparse=[];sparse.length=100001;const value=structuredClone(assembly.documents.find(d=>d.kind==="Project").value);value.extra=sparse;
    assert.equal(validator.validateManifest(value).status,"invalid");
  });
  check("unknown kind/version remain explicit unsupported without raw echo", () => {
    for(const value of [{specVersion:"0.1",kind:"PRIVATE_CANARY"},{specVersion:"PRIVATE_CANARY",kind:"Project"}]){const result=validator.validateManifest(value);assert.equal(result.status,"unsupported");assert.equal(JSON.stringify(result).includes("PRIVATE_CANARY"),false);}
  });
  check("duplicates and malformed YAML fail closed", () => {
    assert.equal(api.parseYaml("key: one\nkey: two\n").category,"duplicate-key");assert.equal(api.parseYaml("key: [PRIVATE_CANARY").valid,false);
    assert.equal(api.parseYaml("key: !!js/function >\n  console.log(1)\n").valid,false);
    const result=validator.validateDocuments([...assembly.documents,assembly.documents[0]]);assert.equal(result.valid,false);assert.equal(result.result,null);
  });
  check("diagnostics redact extra properties and preserve truncation failure", () => {
    const value=structuredClone(assembly.documents.find(d=>d.kind==="Project").value);value.project.description={PRIVATE_CANARY:"secret"};value.PRIVATE_CANARY="secret";
    const invalid=validator.validateManifest(value);assert.equal(invalid.valid,false);assert.equal(JSON.stringify(invalid).includes("PRIVATE_CANARY"),false);
    const huge={specVersion:"0.1",kind:"ActorSet",metadata:{project:"sample"},actors:Array.from({length:230},()=>({id:0}))};
    const result=validator.validateManifest(huge);assert.equal(result.valid,false);assert.equal(result.truncated,true);assert.equal(result.diagnostics.length,200);assert.equal(result.result,null);
  });
  check("unsafe workspace selections and empty root never fall back to cwd", () => {
    for(const selection of [{root:""},{root:fixture,project:""},{root:fixture,files:["../PRIVATE_CANARY.yaml"]},{root:fixture,files:["/PRIVATE_CANARY.yaml"]},{root:fixture,files:["project.yaml","project.yaml"]}]){
      const result=readWorkspace(selection);assert.ok(result.diagnostics.length);assert.equal(JSON.stringify(result.diagnostics).includes("PRIVATE_CANARY"),false);
    }
  });
  check("public source planning rejects unsafe locators without exposing values", () => {
    const project=structuredClone(assembly.documents.find(d=>d.kind==="Project"));project.value.manifests={actors:"https://PRIVATE_CANARY/actors.yaml"};
    const plan=api.projectSources(project);assert.equal(plan.sources.length,0);assert.ok(plan.diagnostics.length);assert.equal(JSON.stringify(plan).includes("PRIVATE_CANARY"),false);
  });
  check("root symlinks, non-regular files, invalid UTF-8 and byte limits reject", () => {
    const sources=path.join(scratch,"sources");mkdirSync(sources);
    writeFileSync(path.join(sources,"invalid.yaml"),Buffer.from([0xff]));
    writeFileSync(path.join(sources,"large.yaml"),Buffer.alloc(1024*1024+1,32));
    mkdirSync(path.join(sources,"directory.yaml"));
    symlinkSync(fixture,path.join(sources,"linked"),process.platform==="win32"?"junction":"dir");
    assert.ok(readWorkspace({root:path.join(sources,"linked")}).diagnostics.length);
    for(const file of ["invalid.yaml","large.yaml","directory.yaml"])assert.ok(readWorkspace({root:sources,files:[file]}).diagnostics.length);
  });
  // Full frozen catalog: no oracle fields are passed to an implementation.
  // Semantic/local-schema checks intentionally exercise package internals, not a
  // claimed public whole-project semantic API or arbitrary-schema override.
  const cases=catalog.cases.map(entry=>{
    const input={id:entry.id,operation:entry.operation,input:structuredClone(entry.input)};
    const before=JSON.stringify(input);
    const execute=()=>{
      const result={caseId:input.id,operation:input.operation,valid:false,diagnostics:[],checks:{runtime:"not-run",extensions:"not-run"}};
      if(input.operation==="yaml-parse"){const parsed=api.parseYaml(input.input.yaml);result.valid=parsed.valid;result.diagnostics=parsed.valid?[]:[{category:parsed.category}];}
      else if(input.operation==="local-schema"){result.diagnostics=new internalSchema.SchemaEngine(input.input.schemas).validateLocal(input.input.entryId,input.input.value);result.valid=!result.diagnostics.length;}
      else if(input.operation==="manifest-schema"){
        const parsed=api.parseYaml(readFileSync(path.join(root,input.input.file),"utf8"));
        result.diagnostics=parsed.valid?schemas.validateManifestValue(parsed.value):[{category:parsed.category}];result.valid=!result.diagnostics.length;
      }else if(input.operation==="discovery"){
        const args=input.input.args,selection={root:path.join(root,input.input.root)},files=[];
        for(let i=0;i<args.length;i+=2){if(args[i]==="--file")files.push(args[i+1]);else if(args[i]==="--project")selection.project=args[i+1];else throw Error("unsupported catalog argument");}
        if(files.length)selection.files=files;const found=readWorkspace(selection);result.valid=!found.diagnostics.length;result.diagnostics=found.diagnostics.map(({code})=>({code}));
        if(result.valid){result.documentCount=found.documents.length;result.workflowIds=found.documents.filter(d=>d.kind==="Workflow").map(d=>String(d.value.workflow.id)).sort();}
      }else{result.diagnostics=internalSemantics.semanticOperation(input.operation,input.input);result.valid=!result.diagnostics.length;}
      return result;
    };
    const first=execute(),second=execute();assert.deepEqual(first,second,input.id+": nondeterministic");assert.equal(JSON.stringify(input),before,input.id+": mutated input");
    const errors=compareLibraryResult(entry,first);return {id:entry.id,operation:entry.operation,result:errors.length?"failed":"passed",errors,repeatable:true,inputUnchanged:true};
  });
  assert.equal(cases.length,352);
  check("all 109 maintained example manifests pass the relocated public API", () => {
    const positives=catalog.cases.filter(e=>e.operation==="manifest-schema"&&e.expected.valid);assert.equal(positives.length,109);
    for(const entry of positives){const value=api.parseYaml(readFileSync(path.join(root,entry.input.file),"utf8")).value;assert.equal(validator.validateManifest(value,entry.input.file).valid,true,entry.id);}
  });
  check("pure import closure stays within the package and reviewed pure dependencies", () => {
    for(const file of readdirSync(path.join(library,"src")).filter(n=>n.endsWith(".ts")&&n!=="schema-data.ts")){
      const source=readFileSync(path.join(library,"src",file),"utf8");
      for(const match of source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g))assert.ok(match[1].startsWith("./")||["yaml","ajv/dist/2020.js","ajv-formats"].includes(match[1]),file+": "+match[1]);
      assert.doesNotMatch(source,/process\.(?:env|argv)|\b(?:fetch|eval|Function|require)\s*\(|import\s*\(/,file);
    }
  });
  check("frozen prototype sources, locks and corpus were not modified", () => {
    assert.deepEqual(verifyCorpus(),[]);assert.equal(digest(readFileSync(path.join(root,"evaluation/library-cases.json"))),digest(catalogBytes));
    const status=execFileSync("git",["diff","--name-only","80e58939be45c097cbda58f20bfeb47739324dcd","--","evaluation/prototypes","evaluation/library-cases.json","evaluation/baseline.json","schemas"],{cwd:root,encoding:"utf8"});assert.equal(status,"");
  });
  report={task:"NF-105",baselineRevision:"80e58939be45c097cbda58f20bfeb47739324dcd",environment,node:process.versions.node,npm:run([npm,"--version"],root).trim(),package:"@nexflow/validation",version:"0.5.0-alpha.1",
    recordedAt:new Date().toISOString(),verificationScriptSha256:digest(readFileSync(fileURLToPath(import.meta.url))),buildInventory:firstBuild,
    specificationRevision:baseline.specificationRevision,corpusSha256:baseline.corpus.sha256,catalogSha256:digest(catalogBytes),schemaSnapshotSha256:digest(readFileSync(path.join(library,"schema-snapshot.json"))),
    catalog:{total:cases.length,passed:cases.filter(r=>r.result==="passed").length,failed:cases.filter(r=>r.result==="failed").length,runsPerCase:2,results:cases},
    publicBoundaryChecks:checks,artifact:{sha256:digest(readFileSync(archive)),name:packed.filename,bytes:readFileSync(archive).length,reproduciblePayload:true,reproducibleTarball:true,relocatedEntry:true},
    coverage:"Catalog includes internal semantic-fragment/local-schema regressions and the read-only workspace facade. It does not mean all seven operations are a public API or complete project semantics.",
    notTested:["public CLI commands","full semantic/Core/extension conformance","native three-target lifecycle","signing/notarization","OS sandbox enforcement","current public-artifact advisory acceptance","release publication"]};
  const target=process.argv.indexOf("--report");if(target!==-1){assert.ok(process.argv[target+1]);writeFileSync(process.argv[target+1],JSON.stringify(report,null,2)+"\n");}
  console.log(JSON.stringify({task:report.task,catalogPassed:report.catalog.passed,catalogFailed:report.catalog.failed,publicBoundaryChecks:checks.length,relocatedEntry:true,reproduciblePayload:true,artifactSha256:report.artifact.sha256}));
  assert.deepEqual(cases.filter(r=>r.result==="failed"),[]);
}finally{rmSync(scratch,{recursive:true,force:true});}
