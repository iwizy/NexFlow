import { diagnostic, orderedDiagnostics, safeLocator } from "./diagnostics.js";
import { discover } from "./discovery.js";
import { LocalInputs } from "./files.js";
import { inspect, InspectionLimit } from "./inspection.js";
import { knownKind, object, type Envelope, type Json, type ObjectValue, type Selection } from "./model.js";
import { repositorySchemas, SchemaEngine } from "./schema.js";
import { parseYaml } from "./yaml.js";
import { semanticOperation } from "./semantics.js";
export { discover, inspect, parseYaml, repositorySchemas, SchemaEngine };
export type { Selection, Manifest, Diagnostic, Json } from "./model.js";

export function evaluate(command: "validate" | "inspect", selection: Selection): Envelope {
  const output: Envelope = {
    formatVersion: "0.4-draft", tool: { name: "nexflow-typescript-evaluation", version: "unreleased" },
    supportedSpecVersions: ["0.1"], command, success: false, exitCode: 1, inputMode: null,
    checks: { discovery: "not-run", schema: "not-run", semantic: "not-run", coreProfile: "not-run", extensionProfiles: "not-run" },
    executionAuthorized: false, diagnostics: [], truncated: false, result: null,
  };
  // Type annotations do not constrain JavaScript library callers at runtime.
  if (command !== "validate" && command !== "inspect") {
    output.command = null;
    output.exitCode = 2;
    output.diagnostics = [diagnostic("NEXFLOW-PROTOTYPE-USAGE", null)];
    return output;
  }
  try {
    const assembly = discover(selection);
    output.inputMode = assembly.mode;
    output.checks.discovery = assembly.diagnostics.length ? "failed" : "passed";
    if (assembly.diagnostics.length) {
      output.diagnostics = assembly.diagnostics;
      if (assembly.diagnostics.some(item => ["NF-DISCOVERY-UNSUPPORTED-VERSION", "NF-DISCOVERY-UNSUPPORTED-KIND"].includes(item.code))) output.exitCode = 3;
    } else {
      output.checks.schema = "unavailable";
      const schemas = repositorySchemas();
      const issues = assembly.documents.flatMap(document => schemas.validate(document));
      output.checks.schema = issues.length ? "failed" : "passed";
      if (issues.length) output.diagnostics = issues;
      else {
        const inspection = command === "inspect" ? inspect(assembly.documents) : undefined;
        output.result = { documentCount: assembly.documents.length,
          documents: assembly.documents.map(({ file, kind }) => ({ file: safeLocator(file), kind })),
          ...(inspection ? { inspection } : {}),
        };
        output.exitCode = 0;
        output.success = true;
      }
    }
  } catch (error) {
    output.diagnostics = [diagnostic(error instanceof InspectionLimit ? "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT" : "NEXFLOW-PROTOTYPE-INTERNAL", null)];
    output.exitCode = error instanceof InspectionLimit ? 1 : 4;
    output.result = null;
    output.success = false;
  }
  output.diagnostics = orderedDiagnostics(output.diagnostics);
  output.truncated = output.diagnostics.length > 200;
  output.diagnostics = output.diagnostics.slice(0, 200);
  return output;
}

export interface LibraryCase { id: string; operation: string; input: ObjectValue }
export interface LibraryResult {
  caseId: string; operation: string; valid: boolean | null;
  diagnostics: object[]; checks: { runtime: "not-run"; extensions: "not-run" };
  status?: "not-implemented"; documentCount?: number; workflowIds?: string[];
}
export function evaluateLibraryCase(entry: LibraryCase, repositoryRoot: string,
  schemas?: SchemaEngine): LibraryResult {
  const result: LibraryResult = { caseId: entry.id, operation: entry.operation, valid: false,
    diagnostics: [], checks: { runtime: "not-run", extensions: "not-run" } };
  if (entry.operation === "yaml-parse") {
    if (typeof entry.input.yaml !== "string") throw new Error("invalid library input");
    const parsed = parseYaml(entry.input.yaml);
    result.valid = parsed.valid;
    result.diagnostics = parsed.valid ? [] : [{ category: parsed.category }];
  } else if (entry.operation === "local-schema") {
    if (!Array.isArray(entry.input.schemas) || typeof entry.input.entryId !== "string") throw new Error("invalid library input");
    result.diagnostics = new SchemaEngine(entry.input.schemas).validateLocal(entry.input.entryId, entry.input.value);
    result.valid = result.diagnostics.length === 0;
  } else if (entry.operation === "manifest-schema") {
    if (typeof entry.input.file !== "string") throw new Error("invalid library input");
    const parsed = parseYaml(new LocalInputs(repositoryRoot).read(entry.input.file));
    const kind = object(parsed.value).kind;
    if (!parsed.valid) result.diagnostics = [{ category: parsed.category }];
    else if (!knownKind(kind)) result.diagnostics = [{ code: "NF-SCHEMA", category: "unknown-kind",
      kind: typeof kind === "string" && /^[A-Z][A-Za-z]{0,31}$/u.test(kind) ? kind : "<redacted-kind>", instancePath: "" }];
    else result.diagnostics = (schemas ?? repositorySchemas()).validateValue(kind, parsed.value as Json).map(issue => ({ ...issue, kind }));
    result.valid = result.diagnostics.length === 0;
  } else if (entry.operation === "discovery") {
    // Resolve the catalog root only through the library caller's reviewed base;
    // do not expand arbitrary paths from a manifest or load candidate code.
    if (typeof entry.input.root !== "string" || !Array.isArray(entry.input.args)) throw new Error("invalid library input");
    if (safeLocator(entry.input.root) === "<redacted-source>") throw new Error("invalid library root");
    const args = entry.input.args;
    let project: string | undefined;
    const files: string[] = [];
    for (let index = 0; index < args.length; index += 2) {
      if (typeof args[index + 1] !== "string") throw new Error("invalid library arguments");
      if (args[index] === "--project") project = args[index + 1] as string;
      else if (args[index] === "--file") files.push(args[index + 1] as string);
      else throw new Error("invalid library arguments");
    }
    const discovery = discover({ root: repositoryRoot + "/" + entry.input.root, project,
      ...(files.length ? { files } : {}) });
    result.valid = discovery.diagnostics.length === 0;
    result.diagnostics = discovery.diagnostics.map(({ code }) => ({ code }));
    if (result.valid) {
      result.documentCount = discovery.documents.length;
      result.workflowIds = discovery.documents.filter(document => document.kind === "Workflow")
        .map(document => String(object(document.value.workflow).id)).sort();
    }
  } else if (["semantic-fragment", "workflow-namespace", "artifact-namespace"].includes(entry.operation)) {
    result.diagnostics = semanticOperation(entry.operation, entry.input);
    result.valid = result.diagnostics.length === 0;
  } else {
    throw new Error("Unsupported library operation.");
  }
  return result;
}
