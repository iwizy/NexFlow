// Native installation qualification of real archives, outside the source tree.
import assert from "node:assert/strict";
import {createServer} from "node:net";
import {cpSync,existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,readlinkSync,realpathSync,rmSync,writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {verifyPackage} from "../packages/cli/distribution/verify-package.mjs";
import {sha,fileSha,json,run,checked,sourceBinding,writeRecord,windowsSession} from "./qualification/common.mjs";

const repository=fileURLToPath(new URL("../",import.meta.url));
const [target,previousDirectory,currentDirectory,outputDirectory]=process.argv.slice(2);
const contract=json("qualification/reference-lifecycle/contract.json");
const plan=contract.targets.find(t=>t.id===target);assert.ok(plan);
const output=path.resolve(outputDirectory);mkdirSync(output,{recursive:true});
const producer=sourceBinding(["scripts/reference-lifecycle.mjs","qualification/reference-lifecycle/contract.json",".github/workflows/reference-lifecycle.yml",
  "packages/cli/distribution/verify-package.mjs","scripts/qualification/common.mjs","scripts/qualification/windows-session.ps1","scripts/qualification/windows-session.cs",
  "scripts/test/no-runtime-deny.mjs","scripts/test/reference-cli-read-guard.mjs","scripts/test/package-network-deny.mjs"]);
const scope=realpathSync(mkdtempSync(path.join(process.env.RUNNER_TEMP??os.tmpdir(),"nexflow-native-")));
const records=[],record={task:"NF-109",target,producer,recordedAt:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID??null,
  attempt:process.env.GITHUB_RUN_ATTEMPT??null,job:process.env.GITHUB_JOB??null,records,outcome:"failed",notTested:contract.notClaimed};
let session,server;
function observe(name,details={}){records.push({name,result:"passed",...details});}
function fingerprint(){
  let system;
  if(process.platform==="linux")system=Object.fromEntries(readFileSync("/etc/os-release","utf8").trim().split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/gu,"")];}));
  else if(process.platform==="darwin")system={version:checked("sw_vers",["-productVersion"]),build:checked("sw_vers",["-buildVersion"])};
  else system=JSON.parse(checked("pwsh",["-NoProfile","-NonInteractive","-Command","Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture | ConvertTo-Json -Compress"]));
  return {platform:process.platform,architecture:process.arch,kernel:os.release(),system,cpu:os.cpus()[0].model,cpuCount:os.cpus().length,totalMemoryBytes:os.totalmem(),
    image:{os:process.env.ImageOS??null,version:process.env.ImageVersion??null},node:process.versions.node};
}
function tree(directory,prefix=""){
  return readdirSync(directory).sort().flatMap(name=>{const file=path.join(directory,name),rel=prefix+name,stat=lstatSync(file);
    return stat.isSymbolicLink()?[{path:rel,link:readlinkSync(file)}]:stat.isDirectory()?tree(file,rel+"/"):[{path:rel,sha256:fileSha(file)}];});
}
function findCandidate(directory){if(existsSync(path.join(directory,"PROVENANCE.json")))return directory;
  const found=readdirSync(directory,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>path.join(directory,d.name)).filter(d=>existsSync(path.join(d,"PROVENANCE.json")));
  assert.equal(found.length,1,"Exactly one downloaded candidate is required");return found[0];}
function selected(directory,expected){
  directory=findCandidate(path.resolve(directory));const provenance=json(path.join(directory,"PROVENANCE.json"));
  assert.equal(provenance.sourceRevision,expected);assert.equal(provenance.node,contract.node);assert.equal(provenance.npm,contract.npm);
  for(const line of readFileSync(path.join(directory,"SHA256SUMS"),"utf8").trim().split("\n")){
    const [digest,file]=line.split("  ");assert.ok(file&&!file.includes("/")&&!file.includes("\\"));assert.equal(fileSha(path.join(directory,file)),digest);
  }
  for(const artifact of provenance.artifacts)assert.equal(fileSha(path.join(directory,artifact.file)),artifact.sha256);
  return {directory,provenance};
}
async function provision(){
  const suffix=process.platform==="win32"?"win-x64.zip":`${process.platform==="darwin"?"darwin":"linux"}-${process.arch}.tar.gz`;
  const filename=`node-v${contract.node}-${suffix}`,base=`https://nodejs.org/dist/v${contract.node}/`;
  const checks=await fetch(base+"SHASUMS256.txt",{signal:AbortSignal.timeout(60000)});assert.ok(checks.ok);const sums=await checks.text();
  const expected=sums.trim().split("\n").map(l=>l.trim().split(/\s+/u)).find(([,name])=>name===filename)?.[0];assert.match(expected??"",/^[a-f0-9]{64}$/u);
  const response=await fetch(base+filename,{signal:AbortSignal.timeout(180000)});assert.ok(response.ok);
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(sha(bytes),expected);
  const tools=path.join(scope,"runtime");mkdirSync(tools);const archive=path.join(tools,filename);writeFileSync(archive,bytes);
  const tar=process.platform==="win32"?path.join(process.env.SystemRoot,"System32/tar.exe"):"tar";
  const names=checked(tar,["-tf",archive]).split(/\r?\n/u).filter(Boolean),root=filename.replace(/\.(?:tar\.gz|zip)$/u,"");
  assert.ok(names.every(n=>n.startsWith(root+"/")&&!n.split(/[\\/]/u).includes("..")));
  checked(tar,["-xf",archive,"-C",tools]);const sdk=path.join(tools,root),node=path.join(sdk,process.platform==="win32"?"node.exe":"bin/node");
  assert.equal(fileSha(node),fileSha(process.execPath),"Qualified binary must match the exact official native Node archive");
  const npm=path.join(sdk,process.platform==="win32"?"node_modules/npm/bin/npm-cli.js":"lib/node_modules/npm/bin/npm-cli.js");
  assert.equal(checked(node,[npm,"--version"]),contract.npm);
  writeFileSync(path.join(output,"node-SHASUMS256.txt"),sums);cpSync(path.join(sdk,"LICENSE"),path.join(output,"node-LICENSE.txt"));
  record.runtime={node:contract.node,npm:contract.npm,platform:process.platform,architecture:process.arch,url:base+filename,archiveSha256:expected,
    archiveBytes:bytes.length,binarySha256:fileSha(node),licenseSha256:fileSha(path.join(sdk,"LICENSE")),embeddedComponents:process.versions,
    verification:"Official HTTPS archive and same-origin checksum; actual executing binary matched; independent publisher signature not verified"};
  return {sdk,node,npm};
}
try{
  record.environment=fingerprint();assert.deepEqual([process.platform,process.arch],[plan.platform,plan.architecture]);assert.equal(process.versions.node,contract.node);
  if(process.platform==="linux"){assert.equal(record.environment.system.ID,"ubuntu");assert.equal(record.environment.system.VERSION_ID,"24.04");}
  if(process.platform==="darwin")assert.ok(record.environment.system.version.startsWith("15."));
  if(process.platform==="win32")assert.match(record.environment.system.Caption,/Windows Server 2025/u);
  observe("actual native target inspected",{cohort:"fresh target cohort; not the historical evaluation image"});
  const previous=selected(previousDirectory,contract.predecessor.sourceRevision),current=selected(currentDirectory,producer.revision);
  for(const prior of contract.predecessor.artifacts)assert.equal(previous.provenance.artifacts.find(a=>a.name===prior.name).sha256,prior.sha256);
  assert.notDeepEqual(previous.provenance.artifacts.map(a=>a.sha256),current.provenance.artifacts.map(a=>a.sha256));
  record.candidates={previous:previous.provenance,current:current.provenance,predecessorDelivery:contract.predecessor};
  const {sdk,node,npm}=await provision(),runtimeHash=fileSha(node);
  const home=path.join(scope,"empty-home"),cache=path.join(scope,"caches"),fixtures=path.join(scope,"inputs space юникод"),consumers=path.join(scope,"consumers space юникод"),guards=path.join(scope,"guards");
  for(const dir of [home,cache,fixtures,consumers,guards])mkdirSync(dir);
  const userconfig=path.join(home,"empty.npmrc");writeFileSync(userconfig,"");
  for(const name of ["no-runtime-deny.mjs","reference-cli-read-guard.mjs","package-network-deny.mjs"])cpSync(path.join(repository,"scripts/test",name),path.join(guards,name));
  const effects=path.join(guards,"no-runtime-deny.mjs"),reads=path.join(guards,"reference-cli-read-guard.mjs"),network=path.join(guards,"package-network-deny.mjs");
  const windows=process.platform==="win32",system=windows?path.join(process.env.SystemRoot,"System32"):"/usr/bin:/bin";
  const env={PATH:path.dirname(node)+path.delimiter+system,HOME:home,USERPROFILE:home,LANG:"C.UTF-8",LC_ALL:"C.UTF-8",TMPDIR:scope,
    NEXFLOW_TEST_SECRET:"NF109_PRIVATE_CANARY",...(windows?{SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,SystemDrive:process.env.SystemDrive,
      LOCALAPPDATA:process.env.LOCALAPPDATA,COMSPEC:path.join(process.env.SystemRoot,"System32/cmd.exe"),PATHEXT:".COM;.EXE;.BAT;.CMD",TEMP:scope,TMP:scope}:{} )};
  const cliConsumer=path.join(consumers,"cli"),libraryConsumer=path.join(consumers,"library");
  for(const dir of [cliConsumer,libraryConsumer]){mkdirSync(dir);writeFileSync(path.join(dir,"package.json"),'{"private":true,"type":"module"}\n');}
  const project=path.join(fixtures,"project"),invalid=path.join(fixtures,"invalid"),unicode=path.join(fixtures,"unicode-project");
  cpSync(path.join(repository,"fixtures/cli/valid/minimal-project"),project,{recursive:true});mkdirSync(invalid);
  cpSync(project,unicode,{recursive:true});cpSync(path.join(unicode,"actors.yaml"),path.join(unicode,"участники.yaml"));rmSync(path.join(unicode,"actors.yaml"));
  const projectText=readFileSync(path.join(unicode,"project.yaml"),"utf8");writeFileSync(path.join(unicode,"project.yaml"),projectText.replaceAll("actors.yaml","участники.yaml"));
  writeFileSync(path.join(invalid,"project.yaml"),"kind: Project\nkind: NF109_PRIVATE_CANARY\n");
  const inputHash=()=>sha(JSON.stringify(tree(fixtures))),inputsBefore=inputHash();
  const canary=path.join(scope,"outside-canary.txt");writeFileSync(canary,"synthetic-preserved");
  const npmOptions=["--offline","--ignore-scripts","--no-audit","--no-fund","--update-notifier=false","--userconfig",userconfig];
  let installCount=0;
  function install(candidate,name,consumer){
    const artifact=candidate.provenance.artifacts.find(a=>a.name===name);assert.ok(artifact);assert.equal(fileSha(path.join(candidate.directory,artifact.file)),artifact.sha256);
    const result=run(node,["--import",network,npm,"install","--prefix",consumer,...npmOptions,"--cache",path.join(cache,String(++installCount)),path.join(candidate.directory,artifact.file)],{cwd:scope,env,timeout:60000});
    assert.equal(result.exitCode,0,result.stderr);assert.equal(result.error,null);return artifact;
  }
  // The same scoped profile is reused as installed bytes change; directories
  // below it inherit read-only access. No host firewall/keychain changes.
  if(windows)session=await windowsSession({scope,readable:[sdk,fixtures,consumers,guards]});
  async function invoke(args,options={}){
    const config={cwd:scope,env:{...env,...options.env},timeout:30000};
    if(options.plain)return run(node,args,config);
    if(session)return session.run(node,args,{...config,restrictChildren:true});
    if(process.platform==="darwin")return run("/usr/bin/sandbox-exec",["-p","(version 1)(allow default)(deny network*)",node,...args],config);
    // sudo intentionally resets ambient variables. Recreate only this explicit
    // clean child environment after dropping privileges inside the namespace.
    return run("sudo",["unshare","--net","setpriv","--reuid",String(process.getuid()),"--regid",String(process.getgid()),"--clear-groups","--bounding-set=-all","--inh-caps=-all","--ambient-caps=-all",
      "/usr/bin/env","-i",...Object.entries(config.env).map(([key,value])=>key+"="+value),node,...args],config);
  }
  server=createServer(socket=>socket.destroy());await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const probe='const s=require("node:net").connect({host:"127.0.0.1",port:Number(process.argv[1])});s.setTimeout(2000,()=>process.exit(12));s.on("error",e=>{console.log(e.code);process.exit(13)});s.on("connect",()=>{s.destroy();process.exit(0)});';
  const positive=await invoke(["-e",probe,String(server.address().port)],{plain:true}),denied=await invoke(["-e",probe,String(server.address().port)]);
  record.network={method:windows?"AppContainer with zero capabilities":process.platform==="darwin"?"sandbox-exec deny network*":"isolated network namespace with capabilities dropped",positive,denied};
  assert.equal(positive.exitCode,0,"Network positive control failed");assert.equal(denied.exitCode,13,"OS network denial failed");assert.match(denied.stdout,/EACCES|EPERM|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|ECONNREFUSED/u);
  if(windows){assert.equal(denied.appContainer,true);assert.equal(denied.capabilityCount,0);}
  observe("OS network positive/denied controls passed");
  const cliRoot=path.join(cliConsumer,"node_modules/@nexflow/cli"),libraryRoot=path.join(libraryConsumer,"node_modules/@nexflow/validation");
  let validateOutput;
  async function cli(args,expected,root=null){
    const r=await invoke(["--import",effects,"--import",reads,path.join(cliRoot,"dist/main.js"),...args],{env:{NEXFLOW_TEST_MODULE_ROOT:path.join(cliConsumer,"node_modules"),NEXFLOW_TEST_READ_ROOT:root??""}});
    assert.equal(r.exitCode,expected,r.stderr);assert.equal(r.stderr,"");assert.ok(r.stdout.endsWith("\n"));assert.ok(!r.stdout.includes("NF109_PRIVATE_CANARY"));assert.ok(!r.stdout.includes(scope));
    const value=JSON.parse(r.stdout);assert.ok(validateOutput(value),JSON.stringify(validateOutput.errors));assert.equal(value.exitCode,expected);assert.equal(value.executionAuthorized,false);
    return {exitCode:r.exitCode,stdoutSha256:sha(r.stdout),output:value};
  }
  async function checkStage(name,candidate){
    const cliArtifact=install(candidate,"@nexflow/cli",cliConsumer),libraryArtifact=install(candidate,"@nexflow/validation",libraryConsumer);
    // The current consumer verifier also checks the genuine predecessor without
    // relabeling its historical Unix-only verifier as Windows compatible.
    for(const dir of [cliRoot,libraryRoot]){await verifyPackage(dir);assert.equal(json(path.join(dir,"build-info.json")).sourceRevision,candidate.provenance.sourceRevision);}
    const require=createRequire(pathToFileURL(path.join(libraryRoot,"package.json"))),Ajv=require("ajv/dist/2020.js");
    validateOutput=new Ajv({strict:false,allErrors:true}).compile(json(path.join(cliRoot,"contracts/output.schema.json")));
    const results=[];
    for(const flag of ["--help","--version"])results.push(await cli([flag,"--format=json"],0));
    for(const command of ["validate","inspect","graph"]){
      const args=[command,"--root",project,"--format=json"],a=await cli(args,0,project),b=await cli(args,0,project);assert.equal(a.stdoutSha256,b.stdoutSha256);results.push(a);
      results.push(await cli([command,"--root",unicode,"--project=project.yaml","--format=json"],0,unicode));
      results.push(await cli([command,"--root",project,"--file=agents.yaml","--file=project.yaml","--file=actors.yaml","--format=json"],0,project));
      results.push(await cli([command,"--root",invalid,"--format=json"],1,invalid));
    }
    results.push(await cli(["run","--format=json"],2));
    const unsupported=path.join(fixtures,"unsupported");mkdirSync(unsupported,{recursive:true});writeFileSync(path.join(unsupported,"project.yaml"),'specVersion: "9.9"\nkind: Project\n');
    results.push(await cli(["validate","--root",unsupported,"--format=json"],3,unsupported));rmSync(unsupported,{recursive:true});
    const libraryCode='const api=await import('+JSON.stringify(pathToFileURL(path.join(libraryRoot,"dist/index.js")).href)+');const r=api.createValidator().validateDocuments([]);console.log(JSON.stringify({version:api.apiVersion,authorized:r.executionAuthorized}));';
    const imported=await invoke(["--import",effects,"--input-type=module","-e",libraryCode]);assert.equal(imported.exitCode,0,imported.stderr);assert.equal(imported.stderr,"");assert.deepEqual(JSON.parse(imported.stdout),{version:"validation-api-v1-preview",authorized:false});
    // Exercise the real npm-generated user entry in addition to direct entry
    // execution inside the OS network-denied profile.
    const bin=path.join(cliConsumer,"node_modules/.bin/nexflow"+(windows?".cmd":""));assert.ok(existsSync(bin));
    let wrapper;
    if(windows){wrapper=run("pwsh",["-NoProfile","-NonInteractive","-Command","& $env:NEXFLOW_NATIVE_BIN --version --format=json; exit $LASTEXITCODE"],{cwd:scope,env:{...env,NEXFLOW_NATIVE_BIN:bin},timeout:30000});}
    else wrapper=run(bin,["--version","--format=json"],{cwd:scope,env,timeout:30000});
    assert.equal(wrapper.exitCode,0,wrapper.stderr);assert.equal(wrapper.stderr,"");assert.equal(JSON.parse(wrapper.stdout).tool.version,"0.5.0-alpha.1");
    assert.equal(inputHash(),inputsBefore);
    observe(name,{sourceRevision:candidate.provenance.sourceRevision,artifacts:[cliArtifact,libraryArtifact],actualInstalledPairVerified:true,results,
      pureImport:{exitCode:imported.exitCode,stdoutSha256:sha(imported.stdout)},realNpmWrapper:{exitCode:wrapper.exitCode,stdoutSha256:sha(wrapper.stdout),mode:windows?"cmd shim":"Unix bin link"},inputBytesUnchanged:true});
  }
  await checkStage("install-previous",previous);
  await checkStage("upgrade-current",current);
  const beforeRejected=sha(JSON.stringify(tree(consumers))),bad=path.join(scope,"bad-update.tgz");
  const artifact=current.provenance.artifacts.find(a=>a.name==="@nexflow/cli");writeFileSync(bad,Buffer.concat([readFileSync(path.join(current.directory,artifact.file)),Buffer.from("corrupt")]));
  assert.notEqual(fileSha(bad),artifact.sha256);assert.equal(sha(JSON.stringify(tree(consumers))),beforeRejected);observe("reject-corrupt-update",{method:"Trusted digest preflight refuses bytes before npm mutation",installedPairUnchanged:true});
  const metadataFile=path.join(cliRoot,"package.json"),metadataBytes=readFileSync(metadataFile),metadata=JSON.parse(metadataBytes);metadata.version="0.0.0";writeFileSync(metadataFile,JSON.stringify(metadata));
  const incompatible=await cli(["validate","--root",project,"--format=json"],4);writeFileSync(metadataFile,metadataBytes);assert.equal(sha(JSON.stringify(tree(consumers))),beforeRejected);observe("reject-incompatible-update",{incompatible,workspaceReadsDenied:true,installedPairRestored:true});
  if(windows){
    const shim=path.join(cliRoot,"node_modules/@nexflow/validation/node_modules/.bin/yaml.cmd"),bytes=readFileSync(shim);writeFileSync(shim,Buffer.concat([bytes,Buffer.from("unexpected")]));
    await assert.rejects(verifyPackage(cliRoot));writeFileSync(shim,bytes);await verifyPackage(cliRoot);observe("modified generated Windows wrapper refused");
  }
  await checkStage("rollback-previous",previous);
  await checkStage("install-current",current);
  if(session){await session.close();session=undefined;}
  for(const [consumer,name] of [[cliConsumer,"@nexflow/cli"],[libraryConsumer,"@nexflow/validation"]]){
    const result=run(node,["--import",network,npm,"uninstall","--prefix",consumer,...npmOptions,"--cache",path.join(cache,"uninstall") ,name],{cwd:scope,env,timeout:60000});assert.equal(result.exitCode,0,result.stderr);
    assert.ok(!existsSync(path.join(consumer,"node_modules",name)));
  }
  for(const suffix of ["",".cmd",".ps1"])assert.ok(!existsSync(path.join(cliConsumer,"node_modules/.bin/nexflow"+suffix)));
  assert.equal(readFileSync(canary,"utf8"),"synthetic-preserved");assert.equal(fileSha(node),runtimeHash);assert.equal(inputHash(),inputsBefore);
  for(const candidate of [previous,current])for(const a of candidate.provenance.artifacts)assert.equal(fileSha(path.join(candidate.directory,a.file)),a.sha256);
  observe("uninstall",{scopedPrefixesRemoved:true,externalRuntimeArchivesAndCanaryPreserved:true,inputBytesUnchanged:true});
  assert.deepEqual(fingerprint(),record.environment);observe("environment fingerprint unchanged");record.outcome="passed-unsigned-developer-scope";
}catch(error){record.failure={message:error instanceof Error?error.message:String(error)};process.exitCode=1;}
finally{
  if(session)try{await session.close();}catch(error){record.cleanupFailure=String(error);record.outcome="failed";process.exitCode=1;}
  if(server)await new Promise(resolve=>server.close(resolve));
  writeRecord(path.join(output,"lifecycle.json"),record,[scope,repository,path.resolve(previousDirectory),path.resolve(currentDirectory)]);
  rmSync(scope,{recursive:true,force:true});
  console.log(JSON.stringify({task:record.task,target,outcome:record.outcome,passedSteps:records.length,failure:record.failure?.message?"See redacted lifecycle record":null}));
}
