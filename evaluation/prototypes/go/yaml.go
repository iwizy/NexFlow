package candidate

import (
	"encoding/json"
	"errors"
	"go.yaml.in/yaml/v3"
	"io"
	"strings"
	"unicode/utf8"
)

var errDuplicate = errors.New("duplicate-key")
var errSyntax = errors.New("syntax")

// ParseYAML enforces one bounded JSON-compatible document, without alias expansion.
func ParseYAML(text string) (any, error) {
	if len(text) > 1024*1024 || !utf8.ValidString(text) {
		return nil, errSyntax
	}
	decoder := yaml.NewDecoder(strings.NewReader(text))
	var document yaml.Node
	if err := decoder.Decode(&document); err != nil {
		return nil, errSyntax
	}
	var extra yaml.Node
	if err := decoder.Decode(&extra); err != io.EOF {
		return nil, errSyntax
	}
	visits := 0
	var convert func(*yaml.Node, int) (any, error)
	convert = func(node *yaml.Node, depth int) (any, error) {
		visits++
		if depth > 100 || visits > 200000 || node.Style&yaml.TaggedStyle != 0 {
			return nil, errSyntax
		}
		switch node.Kind {
		case yaml.DocumentNode:
			if len(node.Content) != 1 {
				return nil, errSyntax
			}
			return convert(node.Content[0], depth)
		case yaml.MappingNode:
			if node.Tag != "!!map" || len(node.Content)%2 != 0 {
				return nil, errSyntax
			}
			value := map[string]any{}
			for index := 0; index < len(node.Content); index += 2 {
				key := node.Content[index]
				visits++
				if visits > 200000 || key.Kind != yaml.ScalarNode || key.Tag != "!!str" || key.Style&yaml.TaggedStyle != 0 {
					return nil, errSyntax
				}
				if _, exists := value[key.Value]; exists {
					return nil, errDuplicate
				}
				child, err := convert(node.Content[index+1], depth+1)
				if err != nil {
					return nil, err
				}
				value[key.Value] = child
			}
			return value, nil
		case yaml.SequenceNode:
			if node.Tag != "!!seq" {
				return nil, errSyntax
			}
			value := []any{}
			for _, child := range node.Content {
				result, err := convert(child, depth+1)
				if err != nil {
					return nil, err
				}
				value = append(value, result)
			}
			return value, nil
		case yaml.ScalarNode:
			if node.Tag == "!!str" || node.Tag == "!!timestamp" {
				return node.Value, nil
			}
			if node.Tag != "!!null" && node.Tag != "!!bool" && node.Tag != "!!int" && node.Tag != "!!float" {
				return nil, errSyntax
			}
			var value any
			if err := node.Decode(&value); err != nil {
				return nil, errSyntax
			}
			bytes, err := json.Marshal(value)
			if err != nil {
				return nil, errSyntax
			}
			reader := json.NewDecoder(strings.NewReader(string(bytes)))
			reader.UseNumber()
			if err := reader.Decode(&value); err != nil {
				return nil, errSyntax
			}
			return value, nil
		default:
			return nil, errSyntax
		}
	}
	return convert(&document, 0)
}
