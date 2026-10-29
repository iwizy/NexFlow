import { diagnostic, orderedDiagnostics, safeLocator } from "./diagnostics.js";
import { knownKind, lexical, object, type Diagnostic, type Kind, type Manifest } from "./model.js";
import { parseYaml } from "./yaml.js";

const hintKinds: Record<string, Kind> = {
  actors: "ActorSet", agents: "AgentSet", agentDefinitions: "AgentDefinitionSet",
  capabilities: "CapabilitySet", permissions: "PermissionSet", tasks: "TaskSet",
  workflow: "Workflow", workflows: "Workflow", handoffs: "HandoffSet",
  context: "ContextSet", memory: "MemorySet", providers: "ProviderSet",
  modelProfiles: "ModelProfileSet", promptSets: "PromptSet", retrievalProfiles: "RetrievalProfileSet",
  events: "EventSet", extensions: "ExtensionSet",
};

export function parseSource(file: string, text: string, expected?: Kind): { document?: Manifest; diagnostics: Diagnostic[] } {
  if (typeof file !== "string" || safeLocator(file) === "<redacted-source>" || !/\.ya?ml$/u.test(file)) {
    return { diagnostics: [diagnostic("NF-DISCOVERY-OUTSIDE-ROOT")] };
  }
  const parsed = parseYaml(text);
  if (!parsed.valid || parsed.value === null || Array.isArray(parsed.value) || typeof parsed.value !== "object") {
    return { diagnostics: [diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", file)] };
  }
  const value = object(parsed.value);
  if (value.specVersion !== "0.1") return { diagnostics: [diagnostic("NF-DISCOVERY-UNSUPPORTED-VERSION", file)] };
  if (!knownKind(value.kind)) return { diagnostics: [diagnostic("NF-DISCOVERY-UNSUPPORTED-KIND", file)] };
  if (expected && value.kind !== expected) return { diagnostics: [diagnostic("NF-DISCOVERY-KIND-MISMATCH", file)] };
  return { document: { file, kind: value.kind, value }, diagnostics: [] };
}

export function projectSources(project: Manifest): { sources: { file: string; kind: Kind }[]; diagnostics: Diagnostic[] } {
  const sources: { file: string; kind: Kind }[] = [], errors: Diagnostic[] = [];
  const hints = project.value.manifests;
  if (hints === undefined) return { sources, diagnostics: [] };
  if (hints === null || typeof hints !== "object" || Array.isArray(hints)) errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file));
  else if (Object.hasOwn(hints, "workflow") && Object.hasOwn(hints, "workflows")) errors.push(diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", project.file));
  else for (const key of Object.keys(hints).sort(lexical)) {
    if (!Object.hasOwn(hintKinds, key)) { errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file)); continue; }
    const values = key === "workflows" ? hints[key] : [hints[key]];
    if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== "string")) errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", project.file));
    else for (const file of values) {
      if (safeLocator(file as string) === "<redacted-source>") errors.push(diagnostic("NF-DISCOVERY-OUTSIDE-ROOT", project.file));
      else if (!/\.ya?ml$/u.test(file as string)) errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", project.file));
      else sources.push({ file: file as string, kind: hintKinds[key] });
    }
  }
  if (sources.length + 1 > 128) errors.push(diagnostic("NF-DISCOVERY-LIMIT-EXCEEDED"));
  return { sources: errors.length ? [] : sources.sort((a,b) => lexical(a.file,b.file)), diagnostics: orderedDiagnostics(errors) };
}

export function checkAssociation(documents: Manifest[]): Diagnostic[] {
  const errors: Diagnostic[] = [];
  const projects = documents.filter(document => document.kind === "Project");
  if (projects.length !== 1) {
    errors.push(diagnostic(projects.length ? "NF-DISCOVERY-MULTIPLE-PROJECTS" : "NF-DISCOVERY-NO-PROJECT"));
    return orderedDiagnostics(errors);
  }
  const id = object(projects[0].value.project).id;
  if (typeof id !== "string" || !id || object(projects[0].value.metadata).project !== id) {
    errors.push(diagnostic("NF-DISCOVERY-PROJECT-MISMATCH", projects[0].file));
  }
  const singleton = new Set<Kind>();
  const workflows = new Set<string>();
  for (const document of [...documents].sort((a, b) => lexical(a.file, b.file))) {
    if (object(document.value.metadata).project !== id) errors.push(diagnostic("NF-DISCOVERY-PROJECT-MISMATCH", document.file));
    if (document.kind === "Workflow") {
      const workflowId = object(document.value.workflow).id;
      if (typeof workflowId !== "string" || !workflowId) errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", document.file));
      else if (workflows.has(workflowId)) errors.push(diagnostic("NF-DISCOVERY-DUPLICATE-WORKFLOW", document.file));
      else workflows.add(workflowId);
    } else if (singleton.has(document.kind)) {
      if (document.kind !== "Project") errors.push(diagnostic("NF-DISCOVERY-DUPLICATE-SINGLETON", document.file));
    } else singleton.add(document.kind);
  }
  return orderedDiagnostics(errors);
}
