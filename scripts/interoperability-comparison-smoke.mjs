#!/usr/bin/env node
// Verify receipts and retained differences, not a new implementation correctness oracle.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import { normalize, normalizeDiagnostic, compareRows, oracleFindings, corpusSha256, implementationRevision } from './interoperability-compare.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.argv[2] ?? path.join(root,'docs/0.8/nf-120-evidence'));
const sha = value => createHash('sha256').update(value).digest('hex');
const read = file => readFileSync(path.join(output,file));
const summary = JSON.parse(read('summary.json'));
const corpus = JSON.parse(readFileSync(path.join(root,'fixtures/interoperability/v1/corpus.json')));
assert.equal(summary.corpusSha256, corpusSha256); assert.equal(summary.caseCount,447);
assert.equal(summary.implementationRevision,implementationRevision);
assert.equal(summary.corpusInputRevision,corpus.inputRevision);
assert.equal(summary.outcome,'comparison-recorded-with-gaps');
for (const pin of [...summary.adapterSources,...summary.implementationPins]) assert.equal(sha(readFileSync(path.join(root,pin.file))),pin.sha256,pin.file);
const entries = [];
for (const suite of corpus.suites) {
  const pin = corpus.sources.find(source => source.path === suite.file);
  const bytes = pin ? execFileSync('git',['show',pin.revision+':'+pin.path],{cwd:root}) : readFileSync(path.join(root,suite.file));
  const catalog = suite.file.endsWith('.yaml') ? parse(bytes.toString()) : JSON.parse(bytes);
  for (const item of catalog[suite.field ?? 'cases']) entries.push({caseId:suite.id+'/'+item.id,
    profile:suite.profile ?? suite.operationProfiles[item.operation],expected:item.expected});
}
assert.equal(entries.length,447);
assert.deepEqual(summary.comparison.map(c=>[c.caseId,c.profile]),entries.map(c=>[c.caseId,c.profile]));
const validate = new Ajv2020({strict:false}).compile(JSON.parse(readFileSync(path.join(root,'fixtures/interoperability/v1/result.schema.json'))));
const reports = {};
for (const subject of ['reference','python']) {
  const report = JSON.parse(read(subject+'.json')); assert(validate(report),JSON.stringify(validate.errors));
  assert.equal(report.corpusSha256,corpusSha256); assert.equal(report.subject.revision,implementationRevision);
  const runs = summary.rawHashes[subject].map(receipt => {
    const bytes=read(receipt.file);assert.equal(sha(bytes),receipt.sha256);
    return bytes.toString().trim().split('\n').map(line=>JSON.parse(line));
  });
  assert.deepEqual(runs[0],runs[1],'Raw ordering/repeatability drift');
  assert.deepEqual(runs[0].map(row=>row.caseId),entries.map(row=>row.caseId),'Raw case identity/order drift');
  assert.equal(summary.repeatability[subject].rawOrderAndValuesEqual,true);
  assert.equal(summary.repeatability[subject].inputMutation,'none');
  assert.equal(summary.repeatability[subject].runs,2);
  assert.deepEqual(report.results,entries.map((entry,i)=>normalize(entry,runs[0][i])));
  for (let i=0;i<entries.length;i++) assert.deepEqual(summary.comparison[i].oracleFindings[subject],oracleFindings(entries[i],report.results[i]));
  reports[subject]=report;
}
for (let i=0;i<entries.length;i++) {
  const actual=compareRows(reports.reference.results[i],reports.python.results[i]);
  assert.equal(summary.comparison[i].comparison,actual.comparison);
  assert.deepEqual(summary.comparison[i].differences,actual.differences);
}
for (const [profile,count] of Object.entries(corpus.profileCounts)) {
  const rows=summary.comparison.filter(r=>r.profile===profile),total=summary.profileSummary[profile];
  assert.equal(rows.length,count);assert.equal(total.cases,count);
  for(const [key,state] of [['matches','match'],['differences','different'],['outsideCommonScope','outside-common-scope']]) assert.equal(total[key],rows.filter(r=>r.comparison===state).length);
  for(const subject of ['reference','python']) for(const state of ['observed','unsupported','error','not-tested']) assert.equal(total[subject][state],rows.filter(r=>r[subject+'State']===state).length);
}
assert.deepEqual(summary.runtimeExperiments,{executed:false,extensionExecution:'not-run',workflowExecution:'not-run',liveIntegrations:'not-run',sourceHostFixture:'not-run'});
// Corpus rules: never merge multiplicity or fill missing diagnostic meaning.
assert.equal(normalizeDiagnostic({code:'NF-SCHEMA'}).meaning,null);
assert.throws(()=>normalizeDiagnostic({file:'/synthetic-private-root/input.yaml'}));
const row={state:'observed',observed:{valid:false},diagnostics:[{code:'NF-SCHEMA'}],checks:{schema:'failed'}};
assert.equal(compareRows(row,{...row,diagnostics:[...row.diagnostics,...row.diagnostics]}).comparison,'different');
assert.equal(compareRows(row,{...row,state:'unsupported'}).comparison,'outside-common-scope');
assert.equal(compareRows(row,{...row,observed:{valid:true}}).comparison,'different');
console.log(JSON.stringify({task:'NF-120',receiptVerification:'passed',cases:447,profiles:11,
  matches:summary.comparison.filter(c=>c.comparison==='match').length,
  differences:summary.comparison.filter(c=>c.comparison==='different').length,
  outsideCommonScope:summary.comparison.filter(c=>c.comparison==='outside-common-scope').length,
  outcome:summary.outcome},null,2));
