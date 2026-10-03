package candidate

import (
	"errors"
	"flag"
	"io"
	"strings"
)

type repeatedFiles []string

func (value *repeatedFiles) String() string        { return "" }
func (value *repeatedFiles) Set(file string) error { *value = append(*value, file); return nil }

// ParseArguments has no manifest reads, process exits or printed diagnostics.
func ParseArguments(arguments []string) (string, Selection, bool, error) {
	failure := errors.New("unsupported command or options")
	if len(arguments) == 0 || (arguments[0] != "validate" && arguments[0] != "inspect") {
		return "", Selection{}, false, failure
	}
	seen := map[string]bool{}
	for index := 1; index < len(arguments); {
		token := arguments[index]
		name, _, equal := strings.Cut(token, "=")
		if name != "--root" && name != "--project" && name != "--file" && name != "--format" {
			return "", Selection{}, false, failure
		}
		if name != "--file" && seen[name] {
			return "", Selection{}, false, failure
		}
		seen[name] = true
		index++
		if !equal {
			if index >= len(arguments) {
				return "", Selection{}, false, failure
			}
			index++
		}
	}
	parser := flag.NewFlagSet("local-validation", flag.ContinueOnError)
	parser.SetOutput(io.Discard)
	root := parser.String("root", "", "")
	project := parser.String("project", "", "")
	format := parser.String("format", "text", "")
	var files repeatedFiles
	parser.Var(&files, "file", "")
	if err := parser.Parse(arguments[1:]); err != nil || parser.NArg() != 0 || *root == "" || (*format != "json" && *format != "text") || seen["--project"] && (*project == "" || files != nil) {
		return "", Selection{}, false, failure
	}
	for _, file := range files {
		if file == "" {
			return "", Selection{}, false, failure
		}
	}
	selection := Selection{Root: *root, Files: files}
	if seen["--project"] {
		selection.Project = project
	}
	return arguments[0], selection, *format == "json", nil
}
func JSONRequested(arguments []string) bool {
	for index := 0; index < len(arguments); {
		token := arguments[index]
		if token == "--" {
			break
		}
		if token == "--format=json" || token == "--format" && index+1 < len(arguments) && arguments[index+1] == "json" {
			return true
		}
		index++
		if token == "--root" || token == "--project" || token == "--file" || token == "--format" {
			index++
		}
	}
	return false
}
