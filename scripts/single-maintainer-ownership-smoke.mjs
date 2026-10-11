#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, repositoryRoot } from "./lib/runtime-evaluation.mjs";

const read = file => readFileSync(path.join(repositoryRoot, file), "utf8");
const git = (...args) => execFileSync("git", args, {
  cwd: repositoryRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024
});
const recordPath = "rfcs/reviews/2026-10-11-single-maintainer-ownership.json";
const notePath = recordPath.replace(".json", ".md");
const bytes = read(recordPath), record = JSON.parse(bytes);
const person = "Alexander Agafonov";
const policyRevision = "2cd3b442d4549f0e5c1cd4c4363f9449796010df";
const mergeRevision = "f6a1f5cb26ea2c048d950039641a951b04e19db4";
const roles = ["cli", "validation", "runtime", "security", "dependencies", "release-ci", "signing-distribution"];
const nonblank = value => assert.ok(typeof value === "string" && value.trim());

// Consistency only: human authorization is described in the dated note, not
// discovered or manufactured by this checker. No technical review is inferred.
function assertRecord(value) {
  assert.equal(value.formatVersion, "1");
  assert.equal(value.task, "NF-101");
  assert.equal(value.recordedOn, "2026-10-11");
  assert.equal(value.status, "completed-single-maintainer");
  assert.equal(value.taskCompleted, true);
  assert.equal(value.outcome, "organizationally-complete");
  assert.equal(value.maintainer, person);
  assert.equal(value.reviewMode, "single-maintainer");
  assert.deepEqual(value.policyAdoption, {
    status: "accepted", acceptedBy: person, acceptedOn: "2026-10-11",
    pullRequest: "https://github.com/iwizy/NexFlow/pull/115",
    revision: policyRevision, mergeRevision, path: "docs/single-maintainer-governance.md",
    sha256: "8ed123b49f45dacb54acbafda6cacadd18432a860154258a89fd5fb9260a4eee"
  });
  assert.equal(value.decisionBasis.kind, "direct-maintainer-authorization-and-delegated-organization");
  assert.equal(value.decisionBasis.publicIdentifier, person);
  nonblank(value.decisionBasis.summary); nonblank(value.decisionBasis.scope);
  for (const field of ["privateConversationCopied", "otherPersonConsentInferred"]) assert.equal(value.decisionBasis[field], false);
  assert.equal(value.decisionBasis.cryptographicSignature, null);
  const assignment = value.reviewAssignment;
  assert.equal(assignment.person, person);
  assert.equal(assignment.status, "assigned");
  assert.deepEqual(assignment.lenses, ["architecture", "security"]);
  assert.equal(assignment.authorshipDeclaration, "author");
  nonblank(assignment.conflictsDeclaration);
  assert.equal(assignment.independenceClaimed, false);
  assert.equal(assignment.reviewInputRevision, mergeRevision);
  assert.deepEqual(assignment.completedReviews, []);
  assert.equal(assignment.scores, null); assert.equal(assignment.reviewSummary, null);
  assert.equal(assignment.nextTask, "NF-102");
  const support = value.supportPolicy;
  assert.equal(support.id, "pre-release-best-effort");
  assert.match(support.window, /no fixed hours, response deadline, availability guarantee or SLA/u);
  for (const field of ["dependencyUpdates", "incidentAuthority", "escalation", "continuityRisk", "targetSupportClaim"]) nonblank(support[field]);
  assert.equal(support.backup, "none");
  assert.equal(support.productSupportOffered, false);
  assert.equal(support.runtimeOnCallOffered, false);
  assert.deepEqual(value.owners.map(owner => owner.id), roles);
  for (const owner of value.owners) {
    assert.equal(owner.person, person); assert.equal(owner.status, "acknowledged");
    assert.equal(owner.acknowledgementBasis, "decisionBasis");
    assert.equal(owner.supportPolicy, support.id);
    assert.ok(Array.isArray(owner.acceptedObligations) && owner.acceptedObligations.length >= 2);
    owner.acceptedObligations.forEach(nonblank);
    assert.equal(owner.signingAuthority, owner.id === "signing-distribution" ? "unavailable-not-granted" : "not-applicable");
  }
  assert.equal(value.owners[2].scopeLimit, "design-only; implementation and on-call support not offered");
  assert.equal(value.owners[6].scopeLimit, "coordination-only; no certificate, key, notarization or target-provisioning authority supplied");
  assert.deepEqual(value.technicalDecision, {
    rfc: "rfcs/RFC-0023-runtime-architecture-decision.md", status: "Draft", outcome: "not-ready",
    architectureAccepted: false, technicalGatesWaived: false, reviewCompleted: false,
    candidateSelected: null, releaseReady: false, remainingTasks: ["NF-102", "NF-103"]
  });
  assert.equal(value.capabilityBlockers.length, 3); value.capabilityBlockers.forEach(nonblank);
  assert.equal(value.historicalRecord, "rfcs/reviews/2026-10-09-runtime-reviewer-ownership.json");
  nonblank(value.returnToIndependentReview);
  assert.deepEqual(value.authorization, {
    policyPullRequestMerge: "PR #115 only, explicitly authorized and completed",
    otherPullRequestsAutoMerge: false, runtimeImplementation: false, productionAccess: false,
    credentialProvisioning: false, signing: false, release: false
  });
}
assert.equal(bytes, JSON.stringify(record, null, 2) + "\n");
assertRecord(record);
const adoption = record.policyAdoption;
assert.equal(digest(git("show", `${policyRevision}:${adoption.path}`)), adoption.sha256);
assert.deepEqual(git("show", "-s", "--format=%P", mergeRevision).trim().split(" "),
  ["dc34aa786b4df9e7c20c04e35e58db612d057954", policyRevision]);
assert.equal(git("rev-parse", `${mergeRevision}^{tree}`), git("rev-parse", `${policyRevision}^{tree}`));
assert.match(read("rfcs/RFC-0024-single-maintainer-governance.md"), /^## Status\s+Accepted\b/mu);
assert.match(read(record.technicalDecision.rfc), /^## Status\s+Draft\b/mu);
const note = read(notePath);
for (const text of [policyRevision, mergeRevision, "NF-101 completed", "self-review, no independent assurance",
  "Backup: **none**", "no SLA", "NF-102", "NF-103", "not human identity"]) assert.ok(note.includes(text), text);

const mutations = [
  r => { r.reviewMode = "independent"; }, r => { r.policyAdoption.revision = "main"; },
  r => { r.policyAdoption.sha256 = "0".repeat(64); }, r => { r.policyAdoption.mergeRevision = policyRevision; },
  r => { r.decisionBasis.otherPersonConsentInferred = true; },
  r => { r.decisionBasis.cryptographicSignature = "invented"; },
  r => { r.reviewAssignment.person = "Second reviewer"; },
  r => { r.reviewAssignment.independenceClaimed = true; },
  r => { r.reviewAssignment.completedReviews = ["assumed"]; },
  r => { r.reviewAssignment.scores = [5]; }, r => { r.reviewAssignment.lenses.pop(); },
  r => { r.supportPolicy.window = "24/7 guaranteed"; },
  r => { r.supportPolicy.backup = "invented"; }, r => { r.supportPolicy.runtimeOnCallOffered = true; },
  r => { r.supportPolicy.productSupportOffered = true; }, r => { r.owners.pop(); },
  r => { r.owners[0].person = "Another person"; }, r => { r.owners[0].acceptedObligations = []; },
  r => { r.owners[1].status = "pending"; }, r => { r.owners[2].scopeLimit = "production"; },
  r => { r.owners[6].signingAuthority = "granted"; },
  r => { r.technicalDecision.architectureAccepted = true; },
  r => { r.technicalDecision.technicalGatesWaived = true; },
  r => { r.authorization.otherPullRequestsAutoMerge = true; }, r => { r.authorization.release = true; }
];
for (const mutate of mutations) {
  const changed = structuredClone(record); mutate(changed);
  assert.throws(() => assertRecord(changed));
}
console.log(`NF-101: adopted policy, one assigned human, seven bounded ownership roles and ${mutations.length} rejection controls; technical review/architecture/release remain separate.`);
