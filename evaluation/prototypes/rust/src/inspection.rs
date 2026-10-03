//! Declared-only allowlist projection; no resolution, policy or execution.
use crate::{Manifest, display_id, kind_info, ordered, pointer, safe_locator};
use serde_json::{Value, json};
use std::collections::BTreeMap;

fn bindings(namespace: &str) -> Vec<(&'static str, &'static str)> {
    match namespace {
        "project" => vec![("maintainers.*.id", "participant")],
        "actor" => vec![("agentRef.id", "agent"), ("operatedBy.*.id", "actor"), ("representedBy.*.id", "actor"), ("integrationRef.id", "extension")],
        "agent-definition" => vec![("agentRef", "agent"), ("owner", "participant"), ("components.modelProfileRef", "model-profile"), ("components.promptSetRef", "prompt-set"), ("components.retrievalProfileRef", "retrieval-profile"), ("components.permissionRefs.*", "permission"), ("components.capabilityRefs.*", "capability"), ("components.contextSourceRefs.*", "context-source"), ("components.memoryScopes.*", "memory-scope"), ("components.extensionRefs.*", "extension")],
        "task" => vec![("owner", "participant"), ("participants.*", "participant"), ("dependsOn.*", "task"), ("capabilitiesRequired.*", "capability"), ("approvalGates.*", "approval-gate")],
        "workflow" => vec![("dependencies.*.from", "workflow-step"), ("dependencies.*.to", "workflow-step")],
        "workflow-step" => vec![("task", "task"), ("dependsOn.*", "workflow-step"), ("approvalGates.*", "approval-gate"), ("emits.*", "event")],
        "handoff" => vec![("from.*", "participant"), ("to.*", "participant"), ("artifacts.*", "artifact")],
        "permission" => vec![("subjects.*", "participant"), ("capabilities.*", "capability"), ("approvalGate", "approval-gate")],
        "context-source" => vec![("access.allowedActors.*", "participant"), ("access.deniedActors.*", "participant"), ("approvalGates.*", "approval-gate")],
        "memory-scope" => vec![("allowedConsumers.*", "participant"), ("allowedWriters.*", "participant"), ("allowedSourceScopes.*", "memory-scope"), ("approvalGate", "approval-gate")],
        "model-profile" => vec![("selection.providerRefs.*", "provider"), ("selection.pinnedModel.providerRef", "provider"), ("fallback.candidateProviderRefs.*", "provider")],
        "prompt-set" => vec![("owner", "participant")],
        "retrieval-profile" => vec![("owner", "participant"), ("sources.*.contextSourceRef", "context-source"), ("excludedSources.*", "context-source"), ("index.embeddingModelProfileRef", "model-profile")],
        "extension" => vec![("requiredCapabilities.*", "capability")], _ => Vec::new(),
    }
}
fn array(value: &Value) -> &[Value] { value.as_array().map(Vec::as_slice).unwrap_or(&[]) }
fn row(document: &Manifest, path: &str, namespace: &str, value: &Value, workflow: &Value) -> Value {
    let identity = if value.is_string() { value } else { &value["id"] };
    json!({"file":safe_locator(&document.file),"path":path,"kind":namespace,"id":display_id(identity),
        "scope":if matches!(namespace, "workflow-stage" | "workflow-step") { json!({"kind":"workflow","id":display_id(workflow)}) } else { Value::Null }})
}
fn visit(value: &Value, parts: &[&str], path: &str, found: &mut Vec<(Value, String)>) -> Result<(), ()> {
    if parts.is_empty() { found.push((value.clone(), path.to_owned())); if found.len() > 2000 { return Err(()); } return Ok(()); }
    if parts[0] == "*" {
        for (index, child) in array(value).iter().enumerate() { visit(child, &parts[1..], &format!("{}{}", path, pointer(&index.to_string())), found)?; }
    } else if let Some(child) = value.get(parts[0]) { visit(child, &parts[1..], &format!("{}{}", path, pointer(parts[0])), found)?; }
    Ok(())
}
pub fn inspect(documents: &[Manifest]) -> Result<Value, ()> {
    let (mut resources, mut references, mut counts) = (Vec::new(), Vec::new(), BTreeMap::<String, (usize, usize)>::new());
    let mut declaration = |document: &Manifest, value: &Value, path: &str, namespace: &str, id_field: &str, workflow: &Value| -> Result<(), ()> {
        resources.push(row(document, path, namespace, &value[id_field], workflow));
        counts.entry(document.kind.clone()).or_default().1 += 1;
        for (selector, target) in bindings(namespace) {
            let mut found = Vec::new(); visit(value, &selector.split('.').collect::<Vec<_>>(), path, &mut found)?;
            for (value, path) in found { references.push(row(document, &path, target, &value, workflow)); }
        }
        if resources.len() > 1000 || references.len() > 2000 { return Err(()); } Ok(())
    };
    for document in documents {
        let (field, namespace, id_field) = kind_info(&document.kind).ok_or(())?;
        let workflow_id = &document.value["workflow"]["id"];
        if matches!(document.kind.as_str(), "Project" | "Workflow") { declaration(document, &document.value[field], &pointer(field), namespace, id_field, workflow_id)?; }
        else { for (index, value) in array(&document.value[field]).iter().enumerate() { declaration(document, value, &format!("{}{}", pointer(field), pointer(&index.to_string())), namespace, id_field, workflow_id)?; } }
        if document.kind == "Project" { for (index, value) in array(&document.value["project"]["approvalGates"]).iter().enumerate() { declaration(document, value, &format!("/project/approvalGates/{index}"), "approval-gate", "id", workflow_id)?; } }
        if document.kind == "TaskSet" { for (index, task) in array(&document.value["tasks"]).iter().enumerate() { for (artifact, value) in array(&task["artifacts"]).iter().enumerate() { declaration(document, value, &format!("/tasks/{index}/artifacts/{artifact}"), "artifact", "id", workflow_id)?; } } }
        if document.kind == "Workflow" { for (stage_index, stage) in array(&document.value["workflow"]["stages"]).iter().enumerate() {
            let path = format!("/workflow/stages/{stage_index}"); declaration(document, stage, &path, "workflow-stage", "id", workflow_id)?;
            for (step_index, step) in array(&stage["steps"]).iter().enumerate() { declaration(document, step, &format!("{path}/steps/{step_index}"), "workflow-step", "id", workflow_id)?; }
        } }
    }
    drop(declaration);
    for document in documents { counts.entry(document.kind.clone()).or_default().0 += 1; }
    let project = documents.iter().find(|doc| doc.kind == "Project").ok_or(())?;
    ordered(&mut resources, &["file", "path", "kind", "id"]); ordered(&mut references, &["file", "path", "kind", "id"]);
    Ok(json!({"mode":"declared-only","referencesResolved":false,"referenceCoverage":"selected-fields",
        "project":{"id":display_id(&project.value["project"]["id"]),"file":safe_locator(&project.file),"path":"/project"},
        "summary":counts.iter().map(|(kind,(documents,resources))| json!({"kind":kind,"documentCount":documents,"resourceCount":resources})).collect::<Vec<_>>(),
        "resources":resources,"references":references}))
}
