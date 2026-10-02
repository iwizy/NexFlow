import { displayId, safeLocator } from "./diagnostics.js";
import { array, kinds, lexical, object, pointer, type Inspection, type InspectionRow,
  type Json, type Manifest, type ObjectValue } from "./model.js";

// Authored declaration/reference allowlists. No arbitrary Ref-key traversal.
const bindings: Record<string, [string, string][]> = {
  project: [["maintainers.*.id", "participant"]],
  actor: [["agentRef.id", "agent"], ["operatedBy.*.id", "actor"], ["representedBy.*.id", "actor"], ["integrationRef.id", "extension"]],
  "agent-definition": [["agentRef", "agent"], ["owner", "participant"],
    ["components.modelProfileRef", "model-profile"], ["components.promptSetRef", "prompt-set"],
    ["components.retrievalProfileRef", "retrieval-profile"], ["components.permissionRefs.*", "permission"],
    ["components.capabilityRefs.*", "capability"], ["components.contextSourceRefs.*", "context-source"],
    ["components.memoryScopes.*", "memory-scope"], ["components.extensionRefs.*", "extension"]],
  task: [["owner", "participant"], ["participants.*", "participant"], ["dependsOn.*", "task"],
    ["capabilitiesRequired.*", "capability"], ["approvalGates.*", "approval-gate"]],
  workflow: [["dependencies.*.from", "workflow-step"], ["dependencies.*.to", "workflow-step"]],
  "workflow-step": [["task", "task"], ["dependsOn.*", "workflow-step"], ["approvalGates.*", "approval-gate"], ["emits.*", "event"]],
  handoff: [["from.*", "participant"], ["to.*", "participant"], ["artifacts.*", "artifact"]],
  permission: [["subjects.*", "participant"], ["capabilities.*", "capability"], ["approvalGate", "approval-gate"]],
  "context-source": [["access.allowedActors.*", "participant"], ["access.deniedActors.*", "participant"], ["approvalGates.*", "approval-gate"]],
  "memory-scope": [["allowedConsumers.*", "participant"], ["allowedWriters.*", "participant"],
    ["allowedSourceScopes.*", "memory-scope"], ["approvalGate", "approval-gate"]],
  "model-profile": [["selection.providerRefs.*", "provider"], ["selection.pinnedModel.providerRef", "provider"],
    ["fallback.candidateProviderRefs.*", "provider"]],
  "prompt-set": [["owner", "participant"]],
  "retrieval-profile": [["owner", "participant"], ["sources.*.contextSourceRef", "context-source"],
    ["excludedSources.*", "context-source"], ["index.embeddingModelProfileRef", "model-profile"]],
  extension: [["requiredCapabilities.*", "capability"]],
};
export class InspectionLimit extends Error {}
export function inspect(documents: Manifest[]): Inspection {
  const resources: InspectionRow[] = [];
  const references: InspectionRow[] = [];
  const counts = new Map<string, number>();
  const row = (file: string, path: string, kind: string, value: unknown, workflowId?: unknown): InspectionRow => ({
    file, path, kind, id: displayId(typeof value === "string" ? value : object(value).id),
    scope: kind === "workflow-stage" || kind === "workflow-step" ? { kind: "workflow", id: displayId(workflowId) } : null,
  });
  function visit(value: Json | undefined, parts: string[], path: string, emit: (value: Json, path: string) => void): void {
    if (value === undefined) return;
    if (!parts.length) { emit(value, path); return; }
    const [part, ...remaining] = parts;
    if (part === "*") array(value).forEach((child, index) => visit(child, remaining, path + "/" + index, emit));
    else if (Object.hasOwn(object(value), part)) visit(object(value)[part], remaining, path + "/" + pointer(part), emit);
  }
  function declaration(document: Manifest, value: ObjectValue, path: string, namespace: string,
    idField = "id", workflowId?: unknown): void {
    resources.push(row(document.file, path, namespace, value[idField], workflowId));
    counts.set(document.kind, (counts.get(document.kind) ?? 0) + 1);
    for (const [selector, target] of bindings[namespace] ?? []) {
      visit(value, selector.split("."), path, (value, referencePath) => {
        references.push(row(document.file, referencePath, target, value, workflowId));
        if (references.length > 2000) throw new InspectionLimit();
      });
    }
    if (resources.length > 1000) throw new InspectionLimit();
  }
  for (const document of documents) {
    const [field, namespace, idField] = kinds[document.kind];
    if (document.kind === "Project" || document.kind === "Workflow") {
      declaration(document, object(document.value[field]), "/" + field, namespace, idField, object(document.value.workflow).id);
    } else array(document.value[field]).forEach((value, index) =>
      declaration(document, object(value), "/" + field + "/" + index, namespace, idField));
    if (document.kind === "Project") array(object(document.value.project).approvalGates).forEach((value, index) =>
      declaration(document, object(value), "/project/approvalGates/" + index, "approval-gate"));
    if (document.kind === "TaskSet") array(document.value.tasks).forEach((task, index) =>
      array(object(task).artifacts).forEach((artifact, artifactIndex) =>
        declaration(document, object(artifact), "/tasks/" + index + "/artifacts/" + artifactIndex, "artifact")));
    if (document.kind === "Workflow") {
      const workflow = object(document.value.workflow);
      array(workflow.stages).forEach((stage, stageIndex) => {
        const path = "/workflow/stages/" + stageIndex;
        declaration(document, object(stage), path, "workflow-stage", "id", workflow.id);
        array(object(stage).steps).forEach((step, stepIndex) =>
          declaration(document, object(step), path + "/steps/" + stepIndex, "workflow-step", "id", workflow.id));
      });
    }
  }
  const sort = (rows: InspectionRow[]): InspectionRow[] => rows.sort((a, b) =>
    lexical([a.file, a.path, a.kind, a.id].join("\0"), [b.file, b.path, b.kind, b.id].join("\0")))
    .map(item => ({ ...item, file: safeLocator(item.file) }));
  const project = documents.find(document => document.kind === "Project");
  if (!project) throw new Error("missing selected Project");
  return {
    mode: "declared-only", referencesResolved: false, referenceCoverage: "selected-fields",
    project: { file: safeLocator(project.file), path: "/project", id: displayId(object(project.value.project).id) },
    summary: [...new Set(documents.map(document => document.kind))].sort(lexical).map(kind => ({
      kind, documentCount: documents.filter(document => document.kind === kind).length, resourceCount: counts.get(kind) ?? 0,
    })),
    resources: sort(resources), references: sort(references),
  };
}
