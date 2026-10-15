"""Versioned data boundary; raw experiment diagnostics remain a separate channel."""
from .library import evaluate_library_case
from .files import LocalInputs
from .model import KINDS, Manifest, display_id, obj, pointer
from .schema import SchemaEngine, repository_schemas
from .yaml_input import parse_yaml

def evaluate_public_library_case(entry, root, schemas=None):
    native = evaluate_library_case(entry, root, schemas)
    operation, inputs = entry["operation"], entry["input"]
    issues = native["diagnostics"]
    if operation == "local-schema":
        issues = SchemaEngine(inputs["schemas"]).validate_local_public(inputs["entryId"], inputs["value"])
    if operation == "manifest-schema":
        parsed = parse_yaml(LocalInputs(root).read(inputs["file"]))
        kind = obj(parsed["value"]).get("kind")
        if parsed["valid"] and isinstance(kind, str) and kind in KINDS:
            issues = (schemas or repository_schemas()).validate(Manifest(inputs["file"], kind, parsed["value"]))
    diagnostics = []
    for issue in issues:
        category = issue.get("keyword", issue.get("category"))
        code = issue.get("code", "NF-DISCOVERY-UNSAFE-SOURCE")
        path = issue.get("path", issue.get("instancePath"))
        if "missingProperty" in issue:
            path = (path or "") + pointer([issue["missingProperty"]])
        context = {k: issue[k] for k in ("kind", "sourceKind", "targetNamespace", "targetId") if isinstance(issue.get(k), str)}
        diagnostics.append({"severity": "error", "code": code, "category": category, "path": path,
            "meaning": operation + ":" + code + ":" + (category or "not-emitted"), "context": context})
    diagnostics.sort(key=lambda d: (d["path"] or "", d["severity"], d["code"], d["category"] or "", d["meaning"],
        *(d["context"].get(k, "") for k in ("kind", "sourceKind", "targetNamespace", "targetId"))))
    if native["valid"] != (not diagnostics):
        raise ValueError("inconsistent validation result")
    return {"contractVersion": "nf-validation-diagnostics-v1", "caseId": display_id(native["caseId"]), "operation": operation,
        "valid": native["valid"], "diagnostics": diagnostics[:200], "truncated": len(diagnostics) > 200,
        "executionAuthorized": False, "checks": {"runtime": "not-run", "extensions": "not-run"},
        "result": {"documentCount": native["documentCount"], "workflowIds": [display_id(i) for i in native["workflowIds"]]} if native["valid"] and "documentCount" in native else None}
