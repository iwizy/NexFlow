package candidate

import (
	"encoding/json"
	"errors"
	"github.com/santhosh-tekuri/jsonschema/v6"
	"github.com/santhosh-tekuri/jsonschema/v6/kind"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type deniedLoader struct{}

func (deniedLoader) Load(_ string) (any, error) { return nil, errors.New("unavailable local schema") }

type SchemaEngine struct {
	validators map[string]*jsonschema.Schema
	fields     map[string]bool
}

func collectFields(value any, fields map[string]bool) {
	switch value := value.(type) {
	case map[string]any:
		for name := range object(value["properties"]) {
			fields[name] = true
		}
		for _, child := range value {
			collectFields(child, fields)
		}
	case []any:
		for _, child := range value {
			collectFields(child, fields)
		}
	}
}
func schemaCompiler(schemas []any) (*jsonschema.Compiler, error) {
	compiler := jsonschema.NewCompiler()
	compiler.DefaultDraft(jsonschema.Draft2020)
	compiler.AssertFormat()
	compiler.UseLoader(deniedLoader{})
	ids := map[string]bool{}
	for _, resource := range schemas {
		schema := object(resource)
		id := text(schema["$id"])
		if id == "" || ids[id] || schema["$schema"] != "https://json-schema.org/draft/2020-12/schema" {
			return nil, errors.New("invalid local dialect/resource")
		}
		ids[id] = true
		if err := compiler.AddResource(id, resource); err != nil {
			return nil, errors.New("invalid local schema")
		}
	}
	return compiler, nil
}
func NewSchemaEngine(schemas []any) (*SchemaEngine, error) {
	compiler, err := schemaCompiler(schemas)
	if err != nil {
		return nil, err
	}
	engine := &SchemaEngine{map[string]*jsonschema.Schema{}, map[string]bool{}}
	for _, resource := range schemas {
		schema := object(resource)
		collectFields(schema, engine.fields)
		name := text(object(object(schema["properties"])["kind"])["const"])
		if _, known := kinds[name]; known {
			if engine.validators[name] != nil {
				return nil, errors.New("duplicate schema kind")
			}
			validator, err := compiler.Compile(text(schema["$id"]))
			if err != nil {
				return nil, errors.New("local schema unavailable")
			}
			engine.validators[name] = validator
		}
	}
	if len(engine.validators) != 17 {
		return nil, errors.New("incomplete local schema set")
	}
	return engine, nil
}
func RepositorySchemas(directory string) (*SchemaEngine, error) {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return nil, errors.New("local schema unavailable")
	}
	schemas := []any{}
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".schema.json") {
			continue
		}
		path := filepath.Join(directory, entry.Name())
		info, err := os.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() > 1024*1024 {
			return nil, errors.New("local schema unavailable")
		}
		file, err := os.Open(path)
		if err != nil {
			return nil, errors.New("local schema unavailable")
		}
		bytes, err := io.ReadAll(io.LimitReader(file, 1024*1024+1))
		file.Close()
		if err != nil || len(bytes) > 1024*1024 {
			return nil, errors.New("local schema unavailable")
		}
		var schema any
		reader := json.NewDecoder(strings.NewReader(string(bytes)))
		reader.UseNumber()
		if err := reader.Decode(&schema); err != nil {
			return nil, errors.New("invalid schema JSON")
		}
		var extra any
		if err := reader.Decode(&extra); err != io.EOF {
			return nil, errors.New("invalid schema JSON")
		}
		schemas = append(schemas, schema)
	}
	return NewSchemaEngine(schemas)
}

// ExecutableSchemas anchors the CLI to its reviewed checkout, never selected inputs.
func ExecutableSchemas() (*SchemaEngine, error) {
	executable, err := os.Executable()
	if err != nil {
		return nil, errors.New("schema anchor unavailable")
	}
	executable, err = filepath.EvalSymlinks(executable)
	if err != nil {
		return nil, errors.New("schema anchor unavailable")
	}
	return RepositorySchemas(filepath.Join(filepath.Dir(executable), "../../../..", "schemas"))
}
func normalizedPath(parts []string, fields map[string]bool) string {
	path := ""
	for _, part := range parts {
		_, err := strconv.ParseUint(part, 10, 64)
		if !fields[part] && err != nil {
			part = "<redacted>"
		}
		path += ptr(part)
	}
	if len(path) > 512 {
		return "<redacted-field>"
	}
	return path
}
func schemaIssues(schema *jsonschema.Schema, value any, fields map[string]bool) []map[string]any {
	err := schema.Validate(value)
	if err == nil {
		return []map[string]any{}
	}
	var validation *jsonschema.ValidationError
	if !errors.As(err, &validation) {
		return []map[string]any{{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}}
	}
	issues := []map[string]any{}
	var visit func(*jsonschema.ValidationError)
	visit = func(error *jsonschema.ValidationError) {
		if len(issues) >= 201 {
			return
		}
		if len(error.Causes) > 0 {
			for _, cause := range error.Causes {
				visit(cause)
			}
			return
		}
		category := ""
		keyword := error.ErrorKind.KeywordPath()
		if len(keyword) > 0 {
			category = keyword[len(keyword)-1]
		}
		path := normalizedPath(error.InstanceLocation, fields)
		if required, ok := error.ErrorKind.(*kind.Required); ok {
			for _, missing := range required.Missing {
				if !fields[missing] {
					missing = "<redacted>"
				}
				issues = append(issues, map[string]any{"code": "NF-SCHEMA", "category": "required", "instancePath": path, "missingProperty": missing})
				if len(issues) >= 201 {
					break
				}
			}
			return
		}
		issue := map[string]any{"code": "NF-SCHEMA", "category": category, "instancePath": path}
		if _, isFalse := error.ErrorKind.(*kind.FalseSchema); isFalse && strings.HasSuffix(error.SchemaURL, "/items") {
			issue["nativeDiagnostic"] = map[string]any{"category": category, "instancePath": path}
			issue["category"] = "items"
			if index := strings.LastIndex(path, "/"); index >= 0 {
				issue["instancePath"] = path[:index]
			}
		}
		issues = append(issues, issue)
	}
	visit(validation)
	ordered(issues, "instancePath", "category", "missingProperty")
	return issues
}
func (engine *SchemaEngine) ValidateValue(name string, value any) ([]map[string]any, error) {
	schema := engine.validators[name]
	if schema == nil {
		return nil, errors.New("unknown schema kind")
	}
	return schemaIssues(schema, value, engine.fields), nil
}
func (engine *SchemaEngine) Validate(document Manifest) []map[string]any {
	issues, err := engine.ValidateValue(document.Kind, document.Value)
	if err != nil {
		return []map[string]any{Diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", nil, nil, nil, nil)}
	}
	out := []map[string]any{}
	for _, issue := range issues {
		path := text(issue["instancePath"])
		if missing, ok := issue["missingProperty"].(string); ok {
			path += ptr(missing)
		}
		out = append(out, Diagnostic("NF-SCHEMA", document.File, document.Kind, path, issue["category"]))
	}
	return out
}
func ValidateLocal(schemas []any, id string, value any) []map[string]any {
	compiler, err := schemaCompiler(schemas)
	if err != nil {
		return []map[string]any{{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}}
	}
	schema, err := compiler.Compile(id)
	if err != nil {
		return []map[string]any{{"code": "NF-SCHEMA", "category": "unresolved-local-schema"}}
	}
	fields := map[string]bool{}
	for _, resource := range schemas {
		collectFields(resource, fields)
	}
	return schemaIssues(schema, value, fields)
}
