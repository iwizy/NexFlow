import { checkAssociation as associate, parseSource as parse, projectSources as hints } from "./assembly.js";
import { diagnostic, orderedDiagnostics, safeLocator } from "./diagnostics.js";
import { inspect, InspectionLimit } from "./inspection.js";
import { knownKind, object, type Diagnostic, type Inspection, type Json, type Manifest } from "./model.js";
import { repositorySchemas } from "./schema.js";
import { snapshot } from "./schema-data.js";

export { parseYaml } from "./yaml.js";
export type { Diagnostic, Discovery, Inspection, InspectionRow, Json, Kind, Manifest } from "./model.js";

export const apiVersion = "validation-api-v1-preview";
export const schemaSnapshot = Object.freeze({
  ...snapshot,
  schemas: Object.freeze(snapshot.schemas.map(entry => Object.freeze({ ...entry }))),
});
export interface ValidationResult {
  apiVersion: typeof apiVersion;
  valid: boolean;
  status: "valid" | "invalid" | "unsupported" | "error";
  diagnostics: Diagnostic[];
  truncated: boolean;
  executionAuthorized: false;
  checks: {
    discovery: "not-run" | "passed" | "failed";
    schema: "not-run" | "passed" | "failed";
    projection: "not-run" | "passed" | "failed";
    semantic: "not-run"; coreProfile: "not-run"; extensionProfiles: "not-run"; runtime: "not-run";
  };
  result: null | { documentCount: number; documents: { file: string; kind: string }[]; inspection?: Inspection };
}

// Reject accessors, cycles, unusual prototypes and unbounded data before cloning
// or passing a JavaScript caller's values to schema or projection code.
function compatible(value: unknown): value is Json {
  const active = new Set<object>(); let nodes = 0, characters = 0;
  const visit = (item: unknown, depth: number): boolean => {
    if (++nodes > 10000 || depth > 100) return false;
    if (typeof item === "string") { characters += item.length; return characters <= 1024 * 1024; }
    if (item === null || typeof item === "boolean") return true;
    if (typeof item === "number") return Number.isFinite(item);
    if (!item || typeof item !== "object" || active.has(item) || Object.getOwnPropertySymbols(item).length) return false;
    if (Array.isArray(item) && (item.length > 10000 || Object.keys(item).length !== item.length)) return false;
    if (!Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item))) return false;
    active.add(item);
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(item))) {
      if (Array.isArray(item) && key === "length") continue;
      characters += key.length; if (characters > 1024 * 1024) return false;
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value") || !visit(descriptor.value, depth + 1)) return false;
    }
    active.delete(item); return true;
  };
  try { return visit(value, 0); } catch { return false; }
}
function usableDocuments(value: unknown): value is Manifest[] {
  return Array.isArray(value) && value.length <= 128 && compatible(value)
    && value.every(d => {
      const row = object(d);
      return typeof row.file === "string" && safeLocator(row.file) !== "<redacted-source>"
        && /\.ya?ml$/u.test(row.file) && knownKind(row.kind) && object(row.value).kind === row.kind;
    });
}
export function parseSource(file: string, yaml: string, expected?: Manifest["kind"]): ReturnType<typeof parse> {
  return parse(file, yaml, expected);
}
export function projectSources(project: Manifest): ReturnType<typeof hints> {
  if (!usableDocuments([project]) || project.kind !== "Project") return { sources: [], diagnostics: [diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")] };
  return hints(structuredClone(project));
}
export function checkAssociation(documents: Manifest[]): Diagnostic[] {
  if (!usableDocuments(documents)) return [diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")];
  return associate(structuredClone(documents));
}
function result(issues: Diagnostic[], checks: Partial<ValidationResult["checks"]> = {}, data: ValidationResult["result"] = null): ValidationResult {
  const sorted = orderedDiagnostics(issues);
  const unsupported = new Set(["NF-DISCOVERY-UNSUPPORTED-VERSION", "NF-DISCOVERY-UNSUPPORTED-KIND", "NF-DISCOVERY-UNSUPPORTED-HINT"]);
  const status = !issues.length ? "valid" : issues.some(d => d.code === "NEXFLOW-VALIDATION-INTERNAL") ? "error"
    : issues.every(d => unsupported.has(d.code)) ? "unsupported" : "invalid";
  return { apiVersion, valid: status === "valid", status, diagnostics: sorted.slice(0, 200), truncated: sorted.length > 200,
    executionAuthorized: false, checks: { discovery: "not-run", schema: "not-run", projection: "not-run",
      semantic: "not-run", coreProfile: "not-run", extensionProfiles: "not-run", runtime: "not-run", ...checks },
    result: issues.length ? null : data };
}

export function createValidator(): {
  validateManifest(value: unknown, file?: string): ValidationResult;
  validateDocuments(documents: readonly Manifest[]): ValidationResult;
  inspectDocuments(documents: readonly Manifest[]): ValidationResult;
} {
  // Schema data is embedded during the reproducible build, never loaded from a
  // caller path or fetched using an identifier. Nothing compiles at module import.
  const schemas = repositorySchemas();
  function validateManifest(value: unknown, file = "<input>"): ValidationResult {
    if (!compatible(value) || !value || typeof value !== "object" || Array.isArray(value)
      || typeof file !== "string" || (file !== "<input>" && safeLocator(file) === "<redacted-source>")) return result([diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")]);
    const document = structuredClone(value);
    if (document.specVersion !== "0.1") return result([diagnostic("NF-DISCOVERY-UNSUPPORTED-VERSION", file)]);
    if (!knownKind(document.kind)) return result([diagnostic("NF-DISCOVERY-UNSUPPORTED-KIND", file)]);
    try {
      const issues = schemas.validate({ file, kind: document.kind, value: document });
      return result(issues, { schema: issues.length ? "failed" : "passed" });
    } catch { return result([diagnostic("NEXFLOW-VALIDATION-INTERNAL", null)]); }
  }
  function validateDocuments(documents: readonly Manifest[]): ValidationResult {
    if (!usableDocuments(documents)) return result([diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")], { discovery: "failed" });
    const copy = structuredClone(documents);
    const seen = new Set<string>();
    for (const document of copy) {
      if (seen.has(document.file)) return result([diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", document.file)], { discovery: "failed" });
      seen.add(document.file);
      if (document.value.specVersion !== "0.1") return result([diagnostic("NF-DISCOVERY-UNSUPPORTED-VERSION", document.file)], { discovery: "failed" });
    }
    const association = associate(copy);
    if (association.length) return result(association, { discovery: "failed" });
    try {
      const issues = copy.flatMap(document => schemas.validate(document));
      return result(issues, { discovery: "passed", schema: issues.length ? "failed" : "passed" }, {
        documentCount: copy.length, documents: copy.map(({ file, kind }) => ({ file, kind })),
      });
    } catch { return result([diagnostic("NEXFLOW-VALIDATION-INTERNAL", null)], { discovery: "passed" }); }
  }
  function inspectDocuments(documents: readonly Manifest[]): ValidationResult {
    const validation = validateDocuments(documents);
    if (!validation.valid) return validation;
    try {
      const inspection = inspect(structuredClone(documents) as Manifest[]);
      return { ...validation, checks: { ...validation.checks, projection: "passed" }, result: { ...validation.result!, inspection } };
    } catch (error) {
      return result([diagnostic(error instanceof InspectionLimit ? "NEXFLOW-VALIDATION-INSPECTION-LIMIT" : "NEXFLOW-VALIDATION-INTERNAL", null)], { discovery: "passed", schema: "passed", projection: "failed" });
    }
  }
  return Object.freeze({ validateManifest, validateDocuments, inspectDocuments });
}
