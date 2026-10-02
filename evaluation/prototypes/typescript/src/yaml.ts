import { parseAllDocuments } from "yaml";
import { object, type Json } from "./model.js";

export interface ParsedYaml { valid: boolean; value: Json | null; category: string | null }
export function parseYaml(text: string): ParsedYaml {
  try {
    const documents = parseAllDocuments(text, { version: "1.2", uniqueKeys: true, stringKeys: true, logLevel: "silent" });
    if (documents.length !== 1) return { valid: false, value: null, category: "syntax" };
    const document = documents[0];
    if (document.errors.length || document.warnings.length) return {
      valid: false, value: null,
      category: document.errors.some(error => error.code === "DUPLICATE_KEY") ? "duplicate-key" : "syntax",
    };
    const value: unknown = document.toJS({ maxAliasCount: 100 });
    const stack = new Set<object>();
    function compatible(item: unknown, depth: number): item is Json {
      if (depth > 100) return false;
      if (item === null || typeof item === "string" || typeof item === "boolean") return true;
      if (typeof item === "number") return Number.isFinite(item);
      if (typeof item !== "object" || stack.has(item)) return false;
      stack.add(item);
      const valid = (Array.isArray(item) ? item : Object.values(object(item))).every(child => compatible(child, depth + 1));
      stack.delete(item);
      return valid;
    }
    if (!compatible(value, 0)) return { valid: false, value: null, category: "syntax" };
    return { valid: true, value, category: null };
  } catch {
    return { valid: false, value: null, category: "syntax" };
  }
}
