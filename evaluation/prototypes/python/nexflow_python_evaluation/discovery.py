"""Candidate-owned explicit manifest assembly; no implicit directory traversal."""
from .files import InputFailure, LocalInputs
from .model import KINDS, Manifest, Selection, diagnostic, obj, ordered
from .yaml_input import parse_yaml

HINTS = {"actors": "ActorSet", "agents": "AgentSet", "agentDefinitions": "AgentDefinitionSet",
    "capabilities": "CapabilitySet", "permissions": "PermissionSet", "tasks": "TaskSet", "workflow": "Workflow",
    "workflows": "Workflow", "handoffs": "HandoffSet", "context": "ContextSet", "memory": "MemorySet",
    "providers": "ProviderSet", "modelProfiles": "ModelProfileSet", "promptSets": "PromptSet",
    "retrievalProfiles": "RetrievalProfileSet", "events": "EventSet", "extensions": "ExtensionSet"}

def discover(selection: Selection) -> dict:
    mode = "explicit-file-list" if selection.files is not None else "project-source-hints" if selection.project else "directory-project"
    documents, errors, seen = [], [], set()
    def finish():
        return {"mode": mode, "documents": sorted(documents, key=lambda document: document.file), "diagnostics": ordered(errors)}
    try:
        inputs = LocalInputs(selection.root)
    except InputFailure:
        errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE"))
        return finish()
    def load(file, expected=None):
        if not isinstance(file, str):
            errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE"))
            return None
        if file in seen:
            errors.append(diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", file))
            return None
        seen.add(file)
        if len(seen) > 128:
            errors.append(diagnostic("NF-DISCOVERY-LIMIT-EXCEEDED"))
            return None
        try:
            parsed = parse_yaml(inputs.read(file))
            value = parsed["value"]
            if not parsed["valid"] or not isinstance(value, dict):
                raise InputFailure()
            if value.get("specVersion") != "0.1":
                errors.append(diagnostic("NF-DISCOVERY-UNSUPPORTED-VERSION", file))
                return None
            kind = value.get("kind")
            if not isinstance(kind, str) or kind not in KINDS:
                errors.append(diagnostic("NF-DISCOVERY-UNSUPPORTED-KIND", file))
                return None
            if expected and kind != expected:
                errors.append(diagnostic("NF-DISCOVERY-KIND-MISMATCH", file))
                return None
            document = Manifest(file, kind, value)
            documents.append(document)
            return document
        except InputFailure as error:
            errors.append(diagnostic(error.code, file))
            return None
    if selection.files is not None:
        if (selection.project is not None or not isinstance(selection.files, list) or not selection.files
            or len(selection.files) > 128 or not all(isinstance(file, str) for file in selection.files)):
            errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE"))
            return finish()
        for file in sorted(selection.files):
            load(file)
    else:
        project_path = selection.project
        if not project_path:
            try:
                entries = [file for file in ("project.yaml", "project.yml") if inputs.exists(file)]
                if len(entries) != 1:
                    errors.append(diagnostic("NF-DISCOVERY-MULTIPLE-PROJECTS" if entries else "NF-DISCOVERY-NO-PROJECT"))
                    return finish()
                project_path = entries[0]
            except InputFailure:
                errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE"))
                return finish()
        project = load(project_path, "Project")
        if project and "manifests" in project.value:
            hints = project.value["manifests"]
            if not isinstance(hints, dict):
                errors.append(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file))
            elif "workflow" in hints and "workflows" in hints:
                errors.append(diagnostic("NF-DISCOVERY-DUPLICATE-SOURCE", project.file))
            else:
                sources = []
                for key in sorted(hints):
                    if key not in HINTS:
                        errors.append(diagnostic("NF-DISCOVERY-UNSUPPORTED-HINT", project.file))
                        continue
                    values = hints[key] if key == "workflows" else [hints[key]]
                    if not isinstance(values, list) or not values or not all(isinstance(value, str) for value in values):
                        errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", project.file))
                        continue
                    sources.extend((file, HINTS[key]) for file in values)
                if len(sources) + 1 > 128:
                    errors.append(diagnostic("NF-DISCOVERY-LIMIT-EXCEEDED"))
                elif not errors:
                    for file, kind in sorted(sources):
                        load(file, kind)
    projects = [document for document in documents if document.kind == "Project"]
    if len(projects) != 1:
        errors.append(diagnostic("NF-DISCOVERY-MULTIPLE-PROJECTS" if projects else "NF-DISCOVERY-NO-PROJECT"))
        return finish()
    identity = obj(projects[0].value.get("project")).get("id")
    if not isinstance(identity, str) or not identity:
        errors.append(diagnostic("NF-DISCOVERY-PROJECT-MISMATCH", projects[0].file))
    singleton, workflows = set(), set()
    for document in sorted(documents, key=lambda document: document.file):
        if obj(document.value.get("metadata")).get("project") != identity:
            errors.append(diagnostic("NF-DISCOVERY-PROJECT-MISMATCH", document.file))
        if document.kind == "Workflow":
            workflow_id = obj(document.value.get("workflow")).get("id")
            if not isinstance(workflow_id, str) or not workflow_id:
                errors.append(diagnostic("NF-DISCOVERY-UNSAFE-SOURCE", document.file))
            elif workflow_id in workflows:
                errors.append(diagnostic("NF-DISCOVERY-DUPLICATE-WORKFLOW", document.file))
            else:
                workflows.add(workflow_id)
        elif document.kind in singleton and document.kind != "Project":
            errors.append(diagnostic("NF-DISCOVERY-DUPLICATE-SINGLETON", document.file))
        else:
            singleton.add(document.kind)
    return finish()
