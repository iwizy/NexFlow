// Versioned data boundary. The raw experiment API is a separate, non-portable channel.
import {evaluateLibraryCase, type LibraryCase} from "./library.js";
import {LocalInputs} from "./files.js";
import {displayId} from "./diagnostics.js";
import {knownKind, object, pointer, lexical, type Json} from "./model.js";
import {repositorySchemas, SchemaEngine} from "./schema.js";
import {parseYaml} from "./yaml.js";

export function evaluatePublicLibraryCase(entry: LibraryCase, root: string, schemas?: SchemaEngine): object {
  const native=evaluateLibraryCase(entry,root,schemas);
  let issues=native.diagnostics as Record<string, unknown>[];
  if(entry.operation==="local-schema") issues=new SchemaEngine(entry.input.schemas as Json[]).validateLocal(String(entry.input.entryId),entry.input.value).map(issue=>({...issue}));
  if(entry.operation==="manifest-schema") {
    const parsed=parseYaml(new LocalInputs(root).read(String(entry.input.file))),kind=object(parsed.value).kind;
    if(parsed.valid&&knownKind(kind)) issues=(schemas??repositorySchemas()).validate({file:String(entry.input.file),kind,value:object(parsed.value)}).map(issue=>({...issue}));
  }
  const diagnostics=issues.map(issue=>{
    const category=(issue.keyword??issue.category??null) as string|null;
    const code=(issue.code??"NF-DISCOVERY-UNSAFE-SOURCE") as string;
    let path=(issue.path??issue.instancePath??null) as string|null;
    if(typeof issue.missingProperty==="string") path=(path??"")+"/"+pointer(issue.missingProperty);
    const context=Object.fromEntries(["kind","sourceKind","targetNamespace","targetId"].filter(k=>typeof issue[k]==="string").map(k=>[k,issue[k]]));
    return {severity:"error",code,category,path,meaning:entry.operation+":"+code+":"+(category??"not-emitted"),context};
  });
  const key=(d:typeof diagnostics[number])=>[d.path??"",d.severity,d.code,d.category??"",d.meaning,...["kind","sourceKind","targetNamespace","targetId"].map(k=>d.context[k]??"")].join("\0");
  diagnostics.sort((a,b)=>lexical(key(a),key(b)));
  if(native.valid!==(diagnostics.length===0)) throw new Error("inconsistent validation result");
  return {contractVersion:"nf-validation-diagnostics-v1",caseId:displayId(native.caseId),operation:native.operation,valid:native.valid,
    diagnostics:diagnostics.slice(0,200),truncated:diagnostics.length>200,executionAuthorized:false,checks:{runtime:"not-run",extensions:"not-run"},
    result:native.valid&&native.documentCount!==undefined?{documentCount:native.documentCount,workflowIds:native.workflowIds?.map(displayId)}:null};
}
