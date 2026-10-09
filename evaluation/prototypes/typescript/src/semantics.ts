/** Pure, validation-only semantics. Static bindings are specification data, not an oracle. */
import { readFileSync } from "node:fs";
import { array, object, pointer, type Json, type ObjectValue } from "./model.js";

const rules = JSON.parse(readFileSync(new URL("../semantic-rules.json", import.meta.url), "utf8")) as {
  declarations: string[][]; references: string[][];
};
const text = (v: unknown): string => typeof v === "string" ? v : "";
const safeId = (v: unknown): string => /^[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*$/u.test(text(v)) && text(v).length <= 128 ? text(v) : "<redacted-id>";
type Location = [Json, string];
function locations(value: Json | undefined, pattern: string): Location[] {
  let found: Location[] = [[value ?? null, ""]];
  for (const key of pattern.split("/").filter(Boolean)) {
    found = found.flatMap(([v, path]) => key === "*"
      ? array(v).map((child, i): Location => [child, path + "/" + i])
      : Object.hasOwn(object(v), key) ? [[object(v)[key], path + "/" + pointer(key)] as Location] : []);
  }
  return found;
}
const at = (v: Json | undefined, path: string): Json | undefined => locations(v, path)[0]?.[0];
function issue(category: string, kind?: string, path?: string, namespace?: string, id?: string): ObjectValue {
  const d: ObjectValue = { code: "NF-SEMANTIC", category, severity: "error" };
  if (kind) d.sourceKind = kind;
  if (path !== undefined) d.instancePath = path;
  if (namespace) d.targetNamespace = namespace;
  if (id !== undefined) d.targetId = safeId(id);
  return d;
}

export function workflowNamespace(workflow: Json): ObjectValue[] {
  const diagnostics: ObjectValue[] = [], stages = new Set<string>(), steps = new Map<string, Json>();
  for (const stage of array(object(workflow).stages)) {
    const id = text(object(stage).id);
    if (id) { if (stages.has(id)) diagnostics.push(issue("duplicate-workflow-stage")); else stages.add(id); }
    for (const step of array(object(stage).steps)) {
      const id = text(object(step).id); if (!id) continue;
      if (steps.has(id)) diagnostics.push(issue("duplicate-workflow-step")); else steps.set(id, step);
    }
  }
  for (const step of steps.values()) for (const ref of array(object(step).dependsOn))
    if (text(ref) && !steps.has(text(ref))) diagnostics.push(issue("unknown-workflow-step"));
  for (const edge of array(object(workflow).dependencies)) for (const key of ["from", "to"])
    if (text(object(edge)[key]) && !steps.has(text(object(edge)[key]))) diagnostics.push(issue("unknown-workflow-step"));
  return diagnostics;
}
export function artifactNamespace(tasks: Json | undefined, handoffs: Json | undefined): ObjectValue[] {
  const diagnostics: ObjectValue[] = [], ids = new Set<string>();
  for (const task of array(tasks)) for (const artifact of array(object(task).artifacts)) {
    const id = text(object(artifact).id); if (!id) continue;
    if (ids.has(id)) diagnostics.push(issue("duplicate-artifact")); else ids.add(id);
  }
  for (const handoff of array(handoffs)) for (const ref of array(object(handoff).artifacts))
    if (text(ref) && !ids.has(text(ref))) diagnostics.push(issue("unknown-artifact"));
  return diagnostics;
}

export function semanticFragment(documents: ObjectValue): ObjectValue[] {
  const diagnostics: ObjectValue[] = [], indexes = new Map<string, Map<string, Json>>();
  const actorsPresent = Object.hasOwn(documents, "ActorSet");
  const rows = (kind: string, pattern: string) => locations(documents[kind], pattern);
  for (const [kind, pattern, namespace, key] of rules.declarations) {
    const index = indexes.get(namespace) ?? new Map<string, Json>(); indexes.set(namespace, index);
    for (const [value, path] of rows(kind, pattern)) {
      const id = text(object(value)[key]); if (!id) continue;
      if (index.has(id)) diagnostics.push(issue(namespace === "workflow-stage" || namespace === "workflow-step" ? "duplicate-" + namespace : "duplicate-identity", kind, path + "/" + key, namespace, id));
      else index.set(id, value);
    }
  }
  if (!actorsPresent) {
    const actors = indexes.get("actor")!;
    for (const [maintainer, path] of rows("Project", "project/maintainers/*")) {
      const id = text(object(maintainer).id); if (!id) continue;
      if (actors.has(id)) diagnostics.push(issue("duplicate-identity", "Project", path + "/id", "actor", id));
      else actors.set(id, maintainer);
    }
    for (const [id, agent] of indexes.get("agent")!) actors.set(id, agent);
  }
  // Ambiguous declarations cannot select a target or authorize a dependent check.
  if (diagnostics.length) return diagnostics;
  const resolve = (kind: string, path: string, value: Json | undefined, ns: string): boolean => {
    const id = text(value); if (!id) return false;
    if (!indexes.get(ns)?.has(id)) { diagnostics.push(issue("unresolved-reference", kind, path, ns, id)); return false; }
    return true;
  };
  const typed = (kind: string, path: string, value: Json | undefined, ns: string): string[] => {
    const entries: Location[] = Array.isArray(value) ? value.map((v, i) => [v, path + "/" + i]) : value === undefined ? [] : [[value, path]];
    const ids: string[] = [];
    for (const [v, p] of entries) {
      if (typeof v !== "string" && object(v).kind !== ns) { diagnostics.push(issue("wrong-reference-kind", kind, p)); continue; }
      const id = text(typeof v === "string" ? v : object(v).id);
      resolve(kind, p, id, ns); if (id) ids.push(id);
    }
    return ids;
  };
  for (const [kind, pattern, ns] of rules.references) {
    if (!actorsPresent && kind === "Project" && pattern === "project/maintainers/*/id") continue;
    for (const [value, path] of rows(kind, pattern)) resolve(kind, path, value, ns);
  }
  const bridges = new Set<string>(), graph = new Map<string, string[]>();
  for (const [actor, path] of rows("ActorSet", "actors/*")) {
    const a = object(actor);
    if (a.kind === "agent") for (const id of typed("ActorSet", path + "/agentRef", a.agentRef, "agent")) {
      if (bridges.has(id) && indexes.get("agent")!.has(id)) diagnostics.push(issue("ambiguous-agent-bridge", "ActorSet", path + "/agentRef")); else bridges.add(id);
    }
    const edges = [...typed("ActorSet", path + "/operatedBy", a.operatedBy, "actor"), ...typed("ActorSet", path + "/representedBy", a.representedBy, "actor")];
    typed("ActorSet", path + "/integrationRef", a.integrationRef, "extension");
    if (text(a.id)) graph.set(text(a.id), edges);
  }
  if (actorsPresent) for (const id of indexes.get("agent")!.keys())
    if (!bridges.has(id)) diagnostics.push(issue("missing-agent-bridge", "ActorSet"));
  // Iterative DFS: large or cyclic relationship graphs do not recurse on the host stack.
  const state = new Map<string, number>();
  for (const start of graph.keys()) {
    if (state.has(start)) continue;
    const stack: [string, number][] = [[start, 0]]; state.set(start, 1);
    while (stack.length) {
      const frame = stack[stack.length - 1], edges = graph.get(frame[0])!;
      if (frame[1] >= edges.length) { state.set(frame[0], 2); stack.pop(); continue; }
      const next = edges[frame[1]++]; if (!graph.has(next)) continue;
      if (state.get(next) === 1) diagnostics.push(issue("reference-cycle", "ActorSet"));
      else if (!state.has(next)) { state.set(next, 1); stack.push([next, 0]); }
    }
  }
  const human = new Set<string>();
  for (const [id, actor] of indexes.get("actor")!) if (object(actor).kind === "human") human.add(id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, actor] of indexes.get("actor")!) {
      const a = object(actor), reps = array(a.representedBy);
      if (!human.has(id) && a.kind === "authority" && reps.length && reps.every(r => object(r).kind === "actor" && human.has(text(object(r).id)))) { human.add(id); changed = true; }
    }
  }
  const override = at(documents.Project, "project/policies/humanOverride");
  if (override !== undefined) {
    if (!actorsPresent) diagnostics.push(issue("missing-actor-set", "Project"));
    else for (const id of typed("Project", "/project/policies/humanOverride/authorities", object(override).authorities, "actor"))
      if (indexes.get("actor")!.has(id) && !human.has(id)) diagnostics.push(issue("non-human-authority", "Project"));
  }
  const active = new Set<string>();
  for (const [definition, path] of rows("AgentDefinitionSet", "agentDefinitions/*")) {
    const d = object(definition); if (d.status !== "active") continue;
    const id = text(d.agentRef);
    if (id && indexes.get("agent")!.has(id)) { if (active.has(id)) diagnostics.push(issue("ambiguous-active-definition", "AgentDefinitionSet", path)); else active.add(id); }
    for (const [field, namespace] of [["promptSetRef", "prompt-set"], ["retrievalProfileRef", "retrieval-profile"]]) {
      const component = indexes.get(namespace)?.get(text(object(d.components)[field]));
      if (!component) continue;
      if (object(component).status !== "active") diagnostics.push(issue("inactive-component", "AgentDefinitionSet", path + "/components/" + field));
      if (field === "promptSetRef" && object(object(component).review).required === true && object(object(component).review).safetyReviewStatus !== "approved")
        diagnostics.push(issue("unapproved-component", "AgentDefinitionSet", path + "/components/" + field));
    }
  }
  for (const [value, path] of rows("ProviderSet", "providers/*/capabilities/*"))
    if (text(value)) diagnostics.push(issue("deprecated-provider-capability", "ProviderSet", path));
  const targetKinds = new Set(["agent-definition", "capability", "permission", "context-source", "memory-scope", "provider", "task", "workflow", "workflow-stage", "workflow-step", "extension"]);
  for (const [value, path] of rows("Project", "project/approvalGates/*/appliesTo/*"))
    if (text(value)) diagnostics.push(issue("ambiguous-legacy-target", "Project", path));
  for (const [value, path] of rows("Project", "project/approvalGates/*/targets/*")) {
    const t = object(value), kind = text(t.kind);
    if (kind === "workflow-stage" || kind === "workflow-step") {
      const scope = object(t.scope);
      if (scope.kind !== "workflow" || typeof scope.id !== "string") { diagnostics.push(issue("missing-workflow-scope", "Project", path)); continue; }
      if (!indexes.get("workflow")!.has(scope.id)) { diagnostics.push(issue("unknown-workflow-scope", "Project", path)); continue; }
    } else if (Object.hasOwn(t, "scope")) { diagnostics.push(issue("unexpected-scope", "Project", path)); continue; }
    if (!targetKinds.has(kind)) { diagnostics.push(issue("unsupported-target-kind", "Project", path)); continue; }
    resolve("Project", path + "/id", t.id, kind);
  }
  diagnostics.push(...workflowNamespace(at(documents.Workflow, "workflow") ?? null), ...artifactNamespace(at(documents.TaskSet, "tasks"), at(documents.HandoffSet, "handoffs")));
  return diagnostics;
}
export function semanticOperation(operation: string, input: ObjectValue): ObjectValue[] {
  const pending: [Json, number][] = [[input, 0]]; let nodes = 0;
  while (pending.length) {
    const [value, depth] = pending.pop()!;
    if (++nodes > 10000 || depth > 64) return [issue("semantic-limit")];
    for (const child of Array.isArray(value) ? value : Object.values(object(value))) pending.push([child, depth + 1]);
  }
  if (operation === "semantic-fragment") return semanticFragment(object(input.documents));
  if (operation === "workflow-namespace") return array(input.workflows).flatMap(workflowNamespace);
  if (operation === "artifact-namespace") return array(input.assemblies).flatMap(a => artifactNamespace(object(a).tasks, object(a).handoffs));
  throw new Error("Unsupported semantic operation.");
}
