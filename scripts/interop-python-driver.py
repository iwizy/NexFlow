"""NF-120 native adapter. The packet contains identities/inputs, never expected results."""
import copy
import json
from pathlib import Path
import sys

source, inputs = map(Path, sys.argv[1:])
sys.path.insert(0, str(source / "evaluation/prototypes/python"))
from nexflow_python_evaluation import (Manifest, Selection, discover,
    evaluate_public_library_case, parse_yaml, repository_schemas)

schemas = repository_schemas()
results = []
for entry in json.load(sys.stdin):
    before = copy.deepcopy(entry)
    native, reason = None, None
    try:
        operation, value = entry["operation"], entry["input"]
        if operation == "manifest-schema":
            document = value.get("value")
            if document is None:
                document = parse_yaml((inputs / value["file"]).read_text())["value"]
            if document["kind"] in schemas.validators:
                issues = schemas.validate(Manifest(value.get("file", "input.yaml"), document["kind"], document))
                native = {"valid": not issues, "diagnostics": issues, "checks": {"schema": "failed" if issues else "passed"}}
            else:
                native = evaluate_public_library_case({"id": entry["caseId"].split("/", 1)[1],
                    "operation": operation, "input": value}, str(inputs), schemas)
        elif operation == "yaml-parse":
            native = parse_yaml(value["yaml"])
        elif operation == "discovery":
            arguments, project, files = value["args"], None, []
            for index in range(0, len(arguments), 2):
                if arguments[index] == "--project":
                    project = arguments[index + 1]
                else:
                    files.append(arguments[index + 1])
            assembly = discover(Selection(str(inputs / value["root"]), project, files or None))
            issues = assembly["diagnostics"]
            native = {"valid": not issues, "diagnostics": issues,
                "documentCount": None if issues else len(assembly["documents"]),
                "workflowIds": None if issues else sorted(d.value["workflow"]["id"] for d in assembly["documents"] if d.kind == "Workflow")}
        elif operation in ("local-schema", "semantic-fragment", "workflow-namespace", "artifact-namespace"):
            native = evaluate_public_library_case({"id": entry["caseId"].split("/", 1)[1],
                "operation": operation, "input": value}, str(inputs), schemas)
        else:
            reason = "No native Python interface for " + entry["profile"]
        if before != entry:
            raise ValueError("mutated input")
        results.append({"caseId": entry["caseId"], "state": "observed" if native else "unsupported", "reason": reason, "native": native})
    except Exception:
        results.append({"caseId": entry["caseId"], "state": "error", "reason": "Python adapter did not produce a bounded result", "native": None})
sys.stdout.write(json.dumps(results, ensure_ascii=True, separators=(",", ":")) + "\n")
