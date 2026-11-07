import type { Inspection, InspectionRow } from "@nexflow/validation";

export interface Graph {
  mode: "static-declared";
  referenceCoverage: "selected-fields";
  nodeCount: number;
  edgeCount: number;
  nodes: { id: string; kind: string; identity: string; scope: InspectionRow["scope"]; file: string; path: string }[];
  edges: { id: string; from: string; to: string | null; candidates: string[]; relation: string;
    target: { kind: string; identity: string; scope: InspectionRow["scope"] };
    status: "resolved" | "unresolved" | "ambiguous" | "redacted" | "unsupported"; file: string; path: string }[];
}
const namespaces = new Set(["project", "actor", "agent", "agent-definition", "capability", "permission", "task",
  "workflow", "workflow-stage", "workflow-step", "handoff", "context-source", "memory-scope", "provider",
  "model-profile", "prompt-set", "retrieval-profile", "event", "extension", "approval-gate", "artifact", "participant"]);
const sameScope = (a: InspectionRow["scope"], b: InspectionRow["scope"]): boolean =>
  a === null || b === null ? a === b : a.kind === b.kind && a.id === b.id;

/** Port of the historical selected-field graph over the new library projection. */
export function graphInspection(inspection: Inspection): Graph {
  const resources = inspection.resources, ids = new Map(resources.map((row, index) => [row, `n${index}`]));
  const nodes = resources.map(row => ({ id: ids.get(row)!, kind: row.kind, identity: row.id,
    scope: row.scope, file: row.file, path: row.path }));
  const edges: Graph["edges"] = inspection.references.map((reference, index) => {
    const source = resources.filter(row => row.file === reference.file && reference.path.startsWith(row.path + "/"))
      .sort((a,b) => b.path.length - a.path.length)[0];
    if (!source) throw new Error("Reference has no declaration source");
    const kind = reference.kind === "participant"
      ? resources.some(row => row.kind === "actor") ? "actor" : "agent" : reference.kind;
    const redacted = reference.id === "<redacted-id>" || reference.scope?.id === "<redacted-id>";
    const unsupported = !namespaces.has(reference.kind);
    const matches = redacted || unsupported ? [] : resources.filter(row => row.kind === kind && row.id === reference.id && sameScope(row.scope, reference.scope));
    const field = reference.path.split("/").filter(Boolean).reverse().find(part => part !== "id" && !/^[0-9]+$/u.test(part)) ?? "reference";
    return { id: `e${index}`, from: ids.get(source)!, to: matches.length === 1 ? ids.get(matches[0])! : null,
      candidates: matches.length > 1 ? matches.map(row => ids.get(row)!) : [],
      relation: field.replace(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase(),
      target: { kind: unsupported ? "<unsupported-kind>" : reference.kind, identity: reference.id, scope: reference.scope },
      status: unsupported ? "unsupported" : redacted ? "redacted" : matches.length === 1 ? "resolved" : matches.length > 1 ? "ambiguous" : "unresolved",
      file: reference.file, path: reference.path };
  });
  return { mode: "static-declared", referenceCoverage: "selected-fields", nodeCount: nodes.length, edgeCount: edges.length, nodes, edges };
}
