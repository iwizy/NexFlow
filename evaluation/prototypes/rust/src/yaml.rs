//! Bounded YAML-to-JSON conversion. Alias expansion is explicitly unsupported.
use serde_json::{Value, json};
use yaml_rust2::{Yaml, YamlLoader, parser::{Event, Parser}};

pub fn parse_yaml(text: &str) -> Result<Value, &'static str> {
    if text.len() > 1024 * 1024 { return Err("syntax"); }
    let mut parser = Parser::new_from_str(text);
    let (mut depth, mut documents, mut events) = (0usize, 0usize, 0usize);
    loop {
        let (event, _) = parser.next_token().map_err(|_| "syntax")?;
        events += 1;
        if events > 200000 { return Err("syntax"); }
        match event {
            Event::StreamEnd => break,
            Event::DocumentStart => { documents += 1; if documents > 1 { return Err("syntax"); } },
            Event::Alias(_) => return Err("syntax"),
            Event::SequenceStart(_, tag) | Event::MappingStart(_, tag) => {
                if tag.is_some() { return Err("syntax"); }
                depth += 1; if depth > 100 { return Err("syntax"); }
            },
            Event::SequenceEnd | Event::MappingEnd => { depth = depth.checked_sub(1).ok_or("syntax")?; },
            Event::Scalar(_, _, _, Some(_)) => return Err("syntax"),
            _ => {},
        }
    }
    let docs = YamlLoader::load_from_str(text).map_err(|error| if error.to_string().contains("duplicated key in mapping") { "duplicate-key" } else { "syntax" })?;
    if docs.len() != 1 { return Err("syntax"); }
    fn convert(value: &Yaml, depth: usize, visits: &mut usize) -> Result<Value, &'static str> {
        *visits += 1;
        if depth > 100 || *visits > 200000 { return Err("syntax"); }
        Ok(match value {
            Yaml::Null => Value::Null, Yaml::Boolean(v) => json!(v), Yaml::Integer(v) => json!(v),
            Yaml::Real(v) => { let number: f64 = v.parse().map_err(|_| "syntax")?; if !number.is_finite() { return Err("syntax"); } json!(number) },
            Yaml::String(v) => json!(v),
            Yaml::Array(v) => Value::Array(v.iter().map(|child| convert(child, depth + 1, visits)).collect::<Result<_, _>>()?),
            Yaml::Hash(v) => {
                let mut map = serde_json::Map::new();
                for (key, value) in v {
                    let key = key.as_str().ok_or("syntax")?;
                    if map.insert(key.to_owned(), convert(value, depth + 1, visits)?).is_some() { return Err("duplicate-key"); }
                }
                Value::Object(map)
            },
            _ => return Err("syntax"),
        })
    }
    convert(&docs[0], 0, &mut 0)
}
