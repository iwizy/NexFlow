// Package candidate is a disposable validation-only source experiment.
package candidate

import (
	"encoding/json"
	"sort"
	"strings"
	"unicode"
)

type Selection struct {
	Root    string
	Project *string
	Files   []string
}
type Manifest struct {
	File, Kind string
	Value      map[string]any
}
type kindInfo struct{ field, namespace, idField string }

var kinds = map[string]kindInfo{
	"Project": {"project", "project", "id"}, "ActorSet": {"actors", "actor", "id"},
	"AgentSet": {"agents", "agent", "id"}, "AgentDefinitionSet": {"agentDefinitions", "agent-definition", "id"},
	"CapabilitySet": {"capabilities", "capability", "id"}, "PermissionSet": {"permissions", "permission", "id"},
	"TaskSet": {"tasks", "task", "id"}, "Workflow": {"workflow", "workflow", "id"},
	"HandoffSet": {"handoffs", "handoff", "id"}, "ContextSet": {"contextSources", "context-source", "id"},
	"MemorySet": {"memoryScopes", "memory-scope", "scope"}, "ProviderSet": {"providers", "provider", "id"},
	"ModelProfileSet": {"modelProfiles", "model-profile", "id"}, "PromptSet": {"promptSets", "prompt-set", "id"},
	"RetrievalProfileSet": {"retrievalProfiles", "retrieval-profile", "id"}, "EventSet": {"events", "event", "type"},
	"ExtensionSet": {"extensions", "extension", "id"},
}

func object(value any) map[string]any {
	result, ok := value.(map[string]any)
	if !ok {
		return map[string]any{}
	}
	return result
}
func array(value any) []any {
	result, ok := value.([]any)
	if !ok {
		return []any{}
	}
	return result
}
func text(value any) string { result, _ := value.(string); return result }
func ptr(part string) string {
	return "/" + strings.ReplaceAll(strings.ReplaceAll(part, "~", "~0"), "/", "~1")
}
func SafeLocator(value string) string {
	if value == "" || len(value) > 512 || strings.HasPrefix(value, "/") || strings.ContainsAny(value, ":\\") || strings.ContainsFunc(value, unicode.IsControl) {
		return "<redacted-source>"
	}
	for _, part := range strings.Split(value, "/") {
		if part == "" || part == "." || part == ".." {
			return "<redacted-source>"
		}
	}
	return value
}
func DisplayID(value any) string {
	id := text(value)
	if len(id) == 0 || len(id) > 128 || id[0] < 'a' || id[0] > 'z' {
		return "<redacted-id>"
	}
	for _, part := range strings.FieldsFunc(id, func(r rune) bool { return r == '-' || r == '_' || r == '.' }) {
		for _, c := range part {
			if !(c >= 'a' && c <= 'z' || c >= '0' && c <= '9') {
				return "<redacted-id>"
			}
		}
	}
	if strings.ContainsAny(id[len(id)-1:], "-_.") || strings.ContainsAny(id[:1], "-_.") {
		return "<redacted-id>"
	}
	for index := 1; index < len(id); index++ {
		if strings.ContainsRune("-_.", rune(id[index])) && strings.ContainsRune("-_.", rune(id[index-1])) {
			return "<redacted-id>"
		}
	}
	return id
}
func Diagnostic(code string, file, kind, path, keyword any) map[string]any {
	message := "Selected manifest input does not satisfy discovery policy."
	switch code {
	case "NF-SCHEMA":
		message = "Local schema constraint is not satisfied."
	case "NEXFLOW-PROTOTYPE-USAGE":
		message = "Only validate or inspect with an explicit root and supported options are accepted."
	case "NEXFLOW-PROTOTYPE-INTERNAL":
		message = "The reviewed local validation setup could not produce a result."
	case "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT":
		message = "Declared inspection exceeds its fixed budget."
	}
	if file != nil && file != "<input>" {
		file = SafeLocator(text(file))
	}
	return map[string]any{"severity": "error", "code": code, "message": message, "file": file, "kind": kind, "path": path, "keyword": keyword, "related": []any{}}
}
func ordered(items []map[string]any, fields ...string) {
	sort.SliceStable(items, func(i, j int) bool {
		for _, field := range fields {
			a, b := text(items[i][field]), text(items[j][field])
			if a != b {
				return a < b
			}
		}
		return false
	})
}
func Envelope(command any) map[string]any {
	return map[string]any{"formatVersion": "0.4-draft", "tool": map[string]any{"name": "nexflow-go-evaluation", "version": "unreleased"}, "supportedSpecVersions": []string{"0.1"}, "command": command, "success": false, "exitCode": 1, "inputMode": nil,
		"checks": map[string]any{"discovery": "not-run", "schema": "not-run", "semantic": "not-run", "coreProfile": "not-run", "extensionProfiles": "not-run"}, "executionAuthorized": false, "diagnostics": []map[string]any{}, "truncated": false, "result": nil}
}
func Usage() map[string]any {
	out := Envelope(nil)
	out["exitCode"] = 2
	out["diagnostics"] = []map[string]any{Diagnostic("NEXFLOW-PROTOTYPE-USAGE", nil, nil, nil, nil)}
	return out
}
func JSONLine(value any) ([]byte, error) {
	bytes, err := json.Marshal(value)
	return append(bytes, '\n'), err
}
