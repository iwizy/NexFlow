// Maintainer-side evidence collection; never imported by the delivered packages.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {extract,npm,repository,sha256} from "./reference-packages.mjs";

const option=name=>{const i=process.argv.indexOf(name);assert.ok(i>0&&process.argv[i+1]);return path.resolve(process.argv[i+1]);};
const candidate=option("--candidate"),out=option("--out");
assert.ok(!existsSync(out));mkdirSync(out,{recursive:true});
const read=file=>JSON.parse(readFileSync(file,"utf8"));
const write=(file,value)=>writeFileSync(path.join(out,file),JSON.stringify(value,null,2)+"\n");
// API object-key order is not advisory content. Preserve array order while
// recursively sorting keys before binding the reviewed response semantics.
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==="object"
  ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const digest=value=>sha256(Buffer.from(JSON.stringify(canonical(value))));
const provenance=read(path.join(candidate,"PROVENANCE.json"));
assert.equal(execFileSync("git",["status","--porcelain","--untracked-files=normal"],{cwd:repository,encoding:"utf8"}).trim(),"","Collect from a clean exact revision");
assert.equal(provenance.sourceRevision,execFileSync("git",["rev-parse","HEAD"],{cwd:repository,encoding:"utf8"}).trim());
assert.equal(process.versions.node,"26.13.0");
assert.equal(execFileSync(process.execPath,[npm,"--version"],{encoding:"utf8"}).trim(),"11.20.0");
const scratch=mkdtempSync(path.join(tmpdir(),"nexflow-inventory-"));
const graphs=[];
function ownFiles(directory,prefix="") {
  return readdirSync(directory).sort().filter(name=>name!=="node_modules").flatMap(name=>{
    const file=path.join(directory,name),rel=prefix+name,stat=lstatSync(file);
    if(stat.isSymbolicLink())return [{path:rel,type:"symlink"}];
    if(stat.isDirectory())return ownFiles(file,rel+"/");
    assert.ok(stat.isFile());return [{path:rel,bytes:stat.size,sha256:sha256(readFileSync(file))}];
  });
}
function installedGraph(name,root) {
  root=path.resolve(root);
  const entries=[];
  function visit(directory,relative) {
    const metadata=read(path.join(directory,"package.json"));
    const sourceRoot=!relative&&["maintenance","validation-build"].includes(name);
    const files=sourceRoot?[]:ownFiles(directory);
    const licenses=files.filter(f=>/(^|\/)(licen[sc]e|notice|copying|copyright)([.-]|$)/iu.test(f.path));
    assert.ok(sourceRoot||metadata.license||metadata.licenses,"Missing license metadata: "+metadata.name);
    // The first-party root's MIT file lives at repository level, not in source packages.
    if(name.startsWith("delivered-")&&relative)assert.ok(licenses.length,"Missing delivered license text: "+metadata.name);
    entries.push({id:name+":"+(relative||"."),path:relative||".",name:metadata.name,version:metadata.version??"unversioned",
      license:metadata.license??metadata.licenses??"MIT",licenses,licenseTextStatus:sourceRoot?"bound-by-source":licenses.length?"present":"absent-from-upstream-tool",files,integrity:metadata._integrity??null,
      lifecycleHooks:Object.keys(metadata.scripts??{}).filter(k=>/^(preinstall|install|postinstall)$/u.test(k)),
      nativeFiles:files.filter(f=>/\.(node|dll|so|dylib|exe)$/iu.test(f.path)).map(f=>f.path),
      dependencyNames:Object.keys({...metadata.dependencies,...(sourceRoot?metadata.devDependencies:{})}),optionalDependencyNames:Object.keys(metadata.optionalDependencies??{}),
      buildOnlyNames:Object.keys(metadata.devDependencies??{}),directory});
    const modules=path.join(directory,"node_modules");if(!existsSync(modules))return;
    for(const child of readdirSync(modules).sort()) {
      if(child.startsWith("."))continue;
      const names=child.startsWith("@")?readdirSync(path.join(modules,child)).sort().map(n=>child+"/"+n):[child];
      for(const dependency of names) {
        const dir=path.join(modules,dependency);
        if(existsSync(path.join(dir,"package.json")))visit(dir,(relative?relative+"/":"")+"node_modules/"+dependency);
      }
    }
  }
  visit(root,"");
  const byDirectory=new Map(entries.map(e=>[e.directory,e]));
  for(const entry of entries) {
    entry.dependencies=[];entry.absentDependencies=[];
    for(const dependency of new Set([...entry.dependencyNames,...entry.optionalDependencyNames])) {
      let directory=entry.directory,found;
      while(directory.startsWith(root)) {
        found=byDirectory.get(path.join(directory,"node_modules",dependency));if(found)break;
        if(directory===root)break;directory=path.dirname(directory);
      }
      if(found)entry.dependencies.push(found.id);
      else entry.absentDependencies.push({name:dependency,optional:entry.optionalDependencyNames.includes(dependency)});
    }
    assert.ok(entry.absentDependencies.every(d=>d.optional),"Incomplete installed graph: "+entry.id);
    delete entry.directory;
  }
  const graph={name,components:entries};graphs.push(graph);return graph;
}
async function request(url,body) {
  const response=await fetch(url,{method:body?"POST":"GET",headers:body?{"content-type":"application/json"}:{},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  assert.ok(response.ok,`${response.status} ${url}`);return response.json();
}
try {
  for(const artifact of provenance.artifacts) {
    assert.equal(sha256(readFileSync(path.join(candidate,artifact.file))),artifact.sha256);
    const dir=path.join(scratch,artifact.name.endsWith("/cli")?"cli":"validation");extract(path.join(candidate,artifact.file),dir);
    installedGraph(artifact.name.endsWith("/cli")?"delivered-cli":"delivered-library",dir);
  }
  // Root and validation build installations are intentionally separate graphs.
  installedGraph("maintenance",repository);
  installedGraph("validation-build",path.join(repository,"packages/validation"));
  installedGraph("npm-tool",path.resolve(path.dirname(npm),".."));
  // Source root files are already bound by the Git revision. Do not redistribute
  // a checkout inventory, local logs or other ignored development files.
  for(const graph of graphs.filter(g=>["maintenance","validation-build"].includes(g.name))) {
    graph.components[0].files=[];graph.components[0].licenses=[];
    graph.components[0].sourceFilesBoundBy=provenance.sourceRevision;
  }
  const locks=["package-lock.json","packages/validation/package-lock.json"].map(file=>({path:file,sha256:sha256(readFileSync(path.join(repository,file)))}));
  assert.deepEqual(locks,provenance.lockfiles);
  for(const [graphName,lockfile] of [["maintenance","package-lock.json"],["validation-build","packages/validation/package-lock.json"]]) {
    const lock=read(path.join(repository,lockfile)),graph=graphs.find(g=>g.name===graphName);
    for(const [location,item] of Object.entries(lock.packages).filter(([location])=>location)) {
      const installed=graph.components.find(c=>c.path===location);assert.ok(installed);assert.equal(installed.version,item.version);
      installed.integrity=item.integrity??null;installed.lockfile=lockfile;
    }
    assert.equal(graph.components.length,Object.keys(lock.packages).length);
  }
  const components=graphs.flatMap(g=>g.components),queries=[...new Map(components.filter(c=>!c.name.startsWith("@nexflow/")&&c.version!=="unversioned")
    .map(c=>[c.name+"@"+c.version,{package:{ecosystem:"npm",name:c.name},version:c.version}])).values()];
  // Node's separately embedded undici is not npm's affected undici copy.
  queries.push({package:{ecosystem:"npm",name:"undici"},version:process.versions.undici});
  queries.sort((a,b)=>(a.package.name+"@"+a.version).localeCompare(b.package.name+"@"+b.version));
  const pages=[],matches=[],advisories=new Map();
  for(let offset=0;offset<queries.length;offset+=80) {
    let pending=queries.slice(offset,offset+80);
    while(pending.length) {
      const response=await request("https://api.osv.dev/v1/querybatch",{queries:pending});
      assert.equal(response.results.length,pending.length);pages.push({queries:pending,response,responseSha256:digest(response)});
      const next=[];
      for(let i=0;i<pending.length;i++) {
        const query=pending[i],result=response.results[i];
        for(const vulnerability of result.vulns??[])matches.push({name:query.package.name,version:query.version,id:vulnerability.id});
        if(result.next_page_token)next.push({...query,page_token:result.next_page_token});
      }
      pending=next;assert.ok(pages.length<100,"Unexpected advisory pagination");
    }
  }
  for(const id of [...new Set(matches.map(m=>m.id))].sort()) {
    const response=await request("https://api.osv.dev/v1/vulns/"+encodeURIComponent(id));
    advisories.set(id,response);
  }
  write("osv-inputs.json",{endpoint:"https://api.osv.dev/v1/querybatch",recordedAt:new Date().toISOString(),pages});
  write("advisories.json",[...advisories].map(([id,response])=>({id,responseSha256:digest(response),response})));
  const policy=read(path.join(repository,"scripts/test/reference-security-policy.json"));
  const dispositions=[],unresolved=[];
  for(const graph of graphs)for(const component of graph.components)for(const match of matches.filter(m=>m.name===component.name&&m.version===component.version)) {
    const known=policy.dispositions.find(d=>d.graphs.includes(graph.name)&&d.name===component.name&&d.version===component.version&&d.advisories.includes(match.id));
    const record={graph:graph.name,component:component.id,...match,severity:advisories.get(match.id).database_specific?.severity??"unknown",
      disposition:known?.disposition??"requires-review",basis:known?.basis??null,limits:known?.limits??null};
    dispositions.push(record);
    if(!known||policy.reviewedAdvisorySha256[match.id]!==digest(advisories.get(match.id)))unresolved.push({...record,
      reason:known?"Advisory content changed since the applicability review":"Advisory requires an applicability review"});
  }
  for(const match of matches.filter(m=>m.name==="undici"&&m.version===process.versions.undici))unresolved.push({...match,graph:"external-node-runtime",disposition:"requires-review"});
  const sdk=path.resolve(path.dirname(process.execPath),".."),nodeLicense=path.join(sdk,"LICENSE");
  const runtime={name:"Node.js",version:process.versions.node,platform:process.platform,architecture:process.arch,components:process.versions,
    binarySha256:sha256(readFileSync(process.execPath)),licenseSha256:sha256(readFileSync(nodeLicense)),licenseBytes:lstatSync(nodeLicense).size,
    distribution:"external prerequisite, not redistributed in the candidate",upstreamIndex:"https://nodejs.org/dist/index.json",
    publisherSignature:"not independently verified",nativeCpeScan:"not-tested; npm OSV is not a complete native/OS vulnerability assessment"};
  const index=await request(runtime.upstreamIndex),line=index.filter(r=>r.version.startsWith("v26."));
  const selected=line.find(r=>r.version==="v26.13.0");assert.ok(selected);
  const security=line.find(r=>r.security);assert.ok(security);
  runtime.releaseReview={selected,latestLineSecurityRelease:security,review:"Selected release must not predate the latest known security release in this major line"};
  if(selected.date<security.date)unresolved.push({graph:"external-node-runtime",disposition:"newer-security-release-requires-review",release:security});
  write("node-release-input.json",{recordedAt:new Date().toISOString(),url:runtime.upstreamIndex,responseSha256:digest(index),response:index});
  writeFileSync(path.join(out,"node-license.txt"),readFileSync(nodeLicense));
  const bom={bomFormat:"CycloneDX",specVersion:"1.6",version:1,metadata:{timestamp:new Date().toISOString()},
    components:components.map(c=>({type:"library","bom-ref":c.id,name:c.name,version:c.version,
      ...(c.version!=="unversioned"?{purl:"pkg:npm/"+c.name.replace("@","%40")+"@"+c.version}:{}),
      licenses:[{license:{name:typeof c.license==="string"?c.license:JSON.stringify(c.license)}}],
      hashes:c.files.find(f=>f.path==="package.json")?[{alg:"SHA-256",content:c.files.find(f=>f.path==="package.json").sha256}]:[]})),
    dependencies:components.map(c=>({ref:c.id,dependsOn:c.dependencies}))};
  write("sbom.cdx.json",bom);write("dependency-inventory.json",{graphs,externalRuntime:runtime});
  const report={task:"NF-108",sourceRevision:provenance.sourceRevision,recordedAt:new Date().toISOString(),artifacts:provenance.artifacts,locks,
    scanner:{name:"OSV exact-version API",collectorVersion:1,responseHashMethod:"SHA-256 of recursively key-sorted JSON; array order preserved",collectorSha256:sha256(readFileSync(new URL(import.meta.url))),policySha256:sha256(readFileSync(path.join(repository,"scripts/test/reference-security-policy.json"))),
      limitations:"Dated advisory matches, not proof of absence; non-npm native/OS components require separate target qualification"},
    graphs:graphs.map(g=>({name:g.name,components:g.components.length,matchedAdvisoryInstances:dispositions.filter(d=>d.graph===g.name).length})),
    dispositions,unresolved,missingToolLicenseTexts:components.filter(c=>c.licenseTextStatus==="absent-from-upstream-tool").map(c=>({id:c.id,name:c.name,version:c.version,license:c.license,
      disposition:"metadata retained; external build tool is not redistributed; no claim that upstream supplied this text"})),outcome:unresolved.length?"requires-review":"qualified-with-bounded-tooling-risks",
    notTested:["independent audit","publisher signatures","OS sandbox and native target lifecycle","all upstream source code","non-npm native/CPE advisory coverage"]};
  write("security-report.json",report);
  const files=readdirSync(out).sort();writeFileSync(path.join(out,"SHA256SUMS"),files.map(f=>sha256(readFileSync(path.join(out,f)))+"  "+f+"\n").join(""));
  console.log(JSON.stringify({outcome:report.outcome,graphs:report.graphs,unresolved:unresolved.length}));
  assert.equal(unresolved.length,0,"New/changed security input requires explicit review; see security-report.json");
}finally{rmSync(scratch,{recursive:true,force:true});}
