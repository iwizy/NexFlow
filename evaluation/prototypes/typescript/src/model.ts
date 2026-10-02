export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type ObjectValue = { [key: string]: Json };
export const object = (value: unknown): ObjectValue =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : {};
export const array = (value: Json | undefined): Json[] => Array.isArray(value) ? value : [];
export const lexical = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
export const pointer = (key: string | number): string => String(key).replaceAll("~", "~0").replaceAll("/", "~1");
export const kinds = {
  Project: ["project", "project", "id"],
  ActorSet: ["actors", "actor", "id"],
  AgentSet: ["agents", "agent", "id"],
  AgentDefinitionSet: ["agentDefinitions", "agent-definition", "id"],
  CapabilitySet: ["capabilities", "capability", "id"],
  PermissionSet: ["permissions", "permission", "id"],
  TaskSet: ["tasks", "task", "id"],
  Workflow: ["workflow", "workflow", "id"],
  HandoffSet: ["handoffs", "handoff", "id"],
  ContextSet: ["contextSources", "context-source", "id"],
  MemorySet: ["memoryScopes", "memory-scope", "scope"],
  ProviderSet: ["providers", "provider", "id"],
  ModelProfileSet: ["modelProfiles", "model-profile", "id"],
  PromptSet: ["promptSets", "prompt-set", "id"],
  RetrievalProfileSet: ["retrievalProfiles", "retrieval-profile", "id"],
  EventSet: ["events", "event", "type"],
  ExtensionSet: ["extensions", "extension", "id"],
} as const;
export type Kind = keyof typeof kinds;
export const knownKind = (value: unknown): value is Kind =>
  typeof value === "string" && Object.hasOwn(kinds, value);
export type InputMode = "directory-project" | "project-source-hints" | "explicit-file-list";
export type Check = "not-run" | "passed" | "failed" | "unavailable";
export interface Diagnostic {
  severity: "error"; code: string; message: string;
  file: string | null; kind: Kind | null; path: string | null; keyword: string | null;
  related: { file: string }[];
}
export interface Manifest { file: string; kind: Kind; value: ObjectValue }
export interface Selection { root: string; project?: string; files?: string[] }
export interface Discovery { mode: InputMode; documents: Manifest[]; diagnostics: Diagnostic[] }
export interface InspectionRow {
  file: string; path: string; kind: string; id: string;
  scope: { kind: "workflow"; id: string } | null;
}
export interface Inspection {
  mode: "declared-only"; referencesResolved: false; referenceCoverage: "selected-fields";
  project: { file: string; path: "/project"; id: string };
  summary: { kind: Kind; documentCount: number; resourceCount: number }[];
  resources: InspectionRow[]; references: InspectionRow[];
}
export interface Envelope {
  formatVersion: "0.4-draft";
  tool: { name: "nexflow-typescript-evaluation"; version: "unreleased" };
  supportedSpecVersions: ["0.1"]; command: "validate" | "inspect" | null;
  success: boolean; exitCode: 0 | 1 | 2 | 3 | 4; inputMode: InputMode | null;
  checks: { discovery: Check; schema: Check; coreProfile: "not-run"; semantic: "not-run"; extensionProfiles: "not-run" };
  executionAuthorized: false; diagnostics: Diagnostic[]; truncated: boolean;
  result: null | { documentCount: number; documents: { file: string; kind: Kind }[]; inspection?: Inspection };
}
