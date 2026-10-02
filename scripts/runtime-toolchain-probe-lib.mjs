import assert from "node:assert/strict";

export const candidateIds = ["typescript", "python", "rust", "go"];
export const scope = "dependency-capability-probe-only";

export function checkProbe(packet, output, candidate) {
  assert.ok(candidateIds.includes(candidate), "unknown candidate");
  assert.equal(packet.scope, scope);
  assert.equal(output.scope, scope);
  assert.equal(output.candidate, candidate);
  assert.equal(output.results.length, packet.cases.length);
  assert.equal(new Set(output.results.map(entry => entry.id)).size, packet.cases.length);
  for (const [index, entry] of packet.cases.entries()) {
    const result = output.results[index];
    assert.equal(result.id, entry.id);
    assert.equal(result.valid, entry.expected.valid, entry.id);
    assert.ok(Array.isArray(result.diagnostics), entry.id);
    if (result.valid) assert.equal(result.diagnostics.length, 0, entry.id);
    else assert.ok(result.diagnostics.length > 0, entry.id);
    for (const diagnostic of result.diagnostics) {
      assert.equal(diagnostic.category, entry.operation === "yaml" ? "yaml" :
        entry.expected.unresolvedReference ? "reference" : "schema", entry.id);
      assert.equal(typeof diagnostic.path, "string");
      assert.equal(typeof diagnostic.keyword, "string");
    }
    if (entry.expected.diagnosticPath !== undefined) {
      assert.ok(result.diagnostics.some(item => item.path === entry.expected.diagnosticPath &&
        item.keyword === entry.expected.diagnosticKeyword), entry.id);
    } else if (entry.expected.diagnosticKeyword !== undefined) {
      assert.ok(result.diagnostics.some(item => item.keyword === entry.expected.diagnosticKeyword), entry.id);
    }
    if (entry.expected.unresolvedReference !== undefined) {
      assert.equal(result.unresolvedReference, entry.expected.unresolvedReference, entry.id);
    }
    if (entry.expected.value !== undefined) assert.deepEqual(result.value, entry.expected.value, entry.id);
  }
}
