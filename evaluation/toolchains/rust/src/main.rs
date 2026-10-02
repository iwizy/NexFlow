use serde_json::{json, Value};
use std::{env, fs};
use yaml_rust2::{Yaml, YamlLoader};

fn yaml_json(value: &Yaml) -> Value {
    match value {
        Yaml::Null => Value::Null,
        Yaml::Boolean(v) => json!(v),
        Yaml::Integer(v) => json!(v),
        Yaml::Real(v) => json!(v.parse::<f64>().expect("finite number")),
        Yaml::String(v) => json!(v),
        Yaml::Array(v) => Value::Array(v.iter().map(yaml_json).collect()),
        Yaml::Hash(v) => {
            let mut map = serde_json::Map::new();
            for (key, value) in v {
                let key = key.as_str().expect("string key");
                map.insert(key.to_owned(), yaml_json(value));
            }
            Value::Object(map)
        }
        _ => panic!("unsupported YAML value"),
    }
}

fn main() {
    let bytes = fs::read(env::args().nth(1).expect("case path")).expect("case file");
    let packet: Value = serde_json::from_slice(&bytes).expect("case JSON");
    let mut registry = jsonschema::Registry::new();
    for (uri, resource) in packet["resources"].as_object().expect("resources") {
        registry = registry.add(uri, resource.clone()).expect("local schema URI");
    }
    let registry = registry.prepare().expect("local registry");
    let mut results = Vec::new();
    for entry in packet["cases"].as_array().expect("cases") {
        let id = &entry["id"];
        if entry["operation"] == "yaml" {
            match YamlLoader::load_from_str(entry["text"].as_str().expect("YAML")) {
                Ok(docs) if docs.len() == 1 => results.push(json!({"id":id,"valid":true,"value":yaml_json(&docs[0]),"diagnostics":[]})),
                _ => results.push(json!({"id":id,"valid":false,"diagnostics":[{"category":"yaml","path":"","keyword":"parse"}]})),
            }
            continue;
        }
        let options = jsonschema::draft202012::options()
            .with_registry(&registry)
            .should_validate_formats(true)
            .offline();
        match options.build(&entry["schema"]) {
            Ok(validator) => {
                let diagnostics: Vec<Value> = validator.iter_errors(&entry["instance"]).map(|error| {
                    let location = error.schema_path().to_string();
                    let keyword = location.rsplit('/').next().unwrap_or("");
                    json!({"category":"schema","path":error.instance_path().to_string(),"keyword":keyword})
                }).collect();
                results.push(json!({"id":id,"valid":diagnostics.is_empty(),"diagnostics":diagnostics}));
            }
            Err(error) => {
                let message = error.to_string();
                assert!(message.contains("unavailable.json"), "unexpected schema failure");
                results.push(json!({"id":id,"valid":false,"unresolvedReference":true,"diagnostics":[{"category":"reference","path":"","keyword":"$ref"}]}));
            }
        }
    }
    println!("{}", json!({"candidate":"rust","scope":packet["scope"],"results":results}));
}
