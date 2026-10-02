import { diagnostic, orderedDiagnostics } from "./diagnostics.js";
import { InputFailure, LocalInputs } from "./files.js";
import { knownKind, lexical, object, type Diagnostic, type Discovery, type Kind,
  type Manifest, type Selection } from "./model.js";
import { parseYaml } from "./yaml.js";

const hintKinds: Record<string, Kind> = {
  actors: "ActorSet", agents: "AgentSet", agentDefinitions: "AgentDefinitionSet",
  capabilities: "CapabilitySet", permissions: "PermissionSet", tasks: "TaskSet",
  workflow: "Workflow", workflows: "Workflow", handoffs: "HandoffSet",
  context: "ContextSet", memory: "MemorySet", providers: "ProviderSet",
  modelProfiles: "ModelProfileSet", promptSets: "PromptSet", retrievalProfiles: "RetrievalProfileSet",
  events: "EventSet", extensions: "ExtensionSet",
};
export function discover(selection: Selection): Discovery {
  const mode = selection.files ? "explicit-file-list" : selection.project ? "project-source-hints" : "directory-project";
  const documents: Manifest[] = [];
  const errors: Diagnostic[] = [];
  const finish = (): Discovery => ({ mode, documents: [...documents].sort((a, b) => lexical(a.file, b.file)),
    diagnostics: orderedDiagnostics(errors) });
  let input: LocalInputs;
  try { input = new LocalInputs(selection.root); }
  catch { errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")); return finish(); }
  const seen = new Set<string>();
  function load(file: string, expected?: Kind): Manifest | undefined {
    if (seen.has(file)) { errors.push(diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", file)); return undefined; }
    seen.add(file);
    if (seen.size > 128) { errors.push(diagnostic("NF-DISCOVERY-LIMIT-EXCEEDED")); return undefined; }
    try {
      const parsed = parseYaml(input.read(file));
      if (!parsed.valid || parsed.value === null || Array.isArray(parsed.value) || typeof parsed.value !== "object") {
        throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
      }
      const value = object(parsed.value);
      if (value.specVersion !== "0.1") {
        errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-VERSION", file)); return undefined;
      }
      if (!knownKind(value.kind)) {
        errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-KIND", file)); return undefined;
      }
      if (expected && value.kind !== expected) {
        errors.push(diagnostic("NF-DISCOVERY-KIND-MISMATCH", file)); return undefined;
      }
      const document = { file, kind: value.kind, value };
      documents.push(document);
      return document;
    } catch (error) {
      errors.push(diagnostic(error instanceof InputFailure ? error.code : "NF-DISCOVERY-UNSAFE-SOURCE", file));
      return undefined;
    }
  }
  if (selection.files) {
    if (selection.project || !selection.files.length || selection.files.length > 128) {
      errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")); return finish();
    }
    for (const file of [...selection.files].sort(lexical)) load(file);
  } else {
    let projectPath = selection.project;
    if (!projectPath) {
      try {
        const entries = (["project.yaml", "project.yml"] as const).filter(file => input.exists(file));
        if (entries.length !== 1) {
          errors.push(diagnostic(entries.length ? "NF-DISCOVERY-MULTIPLE-PROJECTS" : "NF-DISCOVERY-NO-PROJECT"));
          return finish();
        }
        projectPath = entries[0];
      } catch { errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE")); return finish(); }
    }
    const project = load(projectPath, "Project");
    if (project) {
      const hints = project.value.manifests;
      if (hints !== undefined) {
        if (hints === null || typeof hints !== "object" || Array.isArray(hints)) {
          errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file));
        } else if (Object.hasOwn(hints, "workflow") && Object.hasOwn(hints, "workflows")) {
          errors.push(diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", project.file));
        } else {
          const sources: { file: string; kind: Kind }[] = [];
          for (const key of Object.keys(hints).sort(lexical)) {
            if (!Object.hasOwn(hintKinds, key)) {
              errors.push(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file)); continue;
            }
            const values = key === "workflows" ? hints[key] : [hints[key]];
            if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== "string")) {
              errors.push(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", project.file)); continue;
            }
            for (const file of values) sources.push({ file: file as string, kind: hintKinds[key] });
          }
          if (sources.length + 1 > 128) errors.push(diagnostic("NF-DISCOVERY-LIMIT-EXCEEDED"));
          else if (!errors.length) for (const source of sources.sort((a, b) => lexical(a.file, b.file))) load(source.file, source.kind);
        }
      }
    }
  }
  const projects = documents.filter(document => document.kind === "Project");
  if (projects.length !== 1) {
    errors.push(diagnostic(projects.length ? "NF-DISCOVERY-MULTIPLE-PROJECTS" : "NF-DISCOVERY-NO-PROJECT"));
    return finish();
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
  return finish();
}
