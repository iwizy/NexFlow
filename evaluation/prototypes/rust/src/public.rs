//! Versioned data boundary; raw native experiments remain a distinct channel.
use crate::{SchemaEngine, Manifest, evaluate_library_case, display_id, ordered, pointer};
use crate::{files::LocalInputs, yaml::parse_yaml};
use serde_json::{Value, json};
use std::path::Path;

pub fn evaluate_public_library_case(entry: &Value, root: &Path, schemas: &SchemaEngine) -> Result<Value, &'static str> {
    let native=evaluate_library_case(entry,root,schemas)?;
    let operation=entry["operation"].as_str().ok_or("invalid operation")?;
    let input=&entry["input"];
    let mut issues=native["diagnostics"].as_array().ok_or("invalid diagnostics")?.clone();
    if operation=="local-schema" {
        issues=SchemaEngine::validate_local_public(input["schemas"].as_array().ok_or("invalid schemas")?,input["entryId"].as_str().ok_or("invalid schema id")?,&input["value"]);
    }
    if operation=="manifest-schema" {
        let file=input["file"].as_str().ok_or("invalid file")?;
        if let Ok(value)=parse_yaml(&LocalInputs::new(root)?.read(file)?) {
            if let Some(kind)=value["kind"].as_str().filter(|kind| crate::kind_info(kind).is_some()) {
                issues=schemas.validate(&Manifest{file:file.to_owned(),kind:kind.to_owned(),value:value.clone()});
            }
        }
    }
    let mut diagnostics=Vec::new();
    for issue in issues {
        let category=issue.get("keyword").or_else(||issue.get("category")).cloned().unwrap_or(Value::Null);
        let code=issue["code"].as_str().unwrap_or("NF-DISCOVERY-UNSAFE-SOURCE");
        let mut path=issue.get("path").or_else(||issue.get("instancePath")).cloned().unwrap_or(Value::Null);
        if let Some(missing)=issue["missingProperty"].as_str() { path=json!(path.as_str().unwrap_or("").to_owned()+&pointer(missing)); }
        let mut context=json!({});
        for field in ["kind","sourceKind","targetNamespace","targetId"] { if issue[field].is_string() { context[field]=issue[field].clone(); } }
        let sort_context=["kind","sourceKind","targetNamespace","targetId"].map(|f|context[f].as_str().unwrap_or("")).join("\0");
        diagnostics.push(json!({"severity":"error","code":code,"category":category,"path":path,
            "meaning":format!("{}:{}:{}",operation,code,category.as_str().unwrap_or("not-emitted")),"context":context,"sortContext":sort_context}));
    }
    ordered(&mut diagnostics,&["path","severity","code","category","meaning","sortContext"]);
    for d in &mut diagnostics { d.as_object_mut().ok_or("invalid diagnostic")?.remove("sortContext"); }
    if native["valid"].as_bool()!=Some(diagnostics.is_empty()) { return Err("inconsistent validation result"); }
    let truncated=diagnostics.len()>200;diagnostics.truncate(200);
    let result=if native["valid"]==true&&native.get("documentCount").is_some() {json!({"documentCount":native["documentCount"],"workflowIds":native["workflowIds"].as_array().ok_or("invalid workflow ids")?.iter().map(display_id).collect::<Vec<_>>()})} else {Value::Null};
    Ok(json!({"contractVersion":"nf-validation-diagnostics-v1","caseId":display_id(&native["caseId"]),"operation":operation,"valid":native["valid"],
        "diagnostics":diagnostics,"truncated":truncated,"executionAuthorized":false,"checks":{"runtime":"not-run","extensions":"not-run"},"result":result}))
}
