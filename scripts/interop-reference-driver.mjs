// NF-120 adapter: public library and read facade only, no oracle or private semantic API.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [source, inputs] = process.argv.slice(2);
const api = await import(pathToFileURL(path.join(source, 'packages/validation/dist/index.js')));
const { readWorkspace } = await import(pathToFileURL(path.join(source, 'packages/cli/dist/workspace.js')));
const validator = api.createValidator();
const packet = JSON.parse(readFileSync(0, 'utf8'));
const results = packet.map(entry => {
  const before = JSON.stringify(entry);
  let native = null, reason = null;
  try {
    if (entry.operation === 'manifest-schema') {
      const value = entry.input.value ?? api.parseYaml(readFileSync(path.join(inputs, entry.input.file), 'utf8')).value;
      native = validator.validateManifest(value, entry.input.file ?? 'input.yaml');
    } else if (entry.operation === 'yaml-parse') native = api.parseYaml(entry.input.yaml);
    else if (entry.operation === 'discovery') {
      const selection = { root: path.join(inputs, entry.input.root) };
      for (let i = 0; i < entry.input.args.length; i += 2) {
        if (entry.input.args[i] === '--project') selection.project = entry.input.args[i + 1];
        else (selection.files ??= []).push(entry.input.args[i + 1]);
      }
      const result = readWorkspace(selection);
      native = { valid: !result.diagnostics.length, diagnostics: result.diagnostics,
        documentCount: result.diagnostics.length ? null : result.documents.length,
        workflowIds: result.diagnostics.length ? null : result.documents.filter(d => d.kind === 'Workflow').map(d => d.value.workflow.id).sort() };
    } else reason = 'No public reference interface for ' + entry.profile;
    if (JSON.stringify(entry) !== before) throw new Error('mutated input');
    return { caseId: entry.caseId, state: native ? 'observed' : 'unsupported', reason, native };
  } catch {
    return { caseId: entry.caseId, state: 'error', reason: 'Reference adapter did not produce a bounded result', native: null };
  }
});
process.stdout.write(JSON.stringify(results) + '\n');
