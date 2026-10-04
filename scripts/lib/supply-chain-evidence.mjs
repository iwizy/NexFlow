import { createHash } from "node:crypto";
export const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export const ids = ["typescript", "python", "rust", "go"];
export function sbomFor(record) {
  return {
    $schema: "http://cyclonedx.org/schema/bom-1.6.schema.json", bomFormat: "CycloneDX", specVersion: "1.6", version: 1,
    metadata: { timestamp: record.recordedAt, component: { type: "application", "bom-ref": "candidate:" + record.candidate,
      name: "nexflow-" + record.candidate + "-evaluation", version: record.sourceRevision,
      properties: [{ name: "nexflow:scope", value: "disposable-validation-only-not-release" },
        { name: "nexflow:collectorRevision", value: record.collectorRevision }] } },
    components: record.components.map(c => ({ type: "library", "bom-ref": c.ref, name: c.name, version: c.version, purl: c.ref,
      licenses: [{ license: { name: c.license } }],
      ...(c.archiveSha256 ? { hashes: [{ alg: "SHA-256", content: c.archiveSha256 }] } : {}),
      properties: [{ name: "nexflow:selection", value: c.scope }, { name: "nexflow:metadataSource", value: c.metadataSource },
        { name: "nexflow:licenseAssessment", value: c.licenseAssessment },
        ...(c.integrity ? [{ name: "nexflow:npmArchiveIntegrity", value: c.integrity }] : []),
        ...(c.sum ? [{ name: "nexflow:goModuleSum", value: c.sum }] : []),
        ...(c.metadataSha256 ? [{ name: "nexflow:installedMetadataSha256", value: c.metadataSha256 }] : [])] })),
    dependencies: record.dependencies.map(d => ({ ref: d.ref, dependsOn: d.dependsOn })),
    compositions: [{ aggregate: "incomplete", assemblies: ["candidate:" + record.candidate] }]
  };
}
export function evidenceErrors(record, scan, sbom, pins) {
  const errors = [], require = (test,label) => { if (!test) errors.push(label); };
  require(record?.task === "NF-056-11" && ids.includes(record?.candidate), "record identity");
  if (!record || !ids.includes(record.candidate)) return errors;
  const pin = pins.candidates[record.candidate];
  require(record.sourceRevision === pin.sourceRevision && record.publishedHead === pin.publishedHead && record.pullRequest === pin.pullRequest, "source pin");
  require(record.specificationRevision === pins.specificationRevision && record.corpusSha256 === pins.corpusSha256
    && record.catalogSha256 === pins.catalogSha256 && record.evaluationPackageRevision === pins.evaluationPackageRevision, "frozen baseline");
  require(/^[a-f0-9]{40}$/u.test(record.collectorRevision ?? "") && record.collectorVersion === "nf-056-11-v1", "collector binding");
  require(record.outcome === "not-ready" && record.supplyChainAcceptance === "partial"
    && record.signedProvenance === "not-tested" && record.reproducibleBuild === "not-tested" && record.distributionLifecycle === "not-tested", "non-approval boundary");
  require(record.target === "macos/arm64", "target identity");
  require(record.limitations?.length >= 6 && record.commands?.length && record.artifacts?.length && record.locks?.length, "missing provenance/limits");
  for (const receipt of [...(record.sourceManifest ?? []), ...(record.locks ?? []), ...(record.artifacts ?? [])])
    require(/^[a-f0-9]{64}$/u.test(receipt.sha256 ?? "") && receipt.file && !receipt.file.startsWith("/") && !receipt.file.includes(".."), "file receipt");
  const components = record.components ?? [], allRefs = new Set(["candidate:" + record.candidate, ...components.map(c => c.ref)]);
  require(components.length > 0 && allRefs.size === components.length + 1, "component inventory");
  for (const c of components) require(c.ref && c.name && c.version && c.ecosystem && c.scope && c.license
    && c.licenseAssessment === "upstream-declared-not-legal-approval", "component fields");
  const dependencies = record.dependencies ?? [];
  require(dependencies.length === allRefs.size && new Set(dependencies.map(d => d.ref)).size === allRefs.size, "dependency coverage");
  for (const d of dependencies) require(allRefs.has(d.ref) && Array.isArray(d.dependsOn) && d.dependsOn.every(r => allRefs.has(r)), "dependency edge");
  require(sbom?.bomFormat === "CycloneDX" && sbom.specVersion === "1.6" && sbom.metadata?.component?.version === record.sourceRevision, "SBOM identity");
  require(JSON.stringify(sbom) === JSON.stringify(sbomFor(record)), "SBOM inventory divergence");
  require(scan?.candidate === record.candidate && scan.sourceRevision === record.sourceRevision && scan.collectorRevision === record.collectorRevision, "scan binding");
  require(scan?.status === "completed" && scan.scannerVersion === "nf-056-11-osv-v1" && scan.apiVersion === "v1" && scan.fixesApplied === false, "scan state");
  require(scan?.databaseVersion === "unavailable-live-service-no-snapshot-id" && scan.untested?.length >= 5, "scan coverage limits");
  const queries = scan?.queries ?? [], covered = new Set(queries.flatMap(q => q.refs ?? []));
  require(components.every(c => covered.has(c.ref)), "unscanned component");
  for (const row of queries) {
    const matches = row.matches ?? [];
    require(Array.isArray(row.refs) && row.refs.length > 0 && matches.every(m => m.id && m.modified), "scan query result");
    for (const ref of row.refs) if (ref !== "runtime:go-stdlib") {
      const c = components.find(item => item.ref === ref);
      require(c && row.query?.package?.name === c.name && row.query?.package?.ecosystem === c.ecosystem && row.query?.version === c.version, "scan version divergence");
    }
  }
  const advisories = scan?.advisories ?? [], matched = [...new Set(queries.flatMap(q => (q.matches ?? []).map(m => m.id)))].sort();
  require(JSON.stringify(advisories.map(a => a.id).sort()) === JSON.stringify(matched), "advisory detail coverage");
  require(scan?.advisoryCount === matched.length && scan.queryCount === queries.length
    && scan.matchedPackageCount === queries.filter(q => q.matches?.length).length, "scan counts");
  for (const a of advisories) require(a.url === "https://osv.dev/vulnerability/" + a.id && /^[a-f0-9]{64}$/u.test(a.sourceSha256 ?? ""), "advisory source");
  require(scan?.pages?.length > 0 && scan.pages.every(page => /^[a-f0-9]{64}$/u.test(page.responseSha256)
    && page.queries.length === page.response?.results?.length
    && page.response.results.every(result => !result.next_page_token || scan.pages.some(other => other.queries.some(q => q.page_token === result.next_page_token)))), "raw pages/pagination");
  require(Number.isFinite(Date.parse(scan?.startedAt)) && Date.parse(scan.completedAt) >= Date.parse(scan.startedAt)
    && Date.parse(scan.startedAt) >= Date.parse(record.recordedAt), "scan chronology");
  require(!/\/Users\/|\/private\/|file:\/\/|\/var\/folders\//iu.test(JSON.stringify({ record, scan, sbom })), "private path leakage");
  return errors;
}
