#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import Ajv from "ajv";
import {digest} from "./lib/supply-chain-evidence.mjs";
const root="evaluation/supply-chain/2026-10-15-repaired",previous=JSON.parse(readFileSync("evaluation/supply-chain/sbom-validation.json"));
const ajv=new Ajv({strict:false,validateFormats:false,allErrors:true}),schemas=[];
for(const schema of previous.schemas){const response=await fetch(schema.url,{redirect:"error",signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);const bytes=await response.text();assert.equal(digest(bytes),schema.sha256);ajv.addSchema(JSON.parse(bytes));schemas.push(schema);}
const validate=ajv.getSchema("http://cyclonedx.org/schema/bom-1.6.schema.json"),results=[];assert.ok(validate);
const files=[...["typescript","python","rust","go"].map(id=>id+"/sbom.cdx.json"),...["npm","pip","rustCompiler","goCompiler","cargo","native"].map(id=>id+"-sbom.cdx.json")];
for(const file of files){const bytes=readFileSync(root+"/"+file),passed=validate(JSON.parse(bytes));assert.ok(passed,JSON.stringify(validate.errors));results.push({file,sbomSha256:digest(bytes),passed,errors:validate.errors});}
const collectorRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
writeFileSync(root+"/sbom-validation.json",JSON.stringify({task:"NF-102-02",recordedAt:new Date().toISOString(),collectorRevision,collectorSources:[{file:"scripts/runtime-supply-chain-sbom-validate.mjs",sha256:digest(readFileSync("scripts/runtime-supply-chain-sbom-validate.mjs"))}],validator:"Ajv",version:JSON.parse(readFileSync("node_modules/ajv/package.json")).version,scope:previous.scope,schemas,results},null,2)+"\n");
console.log("10 current CycloneDX SBOMs passed pinned official schema validation.");
