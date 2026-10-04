#!/usr/bin/env node
// Deliberately network-backed advisory collection, separate from candidate runs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sha } from "./runtime-supply-chain-collect.mjs";

export const scannerVersion = "nf-056-11-osv-v1";
const api = "https://api.osv.dev/v1";
async function request(route, body) {
  const response = await fetch(api + route, { method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000),
    redirect: "error" });
  assert.equal(response.status, 200, "OSV API request failed");
  const bytes = await response.text();
  return { value: JSON.parse(bytes), sha256: sha(bytes) };
}
export async function scan(record) {
  const startedAt = new Date().toISOString();
  const packages = new Map();
  for (const c of record.components) {
    assert.ok(c.ecosystem && c.name && c.version);
    const query = { package: { ecosystem: c.ecosystem, name: c.name }, version: c.version };
    const key = JSON.stringify(query);
    if (!packages.has(key)) packages.set(key, { query, refs: [] });
    packages.get(key).refs.push(c.ref);
  }
  if (record.candidate === "go") packages.set("stdlib", {
    query: { package: { ecosystem: "Go", name: "stdlib" }, version: "1.27.1" },
    refs: ["runtime:go-stdlib"] });
  const rows = [...packages.values()].map(row => ({ ...row, matches: [] }));
  const pages = [];
  for (let start = 0; start < rows.length; start += 100) {
    let active = rows.slice(start, start + 100).map((row,index) => ({ row, index: start + index, query: row.query }));
    let pageCount = 0;
    while (active.length) {
      assert.ok(pageCount++ < 20, "excessive OSV pagination");
      const queries = active.map(item => item.query);
      const response = await request("/querybatch", { queries });
      assert.equal(response.value.results.length, active.length);
      pages.push({ queries, response: response.value, responseSha256: response.sha256 });
      const next = [];
      response.value.results.forEach((result,index) => {
        const entry = active[index];
        entry.row.matches.push(...(result.vulns ?? []));
        if (result.next_page_token) next.push({ ...entry, query: { ...entry.row.query, page_token: result.next_page_token } });
      });
      active = next;
    }
  }
  const ids = [...new Set(rows.flatMap(row => row.matches.map(m => m.id)))].sort();
  const advisories = [];
  for (let start = 0; start < ids.length; start += 4) {
    advisories.push(...await Promise.all(ids.slice(start,start + 4).map(async id => {
      const response = await request("/vulns/" + encodeURIComponent(id));
      const v = response.value;
      assert.equal(v.id, id);
      return { id: v.id, aliases: v.aliases ?? [], modified: v.modified, published: v.published,
        withdrawn: v.withdrawn ?? null, sourceSha256: response.sha256,
        severity: v.severity ?? [], databaseSpecific: v.database_specific ?? null,
        affected: v.affected ?? [], references: (v.references ?? []).map(r => ({ type: r.type, url: r.url })),
        url: "https://osv.dev/vulnerability/" + id };
    })));
  }
  return { formatVersion: 1, scannerVersion, apiVersion: "v1", api, startedAt, completedAt: new Date().toISOString(),
    databaseVersion: "unavailable-live-service-no-snapshot-id", candidate: record.candidate,
    sourceRevision: record.sourceRevision, collectorRevision: record.collectorRevision,
    scope: "exact-version-matching-no-reachability-or-security-certification",
    status: "completed", queries: rows, pages, advisories,
    queryCount: rows.length, matchedPackageCount: rows.filter(row => row.matches.length).length,
    advisoryCount: ids.length, fixesApplied: false,
    untested: ["OS/distribution advisories", "compiler and interpreter bundled native closure",
      "unpublished vulnerabilities", "independent dependency source audit", "exploit reachability",
      ...(record.candidate === "go" ? [] : ["runtime/compiler vulnerability matching"])] };
}
if (process.argv[1]?.endsWith("runtime-supply-chain-scan.mjs")) {
  const record = JSON.parse(readFileSync(process.argv[2]));
  console.log(JSON.stringify(await scan(record), null, 2));
}
