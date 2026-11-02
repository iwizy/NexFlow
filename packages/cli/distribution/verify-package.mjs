import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const digest = data => createHash("sha256").update(data).digest("hex");
const relative = value => typeof value === "string" && value.length <= 512
  && !/[:\\\u0000-\u001f\u007f]/u.test(value)
  && value.split("/").every(part => part && part !== "." && part !== "..");
const json = file => { assert.ok(lstatSync(file).size <= 2 * 1024 * 1024); return JSON.parse(readFileSync(file,"utf8")); };

/** Verify an extracted, digest-selected package. This is not signature verification. */
export async function verifyPackage(directory) {
  assert.ok(!lstatSync(directory).isSymbolicLink());
  const root = realpathSync(directory), metadata = json(path.join(root,"package.json"));
  assert.ok(["@nexflow/cli","@nexflow/validation"].includes(metadata.name));
  assert.equal(metadata.version,"0.5.0-alpha.1");
  const inventory = json(path.join(root,"package-inventory.json"));
  assert.equal(inventory.formatVersion,"nexflow-package-inventory-v1");
  assert.equal(inventory.name,metadata.name);assert.equal(inventory.version,metadata.version);
  assert.match(inventory.sourceRevision,/^[a-f0-9]{40}$/u);
  assert.ok(inventory.files.length > 0 && inventory.files.length <= 4096);
  const expected = new Map();
  for(const entry of inventory.files) {
    assert.ok(relative(entry.path));assert.notEqual(entry.path,"package-inventory.json");
    assert.ok(!expected.has(entry.path));assert.match(entry.sha256,/^[a-f0-9]{64}$/u);
    expected.set(entry.path,entry);
  }
  let count=0,total=0,generatedNpmShims=0;
  const libraryRelative=metadata.name==="@nexflow/cli"?"node_modules/@nexflow/validation/":"";
  const shim=libraryRelative+"node_modules/.bin/yaml",shimTarget=path.join(root,libraryRelative,"node_modules/yaml/bin.mjs");
  function walk(directory,prefix="") {
    for(const name of readdirSync(directory).sort()) {
      const file=path.join(directory,name),rel=prefix+name,stat=lstatSync(file);
      if(stat.isSymbolicLink()) {
        // npm creates this one link during install; archives contain no links.
        assert.equal(rel,shim);assert.equal(readlinkSync(file),"../yaml/bin.mjs");
        assert.equal(realpathSync(file),shimTarget);assert.ok(lstatSync(shimTarget).isFile());
        generatedNpmShims++;continue;
      }
      if(stat.isDirectory()){walk(file,rel+"/");continue;}
      assert.ok(stat.isFile() && stat.nlink===1);assert.ok(++count<=4097);
      total+=stat.size;assert.ok(total<=32*1024*1024);
      if(rel==="package-inventory.json")continue;
      const entry=expected.get(rel);assert.ok(entry,"Unlisted package file");
      assert.equal(stat.size,entry.bytes);assert.equal(digest(readFileSync(file)),entry.sha256);
      if(process.platform!=="win32")assert.equal(Boolean(stat.mode&0o111),entry.executable);
      expected.delete(rel);
    }
  }
  walk(root);assert.equal(expected.size,0,"Missing package file");
  const info=json(path.join(root,"build-info.json"));assert.equal(info.sourceRevision,inventory.sourceRevision);
  const index=json(path.join(root,"schema-bundle.json"));
  const library=metadata.name==="@nexflow/cli" ? path.join(root,"node_modules/@nexflow/validation") : root;
  const require=createRequire(pathToFileURL(path.join(library,"package.json")));
  const Ajv2020=require("ajv/dist/2020.js"),addFormats=require("ajv-formats");
  const ajv=new Ajv2020({strict:false,allErrors:true});addFormats(ajv);
  const validate=ajv.compile(json(path.join(root,"contracts/schema-bundle.schema.json")));
  assert.ok(validate(index),"Invalid embedded schema index");
  assert.equal(index.source.revision,inventory.sourceRevision);assert.equal(index.artifactVersion,metadata.version);
  const snapshot=json(path.join(library,"dist/schema-snapshot.json"));
  assert.equal(info.schemaSnapshotRevision,snapshot.sourceRevision);
  const schemaRoot=metadata.name==="@nexflow/cli"?"schemas/0.1/":"dist/schemas/";
  const ids=new Set(),kinds=new Set(),paths=new Set();
  assert.deepEqual(index.schemas.map(e=>e.path),index.schemas.map(e=>e.path).sort());
  for(const item of index.schemas) {
    assert.ok(relative(item.path) && item.path.startsWith(schemaRoot));
    assert.ok(!ids.has(item.id) && !paths.has(item.path));ids.add(item.id);paths.add(item.path);
    const bytes=readFileSync(path.join(root,item.path));assert.equal(digest(bytes),item.sha256);
    const schema=JSON.parse(bytes);assert.equal(schema.$id,item.id);assert.equal(schema.$schema,index.jsonSchemaDialect);
    const pinned=snapshot.schemas.find(s=>s.file===path.posix.basename(item.path));
    assert.ok(pinned);assert.equal(item.sha256,pinned.sha256);
    assert.equal(digest(readFileSync(path.join(library,"dist/schemas",pinned.file))),pinned.sha256);
    if(item.role==="manifest") {
      assert.equal(schema.properties.kind.const,item.manifestKind);assert.ok(!kinds.has(item.manifestKind));
      kinds.add(item.manifestKind);assert.equal(schema.properties.specVersion.$ref,"common.schema.json#/$defs/specVersion");
    } else assert.equal(path.posix.basename(item.path),"common.schema.json");
    ajv.addSchema(schema);
  }
  assert.equal(ids.size,18);assert.equal(kinds.size,17);
  assert.deepEqual(json(path.join(root,schemaRoot,"common.schema.json")).$defs.specVersion.enum,[index.specVersion]);
  for(const id of ids)assert.ok(ajv.getSchema(id));
  for(const item of index.schemas) {
    function refs(value) {
      if(!value||typeof value!=="object")return;
      if(typeof value.$ref==="string") {
        const target=new URL(value.$ref,item.id);target.hash="";
        assert.ok(ids.has(target.href),"Schema reference outside the embedded closure");
      }
      Object.values(value).forEach(refs);
    }
    refs(json(path.join(root,item.path)));
  }
  const api=await import(pathToFileURL(path.join(library,"dist/index.js")));
  assert.equal(api.apiVersion,"validation-api-v1-preview");api.createValidator();
  return {name:metadata.name,version:metadata.version,sourceRevision:inventory.sourceRevision,
    files:count,generatedNpmShims,schemas:ids.size,manifestKinds:kinds.size,signatureVerified:false};
}

if(process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href===import.meta.url) {
  try {console.log(JSON.stringify(await verifyPackage(path.dirname(fileURLToPath(import.meta.url)))));}
  catch {console.error("Package integrity/schema verification failed.");process.exitCode=1;}
}
