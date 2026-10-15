#!/usr/bin/env node
// Metadata/file evidence, not legal approval; never modifies candidate locks.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { sha } from "./runtime-supply-chain-current-collect.mjs";
const config=JSON.parse(readFileSync(process.argv[2]));
const root="evaluation/supply-chain/2026-10-15";
const json=f=>JSON.parse(readFileSync(f));
const rows=[];
const publicMetadata=new Map();
for(const candidate of ["typescript","python","rust","go"]){
  const inventory=json(root+"/"+candidate+"/inventory.json");
  for(const c of inventory.components){
    const row={candidate,ref:c.ref,declaredLicense:c.license,licenseFiles:c.licenseFiles??[],
      status:c.license==="NOASSERTION"?"unresolved":"upstream-declared-not-legal-approval"};
    if(candidate==="go"){
      const folder=join(config.goPath,"pkg/mod",c.name+"@"+c.version);
      row.licenseFiles=readdirSync(folder).filter(n=>/^(license|copying|notice)/iu.test(n)&&statSync(join(folder,n)).isFile())
        .map(n=>({file:n,sha256:sha(readFileSync(join(folder,n)))}));
      const expressions={"github.com/dlclark/regexp2":"MIT","github.com/santhosh-tekuri/jsonschema/v6":"Apache-2.0",
        "go.yaml.in/yaml/v3":"MIT AND Apache-2.0","gopkg.in/check.v1":"BSD-2-Clause"};
      row.reviewedExpression=expressions[c.name]??"BSD-3-Clause";
      assert.ok(row.licenseFiles.length,"missing Go license text");
      row.status="text-mapped-not-legal-approval";
    }
    if(candidate==="python"&&c.license==="NOASSERTION"){
      const url="https://pypi.org/pypi/"+encodeURIComponent(c.name)+"/"+encodeURIComponent(c.version)+"/json";
      if(!publicMetadata.has(url)){
        const response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:"error"});
        assert.equal(response.status,200,"public license metadata unavailable");
        const bytes=await response.text(), p=JSON.parse(bytes);
        publicMetadata.set(url,{url,sha256:sha(bytes),name:p.info.name,version:p.info.version,
          licenseExpression:p.info.license_expression??null,
          license:p.info.license&&p.info.license.length<160&&!p.info.license.includes("\n")?p.info.license:null,
          licenseClassifiers:p.info.classifiers.filter(s=>s.startsWith("License ::"))});
      }
      row.publicDeclaration=publicMetadata.get(url);
      row.status="upstream-metadata-collected-vendored-text-mapping-not-accepted";
      // Vendor metadata receipts are relative to its owner, not site-packages.
      row.mappingNote=c.owner?"Owner-relative receipts; no automatic package-to-license legal attribution.":"Installed wheel license receipts; declarations are not a distribution approval.";
    }
    rows.push(row);
  }
}
const graph=spawnSync(config.go,["mod","graph"],{cwd:"evaluation/prototypes/go",encoding:"utf8",
  env:{PATH:"/usr/bin:/bin",GOTOOLCHAIN:"local",GOPROXY:"off",GOSUMDB:"off",GOPATH:config.goPath,GOCACHE:config.goCache}});
assert.equal(graph.status,0);
const record={task:"NF-102-02",sourceRevision:config.sourceRevision,recordedAt:new Date().toISOString(),
  collectorRevision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),
  collectorSources:[{file:"scripts/runtime-supply-chain-license-collect.mjs",sha256:sha(readFileSync("scripts/runtime-supply-chain-license-collect.mjs"))}],
  rows,goSelectedModuleGraph:graph.stdout.trim().split("\n").map(line=>line.split(" ")),
  nodeTooling:json(root+"/node-tooling-inventory.json").components.map(c=>({ref:c.ref,declaredLicense:c.license,status:"upstream-declared-not-legal-approval"})),
  outcome:"partial-not-approved",remaining:["Python vendored component text mapping and distribution obligations require explicit disposition.",
    "Compiler-internal, interpreter-bundled and native/OS licensing closure is not established by file hashes or upstream declarations."]};
writeFileSync(root+"/licenses.json",JSON.stringify(record,null,2)+"\n");
console.log(JSON.stringify({candidateComponents:rows.length,pythonPublicDeclarations:publicMetadata.size,goTextMappings:8,outcome:record.outcome}));
