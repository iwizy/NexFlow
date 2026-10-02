import { lexical, type Diagnostic, type Kind } from "./model.js";

export function safeLocator(value: string): string {
  return value.length > 512 || !value || value.includes("\\") || /[:\u0000-\u001f]/u.test(value) ||
    value.startsWith("/") || value.split("/").some(part => !part || part === "." || part === "..")
    ? "<redacted-source>" : value;
}
export function diagnostic(code: string, file: string | null = "<input>", kind: Kind | null = null,
  path: string | null = null, keyword: string | null = null): Diagnostic {
  const message = code === "NF-SCHEMA" ? "Local schema constraint is not satisfied." :
    code === "NEXFLOW-PROTOTYPE-USAGE" ? "Only validate or inspect with an explicit root and supported options are accepted." :
    code === "NEXFLOW-PROTOTYPE-INTERNAL" ? "The reviewed local validation setup could not produce a result." :
    code === "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT" ? "Declared inspection exceeds its fixed budget." :
    "Selected manifest input does not satisfy discovery policy.";
  return { severity: "error", code, message,
    file: file === null || file === "<input>" ? file : safeLocator(file), kind, path, keyword, related: [] };
}
export function orderedDiagnostics(items: Diagnostic[]): Diagnostic[] {
  const key = (item: Diagnostic) => [item.file, item.path, item.severity, item.code, item.kind, item.keyword, item.message]
    .map(value => value ?? "").join("\0");
  return [...items].sort((a, b) => lexical(key(a), key(b)));
}
export function displayId(value: JsonId): string {
  return typeof value === "string" && value.length <= 128 &&
    /^[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*$/u.test(value) ? value : "<redacted-id>";
}
type JsonId = unknown;
export function jsonLine(value: unknown): string {
  return JSON.stringify(value).replaceAll(/[\u007f-\uffff]/gu, character =>
    "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0")) + "\n";
}
