#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const read = file => readFileSync(file, "utf8");
const json = file => JSON.parse(read(file));
const sha256 = data => createHash("sha256").update(data).digest("hex");
const git = args => execFileSync("git", args, { encoding: "utf8" }).trim();
const directory = "release/0.7/";
const record = json(directory + "record.json");
const evidence = json(directory + "evidence.json");
const source = evidence.sourceRevision;
const criteria = ["namespace-ownership", "lifecycle-preservation", "integration-metadata",
  "mcp-boundaries", "a2a-boundaries", "extension-compatibility"];

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const valid = ajv.compile(json("release/candidate-readiness.schema.json"));
assert.ok(valid(record), JSON.stringify(valid.errors));
assert.equal(record.candidate.commit, source);
assert.equal(record.candidate.proposedTag, "v0.7.0");
assert.equal(record.decision.outcome, "ready-with-notes");
assert.deepEqual(record.blockers, []);
assert.equal(evidence.task, "NF-118");
assert.equal(evidence.scope.distribution, "repository-source");
assert.equal(evidence.scope.newExecutableIntegration, false);
assert.equal(evidence.scope.publicationAuthorized, false);
assert.equal(evidence.scope.personalReviewClaimed, false);
assert.equal(evidence.scope.independenceClaimed, false);
assert.deepEqual(evidence.releaseCriteria.map(item => item.id), criteria);
const plan = read("docs/release-plan.md").replace(/\s+/gu, " ");
for (const criterion of evidence.releaseCriteria) {
  assert.equal(criterion.status, "passed");
  assert.ok(plan.includes(criterion.criterion));
}

execFileSync("git", ["merge-base", "--is-ancestor", source, "HEAD"]);
assert.equal(git(["rev-parse", source + "^{tree}"]), evidence.sourceTree);
for (const input of evidence.sourceInputs) {
  const archived = execFileSync("git", ["show", source + ":" + input.path]);
  assert.equal(sha256(archived), input.sha256, input.path);
  assert.equal(sha256(readFileSync(input.path)), input.sha256, input.path);
}
for (const tree of evidence.implementationTrees) {
  assert.equal(git(["rev-parse", source + ":" + tree.path]), tree.tree);
  assert.equal(git(["rev-parse", evidence.previousMilestone.revision + ":" + tree.path]), tree.tree);
  assert.equal(git(["diff", "--name-only", source, "--", tree.path]), "", tree.path);
}
for (const input of evidence.reviewInputs) {
  assert.equal(sha256(readFileSync(input.path)), input.sha256, input.path);
}
for (const prerequisite of evidence.prerequisites) {
  execFileSync("git", ["merge-base", "--is-ancestor", prerequisite.mergeRevision, source]);
  assert.ok(prerequisite.ci.length >= 9);
  assert.ok(prerequisite.ci.every(run => run.sourceRevision === prerequisite.mergeRevision && run.conclusion === "success"));
}
assert.equal(evidence.candidateCI.length, 10);
assert.ok(evidence.candidateCI.every(run => run.sourceRevision === source && run.conclusion === "success"));
assert.equal(evidence.previousMilestone.tag, "v0.6.0");
assert.equal(evidence.previousMilestone.published, true);
assert.equal(evidence.profiles.length, 4);
for (const pin of evidence.profiles) {
  const profile = parse(read(pin.path));
  assert.equal(profile.namespace, pin.namespace);
  assert.equal(profile.profileVersion, pin.profileVersion);
  assert.equal(sha256(readFileSync(pin.path)), pin.sha256);
}

const checks = json(directory + "source-checks.json");
assert.equal(checks.sourceRevision, source);
assert.equal(checks.checks.length, 8);
assert.ok(checks.checks.every(check => check.exitCode === 0));
const retained = json(directory + "compatibility-results.json");
assert.equal(retained.revision, source);
assert.equal(retained.cases, 17);
assert.deepEqual(retained.commands, ["validate", "inspect", "graph"]);
assert.ok(retained.outcomes.every(item => item.executionAuthorized === false && item.extensionProfiles === "not-run"));
assert.ok(process.argv[2], "Supply the report from the current installed compatibility run");
const current = json(process.argv[2]);
assert.equal(current.revision, git(["rev-parse", "HEAD"]));
assert.equal(current.cases, retained.cases);
assert.deepEqual(current.outcomes, retained.outcomes);
assert.deepEqual(current.packages, retained.packages);
assert.deepEqual(current.commands, retained.commands);
assert.equal(evidence.security.sourceRevision, source);
assert.equal(evidence.security.outcome, "qualified-with-bounded-tooling-risks");
assert.deepEqual(evidence.security.unresolved, []);
assert.equal(evidence.security.graphs.length, 5);
assert.equal(evidence.security.policySha256, sha256(readFileSync("scripts/test/reference-security-policy.json")));

console.log(JSON.stringify({ task: "NF-118", outcome: record.decision.outcome,
  sourceRevision: source, reviewRevision: git(["rev-parse", "HEAD"]),
  criteria: criteria.length, sourceChecks: checks.checks.length,
  compatibilityCases: current.cases, installedCliRuns: current.cases * current.commands.length,
  publicationAuthorized: false }));
