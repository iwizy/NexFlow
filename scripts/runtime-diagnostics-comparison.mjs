#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { candidates, same, portableDiagnostic } from "./lib/diagnostic-requalification.mjs";
import { digest } from "./lib/runtime-evaluation.mjs";

export function compareReports(reports) {
  const library = reports[0].library.results.map((entry,i) => ({id:entry.id,
    portableParity:reports.every(r=>same(entry.observations.map(portableDiagnostic),r.library.results[i].observations.map(portableDiagnostic))),
    rawParity:reports.every(r=>same(entry.actual,r.library.results[i].actual))}));
  const cli = reports[0].cli.results.filter(r=>!r.id.endsWith("-text")).map(entry=> {
    const observations=reports.map(r=>r.cli.results.find(x=>x.id===entry.id));
    const view = r => ({exitCode:r.actual.exitCode,checks:r.actual.checks,diagnostics:r.actual.diagnostics,truncated:r.actual.truncated});
    const parity=observations.every(r=>same(view(entry),view(r)));
    return {id:entry.id,publicParity:parity,...(!parity?{observations:observations.map((r,i)=>({candidate:reports[i].candidate,
      diagnosticsSha256:digest(JSON.stringify(r.actual.diagnostics)),count:r.actual.diagnostics.length,
      keywordCounts:r.actual.diagnostics.reduce((acc,d)=>(acc[d.keyword]=(acc[d.keyword]??0)+1,acc),{}),
      firstMismatchIndex:r.actual.diagnostics.findIndex((d,i)=>!same(d,entry.actual.diagnostics[i])),
      firstDiagnostic:r.actual.diagnostics[0]}))}:{})};
  });
  return {formatVersion:1,task:"NF-102-01",pins:reports[0].pins,
    reports:reports.map(r=>({candidate:r.candidate,path:"evaluation/requalification/validation-diagnostics/"+r.candidate+".json",libraryPassed:r.library.passed,libraryFailed:r.library.failed,cliScopePassed:r.cli.passed,cliScopeFailed:r.cli.failed})),
    library:{cases:library.length,portablePassed:library.filter(r=>r.portableParity).length,portableFailures:library.filter(r=>!r.portableParity).map(r=>r.id),rawDifferences:library.filter(r=>!r.rawParity).map(r=>r.id)},
    cli:{jsonCases:cli.length,publicPassed:cli.filter(r=>r.publicParity).length,publicFailures:cli.filter(r=>!r.publicParity)},
    acceptance:{status:"not-ready",blockers:[...(cli.some(r=>!r.publicParity)?["public-branch-diagnostic-parity"]:[]),"full-project-semantic-conformance-not-tested","stable-public-library-contract-not-established"],
      candidateRepairAuthorized:false,architecture:"Draft",historicalReports:"unchanged",oracle:"unchanged"}};
}
if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const reports=candidates.map(c=>JSON.parse(readFileSync(new URL("../evaluation/requalification/validation-diagnostics/"+c+".json",import.meta.url))));
  const comparison=compareReports(reports);
  const hashes=reports.map(r=>({candidate:r.candidate,sha256:digest(readFileSync(new URL("../evaluation/requalification/validation-diagnostics/"+r.candidate+".json",import.meta.url)))}));
  writeFileSync(new URL("../evaluation/requalification/validation-diagnostics/comparison.json",import.meta.url),JSON.stringify({...comparison,reportHashes:hashes},null,2)+"\n");
  console.log(JSON.stringify({library:comparison.library,cli:comparison.cli,acceptance:comparison.acceptance},null,2));
}
