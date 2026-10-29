import { schemaValues } from "./schema-data.js";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { diagnostic } from "./diagnostics.js";
import { knownKind, object, pointer, type Diagnostic, type Json, type Kind, type Manifest } from "./model.js";

export interface SchemaIssue { code: "NF-SCHEMA"; category: string; instancePath?: string; missingProperty?: string }
export class SchemaEngine {
  private readonly ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: true });
  private readonly validators = new Map<Kind, ValidateFunction>();
  private readonly fieldNames = new Set<string>();
  constructor(schemas: Json[]) {
    addFormats(this.ajv);
    const collect = (value: Json): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) { value.forEach(collect); return; }
      for (const name of Object.keys(object(value.properties))) this.fieldNames.add(name);
      Object.values(value).forEach(collect);
    };
    schemas.forEach(schema => {
      collect(schema);
      this.ajv.addSchema(schema as object);
    });
    for (const schema of schemas) {
      const entry = object(schema);
      const kind = object(object(entry.properties).kind).const;
      if (knownKind(kind) && typeof entry.$id === "string") {
        const validate = this.ajv.getSchema(entry.$id);
        if (!validate) throw new Error("local schema unavailable");
        this.validators.set(kind, validate);
      }
    }
  }
  private safePath(path: string): string {
    const clean = path.split("/").map((part, index) => {
      if (!index) return "";
      const field = part.replaceAll("~1", "/").replaceAll("~0", "~");
      return /^\d+$/u.test(field) || this.fieldNames.has(field) ? pointer(field) : "<redacted>";
    }).join("/");
    return clean.length <= 512 ? clean : "<redacted-field>";
  }
  private issues(errors: ErrorObject[] | null | undefined): SchemaIssue[] {
    return (errors ?? []).map(error => ({
      code: "NF-SCHEMA", category: error.keyword, instancePath: this.safePath(error.instancePath),
      ...(error.keyword === "required" ? {
        missingProperty: this.fieldNames.has(String(error.params.missingProperty)) ? String(error.params.missingProperty) : "<redacted>",
      } : {}),
    }));
  }
  validate(document: Manifest): Diagnostic[] {
    const validate = this.validators.get(document.kind);
    if (!validate) throw new Error("local kind schema unavailable");
    validate(document.value);
    return this.issues(validate.errors).map(issue => diagnostic("NF-SCHEMA", document.file, document.kind,
      issue.missingProperty ? (issue.instancePath ?? "") + "/" + pointer(issue.missingProperty) : issue.instancePath ?? null,
      issue.category));
  }
  validateValue(kind: Kind, value: Json): SchemaIssue[] {
    const validate = this.validators.get(kind);
    if (!validate) throw new Error("local kind schema unavailable");
    validate(value);
    return this.issues(validate.errors);
  }
  // Internal migration surface for the frozen catalog. Public callers use the
  // constrained main entry; arbitrary schema compilation is not exported there.
  validateManifestValue(value: Json): (SchemaIssue & { kind: string })[] {
    const kind = object(value).kind;
    if (!knownKind(kind)) return [{ code: "NF-SCHEMA", category: "unknown-kind", kind:
      typeof kind === "string" && /^[A-Z][A-Za-z]{0,31}$/u.test(kind) ? kind : "<redacted-kind>", instancePath: "" }];
    return this.validateValue(kind, value).map(issue => ({ ...issue, kind }));
  }
  validateLocal(entryId: string, value: Json): SchemaIssue[] {
    try {
      const validate = this.ajv.getSchema(entryId);
      if (!validate) return [{ code: "NF-SCHEMA", category: "unresolved-local-schema" }];
      validate(value);
      return this.issues(validate.errors);
    } catch (error) {
      if (error instanceof Error && error.message.includes("resolve reference")) {
        return [{ code: "NF-SCHEMA", category: "unresolved-local-schema" }];
      }
      throw error;
    }
  }
}
export function repositorySchemas(): SchemaEngine {
  // Each validator owns its compilation cache; callers cannot replace the snapshot.
  return new SchemaEngine(structuredClone(schemaValues));
}
