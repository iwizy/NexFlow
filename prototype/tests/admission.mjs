import assert from "node:assert/strict";
import { release as osRelease } from "node:os";
import { fileURLToPath } from "node:url";
import { compatibility, createFixtureHost } from "../dist/host/src/index.js";
import { fixtureDocuments, fixtureFacts, fixtureRequest } from "./fixture.mjs";

// Load test code first, then deny application reads with no manifest root.
process.env.NEXFLOW_TEST_MODULE_ROOT = fileURLToPath(new URL("../..", import.meta.url));
delete process.env.NEXFLOW_TEST_READ_ROOT;
await import("../../scripts/test/reference-cli-read-guard.mjs");

const cases = [];

function harness(request = fixtureRequest(), options = {}) {
  const facts = fixtureFacts(request);
  const host = createFixtureHost({ compatibility, readFacts: () => facts, ...options });
  return { facts, host, request };
}

function record(name, host, result, extra = {}) {
  const evidence = host.evidence();
  const text = JSON.stringify({ result, evidence });
  assert.doesNotMatch(text, /fixture-secret|absolute-machine-path|Synthetic fixture actor|approvalGate|manifests|expiresAt/u);
  cases.push({ name, result, ...evidence, ...extra });
}

function refused(name, host, request, state, reason) {
  const preflight = host.preflight(request);
  assert.equal(preflight.state, state, name);
  assert.equal(preflight.reason, reason, name);
  const result = host.runFixture(request);
  assert.equal(result.state, "denied", name);
  assert.equal(result.receipt.reason, reason, name);
  assert.equal(host.evidence().adapterCalls, 0, name);
  record(name, host, result, { preflight });
}

{
  const { host, request } = harness();
  const before = structuredClone(request);
  const preflight = host.preflight(request);
  assert.equal(preflight.state, "ready");
  assert.deepEqual(host.evidence(), { adapterCalls: 0, receipts: [], outcomeGaps: [] });
  request.manifests.reverse();
  assert.deepEqual(host.preflight(request), preflight);
  const result = host.runFixture(request);
  assert.equal(result.state, "completed");
  assert.equal(result.value, "sample record");
  assert.equal(host.evidence().adapterCalls, 1);
  const receipts = host.evidence().receipts;
  assert.deepEqual(receipts.map(receipt => receipt.stage), ["intent", "outcome"]);
  assert.deepEqual(receipts[0].scope, receipts[1].scope);
  assert.equal(receipts[0].policyEpoch, receipts[1].policyEpoch);
  assert.deepEqual(structuredClone(request.manifests.reverse()), before.manifests);
  record("approved fixture with reordered input", host, result, { preflight });

  const replay = host.runFixture(request);
  assert.equal(replay.receipt.reason, "attempt-duplicate");
  const changed = fixtureDocuments();
  changed["project.yaml"].project.description = "Another revision";
  const conflict = host.runFixture(fixtureRequest(1, changed));
  assert.equal(conflict.receipt.reason, "attempt-conflict");
  assert.equal(host.evidence().adapterCalls, 1);
  record("duplicate and conflicting attempt IDs", host, conflict, { replay });
}

for (const [name, field, value, reason] of [
  ["unknown override", "override", null, "override-unknown"],
  ["blocked override", "override", "block_action", "override-block-action"],
  ["override revocation", "override", "revoke_approval", "override-revoke-approval"],
  ["unknown clock", "now", null, "clock-unknown"],
  ["expiry boundary", "now", 200, "approval-expired"],
  ["after expiry", "now", 201, "approval-expired"],
  ["unknown epoch", "policyEpoch", null, "policy-unknown"],
  ["unknown actor", "actor", null, "actor-unknown"],
  ["wrong actor", "actor", "fixture-reviewer", "actor-mismatch"],
  ["unknown capability", "capabilityAvailable", null, "capability-unknown"],
  ["unavailable capability", "capabilityAvailable", false, "capability-unavailable"],
  ["unknown adapter", "adapterAvailable", null, "adapter-unknown"],
  ["inactive adapter", "adapterAvailable", false, "adapter-unavailable"],
  ["unknown budget", "budgetAvailable", null, "budget-unknown"],
  ["unavailable budget", "budgetAvailable", false, "budget-unavailable"],
  ["unknown approval", "approval", null, "approval-unknown"],
]) {
  const { host, request, facts } = harness();
  facts[field] = value;
  refused(name, host, request, "blocked", reason);
}

for (const state of ["requested", "rejected", "changes_requested", "expired", "revoked", "superseded"]) {
  const { host, request, facts } = harness();
  facts.approval.state = state;
  refused("approval " + state, host, request, "blocked", "approval-" + state);
}
for (const [name, field, value] of [
  ["wrong reviewer", "reviewer", "fixture-requester"],
  ["wrong gate", "gate", "fixture-resume"],
  ["wrong epoch", "policyEpoch", 2],
  ["wrong operation", "operation", { resource: "another-record" }],
]) {
  const { host, request, facts } = harness();
  facts.approval[field] = value;
  refused(name, host, request, "blocked", "approval-scope-mismatch");
}

for (const [name, mutate, state, reason] of [
  ["missing allow", docs => { docs["permissions.yaml"].permissions[0].subjects = ["fixture-reviewer"]; }, "blocked", "permission-missing"],
  ["deny takes precedence", docs => {
    const allow = docs["permissions.yaml"].permissions[0];
    docs["permissions.yaml"].permissions.push({ ...allow, id: "fixture-deny", effect: "deny" });
  }, "blocked", "permission-denied"],
  ["unknown policy", docs => { docs["project.yaml"].project.policies.extra = true; }, "unsupported", "policy-unsupported"],
  ["wrong dialect", docs => { docs["project.yaml"].specVersion = "0.2"; }, "unsupported", "version-unsupported"],
  ["unknown capability declaration", docs => { docs["capabilities.yaml"].capabilities[0].id = "another_capability"; }, "blocked", "capability-unavailable"],
  ["unbound source", docs => { docs["project.yaml"].manifests.actors = "another.yaml"; }, "invalid", "manifest-invalid"],
]) {
  const docs = fixtureDocuments();
  mutate(docs);
  const { host, request } = harness(fixtureRequest(1, docs));
  refused(name, host, request, state, reason);
}

{
  const { host, request } = harness();
  const file = request.manifests[0];
  const edited = JSON.parse(file.bytes.toString());
  edited.project.description = "Same policy, revised description";
  file.bytes = Buffer.from(JSON.stringify(edited));
  refused("approval bound to original bytes", host, request, "blocked", "approval-scope-mismatch");
}

for (const [name, mutate, state, reason] of [
  ["unknown request field", request => { request.extra = "fixture-secret"; }, "invalid", "input-invalid"],
  ["unsupported resource", request => { request.operation.resource = "/absolute-machine-path"; }, "unsupported", "operation-unsupported"],
  ["duplicate source", request => { request.manifests[1].name = request.manifests[0].name; }, "invalid", "input-invalid"],
  ["path alias", request => { request.manifests[0].name = "./project.yaml"; }, "invalid", "input-invalid"],
  ["duplicate YAML key", request => { request.manifests[0].bytes = Buffer.from("kind: Project\nkind: Project\n"); }, "invalid", "manifest-invalid"],
  ["YAML alias", request => { request.manifests[0].bytes = Buffer.from("a: &node value\nb: *node\n"); }, "invalid", "manifest-invalid"],
  ["invalid UTF-8", request => { request.manifests[0].bytes = Uint8Array.of(0xff); }, "invalid", "manifest-invalid"],
  ["shared bytes", request => { request.manifests[0].bytes = new Uint8Array(new SharedArrayBuffer(4)); }, "invalid", "input-invalid"],
  ["accessor input", request => {
    Object.defineProperty(request, "attemptId", { get() { assert.fail("request accessor invoked"); } });
  }, "invalid", "input-invalid"],
]) {
  const { host, request } = harness();
  mutate(request);
  refused(name, host, request, state, reason);
}

for (const effect of ["filesystem", "writes", "network", "credentials", "subprocesses", "providers", "extensions", "destructive"]) {
  const { host, request } = harness();
  request.effects[effect] = 1;
  refused("out of budget: " + effect, host, request, "unsupported", "effects-unsupported");
}

{
  const { host, request } = harness(undefined, {
    compatibility: { ...compatibility, schemaSnapshotSha256: "0".repeat(64) },
    readFacts() { assert.fail("version skew reached fact resolution"); },
  });
  refused("unknown version pair", host, request, "unsupported", "version-unsupported");
}
{
  const { host, request } = harness(undefined, { readFacts() { throw new Error("fixture-secret"); } });
  refused("fact resolver failure", host, request, "blocked", "facts-unknown");
}

for (const [name, mutate, reason] of [
  ["revoked at intent", facts => { facts.approval.state = "revoked"; }, "approval-revoked"],
  ["expiry at intent", facts => { facts.now = facts.approval.expiresAt; }, "approval-expired"],
  ["override at intent", facts => { facts.override = "block_action"; }, "override-block-action"],
  ["unknown after intent", facts => { facts.override = null; }, "override-unknown"],
  ["epoch changed at intent", facts => { facts.policyEpoch++; facts.approval.policyEpoch++; }, "authority-changed"],
  ["approval replaced at intent", facts => { facts.approval.id = "fixture-approval-2"; }, "authority-changed"],
  ["intent recording failure", () => { throw new Error("fixture-secret"); }, "intent-unavailable"],
]) {
  const { host, request, facts } = harness(undefined, { onIntent() { mutate(facts); } });
  const preflight = host.preflight(request);
  assert.equal(preflight.state, "ready");
  const result = host.runFixture(request);
  assert.equal(result.state, "denied");
  assert.equal(result.receipt.reason, reason);
  assert.equal(host.evidence().adapterCalls, 0);
  assert.equal(host.evidence().receipts.some(receipt => receipt.stage === "intent"), reason !== "intent-unavailable");
  record(name, host, result, { preflight });
}

{
  const { host, request, facts } = harness();
  assert.equal(host.preflight(request).state, "ready");
  facts.approval.state = "revoked";
  const denied = host.runFixture(request);
  assert.equal(denied.receipt.reason, "approval-revoked");
  facts.approval.state = "approved";
  assert.equal(host.runFixture(request).receipt.reason, "attempt-duplicate");
  assert.equal(host.evidence().adapterCalls, 0);
  record("revocation after preflight", host, denied);
}
{
  let nested;
  const { host, request } = harness(undefined, { onIntent() { nested = host.runFixture(request); } });
  const result = host.runFixture(request);
  assert.equal(nested.receipt.reason, "host-busy");
  assert.equal(result.state, "completed");
  assert.equal(host.evidence().adapterCalls, 1);
  record("reentrant attempt refused", host, result, { nested });
}

for (const [option, reason] of [["failAdapter", "adapter-outcome-unknown"], ["failOutcome", "outcome-unavailable"]]) {
  const { host, request } = harness(undefined, { [option]: true });
  const result = host.runFixture(request);
  assert.equal(result.state, "outcome-unknown");
  assert.equal(result.receipt.reason, reason);
  assert.equal(host.evidence().receipts[0].stage, "intent");
  assert.equal(host.evidence().adapterCalls, 1);
  assert.deepEqual(host.evidence().outcomeGaps, option === "failOutcome" ? [result.receipt] : []);
  const replay = host.runFixture(request);
  assert.equal(replay.receipt.reason, "attempt-duplicate");
  assert.equal(host.evidence().adapterCalls, 1);
  record(reason, host, result, { replay });
}

{
  const { host } = harness();
  for (let id = 1; id <= 100; id++) assert.equal(host.runFixture(fixtureRequest(id)).state, "completed");
  const full = host.runFixture(fixtureRequest(101));
  assert.equal(full.receipt.reason, "attempt-limit");
  assert.equal(host.evidence().adapterCalls, 100);
  assert.equal(host.evidence().receipts.length, 200);
  cases.push({ name: "bounded journal and attempts", result: full, adapterCalls: 100, receiptCount: 200 });
}

console.log(JSON.stringify({
  task: "NF-112", scope: "synthetic offline fixture",
  revision: process.env.NEXFLOW_TEST_REVISION,
  platform: process.platform, architecture: process.arch, osRelease: osRelease(),
  node: process.versions.node, npm: "11.20.0", typescript: "6.0.3",
  validationArchiveSha256: "07e3966c54bf3c15345811396b84f47677cdfeed99fef4e357676eb306d9f1e1",
  compatibility, caseCount: cases.length, cases,
}, null, 2));
