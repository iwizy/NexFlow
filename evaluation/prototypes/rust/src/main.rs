use nexflow_rust_evaluation::{Selection, SchemaEngine, diagnostic, envelope, evaluate, usage};
use serde_json::{Value, json};
use std::{collections::BTreeSet, io::{self, Write}, path::PathBuf};

fn parse(args: &[String]) -> Option<(String, Selection, bool)> {
    let command = args.first()?.as_str(); if !matches!(command, "validate" | "inspect") { return None; }
    let (mut root, mut project, mut files, mut format) = (None, None, Vec::new(), None);
    let mut seen = BTreeSet::new(); let mut index = 1;
    while index < args.len() {
        let token = &args[index];
        let (option, value) = if let Some(pair) = token.split_once('=') { index += 1; (pair.0, pair.1) } else { let value = args.get(index + 1)?; index += 2; (token.as_str(), value.as_str()) };
        if !matches!(option, "--root" | "--project" | "--file" | "--format") || value.is_empty() || (option != "--file" && !seen.insert(option.to_owned())) { return None; }
        match option { "--root" => root = Some(PathBuf::from(value)), "--project" => project = Some(value.to_owned()), "--file" => files.push(value.to_owned()), "--format" => format = Some(value.to_owned()), _ => return None }
    }
    if project.is_some() && !files.is_empty() || format.as_deref().is_some_and(|format| !matches!(format, "json" | "text")) { return None; }
    Some((command.to_owned(), Selection { root: root?, project, files: if files.is_empty() { None } else { Some(files) } }, format.as_deref() == Some("json")))
}

fn json_requested(args: &[String]) -> bool {
    let mut index = 0;
    while index < args.len() {
        let token = &args[index]; if token == "--" { break; }
        if token == "--format=json" || token == "--format" && args.get(index + 1).is_some_and(|value| value == "json") { return true; }
        index += if matches!(token.as_str(), "--root" | "--project" | "--file" | "--format") { 2 } else { 1 };
    }
    false
}
fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut use_json = json_requested(&args);
    let output = match parse(&args) {
        None => usage(),
        Some((command, selection, format)) => {
            use_json = format;
            // Fixed reviewed checkout schemas; manifest inputs cannot choose a schema root.
            let directory = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../schemas");
            match SchemaEngine::repository(&directory) {
                Ok(schemas) => evaluate(&command, &selection, &schemas),
                Err(_) => { let mut value = envelope(Some(&command)); value["exitCode"] = json!(4); value["diagnostics"] = json!([diagnostic("NEXFLOW-PROTOTYPE-INTERNAL", None, None, None, None)]); value },
            }
        },
    };
    let mut stdout = io::stdout().lock();
    let write = if use_json { writeln!(stdout, "{output}") } else {
        let mut text = String::new();
        for issue in output["diagnostics"].as_array().unwrap_or(&Vec::new()) {
            text.push_str(&format!("error {}: {} file={} path={} keyword={}\n", issue["code"].as_str().unwrap_or(""), issue["message"].as_str().unwrap_or(""), issue["file"], issue["path"], issue["keyword"]));
        }
        if output["success"] == true { text.push_str("Selected local manifest structure is valid; no execution is authorized.\n"); if output["result"]["inspection"] != Value::Null { text.push_str(&format!("{}\n", output["result"]["inspection"])); } }
        stdout.write_all(text.as_bytes())
    };
    std::process::exit(if write.is_err() { 4 } else { output["exitCode"].as_i64().unwrap_or(4) as i32 });
}

#[cfg(test)] mod tests {
    use super::*;
    fn args(text: &[&str]) -> Vec<String> { text.iter().map(|s| s.to_string()).collect() }
    #[test] fn only_supported_commands() { for command in ["run", "help", "init", "graph"] { assert!(parse(&args(&[command, "--root", "input"])).is_none()); } }
    #[test] fn rejects_duplicate_and_mixed_options() { for tail in [vec!["--root", "again"], vec!["--project", "project.yaml", "--file", "actors.yaml"], vec!["--format", "xml"], vec!["--unknown", "x"]] { let mut input = vec!["validate", "--root", "input"]; input.extend(tail); assert!(parse(&args(&input)).is_none()); } }
    #[test] fn json_format_is_not_an_option_value() { assert!(!json_requested(&args(&["validate", "--root", "--format=json"]))); assert!(json_requested(&args(&["run", "--format=json"]))); }
}
