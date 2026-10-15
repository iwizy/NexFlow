package candidate

import "errors"

// EvaluatePublicLibraryCase is a versioned data boundary, not the native-detail channel.
func EvaluatePublicLibraryCase(entry map[string]any, root string, schemas *SchemaEngine) (map[string]any, error) {
	native, err := EvaluateLibraryCase(entry, root, schemas)
	if err != nil {
		return nil, err
	}
	operation, input := text(entry["operation"]), object(entry["input"])
	issues := native["diagnostics"].([]map[string]any)
	if operation == "local-schema" {
		issues = ValidateLocalPublic(array(input["schemas"]), text(input["entryId"]), input["value"])
	}
	if operation == "manifest-schema" {
		inputs, err := NewLocalInputs(root)
		if err != nil {
			return nil, err
		}
		data, err := inputs.Read(text(input["file"]))
		inputs.Close()
		if err != nil {
			return nil, err
		}
		value, err := ParseYAML(data)
		name := text(object(value)["kind"])
		if _, known := kinds[name]; err == nil && known {
			issues = schemas.Validate(Manifest{text(input["file"]), name, object(value)})
		}
	}
	diagnostics := []map[string]any{}
	for _, issue := range issues {
		category := issue["category"]
		if keyword, found := issue["keyword"]; found {
			category = keyword
		}
		code := issue["code"]
		if code == nil {
			code = "NF-DISCOVERY-UNSAFE-SOURCE"
		}
		location := issue["instancePath"]
		if value, found := issue["path"]; found {
			location = value
		}
		if missing, found := issue["missingProperty"].(string); found {
			location = text(location) + ptr(missing)
		}
		context := map[string]any{}
		for _, key := range []string{"kind", "sourceKind", "targetNamespace", "targetId"} {
			if value, ok := issue[key].(string); ok {
				context[key] = value
			}
		}
		meaningCategory := text(category)
		if category == nil {
			meaningCategory = "not-emitted"
		}
		d := map[string]any{"severity": "error", "code": code, "category": category, "path": location, "meaning": operation + ":" + text(code) + ":" + meaningCategory, "context": context}
		diagnostics = append(diagnostics, d)
	}
	// Explicit common tuple; no native error prose, native detail or arbitrary fields.
	for _, d := range diagnostics {
		c := object(d["context"])
		d["sortContext"] = text(c["kind"]) + "\x00" + text(c["sourceKind"]) + "\x00" + text(c["targetNamespace"]) + "\x00" + text(c["targetId"])
	}
	ordered(diagnostics, "path", "severity", "code", "category", "meaning", "sortContext")
	for _, d := range diagnostics {
		delete(d, "sortContext")
	}
	if native["valid"] != (len(diagnostics) == 0) {
		return nil, errors.New("inconsistent validation result")
	}
	truncated := len(diagnostics) > 200
	if truncated {
		diagnostics = diagnostics[:200]
	}
	var result any
	if count, ok := native["documentCount"]; native["valid"] == true && ok {
		ids, ok := native["workflowIds"].([]string)
		if !ok {
			return nil, errors.New("invalid workflow ids")
		}
		redacted := []string{}
		for _, id := range ids {
			redacted = append(redacted, DisplayID(id))
		}
		result = map[string]any{"documentCount": count, "workflowIds": redacted}
	}
	return map[string]any{"contractVersion": "nf-validation-diagnostics-v1", "caseId": DisplayID(native["caseId"]), "operation": operation, "valid": native["valid"],
		"diagnostics": diagnostics, "truncated": truncated, "executionAuthorized": false, "checks": map[string]any{"runtime": "not-run", "extensions": "not-run"}, "result": result}, nil
}
