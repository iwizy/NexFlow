package candidate

import (
	"errors"
	"sort"
	"strconv"
	"strings"
)

type binding struct{ selector, target string }

var bindings = map[string][]binding{
	"project":           {{"maintainers.*.id", "participant"}},
	"actor":             {{"agentRef.id", "agent"}, {"operatedBy.*.id", "actor"}, {"representedBy.*.id", "actor"}, {"integrationRef.id", "extension"}},
	"agent-definition":  {{"agentRef", "agent"}, {"owner", "participant"}, {"components.modelProfileRef", "model-profile"}, {"components.promptSetRef", "prompt-set"}, {"components.retrievalProfileRef", "retrieval-profile"}, {"components.permissionRefs.*", "permission"}, {"components.capabilityRefs.*", "capability"}, {"components.contextSourceRefs.*", "context-source"}, {"components.memoryScopes.*", "memory-scope"}, {"components.extensionRefs.*", "extension"}},
	"task":              {{"owner", "participant"}, {"participants.*", "participant"}, {"dependsOn.*", "task"}, {"capabilitiesRequired.*", "capability"}, {"approvalGates.*", "approval-gate"}},
	"workflow":          {{"dependencies.*.from", "workflow-step"}, {"dependencies.*.to", "workflow-step"}},
	"workflow-step":     {{"task", "task"}, {"dependsOn.*", "workflow-step"}, {"approvalGates.*", "approval-gate"}, {"emits.*", "event"}},
	"handoff":           {{"from.*", "participant"}, {"to.*", "participant"}, {"artifacts.*", "artifact"}},
	"permission":        {{"subjects.*", "participant"}, {"capabilities.*", "capability"}, {"approvalGate", "approval-gate"}},
	"context-source":    {{"access.allowedActors.*", "participant"}, {"access.deniedActors.*", "participant"}, {"approvalGates.*", "approval-gate"}},
	"memory-scope":      {{"allowedConsumers.*", "participant"}, {"allowedWriters.*", "participant"}, {"allowedSourceScopes.*", "memory-scope"}, {"approvalGate", "approval-gate"}},
	"model-profile":     {{"selection.providerRefs.*", "provider"}, {"selection.pinnedModel.providerRef", "provider"}, {"fallback.candidateProviderRefs.*", "provider"}},
	"prompt-set":        {{"owner", "participant"}},
	"retrieval-profile": {{"owner", "participant"}, {"sources.*.contextSourceRef", "context-source"}, {"excludedSources.*", "context-source"}, {"index.embeddingModelProfileRef", "model-profile"}},
	"extension":         {{"requiredCapabilities.*", "capability"}},
}

func inspectionRow(document Manifest, path, namespace string, value, workflow any) map[string]any {
	if _, ok := value.(string); !ok {
		value = object(value)["id"]
	}
	var scope any
	if namespace == "workflow-stage" || namespace == "workflow-step" {
		scope = map[string]any{"kind": "workflow", "id": DisplayID(workflow)}
	}
	return map[string]any{"file": SafeLocator(document.File), "path": path, "kind": namespace, "id": DisplayID(value), "scope": scope}
}
func visitReference(value any, parts []string, path string, emit func(any, string) error) error {
	if len(parts) == 0 {
		return emit(value, path)
	}
	if parts[0] == "*" {
		for index, child := range array(value) {
			if err := visitReference(child, parts[1:], path+ptr(strconv.Itoa(index)), emit); err != nil {
				return err
			}
		}
	} else if child, exists := object(value)[parts[0]]; exists {
		return visitReference(child, parts[1:], path+ptr(parts[0]), emit)
	}
	return nil
}

// Inspect projects declarations only; it never resolves references or decides policy.
func Inspect(documents []Manifest) (map[string]any, error) {
	resources, references := []map[string]any{}, []map[string]any{}
	counts := map[string]int{}
	documentCounts := map[string]int{}
	limit := errors.New("inspection budget")
	declaration := func(document Manifest, value any, path, namespace, idField string, workflow any) error {
		resources = append(resources, inspectionRow(document, path, namespace, object(value)[idField], workflow))
		counts[document.Kind]++
		if len(resources) > 1000 {
			return limit
		}
		for _, binding := range bindings[namespace] {
			err := visitReference(value, strings.Split(binding.selector, "."), path, func(value any, path string) error {
				references = append(references, inspectionRow(document, path, binding.target, value, workflow))
				if len(references) > 2000 {
					return limit
				}
				return nil
			})
			if err != nil {
				return err
			}
		}
		return nil
	}
	var project *Manifest
	for _, document := range documents {
		info, known := kinds[document.Kind]
		if !known {
			return nil, limit
		}
		documentCounts[document.Kind]++
		workflow := object(document.Value["workflow"])
		workflowID := workflow["id"]
		if document.Kind == "Project" || document.Kind == "Workflow" {
			if err := declaration(document, document.Value[info.field], ptr(info.field), info.namespace, info.idField, workflowID); err != nil {
				return nil, err
			}
		} else {
			for index, value := range array(document.Value[info.field]) {
				if err := declaration(document, value, ptr(info.field)+ptr(strconv.Itoa(index)), info.namespace, info.idField, workflowID); err != nil {
					return nil, err
				}
			}
		}
		if document.Kind == "Project" {
			copy := document
			project = &copy
			for index, value := range array(object(document.Value["project"])["approvalGates"]) {
				if err := declaration(document, value, "/project/approvalGates/"+strconv.Itoa(index), "approval-gate", "id", nil); err != nil {
					return nil, err
				}
			}
		}
		if document.Kind == "TaskSet" {
			for index, task := range array(document.Value["tasks"]) {
				for artifact, value := range array(object(task)["artifacts"]) {
					if err := declaration(document, value, "/tasks/"+strconv.Itoa(index)+"/artifacts/"+strconv.Itoa(artifact), "artifact", "id", nil); err != nil {
						return nil, err
					}
				}
			}
		}
		if document.Kind == "Workflow" {
			for stageIndex, stage := range array(workflow["stages"]) {
				path := "/workflow/stages/" + strconv.Itoa(stageIndex)
				if err := declaration(document, stage, path, "workflow-stage", "id", workflowID); err != nil {
					return nil, err
				}
				for stepIndex, step := range array(object(stage)["steps"]) {
					if err := declaration(document, step, path+"/steps/"+strconv.Itoa(stepIndex), "workflow-step", "id", workflowID); err != nil {
						return nil, err
					}
				}
			}
		}
	}
	if project == nil {
		return nil, limit
	}
	ordered(resources, "file", "path", "kind", "id")
	ordered(references, "file", "path", "kind", "id")
	names := []string{}
	for name := range documentCounts {
		names = append(names, name)
	}
	sort.Strings(names)
	summary := []any{}
	for _, name := range names {
		summary = append(summary, map[string]any{"kind": name, "documentCount": documentCounts[name], "resourceCount": counts[name]})
	}
	return map[string]any{"mode": "declared-only", "referencesResolved": false, "referenceCoverage": "selected-fields", "project": map[string]any{"id": DisplayID(object(project.Value["project"])["id"]), "file": SafeLocator(project.File), "path": "/project"}, "summary": summary, "resources": resources, "references": references}, nil
}
