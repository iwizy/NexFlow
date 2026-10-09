//! Native, pure validation. Bindings are static specification data, never case expectations.
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};
use crate::display_id;

fn text(value: &Value) -> &str { value.as_str().unwrap_or("") }
fn list(value: &Value) -> &[Value] { value.as_array().map(Vec::as_slice).unwrap_or(&[]) }
fn locations(value: &Value, pattern: &str) -> Vec<(Value, String)> {
    let mut found = vec![(value.clone(), String::new())];
    for key in pattern.split('/').filter(|key| !key.is_empty()) {
        let mut next = Vec::new();
        for (value, path) in found {
            if key == "*" { for (i, child) in list(&value).iter().enumerate() { next.push((child.clone(), format!("{path}/{i}"))); } }
            else if let Some(child) = value.get(key) { next.push((child.clone(), format!("{path}/{key}"))); }
        }
        found = next;
    }
    found
}
fn at(value: &Value, pattern: &str) -> Value { locations(value, pattern).into_iter().next().map(|v| v.0).unwrap_or(Value::Null) }
fn issue(category: &str, kind: &str, path: &str, ns: &str, id: &str) -> Value {
    let mut value = json!({"code":"NF-SEMANTIC","category":category,"severity":"error"});
    if !kind.is_empty() { value["sourceKind"] = json!(kind); }
    if !path.is_empty() { value["instancePath"] = json!(path); }
    if !ns.is_empty() { value["targetNamespace"] = json!(ns); value["targetId"] = json!(display_id(&json!(id))); }
    value
}
pub fn workflow_namespace(workflow: &Value) -> Vec<Value> {
    let mut diagnostics = Vec::new(); let mut stages = BTreeSet::new(); let mut steps = BTreeMap::new(); let mut order = Vec::new();
    for stage in list(&workflow["stages"]) {
        let id = text(&stage["id"]);
        if !id.is_empty() && !stages.insert(id.to_owned()) { diagnostics.push(issue("duplicate-workflow-stage","","","","")); }
        for step in list(&stage["steps"]) {
            let id = text(&step["id"]); if id.is_empty() { continue; }
            if steps.contains_key(id) { diagnostics.push(issue("duplicate-workflow-step","","","","")); }
            else { steps.insert(id.to_owned(), step.clone()); order.push(id.to_owned()); }
        }
    }
    for id in order { for reference in list(&steps[&id]["dependsOn"]) {
        let id = text(reference); if !id.is_empty() && !steps.contains_key(id) { diagnostics.push(issue("unknown-workflow-step","","","","")); }
    } }
    for edge in list(&workflow["dependencies"]) { for key in ["from","to"] {
        let id = text(&edge[key]); if !id.is_empty() && !steps.contains_key(id) { diagnostics.push(issue("unknown-workflow-step","","","","")); }
    } }
    diagnostics
}
pub fn artifact_namespace(tasks: &Value, handoffs: &Value) -> Vec<Value> {
    let mut diagnostics = Vec::new(); let mut ids = BTreeSet::new();
    for task in list(tasks) { for artifact in list(&task["artifacts"]) {
        let id = text(&artifact["id"]); if !id.is_empty() && !ids.insert(id.to_owned()) { diagnostics.push(issue("duplicate-artifact","","","","")); }
    } }
    for handoff in list(handoffs) { for reference in list(&handoff["artifacts"]) {
        let id = text(reference); if !id.is_empty() && !ids.contains(id) { diagnostics.push(issue("unknown-artifact","","","","")); }
    } }
    diagnostics
}
struct Context { diagnostics: Vec<Value>, indexes: BTreeMap<String, BTreeMap<String, Value>>, orders: BTreeMap<String, Vec<String>> }
impl Context {
    fn resolve(&mut self, kind: &str, path: &str, value: &Value, ns: &str) -> bool {
        let id = text(value); if id.is_empty() { return false; }
        if !self.indexes.get(ns).is_some_and(|index| index.contains_key(id)) { self.diagnostics.push(issue("unresolved-reference",kind,path,ns,id)); return false; }
        true
    }
    fn typed(&mut self, kind: &str, path: &str, value: &Value, ns: &str) -> Vec<String> {
        let entries = if value.is_array() { list(value).iter().enumerate().map(|(i,v)| (v.clone(), format!("{path}/{i}"))).collect() }
            else if value.is_null() { Vec::new() } else { vec![(value.clone(),path.to_owned())] };
        let mut ids = Vec::new();
        for (value,path) in entries {
            if !value.is_string() && value["kind"] != ns { self.diagnostics.push(issue("wrong-reference-kind",kind,&path,"","")); continue; }
            let id = if value.is_string() {text(&value)} else {text(&value["id"])};
            self.resolve(kind,&path,&json!(id),ns); if !id.is_empty() { ids.push(id.to_owned()); }
        }
        ids
    }
}
pub fn semantic_fragment(documents: &Value) -> Vec<Value> {
    let rules: Value = match serde_json::from_str(include_str!("../semantic-rules.json")) { Ok(v) => v, Err(_) => return vec![issue("invalid-bindings","","","","")] };
    let mut c = Context { diagnostics: Vec::new(), indexes: BTreeMap::new(), orders: BTreeMap::new() };
    let actors_present = documents.get("ActorSet").is_some();
    for rule in list(&rules["declarations"]) {
        let (kind,pattern,ns,key) = (text(&rule[0]),text(&rule[1]),text(&rule[2]),text(&rule[3]));
        let index = c.indexes.entry(ns.to_owned()).or_default(); let order = c.orders.entry(ns.to_owned()).or_default();
        for (value,path) in locations(&documents[kind],pattern) {
            let id = text(&value[key]); if id.is_empty() { continue; }
            if index.contains_key(id) {
                let category = match ns { "workflow-stage" => "duplicate-workflow-stage", "workflow-step" => "duplicate-workflow-step", _ => "duplicate-identity" };
                c.diagnostics.push(issue(category,kind,&format!("{path}/{key}"),ns,id));
            }
            else { index.insert(id.to_owned(),value.clone()); order.push(id.to_owned()); }
        }
    }
    if !actors_present {
        for (value,path) in locations(&documents["Project"],"project/maintainers/*") {
            let id = text(&value["id"]); if id.is_empty() { continue; }
            if c.indexes["actor"].contains_key(id) { c.diagnostics.push(issue("duplicate-identity","Project",&format!("{path}/id"),"actor",id)); }
            else { c.indexes.get_mut("actor").unwrap().insert(id.to_owned(),value.clone()); c.orders.entry("actor".to_owned()).or_default().push(id.to_owned()); }
        }
        for id in c.orders.get("agent").cloned().unwrap_or_default() {
            if !c.indexes["actor"].contains_key(&id) { c.orders.entry("actor".to_owned()).or_default().push(id.clone()); }
            let agent = c.indexes["agent"][&id].clone(); c.indexes.get_mut("actor").unwrap().insert(id,agent);
        }
    }
    if !c.diagnostics.is_empty() { return c.diagnostics; }
    for rule in list(&rules["references"]) {
        let (kind,pattern,ns) = (text(&rule[0]),text(&rule[1]),text(&rule[2]));
        if !actors_present && kind == "Project" && pattern == "project/maintainers/*/id" { continue; }
        for (value,path) in locations(&documents[kind],pattern) { c.resolve(kind,&path,&value,ns); }
    }
    let mut bridges = BTreeSet::new(); let mut graph = BTreeMap::new(); let mut graph_order = Vec::new();
    for (actor,path) in locations(&documents["ActorSet"],"actors/*") {
        if actor["kind"] == "agent" { for id in c.typed("ActorSet",&format!("{path}/agentRef"),&actor["agentRef"],"agent") {
            if !bridges.insert(id.clone()) && c.indexes["agent"].contains_key(&id) { c.diagnostics.push(issue("ambiguous-agent-bridge","ActorSet",&format!("{path}/agentRef"),"","")); }
        } }
        let mut edges = c.typed("ActorSet",&format!("{path}/operatedBy"),&actor["operatedBy"],"actor");
        edges.extend(c.typed("ActorSet",&format!("{path}/representedBy"),&actor["representedBy"],"actor"));
        c.typed("ActorSet",&format!("{path}/integrationRef"),&actor["integrationRef"],"extension");
        let id = text(&actor["id"]); if !id.is_empty() { graph.insert(id.to_owned(),edges); graph_order.push(id.to_owned()); }
    }
    if actors_present { for id in c.orders.get("agent").cloned().unwrap_or_default() {
        if !bridges.contains(&id) { c.diagnostics.push(issue("missing-agent-bridge","ActorSet","","","")); }
    } }
    let mut states = BTreeMap::new();
    for start in graph_order {
        if states.contains_key(&start) { continue; }
        states.insert(start.clone(),1); let mut stack = vec![(start,0usize)];
        while let Some((id,index)) = stack.last_mut() {
            let edges = &graph[id];
            if *index >= edges.len() { states.insert(id.clone(),2); stack.pop(); continue; }
            let next = edges[*index].clone(); *index += 1; if !graph.contains_key(&next) { continue; }
            if states.get(&next) == Some(&1) { c.diagnostics.push(issue("reference-cycle","ActorSet","","","")); }
            else if !states.contains_key(&next) { states.insert(next.clone(),1); stack.push((next,0)); }
        }
    }
    let mut human: BTreeSet<String> = c.indexes["actor"].iter().filter(|(_,a)| a["kind"] == "human").map(|(id,_)| id.clone()).collect();
    let mut changed = true;
    while changed {
        changed = false;
        for (id,actor) in &c.indexes["actor"] {
            let reps = list(&actor["representedBy"]);
            if !human.contains(id) && actor["kind"] == "authority" && !reps.is_empty() && reps.iter().all(|r| r["kind"] == "actor" && human.contains(text(&r["id"]))) { human.insert(id.clone()); changed = true; }
        }
    }
    let override_policy = at(&documents["Project"],"project/policies/humanOverride");
    if !override_policy.is_null() {
        if !actors_present { c.diagnostics.push(issue("missing-actor-set","Project","","","")); }
        else { for id in c.typed("Project","/project/policies/humanOverride/authorities",&override_policy["authorities"],"actor") {
            if c.indexes["actor"].contains_key(&id) && !human.contains(&id) { c.diagnostics.push(issue("non-human-authority","Project","","","")); }
        } }
    }
    let mut active = BTreeSet::new();
    for (definition,path) in locations(&documents["AgentDefinitionSet"],"agentDefinitions/*") {
        if definition["status"] != "active" { continue; }
        let id = text(&definition["agentRef"]);
        if !id.is_empty() && c.indexes["agent"].contains_key(id) && !active.insert(id.to_owned()) { c.diagnostics.push(issue("ambiguous-active-definition","AgentDefinitionSet",&path,"","")); }
        for (field,ns) in [("promptSetRef","prompt-set"),("retrievalProfileRef","retrieval-profile")] {
            if let Some(component) = c.indexes[ns].get(text(&definition["components"][field])) {
                if component["status"] != "active" { c.diagnostics.push(issue("inactive-component","AgentDefinitionSet",&format!("{path}/components/{field}"),"","")); }
                if field == "promptSetRef" && component["review"]["required"] == true && component["review"]["safetyReviewStatus"] != "approved" { c.diagnostics.push(issue("unapproved-component","AgentDefinitionSet",&format!("{path}/components/{field}"),"","")); }
            }
        }
    }
    for (value,path) in locations(&documents["ProviderSet"],"providers/*/capabilities/*") {
        if !text(&value).is_empty() { c.diagnostics.push(issue("deprecated-provider-capability","ProviderSet",&path,"","")); }
    }
    for (value,path) in locations(&documents["Project"],"project/approvalGates/*/appliesTo/*") {
        if !text(&value).is_empty() { c.diagnostics.push(issue("ambiguous-legacy-target","Project",&path,"","")); }
    }
    for (target,path) in locations(&documents["Project"],"project/approvalGates/*/targets/*") {
        let kind = text(&target["kind"]);
        if matches!(kind,"workflow-stage"|"workflow-step") {
            let scope = &target["scope"];
            if scope["kind"] != "workflow" || !scope["id"].is_string() { c.diagnostics.push(issue("missing-workflow-scope","Project",&path,"","")); continue; }
            if !c.indexes["workflow"].contains_key(text(&scope["id"])) { c.diagnostics.push(issue("unknown-workflow-scope","Project",&path,"","")); continue; }
        } else if target.get("scope").is_some() { c.diagnostics.push(issue("unexpected-scope","Project",&path,"","")); continue; }
        if !matches!(kind,"agent-definition"|"capability"|"permission"|"context-source"|"memory-scope"|"provider"|"task"|"workflow"|"workflow-stage"|"workflow-step"|"extension") {
            c.diagnostics.push(issue("unsupported-target-kind","Project",&path,"","")); continue;
        }
        c.resolve("Project",&format!("{path}/id"),&target["id"],kind);
    }
    c.diagnostics.extend(workflow_namespace(&at(&documents["Workflow"],"workflow")));
    c.diagnostics.extend(artifact_namespace(&at(&documents["TaskSet"],"tasks"),&at(&documents["HandoffSet"],"handoffs")));
    c.diagnostics
}
pub fn semantic_operation(operation: &str, input: &Value) -> Vec<Value> {
    let mut pending = vec![(input,0usize)]; let mut count = 0;
    while let Some((value,depth)) = pending.pop() {
        count += 1; if count > 10000 || depth > 64 { return vec![issue("semantic-limit","","","","")]; }
        if let Some(values) = value.as_array() { pending.extend(values.iter().map(|v| (v,depth+1))); }
        else if let Some(values) = value.as_object() { pending.extend(values.values().map(|v| (v,depth+1))); }
    }
    match operation {
        "semantic-fragment" => semantic_fragment(&input["documents"]),
        "workflow-namespace" => list(&input["workflows"]).iter().flat_map(workflow_namespace).collect(),
        "artifact-namespace" => list(&input["assemblies"]).iter().flat_map(|a| artifact_namespace(&a["tasks"],&a["handoffs"])).collect(),
        _ => vec![issue("unsupported-operation","","","","")],
    }
}
