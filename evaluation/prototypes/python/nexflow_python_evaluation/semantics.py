"""Pure native semantic checks. Bindings are static specification data."""
import json
import re
from pathlib import Path
from .model import array, obj

RULES = json.loads(Path(__file__).with_name("semantic-rules.json").read_text(encoding="utf-8"))

def text(value):
    return value if isinstance(value, str) else ""

def locations(value, pattern):
    found = [(value, "")]
    for key in filter(None, pattern.split("/")):
        following = []
        for value, path in found:
            if key == "*":
                following.extend((child, path + "/" + str(i)) for i, child in enumerate(array(value)))
            elif key in obj(value):
                following.append((value[key], path + "/" + key.replace("~", "~0").replace("/", "~1")))
        found = following
    return found

def at(value, pattern):
    found = locations(value, pattern)
    return found[0][0] if found else None

def issue(category, kind=None, path=None, namespace=None, identity=None):
    result = {"code": "NF-SEMANTIC", "category": category, "severity": "error"}
    if kind:
        result["sourceKind"] = kind
    if path is not None:
        result["instancePath"] = path
    if namespace:
        result["targetNamespace"] = namespace
    if identity is not None:
        result["targetId"] = identity if len(text(identity)) <= 128 and re.fullmatch(r"[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*", text(identity)) else "<redacted-id>"
    return result

def workflow_namespace(workflow):
    diagnostics, stages, steps = [], set(), {}
    for stage in array(obj(workflow).get("stages")):
        identity = text(obj(stage).get("id"))
        if identity:
            if identity in stages:
                diagnostics.append(issue("duplicate-workflow-stage"))
            else:
                stages.add(identity)
        for step in array(obj(stage).get("steps")):
            identity = text(obj(step).get("id"))
            if not identity:
                continue
            if identity in steps:
                diagnostics.append(issue("duplicate-workflow-step"))
            else:
                steps[identity] = step
    for step in steps.values():
        for ref in array(obj(step).get("dependsOn")):
            if text(ref) and ref not in steps:
                diagnostics.append(issue("unknown-workflow-step"))
    for edge in array(obj(workflow).get("dependencies")):
        for key in ("from", "to"):
            ref = text(obj(edge).get(key))
            if ref and ref not in steps:
                diagnostics.append(issue("unknown-workflow-step"))
    return diagnostics

def artifact_namespace(tasks, handoffs):
    diagnostics, identities = [], set()
    for task in array(tasks):
        for artifact in array(obj(task).get("artifacts")):
            identity = text(obj(artifact).get("id"))
            if not identity:
                continue
            if identity in identities:
                diagnostics.append(issue("duplicate-artifact"))
            else:
                identities.add(identity)
    for handoff in array(handoffs):
        for ref in array(obj(handoff).get("artifacts")):
            if text(ref) and ref not in identities:
                diagnostics.append(issue("unknown-artifact"))
    return diagnostics

def semantic_fragment(documents):
    diagnostics, indexes = [], {}
    actors_present = "ActorSet" in documents
    def rows(kind, pattern):
        return locations(documents.get(kind), pattern)
    for kind, pattern, namespace, key in RULES["declarations"]:
        index = indexes.setdefault(namespace, {})
        for value, path in rows(kind, pattern):
            identity = text(obj(value).get(key))
            if not identity:
                continue
            if identity in index:
                category = "duplicate-" + namespace if namespace in ("workflow-stage", "workflow-step") else "duplicate-identity"
                diagnostics.append(issue(category, kind, path + "/" + key, namespace, identity))
            else:
                index[identity] = value
    if not actors_present:
        actors = indexes["actor"]
        for maintainer, path in rows("Project", "project/maintainers/*"):
            identity = text(obj(maintainer).get("id"))
            if not identity:
                continue
            if identity in actors:
                diagnostics.append(issue("duplicate-identity", "Project", path + "/id", "actor", identity))
            else:
                actors[identity] = maintainer
        actors.update(indexes["agent"])
    if diagnostics:
        return diagnostics

    def resolve(kind, path, value, namespace):
        identity = text(value)
        if not identity:
            return False
        if identity not in indexes.get(namespace, {}):
            diagnostics.append(issue("unresolved-reference", kind, path, namespace, identity))
            return False
        return True
    def typed(kind, path, value, namespace):
        entries = [(v, path + "/" + str(i)) for i, v in enumerate(value)] if isinstance(value, list) else [] if value is None else [(value, path)]
        identities = []
        for value, source in entries:
            if not isinstance(value, str) and obj(value).get("kind") != namespace:
                diagnostics.append(issue("wrong-reference-kind", kind, source))
                continue
            identity = text(value if isinstance(value, str) else obj(value).get("id"))
            resolve(kind, source, identity, namespace)
            if identity:
                identities.append(identity)
        return identities
    for kind, pattern, namespace in RULES["references"]:
        if not actors_present and kind == "Project" and pattern == "project/maintainers/*/id":
            continue
        for value, path in rows(kind, pattern):
            resolve(kind, path, value, namespace)
    bridges, graph = set(), {}
    for actor, path in rows("ActorSet", "actors/*"):
        actor = obj(actor)
        if actor.get("kind") == "agent":
            for identity in typed("ActorSet", path + "/agentRef", actor.get("agentRef"), "agent"):
                if identity in bridges and identity in indexes["agent"]:
                    diagnostics.append(issue("ambiguous-agent-bridge", "ActorSet", path + "/agentRef"))
                else:
                    bridges.add(identity)
        edges = typed("ActorSet", path + "/operatedBy", actor.get("operatedBy"), "actor") + typed("ActorSet", path + "/representedBy", actor.get("representedBy"), "actor")
        typed("ActorSet", path + "/integrationRef", actor.get("integrationRef"), "extension")
        if text(actor.get("id")):
            graph[actor["id"]] = edges
    if actors_present:
        for identity in indexes["agent"]:
            if identity not in bridges:
                diagnostics.append(issue("missing-agent-bridge", "ActorSet"))
    states = {}
    for start in graph:
        if start in states:
            continue
        stack = [[start, 0]]
        states[start] = 1
        while stack:
            frame = stack[-1]
            edges = graph[frame[0]]
            if frame[1] >= len(edges):
                states[frame[0]] = 2
                stack.pop()
                continue
            following = edges[frame[1]]
            frame[1] += 1
            if following not in graph:
                continue
            if states.get(following) == 1:
                diagnostics.append(issue("reference-cycle", "ActorSet"))
            elif following not in states:
                states[following] = 1
                stack.append([following, 0])
    human = {identity for identity, actor in indexes["actor"].items() if obj(actor).get("kind") == "human"}
    changed = True
    while changed:
        changed = False
        for identity, actor in indexes["actor"].items():
            representatives = array(obj(actor).get("representedBy"))
            if identity not in human and obj(actor).get("kind") == "authority" and representatives and all(obj(r).get("kind") == "actor" and text(obj(r).get("id")) in human for r in representatives):
                human.add(identity)
                changed = True
    override = at(documents.get("Project"), "project/policies/humanOverride")
    if override is not None:
        if not actors_present:
            diagnostics.append(issue("missing-actor-set", "Project"))
        else:
            for identity in typed("Project", "/project/policies/humanOverride/authorities", obj(override).get("authorities"), "actor"):
                if identity in indexes["actor"] and identity not in human:
                    diagnostics.append(issue("non-human-authority", "Project"))
    active = set()
    for definition, path in rows("AgentDefinitionSet", "agentDefinitions/*"):
        definition = obj(definition)
        if definition.get("status") != "active":
            continue
        identity = text(definition.get("agentRef"))
        if identity and identity in indexes["agent"]:
            if identity in active:
                diagnostics.append(issue("ambiguous-active-definition", "AgentDefinitionSet", path))
            else:
                active.add(identity)
        for field, namespace in (("promptSetRef", "prompt-set"), ("retrievalProfileRef", "retrieval-profile")):
            component = indexes[namespace].get(text(obj(definition.get("components")).get(field)))
            if component is None:
                continue
            if obj(component).get("status") != "active":
                diagnostics.append(issue("inactive-component", "AgentDefinitionSet", path + "/components/" + field))
            review = obj(obj(component).get("review"))
            if field == "promptSetRef" and review.get("required") is True and review.get("safetyReviewStatus") != "approved":
                diagnostics.append(issue("unapproved-component", "AgentDefinitionSet", path + "/components/" + field))
    for value, path in rows("ProviderSet", "providers/*/capabilities/*"):
        if text(value):
            diagnostics.append(issue("deprecated-provider-capability", "ProviderSet", path))
    target_kinds = {"agent-definition", "capability", "permission", "context-source", "memory-scope", "provider", "task", "workflow", "workflow-stage", "workflow-step", "extension"}
    for value, path in rows("Project", "project/approvalGates/*/appliesTo/*"):
        if text(value):
            diagnostics.append(issue("ambiguous-legacy-target", "Project", path))
    for value, path in rows("Project", "project/approvalGates/*/targets/*"):
        target = obj(value)
        kind = text(target.get("kind"))
        if kind in ("workflow-stage", "workflow-step"):
            scope = obj(target.get("scope"))
            if scope.get("kind") != "workflow" or not isinstance(scope.get("id"), str):
                diagnostics.append(issue("missing-workflow-scope", "Project", path))
                continue
            if scope["id"] not in indexes["workflow"]:
                diagnostics.append(issue("unknown-workflow-scope", "Project", path))
                continue
        elif "scope" in target:
            diagnostics.append(issue("unexpected-scope", "Project", path))
            continue
        if kind not in target_kinds:
            diagnostics.append(issue("unsupported-target-kind", "Project", path))
            continue
        resolve("Project", path + "/id", target.get("id"), kind)
    diagnostics.extend(workflow_namespace(at(documents.get("Workflow"), "workflow")))
    diagnostics.extend(artifact_namespace(at(documents.get("TaskSet"), "tasks"), at(documents.get("HandoffSet"), "handoffs")))
    return diagnostics

def semantic_operation(operation, inputs):
    pending, nodes = [(inputs, 0)], 0
    while pending:
        value, depth = pending.pop()
        nodes += 1
        if nodes > 10000 or depth > 64:
            return [issue("semantic-limit")]
        children = value if isinstance(value, list) else obj(value).values()
        pending.extend((child, depth + 1) for child in children)
    if operation == "semantic-fragment":
        return semantic_fragment(obj(inputs.get("documents")))
    if operation == "workflow-namespace":
        return [d for w in array(inputs.get("workflows")) for d in workflow_namespace(w)]
    if operation == "artifact-namespace":
        return [d for a in array(inputs.get("assemblies")) for d in artifact_namespace(obj(a).get("tasks"), obj(a).get("handoffs"))]
    raise ValueError("unsupported semantic operation")
