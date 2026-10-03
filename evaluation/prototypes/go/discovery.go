package candidate

import "sort"

type Assembly struct {
	Mode        string
	Documents   []Manifest
	Diagnostics []map[string]any
}

var hints = map[string]string{"actors": "ActorSet", "agents": "AgentSet", "agentDefinitions": "AgentDefinitionSet", "capabilities": "CapabilitySet", "permissions": "PermissionSet", "tasks": "TaskSet", "workflow": "Workflow", "workflows": "Workflow", "handoffs": "HandoffSet", "context": "ContextSet", "memory": "MemorySet", "providers": "ProviderSet", "modelProfiles": "ModelProfileSet", "promptSets": "PromptSet", "retrievalProfiles": "RetrievalProfileSet", "events": "EventSet", "extensions": "ExtensionSet"}

func bothWorkflowHints(values map[string]any) bool {
	_, single := values["workflow"]
	_, multiple := values["workflows"]
	return single && multiple
}

func (assembly *Assembly) error(code, file string) {
	assembly.Diagnostics = append(assembly.Diagnostics, Diagnostic(code, file, nil, nil, nil))
}
func (assembly *Assembly) finish() Assembly {
	sort.Slice(assembly.Documents, func(i, j int) bool { return assembly.Documents[i].File < assembly.Documents[j].File })
	ordered(assembly.Diagnostics, "file", "path", "severity", "code", "kind", "keyword", "message")
	return *assembly
}
func (assembly *Assembly) load(inputs *LocalInputs, seen map[string]bool, file, expected string) *Manifest {
	if seen[file] {
		assembly.error("NF-DISCOVERY-DUPLICATE-SOURCE", file)
		return nil
	}
	seen[file] = true
	if len(seen) > 128 {
		assembly.error("NF-DISCOVERY-LIMIT-EXCEEDED", file)
		return nil
	}
	bytes, err := inputs.Read(file)
	if err != nil {
		assembly.error(failureCode(err), file)
		return nil
	}
	value, err := ParseYAML(bytes)
	if err != nil {
		assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", file)
		return nil
	}
	data, ok := value.(map[string]any)
	if !ok {
		assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", file)
		return nil
	}
	if data["specVersion"] != "0.1" {
		assembly.error("NF-DISCOVERY-UNSUPPORTED-VERSION", file)
		return nil
	}
	name := text(data["kind"])
	if _, ok := kinds[name]; !ok {
		assembly.error("NF-DISCOVERY-UNSUPPORTED-KIND", file)
		return nil
	}
	if expected != "" && name != expected {
		assembly.error("NF-DISCOVERY-KIND-MISMATCH", file)
		return nil
	}
	document := Manifest{file, name, data}
	assembly.Documents = append(assembly.Documents, document)
	return &document
}

// Discover follows only the supplied file list or explicit Project declaration hints.
func Discover(selection Selection) Assembly {
	mode := "directory-project"
	if selection.Files != nil {
		mode = "explicit-file-list"
	} else if selection.Project != nil {
		mode = "project-source-hints"
	}
	assembly := Assembly{mode, []Manifest{}, []map[string]any{}}
	inputs, err := NewLocalInputs(selection.Root)
	if err != nil {
		assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>")
		return assembly.finish()
	}
	defer inputs.Close()
	seen := map[string]bool{}
	if selection.Files != nil {
		if selection.Project != nil || len(selection.Files) == 0 || len(selection.Files) > 128 {
			assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>")
			return assembly.finish()
		}
		files := append([]string{}, selection.Files...)
		sort.Strings(files)
		for _, file := range files {
			assembly.load(inputs, seen, file, "")
		}
	} else {
		projectPath := ""
		if selection.Project != nil {
			projectPath = *selection.Project
		} else {
			paths := []string{}
			for _, file := range []string{"project.yaml", "project.yml"} {
				exists, err := inputs.Exists(file)
				if err != nil {
					assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", "<input>")
					return assembly.finish()
				}
				if exists {
					paths = append(paths, file)
				}
			}
			if len(paths) != 1 {
				code := "NF-DISCOVERY-MULTIPLE-PROJECTS"
				if len(paths) == 0 {
					code = "NF-DISCOVERY-NO-PROJECT"
				}
				assembly.error(code, "<input>")
				return assembly.finish()
			}
			projectPath = paths[0]
		}
		if project := assembly.load(inputs, seen, projectPath, "Project"); project != nil {
			if raw, exists := project.Value["manifests"]; exists {
				values, ok := raw.(map[string]any)
				if !ok {
					assembly.error("NF-DISCOVERY-UNSUPPORTED-HINT", project.File)
				} else if bothWorkflowHints(values) {
					assembly.error("NF-DISCOVERY-DUPLICATE-SOURCE", project.File)
				} else {
					type source struct{ file, kind string }
					sources := []source{}
					keys := []string{}
					for key := range values {
						keys = append(keys, key)
					}
					sort.Strings(keys)
					for _, key := range keys {
						expected, known := hints[key]
						if !known {
							assembly.error("NF-DISCOVERY-UNSUPPORTED-HINT", project.File)
							continue
						}
						selected := []any{values[key]}
						if key == "workflows" {
							selected = array(values[key])
						}
						valid := len(selected) > 0
						for _, file := range selected {
							if _, ok := file.(string); !ok {
								valid = false
							}
						}
						if !valid {
							assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", project.File)
							continue
						}
						for _, file := range selected {
							sources = append(sources, source{text(file), expected})
						}
					}
					if len(sources)+1 > 128 {
						assembly.error("NF-DISCOVERY-LIMIT-EXCEEDED", project.File)
					} else if len(assembly.Diagnostics) == 0 {
						sort.Slice(sources, func(i, j int) bool {
							if sources[i].file == sources[j].file {
								return sources[i].kind < sources[j].kind
							}
							return sources[i].file < sources[j].file
						})
						for _, source := range sources {
							assembly.load(inputs, seen, source.file, source.kind)
						}
					}
				}
			}
		}
	}
	projects := []Manifest{}
	for _, document := range assembly.Documents {
		if document.Kind == "Project" {
			projects = append(projects, document)
		}
	}
	if len(projects) != 1 {
		code := "NF-DISCOVERY-MULTIPLE-PROJECTS"
		if len(projects) == 0 {
			code = "NF-DISCOVERY-NO-PROJECT"
		}
		assembly.error(code, "<input>")
		return assembly.finish()
	}
	identity := text(object(projects[0].Value["project"])["id"])
	if identity == "" {
		assembly.error("NF-DISCOVERY-PROJECT-MISMATCH", projects[0].File)
	}
	singletons, workflows := map[string]bool{}, map[string]bool{}
	for _, document := range assembly.Documents {
		if object(document.Value["metadata"])["project"] != identity {
			assembly.error("NF-DISCOVERY-PROJECT-MISMATCH", document.File)
		}
		if document.Kind == "Workflow" {
			id := text(object(document.Value["workflow"])["id"])
			if id == "" {
				assembly.error("NF-DISCOVERY-UNSAFE-SOURCE", document.File)
			} else if workflows[id] {
				assembly.error("NF-DISCOVERY-DUPLICATE-WORKFLOW", document.File)
			} else {
				workflows[id] = true
			}
		} else {
			if singletons[document.Kind] && document.Kind != "Project" {
				assembly.error("NF-DISCOVERY-DUPLICATE-SINGLETON", document.File)
			}
			singletons[document.Kind] = true
		}
	}
	return assembly.finish()
}
