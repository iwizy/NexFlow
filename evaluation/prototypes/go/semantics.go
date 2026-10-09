package candidate

import (
	_ "embed"
	"encoding/json"
	"strconv"
	"strings"
)

//go:embed semantic-rules.json
var semanticRulesJSON []byte

type semanticRules struct {
	Declarations [][]string
	References   [][]string
}
type location struct {
	value any
	path  string
}

func locations(value any, pattern string) []location {
	found := []location{{value, ""}}
	for _, key := range strings.Split(pattern, "/") {
		if key == "" {
			continue
		}
		next := []location{}
		for _, row := range found {
			if key == "*" {
				for i, child := range array(row.value) {
					next = append(next, location{child, row.path + "/" + strconv.Itoa(i)})
				}
			} else if child, ok := object(row.value)[key]; ok {
				next = append(next, location{child, row.path + "/" + key})
			}
		}
		found = next
	}
	return found
}
func semanticAt(value any, pattern string) any {
	rows := locations(value, pattern)
	if len(rows) > 0 {
		return rows[0].value
	}
	return nil
}
func semanticIssue(category, kind, path, namespace, id string) map[string]any {
	out := map[string]any{"code": "NF-SEMANTIC", "category": category, "severity": "error"}
	if kind != "" {
		out["sourceKind"] = kind
	}
	if path != "" {
		out["instancePath"] = path
	}
	if namespace != "" {
		out["targetNamespace"] = namespace
		out["targetId"] = DisplayID(id)
	}
	return out
}
func WorkflowNamespace(workflow any) []map[string]any {
	issues := []map[string]any{}
	stages := map[string]bool{}
	steps := map[string]any{}
	order := []string{}
	for _, stage := range array(object(workflow)["stages"]) {
		id := text(object(stage)["id"])
		if id != "" {
			if stages[id] {
				issues = append(issues, semanticIssue("duplicate-workflow-stage", "", "", "", ""))
			} else {
				stages[id] = true
			}
		}
		for _, step := range array(object(stage)["steps"]) {
			id := text(object(step)["id"])
			if id == "" {
				continue
			}
			if _, ok := steps[id]; ok {
				issues = append(issues, semanticIssue("duplicate-workflow-step", "", "", "", ""))
			} else {
				steps[id] = step
				order = append(order, id)
			}
		}
	}
	for _, id := range order {
		for _, ref := range array(object(steps[id])["dependsOn"]) {
			if ref := text(ref); ref != "" {
				if _, ok := steps[ref]; !ok {
					issues = append(issues, semanticIssue("unknown-workflow-step", "", "", "", ""))
				}
			}
		}
	}
	for _, edge := range array(object(workflow)["dependencies"]) {
		for _, key := range []string{"from", "to"} {
			if ref := text(object(edge)[key]); ref != "" {
				if _, ok := steps[ref]; !ok {
					issues = append(issues, semanticIssue("unknown-workflow-step", "", "", "", ""))
				}
			}
		}
	}
	return issues
}
func ArtifactNamespace(tasks, handoffs any) []map[string]any {
	issues := []map[string]any{}
	ids := map[string]bool{}
	for _, task := range array(tasks) {
		for _, artifact := range array(object(task)["artifacts"]) {
			id := text(object(artifact)["id"])
			if id == "" {
				continue
			}
			if ids[id] {
				issues = append(issues, semanticIssue("duplicate-artifact", "", "", "", ""))
			} else {
				ids[id] = true
			}
		}
	}
	for _, handoff := range array(handoffs) {
		for _, ref := range array(object(handoff)["artifacts"]) {
			if ref := text(ref); ref != "" && !ids[ref] {
				issues = append(issues, semanticIssue("unknown-artifact", "", "", "", ""))
			}
		}
	}
	return issues
}
func SemanticFragment(documents map[string]any) []map[string]any {
	var rules semanticRules
	if json.Unmarshal(semanticRulesJSON, &rules) != nil {
		return []map[string]any{semanticIssue("invalid-bindings", "", "", "", "")}
	}
	issues := []map[string]any{}
	indexes := map[string]map[string]any{}
	orders := map[string][]string{}
	_, actorsPresent := documents["ActorSet"]
	rows := func(kind, pattern string) []location { return locations(documents[kind], pattern) }
	for _, rule := range rules.Declarations {
		kind, pattern, ns, key := rule[0], rule[1], rule[2], rule[3]
		if indexes[ns] == nil {
			indexes[ns] = map[string]any{}
		}
		for _, row := range rows(kind, pattern) {
			id := text(object(row.value)[key])
			if id == "" {
				continue
			}
			if _, ok := indexes[ns][id]; ok {
				category := "duplicate-identity"
				if ns == "workflow-stage" || ns == "workflow-step" {
					category = "duplicate-" + ns
				}
				issues = append(issues, semanticIssue(category, kind, row.path+"/"+key, ns, id))
			} else {
				indexes[ns][id] = row.value
				orders[ns] = append(orders[ns], id)
			}
		}
	}
	if !actorsPresent {
		for _, row := range rows("Project", "project/maintainers/*") {
			id := text(object(row.value)["id"])
			if id == "" {
				continue
			}
			if _, ok := indexes["actor"][id]; ok {
				issues = append(issues, semanticIssue("duplicate-identity", "Project", row.path+"/id", "actor", id))
			} else {
				indexes["actor"][id] = row.value
				orders["actor"] = append(orders["actor"], id)
			}
		}
		for _, id := range orders["agent"] {
			if _, ok := indexes["actor"][id]; !ok {
				orders["actor"] = append(orders["actor"], id)
			}
			indexes["actor"][id] = indexes["agent"][id]
		}
	}
	if len(issues) > 0 {
		return issues
	}
	resolve := func(kind, path string, value any, ns string) bool {
		id := text(value)
		if id == "" {
			return false
		}
		if _, ok := indexes[ns][id]; !ok {
			issues = append(issues, semanticIssue("unresolved-reference", kind, path, ns, id))
			return false
		}
		return true
	}
	typed := func(kind, path string, value any, ns string) []string {
		entries := []location{}
		if list, ok := value.([]any); ok {
			for i, v := range list {
				entries = append(entries, location{v, path + "/" + strconv.Itoa(i)})
			}
		} else if value != nil {
			entries = append(entries, location{value, path})
		}
		ids := []string{}
		for _, row := range entries {
			_, scalar := row.value.(string)
			if !scalar && object(row.value)["kind"] != ns {
				issues = append(issues, semanticIssue("wrong-reference-kind", kind, row.path, "", ""))
				continue
			}
			id := text(row.value)
			if !scalar {
				id = text(object(row.value)["id"])
			}
			resolve(kind, row.path, id, ns)
			if id != "" {
				ids = append(ids, id)
			}
		}
		return ids
	}
	for _, rule := range rules.References {
		kind, pattern, ns := rule[0], rule[1], rule[2]
		if !actorsPresent && kind == "Project" && pattern == "project/maintainers/*/id" {
			continue
		}
		for _, row := range rows(kind, pattern) {
			resolve(kind, row.path, row.value, ns)
		}
	}
	bridges := map[string]bool{}
	graph := map[string][]string{}
	graphOrder := []string{}
	for _, row := range rows("ActorSet", "actors/*") {
		actor := object(row.value)
		if actor["kind"] == "agent" {
			for _, id := range typed("ActorSet", row.path+"/agentRef", actor["agentRef"], "agent") {
				if _, resolved := indexes["agent"][id]; bridges[id] && resolved {
					issues = append(issues, semanticIssue("ambiguous-agent-bridge", "ActorSet", row.path+"/agentRef", "", ""))
				} else {
					bridges[id] = true
				}
			}
		}
		edges := typed("ActorSet", row.path+"/operatedBy", actor["operatedBy"], "actor")
		edges = append(edges, typed("ActorSet", row.path+"/representedBy", actor["representedBy"], "actor")...)
		typed("ActorSet", row.path+"/integrationRef", actor["integrationRef"], "extension")
		if id := text(actor["id"]); id != "" {
			graph[id] = edges
			graphOrder = append(graphOrder, id)
		}
	}
	if actorsPresent {
		for _, id := range orders["agent"] {
			if !bridges[id] {
				issues = append(issues, semanticIssue("missing-agent-bridge", "ActorSet", "", "", ""))
			}
		}
	}
	state := map[string]int{}
	type frame struct {
		id   string
		next int
	}
	for _, start := range graphOrder {
		if state[start] != 0 {
			continue
		}
		state[start] = 1
		stack := []frame{{start, 0}}
		for len(stack) > 0 {
			current := &stack[len(stack)-1]
			edges := graph[current.id]
			if current.next >= len(edges) {
				state[current.id] = 2
				stack = stack[:len(stack)-1]
				continue
			}
			next := edges[current.next]
			current.next++
			if _, ok := graph[next]; !ok {
				continue
			}
			if state[next] == 1 {
				issues = append(issues, semanticIssue("reference-cycle", "ActorSet", "", "", ""))
			} else if state[next] == 0 {
				state[next] = 1
				stack = append(stack, frame{next, 0})
			}
		}
	}
	human := map[string]bool{}
	for _, id := range orders["actor"] {
		if object(indexes["actor"][id])["kind"] == "human" {
			human[id] = true
		}
	}
	changed := true
	for changed {
		changed = false
		for _, id := range orders["actor"] {
			actor := object(indexes["actor"][id])
			reps := array(actor["representedBy"])
			all := len(reps) > 0
			for _, ref := range reps {
				if object(ref)["kind"] != "actor" || !human[text(object(ref)["id"])] {
					all = false
				}
			}
			if !human[id] && actor["kind"] == "authority" && all {
				human[id] = true
				changed = true
			}
		}
	}
	override := semanticAt(documents["Project"], "project/policies/humanOverride")
	if override != nil {
		if !actorsPresent {
			issues = append(issues, semanticIssue("missing-actor-set", "Project", "", "", ""))
		} else {
			for _, id := range typed("Project", "/project/policies/humanOverride/authorities", object(override)["authorities"], "actor") {
				if _, ok := indexes["actor"][id]; ok && !human[id] {
					issues = append(issues, semanticIssue("non-human-authority", "Project", "", "", ""))
				}
			}
		}
	}
	active := map[string]bool{}
	for _, row := range rows("AgentDefinitionSet", "agentDefinitions/*") {
		d := object(row.value)
		if d["status"] != "active" {
			continue
		}
		id := text(d["agentRef"])
		if _, resolved := indexes["agent"][id]; id != "" && resolved {
			if active[id] {
				issues = append(issues, semanticIssue("ambiguous-active-definition", "AgentDefinitionSet", row.path, "", ""))
			} else {
				active[id] = true
			}
		}
		for _, binding := range [][2]string{{"promptSetRef", "prompt-set"}, {"retrievalProfileRef", "retrieval-profile"}} {
			field, ns := binding[0], binding[1]
			component, ok := indexes[ns][text(object(d["components"])[field])]
			if !ok {
				continue
			}
			if object(component)["status"] != "active" {
				issues = append(issues, semanticIssue("inactive-component", "AgentDefinitionSet", row.path+"/components/"+field, "", ""))
			}
			review := object(object(component)["review"])
			if field == "promptSetRef" && review["required"] == true && review["safetyReviewStatus"] != "approved" {
				issues = append(issues, semanticIssue("unapproved-component", "AgentDefinitionSet", row.path+"/components/"+field, "", ""))
			}
		}
	}
	for _, row := range rows("ProviderSet", "providers/*/capabilities/*") {
		if text(row.value) != "" {
			issues = append(issues, semanticIssue("deprecated-provider-capability", "ProviderSet", row.path, "", ""))
		}
	}
	targetKinds := map[string]bool{}
	for _, kind := range []string{"agent-definition", "capability", "permission", "context-source", "memory-scope", "provider", "task", "workflow", "workflow-stage", "workflow-step", "extension"} {
		targetKinds[kind] = true
	}
	for _, row := range rows("Project", "project/approvalGates/*/appliesTo/*") {
		if text(row.value) != "" {
			issues = append(issues, semanticIssue("ambiguous-legacy-target", "Project", row.path, "", ""))
		}
	}
	for _, row := range rows("Project", "project/approvalGates/*/targets/*") {
		target := object(row.value)
		kind := text(target["kind"])
		if kind == "workflow-stage" || kind == "workflow-step" {
			scope := object(target["scope"])
			_, isString := scope["id"].(string)
			if scope["kind"] != "workflow" || !isString {
				issues = append(issues, semanticIssue("missing-workflow-scope", "Project", row.path, "", ""))
				continue
			}
			if _, ok := indexes["workflow"][text(scope["id"])]; !ok {
				issues = append(issues, semanticIssue("unknown-workflow-scope", "Project", row.path, "", ""))
				continue
			}
		} else if _, ok := target["scope"]; ok {
			issues = append(issues, semanticIssue("unexpected-scope", "Project", row.path, "", ""))
			continue
		}
		if !targetKinds[kind] {
			issues = append(issues, semanticIssue("unsupported-target-kind", "Project", row.path, "", ""))
			continue
		}
		resolve("Project", row.path+"/id", target["id"], kind)
	}
	issues = append(issues, WorkflowNamespace(semanticAt(documents["Workflow"], "workflow"))...)
	issues = append(issues, ArtifactNamespace(semanticAt(documents["TaskSet"], "tasks"), semanticAt(documents["HandoffSet"], "handoffs"))...)
	return issues
}
func SemanticOperation(operation string, input map[string]any) []map[string]any {
	if operation != "semantic-fragment" && operation != "workflow-namespace" && operation != "artifact-namespace" {
		return []map[string]any{semanticIssue("unsupported-operation", "", "", "", "")}
	}
	type node struct {
		value any
		depth int
	}
	pending := []node{{input, 0}}
	count := 0
	for len(pending) > 0 {
		current := pending[len(pending)-1]
		pending = pending[:len(pending)-1]
		count++
		if count > 10000 || current.depth > 64 {
			return []map[string]any{semanticIssue("semantic-limit", "", "", "", "")}
		}
		if values, ok := current.value.([]any); ok {
			for _, child := range values {
				pending = append(pending, node{child, current.depth + 1})
			}
		} else {
			for _, child := range object(current.value) {
				pending = append(pending, node{child, current.depth + 1})
			}
		}
	}
	if operation == "semantic-fragment" {
		return SemanticFragment(object(input["documents"]))
	}
	issues := []map[string]any{}
	if operation == "workflow-namespace" {
		for _, w := range array(input["workflows"]) {
			issues = append(issues, WorkflowNamespace(w)...)
		}
	}
	if operation == "artifact-namespace" {
		for _, a := range array(input["assemblies"]) {
			issues = append(issues, ArtifactNamespace(object(a)["tasks"], object(a)["handoffs"])...)
		}
	}
	return issues
}
