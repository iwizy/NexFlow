#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repositoryRoot } from "./lib/runtime-evaluation.mjs";
import { assertPacket, encode, loadInputs, makePacket } from "./lib/candidate-report-bundles.mjs";

export function verifyCandidateBundles() {
  const expected = makePacket(loadInputs());
  const actual = Object.fromEntries(Object.keys(expected).map(p => {
    const bytes = readFileSync(path.join(repositoryRoot, p), "utf8");
    const value = JSON.parse(bytes);
    assert.equal(bytes, encode(value), `noncanonical packet serialization: ${p}`);
    return [p, value];
  }));
  assertPacket(actual, expected);
  return expected;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length <= 3);
  const mode = process.argv[2] ?? "--verify";
  assert.ok(["--verify", "--print"].includes(mode));
  if (mode === "--print") console.log(JSON.stringify(makePacket(loadInputs())));
  else {
    verifyCandidateBundles();
    console.log("Four source-bound reports schema-valid; assessReport returns ineligible for all four. Packet not-ready; 84 metric gaps retained, two review forms and reconciliation blank.");
  }
}
