//! Disposable local validation experiment; library functions return data only.
pub mod discovery;
pub mod files;
pub mod inspection;
pub mod schema;
pub mod yaml;

use serde_json::{Value, json};
use std::{collections::BTreeSet, path::Path};
pub use discovery::{Manifest, Selection, discover};
pub use schema::SchemaEngine;
pub use yaml::parse_yaml;

pub fn kind_info(kind: &str) -> Option<(&'static str, &'static str, &'static str)> {
    Some(match kind {
        "Project" => ("project", "project", "id"),
        "ActorSet" => ("actors", "actor", "id"),
        "AgentSet" => ("agents", "agent", "id"),
        "AgentDefinitionSet" => ("agentDefinitions", "agent-definition", "id"),
        "CapabilitySet" => ("capabilities", "capability", "id"),
        "PermissionSet" => ("permissions", "permission", "id"),
        "TaskSet" => ("tasks", "task", "id"),
        "Workflow" => ("workflow", "workflow", "id"),
        "HandoffSet" => ("handoffs", "handoff", "id"),
        "ContextSet" => ("contextSources", "context-source", "id"),
        "MemorySet" => ("memoryScopes", "memory-scope", "scope"),
        "ProviderSet" => ("providers", "provider", "id"),
        "ModelProfileSet" => ("modelProfiles", "model-profile", "id"),
        "PromptSet" => ("promptSets", "prompt-set", "id"),
        "RetrievalProfileSet" => ("retrievalProfiles", "retrieval-profile", "id"),
        "EventSet" => ("events", "event", "type"),
        "ExtensionSet" => ("extensions", "extension", "id"),
        _ => return None,
    })
}

pub fn safe_locator(value: &str) -> &str {
    if value.is_empty() || value.len() > 512 || value.starts_with('/')
        || value.chars().any(|c| c == ':' || c == '\\' || c.is_control())
        || value.split('/').any(|part| matches!(part, "" | "." | "..")) {
        "<redacted-source>"
    } else { value }
}

pub fn display_id(value: &Value) -> &str {
    let Some(id) = value.as_str() else { return "<redacted-id>"; };
    if id.len() > 128 || !id.as_bytes().first().is_some_and(u8::is_ascii_lowercase)
        || id.split(['-', '_', '.']).any(|part| part.is_empty() || !part.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())) {
        "<redacted-id>"
    } else { id }
}

pub fn pointer(part: &str) -> String { format!("/{}", part.replace('~', "~0").replace('/', "~1")) }

pub fn diagnostic(code: &str, file: Option<&str>, kind: Option<&str>, path: Option<&str>, keyword: Option<&str>) -> Value {
    let message = match code {
        "NF-SCHEMA" => "Local schema constraint is not satisfied.",
        "NEXFLOW-PROTOTYPE-USAGE" => "Only validate or inspect with an explicit root and supported options are accepted.",
        "NEXFLOW-PROTOTYPE-INTERNAL" => "The reviewed local validation setup could not produce a result.",
        "NEXFLOW-PROTOTYPE-INSPECTION-LIMIT" => "Declared inspection exceeds its fixed budget.",
        _ => "Selected manifest input does not satisfy discovery policy.",
    };
    json!({"severity":"error","code":code,"message":message,
        "file":file.map(|f| if f == "<input>" { f } else { safe_locator(f) }),
        "kind":kind,"path":path,"keyword":keyword,"related":[]})
}

pub fn ordered(items: &mut [Value], fields: &[&str]) {
    items.sort_by_key(|item| fields.iter().map(|field| item[field].as_str().unwrap_or("").to_owned()).collect::<Vec<_>>());
}

pub fn envelope(command: Option<&str>) -> Value {
    json!({"formatVersion":"0.4-draft","tool":{"name":"nexflow-rust-evaluation","version":"unreleased"},
        "supportedSpecVersions":["0.1"],"command":command,"success":false,"exitCode":1,"inputMode":null,
        "checks":{"discovery":"not-run","schema":"not-run","semantic":"not-run","coreProfile":"not-run","extensionProfiles":"not-run"},
        "executionAuthorized":false,"diagnostics":[],"truncated":false,"result":null})
}

/// The reviewed source checkout supplies schemas explicitly, never through an input root.
pub fn evaluate(command: &str, selection: &Selection, schemas: &SchemaEngine) -> Value {
    if !matches!(command, "validate" | "inspect") { return usage(); }
    let mut output = envelope(Some(command));
    let assembly = discover(selection);
    output["inputMode"] = json!(assembly.mode);
    let mut errors = assembly.diagnostics;
    output["checks"]["discovery"] = json!(if errors.is_empty() { "passed" } else { "failed" });
    if !errors.is_empty() {
        if errors.iter().any(|error| matches!(error["code"].as_str(), Some("NF-DISCOVERY-UNSUPPORTED-VERSION" | "NF-DISCOVERY-UNSUPPORTED-KIND"))) { output["exitCode"] = json!(3); }
    } else {
        for document in &assembly.documents { errors.extend(schemas.validate(document)); }
        output["checks"]["schema"] = json!(if errors.is_empty() { "passed" } else { "failed" });
        if errors.is_empty() {
            let mut result = json!({"documentCount":assembly.documents.len(),"documents":assembly.documents.iter().map(|doc| json!({"file":safe_locator(&doc.file),"kind":doc.kind})).collect::<Vec<_>>()});
            if command == "inspect" {
                match inspection::inspect(&assembly.documents) {
                    Ok(value) => result["inspection"] = value,
                    Err(()) => errors.push(diagnostic("NEXFLOW-PROTOTYPE-INSPECTION-LIMIT", None, None, None, None)),
                }
            }
            if errors.is_empty() { output["result"] = result; output["success"] = json!(true); output["exitCode"] = json!(0); }
        }
    }
    ordered(&mut errors, &["file", "path", "severity", "code", "kind", "keyword", "message"]);
    output["truncated"] = json!(errors.len() > 200);
    errors.truncate(200);
    output["diagnostics"] = json!(errors);
    output
}

pub fn usage() -> Value {
    let mut value = envelope(None);
    value["exitCode"] = json!(2);
    value["diagnostics"] = json!([diagnostic("NEXFLOW-PROTOTYPE-USAGE", None, None, None, None)]);
    value
}

pub fn evaluate_library_case(entry: &Value, root: &Path, schemas: &SchemaEngine) -> Result<Value, &'static str> {
    let op = entry["operation"].as_str().ok_or("invalid operation")?;
    let input = &entry["input"];
    let mut result = json!({"caseId":entry["id"],"operation":op,"valid":false,"diagnostics":[],"checks":{"runtime":"not-run","extensions":"not-run"}});
    let issues = match op {
        "yaml-parse" => match parse_yaml(input["yaml"].as_str().ok_or("invalid YAML input")?) {
            Ok(_) => Vec::new(), Err(category) => vec![json!({"category":category})],
        },
        "local-schema" => SchemaEngine::validate_local(input["schemas"].as_array().ok_or("invalid schemas")?, input["entryId"].as_str().ok_or("invalid entry")?, &input["value"]),
        "manifest-schema" => {
            let text = files::LocalInputs::new(root)?.read(input["file"].as_str().ok_or("invalid file")?)?;
            match parse_yaml(&text) {
                Err(category) => vec![json!({"category":category})],
                Ok(value) => {
                    let kind = value["kind"].as_str().unwrap_or("");
                    if kind_info(kind).is_none() { vec![json!({"code":"NF-SCHEMA","category":"unknown-kind","instancePath":"","kind":if kind.len() <= 32 && kind.bytes().all(|b| b.is_ascii_alphabetic()) { kind } else { "<redacted-kind>" }})] }
                    else { let mut issues = schemas.validate_value(kind, &value)?; for issue in &mut issues { issue["kind"] = json!(kind); } issues }
                }
            }
        },
        "discovery" => {
            let locator = input["root"].as_str().ok_or("invalid root")?;
            let selected_root = files::LocalInputs::new(root)?.path(locator)?;
            let args = input["args"].as_array().ok_or("invalid args")?;
            if args.len() % 2 != 0 { return Err("invalid selection"); }
            let mut selection = Selection { root: selected_root, project: None, files: None };
            for pair in args.chunks(2) {
                let value = pair[1].as_str().ok_or("invalid option")?.to_owned();
                match pair[0].as_str() {
                    Some("--project") if selection.project.is_none() => selection.project = Some(value),
                    Some("--file") => selection.files.get_or_insert_with(Vec::new).push(value),
                    _ => return Err("invalid option"),
                }
            }
            let assembly = discover(&selection);
            if assembly.diagnostics.is_empty() {
                result["documentCount"] = json!(assembly.documents.len());
                let ids: BTreeSet<_> = assembly.documents.iter().filter(|doc| doc.kind == "Workflow").map(|doc| doc.value["workflow"]["id"].as_str().unwrap_or("")).collect();
                result["workflowIds"] = json!(ids);
            }
            assembly.diagnostics.iter().map(|issue| json!({"code":issue["code"]})).collect()
        },
        "semantic-fragment" | "workflow-namespace" | "artifact-namespace" => {
            result["valid"] = Value::Null; result["status"] = json!("not-implemented"); return Ok(result);
        },
        _ => return Err("unsupported library operation"),
    };
    result["valid"] = json!(issues.is_empty());
    result["diagnostics"] = json!(issues);
    Ok(result)
}
