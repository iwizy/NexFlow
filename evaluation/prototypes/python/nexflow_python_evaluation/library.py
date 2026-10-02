"""Candidate library functions return data; they neither print nor exit."""
import re
from .discovery import discover
from .files import LocalInputs
from .inspection import InspectionLimit, inspect
from .model import KINDS, Selection, diagnostic, envelope, obj, ordered, safe_locator
from .schema import SchemaEngine, repository_schemas
from .yaml_input import parse_yaml

def evaluate(command: str, selection: Selection) -> dict:
    output = envelope(command if command in ("validate", "inspect") else None)
    if command not in ("validate", "inspect"):
        output.update(exitCode=2, diagnostics=[diagnostic("NEXFLOW-PROTOTYPE-USAGE", None)])
        return output
    try:
        assembly = discover(selection)
        output["inputMode"] = assembly["mode"]
        output["checks"]["discovery"] = "failed" if assembly["diagnostics"] else "passed"
        if assembly["diagnostics"]:
            output["diagnostics"] = assembly["diagnostics"]
            if any(issue["code"] in ("NF-DISCOVERY-UNSUPPORTED-VERSION", "NF-DISCOVERY-UNSUPPORTED-KIND") for issue in output["diagnostics"]):
                output["exitCode"] = 3
        else:
            output["checks"]["schema"] = "unavailable"
            schemas = repository_schemas()
            issues = [issue for document in assembly["documents"] for issue in schemas.validate(document)]
            output["checks"]["schema"] = "failed" if issues else "passed"
            if issues:
                output["diagnostics"] = issues
            else:
                documents = assembly["documents"]
                result = {"documentCount": len(documents), "documents": [{"file": safe_locator(document.file), "kind": document.kind} for document in documents]}
                if command == "inspect":
                    result["inspection"] = inspect(documents)
                output.update(result=result, success=True, exitCode=0)
    except InspectionLimit:
        output.update(exitCode=1, diagnostics=[diagnostic("NEXFLOW-PROTOTYPE-INSPECTION-LIMIT", None)], result=None, success=False)
    except Exception:
        output.update(exitCode=4, diagnostics=[diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", None)], result=None, success=False)
    output["diagnostics"] = ordered(output["diagnostics"])
    output["truncated"] = len(output["diagnostics"]) > 200
    output["diagnostics"] = output["diagnostics"][:200]
    return output

def evaluate_library_case(entry: dict, repository_root: str, schemas: SchemaEngine | None = None) -> dict:
    schemas = schemas or repository_schemas()
    operation, inputs = entry["operation"], entry["input"]
    result = {"caseId": entry["id"], "operation": operation, "valid": False, "diagnostics": [], "checks": {"runtime": "not-run", "extensions": "not-run"}}
    if operation == "yaml-parse":
        parsed = parse_yaml(inputs["yaml"])
        result["valid"] = parsed["valid"]
        result["diagnostics"] = [] if parsed["valid"] else [{"category": parsed["category"]}]
    elif operation == "local-schema":
        result["diagnostics"] = SchemaEngine(inputs["schemas"]).validate_local(inputs["entryId"], inputs["value"])
        result["valid"] = not result["diagnostics"]
    elif operation == "manifest-schema":
        parsed = parse_yaml(LocalInputs(repository_root).read(inputs["file"]))
        kind = obj(parsed["value"]).get("kind")
        if not parsed["valid"]:
            result["diagnostics"] = [{"category": parsed["category"]}]
        elif not isinstance(kind, str) or kind not in KINDS:
            result["diagnostics"] = [{"code": "NF-SCHEMA", "category": "unknown-kind", "instancePath": "",
                "kind": kind if isinstance(kind, str) and re.fullmatch(r"[A-Z][A-Za-z]{0,31}", kind) else "<redacted-kind>"}]
        else:
            result["diagnostics"] = [{**issue, "kind": kind} for issue in schemas.validate_value(kind, parsed["value"])]
        result["valid"] = not result["diagnostics"]
    elif operation == "discovery":
        if safe_locator(inputs["root"]) == "<redacted-source>":
            raise ValueError("invalid library root")
        arguments, project, files = inputs["args"], None, []
        if len(arguments) % 2:
            raise ValueError("invalid library selection")
        for index in range(0, len(arguments), 2):
            if arguments[index] == "--project" and project is None:
                project = arguments[index + 1]
            elif arguments[index] == "--file":
                files.append(arguments[index + 1])
            else:
                raise ValueError("invalid library selection")
        assembly = discover(Selection(str(LocalInputs(repository_root)._path(inputs["root"])), project, files or None))
        result["valid"] = not assembly["diagnostics"]
        result["diagnostics"] = [{"code": issue["code"]} for issue in assembly["diagnostics"]]
        if result["valid"]:
            result["documentCount"] = len(assembly["documents"])
            result["workflowIds"] = sorted(obj(document.value.get("workflow"))["id"] for document in assembly["documents"] if document.kind == "Workflow")
    elif operation in ("semantic-fragment", "workflow-namespace", "artifact-namespace"):
        result.update(valid=None, status="not-implemented")
    else:
        raise ValueError("unsupported library operation")
    return result
