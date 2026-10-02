"""Declared-only allowlist projection, not reference resolution or authorization."""
from .model import KINDS, Manifest, array, display_id, obj, pointer, safe_locator

BINDINGS = {
    "project": [("maintainers.*.id", "participant")],
    "actor": [("agentRef.id", "agent"), ("operatedBy.*.id", "actor"), ("representedBy.*.id", "actor"), ("integrationRef.id", "extension")],
    "agent-definition": [("agentRef", "agent"), ("owner", "participant"),
        ("components.modelProfileRef", "model-profile"), ("components.promptSetRef", "prompt-set"),
        ("components.retrievalProfileRef", "retrieval-profile"), ("components.permissionRefs.*", "permission"),
        ("components.capabilityRefs.*", "capability"), ("components.contextSourceRefs.*", "context-source"),
        ("components.memoryScopes.*", "memory-scope"), ("components.extensionRefs.*", "extension")],
    "task": [("owner", "participant"), ("participants.*", "participant"), ("dependsOn.*", "task"),
        ("capabilitiesRequired.*", "capability"), ("approvalGates.*", "approval-gate")],
    "workflow": [("dependencies.*.from", "workflow-step"), ("dependencies.*.to", "workflow-step")],
    "workflow-step": [("task", "task"), ("dependsOn.*", "workflow-step"), ("approvalGates.*", "approval-gate"), ("emits.*", "event")],
    "handoff": [("from.*", "participant"), ("to.*", "participant"), ("artifacts.*", "artifact")],
    "permission": [("subjects.*", "participant"), ("capabilities.*", "capability"), ("approvalGate", "approval-gate")],
    "context-source": [("access.allowedActors.*", "participant"), ("access.deniedActors.*", "participant"), ("approvalGates.*", "approval-gate")],
    "memory-scope": [("allowedConsumers.*", "participant"), ("allowedWriters.*", "participant"), ("allowedSourceScopes.*", "memory-scope"), ("approvalGate", "approval-gate")],
    "model-profile": [("selection.providerRefs.*", "provider"), ("selection.pinnedModel.providerRef", "provider"), ("fallback.candidateProviderRefs.*", "provider")],
    "prompt-set": [("owner", "participant")],
    "retrieval-profile": [("owner", "participant"), ("sources.*.contextSourceRef", "context-source"),
        ("excludedSources.*", "context-source"), ("index.embeddingModelProfileRef", "model-profile")],
    "extension": [("requiredCapabilities.*", "capability")],
}
class InspectionLimit(Exception):
    pass

def inspect(documents: list[Manifest]) -> dict:
    resources, references, counts = [], [], {}
    def row(document, path, namespace, value, workflow_id=None):
        return {"file": document.file, "path": path, "kind": namespace,
                "id": display_id(value if isinstance(value, str) else obj(value).get("id")),
                "scope": {"kind": "workflow", "id": display_id(workflow_id)} if namespace in ("workflow-stage", "workflow-step") else None}
    def visit(value, parts, path, emit):
        if not parts:
            emit(value, path)
            return
        first, remaining = parts[0], parts[1:]
        if first == "*":
            for index, child in enumerate(array(value)):
                visit(child, remaining, path + pointer([index]), emit)
        elif first in obj(value):
            visit(value[first], remaining, path + pointer([first]), emit)
    def declaration(document, value, path, namespace, id_field="id", workflow_id=None):
        resources.append(row(document, path, namespace, obj(value).get(id_field), workflow_id))
        counts[document.kind] = counts.get(document.kind, 0) + 1
        def reference(value, source_path, target):
            references.append(row(document, source_path, target, value, workflow_id))
            if len(references) > 2000:
                raise InspectionLimit()
        for selector, target in BINDINGS.get(namespace, []):
            visit(value, selector.split("."), path, lambda value, source_path, target=target: reference(value, source_path, target))
        if len(resources) > 1000:
            raise InspectionLimit()
    for document in documents:
        field, namespace, id_field = KINDS[document.kind]
        workflow = obj(document.value.get("workflow"))
        if document.kind in ("Project", "Workflow"):
            declaration(document, obj(document.value.get(field)), pointer([field]), namespace, id_field, workflow.get("id"))
        else:
            for index, value in enumerate(array(document.value.get(field))):
                declaration(document, value, pointer([field, index]), namespace, id_field)
        if document.kind == "Project":
            for index, value in enumerate(array(obj(document.value.get("project")).get("approvalGates"))):
                declaration(document, value, pointer(["project", "approvalGates", index]), "approval-gate")
        if document.kind == "TaskSet":
            for index, task in enumerate(array(document.value.get("tasks"))):
                for artifact_index, value in enumerate(array(obj(task).get("artifacts"))):
                    declaration(document, value, pointer(["tasks", index, "artifacts", artifact_index]), "artifact")
        if document.kind == "Workflow":
            for stage_index, stage in enumerate(array(workflow.get("stages"))):
                stage_path = pointer(["workflow", "stages", stage_index])
                declaration(document, stage, stage_path, "workflow-stage", workflow_id=workflow.get("id"))
                for step_index, step in enumerate(array(obj(stage).get("steps"))):
                    declaration(document, step, stage_path + pointer(["steps", step_index]), "workflow-step", workflow_id=workflow.get("id"))
    project = next(document for document in documents if document.kind == "Project")
    def rows(values):
        return [{**value, "file": safe_locator(value["file"])} for value in sorted(values, key=lambda value: tuple(value[key] for key in ("file", "path", "kind", "id")))]
    return {"mode": "declared-only", "referencesResolved": False, "referenceCoverage": "selected-fields",
            "project": {"file": safe_locator(project.file), "path": "/project", "id": display_id(obj(project.value.get("project")).get("id"))},
            "summary": [{"kind": kind, "documentCount": sum(document.kind == kind for document in documents), "resourceCount": counts.get(kind, 0)} for kind in sorted({document.kind for document in documents})],
            "resources": rows(resources), "references": rows(references)}
