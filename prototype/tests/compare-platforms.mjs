import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [directory, revision] = process.argv.slice(2);
assert.match(revision, /^[0-9a-f]{40}$/u);
const targets = ["linux-x64", "darwin-arm64", "win32-x64"];
const reports = targets.map(target => {
  const report = JSON.parse(readFileSync(join(directory, "offline-fixture-" + target, "admission.json"), "utf8"));
  assert.equal(report.revision, revision);
  assert.equal(report.platform + "-" + report.architecture, target);
  assert.equal(report.node, "26.13.1");
  assert.equal(report.npm, "11.20.0");
  assert.equal(report.typescript, "6.0.3");
  assert.equal(report.baselineCases, 66);
  assert.equal(report.caseCount, report.cases.length);
  assert.ok(report.caseCount > report.baselineCases);
  assert.ok(report.image && report.imageVersion && report.osRelease);
  return report;
});

const [baseline] = reports;
for (const report of reports.slice(1)) {
  assert.equal(report.baselineDigest, baseline.baselineDigest);
  assert.equal(report.validationArchiveSha256, baseline.validationArchiveSha256);
  assert.deepEqual(report.compatibility, baseline.compatibility);
  assert.deepEqual(report.cases, baseline.cases);
}

console.log(JSON.stringify({
  revision, caseCount: baseline.caseCount, baselineCases: baseline.baselineCases,
  targets: reports.map(({ platform, architecture, image, imageVersion, osRelease }) =>
    ({ platform, architecture, image, imageVersion, osRelease })),
}, null, 2));
