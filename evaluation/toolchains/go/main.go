package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/santhosh-tekuri/jsonschema/v6"
	"go.yaml.in/yaml/v3"
)

type deniedLoader struct{}

func (deniedLoader) Load(url string) (any, error) { return nil, errors.New("unavailable local schema") }

func yamlValue(node *yaml.Node) (any, error) {
	switch node.Kind {
	case yaml.DocumentNode:
		if len(node.Content) != 1 {
			return nil, errors.New("one document required")
		}
		return yamlValue(node.Content[0])
	case yaml.MappingNode:
		result := map[string]any{}
		for i := 0; i < len(node.Content); i += 2 {
			key := node.Content[i]
			if key.Tag != "!!str" {
				return nil, errors.New("string key required")
			}
			if _, exists := result[key.Value]; exists {
				return nil, errors.New("duplicate key")
			}
			value, err := yamlValue(node.Content[i+1])
			if err != nil {
				return nil, err
			}
			result[key.Value] = value
		}
		return result, nil
	case yaml.SequenceNode:
		result := []any{}
		for _, child := range node.Content {
			value, err := yamlValue(child)
			if err != nil {
				return nil, err
			}
			result = append(result, value)
		}
		return result, nil
	case yaml.ScalarNode:
		if node.Tag == "!!timestamp" {
			return node.Value, nil
		}
		var value any
		if err := node.Decode(&value); err != nil {
			return nil, err
		}
		return value, nil
	default:
		return nil, errors.New("unsupported YAML node")
	}
}

func diagnostics(err *jsonschema.ValidationError) []any {
	if len(err.Causes) > 0 {
		result := []any{}
		for _, cause := range err.Causes {
			result = append(result, diagnostics(cause)...)
		}
		return result
	}
	path := ""
	for _, part := range err.InstanceLocation {
		path += "/" + strings.ReplaceAll(strings.ReplaceAll(part, "~", "~0"), "/", "~1")
	}
	keyword := ""
	location := err.ErrorKind.KeywordPath()
	if len(location) > 0 {
		keyword = location[len(location)-1]
	}
	return []any{map[string]any{"category": "schema", "path": path, "keyword": keyword}}
}

func main() {
	bytes, err := os.ReadFile(os.Args[1])
	if err != nil {
		panic(err)
	}
	var packet struct {
		Scope     string           `json:"scope"`
		Resources map[string]any   `json:"resources"`
		Cases     []map[string]any `json:"cases"`
	}
	if err := json.Unmarshal(bytes, &packet); err != nil {
		panic(err)
	}
	results := []any{}
	for _, entry := range packet.Cases {
		result := map[string]any{"id": entry["id"], "diagnostics": []any{}}
		if entry["operation"] == "yaml" {
			var document yaml.Node
			err := yaml.Unmarshal([]byte(entry["text"].(string)), &document)
			var value any
			if err == nil {
				value, err = yamlValue(&document)
			}
			result["valid"] = err == nil
			if err == nil {
				result["value"] = value
			} else {
				result["diagnostics"] = []any{map[string]any{"category": "yaml", "path": "", "keyword": "parse"}}
			}
		} else {
			compiler := jsonschema.NewCompiler()
			compiler.DefaultDraft(jsonschema.Draft2020)
			compiler.AssertFormat()
			compiler.UseLoader(deniedLoader{})
			for uri, resource := range packet.Resources {
				if err := compiler.AddResource(uri, resource); err != nil {
					panic(err)
				}
			}
			const uri = "https://nexflow.test/toolchains/root.json"
			if err := compiler.AddResource(uri, entry["schema"]); err != nil {
				panic(err)
			}
			schema, err := compiler.Compile(uri)
			if err != nil {
				var loadError *jsonschema.LoadURLError
				if !errors.As(err, &loadError) || loadError.Err.Error() != "unavailable local schema" {
					panic(err)
				}
				result["valid"] = false
				result["unresolvedReference"] = true
				result["diagnostics"] = []any{map[string]any{"category": "reference", "path": "", "keyword": "$ref"}}
			} else {
				err := schema.Validate(entry["instance"])
				result["valid"] = err == nil
				if err != nil {
					validation, ok := err.(*jsonschema.ValidationError)
					if !ok {
						panic(err)
					}
					result["diagnostics"] = diagnostics(validation)
				}
			}
		}
		results = append(results, result)
	}
	output, err := json.Marshal(map[string]any{"candidate": "go", "scope": packet.Scope, "results": results})
	if err != nil {
		panic(err)
	}
	fmt.Println(string(output))
}
