//! Candidate-owned selection; no recursive scan or loading executable declarations.
use crate::{diagnostic, files::LocalInputs, kind_info, ordered, parse_yaml};
use serde_json::Value;
use std::{collections::{BTreeMap, BTreeSet}, path::PathBuf};

pub struct Selection { pub root: PathBuf, pub project: Option<String>, pub files: Option<Vec<String>> }
#[derive(Clone)]
pub struct Manifest { pub file: String, pub kind: String, pub value: Value }
pub struct Assembly { pub mode: &'static str, pub documents: Vec<Manifest>, pub diagnostics: Vec<Value> }

fn hint(key: &str) -> Option<&'static str> {
    Some(match key {
        "actors" => "ActorSet", "agents" => "AgentSet", "agentDefinitions" => "AgentDefinitionSet",
        "capabilities" => "CapabilitySet", "permissions" => "PermissionSet", "tasks" => "TaskSet",
        "workflow" | "workflows" => "Workflow", "handoffs" => "HandoffSet", "context" => "ContextSet",
        "memory" => "MemorySet", "providers" => "ProviderSet", "modelProfiles" => "ModelProfileSet",
        "promptSets" => "PromptSet", "retrievalProfiles" => "RetrievalProfileSet", "events" => "EventSet",
        "extensions" => "ExtensionSet", _ => return None,
    })
}
impl Assembly {
    fn error(&mut self, code: &str, file: &str) { self.diagnostics.push(diagnostic(code, Some(file), None, None, None)); }
    fn finish(mut self) -> Self {
        self.documents.sort_by(|a, b| a.file.cmp(&b.file));
        ordered(&mut self.diagnostics, &["file", "path", "severity", "code", "kind", "keyword", "message"]); self
    }
    fn load(&mut self, inputs: &LocalInputs, seen: &mut BTreeSet<String>, file: &str, expected: Option<&str>) -> Option<Manifest> {
        let result = (|| {
            if !seen.insert(file.to_owned()) { return Err("NF-DISCOVERY-DUPLICATE-SOURCE"); }
            if seen.len() > 128 { return Err("NF-DISCOVERY-LIMIT-EXCEEDED"); }
            let value = parse_yaml(&inputs.read(file)?).map_err(|_| "NF-DISCOVERY-UNSAFE-SOURCE")?;
            if !value.is_object() { return Err("NF-DISCOVERY-UNSAFE-SOURCE"); }
            if value["specVersion"] != "0.1" { return Err("NF-DISCOVERY-UNSUPPORTED-VERSION"); }
            let kind = value["kind"].as_str().filter(|kind| kind_info(kind).is_some()).ok_or("NF-DISCOVERY-UNSUPPORTED-KIND")?;
            if expected.is_some_and(|expected| expected != kind) { return Err("NF-DISCOVERY-KIND-MISMATCH"); }
            Ok(Manifest { file: file.to_owned(), kind: kind.to_owned(), value })
        })();
        match result { Ok(document) => { self.documents.push(document.clone()); Some(document) }, Err(code) => { self.error(code, file); None } }
    }
}

pub fn discover(selection: &Selection) -> Assembly {
    let mut assembly = Assembly { mode: if selection.files.is_some() { "explicit-file-list" } else if selection.project.is_some() { "project-source-hints" } else { "directory-project" }, documents: Vec::new(), diagnostics: Vec::new() };
    let inputs = match LocalInputs::new(&selection.root) { Ok(inputs) => inputs, Err(_) => { assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>"); return assembly.finish(); } };
    let mut seen = BTreeSet::new();
    if let Some(files) = &selection.files {
        if selection.project.is_some() || files.is_empty() || files.len() > 128 { assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>"); return assembly.finish(); }
        let mut files = files.clone(); files.sort();
        for file in files { assembly.load(&inputs, &mut seen, &file, None); }
    } else {
        let project_path = match &selection.project {
            Some(path) => path.clone(),
            None => {
                let mut paths = Vec::new();
                for file in ["project.yaml", "project.yml"] {
                    match inputs.exists(file) { Ok(true) => paths.push(file), Ok(false) => {}, Err(_) => { assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>"); return assembly.finish(); } }
                }
                if paths.len() != 1 { assembly.error(if paths.is_empty() { "NF-DISCOVERY-NO-PROJECT" } else { "NF-DISCOVERY-MULTIPLE-PROJECTS" }, "<input>"); return assembly.finish(); }
                paths[0].to_owned()
            },
        };
        if let Some(project) = assembly.load(&inputs, &mut seen, &project_path, Some("Project")) {
            if let Some(hints) = project.value.get("manifests") {
                match hints.as_object() {
                    None => assembly.error("NF-DISCOVERY-UNSUPPORTED-HINT", &project.file),
                    Some(hints) if hints.contains_key("workflow") && hints.contains_key("workflows") => assembly.error("NF-DISCOVERY-DUPLICATE-SOURCE", &project.file),
                    Some(hints) => {
                        let mut sources = Vec::new();
                        for (key, value) in hints {
                            let Some(kind) = hint(key) else { assembly.error("NF-DISCOVERY-UNSUPPORTED-HINT", &project.file); continue; };
                            let values: Vec<&Value> = if key == "workflows" { value.as_array().map(|values| values.iter().collect()).unwrap_or_default() } else { vec![value] };
                            if values.is_empty() || values.iter().any(|value| !value.is_string()) { assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", &project.file); continue; }
                            for value in values { sources.push((value.as_str().unwrap_or("").to_owned(), kind)); }
                        }
                        if sources.len() + 1 > 128 { assembly.error("NF-DISCOVERY-LIMIT-EXCEEDED", &project.file); }
                        else if assembly.diagnostics.is_empty() { sources.sort(); for (file, kind) in sources { assembly.load(&inputs, &mut seen, &file, Some(kind)); } }
                    },
                }
            }
        }
    }
    let projects: Vec<_> = assembly.documents.iter().filter(|doc| doc.kind == "Project").cloned().collect();
    if projects.len() != 1 { assembly.error(if projects.is_empty() { "NF-DISCOVERY-NO-PROJECT" } else { "NF-DISCOVERY-MULTIPLE-PROJECTS" }, "<input>"); return assembly.finish(); }
    let project = &projects[0];
    let identity = project.value["project"]["id"].as_str().filter(|s| !s.is_empty());
    if identity.is_none() { assembly.error("NF-DISCOVERY-PROJECT-MISMATCH", &project.file); }
    let (mut singletons, mut workflows) = (BTreeMap::new(), BTreeSet::new());
    let mut documents = assembly.documents.clone(); documents.sort_by(|a, b| a.file.cmp(&b.file));
    for document in documents {
        if document.value["metadata"]["project"].as_str() != identity { assembly.error("NF-DISCOVERY-PROJECT-MISMATCH", &document.file); }
        if document.kind == "Workflow" {
            match document.value["workflow"]["id"].as_str().filter(|s| !s.is_empty()) {
                None => assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", &document.file),
                Some(id) if !workflows.insert(id.to_owned()) => assembly.error("NF-DISCOVERY-DUPLICATE-WORKFLOW", &document.file),
                _ => {},
            }
        } else if singletons.insert(document.kind.clone(), true).is_some() && document.kind != "Project" { assembly.error("NF-DISCOVERY-DUPLICATE-SINGLETON", &document.file); }
    }
    assembly.finish()
}
