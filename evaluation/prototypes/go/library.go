package candidate

import (
	"errors"
	"sort"
)

// Evaluate is the ordered discovery/schema/inspection library boundary.
func Evaluate(command string, selection Selection, schemas *SchemaEngine) map[string]any {
	if command != "validate" && command != "inspect" {
		return Usage()
	}
	out := Envelope(command)
	assembly := Discover(selection)
	out["inputMode"] = assembly.Mode
	checks := object(out["checks"])
	issues := assembly.Diagnostics
	checks["discovery"] = "passed"
	if len(issues) > 0 {
		checks["discovery"] = "failed"
		for _, issue := range issues {
			if issue["code"] == "NF-DISCOVERY-UNSUPPORTED-VERSION" || issue["code"] == "NF-DISCOVERY-UNSUPPORTED-KIND" {
				out["exitCode"] = 3
			}
		}
	} else {
		if schemas == nil {
			checks["schema"] = "unavailable"
			out["exitCode"] = 4
			issues = append(issues, Diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", nil, nil, nil, nil))
		} else {
			for _, document := range assembly.Documents {
				issues = append(issues, schemas.Validate(document)...)
			}
			checks["schema"] = "passed"
			if len(issues) > 0 {
				checks["schema"] = "failed"
			} else {
				documents := []any{}
				for _, document := range assembly.Documents {
					documents = append(documents, map[string]any{"file": SafeLocator(document.File), "kind": document.Kind})
				}
				result := map[string]any{"documentCount": len(documents), "documents": documents}
				if command == "inspect" {
					inspection, err := Inspect(assembly.Documents)
					if err != nil {
						issues = append(issues, Diagnostic("NEXFLOW-PROTOTYPE-INSPECTION-LIMIT", nil, nil, nil, nil))
					} else {
						result["inspection"] = inspection
					}
				}
				if len(issues) == 0 {
					out["success"] = true
					out["exitCode"] = 0
					out["result"] = result
				}
			}
		}
	}
	ordered(issues, "file", "path", "severity", "code", "kind", "keyword", "message")
	out["truncated"] = len(issues) > 200
	if len(issues) > 200 {
		issues = issues[:200]
	}
	out["diagnostics"] = issues
	return out
}

// EvaluateLibraryCase receives declarative inputs without expectations/oracle.
func EvaluateLibraryCase(entry map[string]any, root string, schemas *SchemaEngine) (map[string]any, error) {
	operation := text(entry["operation"])
	input := object(entry["input"])
	result := map[string]any{"caseId": entry["id"], "operation": operation, "valid": false, "diagnostics": []map[string]any{}, "checks": map[string]any{"runtime": "not-run", "extensions": "not-run"}}
	issues := []map[string]any{}
	switch operation {
	case "yaml-parse":
		_, err := ParseYAML(text(input["yaml"]))
		if err != nil {
			category := "syntax"
			if errors.Is(err, errDuplicate) {
				category = "duplicate-key"
			}
			issues = append(issues, map[string]any{"category": category})
		}
	case "local-schema":
		issues = ValidateLocal(array(input["schemas"]), text(input["entryId"]), input["value"])
	case "manifest-schema":
		inputs, err := NewLocalInputs(root)
		if err != nil {
			return nil, err
		}
		source, err := inputs.Read(text(input["file"]))
		inputs.Close()
		if err != nil {
			return nil, err
		}
		value, err := ParseYAML(source)
		if err != nil {
			category := "syntax"
			if errors.Is(err, errDuplicate) {
				category = "duplicate-key"
			}
			issues = append(issues, map[string]any{"category": category})
		} else {
			name := text(object(value)["kind"])
			if _, known := kinds[name]; !known {
				if len(name) > 32 || name == "" || name[0] < 'A' || name[0] > 'Z' || !asciiKind(name) {
					name = "<redacted-kind>"
				}
				issues = append(issues, map[string]any{"code": "NF-SCHEMA", "category": "unknown-kind", "instancePath": "", "kind": name})
			} else {
				if schemas == nil {
					return nil, errors.New("schema unavailable")
				}
				issues, err = schemas.ValidateValue(name, value)
				if err != nil {
					return nil, err
				}
				for _, issue := range issues {
					issue["kind"] = name
				}
			}
		}
	case "discovery":
		inputs, err := NewLocalInputs(root)
		if err != nil {
			return nil, err
		}
		selected, err := inputs.Path(text(input["root"]))
		inputs.Close()
		if err != nil {
			return nil, err
		}
		selection := Selection{Root: selected}
		args := array(input["args"])
		if len(args)%2 != 0 {
			return nil, errors.New("invalid selection")
		}
		for index := 0; index < len(args); index += 2 {
			value, ok := args[index+1].(string)
			if !ok {
				return nil, errors.New("invalid selection")
			}
			switch args[index] {
			case "--project":
				if selection.Project != nil {
					return nil, errors.New("duplicate selection")
				}
				selection.Project = &value
			case "--file":
				selection.Files = append(selection.Files, value)
			default:
				return nil, errors.New("invalid selection")
			}
		}
		assembly := Discover(selection)
		for _, issue := range assembly.Diagnostics {
			issues = append(issues, map[string]any{"code": issue["code"]})
		}
		if len(issues) == 0 {
			result["documentCount"] = len(assembly.Documents)
			ids := []string{}
			for _, document := range assembly.Documents {
				if document.Kind == "Workflow" {
					ids = append(ids, text(object(document.Value["workflow"])["id"]))
				}
			}
			sort.Strings(ids)
			result["workflowIds"] = ids
		}
	case "semantic-fragment", "workflow-namespace", "artifact-namespace":
		result["valid"] = nil
		result["status"] = "not-implemented"
		return result, nil
	default:
		return nil, errors.New("unsupported operation")
	}
	result["valid"] = len(issues) == 0
	result["diagnostics"] = issues
	return result, nil
}

func asciiKind(value string) bool {
	for _, char := range value {
		if !(char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
			return false
		}
	}
	return true
}
