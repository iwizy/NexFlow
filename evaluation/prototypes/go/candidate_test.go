package candidate

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func writeFixture(t *testing.T, directory, name, value string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(directory, name), []byte(value), 0600); err != nil {
		t.Fatal(err)
	}
}
func projectYAML(extra string) string {
	return "specVersion: '0.1'\nkind: Project\nmetadata:\n  project: sample\nproject:\n  id: sample\n" + extra
}
func hasCode(assembly Assembly, code string) bool {
	for _, item := range assembly.Diagnostics {
		if item["code"] == code {
			return true
		}
	}
	return false
}
func repositoryEngine(t *testing.T) *SchemaEngine {
	t.Helper()
	engine, err := RepositorySchemas("../../../schemas")
	if err != nil {
		t.Fatal(err)
	}
	return engine
}

func TestSafeLocators(t *testing.T) {
	for _, value := range []string{"", "../secret.yaml", "/secret.yaml", "a/../b.yaml", "a//b.yaml", "https://example.test/a.yaml", "C:\\a.yaml", "a\n.yaml", strings.Repeat("a", 513)} {
		if SafeLocator(value) != "<redacted-source>" {
			t.Fatalf("unsafe locator accepted: %q", value)
		}
	}
	if SafeLocator("nested/project.yaml") != "nested/project.yaml" {
		t.Fatal("safe locator rejected")
	}
}
func TestDisplayIdentifiers(t *testing.T) {
	for _, value := range []string{"", "Secret", "a..b", "a-", "https://example.test", "a\n", "a/secret"} {
		if DisplayID(value) != "<redacted-id>" {
			t.Fatal("unsafe display id")
		}
	}
	if DisplayID("sample-1_name.v2") != "sample-1_name.v2" {
		t.Fatal("valid id rejected")
	}
}
func TestYAMLDuplicates(t *testing.T) {
	for _, source := range []string{"a: 1\na: 2\n", "outer:\n  a: 1\n  a: 2\n", "\"a\": 1\na: 2\n"} {
		if _, err := ParseYAML(source); !errors.Is(err, errDuplicate) {
			t.Fatal("duplicate key not classified")
		}
	}
}
func TestYAMLRejectedForms(t *testing.T) {
	for _, source := range []string{"", "a: 1\n---\nb: 2\n", "a: &x 1\nb: *x\n", "a: !custom value\n", "a: !!str value\n", "? [a, b]\n: x\n", "1: x\n", "a: .inf\n", "a: [\n", string([]byte{0xff}), "a: " + strings.Repeat("x", 1024*1024)} {
		if _, err := ParseYAML(source); err == nil {
			t.Fatal("unsupported YAML accepted")
		}
	}
}
func TestYAMLDepthLimit(t *testing.T) {
	if _, err := ParseYAML(strings.Repeat("[", 102) + "0" + strings.Repeat("]", 102)); err == nil {
		t.Fatal("deep document accepted")
	}
}
func TestYAMLNodeLimit(t *testing.T) {
	if _, err := ParseYAML("[" + strings.Repeat("0,", 200001) + "0]"); err == nil {
		t.Fatal("node budget exceeded")
	}
}
func TestYAMLScalars(t *testing.T) {
	value, err := ParseYAML("name: sample\nwhen: 2026-10-03\nnumber: 12\nflag: true\nempty: null\n")
	if err != nil {
		t.Fatal(err)
	}
	item := object(value)
	if item["when"] != "2026-10-03" || item["number"] != json.Number("12") || item["flag"] != true || item["empty"] != nil {
		t.Fatal("JSON-compatible scalar conversion")
	}
}
func TestRootAndReadLimits(t *testing.T) {
	root := t.TempDir()
	writeFixture(t, root, "small.yaml", "a: 1\n")
	writeFixture(t, root, "large.yaml", strings.Repeat("x", 1024*1024+1))
	writeFixture(t, root, "bad.yaml", string([]byte{0xff}))
	writeFixture(t, root, "source.json", "{}")
	inputs, err := NewLocalInputs(root)
	if err != nil {
		t.Fatal(err)
	}
	defer inputs.Close()
	if value, err := inputs.Read("small.yaml"); err != nil || value != "a: 1\n" {
		t.Fatal("regular read failed")
	}
	for _, name := range []string{"../outside.yaml", "large.yaml", "bad.yaml", "source.json", "missing.yaml"} {
		if _, err := inputs.Read(name); err == nil {
			t.Fatal("unsafe read accepted")
		}
	}
	if _, err := NewLocalInputs(filepath.Join(root, "small.yaml")); err == nil {
		t.Fatal("non-directory root")
	}
	if _, err := NewLocalInputs(""); err == nil {
		t.Fatal("implicit root")
	}
}
func TestSymlinkRejection(t *testing.T) {
	root, outside := t.TempDir(), t.TempDir()
	writeFixture(t, outside, "outside.yaml", "token: never-print-this\n")
	if err := os.Symlink(outside, filepath.Join(root, "link")); err != nil {
		t.Skip("symlink creation unavailable")
	}
	if err := os.Symlink(filepath.Join(outside, "outside.yaml"), filepath.Join(root, "link.yaml")); err != nil {
		t.Fatal(err)
	}
	inputs, err := NewLocalInputs(root)
	if err != nil {
		t.Fatal(err)
	}
	defer inputs.Close()
	for _, locator := range []string{"link/outside.yaml", "link.yaml"} {
		if _, err := inputs.Read(locator); err == nil {
			t.Fatal("symlink read accepted")
		}
	}
}
func TestDiscoveryNoRecursiveScan(t *testing.T) {
	root := t.TempDir()
	writeFixture(t, root, "project.yaml", projectYAML(""))
	writeFixture(t, root, "unused.yaml", "invalid: [")
	assembly := Discover(Selection{Root: root})
	if len(assembly.Diagnostics) != 0 || len(assembly.Documents) != 1 {
		t.Fatal("unselected files were scanned")
	}
}
func TestDiscoveryDuplicates(t *testing.T) {
	root := t.TempDir()
	writeFixture(t, root, "project.yaml", projectYAML(""))
	writeFixture(t, root, "project.yml", projectYAML(""))
	if !hasCode(Discover(Selection{Root: root}), "NF-DISCOVERY-MULTIPLE-PROJECTS") {
		t.Fatal("multiple projects")
	}
	if !hasCode(Discover(Selection{Root: root, Files: []string{"project.yaml", "project.yaml"}}), "NF-DISCOVERY-DUPLICATE-SOURCE") {
		t.Fatal("duplicate explicit input")
	}
}
func TestDiscoveryHintsFailClosed(t *testing.T) {
	for _, extra := range []string{"manifests:\n  workflow: workflow.yaml\n  workflows: null\n", "manifests:\n  tasks: ../outside.yaml\n", "manifests:\n  executable: anything.yaml\n"} {
		root := t.TempDir()
		writeFixture(t, root, "project.yaml", projectYAML(extra))
		if len(Discover(Selection{Root: root}).Diagnostics) == 0 {
			t.Fatal("bad hints accepted")
		}
	}
}
func TestDiscoveryFileBudget(t *testing.T) {
	root := t.TempDir()
	files := make([]string, 129)
	if !hasCode(Discover(Selection{Root: root, Files: files}), "NF-DISCOVERY-UNSAFE-SOURCE") {
		t.Fatal("unbounded input selection")
	}
}
func TestLocalSchemaDialectAndLoader(t *testing.T) {
	base := map[string]any{"$id": "https://local.test/root", "$schema": "https://json-schema.org/draft/2020-12/schema", "$ref": "https://unavailable.test/secret"}
	issues := ValidateLocal([]any{base}, "https://local.test/root", map[string]any{})
	if len(issues) != 1 || issues[0]["category"] != "unresolved-local-schema" {
		t.Fatal("non-local reference accepted")
	}
	base["$schema"] = "http://json-schema.org/draft-07/schema#"
	if ValidateLocal([]any{base}, "https://local.test/root", nil)[0]["category"] != "unresolved-local-schema" {
		t.Fatal("wrong dialect accepted")
	}
}
func TestLocalSchemaItemsNativeObservation(t *testing.T) {
	schema := map[string]any{"$id": "https://local.test/root", "$schema": "https://json-schema.org/draft/2020-12/schema", "prefixItems": []any{map[string]any{"type": "string"}}, "items": false}
	issues := ValidateLocal([]any{schema}, "https://local.test/root", []any{"ok", "extra"})
	if len(issues) != 1 || issues[0]["category"] != "items" || issues[0]["instancePath"] != "" || issues[0]["nativeDiagnostic"] == nil {
		t.Fatal("lost native diagnostic/category")
	}
}
func TestSchemaInventoryAndDiagnosticRedaction(t *testing.T) {
	engine := repositoryEngine(t)
	value, err := ParseYAML(projectYAML("secret-do-not-print: true\n"))
	if err != nil {
		t.Fatal(err)
	}
	issues, err := engine.ValidateValue("Project", value)
	if err != nil || len(issues) == 0 {
		t.Fatal("invalid manifest accepted")
	}
	encoded, _ := json.Marshal(issues)
	if bytes.Contains(encoded, []byte("secret-do-not-print")) {
		t.Fatal("raw field leaked")
	}
	if _, err := NewSchemaEngine([]any{}); err == nil {
		t.Fatal("incomplete schema registry accepted")
	}
}
func TestSchemaJSONTrailingInput(t *testing.T) {
	root := t.TempDir()
	writeFixture(t, root, "a.schema.json", "{} {}")
	if _, err := RepositorySchemas(root); err == nil {
		t.Fatal("trailing JSON accepted")
	}
}
func TestArgumentBoundaries(t *testing.T) {
	for _, args := range [][]string{{}, {"run", "--root", "missing"}, {"validate"}, {"validate", "--root", "x", "--root", "y"}, {"validate", "--root", "x", "--project", "x.yaml", "--file", "y.yaml"}, {"validate", "--root", "x", "--format", "xml"}, {"validate", "--root", "x", "--provider", "anything"}, {"validate", "--root", "x", "--file="}, {"validate", "--root", "x", "--"}} {
		if _, _, _, err := ParseArguments(args); err == nil {
			t.Fatal("unsupported arguments accepted")
		}
	}
	command, selection, requested, err := ParseArguments([]string{"inspect", "--root=x", "--file=a.yaml", "--file", "b.yaml", "--format=json"})
	if err != nil || command != "inspect" || selection.Root != "x" || len(selection.Files) != 2 || !requested {
		t.Fatal("valid command rejected")
	}
	if JSONRequested([]string{"validate", "--root", "--format=json"}) {
		t.Fatal("option value treated as format option")
	}
}
func TestUnsupportedCommandBeforeInputs(t *testing.T) {
	result := Evaluate("run", Selection{Root: "not-present"}, nil)
	if result["exitCode"] != 2 || object(result["checks"])["discovery"] != "not-run" {
		t.Fatal("unsupported command accessed input")
	}
}
func TestLibraryNativeSemanticsDoNotExecute(t *testing.T) {
	for _, operation := range []string{"semantic-fragment", "workflow-namespace", "artifact-namespace"} {
		result, err := EvaluateLibraryCase(map[string]any{"id": "test", "operation": operation}, "not-present", nil)
		if err != nil || result["status"] != nil || result["valid"] != true {
			t.Fatal("native empty fragment result missing")
		}
	}
}
func TestEvaluationDeterminismAndNoMutation(t *testing.T) {
	engine := repositoryEngine(t)
	selection := Selection{Root: "../../../examples/minimal-team"}
	first := Evaluate("inspect", selection, engine)
	second := Evaluate("inspect", selection, engine)
	if !reflect.DeepEqual(first, second) || first["executionAuthorized"] != false {
		t.Fatal("nondeterministic or authorized result")
	}
	checks := object(first["checks"])
	for _, name := range []string{"semantic", "coreProfile", "extensionProfiles"} {
		if checks[name] != "not-run" {
			t.Fatal("unauthorized checks")
		}
	}
	if first["exitCode"] != 0 {
		t.Fatalf("reviewed fixture failed: %v", first["diagnostics"])
	}
}
func TestInspectionLimit(t *testing.T) {
	items := []any{}
	for index := 0; index < 1001; index++ {
		items = append(items, map[string]any{"id": "sample"})
	}
	if _, err := Inspect([]Manifest{{"tasks.yaml", "TaskSet", map[string]any{"tasks": items}}}); err == nil {
		t.Fatal("unbounded inspection")
	}
}
func TestUnavailableSchemaSuppressesInspection(t *testing.T) {
	root := t.TempDir()
	writeFixture(t, root, "project.yaml", projectYAML(""))
	result := Evaluate("inspect", Selection{Root: root}, nil)
	if result["exitCode"] != 4 || result["result"] != nil || result["success"] != false {
		t.Fatal("fail-open schema setup")
	}
}
