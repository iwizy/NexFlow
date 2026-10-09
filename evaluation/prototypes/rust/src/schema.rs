//! Explicit Draft 2020-12, reviewed local resources, no schema retrieval features.
use crate::{Manifest, diagnostic, kind_info, ordered, pointer};
use jsonschema::{Validator, error::ValidationErrorKind};
use serde_json::{Value, json};
use std::{collections::{BTreeMap, BTreeSet}, fs, io::Read, path::Path};

pub struct SchemaEngine { validators: BTreeMap<String, Validator>, fields: BTreeSet<String> }

fn fields(schemas: &[Value]) -> BTreeSet<String> {
    fn visit(value: &Value, result: &mut BTreeSet<String>) {
        if let Some(map) = value.as_object() {
            if let Some(props) = value["properties"].as_object() { result.extend(props.keys().cloned()); }
            for child in map.values() { visit(child, result); }
        } else if let Some(values) = value.as_array() { for child in values { visit(child, result); } }
    }
    let mut result = BTreeSet::new(); for schema in schemas { visit(schema, &mut result); } result
}

fn build(schemas: &[Value], schema: &Value) -> Result<Validator, &'static str> {
    let mut registry = jsonschema::Registry::new();
    let mut ids = BTreeSet::new();
    for resource in schemas {
        let id = resource["$id"].as_str().ok_or("invalid schema id")?;
        if !ids.insert(id) || resource["$schema"] != "https://json-schema.org/draft/2020-12/schema" { return Err("invalid local dialect"); }
        registry = registry.add(id, resource.clone()).map_err(|_| "invalid schema resource")?;
    }
    let registry = registry.prepare().map_err(|_| "unresolved-local-schema")?;
    jsonschema::draft202012::options().with_registry(&registry).should_validate_formats(true).offline().build(schema).map_err(|_| "unresolved-local-schema")
}

fn issues(validator: &Validator, value: &Value, fields: &BTreeSet<String>) -> Vec<Value> {
    let mut result = Vec::new();
    for error in validator.iter_errors(value).take(201) {
        let raw = error.instance_path().to_string();
        let mut path = String::new();
        for encoded in raw.split('/').skip(1) {
            let part = encoded.replace("~1", "/").replace("~0", "~");
            path.push_str(&pointer(if fields.contains(&part) || (!part.is_empty() && part.bytes().all(|b| b.is_ascii_digit())) { &part } else { "<redacted>" }));
        }
        if path.len() > 512 { path = "<redacted-field>".to_owned(); }
        // Use structured kinds rather than copying potentially sensitive library messages.
        let native_category = error.kind().keyword();
        let schema_path = error.schema_path().to_string();
        // items:false rejects an array member natively; the common contract locates
        // the containing array constraint. Preserve the native keyword/path as well.
        let items_false = matches!(error.kind(), ValidationErrorKind::FalseSchema) && schema_path.ends_with("/items");
        let category = if items_false { "items" } else { native_category };
        let native_path = path.clone();
        if items_false { path = path.rsplit_once('/').map(|(parent, _)| parent.to_owned()).unwrap_or_default(); }
        let mut issue = json!({"code":"NF-SCHEMA","category":category,"instancePath":path});
        if items_false { issue["nativeDiagnostic"] = json!({"category":native_category,"instancePath":native_path}); }
        if let ValidationErrorKind::Required { property } = error.kind() {
            let missing = property.as_str().unwrap_or("");
            issue["missingProperty"] = json!(if fields.contains(missing) { missing } else { "<redacted>" });
        }
        result.push(issue);
    }
    ordered(&mut result, &["instancePath", "category", "missingProperty"]); result
}

impl SchemaEngine {
    /// Reviewed resources travel with the binary; inputs cannot redirect them.
    pub fn bundled() -> Result<Self, &'static str> {
        let sources = [
            include_str!("../../../../schemas/actors.schema.json"),
            include_str!("../../../../schemas/agent-definitions.schema.json"),
            include_str!("../../../../schemas/agents.schema.json"),
            include_str!("../../../../schemas/capabilities.schema.json"),
            include_str!("../../../../schemas/common.schema.json"),
            include_str!("../../../../schemas/context.schema.json"),
            include_str!("../../../../schemas/events.schema.json"),
            include_str!("../../../../schemas/extensions.schema.json"),
            include_str!("../../../../schemas/handoffs.schema.json"),
            include_str!("../../../../schemas/memory.schema.json"),
            include_str!("../../../../schemas/model-profiles.schema.json"),
            include_str!("../../../../schemas/permissions.schema.json"),
            include_str!("../../../../schemas/project.schema.json"),
            include_str!("../../../../schemas/prompt-sets.schema.json"),
            include_str!("../../../../schemas/providers.schema.json"),
            include_str!("../../../../schemas/retrieval-profiles.schema.json"),
            include_str!("../../../../schemas/tasks.schema.json"),
            include_str!("../../../../schemas/workflow.schema.json"),
        ];
        let schemas = sources.iter().map(|text| serde_json::from_str::<Value>(text).map_err(|_| "invalid bundled schema")).collect::<Result<Vec<_>, _>>()?;
        Self::new(&schemas)
    }
    pub fn repository(directory: &Path) -> Result<Self, &'static str> {
        let mut schemas = Vec::new();
        let mut paths = fs::read_dir(directory).map_err(|_| "local schema unavailable")?.map(|entry| entry.map(|e| e.path())).collect::<Result<Vec<_>, _>>().map_err(|_| "local schema unavailable")?;
        paths.sort();
        for path in paths {
            if !path.file_name().and_then(|s| s.to_str()).is_some_and(|s| s.ends_with(".schema.json")) { continue; }
            let info = fs::symlink_metadata(&path).map_err(|_| "local schema unavailable")?;
            if !info.is_file() || info.len() > 1024 * 1024 { return Err("local schema unavailable"); }
            let file = fs::File::open(path).map_err(|_| "local schema unavailable")?;
            let mut bytes = Vec::new(); file.take(1024 * 1024 + 1).read_to_end(&mut bytes).map_err(|_| "local schema unavailable")?;
            if bytes.len() > 1024 * 1024 { return Err("local schema unavailable"); }
            schemas.push(serde_json::from_slice::<Value>(&bytes).map_err(|_| "invalid schema JSON")?);
        }
        Self::new(&schemas)
    }
    pub fn new(schemas: &[Value]) -> Result<Self, &'static str> {
        let mut validators = BTreeMap::new();
        for schema in schemas {
            if let Some(kind) = schema["properties"]["kind"]["const"].as_str().filter(|kind| kind_info(kind).is_some()) {
                if validators.insert(kind.to_owned(), build(schemas, schema)?).is_some() { return Err("duplicate schema kind"); }
            }
        }
        if validators.len() != 17 { return Err("incomplete schema set"); }
        Ok(Self { validators, fields: fields(schemas) })
    }
    pub fn validate_value(&self, kind: &str, value: &Value) -> Result<Vec<Value>, &'static str> {
        Ok(issues(self.validators.get(kind).ok_or("unknown kind")?, value, &self.fields))
    }
    pub fn validate(&self, document: &Manifest) -> Vec<Value> {
        match self.validate_value(&document.kind, &document.value) {
            Ok(issues) => issues.iter().map(|issue| {
                let mut path = issue["instancePath"].as_str().unwrap_or("").to_owned();
                if let Some(missing) = issue["missingProperty"].as_str() { path.push_str(&pointer(missing)); }
                diagnostic("NF-SCHEMA", Some(&document.file), Some(&document.kind), Some(&path), issue["category"].as_str())
            }).collect(),
            Err(_) => vec![diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", None, None, None, None)],
        }
    }
    pub fn validate_local(schemas: &[Value], entry_id: &str, value: &Value) -> Vec<Value> {
        let schema = schemas.iter().find(|schema| schema["$id"] == entry_id);
        match schema.and_then(|schema| build(schemas, schema).ok()) {
            Some(validator) => issues(&validator, value, &fields(schemas)),
            None => vec![json!({"code":"NF-SCHEMA","category":"unresolved-local-schema"})],
        }
    }
}
