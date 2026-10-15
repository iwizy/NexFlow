#!/usr/bin/env node
// Trusted collection tooling: public advisory retrieval is separate from builds.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { collect, sha } from "./runtime-supply-chain-repaired-collect.mjs";
import { scan } from "./runtime-supply-chain-repaired-scan.mjs";
import { sbomFor } from "./lib/supply-chain-evidence.mjs";

const config = JSON.parse(readFileSync(process.argv[2]));
const root = "evaluation/supply-chain/2026-10-15-repaired";
const records = collect(config);
const rebuildBytes=readFileSync(root+"/rebuild.json"),rebuild=JSON.parse(rebuildBytes);
assert.equal(rebuild.sourceRevision,config.sourceRevision);assert.equal(rebuild.runs.length,2);
const collectorFiles = ["scripts/runtime-supply-chain-repaired-collect.mjs", "scripts/runtime-supply-chain-repaired-run.mjs",
  "scripts/runtime-supply-chain-repaired-scan.mjs", "scripts/lib/supply-chain-python-repaired.py", "scripts/lib/supply-chain-evidence.mjs"];
for (const [id, record] of Object.entries(records)) {
  assert.equal(rebuild.repeatability[id].status,"byte-identical");assert.deepEqual(rebuild.runs[0].artifacts[id],rebuild.runs[1].artifacts[id]);
  for(const artifact of record.artifacts)assert.equal(artifact.sha256,rebuild.runs[0].artifacts[id].find(a=>a.file===artifact.file)?.sha256,"primary build differs from both clean rebuilds: "+id+"/"+artifact.file);
  record.reproducibleBuild="two-clean-roots-byte-identical";record.rebuildSha256=sha(rebuildBytes);
  record.reproducibilityScope="same supplemental native cohort, preprovisioned verified dependency caches; not cross-target or independently signed build attestation";
  record.collectorSources = collectorFiles.map(file => ({ file, sha256: sha(readFileSync(file)) }));
  record.baselineCandidateSource = "63c86bc4a010bdca79af8190a9a521838f421b75";
  const advisory = await scan(record);
  const bom = sbomFor(record);
  const folder = root + "/" + id;
  mkdirSync(folder, { recursive: true });
  const save = (file, value) => {
    const bytes = JSON.stringify(value, null, 2) + "\n";
    assert.ok(!/\/Users\/|\/private\/|file:\/\/|\/var\/folders\//iu.test(bytes), "private path in evidence");
    writeFileSync(folder + "/" + file, bytes);
    return sha(bytes);
  };
  record.sbomSha256 = save("sbom.cdx.json", bom);
  record.advisoriesSha256 = save("advisories.json", advisory);
  save("inventory.json", record);
  console.log(JSON.stringify({ candidate: id, components: record.components.length,
    queries: advisory.queryCount, advisoryRecords: advisory.advisoryCount }));
}

// Separate maintenance graph, never substituted for a candidate inventory.
const rootLock = JSON.parse(readFileSync("package-lock.json"));
const maintenance = { candidate: "maintenance", sourceRevision: config.sourceRevision,
  collectorRevision: records.typescript.collectorRevision,
  components: Object.entries(rootLock.packages).filter(([key]) => key).map(([key,p]) => ({
    ref: "pkg:npm/" + key.split("node_modules/").at(-1) + "@" + p.version,
    name: key.split("node_modules/").at(-1), version: p.version, ecosystem: "npm"
  })) };
const rootScan = await scan(maintenance);
writeFileSync(root + "/maintenance-advisories.json", JSON.stringify(rootScan, null, 2) + "\n");
console.log(JSON.stringify({ candidate: "maintenance", queries: rootScan.queryCount, advisoryRecords: rootScan.advisoryCount }));
