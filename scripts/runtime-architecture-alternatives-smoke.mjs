#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Maintenance-only consistency checks. No candidate or proposed runtime runs.
const snapshot = "58eabb804be45f3ef4cc3dde677a3a4bb4fd90a1";
const read = p => JSON.parse(readFileSync(p, "utf8"));
const frozen = p => {
  const bytes = execFileSync("git", ["show", `${snapshot}:${p}`], { maxBuffer: 16 * 1024 * 1024 });
  assert.deepEqual(readFileSync(p), bytes, `archived input changed: ${p}`);
  return JSON.parse(bytes);
};
const baseline = frozen("evaluation/baseline.json");
const pins = frozen("evaluation/fidelity/source-pins.json");
const candidates = ["typescript", "python", "rust", "go"];
const evidence = Object.fromEntries(candidates.map(candidate => [candidate, {
  fidelity: frozen(`evaluation/fidelity/${candidate}.json`),
  isolation: frozen(`evaluation/isolation/${candidate}.json`),
  supply: frozen(`evaluation/supply-chain/${candidate}/inventory.json`)
}]));
const proposal = read("evaluation/architecture/alternatives.json");
const document = readFileSync("evaluation/architecture/alternatives.md", "utf8");
const roles = ["cli", "validation-libraries", "runtime", "security-dependencies", "release-ci", "signing-distribution"];
const blockers = ["fidelity-coverage", "full-diagnostics", "security-isolation", "supply-chain-closure", "installed-lifecycle", "comparable-measurements", "boundary-enforcement", "version-compatibility", "independent-review", "owner-consent"];
const versions = ["manifest-dialect", "schema-snapshot", "validation-library-api", "cli-artifact", "diagnostic-output", "runtime-host", "adapter-extension", "boundary-protocol", "stored-state"];
const contracts = {
  credentials: "docs/credential-handling.md", extensions: "docs/extension-loading-boundary.md",
  providers: "docs/provider-adapter-boundary.md", audit: "docs/event-audit-storage-boundary.md",
  staticCommands: "docs/cli-runtime-boundary.md"
};
const sameLanguage = [["cli", "input-boundary"], ["cli", "pure-validation"], ["input-boundary", "pure-validation"], ["runtime-host", "pure-validation"], ["runtime-host", "authority-boundary"], ["authority-boundary", "effect-ports"]];
const splitLanguage = [["cli", "input-boundary"], ["cli", "pure-validation"], ["input-boundary", "pure-validation"], ["runtime-host", "runtime-validation"], ["runtime-host", "authority-boundary"], ["authority-boundary", "effect-ports"]];
const optionIds = ["shared-packages", "separate-packages", "split-languages"];
const layouts = ["same-language/shared-packages", "same-language/separate-cli-runtime-packages", "different-cli-runtime-languages"];
const prerequisites = [
  ["NF-056-09", 101, "1c9aa13c46175255d989edda5f6e677d1a723952", "a357309c7737d94b13330513da3deb20eef2b8f8", 7],
  ["NF-056-10", 103, "72db0be4b32ac0069979abeeedc8870b4d987e3d", "d344bb6db7008f5d332a8be453b0dd849259e3de", 9],
  ["NF-056-11", 104, "5290b74aa8af3f0d8051ae18c419c49c47df7c08", "e91b5e13fb829aeae4c23a4fcc9a762f1eec5f6b", 9]
];
for (const [, , head, merge] of prerequisites) {
  execFileSync("git", ["merge-base", "--is-ancestor", head, merge]);
  execFileSync("git", ["merge-base", "--is-ancestor", merge, snapshot]);
}

function assertGraph(edges) {
  const adjacency = new Map();
  for (const [from, to] of edges) {
    assert.notEqual(from, to);
    adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
  }
  const visit = (node, ancestors = new Set()) => {
    assert.equal(ancestors.has(node), false, "dependency cycle");
    for (const next of adjacency.get(node) ?? []) visit(next, new Set([...ancestors, node]));
  };
  for (const node of adjacency.keys()) visit(node);
  const reachable = (node, target) => node === target || (adjacency.get(node) ?? []).some(next => reachable(next, target));
  for (const forbidden of ["runtime-host", "runtime-validation", "authority-boundary", "effect-ports"]) {
    assert.equal(reachable("cli", forbidden), false, "CLI imports runtime/effects");
  }
  assert.equal(adjacency.has("pure-validation"), false, "pure layer has outward dependency");
  assert.equal(adjacency.has("runtime-validation"), false, "runtime validation must stay pure");
}

function assess(p) {
  assert.equal(p.formatVersion, "0.1-draft");
  assert.equal(p.task, "NF-056-16");
  assert.equal(p.recordedAt, "2026-10-09");
  assert.equal(p.sourceSnapshot, snapshot);
  assert.equal(p.specificationRevision, baseline.specificationRevision);
  assert.equal(p.evaluationPackageRevision, pins.evaluationPackageRevision);
  assert.equal(p.corpusSha256, baseline.corpus.sha256);
  assert.equal(p.catalogSha256, pins.catalogSha256);
  assert.equal(p.status, "proposal");
  assert.equal(p.outcome, "not-ready");
  assert.equal(p.selection, null);
  assert.equal(p.runtimeImplementationAuthorized, false);
  assert.deepEqual(p.candidatePins, Object.fromEntries(candidates.map(c => [c, pins.candidates[c].sourceRevision])));
  assert.equal(p.prerequisites.length, 3);
  p.prerequisites.forEach((r, i) => {
    const [task, pr, head, merge, count] = prerequisites[i];
    assert.deepEqual([r.task, r.pullRequest, r.head, r.merge, r.checks.length], [task, pr, head, merge, count]);
    assert.equal(r.state, "MERGED");
    assert.equal(new Set(r.checks.map(c => c.url)).size, count);
    for (const check of r.checks) {
      assert.equal(check.conclusion, "SUCCESS");
      assert.match(check.url, /^https:\/\/github\.com\/iwizy\/NexFlow\/actions\/runs\/\d+\/job\/\d+$/u);
      assert.ok(check.workflow && check.name);
    }
  });
  assert.equal(p.options.length, 3);
  p.options.forEach((option, i) => {
    assert.equal(option.id, optionIds[i]);
    assert.equal(option.layout, layouts[i]);
    assert.equal(option.status, "unselected");
    assertGraph(option.imports);
    assert.deepEqual(option.imports, i === 2 ? splitLanguage : sameLanguage);
  });
  assert.deepEqual(p.retainedFacts, {
    libraryCases: 352, passed: 128, testedFailures: 0, notTested: 224,
    specificationFidelity: "failed", deterministicDiagnostics: "not-tested",
    offlineScope: "supplemental-macos-only", securityBoundary: "partial",
    supplyChainAcceptance: "partial", advisoryEvidenceDate: "2026-10-04", comparablePerformance: "not-tested"
  });
  assert.deepEqual(p.boundaryContracts, contracts);
  assert.deepEqual(p.versionDomains, versions);
  assert.deepEqual(p.decisionBlockers, blockers);
  assert.deepEqual(p.ownershipProposals, roles.map(role => ({ role, status: "pending", confirmedOwner: null, confirmedSupportWindow: null })));
  assert.deepEqual(p.reviewerProposals, ["architecture-validation", "security-distribution"].map(role => ({ role, status: "pending", confirmedPerson: null, independentOfAuthorsRequired: true })));
  assert.equal(p.checksScope, "Offline source and proposal consistency only; not runtime enforcement, target lifecycle, human review or architecture acceptance.");
  return "not-ready";
}

for (const c of candidates) {
  const { fidelity: f, isolation: i, supply: s } = evidence[c];
  assert.equal(f.prototypeRevision, proposal.candidatePins[c]);
  assert.equal(i.prototypeRevision, f.prototypeRevision);
  assert.equal(s.sourceRevision, f.prototypeRevision);
  assert.equal(f.specificationRevision, baseline.specificationRevision);
  assert.equal(f.evaluationPackageRevision, pins.evaluationPackageRevision);
  assert.deepEqual(f.library.counts, { passed: 128, failed: 0, "not-tested": 224 });
  assert.equal(f.gates.specificationFidelity.status, "failed");
  assert.equal(f.gates.deterministicDiagnostics.status, "not-tested");
  assert.equal(i.targetContractMatch, false);
  assert.equal(i.offlineOperation.status, "passed");
  assert.equal(i.securityBoundary.status, "partial");
  assert.equal(s.supplyChainAcceptance, "partial");
  assert.ok(s.recordedAt.startsWith("2026-10-04"));
}
assert.equal(assess(proposal), "not-ready");
for (const section of ["Three Mandatory Layouts", "Pure Interfaces And Startup Boundary", "Independent Version Domains And Compatibility", "Ownership, Release And Maintenance Proposal", "Conformance And Maintenance Evidence Plan", "Blocking Questions And Next Handoff"]) {
  assert.ok(document.includes(section));
}
for (const contract of Object.values(contracts)) assert.ok(document.includes(`../../${contract}`));
for (const blocker of blockers) assert.ok(document.includes(`\`${blocker}\``));

let rejections = 0;
const reject = mutate => {
  const changed = structuredClone(proposal);
  mutate(changed);
  assert.throws(() => assess(changed));
  rejections++;
};
reject(p => { p.selection = "typescript"; });
reject(p => { p.outcome = "accepted"; });
reject(p => { p.status = "implemented"; });
reject(p => { p.runtimeImplementationAuthorized = true; });
reject(p => { p.sourceSnapshot = "a".repeat(40); });
reject(p => { p.corpusSha256 = "a".repeat(64); });
reject(p => { p.catalogSha256 = "a".repeat(64); });
reject(p => { p.candidatePins.python = "a".repeat(40); });
reject(p => { p.prerequisites[0].head = "a".repeat(40); });
reject(p => { p.prerequisites[0].checks[0].conclusion = "FAILURE"; });
reject(p => { p.options.pop(); });
reject(p => { p.options[0].status = "selected"; });
reject(p => { p.options[0].imports.push(["cli", "runtime-host"]); });
reject(p => { p.options[0].imports.push(["pure-validation", "cli"]); });
reject(p => { p.options[2].imports.push(["runtime-validation", "effect-ports"]); });
reject(p => { p.retainedFacts.notTested = 0; });
reject(p => { p.retainedFacts.specificationFidelity = "passed"; });
reject(p => { p.retainedFacts.securityBoundary = "passed"; });
reject(p => { p.retainedFacts.advisoryEvidenceDate = "2026-10-09"; });
reject(p => { p.retainedFacts.comparablePerformance = "passed"; });
reject(p => { delete p.boundaryContracts.credentials; });
reject(p => { p.versionDomains.pop(); });
reject(p => { p.ownershipProposals[0].confirmedOwner = "unconfirmed"; });
reject(p => { p.ownershipProposals[0].confirmedSupportWindow = "24/7"; });
reject(p => { p.reviewerProposals[0].independentOfAuthorsRequired = false; });
reject(p => { p.reviewerProposals[0].confirmedPerson = "unconfirmed"; });
reject(p => { p.decisionBlockers = []; });
console.log(`Architecture alternatives: 3 graphs, 4 frozen candidate inputs, 25 prerequisite CI receipts and ${rejections} rejection controls passed; decision not-ready, owners/reviewers pending.`);
