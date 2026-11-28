#!/usr/bin/env node
// A comparison controller, never an implementation backend. Expected results stay here.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { arch, platform, release, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse, stringify } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';

export const implementationRevision = 'bd5cd4140801f205746fac17ea9d3a258993011c';
export const corpusSha256 = 'd080a4cf0cfc82a16d74b9b43f5d24b3f7949970b106b763f7922447f8af5439';
const root = fileURLToPath(new URL('../', import.meta.url));
const sha = data => createHash('sha256').update(data).digest('hex');
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
const safe = file => typeof file === 'string' && !path.isAbsolute(file) && !/[:\\]/u.test(file)
  && file.split('/').every(part => part && !['.', '..'].includes(part));
const nullChecks = () => ({ schema: 'not-run', staticSemantics: 'not-run', extensionMetadata: 'not-run', extensionExecution: 'not-run', runtimeExecution: 'not-run' });

export function normalizeDiagnostic(issue) {
  const file = issue.file ?? null;
  if (file !== null) assert(!/^(?:\/|[A-Za-z]:)/u.test(file), 'Absolute path before normalization');
  const context = { ...(issue.context ?? {}), ...Object.fromEntries(['kind','sourceKind','targetNamespace','targetId']
    .filter(key => typeof issue[key] === 'string').map(key => [key,issue[key]])) };
  return { category: issue.keyword ?? issue.category ?? null, code: issue.code ?? null,
    file: file?.replaceAll('\\', '/').replace(/^\.\//u, '') ?? null,
    path: issue.path ?? issue.instancePath ?? null, severity: issue.severity ?? null,
    meaning: typeof issue.meaning === 'string' ? { kind: issue.meaning, details: context }
      : issue.meaning ?? (Object.keys(context).length ? {kind:'native-context',details:context} : null) };
}
export function normalize(entry, raw) {
  const native = raw.native;
  let diagnostics = native?.diagnostics ?? native?.output?.diagnostics ?? [];
  if (entry.profile === 'parser' && native && !native.valid) diagnostics = [{ category: native.category }];
  const checks = nullChecks();
  if (raw.state === 'observed') {
    if (['schema', 'migration'].includes(entry.profile)) checks.schema = native.checks?.schema ?? 'not-run';
    if (entry.profile === 'local-schema-engine') checks.schema = native.valid ? 'passed' : 'failed';
    if (entry.profile === 'static-fragments') checks.staticSemantics = native.valid ? 'passed' : 'failed';
    if (native.output?.checks?.schema && ['passed', 'failed'].includes(native.output.checks.schema)) checks.schema = native.output.checks.schema;
  }
  const observed = !native ? null : native.output ? { exitCode: native.exitCode, success: native.output.success,
    documentCount: native.output.result?.documentCount ?? null, result: native.output.result ?? null, checks: native.output.checks }
    : { valid: native.valid, ...(entry.profile === 'parser' ? { value: native.value, category: native.category } : {}),
      ...(entry.profile === 'discovery' ? { documentCount: native.documentCount, workflowIds: native.workflowIds } : {}) };
  return { caseId: entry.caseId, profile: entry.profile, state: raw.state, observed,
    diagnostics: diagnostics.map(normalizeDiagnostic), checks, executionAuthorized: false };
}
export function compareRows(left, right) {
  if (left.state !== 'observed' || right.state !== 'observed') return { comparison: 'outside-common-scope', differences: [] };
  const differences = [];
  const { checks: leftLayers, ...leftValue } = left.observed;
  const { checks: rightLayers, ...rightValue } = right.observed;
  if (!isDeepStrictEqual(leftValue, rightValue)) differences.push('interpretation');
  const severity = { error: 0, warning: 1, info: 2 };
  const key = d => canonical([d.file, d.path, severity[d.severity] ?? null, d.code, d.meaning, d.category]);
  if (!isDeepStrictEqual([...left.diagnostics].sort((a,b) => key(a).localeCompare(key(b), 'en')),
    [...right.diagnostics].sort((a,b) => key(a).localeCompare(key(b), 'en')))) differences.push('diagnostics');
  if (!isDeepStrictEqual(left.checks, right.checks) || !isDeepStrictEqual(leftLayers, rightLayers)) differences.push('performed-layers');
  return { comparison: differences.length ? 'different' : 'match', differences };
}
function inventory(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en')).flatMap(entry => {
    const relative = prefix + entry.name;
    assert(!entry.isSymbolicLink(), 'Unexpected input symlink');
    return entry.isDirectory() ? inventory(path.join(directory, entry.name), relative + '/') : [[relative, sha(readFileSync(path.join(directory, entry.name)))]];
  });
}
function command(executable, args, input, cwd = root) {
  const env = Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','TMPDIR','LANG','LC_ALL'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  const result = spawnSync(executable, args, { cwd, input, encoding: 'utf8', shell: false, timeout: 120000, maxBuffer: 16 * 1024 * 1024,
    env: { ...env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' } });
  assert.equal(result.error, undefined, 'Comparison process unavailable');
  assert.equal(result.stderr, '', 'Unexpected native stderr; do not normalize away a failure');
  return result;
}
export function oracleFindings(entry, row) {
  if (row.state !== 'observed') return ['not-assessed'];
  const expected = entry.expected, issues = [];
  if (typeof expected?.valid === 'boolean' && row.observed.valid !== expected.valid) issues.push('validity');
  if (expected?.exitCode !== undefined && row.observed.exitCode !== expected.exitCode) issues.push('exit-status');
  const codes = expected?.diagnosticCodes;
  if (codes && !isDeepStrictEqual(row.diagnostics.map(d => d.code), codes)) issues.push('diagnostic-codes');
  if (expected?.documentCount !== undefined && row.observed.documentCount !== expected.documentCount) issues.push('document-count');
  for (const [key, value] of Object.entries(expected?.checks ?? {})) if (row.observed.checks?.[key] !== value) issues.push('layer:' + key);
  for (const diagnostic of expected?.diagnostics ?? []) {
    const pointer = (diagnostic.path ?? diagnostic.instancePath ?? null);
    const expectedPath = diagnostic.missingProperty ? (pointer ?? '') + '/' + diagnostic.missingProperty.replaceAll('~','~0').replaceAll('/','~1') : pointer;
    if (!row.diagnostics.some(actual => (diagnostic.code === undefined || actual.code === diagnostic.code)
      && (diagnostic.category === undefined || actual.category === diagnostic.category)
      && (expectedPath === null || actual.path === expectedPath))) issues.push('diagnostic-expectation');
  }
  if (Array.isArray(expected?.diagnostics) && row.diagnostics.length !== expected.diagnostics.length) issues.push('diagnostic-count');
  return [...new Set(issues)];
}
async function main() {
  assert.equal(process.argv.length, 4, 'Use: node scripts/interoperability-compare.mjs PYTHON NEW_OUTPUT_DIRECTORY');
  assert.equal(process.versions.node,'26.13.1','Use the selected reference runtime');
  const python = path.resolve(process.argv[2]), output = path.resolve(process.argv[3]);
  mkdirSync(output); // Never overwrite an accepted report.
  const corpusBytes = readFileSync(path.join(root, 'fixtures/interoperability/v1/corpus.json'));
  assert.equal(sha(corpusBytes), corpusSha256);
  const corpus = JSON.parse(corpusBytes), scratch = realpathSync(mkdtempSync(path.join(tmpdir(), 'nf-120-inputs-')));
  const inputs = path.join(scratch, 'inputs'); mkdirSync(inputs);
  try {
    const implementationPaths = git('ls-tree', '-r', '--name-only', implementationRevision, '--', 'packages/validation', 'packages/cli', 'evaluation/prototypes/python', 'schemas').toString().trim().split('\n');
    const implementationPins = implementationPaths.map(file => {
      assert.equal(sha(readFileSync(path.join(root, file))), sha(git('show', implementationRevision + ':' + file)), 'Implementation drift: ' + file);
      return { file, sha256: sha(readFileSync(path.join(root, file))) };
    });
    const buildPayload = Object.fromEntries(['validation','cli'].map(name => [name,inventory(path.join(root,'packages',name,'dist'))]));
    for (const source of corpus.sources) {
      assert(safe(source.path));
      const bytes = git('show', source.revision + ':' + source.path); assert.equal(sha(bytes), source.sha256);
      mkdirSync(path.dirname(path.join(inputs, source.path)), { recursive: true }); writeFileSync(path.join(inputs, source.path), bytes);
    }
    for (const artifact of corpus.artifacts) {
      const bytes = readFileSync(path.join(root, artifact.path)); assert.equal(sha(bytes), artifact.sha256);
      mkdirSync(path.dirname(path.join(inputs, artifact.path)), { recursive: true }); writeFileSync(path.join(inputs, artifact.path), bytes);
    }
    const entries = [];
    for (const suite of corpus.suites) {
      const catalog = suite.file.endsWith('.yaml') ? parse(readFileSync(path.join(inputs, suite.file), 'utf8')) : json(path.join(inputs, suite.file));
      for (const item of catalog[suite.field ?? 'cases']) {
        const profile = suite.profile ?? suite.operationProfiles[item.operation];
        entries.push({ caseId: suite.id + '/' + item.id, profile, operation: item.operation ?? profile, input: item.input ?? {},
          expected: item.expected, cli: profile === 'prototype-cli' ? { root: suite.rootPrefix + '/' + item.root,
            argv: [item.command, '--root', '{root}', ...item.args, '--format', 'json'], overlay: [] } : profile === 'public-cli' ? item.input : null });
      }
    }
    assert.equal(entries.length, 447);
    // Materialize CLI overlays identically for both subjects before executing either.
    for (const entry of entries.filter(e => e.cli)) {
      const target = path.join(inputs, 'selected-cli', entry.caseId);
      cpSync(path.join(inputs, entry.cli.root), target, { recursive: true });
      for (const op of entry.cli.overlay) {
        assert.equal(op.op, 'replace'); assert(safe(op.file));
        const file = path.join(target, op.file), value = parse(readFileSync(file, 'utf8'));
        const parts = op.path.slice(1).split('/').map(p => p.replaceAll('~1', '/').replaceAll('~0', '~'));
        const key = parts.pop(); let parent = value;
        for (const part of parts) { assert(!['__proto__','constructor','prototype'].includes(part)); parent = parent[part]; }
        assert(Object.hasOwn(parent, key)); parent[key] = op.value; writeFileSync(file, stringify(value));
      }
      entry.cli.selectedRoot = target;
    }
    const originalInventory = inventory(inputs);
    const packet = JSON.stringify(entries.map(({ caseId, profile, operation, input }) => ({ caseId, profile, operation, input })));
    const observationSchema = new Ajv2020({ strict: false }).compile(json(path.join(inputs, 'fixtures/interoperability/v1/result.schema.json')));
    const reports = {}, repeatability = {}, rawHashes = {};
    for (const subject of ['reference', 'python']) {
      const runs = [];
      for (let attempt = 1; attempt <= 2; attempt++) {
        assert.deepEqual(inventory(inputs), originalInventory);
        const run = subject === 'reference' ? command(process.execPath, ['scripts/interop-reference-driver.mjs', root, inputs], packet)
          : command(python, ['-I', '-B', 'scripts/interop-python-driver.py', root, inputs], packet);
        assert.equal(run.status, 0, 'Native driver failed');
        const raw = JSON.parse(run.stdout); assert.equal(raw.length, 447);
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]; assert.equal(raw[i].caseId, entry.caseId);
          if (!entry.cli) continue;
          const cliSupported = subject === 'reference' ? entry.profile === 'public-cli' : ['validate', 'inspect'].includes(entry.cli.argv[0]);
          if (!cliSupported) continue;
          const args = entry.cli.argv.map(arg => arg === '{root}' ? entry.cli.selectedRoot : arg);
          const before = inventory(entry.cli.selectedRoot);
          const cli = subject === 'reference' ? command(process.execPath, [path.join(root, 'packages/cli/dist/main.js'), ...args])
            : command(python, ['-I', '-B', path.join(root, 'evaluation/prototypes/python/cli.py'), ...args]);
          const result = JSON.parse(cli.stdout);
          assert.equal(cli.status, result.exitCode); assert.equal(result.executionAuthorized, false);
          assert.deepEqual(inventory(entry.cli.selectedRoot), before, 'CLI input mutation');
          raw[i] = { caseId: entry.caseId, state: 'observed', reason: null, native: { exitCode: cli.status, output: result } };
        }
        const encoded = JSON.stringify(raw);
        for (const privateValue of [root, inputs, scratch, ...json(path.join(inputs, 'fixtures/interoperability/v1/supplemental.json')).redactionCanaries])
          assert(!encoded.includes(privateValue), 'Raw output leaked a private root or canary');
        assert(!encoded.includes('Traceback (most recent call last)'), 'Native exception leaked');
        function checkProjection(value) {
          if (!value || typeof value !== 'object') return;
          assert(!(value.specVersion && value.kind && value.metadata), 'Unfiltered source document in public output');
          assert(value.executionAuthorized !== true, 'Expanded authority');
          assert(!['passed','executed'].includes(value.runtimeExecution), 'Unexpected runtime execution');
          assert(!['passed','executed'].includes(value.extensionExecution), 'Unexpected extension execution');
          Object.values(value).forEach(checkProjection);
        }
        raw.forEach(checkProjection);
        const rows = entries.map((entry, i) => normalize(entry, raw[i]));
        const report = { formatVersion: '0.1-draft', corpusId: corpus.corpusId, corpusSha256,
          subject: { name: subject === 'reference' ? '@nexflow/validation + reference CLI' : 'native Python evaluation candidate', revision: implementationRevision },
          runId: 'NF-120/' + subject + '/' + attempt, results: rows };
        assert(observationSchema(report), JSON.stringify(observationSchema.errors));
        assert.deepEqual(inventory(inputs), originalInventory, 'Input bytes changed during run');
        writeFileSync(path.join(output, subject + '-run-' + attempt + '.jsonl'), raw.map(row => JSON.stringify(row)).join('\n') + '\n');
        runs.push({ raw, rows, report });
      }
      repeatability[subject] = { rawOrderAndValuesEqual: isDeepStrictEqual(runs[0].raw, runs[1].raw), inputMutation: 'none', runs: 2 };
      rawHashes[subject] = [1,2].map(i => ({ file: subject + '-run-' + i + '.jsonl', sha256: sha(readFileSync(path.join(output, subject + '-run-' + i + '.jsonl'))) }));
      reports[subject] = runs[0].report;
      writeFileSync(path.join(output, subject + '.json'), JSON.stringify(reports[subject], null, 2) + '\n');
    }
    const comparison = entries.map((entry, index) => ({ caseId: entry.caseId, profile: entry.profile,
      referenceState: reports.reference.results[index].state, pythonState: reports.python.results[index].state,
      ...compareRows(reports.reference.results[index], reports.python.results[index]),
      oracleFindings: Object.fromEntries(Object.keys(reports).map(subject => [subject, oracleFindings(entry, reports[subject].results[index])])) }));
    const profileSummary = Object.fromEntries(Object.keys(corpus.profileCounts).map(profile => {
      const rows = comparison.filter(c => c.profile === profile);
      return [profile, { cases: rows.length, matches: rows.filter(r => r.comparison === 'match').length,
        differences: rows.filter(r => r.comparison === 'different').length, outsideCommonScope: rows.filter(r => r.comparison === 'outside-common-scope').length,
        reference: Object.fromEntries(['observed','unsupported','error','not-tested'].map(state => [state, rows.filter(r => r.referenceState === state).length])),
        python: Object.fromEntries(['observed','unsupported','error','not-tested'].map(state => [state, rows.filter(r => r.pythonState === state).length])) }];
    }));
    const environment = { platform: platform(), architecture: arch(), kernel: release(), node: process.versions.node,
      osVersion: platform() === 'darwin' ? execFileSync('sw_vers',['-productVersion'],{encoding:'utf8'}).trim() : release(),
      referenceDependencies: Object.fromEntries(['ajv','ajv-formats','yaml','typescript'].map(name => [name,json(path.join(root,'packages/validation/node_modules',name,'package.json')).version])),
      python: JSON.parse(command(python,['-I','-c','import sys,json,importlib.metadata as m;print(json.dumps({"version":sys.version.split()[0],"dependencies":dict(sorted((d.metadata["Name"],d.version) for d in m.distributions()))}))']).stdout) };
    assert.equal(environment.python.version,'3.12.15','Use the selected native interpreter');
    for(const name of ['validation','cli']) assert.deepEqual(inventory(path.join(root,'packages',name,'dist')),buildPayload[name]);
    const scripts = ['scripts/interoperability-compare.mjs','scripts/interop-reference-driver.mjs','scripts/interop-python-driver.py'];
    const summary = { task: 'NF-120', outcome: 'comparison-recorded-with-gaps', specification: '0.1 Draft comparison baseline; NF-121 decision pending',
      corpusId: corpus.corpusId, corpusSha256, corpusInputRevision: corpus.inputRevision, implementationRevision,
      caseCount: 447, environment, repeatability, rawHashes, profileSummary,
      adapterSources: scripts.map(file => ({ file, sha256: sha(readFileSync(path.join(root,file))) })),
      implementationPins, buildPayload, inputInventorySha256: sha(canonical(originalInventory)), inputFileCount: originalInventory.length,
      independence: 'Native Python modules use PyYAML/jsonschema/referencing; no reference or JavaScript backend. Shared inputs and comparison controller; not an independent human audit.',
      runtimeExperiments: { executed: false, extensionExecution: 'not-run', workflowExecution: 'not-run', liveIntegrations: 'not-run', sourceHostFixture: 'not-run' },
      limits: ['Schema/static/CLI source experiment, not installed artifact lifecycle or OS isolation.', 'No full semantic conformance, performance score, winner, release readiness or new specification decision.',
        'Unsupported operations remain in the complete 447-case denominator. Python fragment support is not a public reference-library capability.',
        'Only native structured diagnostic fields are normalized; absent fields remain null. Parser wording and package-specific prose do not grant semantic equivalence.'],
      comparison };
    writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    for (const pin of implementationPins) assert.equal(sha(readFileSync(path.join(root, pin.file))), pin.sha256);
    console.log(JSON.stringify({ task: summary.task, outcome: summary.outcome, caseCount: 447, profileSummary, repeatability }, null, 2));
    assert(Object.values(repeatability).every(r => r.rawOrderAndValuesEqual), 'Repeatability failure retained in report');
    assert(!comparison.some(c => c.referenceState === 'error' || c.pythonState === 'error'), 'Adapter error retained in report');
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
