import { parseSource, projectSources, checkAssociation, type Diagnostic, type Discovery, type Kind, type Manifest } from "@nexflow/validation";
import { InputFailure, LocalInputs } from "./files.js";

export interface WorkspaceSelection { root: string; project?: string; files?: string[] }
const lexical = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
function failure(code: string, file: string | null = "<input>"): Diagnostic {
  const safe = typeof file === "string" && file.length <= 512 && !/[:\\\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(file) && !file.startsWith("/") && !file.split("/").some(p=>!p||p==="."||p==="..");
  return { severity: "error", code, message: "Selected manifest input does not satisfy discovery policy.", file: file === null ? null : safe ? file : "<redacted-source>", kind: null, path: null, keyword: null, related: [] };
}
/** Explicit read-only workspace facade. This is not a CLI executable or an OS sandbox. */
export function readWorkspace(selection: WorkspaceSelection): Discovery {
  const mode = selection?.files ? "explicit-file-list" : selection?.project ? "project-source-hints" : "directory-project";
  const documents: Manifest[] = [], errors: Diagnostic[] = [], seen = new Set<string>();
  const finish = (): Discovery => ({ mode, documents: documents.sort((a,b)=>lexical(a.file,b.file)), diagnostics: errors.sort((a,b)=>lexical(JSON.stringify(a),JSON.stringify(b))) });
  if (!selection || typeof selection.root !== "string" || !selection.root || (selection.project !== undefined && (typeof selection.project !== "string" || !selection.project)) || (selection.files !== undefined && (!Array.isArray(selection.files) || selection.files.some(x=>typeof x!=="string")))) { errors.push(failure("NF-DISCOVERY-UNSAFE-SOURCE")); return finish(); }
  if (selection.files && (selection.project !== undefined || !selection.files.length || selection.files.length > 128)) { errors.push(failure("NF-DISCOVERY-UNSAFE-SOURCE")); return finish(); }
  let input: LocalInputs;
  try { input = new LocalInputs(selection.root); } catch { errors.push(failure("NF-DISCOVERY-UNSAFE-SOURCE")); return finish(); }
  function load(file: string, kind?: Kind): Manifest | undefined {
    if (seen.has(file)) { errors.push(failure("NF-DISCOVERY-DUPLICATE-SOURCE",file)); return undefined; }
    seen.add(file); if (seen.size > 128) { errors.push(failure("NF-DISCOVERY-LIMIT-EXCEEDED")); return undefined; }
    try {
      const parsed = parseSource(file,input.read(file),kind); errors.push(...parsed.diagnostics);
      if(parsed.document)documents.push(parsed.document);return parsed.document;
    } catch(error) { errors.push(failure(error instanceof InputFailure ? error.code : "NF-DISCOVERY-UNSAFE-SOURCE",file)); return undefined; }
  }
  if(selection.files)for(const file of [...selection.files].sort(lexical))load(file);
  else {
    let projectPath=selection.project;
    if(!projectPath) {
      try {
        const entries=(["project.yaml","project.yml"] as const).filter(file=>input.exists(file));
        if(entries.length!==1){errors.push(failure(entries.length ? "NF-DISCOVERY-MULTIPLE-PROJECTS" : "NF-DISCOVERY-NO-PROJECT"));return finish();}
        projectPath=entries[0];
      } catch { errors.push(failure("NF-DISCOVERY-UNSAFE-SOURCE"));return finish(); }
    }
    const project=load(projectPath,"Project");
    if(project){const plan=projectSources(project);errors.push(...plan.diagnostics);if(!errors.length)for(const source of plan.sources)load(source.file,source.kind);}
  }
  errors.push(...checkAssociation(documents));return finish();
}
