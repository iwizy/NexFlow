import type { Diagnostic, Inspection, Kind } from "@nexflow/validation";
import type { Command } from "./arguments.js";
import type { Graph } from "./graph.js";

export const identity = { name: "@nexflow/cli", version: "0.5.0-alpha.1" } as const;
export const usage = [
  "nexflow validate --root <directory> [--project <relative.yaml> | --file <relative.yaml> ...] [--format text|json]",
  "nexflow inspect --root <directory> [--project <relative.yaml> | --file <relative.yaml> ...] [--format text|json]",
  "nexflow graph --root <directory> [--project <relative.yaml> | --file <relative.yaml> ...] [--format text|json]",
  "nexflow --help [--format text|json]",
  "nexflow <validate|inspect|graph> --help [--format text|json]",
  "nexflow --version [--format text|json]",
];
export type Checks = { discovery: "not-run" | "passed" | "failed"; schema: "not-run" | "passed" | "failed";
  projection: "not-run" | "passed" | "failed"; semantic: "not-run"; coreProfile: "not-run"; extensionProfiles: "not-run"; runtime: "not-run" };
export interface Envelope {
  formatVersion: "0.5-preview.1"; tool: { name: string; version: string }; supportedSpecVersions: ["0.1"];
  command: Command | null; success: boolean; exitCode: number;
  inputMode: "directory-project" | "project-source-hints" | "explicit-file-list" | null;
  checks: Checks; executionAuthorized: false; diagnostics: Diagnostic[]; truncated: boolean;
  result: null | { documentCount: number; documents: { file: string; kind: Kind }[]; inspection?: Inspection; graph?: Graph }
    | { topic: "help"; subject: string | null; usage: string[]; commands: string[]; unsupportedCommands: string[]; notice: string }
    | { topic: "version"; version: string; requiredLibraryApiVersion: string; notice: string };
}
export const unrun = (): Checks => ({ discovery: "not-run", schema: "not-run", projection: "not-run",
  semantic: "not-run", coreProfile: "not-run", extensionProfiles: "not-run", runtime: "not-run" });
const meanings: Record<string,string> = {
  "NEXFLOW-CLI-USAGE": "Unsupported command, arguments or option combination. Use --help for the accepted grammar.",
  "NEXFLOW-CLI-INTERNAL": "The installed runtime and package setup could not produce a result.",
  "NEXFLOW-CLI-LIMIT": "The selected projection exceeds its fixed resource budget.",
};
export const diagnostic = (code: string): Diagnostic => ({ severity: "error", code, message: meanings[code], file: null,
  kind: null, path: null, keyword: null, related: [] });
function lexical(a: string,b: string): number {
  const left=Array.from(a),right=Array.from(b);
  for(let i=0;i<Math.min(left.length,right.length);i++) {
    const x=left[i].codePointAt(0)!,y=right[i].codePointAt(0)!;
    if(x!==y)return x<y?-1:1;
  }
  return left.length-right.length;
}
export function ordered(items: Diagnostic[]): Diagnostic[] {
  const key = (d: Diagnostic): string => [d.file,d.path,d.severity,d.code,d.keyword,d.message].map(v=>v??"").join("\0");
  return [...items].sort((a,b)=>lexical(key(a),key(b)));
}
export function envelope(command: Command | null, tool: Envelope["tool"] = identity): Envelope {
  return { formatVersion: "0.5-preview.1", tool, supportedSpecVersions: ["0.1"], command, success: false,
    exitCode: 4, inputMode: null, checks: unrun(), executionAuthorized: false, diagnostics: [], truncated: false, result: null };
}
export const asciiJson = (value: unknown): string => JSON.stringify(value).replace(/[\u007f-\uffff]/g,
  character => "\\u" + character.charCodeAt(0).toString(16).padStart(4,"0"));
export function textOutput(value: Envelope): string {
  const lines = [`NexFlow ${value.command ?? "usage"}: ${value.success ? "success" : "failed"} (exit ${value.exitCode}).`];
  const result = value.result;
  if (result && "topic" in result) {
    if (result.topic === "help") { lines.push(...result.usage, "Unsupported commands: " + result.unsupportedCommands.join(", ") + ".", result.notice); }
    else lines.push(`${value.tool.name} ${asciiJson(result.version)}`, result.notice);
  } else if (result) {
    lines.push(`${result.documentCount} manifest(s); input mode ${value.inputMode}.`);
    for (const document of result.documents) lines.push(`${document.kind} ${asciiJson(document.file)}`);
    if (result.inspection) {
      lines.push("Declared resources:");
      for (const row of result.inspection.resources) lines.push([row.kind,asciiJson(row.id),asciiJson(row.file),asciiJson(row.path),row.scope ? asciiJson(row.scope.id) : ""].join(" ").trim());
      lines.push("Selected references (not resolved):");
      for (const row of result.inspection.references) lines.push([row.kind,asciiJson(row.id),asciiJson(row.file),asciiJson(row.path),row.scope ? asciiJson(row.scope.id) : ""].join(" ").trim());
    }
    if (result.graph) {
      lines.push("Static declaration graph:");
      for (const node of result.graph.nodes) lines.push(`${node.id} ${node.kind} ${asciiJson(node.identity)} ${asciiJson(node.file)} ${asciiJson(node.path)}`);
      for (const edge of result.graph.edges) lines.push(`${edge.id} ${edge.from} -> ${edge.to ?? "?"} ${edge.status} ${edge.relation} ${asciiJson(edge.target.identity)} ${asciiJson(edge.file)} ${asciiJson(edge.path)}`);
    }
  }
  for (const d of value.diagnostics) lines.push(`${d.code}: ${d.message} ${asciiJson(d.file)} ${asciiJson(d.path)}`);
  if (value.truncated) lines.push("Additional diagnostics omitted; this remains a failure.");
  lines.push("Declared/schema checks only; full semantics, Core/extension profiles and runtime were not run. No execution is authorized.");
  return lines.join("\n") + "\n";
}
