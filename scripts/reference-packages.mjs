import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {chmodSync,copyFileSync,cpSync,existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath,pathToFileURL} from "node:url";
import {verifyPackage} from "../packages/cli/distribution/verify-package.mjs";

export const repository=fileURLToPath(new URL("../",import.meta.url));
export const sha256=bytes=>createHash("sha256").update(bytes).digest("hex");
const read=file=>JSON.parse(readFileSync(file,"utf8"));
const write=(file,value)=>writeFileSync(file,JSON.stringify(value,null,2)+"\n");
const run=(args,cwd=repository)=>execFileSync(process.execPath,args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"]});
export const npm=process.env.npm_execpath||fileURLToPath(new URL("../lib/node_modules/npm/bin/npm-cli.js",pathToFileURL(process.execPath)));
const npmRoot=path.resolve(path.dirname(npm),"..");
const require=createRequire(pathToFileURL(path.join(npmRoot,"package.json")));
const tar=require("tar");
assert.equal(require("tar/package.json").version,"7.5.22");
export function archiveEntries(file) {
  const entries=[],seen=new Set();let size=0;
  tar.t({file,sync:true,strict:true,onReadEntry:entry=>{
    assert.equal(entry.type,"File","Only regular files belong in candidate archives");
    assert.ok(entry.path.startsWith("package/") && !/[:\\\u0000-\u001f]/u.test(entry.path));
    assert.ok(entry.path.split("/").every(p=>p && p!=="." && p!==".."));
    assert.ok(!seen.has(entry.path));seen.add(entry.path);
    size+=entry.size;assert.ok(seen.size<=4096 && size<=32*1024*1024);
    assert.ok(entry.size<=2*1024*1024);assert.equal(entry.uid??0,0);assert.equal(entry.gid??0,0);
    entries.push({path:entry.path,bytes:entry.size});
  }});
  assert.ok(entries.length>0);return entries;
}
export function extract(file,directory) {
  archiveEntries(file);mkdirSync(directory,{recursive:true});
  tar.x({file,cwd:directory,strip:1,sync:true,strict:true,preserveOwner:false});
}
export function inventory(directory,prefix="") {
  return readdirSync(directory).sort().flatMap(name=>{
    const full=path.join(directory,name),rel=prefix+name,stat=lstatSync(full);
    assert.ok(!stat.isSymbolicLink());
    if(stat.isDirectory())return inventory(full,rel+"/");
    assert.ok(stat.isFile() && stat.nlink===1);
    return [{path:rel,bytes:stat.size,sha256:sha256(readFileSync(full)),executable:Boolean(stat.mode&0o111)}];
  });
}
const runtimeFiles={
  ajv:["dist"],"ajv-formats":["dist"],yaml:["dist","bin.mjs","util.js"],
  "fast-uri":["index.js","lib","types/index.d.ts"],
  "fast-deep-equal":["index.js","index.d.ts"],"json-schema-traverse":["index.js","index.d.ts"],
  "require-from-string":["index.js"],
};
function copy(source,destination) {
  assert.ok(!lstatSync(source).isSymbolicLink());mkdirSync(path.dirname(destination),{recursive:true});
  cpSync(source,destination,{recursive:true,dereference:false,errorOnExist:true,force:false});
}
function normalize(directory) {
  chmodSync(directory,0o755);
  for(const name of readdirSync(directory)){
    const file=path.join(directory,name),stat=lstatSync(file);assert.ok(!stat.isSymbolicLink());
    if(stat.isDirectory())normalize(file);else chmodSync(file,0o644);
  }
  if(existsSync(path.join(directory,"package.json"))) {
    const metadata=read(path.join(directory,"package.json"));
    for(const bin of typeof metadata.bin==="string"?[metadata.bin]:Object.values(metadata.bin??{})) {
      assert.ok(!path.isAbsolute(bin) && !bin.split(/[\\/]/u).includes(".."));
      const target=path.join(directory,bin);if(existsSync(target))chmodSync(target,0o755);
    }
  }
}
/** Build only from a clean exact revision; dependency acquisition is a separate step. */
export async function buildPackages(output) {
  assert.equal(process.versions.node,"26.13.1");assert.equal(run([npm,"--version"]).trim(),"11.20.0");
  const library=path.join(repository,"packages/validation"),cli=path.join(repository,"packages/cli");
  assert.equal(read(path.join(library,"node_modules/typescript/package.json")).version,"6.0.3");
  const git=args=>execFileSync("git",args,{cwd:repository,encoding:"utf8"}).trim();
  assert.equal(git(["status","--porcelain","--untracked-files=normal"]),"","Build from a clean revision");
  const revision=git(["rev-parse","HEAD"]);assert.match(revision,/^[a-f0-9]{40}$/u);
  output=path.resolve(output);assert.ok(!existsSync(output),"Use a new output directory");
  assert.ok(!output.startsWith(path.resolve(repository)+path.sep),"Keep candidates outside the source checkout");
  const scratch=mkdtempSync(path.join(tmpdir(),"nexflow-packages-"));
  const lock=read(path.join(library,"package-lock.json")),snapshot=read(path.join(library,"schema-snapshot.json"));
  const graph=Object.entries(lock.packages).filter(([name,entry])=>name&&!entry.dev);
  assert.deepEqual(graph.map(([name])=>name.replace("node_modules/","")).sort(),Object.keys(runtimeFiles).sort());
  const deps=graph.map(([name,entry])=>({name:name.replace("node_modules/",""),version:entry.version,integrity:entry.integrity,license:entry.license}));
  try {
    run(["scripts/build.mjs"],library);run(["scripts/build.mjs"],cli);
    mkdirSync(output,{recursive:true});
    const info={formatVersion:"nexflow-package-build-v1",sourceRevision:revision,
      schemaSnapshotRevision:snapshot.sourceRevision,specVersion:"0.1",node:"26.13.1",npm:"11.20.0",typescript:"6.0.3",tar:"7.5.22",
      lockfiles:["package-lock.json","packages/validation/package-lock.json"].map(file=>({path:file,sha256:sha256(readFileSync(path.join(repository,file)))})),
      buildCommand:"node scripts/reference-packages.mjs --out <new-output-directory>",
      installCommand:"npm install --prefix <empty-consumer> --offline --ignore-scripts --no-audit --no-fund --update-notifier=false --cache <empty-cache> <exact-local-tarball>",
      dependencies:deps,signatures:"not-provided",releaseStatus:"unreleased-candidate"};
    const artifacts=[];
    for(const [name,source] of [["validation",library],["cli",cli]]) {
      const stage=path.join(scratch,name);mkdirSync(stage);
      const metadata=read(path.join(source,"package.json"));delete metadata.scripts;delete metadata.devDependencies;
      metadata.files=["dist","contracts","schemas","schema-bundle.json","build-info.json","package-inventory.json","verify-package.mjs","LICENSE","NOTICE"];
      write(path.join(stage,"package.json"),metadata);
      copy(path.join(source,"dist"),path.join(stage,"dist"));
      copy(path.join(cli,"distribution/README.md"),path.join(stage,"README.md"));
      copy(path.join(cli,"contracts/schema-bundle.schema.json"),path.join(stage,"contracts/schema-bundle.schema.json"));
      copy(path.join(cli,"distribution/verify-package.mjs"),path.join(stage,"verify-package.mjs"));
      copy(path.join(repository,"LICENSE"),path.join(stage,"LICENSE"));
      if(name==="validation") {
        for(const dep of deps) {
          const from=path.join(library,"node_modules",dep.name),to=path.join(stage,"node_modules",dep.name),actual=read(path.join(from,"package.json"));
          assert.equal(actual.version,dep.version);
          for(const hook of ["preinstall","install","postinstall"])assert.ok(!actual.scripts?.[hook]);
          const legal=readdirSync(from).filter(n=>/^(?:licen[sc]e|notice|copying|copyright|readme)(?:\.|$)/iu.test(n));
          assert.ok(legal.some(n=>/^licen[sc]e/iu.test(n)));
          for(const file of ["package.json",...legal,...runtimeFiles[dep.name]])copy(path.join(from,file),path.join(to,file));
        }
      } else {
        copy(path.join(cli,"contracts/output.schema.json"),path.join(stage,"contracts/output.schema.json"));
        extract(path.join(output,artifacts[0].file),path.join(stage,"node_modules/@nexflow/validation"));
        for(const item of snapshot.schemas)copy(path.join(library,"dist/schemas",item.file),path.join(stage,"schemas/0.1",item.file));
      }
      const index={bundleFormatVersion:"0.1",kind:"NexFlowSchemaBundle",artifactVersion:metadata.version,specVersion:"0.1",
        jsonSchemaDialect:"https://json-schema.org/draft/2020-12/schema",source:{repository:"https://github.com/iwizy/NexFlow",revision},
        schemas:snapshot.schemas.map(item=>{
          const schema=read(path.join(library,"dist/schemas",item.file)),kind=schema.properties?.kind?.const;
          return {path:(name==="cli"?"schemas/0.1/":"dist/schemas/")+item.file,id:schema.$id,role:kind?"manifest":"definitions",...(kind?{manifestKind:kind}:{}),sha256:item.sha256};
        }).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)};
      write(path.join(stage,"schema-bundle.json"),index);write(path.join(stage,"build-info.json"),info);
      writeFileSync(path.join(stage,"NOTICE"),"NexFlow unreleased validation-only preview. MIT license: see LICENSE.\n"
        +"Bundled production dependencies retain their original package metadata and license texts.\n"
        +deps.map(d=>`${d.name} ${d.version} (${d.license}): ${name==="cli"?"node_modules/@nexflow/validation/":""}node_modules/${d.name}/`).join("\n")+"\n"
        +"No publisher signature, native runtime or OS lifecycle acceptance is implied.\n");
      normalize(stage);if(name==="cli")chmodSync(path.join(stage,"dist/main.js"),0o755);
      write(path.join(stage,"package-inventory.json"),{formatVersion:"nexflow-package-inventory-v1",name:metadata.name,version:metadata.version,sourceRevision:revision,files:inventory(stage)});
      chmodSync(path.join(stage,"package-inventory.json"),0o644);
      await verifyPackage(stage);
      const packed=JSON.parse(run([npm,"pack","--update-notifier=false","--offline","--ignore-scripts","--cache",path.join(scratch,"cache"),"--json","--pack-destination",output],stage))[0];
      const archive=path.join(output,packed.filename),entries=archiveEntries(archive);
      const extracted=path.join(scratch,name+"-extracted");extract(archive,extracted);
      await verifyPackage(extracted);
      const indexFile=packed.filename.replace(/\.tgz$/u,".schemas.json");copyFileSync(path.join(stage,"schema-bundle.json"),path.join(output,indexFile));
      artifacts.push({name:metadata.name,version:metadata.version,file:packed.filename,sha256:sha256(readFileSync(archive)),bytes:lstatSync(archive).size,
        schemaIndex:indexFile,schemaIndexSha256:sha256(readFileSync(path.join(output,indexFile))),files:entries.length,
        inventorySha256:sha256(readFileSync(path.join(stage,"package-inventory.json")))});
    }
    const provenance={...info,artifacts};write(path.join(output,"PROVENANCE.json"),provenance);
    const files=readdirSync(output).sort();
    writeFileSync(path.join(output,"SHA256SUMS"),files.map(file=>`${sha256(readFileSync(path.join(output,file)))}  ${file}\n`).join(""));
    return provenance;
  } catch(error) {rmSync(output,{recursive:true,force:true});throw error;}
  finally {rmSync(scratch,{recursive:true,force:true});}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,4);assert.equal(process.argv[2],"--out");
  const result=await buildPackages(process.argv[3]);console.log(JSON.stringify({sourceRevision:result.sourceRevision,artifacts:result.artifacts}));
}
