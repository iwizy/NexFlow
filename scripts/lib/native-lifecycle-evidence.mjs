import {digest,baseline,safeRelative,compareOutput} from "./runtime-evaluation.mjs";
export const nativeCandidates=["typescript","python","rust","go"];
export const nativeCollectorFiles=["scripts/runtime-native-lifecycle-collect.mjs","scripts/runtime-native-lifecycle-provision.mjs","scripts/lib/native-lifecycle-evidence.mjs","scripts/lib/runtime-evaluation.mjs","scripts/lib/evaluation-environment.mjs","scripts/runtime-evaluation-environment.mjs","scripts/evaluation-npm-provision.mjs","scripts/evaluation-python-provision.py","evaluation/lifecycle/requalification/contract.json",".github/workflows/native-lifecycle.yml"];
export function nativeRecordErrors(record,contract){
 const errors=[],need=(ok,why)=>{if(!ok)errors.push(why);},sha=s=>/^[a-f0-9]{64}$/u.test(s??"");
 need(record?.task==="NF-102-03"&&nativeCandidates.includes(record.candidate),"identity");
 need(record?.sourceRevision===contract.candidateSourceRevision,"source");
 need(record?.architectureAccepted===false&&record?.taskStatus==="blocked"&&record?.outcome==="not-ready","false-completion");
 need(record?.previousArtifact===null&&record?.stages?.upgrade?.status==="not-tested"&&record?.stages?.rollback?.status==="not-tested","fabricated-predecessor");
 need(record?.stages?.signing?.status==="not-tested"&&record?.stages?.notarization?.status==="not-tested","unauthorized-signing");
 need(sha(record?.environmentSha256)&&digest(JSON.stringify(record.environment))===record.environmentSha256,"environment-binding");
 const target=contract.targets.find(t=>t.id===record?.target);
 need(target&&record.environment?.platform===target.platform&&record.environment?.architecture===target.architecture&&record.environment?.runnerLabel===target.runner,"native-target");
 need(record?.specificationRevision===baseline.specificationRevision&&record?.corpusSha256===baseline.corpus.sha256,"frozen-inputs");
 need(record?.sourceManifest?.length&&record.sourceManifest.every(f=>safeRelative(f.path)&&sha(f.sha256)),"source-manifest");
 need(record?.collectorSources?.length===nativeCollectorFiles.length&&record.collectorSources.every((f,i)=>f.path===nativeCollectorFiles[i]&&sha(f.sha256)),"collector-manifest");
 need(/^[a-f0-9]{40}$/u.test(record?.collectorRevision??""),"collector-revision");
 need(record?.immutability?.sources===true&&record?.immutability?.corpus===true,"mutation");
 for(const [stage,value]of Object.entries(record?.stages??{}))need(["passed","failed","not-tested"].includes(value.status)&&value.evidence?.length,"stage:"+stage);
 if(record?.artifact){
  need(sha(record.artifact.sha256)&&record.artifact.bytes>0&&record.artifact.version===record.sourceRevision+"."+record.target.replaceAll("/",".")+"."+record.collectorRevision,"artifact");
  need(record.artifact.files?.length&&record.artifact.files.every(f=>safeRelative(f.path)&&sha(f.sha256))&&new Set(record.artifact.files.map(f=>f.path)).size===record.artifact.files.length,"artifact-manifest");
  need(record.artifact.manifestSha256===digest(JSON.stringify(record.artifact.files)),"artifact-manifest-hash");
 }
 if(record?.stages?.install?.status==="passed")need(record.artifact&&record.installation?.archiveVerified&&record.installation?.manifestVerified&&record.installation?.unicodePrefix,"install");
 if(record?.stages?.validateInspect?.status==="passed"){
  need(record.execution?.cases?.length===baseline.cases.length&&record.sourceSchemasHidden===true,"missing-execution");
  for(const [i,c]of(record.execution?.cases??[]).entries())need(c.id===baseline.cases[i]?.id&&c.errors.length===0&&c.attempts.length===2&&c.attempts.every(a=>a.output&&compareOutput(baseline.cases[i],a.output,a.exitCode,a.stderr).length===0)&&c.attempts[0].stdoutSha256===c.attempts[1].stdoutSha256,"case:"+c.id);
 }
 if(record?.stages?.offlineUse?.status==="passed")need(record.stages.validateInspect.status==="passed"&&record.isolation?.positive?.exitCode===0&&record.isolation?.denied?.exitCode!==0&&record.execution?.networkMode==="OS-denied","inactive-denial");
 if(record?.stages?.uninstall?.status==="passed")need(record.uninstall?.prefixAbsent&&record.uninstall?.outsidePreserved&&record.uninstall?.archivePreserved&&record.uninstall?.runtimePreserved,"unscoped-uninstall");
 need(record?.blockers?.length>=2,"missing-blockers");return errors;
}
