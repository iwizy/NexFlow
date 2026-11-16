#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";

import { parseDocument } from "yaml";

function parseYaml(text) {
  const document = parseDocument(text, { uniqueKeys: true });
  assert.deepEqual(document.errors, []);
  return document.toJS({ maxAliasCount: 0 });
}

const fixture = parseYaml(await readFile("fixtures/integrations/metadata-boundaries.yaml", "utf8"));
const profiles = new Map();
for (const [name, pin] of Object.entries(fixture.profiles)) {
  const contents = await readFile(`extensions/${name}/profile.yaml`);
  const profile = parseYaml(contents.toString("utf8"));
  assert.equal(profile.namespace, pin.namespace);
  assert.equal(profile.profileVersion, pin.profileVersion);
  assert.equal(createHash("sha256").update(contents).digest("hex"), pin.sha256);
  const source = profile.protocol ?? profile.provider;
  assert.equal(source.authority, "external");
  assert.equal(source.versionPolicy, "explicit_compatibility_claim");
  profiles.set(name, profile);
}

// The model compares synthetic proposals with synthetic host evidence. It has
// no transport, credential material, operation handlers or dispatch path.
function review(local, proposal) {
  if (!isDeepStrictEqual(proposal.pin, local.pin)) return "unsupported-profile";
  if (!isDeepStrictEqual(proposal.wire, local.wire)) return "unsupported-protocol";
  if (proposal.delivery !== "explicit-request") return "unsupported-inbound";
  if (proposal.requiredMetadata.some(field => field !== "target")) return "unsupported-required-metadata";
  if (Object.hasOwn(proposal.metadata, "authority")) return "external-authority";
  if (proposal.surface !== local.surface) return "unsupported-surface";
  if (local.allowedOperations && !local.allowedOperations.includes(proposal.operation)) return "operation-not-allowlisted";
  if (proposal.operation !== local.operation || proposal.effect !== local.effect) return "unsupported-operation-effect";
  if (!isDeepStrictEqual(proposal.target, local.target)) return "unresolved-target";
  if (proposal.revision !== local.revision || local.fresh !== true) return "stale-or-unpinned-evidence";
  if (local.provenance && !isDeepStrictEqual(proposal.provenance, local.provenance)) return "unverified-import-provenance";
  for (const control of local.controls) {
    if (local.decisions[control] !== true) return "missing-local-" + control;
  }
  return "reviewable";
}

function binding(operation) {
  const { namespace, profileVersion, sha256, protocol, protocolVersion } = fixture.profiles[operation.profile];
  const controls = ["capability", "permission", "network", "credential", "audit"];
  if (operation.effect !== "read") controls.push("approval");
  return {
    ...operation,
    pin: { namespace, profileVersion, sha256 },
    wire: { protocol, protocolVersion },
    fresh: true,
    controls,
    decisions: Object.fromEntries(controls.map(control => [control, true])),
  };
}

function proposalFrom(local) {
  const { pin, wire, surface, operation, effect, target, revision, provenance } = local;
  return structuredClone({
    pin, wire, surface, operation, effect, target, revision, provenance,
    delivery: "explicit-request", requiredMetadata: ["target"], metadata: {},
  });
}

function result(local, proposal) {
  const disposition = review(local, proposal);
  return { disposition, executionAuthorized: false };
}

let cases = 0;
function test(name, operation, expected, mutate = () => {}) {
  const local = binding(fixture.operations[operation]);
  const proposal = proposalFrom(local);
  mutate(proposal, local);
  const original = structuredClone(proposal);
  assert.deepEqual(result(local, proposal), { disposition: expected, executionAuthorized: false }, name);
  assert.deepEqual(proposal, original, name + ": preserve caller data");
  cases += 1;
}

for (const [name, operation] of Object.entries(fixture.operations)) {
  const profile = profiles.get(operation.profile);
  const surface = profile.surfaces.find(({ id }) => id === operation.surface);
  assert.ok(surface, name);
  switch (operation.profile) {
    case "mcp":
      assert.equal(surface.class, operation.effect === "read" ? "context" : "action", name);
      assert.equal(surface.actionCapabilityRequired, operation.effect !== "read", name);
      if (operation.effect === "action") assert.equal(profile.requirements.actionSurfaces.allowlistRequired, true, name);
      break;
    case "a2a":
      assert.equal(surface.nexflowTreatment, operation.effect === "import" ? "external_output" : "external_claim", name);
      assert.equal(profile.requirements.authority.remotePolicy, "cannot_expand_local_policy", name);
      break;
    default:
      assert.equal(profile.requirements.operations.find(({ id }) => id === operation.operation)?.effect, operation.effect, name);
  }
  test(name + " can be reviewed", name, "reviewable");
  test(name + " unknown wire protocol", name, "unsupported-protocol", proposal => { proposal.wire.protocol = "unknown"; });
  test(name + " unknown wire version", name, "unsupported-protocol", proposal => { proposal.wire.protocolVersion = "unknown"; });
  test(name + " unknown profile version", name, "unsupported-profile", proposal => { proposal.pin.profileVersion = "9.0"; });
  test(name + " different exact profile pin", name, "unsupported-profile", proposal => { proposal.pin.sha256 = "f".repeat(64); });
  test(name + " unsupported inbound event", name, "unsupported-inbound", proposal => { proposal.delivery = "callback"; });
  test(name + " unknown required metadata", name, "unsupported-required-metadata", proposal => { proposal.requiredMetadata.push("unknown"); });
  test(name + " opaque optional metadata stays out of the projection", name, "reviewable", proposal => {
    proposal.metadata.annotation = { value: "fixture-private-content", effect: "write" };
  });
  test(name + " external claims cannot widen authority", name, "external-authority", proposal => {
    proposal.metadata.authority = { inheritedApproval: "fixture-private-content", delegatedCredential: "opaque" };
  });
  test(name + " ID collision across bindings", name, "unresolved-target", proposal => { proposal.target.binding += "-other"; });
  test(name + " wrong effect", name, "unsupported-operation-effect", proposal => { proposal.effect = "different"; });
  test(name + " stale evidence", name, "stale-or-unpinned-evidence", (_proposal, local) => { local.fresh = false; });
}

test("branch name cannot substitute for the pinned commit", "github-read", "stale-or-unpinned-evidence", proposal => { proposal.revision = "main"; });
test("tracker mutation needs the observed revision", "tracker-update", "stale-or-unpinned-evidence", proposal => { delete proposal.revision; });
test("MCP context cannot select the tools surface", "mcp-context", "unsupported-surface", proposal => { proposal.surface = "tools"; });
test("MCP tool outside the local allow-list", "mcp-tool", "operation-not-allowlisted", proposal => { proposal.operation = "other_fixture_tool"; });
for (const surface of ["agent_card", "agent", "message", "task"]) {
  test("A2A " + surface + " cannot substitute for an invocation proposal", "a2a-skill", "unsupported-surface", proposal => {
    proposal.surface = surface;
  });
}
test("A2A skill cannot change the local capability decision", "a2a-skill", "missing-local-capability", (proposal, local) => {
  proposal.metadata.advertisedCapabilities = ["fixture-review"];
  local.decisions.capability = null;
});
test("A2A import cannot reuse another task's provenance", "a2a-import", "unverified-import-provenance", proposal => { proposal.provenance.task = "other-task"; });
test("A2A artifact requires integrity evidence under the fixture import policy", "a2a-import", "unverified-import-provenance", proposal => { delete proposal.provenance.sha256; });
for (const control of binding(fixture.operations["github-write"]).controls) {
  for (const decision of [false, null]) {
    test("independent local " + control + " decision", "mcp-tool", "missing-local-" + control, (_proposal, local) => {
      local.decisions[control] = decision;
    });
  }
}
test("A2A approval cannot authorize a subsequent MCP hop", "mcp-tool", "missing-local-approval", (proposal, local) => {
  proposal.metadata.parentDecision = { protocol: "fixture-a2a", approval: true };
  delete local.decisions.approval;
});

console.log(`Integration metadata boundaries passed ${cases} offline fixture cases across ${profiles.size} pinned profiles.`);
