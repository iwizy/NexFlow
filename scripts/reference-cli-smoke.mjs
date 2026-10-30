#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir, platform, arch } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { parse, stringify } from "yaml";
import { graphManifestInspection } from "./lib/manifest-graph.mjs";
import { inspectManifestAssembly } from "./lib/manifest-inspection.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
assert.equal(process.versions.node,"26.13.0");
const npm=process.env.npm_execpath||fileURLToPath(new URL("../lib/node_modules/npm/bin/npm-cli.js",pathToFileURL(process.execPath)));
const hash=data=>createHash("sha256").update(data).digest("hex");
const runBuild=(args,cwd=root)=>execFileSync(process.execPath,args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
const npmVersion=runBuild([npm,"--version"]).trim();assert.equal(npmVersion,"11.20.0");
const typescriptVersion=JSON.parse(readFileSync(path.join(root,"packages/validation/node_modules/typescript/package.json"))).version;assert.equal(typescriptVersion,"6.0.3");
const scratch=realpathSync(mkdtempSync(path.join(tmpdir(),"nexflow-reference-cli-")));
const consumer=path.join(scratch,"consumer"),modules=path.join(consumer,"node_modules");
const staged=path.join(modules,"@nexflow/cli"),library=path.join(modules,"@nexflow/validation");
const deny=path.join(root,"scripts/test/no-runtime-deny.mjs"),readGuard=path.join(root,"scripts/test/reference-cli-read-guard.mjs");
const observations=[];
const fixture=path.join(root,"fixtures/cli/valid/minimal-project");
const schema=JSON.parse(readFileSync(path.join(root,"packages/cli/contracts/output.schema.json")));
const validate=new Ajv2020({strict:false,allErrors:true}).compile(schema);
function check(name,body){body();observations.push({name,result:"passed"});}
function tree(directory,prefix=""){
  return readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(e=>e.isDirectory()?tree(path.join(directory,e.name),prefix+e.name+"/"):e.isFile()?[[prefix+e.name,hash(readFileSync(path.join(directory,e.name)))]]:[]);
}
const inputsBefore=tree(path.join(root,"fixtures"));
const examplesBefore=tree(path.join(root,"examples"));
let packed,cliPayload;
try {
  runBuild(["scripts/build.mjs"],path.join(root,"packages/validation"));
  runBuild(["scripts/build.mjs"],path.join(root,"packages/cli"));
  cliPayload=tree(path.join(root,"packages/cli/dist"));
  runBuild(["scripts/build.mjs"],path.join(root,"packages/cli"));
  check("repeatable CLI compiled payload",()=>assert.deepEqual(tree(path.join(root,"packages/cli/dist")),cliPayload));
  packed=JSON.parse(runBuild([npm,"pack","--ignore-scripts","--offline","--cache",path.join(scratch,"npm-cache"),"--json","--pack-destination",scratch],path.join(root,"packages/validation")))[0];
  mkdirSync(library,{recursive:true});mkdirSync(staged,{recursive:true});
  execFileSync("tar",["-xzf",path.join(scratch,packed.filename),"--strip-components=1","-C",library]);
  for(const name of ["dist","contracts","package.json"])cpSync(path.join(root,"packages/cli",name),path.join(staged,name),{recursive:true});
  writeFileSync(path.join(consumer,"package.json"),'{"type":"module","private":true}\n');
  const entry=path.join(staged,"dist/main.js");
  function invoke(args,{readRoot=fixture,cwd=consumer,node=process.execPath,evalCode}={}){
    const launched=spawnSync(node,["--import",deny,"--import",readGuard,...(evalCode?["--input-type=module","-e",evalCode]:[entry,...args])],{
      cwd,encoding:"utf8",timeout:20000,maxBuffer:4*1024*1024,
      env:{...process.env,NEXFLOW_TEST_MODULE_ROOT:modules,NEXFLOW_TEST_READ_ROOT:readRoot??"",NEXFLOW_TEST_SECRET:"PRIVATE_CANARY"},
    });
    assert.equal(launched.error,undefined);assert.equal(launched.signal,null);assert.equal(launched.stderr,"",launched.stderr);
    assert.ok(launched.stdout.endsWith("\n"));assert.equal(launched.stdout.includes("PRIVATE_CANARY"),false);
    return launched;
  }
  function json(args,options){const child=invoke(args,options),value=JSON.parse(child.stdout);assert.ok(validate(value),JSON.stringify(validate.errors));assert.equal(child.status,value.exitCode);return {child,value};}
  const common=["--root",fixture,"--format","json"];
  const newCatalog=JSON.parse(readFileSync(path.join(root,"fixtures/reference-cli/index.json")));
  for(const item of newCatalog.grammarCases)check("grammar: "+item.id,()=>{
    const args=item.args.map(s=>s.replaceAll("$ROOT",fixture)),info=item.expected.command==="help"||item.expected.command==="version";
    const child=invoke(args,{readRoot:item.expected.exitCode===2||info?null:fixture});assert.equal(child.status,item.expected.exitCode);
    if(item.expected.format==="json"){const output=JSON.parse(child.stdout);assert.ok(validate(output),JSON.stringify(validate.errors));assert.equal(output.command,item.expected.command);}
    else {assert.ok(child.stdout.startsWith("NexFlow "));assert.doesNotMatch(child.stdout,/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u);}
  });
  // Exercise every old case through the new entry, preserving the catalog and
  // documenting only the frozen preview's discover/init/unsupported mapping.
  const legacy=JSON.parse(readFileSync(path.join(root,"fixtures/cli/index.json")));
  for(const item of legacy.cases)check("existing fixture: "+item.id,()=>{
    const selected=path.join(root,"fixtures/cli",item.root),deferred=["init","discover","run"].includes(item.command);
    const {value}=json([item.command,"--root",selected,...item.args,"--format=json"],{readRoot:deferred?null:selected});
    assert.equal(value.exitCode,deferred?2:item.expected.exitCode);
    const expected=deferred?["NEXFLOW-CLI-USAGE"]:item.expected.diagnosticCodes.filter(c=>!(item.expected.exitCode===3&&c==="NF-DISCOVERY-NO-PROJECT"));
    assert.deepEqual(value.diagnostics.map(d=>d.code).sort(),[...expected].sort());
    if(value.exitCode===0)assert.equal(value.result.documentCount,item.expected.documentCount);
  });
  const {readWorkspace}=await import(pathToFileURL(path.join(staged,"dist/workspace.js")));
  const projects=readdirSync(path.join(root,"examples"),{withFileTypes:true}).filter(e=>e.isDirectory()&&readdirSync(path.join(root,"examples",e.name)).includes("project.yaml"));
  assert.equal(projects.length,8);
  for(const project of projects){const selected=path.join(root,"examples",project.name);let inspection;
    for(const command of ["validate","inspect","graph"])check("maintained project: "+project.name+"/"+command,()=>{
      const {value}=json([command,"--root",selected,"--format=json"],{readRoot:selected});assert.equal(value.exitCode,0);
      if(command==="inspect")inspection=value.result.inspection;
      if(command==="graph")assert.deepEqual(value.result.graph,graphManifestInspection(inspection));
    });
    check("declared inspection parity: "+project.name,()=>{
      const selectedDocs=readWorkspace({root:selected});assert.deepEqual(selectedDocs.diagnostics,[]);
      const prior=inspectManifestAssembly({specVersion:"0.1",loadedDocuments:selectedDocs.documents.map(d=>({source:d.file,manifest:d.value}))});
      assert.equal(prior.valid,true);assert.deepEqual(inspection,prior.inspection);
    });
  }
  const multi=path.join(root,"fixtures/discovery/multi-workflow");
  check("Workflow scopes, source modes and static counts",()=>{
    const a=json(["graph","--root",multi,"--format=json"],{readRoot:multi}).value;
    const b=json(["graph","--root",multi,"--project=project.yaml","--format=json"],{readRoot:multi}).value;
    assert.deepEqual(a.result,b.result);
    const steps=a.result.graph.nodes.filter(n=>n.kind==="workflow-step");assert.equal(new Set(steps.map(n=>n.scope.id)).size,2);
    for(const edge of a.result.graph.edges.filter(e=>e.target.kind==="workflow-step"))assert.equal(edge.status,"resolved");
    assert.equal(a.result.graph.nodeCount,a.result.graph.nodes.length);assert.equal(a.result.graph.edgeCount,a.result.graph.edges.length);
  });
  check("repeatable JSON across cwd and reordered selected files",()=>{
    const a=json(["inspect",...common,"--file=actors.yaml","--file=agents.yaml","--file=project.yaml"]).child;
    const b=json(["inspect",...common,"--file=project.yaml","--file=actors.yaml","--file=agents.yaml"],{cwd:scratch}).child;assert.equal(a.stdout,b.stdout);
  });
  check("default text equals explicit text for every operation",()=>{
    for(const command of ["validate","inspect","graph"]){const args=[command,"--root",fixture];const a=invoke(args),b=invoke([...args,"--format=text"]);assert.equal(a.status,0);assert.equal(a.stdout,b.stdout);assert.ok(a.stdout.includes("No execution is authorized"));}
  });
  const mutation=path.join(scratch,"graph-scope");cpSync(multi,mutation,{recursive:true});
  const taskPath=path.join(mutation,"work/items.yml"),tasks=parse(readFileSync(taskPath,"utf8"));
  tasks.tasks=[{id:"duplicate",title:"One",status:"ready",owner:"human",acceptanceCriteria:["Reviewed"]},{id:"duplicate",title:"Two",status:"ready",owner:"human",acceptanceCriteria:["Reviewed"]},{id:"consumer",title:"Consumer",status:"ready",owner:"human",acceptanceCriteria:["Reviewed"],dependsOn:["duplicate","missing"]}];writeFileSync(taskPath,stringify(tasks));
  const workflowPath=path.join(mutation,"flows/release.yml"),workflow=parse(readFileSync(workflowPath,"utf8"));workflow.workflow.stages[0].steps[0].emits=["event."+"a".repeat(150)];writeFileSync(workflowPath,stringify(workflow));
  check("actual graph labels ambiguous, unresolved and redacted references",()=>{
    const {value}=json(["graph","--root",mutation,"--format=json"],{readRoot:mutation});assert.equal(value.exitCode,0);
    for(const status of ["ambiguous","unresolved","redacted"])assert.ok(value.result.graph.edges.some(e=>e.status===status),status);
    for(const edge of value.result.graph.edges.filter(e=>e.status==="ambiguous"))assert.equal(edge.candidates.length,2);
  });
  const malformed=path.join(scratch,"input-boundaries");cpSync(fixture,malformed,{recursive:true});
  check("unknown hints and mixed invalid/unsupported input precedence",()=>{
    const project=parse(readFileSync(path.join(malformed,"project.yaml"),"utf8"));project.manifests.PRIVATE_CANARY="other.yaml";writeFileSync(path.join(malformed,"project.yaml"),stringify(project));
    const hint=json(["validate","--root",malformed,"--format=json"],{readRoot:malformed}).value;assert.equal(hint.exitCode,3);
    writeFileSync(path.join(malformed,"unsupported.yaml"),'specVersion: "PRIVATE_CANARY"\nkind: Project\n');writeFileSync(path.join(malformed,"broken.yaml"),'key: [PRIVATE_CANARY');
    const mixed=json(["validate","--root",malformed,"--file=unsupported.yaml","--file=broken.yaml","--format=json"],{readRoot:malformed}).value;assert.equal(mixed.exitCode,1);assert.equal(mixed.result,null);
  });
  check("duplicate sources, unsafe locators and symlinked roots reject",()=>{
    for(const file of ["../PRIVATE_CANARY.yaml","/PRIVATE_CANARY.yaml","https://PRIVATE_CANARY/project.yaml","bad\u001bPRIVATE_CANARY.yaml"]){const {value}=json(["validate",...common,"--file",file]);assert.equal(value.exitCode,1);}
    const duplicate=json(["validate",...common,"--file=project.yaml","--file=project.yaml"]).value;assert.equal(duplicate.exitCode,1);
    const linked=path.join(scratch,"linked");symlinkSync(fixture,linked,platform()==="win32"?"junction":"dir");
    const {value}=json(["validate","--root",linked,"--format=json"],{readRoot:linked});assert.equal(value.exitCode,1);
  });
  check("byte, regular-file, duplicate-key and UTF-8 boundaries reject",()=>{
    const cases=[["large.yaml",Buffer.alloc(1024*1024+1,32)],["invalid.yaml",Buffer.from([255])],["duplicate.yaml","specVersion: '0.1'\nkind: Project\nkind: ActorSet\n"],["extra-doc.yaml","key: one\n---\nkey: two\n"],["tag.yaml","key: !!js/function body\n"]];
    for(const [name,data] of cases){writeFileSync(path.join(malformed,name),data);assert.equal(json(["validate","--root",malformed,"--file",name,"--format=json"],{readRoot:malformed}).value.exitCode,1);}
    mkdirSync(path.join(malformed,"directory.yaml"));assert.equal(json(["validate","--root",malformed,"--file=directory.yaml","--format=json"],{readRoot:malformed}).value.exitCode,1);
  });
  const huge=path.join(scratch,"projection-limit");cpSync(fixture,huge,{recursive:true});
  const actorData=parse(readFileSync(path.join(huge,"actors.yaml"),"utf8"));actorData.actors=Array.from({length:1001},(_,i)=>({id:"person-"+i,kind:"human",displayName:"Person",description:"Synthetic",roles:["reviewer"],responsibilities:["Review"]}));writeFileSync(path.join(huge,"actors.yaml"),stringify(actorData));
  check("projection limit fails without partial inspect or graph",()=>{
    for(const command of ["inspect","graph"]){const {value}=json([command,"--root",huge,"--format=json"],{readRoot:huge});assert.equal(value.exitCode,1);assert.equal(value.result,null);assert.ok(value.diagnostics.some(d=>d.code==="NEXFLOW-CLI-LIMIT"));}
  });
  check("bounded sorted diagnostics preserve truncation failure",()=>{
    actorData.actors=Array.from({length:230},()=>({id:0}));writeFileSync(path.join(huge,"actors.yaml"),stringify(actorData));
    const args=["validate","--root",huge,"--format=json"];const {child,value}=json(args,{readRoot:huge});assert.equal(value.exitCode,1);assert.equal(value.truncated,true);assert.equal(value.diagnostics.length,200);assert.equal(value.result,null);assert.equal(child.stdout,json(args,{readRoot:huge}).child.stdout);
  });
  check("Unicode code-point ordering precedes global diagnostic truncation",()=>{
    const selected=path.join(scratch,"unicode-order");mkdirSync(selected);
    const project=parse(readFileSync(path.join(fixture,"project.yaml"),"utf8"));delete project.manifests;writeFileSync(path.join(selected,"project.yaml"),stringify(project));
    for(const [file,kind,field] of [["\ue000.yaml","ActorSet","actors"],["\ud83d\ude00.yaml","AgentSet","agents"]])writeFileSync(path.join(selected,file),stringify({specVersion:"0.1",kind,metadata:{project:project.project.id},[field]:Array.from({length:230},()=>({id:0}))}));
    const {value}=json(["validate","--root",selected,"--file=\ud83d\ude00.yaml","--file=project.yaml","--file=\ue000.yaml","--format=json"],{readRoot:selected});
    assert.equal(value.exitCode,1);assert.equal(value.truncated,true);assert.equal(value.diagnostics.length,200);assert.ok(value.diagnostics.every(d=>d.file==="\ue000.yaml"));
  });
  check("installed package mismatch and missing dependency fail before project reads",()=>{
    const file=path.join(library,"package.json"),before=readFileSync(file,"utf8"),data=JSON.parse(before);data.version="0.5.0-alpha.999";writeFileSync(file,JSON.stringify(data));
    try{const {value}=json(["validate",...common],{readRoot:null});assert.equal(value.exitCode,4);assert.equal(value.diagnostics[0].code,"NEXFLOW-CLI-INTERNAL");}finally{writeFileSync(file,before);}
    renameSync(library,library+"-absent");try{assert.equal(json(["validate",...common],{readRoot:null}).value.exitCode,4);}finally{renameSync(library+"-absent",library);}
  });
  check("unsupported runtime metadata rejects before project reads",()=>{
    const evalCode=`Object.defineProperty(process.versions,'node',{value:'0.0.0'});process.argv=[process.execPath,${JSON.stringify(entry)},'validate',...${JSON.stringify(common)}];await import(${JSON.stringify(pathToFileURL(entry).href)});`;
    assert.equal(json([],{readRoot:null,evalCode}).value.exitCode,4);
  });
  check("closed schema rejects old formats, extra payload and false layer claims",()=>{
    const {value}=json(["graph",...common]);
    for(const alter of [v=>v.formatVersion="0.4-draft",v=>v.executionAuthorized=true,v=>v.checks.runtime="passed",v=>delete v.checks.projection,v=>delete v.result.graph,v=>v.command="validate",v=>v.result.PRIVATE_CANARY="hidden",v=>v.result.graph.nodes[0].PRIVATE_CANARY="hidden",v=>v.result.graph.edges[0].to=null,v=>v.result.graph.edges[0].status="ambiguous",v=>v.success=false]){const clone=structuredClone(value);alter(clone);assert.equal(validate(clone),false);}
  });
  check("runtime import closure uses only the public library and bounded built-ins",()=>{
    const expected={"arguments.ts":[],"graph.ts":["@nexflow/validation"],"output.ts":["@nexflow/validation","./arguments.js","./graph.js"],"runtime.ts":["node:fs","@nexflow/validation","./graph.js","./arguments.js","./output.js","./workspace.js"],"main.ts":["./output.js","./runtime.js"],"workspace.ts":["@nexflow/validation","./files.js"],"files.ts":["node:fs","node:path"]};
    for(const file of readdirSync(path.join(root,"packages/cli/src"))){const source=readFileSync(path.join(root,"packages/cli/src",file),"utf8");const imports=[...source.matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)].map(m=>m[1]);assert.deepEqual([...new Set(imports)].sort(),[...expected[file]].sort(),file);assert.doesNotMatch(source,/process\.env|\b(?:fetch|eval|Function|require)\s*\(|node:(?:child_process|net|http|https)|scripts\/lib|evaluation\/prototypes/,file);}
  });
  check("all maintained inputs and frozen implementations remain unchanged",()=>{
    assert.deepEqual(tree(path.join(root,"fixtures")),inputsBefore);assert.deepEqual(tree(path.join(root,"examples")),examplesBefore);
    const baseline=JSON.parse(readFileSync(path.join(root,"evaluation/baseline.json")));
    for(const item of baseline.corpus.files)assert.equal(hash(readFileSync(path.join(root,item.path))),item.sha256,item.path);
    assert.equal(execFileSync("git",["diff","--name-only","5ee82f536984d54997cf7e514d730dd9d8e75c2a","--","schemas","evaluation/prototypes","evaluation/library-cases.json","packages/validation","scripts/lib","scripts/contracts/cli-output.schema.json","fixtures/cli"],{cwd:root,encoding:"utf8"}),"");
  });
  const report={task:"NF-106",baseRevision:"5ee82f536984d54997cf7e514d730dd9d8e75c2a",recordedAt:new Date().toISOString(),node:process.versions.node,npm:npmVersion,typescript:typescriptVersion,environment:{platform:platform(),architecture:arch()},
    verifierSha256:hash(readFileSync(fileURLToPath(import.meta.url))),schemaSha256:hash(readFileSync(path.join(root,"packages/cli/contracts/output.schema.json"))),cliPayload,libraryTarballSha256:hash(readFileSync(path.join(scratch,packed.filename))),
    grammarCases:newCatalog.grammarCases.length,existingCatalogCases:legacy.cases.length,maintainedProjects:projects.length,observations,
    notTested:["final CLI tarball installation and bundled dependency closure","native three-target lifecycle","current artifact vulnerability acceptance","operating-system sandbox","release publication"],runtimeRejectionMethod:"synthetic runtime metadata fault injection, not native runtime qualification"};
  const option=process.argv.indexOf("--report");if(option!==-1)writeFileSync(process.argv[option+1],JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({task:report.task,passed:observations.length,grammarCases:report.grammarCases,existingCatalogCases:report.existingCatalogCases,maintainedProjects:report.maintainedProjects,relocatedEntry:true}));
}finally{rmSync(scratch,{recursive:true,force:true});}
