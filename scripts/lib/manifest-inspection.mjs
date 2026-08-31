export const MAX_INSPECTION_RESOURCES = 1000;
export const MAX_INSPECTION_REFERENCES = 2000;

const resourcePaths = [
  ["Project", ["project"], "project"],
  ["Project", ["project", "approvalGates", "*"], "approval-gate"],
  ["ActorSet", ["actors", "*"], "actor"],
  ["AgentSet", ["agents", "*"], "agent"],
  ["AgentDefinitionSet", ["agentDefinitions", "*"], "agent-definition"],
  ["CapabilitySet", ["capabilities", "*"], "capability"],
  ["PermissionSet", ["permissions", "*"], "permission"],
  ["TaskSet", ["tasks", "*"], "task"],
  ["TaskSet", ["tasks", "*", "artifacts", "*"], "artifact"],
  ["Workflow", ["workflow"], "workflow"],
  ["Workflow", ["workflow", "stages", "*"], "workflow-stage"],
  ["Workflow", ["workflow", "stages", "*", "steps", "*"], "workflow-step"],
  ["HandoffSet", ["handoffs", "*"], "handoff"],
  ["ContextSet", ["contextSources", "*"], "context-source"],
  ["MemorySet", ["memoryScopes", "*"], "memory-scope", "scope"],
  ["ProviderSet", ["providers", "*"], "provider"],
  ["ModelProfileSet", ["modelProfiles", "*"], "model-profile"],
  ["PromptSet", ["promptSets", "*"], "prompt-set"],
  ["RetrievalProfileSet", ["retrievalProfiles", "*"], "retrieval-profile"],
  ["EventSet", ["events", "*"], "event", "type"],
  ["ExtensionSet", ["extensions", "*"], "extension"]
];

export const INSPECTION_MANIFEST_KINDS = Object.freeze([...new Set(resourcePaths.map(([kind]) => kind))]);

// Only these authored reference fields are projected. Open metadata is never traversed.
const referencePaths = new Map([
  ["project", [[["maintainers", "*", "id"], "participant"]]],
  ["actor", [
    [["agentRef", "id"], "agent"], [["operatedBy", "*", "id"], "actor"],
    [["representedBy", "*", "id"], "actor"], [["integrationRef", "id"], "extension"]
  ]],
  ["agent-definition", [
    [["agentRef"], "agent"], [["owner"], "participant"],
    [["components", "modelProfileRef"], "model-profile"], [["components", "promptSetRef"], "prompt-set"],
    [["components", "retrievalProfileRef"], "retrieval-profile"], [["components", "permissionRefs", "*"], "permission"],
    [["components", "capabilityRefs", "*"], "capability"], [["components", "contextSourceRefs", "*"], "context-source"],
    [["components", "memoryScopes", "*"], "memory-scope"], [["components", "extensionRefs", "*"], "extension"]
  ]],
  ["task", [
    [["owner"], "participant"], [["participants", "*"], "participant"], [["dependsOn", "*"], "task"],
    [["capabilitiesRequired", "*"], "capability"], [["approvalGates", "*"], "approval-gate"]
  ]],
  ["workflow", [[["dependencies", "*", "from"], "workflow-step"], [["dependencies", "*", "to"], "workflow-step"]]],
  ["workflow-step", [
    [["task"], "task"], [["dependsOn", "*"], "workflow-step"],
    [["approvalGates", "*"], "approval-gate"], [["emits", "*"], "event"]
  ]],
  ["handoff", [[["from", "*"], "participant"], [["to", "*"], "participant"], [["artifacts", "*"], "artifact"]]],
  ["permission", [
    [["subjects", "*"], "participant"], [["capabilities", "*"], "capability"], [["approvalGate"], "approval-gate"]
  ]],
  ["context-source", [
    [["access", "allowedActors", "*"], "participant"], [["access", "deniedActors", "*"], "participant"],
    [["approvalGates", "*"], "approval-gate"]
  ]],
  ["memory-scope", [
    [["allowedConsumers", "*"], "participant"], [["allowedWriters", "*"], "participant"],
    [["allowedSourceScopes", "*"], "memory-scope"], [["approvalGate"], "approval-gate"]
  ]],
  ["model-profile", [
    [["selection", "providerRefs", "*"], "provider"], [["selection", "pinnedModel", "providerRef"], "provider"],
    [["fallback", "candidateProviderRefs", "*"], "provider"]
  ]],
  ["prompt-set", [[["owner"], "participant"]]],
  ["retrieval-profile", [
    [["owner"], "participant"], [["sources", "*", "contextSourceRef"], "context-source"],
    [["excludedSources", "*"], "context-source"], [["index", "embeddingModelProfileRef"], "model-profile"]
  ]],
  ["extension", [[["requiredCapabilities", "*"], "capability"]]]
]);

function visitPath(value, [segment, ...rest], pointer, visit) {
  if (segment === undefined) return visit(value, pointer);
  if (segment === "*") {
    if (Array.isArray(value)) value.forEach((item, index) => visitPath(item, rest, `${pointer}/${index}`, visit));
  } else if (value && Object.hasOwn(value, segment)) {
    visitPath(value[segment], rest, `${pointer}/${segment}`, visit);
  }
}

function safeIdentity(value) {
  return typeof value === "string" && value.length <= 128
    && /^[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*$/u.test(value) ? value : "<redacted-id>";
}

class InspectionLimitError extends Error {}

function appendBounded(records, record, limit) {
  if (records.length >= limit) throw new InspectionLimitError();
  records.push(record);
}

function compareRecords(left, right) {
  for (const key of ["file", "path", "kind", "id"]) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
  }
  return 0;
}

// The caller must complete bounded discovery and repository schema validation first.
export function inspectManifestAssembly(assembly) {
  if (assembly?.specVersion !== "0.1" || !assembly.loadedDocuments?.length) {
    throw new Error("A schema-validated assembly is required");
  }
  const resources = [];
  const references = [];
  const summaries = new Map();
  let project;
  try {
    for (const { source, manifest } of assembly.loadedDocuments) {
      if (!INSPECTION_MANIFEST_KINDS.includes(manifest.kind)) throw new Error("Unsupported inspection kind");
      const summary = summaries.get(manifest.kind) ?? { kind: manifest.kind, documentCount: 0, resourceCount: 0 };
      summary.documentCount += 1;
      summaries.set(manifest.kind, summary);
      const scopeFor = (kind) => ["workflow-stage", "workflow-step"].includes(kind)
        ? { kind: "workflow", id: safeIdentity(manifest.workflow.id) } : null;
      for (const [manifestKind, segments, kind, identity = "id"] of resourcePaths) {
        if (manifestKind !== manifest.kind) continue;
        visitPath(manifest, segments, "", (resource, pointer) => {
          const record = { file: source, path: pointer, kind, id: safeIdentity(resource[identity]), scope: scopeFor(kind) };
          appendBounded(resources, record, MAX_INSPECTION_RESOURCES);
          summary.resourceCount += 1;
          if (kind === "project") project = { id: record.id, file: source, path: pointer };
          for (const [fields, targetKind] of referencePaths.get(kind) ?? []) {
            visitPath(resource, fields, pointer, (target, targetPointer) => {
              appendBounded(references, {
                file: source, path: targetPointer, kind: targetKind, id: safeIdentity(target), scope: scopeFor(targetKind)
              }, MAX_INSPECTION_REFERENCES);
            });
          }
        });
      }
    }
  } catch (error) {
    if (!(error instanceof InspectionLimitError)) throw error;
    return { valid: false, diagnostics: [{
      code: "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT", severity: "error",
      message: "Inspection exceeds the resource or reference output limit. No partial inspection is available."
    }] };
  }
  if (!project) throw new Error("A Project is required for inspection");
  return { valid: true, inspection: {
    mode: "declared-only", referencesResolved: false, referenceCoverage: "selected-fields",
    project,
    summary: [...summaries.values()].sort((left, right) => left.kind < right.kind ? -1 : left.kind > right.kind ? 1 : 0),
    resources: resources.sort(compareRecords), references: references.sort(compareRecords)
  } };
}
