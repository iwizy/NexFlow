#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { digest, evidenceErrors, ids, sbomFor } from "./lib/supply-chain-evidence.mjs";
const pins = JSON.parse(readFileSync("evaluation/fidelity/source-pins.json"));
const clone = value => JSON.parse(JSON.stringify(value));
function synthetic() {
  const candidate = "typescript", pin = pins.candidates[candidate];
  const record = { task: "NF-056-11", candidate, ...pin, specificationRevision: pins.specificationRevision,
    evaluationPackageRevision: pins.evaluationPackageRevision, corpusSha256: pins.corpusSha256, catalogSha256: pins.catalogSha256,
    collectorRevision: "a".repeat(40), collectorVersion: "nf-056-11-v1", recordedAt: "2026-10-04T00:00:00Z",
    target: "macos/arm64", outcome: "not-ready", supplyChainAcceptance: "partial", signedProvenance: "not-tested",
    reproducibleBuild: "not-tested", distributionLifecycle: "not-tested", limitations: Array(6).fill("not-tested"),
    commands: ["reviewed build"], sourceManifest: [], artifacts: [{ file: "cli", sha256: "b".repeat(64) }],
    locks: [{ file: "package-lock.json", sha256: "b".repeat(64) }],
    components: [{ ref: "pkg:npm/synthetic@1.0.0", name: "synthetic", version: "1.0.0", ecosystem: "npm",
      scope: "installed-runtime", license: "NOASSERTION", metadataSource: "synthetic",
      licenseAssessment: "upstream-declared-not-legal-approval" }],
    dependencies: [{ ref: "candidate:typescript", dependsOn: ["pkg:npm/synthetic@1.0.0"] },
      { ref: "pkg:npm/synthetic@1.0.0", dependsOn: [] }] };
  const query = { package: { ecosystem: "npm", name: "synthetic" }, version: "1.0.0" };
  const scan = { candidate, sourceRevision: pin.sourceRevision, collectorRevision: record.collectorRevision,
    status: "completed", scannerVersion: "nf-056-11-osv-v1", apiVersion: "v1", fixesApplied: false,
    databaseVersion: "unavailable-live-service-no-snapshot-id", untested: Array(5).fill("not-tested"),
    startedAt: "2026-10-04T01:00:00Z", completedAt: "2026-10-04T01:00:01Z",
    queries: [{ query, refs: ["pkg:npm/synthetic@1.0.0"], matches: [] }],
    advisories: [], advisoryCount: 0, queryCount: 1, matchedPackageCount: 0,
    pages: [{ queries: [query], response: { results: [{}] }, responseSha256: "b".repeat(64) }] };
  return { record, scan, sbom: sbomFor(record) };
}
const initial = synthetic();
assert.deepEqual(evidenceErrors(initial.record, initial.scan, initial.sbom, pins), []);
const mutations = [
  r => r.record.sourceRevision = "b".repeat(40),
  r => r.record.corpusSha256 = "b".repeat(64),
  r => r.record.catalogSha256 = "b".repeat(64),
  r => r.record.collectorRevision = "uncommitted",
  r => r.record.supplyChainAcceptance = "passed",
  r => r.record.signedProvenance = "passed",
  r => r.record.distributionLifecycle = "passed",
  r => r.record.target = "linux/amd64",
  r => r.record.locks = [],
  r => r.record.artifacts[0].sha256 = "invalid",
  r => r.record.components[0].license = null,
  r => r.record.components.push(clone(r.record.components[0])),
  r => r.record.dependencies.pop(),
  r => r.record.dependencies[0].dependsOn.push("missing"),
  r => r.sbom.components = [],
  r => r.scan.status = "passed",
  r => r.scan.fixesApplied = true,
  r => r.scan.queries = [],
  r => r.scan.queries[0].query.version = "2.0.0",
  r => r.scan.advisoryCount = 1,
  r => r.scan.queries[0].matches.push({ id: "synthetic-advisory", modified: "2026-10-04T00:00:00Z" }),
  r => r.scan.pages = [],
  r => r.scan.pages[0].response.results[0].next_page_token = "unread-page",
  r => r.scan.completedAt = "2026-01-01T00:00:00Z",
  r => r.record.limitations.push("/Users/example/private")
];
for (const mutate of mutations) {
  const changed = clone(initial); mutate(changed);
  assert.ok(evidenceErrors(changed.record, changed.scan, changed.sbom, pins).length);
}
const match = clone(initial);
match.scan.queries[0].matches.push({ id: "synthetic-advisory", modified: "2026-10-04T00:00:00Z" });
match.scan.advisories.push({ id: "synthetic-advisory", url: "https://osv.dev/vulnerability/synthetic-advisory", sourceSha256: "c".repeat(64) });
match.scan.advisoryCount = 1; match.scan.matchedPackageCount = 1;
assert.deepEqual(evidenceErrors(match.record, match.scan, match.sbom, pins), []);
const files = ids.map(id => "evaluation/supply-chain/" + id + "/inventory.json");
if (files.some(existsSync)) {
  assert.ok(files.every(existsSync), "all four bundles are required");
  const revisions = new Set();
  for (const id of ids) {
    const root = "evaluation/supply-chain/" + id;
    const record = JSON.parse(readFileSync(root + "/inventory.json"));
    const scan = JSON.parse(readFileSync(root + "/advisories.json"));
    const sbom = JSON.parse(readFileSync(root + "/sbom.cdx.json"));
    assert.equal(record.candidate, id);
    assert.deepEqual(evidenceErrors(record, scan, sbom, pins), []);
    revisions.add(record.collectorRevision);
    for (const lock of record.locks) assert.equal(digest(readFileSync(lock.file)), lock.sha256);
    for (const source of record.sourceManifest) {
      const result = spawnSync("git", ["show", record.sourceRevision + ":" + source.file], { encoding: null });
      assert.equal(result.status, 0); assert.equal(digest(result.stdout), source.sha256);
    }
    for (const input of record.collectorSources) {
      assert.equal(digest(readFileSync(input.file)), input.sha256);
      const result = spawnSync("git", ["show", record.collectorRevision + ":" + input.file], { encoding: null });
      assert.equal(result.status, 0); assert.equal(digest(result.stdout), input.sha256);
    }
    assert.equal(record.sbomSha256, digest(readFileSync(root + "/sbom.cdx.json")));
    assert.equal(record.advisoriesSha256, digest(readFileSync(root + "/advisories.json")));
  }
  assert.equal(revisions.size, 1, "one committed collection source");
}
console.log("Supply-chain evidence consistency and " + (mutations.length + 2) + " control/rejection cases passed; no security approval.");
