import { readFileSync } from "node:fs";
import type { Diagnostic, Kind, ValidationResult } from "@nexflow/validation";
import { graphInspection } from "./graph.js";
import { parseArguments, type Arguments } from "./arguments.js";
import { diagnostic, envelope, identity, ordered, usage, type Envelope } from "./output.js";

const unsupported = new Set(["NF-DISCOVERY-UNSUPPORTED-VERSION", "NF-DISCOVERY-UNSUPPORTED-KIND", "NF-DISCOVERY-UNSUPPORTED-HINT"]);
const notice = "Unreleased validation-only preview. No execution is authorized; init is deferred.";
function fail(value: Envelope, code: string, exit: number): Envelope {
  return { ...value, success: false, exitCode: exit, diagnostics: [diagnostic(code)], result: null };
}
function normalized(issues: Diagnostic[]): Diagnostic[] {
  return issues.map(d => d.code === "NEXFLOW-VALIDATION-INTERNAL" ? diagnostic("NEXFLOW-CLI-INTERNAL")
    : d.code === "NEXFLOW-VALIDATION-INSPECTION-LIMIT" ? diagnostic("NEXFLOW-CLI-LIMIT") : d);
}
function inputFailure(value: Envelope, issues: Diagnostic[], truncated = false): Envelope {
  const diagnostics = ordered(normalized(issues));
  const internal = diagnostics.some(d=>d.code === "NEXFLOW-CLI-INTERNAL");
  const onlyUnsupported = diagnostics.length > 0 && diagnostics.every(d=>unsupported.has(d.code));
  return { ...value, exitCode: internal ? 4 : onlyUnsupported ? 3 : 1,
    diagnostics: diagnostics.slice(0,200), truncated: truncated || diagnostics.length > 200, result: null };
}
function libraryChecks(value: Envelope, result: ValidationResult): Envelope {
  return { ...value, checks: { ...result.checks } };
}
export async function evaluate(argv: readonly string[]): Promise<{ format: Arguments["format"]; value: Envelope }> {
  const args = parseArguments(argv);
  let value = envelope(args.command);
  if (!args.valid) return { format: args.format, value: fail(value,"NEXFLOW-CLI-USAGE",2) };
  try {
    // Fixed installed-code metadata only. No workspace access occurs before setup checks.
    const metadata = JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
    if (metadata.name !== identity.name || typeof metadata.version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/u.test(metadata.version)) throw new Error();
    value.tool = { name: identity.name, version: metadata.version };
    if (metadata.version !== identity.version || process.versions.node !== "26.13.0") throw new Error();
    if (args.command === "help" || args.command === "version") {
      return { format: args.format, value: { ...value, success: true, exitCode: 0, result: args.command === "help"
        ? { topic: "help", subject: args.subject, usage: [...usage], commands: ["validate","inspect","graph"], unsupportedCommands: ["init","discover","run"], notice }
        : { topic: "version", version: metadata.version, requiredLibraryApiVersion: "validation-api-v1-preview", notice } } };
    }
    const libraryEntry = import.meta.resolve("@nexflow/validation");
    const libraryMetadata = JSON.parse(readFileSync(new URL("../package.json",libraryEntry),"utf8"));
    if (libraryMetadata.name !== "@nexflow/validation" || libraryMetadata.version !== metadata.version) throw new Error();
    const library = await import("@nexflow/validation");
    if (library.apiVersion !== "validation-api-v1-preview" || library.schemaSnapshot.specVersion !== "0.1") throw new Error();
    const { readWorkspace } = await import("./workspace.js");
    const selection = readWorkspace({ root: args.root, ...(args.project === undefined ? {} : { project: args.project }), ...(args.files === undefined ? {} : { files: args.files }) });
    value.inputMode = selection.mode;
    if (selection.diagnostics.length) {
      let issues = selection.diagnostics;
      // A missing Project caused solely by rejected kind/dialect is not a second,
      // independent invalid-input diagnosis. Mixed real input errors still win.
      if (issues.some(d=>unsupported.has(d.code)) && issues.every(d=>unsupported.has(d.code)||d.code==="NF-DISCOVERY-NO-PROJECT")) {
        issues = issues.filter(d=>d.code!=="NF-DISCOVERY-NO-PROJECT");
      }
      return { format: args.format, value: inputFailure({ ...value, checks: { ...value.checks, discovery: "failed" } },issues) };
    }
    const validator = library.createValidator();
    const checked = args.command === "validate" ? validator.validateDocuments(selection.documents) : validator.inspectDocuments(selection.documents);
    value = libraryChecks(value,checked);
    if (!checked.valid) {
      let issues=checked.diagnostics;
      // The library bounds its aggregate diagnostics before returning them.
      // Recover each file's bounded prefix when needed, so the CLI can apply
      // its Unicode code-point ordering before the global 200-item limit.
      // Within one file the schema's safe pointer/keyword fields are ASCII.
      if(checked.truncated && checked.checks.schema==="failed") {
        issues=selection.documents.flatMap(d=>validator.validateManifest(d.value,d.file).diagnostics);
      }
      return { format: args.format, value: inputFailure(value,issues,checked.truncated) };
    }
    if (!checked.result) throw new Error();
    value.result = { documentCount: checked.result.documentCount, documents: checked.result.documents.map(d=>({file:d.file,kind:d.kind as Kind})) };
    if (args.command !== "validate" && !checked.result.inspection) throw new Error();
    if (args.command === "inspect") value.result.inspection = checked.result.inspection;
    if (args.command === "graph") {
      if (!checked.result.inspection) throw new Error();
      value.checks.projection = "failed";
      value.result.graph = graphInspection(checked.result.inspection);
      value.checks.projection = "passed";
    }
    return { format: args.format, value: { ...value, success: true, exitCode: 0 } };
  } catch { return { format: args.format, value: fail(value,"NEXFLOW-CLI-INTERNAL",4) }; }
}
