#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseDocument } from 'yaml';
import { catalogErrors } from './lib/evaluation-library.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const corpusPath = 'fixtures/interoperability/v1/corpus.json';
const read = p => readFileSync(path.join(root, p));
const json = p => JSON.parse(read(p));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const corpusBytes = read(corpusPath), corpus = JSON.parse(corpusBytes);
assert.equal(corpus.corpusId, 'nf-119-interop-v1');
assert.equal(corpus.formatVersion, '0.1-draft');
assert.equal(corpus.manifestSpecVersion, '0.1');
assert.equal(corpus.specificationStatus, 'Draft');
assert.match(corpus.inputRevision, /^[0-9a-f]{40}$/u);
const safePath = p => typeof p === 'string' && !p.includes('\\') && !p.includes(':') && !path.posix.isAbsolute(p) && p.split('/').every(s => s && s !== '.' && s !== '..');
const cache = new Map();
function archived(p, revision = corpus.inputRevision) {
  assert(safePath(p), 'unsafe corpus path'); assert.match(revision, /^[0-9a-f]{40}$/u);
  const key = revision + ':' + p;
  if (!cache.has(key)) cache.set(key, execFileSync('git', ['show', key], { cwd: root, maxBuffer: 8 * 1024 * 1024 }));
  return cache.get(key);
}
const source = new Map(corpus.sources.map(item => [item.path, item]));
assert.equal(source.size, corpus.sources.length, 'duplicate source pin');
for (const item of corpus.sources) {
  assert.equal(item.revision, corpus.inputRevision);
  assert.equal(digest(archived(item.path)), item.sha256, item.path);
}
const local = new Set();
for (const artifact of corpus.artifacts) {
  assert(safePath(artifact.path)); assert(!local.has(artifact.path)); local.add(artifact.path);
  assert.equal(digest(read(artifact.path)), artifact.sha256, artifact.path);
}
function data(p) { assert(source.has(p) || local.has(p), 'unregistered input: ' + p); return source.has(p) ? archived(p) : read(p); }
function document(p) { const bytes = data(p).toString(); if (p.endsWith('.json')) return JSON.parse(bytes); const parsed = parseDocument(bytes, { uniqueKeys: true }); assert.equal(parsed.errors.length, 0, p); return parsed.toJS(); }
function patch(value, operations) {
  const result = structuredClone(value);
  for (const op of operations) {
    assert(['add', 'remove', 'replace'].includes(op.op));
    const parts = Array.isArray(op.path) ? [...op.path] : op.path.slice(1).split('/').map(s => s.replaceAll('~1', '/').replaceAll('~0', '~'));
    assert(parts.length && parts.every(s => typeof s === 'string' && !['__proto__','prototype','constructor'].includes(s)));
    const key = parts.pop(); let parent = result;
    for (const part of parts) { assert(Object.hasOwn(parent, part), 'missing patch parent'); parent = parent[part]; }
    if (op.op !== 'add') assert(Object.hasOwn(parent, key), 'missing patch target');
    if (Array.isArray(parent)) {
      const index = key === '-' ? parent.length : Number(key); assert(Number.isInteger(index) && index >= 0 && index <= parent.length);
      if (op.op === 'remove') parent.splice(index, 1); else if (op.op === 'add') parent.splice(index, 0, structuredClone(op.value)); else parent[index] = structuredClone(op.value);
    } else if (op.op === 'remove') delete parent[key]; else parent[key] = structuredClone(op.value);
  }
  return result;
}
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}
const ajv = new Ajv2020({ strict: false, allErrors: true }); addFormats(ajv);
const schemas = [...source.keys()].filter(p => /^schemas\/.*\.schema\.json$/u.test(p)).map(document);
assert.equal(schemas.length, 18);
for (const schema of schemas) ajv.addSchema(schema);
const byKind = new Map(schemas.filter(s => s.properties?.kind?.const).map(s => [s.properties.kind.const, ajv.getSchema(s.$id)]));
assert.equal(byKind.size, 17);
const schemaValid = value => byKind.has(value.kind) && byKind.get(value.kind)(value);
const library = document('evaluation/library-cases.json');
assert.deepEqual(catalogErrors(library, document('evaluation/baseline.json')), []);
for (const item of library.files) assert.equal(digest(data(item.path)), item.sha256);
const supplemental = document('fixtures/interoperability/v1/supplemental.json');
const counts = {}, cases = new Map();
for (const suite of corpus.suites) {
  const catalog = document(suite.file);
  const entries = suite.field ? catalog[suite.field] : catalog.cases;
  assert.equal(entries.length, suite.caseCount, suite.id);
  for (const item of entries) {
    const id = suite.id + '/' + item.id;
    assert(!cases.has(id), 'duplicate case');
    const profile = suite.operationProfiles ? suite.operationProfiles[item.operation] : suite.profile;
    assert(profile); cases.set(id, profile); counts[profile] = (counts[profile] ?? 0) + 1;
  }
}
assert.equal(cases.size, corpus.caseCount); assert.equal(cases.size, 447);
assert.deepEqual(counts, corpus.profileCounts);
const expectedShapes = ['small','solo','software','startup','enterprise','product','open-source','research'];
assert.deepEqual(corpus.teams.map(t => t.shape), expectedShapes);
const examplePaths = library.cases.filter(c => c.operation === 'manifest-schema' && c.expected.valid).map(c => c.input.file).sort();
assert.equal(examplePaths.length, 109);
assert.deepEqual(corpus.teams.flatMap(t => t.files).sort(), examplePaths);
for (const team of corpus.teams) { assert.equal(team.files.length, team.manifestCount); assert(team.files.every(p => p.startsWith(team.root + '/'))); }
for (const item of library.cases.filter(c => c.operation === 'manifest-schema')) assert.equal(Boolean(schemaValid(document(item.input.file))), item.expected.valid, item.id);
for (const item of supplemental.schemaCases) assert.equal(Boolean(schemaValid(item.input.value)), item.expected.valid, item.id);
assert.equal(new Set(supplemental.schemaCases.map(c => c.migrationGroup)).size, 5);
const claimSchema = ajv.compile(document('conformance/conformance-claim.schema.json'));
for (const item of document('fixtures/conformance/index.json').cases) {
  const value = patch(document('fixtures/conformance/' + item.base), item.patch);
  assert.equal(claimSchema(value), item.expected.valid, item.id);
}
const registrySchema = ajv.compile(document('extensions/registry.schema.json'));
for (const [name, recipe] of Object.entries(supplemental.registryVariants)) {
  const snapshot = patch(document(recipe.base), recipe.patch);
  assert.equal(digest(canonical(snapshot)), recipe.materializedSha256, name + ': recipe differs from the original NF-117 input');
  assert.equal(registrySchema(snapshot), name !== 'invalid-source', name);
}
const extensionCatalog = document('fixtures/extension-registry/compatibility.yaml');
assert.equal(Object.keys(supplemental.extensionInputs).length, extensionCatalog.cases.length);
for (const item of extensionCatalog.cases) {
  assert(Object.hasOwn(supplemental.registryVariants, item.registry ?? 'current'));
  const input = supplemental.extensionInputs[item.id];
  assert.deepEqual(input.selection, {...extensionCatalog.selection,...item.selection});
  assert.equal(Boolean(schemaValid(input.manifest)), input.expected.schemaValid, item.id);
  assert.equal(input.expected.schemaValid, (item.static ?? 'valid') === 'valid');
  assert.equal(input.expected.validatorStatus, item.static ?? 'valid');
  assert.deepEqual(input.expected.diagnosticCodes, item.diagnostics ?? []);
  assert.equal(input.expected.registryDisposition, item.expected);
  assert.equal(input.expected.executionAuthorized, false);
  assert(schemaValid(input.project));
  assert.equal(input.manifest.extensions[0].fixtureMetadata.opaque, supplemental.redactionCanaries[0]);
}
const cliChecks = document('packages/cli/contracts/output.schema.json').properties.checks.properties;
for (const item of supplemental.cliCases) {
  assert(corpus.teams.some(t => t.root === item.input.root));
  for (const op of item.input.overlay) assert(safePath(op.file));
  assert.equal(item.expected.executionAuthorized, false); assert.equal(item.expected.inputMutation, 'none');
  for (const key of Object.keys(item.expected.checks ?? {})) assert(Object.hasOwn(cliChecks, key), 'unknown CLI layer: ' + key);
}
for (const item of supplemental.runtimeCases) { assert.equal(item.expected.state, 'unsupported'); assert.equal(item.expected.runtimeExecution, 'not-run'); assert.equal(item.expected.executionAuthorized, false); }
const assessment = document('fixtures/interoperability/v1/version-assessment.json');
const foundation = assessment.publishedFoundationRevision;
const foundationExamples = execFileSync('git', ['ls-tree','-r','--name-only',foundation,'--','examples'], {cwd:root,encoding:'utf8'}).trim().split('\n').filter(p => /\.ya?ml$/u.test(p)).sort();
assert.deepEqual(assessment.previousExamples.observations.map(o => o.file).sort(), foundationExamples);
const oldAjv = new Ajv2020({ strict: false, allErrors: true }); addFormats(oldAjv);
for (const p of [...source.keys()].filter(p => /^schemas\/.*\.schema\.json$/u.test(p))) oldAjv.addSchema(JSON.parse(archived(p, foundation)));
for (const observation of assessment.previousExamples.observations) {
  const bytes = archived(observation.file, foundation), parsed = parseDocument(bytes.toString(), { uniqueKeys: true }); assert.equal(parsed.errors.length, 0);
  assert.equal(digest(bytes), observation.inputSha256); assert.equal(Boolean(schemaValid(parsed.toJS())), observation.valid); assert.equal(observation.valid, true);
}
assert.equal(assessment.previousExamples.observations.length, 113);
for (const probe of assessment.acceptanceNarrowing) {
  assert.equal(oldAjv.getSchema('https://nexflow.dev/schemas/project.schema.json')(probe.value), probe.beforeValid);
  assert.equal(Boolean(schemaValid(probe.value)), probe.afterValid); assert.equal(probe.beforeValid, true); assert.equal(probe.afterValid, false);
}
assert.equal(assessment.credentialFieldRequired, false); assert.deepEqual(assessment.changedExistingDefinitions, []);
assert.equal(document('schemas/project.schema.json').properties.project.properties.policies.required?.includes('credentialHandling') ?? false, assessment.credentialFieldRequired);
assert.equal(assessment.legacyCatalogFileCoverage.unchanged, 156);
const beforeCommon = JSON.parse(archived('schemas/common.schema.json', foundation));
const afterCommon = document('schemas/common.schema.json');
assert.deepEqual(Object.keys(afterCommon.$defs).filter(k => !Object.hasOwn(beforeCommon.$defs, k)).sort(), assessment.addedDefinitions);
assert.deepEqual(Object.keys(beforeCommon.$defs).filter(k => canonical(beforeCommon.$defs[k]) !== canonical(afterCommon.$defs[k])), assessment.changedExistingDefinitions);
assert.deepEqual(assessment.changedSchemas, [...source.keys()].filter(p => /^schemas\/.*\.schema\.json$/u.test(p))
  .filter(p => digest(archived(p, foundation)) !== digest(data(p))).map(p => ({path:p,beforeSha256:digest(archived(p, foundation)),afterSha256:digest(data(p))})));
for (const p of [...source.keys()].filter(p => /^schemas\/.*\.schema\.json$/u.test(p))) assert(data(p).equals(archived(p, corpus.prerequisite.commit)), 'schema drift since v0.7.0');
for (const binding of assessment.legacyRuleDocuments) assert.equal(archived(binding.path, library.specificationRevision).equals(data(binding.path)), binding.unchangedSinceCatalog);
assert.equal(corpus.normalization.minimumRuns, 2); assert.equal(corpus.normalization.diagnosticFields.join(','), 'category,code,file,path,severity,meaning');
const validateObservation = ajv.compile(document('fixtures/interoperability/v1/result.schema.json'));
function observationErrors(report) {
  if (!validateObservation(report)) return ['observation-schema'];
  const errors = [];
  if (report.corpusSha256 !== digest(corpusBytes)) errors.push('wrong-corpus');
  const seen = new Set();
  for (const item of report.results ?? []) {
    if (seen.has(item.caseId)) errors.push('duplicate-case'); seen.add(item.caseId);
    if (!cases.has(item.caseId) || cases.get(item.caseId) !== item.profile) errors.push('wrong-case-profile');
    if (item.profile === 'runtime-boundary' && !['unsupported','not-tested'].includes(item.state)) errors.push('runtime-scope');
  }
  if (seen.size !== cases.size) errors.push('missing-cases');
  return errors;
}
const records = [...cases].map(([caseId, profile]) => ({caseId,profile,state:'not-tested',observed:null,diagnostics:[],checks:{schema:'not-run',staticSemantics:'not-run',extensionMetadata:'not-run',extensionExecution:'not-run',runtimeExecution:'not-run'},executionAuthorized:false}));
const frame = {formatVersion:'0.1-draft',corpusId:corpus.corpusId,corpusSha256:digest(corpusBytes),subject:{name:'synthetic-format-control',revision:corpus.inputRevision},runId:'schema-control-only',results:records};
assert.deepEqual(observationErrors(frame), []);
const absentDetails = structuredClone(frame);
absentDetails.results[0].state = 'error';
absentDetails.results[0].diagnostics = [{category:null,code:null,file:null,path:null,severity:null,meaning:null}];
assert.deepEqual(observationErrors(absentDetails), [], 'Missing native details must remain explicit rather than invented');
for (const change of [x => x.results[0].executionAuthorized = true, x => x.results[0].checks.runtimeExecution = 'passed', x => x.results[0].observed = {valid:true}, x => x.results.pop(), x => x.corpusSha256 = '0'.repeat(64), x => {x.results[1].caseId=x.results[0].caseId;x.results[1].state='error';}, x => x.results[0].caseId='unknown/case', x => x.results[0].profile='parser']) {
  const bad = structuredClone(frame); change(bad); assert(observationErrors(bad).length);
}
const leakedPath = structuredClone(absentDetails);
leakedPath.results[0].diagnostics[0].file = '/synthetic-private-root/input.yaml';
assert(observationErrors(leakedPath).length, 'An absolute diagnostic path must not become a normalized pass');
if (process.argv[2]) {
  assert.equal(process.argv[2], '--observations'); assert.equal(process.argv.length, 4);
  assert.deepEqual(observationErrors(JSON.parse(readFileSync(process.argv[3]))), [], 'Invalid observation protocol; this is not a comparison result.');
}
for (const artifact of corpus.artifacts) assert.equal(digest(read(artifact.path)), artifact.sha256, 'Rehearsal mutated a corpus artifact');
const status = execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim();
console.log(JSON.stringify({task:'NF-119',corpusId:corpus.corpusId,corpusSha256:digest(corpusBytes),inputRevision:corpus.inputRevision,verificationRevision:status?null:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),caseCount:cases.size,sourceFiles:source.size,exampleManifests:examplePaths.length,foundationExamples:113,retainedAcceptanceNarrowing:assessment.acceptanceNarrowing.length,profileCounts:counts,independentComparison:'not-tested',runtimeExecution:'not-run',outcome:'corpus-prepared'},null,2));
