// Independent qualification assertions, never imported by native implementations.
import Ajv2020 from "ajv/dist/2020.js";
import {readFileSync} from "node:fs";
import {same,canonical} from "./diagnostic-requalification.mjs";
import {expectedDiagnostics} from "../runtime-diagnostic-projection-regression.mjs";
export const contractVersion="nf-validation-diagnostics-v1";
export const contractFiles=["scripts/runtime-validation-contract-run.mjs","scripts/lib/validation-diagnostic-contract.mjs","evaluation/contracts/validation-diagnostics-v1.schema.json"];
export const validatePublic=new Ajv2020({allErrors:true,strict:false}).compile(JSON.parse(readFileSync(new URL("../../evaluation/contracts/validation-diagnostics-v1.schema.json",import.meta.url))));
const contextFields=["kind","sourceKind","targetNamespace","targetId"];
const safeId=id=>typeof id==="string"&&id.length<=128&&/^[a-z][a-z0-9]*(?:[-_.][a-z0-9]+)*$/u.test(id)?id:"<redacted-id>";
export const publicKey=d=>[d.path??"",d.severity,d.code,d.category??"",d.meaning,...contextFields.map(k=>d.context[k]??"")].join("\0");
export function projectNative(native,issues=native.diagnostics) {
  const diagnostics=issues.map(issue=>{
    const category=issue.category??null,code=issue.code??"NF-DISCOVERY-UNSAFE-SOURCE";
    const path=typeof issue.missingProperty==="string"?(issue.instancePath??"")+"/"+issue.missingProperty.replaceAll("~","~0").replaceAll("/","~1"):issue.instancePath??null;
    return {severity:"error",code,category,path,meaning:[native.operation,code,category??"not-emitted"].join(":"),context:Object.fromEntries(contextFields.filter(k=>typeof issue[k]==="string").map(k=>[k,issue[k]]))};
  }).sort((a,b)=>publicKey(a)<publicKey(b)?-1:publicKey(a)>publicKey(b)?1:0);
  return {contractVersion,caseId:safeId(native.caseId),operation:native.operation,valid:native.valid,diagnostics:diagnostics.slice(0,200),truncated:diagnostics.length>200,
    executionAuthorized:false,checks:{runtime:"not-run",extensions:"not-run"},result:native.valid&&native.documentCount!==undefined?{documentCount:native.documentCount,workflowIds:native.workflowIds.map(safeId)}:null};
}
export function publicContractErrors(result,forbidden=[]) {
  if(!validatePublic(result)) return ["invalid-public-contract"];
  const errors=[];
  if(forbidden.some(v=>v&&JSON.stringify(result).includes(v))) errors.push("sensitive-output");
  const keys=result.diagnostics.map(publicKey);
  if(!same(keys,[...keys].sort())) errors.push("unordered-public-diagnostics");
  if(result.diagnostics.some(d=>d.meaning!==[result.operation,d.code,d.category??"not-emitted"].join(":"))) errors.push("wrong-diagnostic-meaning");
  return errors;
}
const dialect="https://json-schema.org/draft/2020-12/schema";
const local=(id,schema,value)=>({id,operation:"local-schema",input:{entryId:"urn:nf:public-contract",schemas:[{$schema:dialect,$id:"urn:nf:public-contract",...schema}],value}});
export function supplementalCases(documents) {
  return [local("public-oneof",{oneOf:[{const:"first"},{const:"second"}]},"NF_PRIVATE_VALUE_7f1c9"),
    local("public-anyof",{anyOf:[{const:"first"},{const:"second"}]},"NF_PRIVATE_VALUE_7f1c9"),
    local("public-not",{not:{type:"string"}},"NF_PRIVATE_VALUE_7f1c9"),
    local("public-required-pointer",{properties:{"a/b~c":{type:"string"}},required:["a/b~c"]},{}),
    local("public-local-limit",{type:"array",items:{type:"integer"}},Array(230).fill("NF_PRIVATE_VALUE_7f1c9")),
    {id:"public-duplicate-key",operation:"yaml-parse",input:{yaml:"key: NF_PRIVATE_VALUE_7f1c9\nkey: NF_PRIVATE_VALUE_7f1c9\n"}},
    {id:"public-yaml-syntax",operation:"yaml-parse",input:{yaml:"key: [NF_PRIVATE_VALUE_7f1c9"}},
    {id:"NF_PRIVATE_VALUE_7f1c9",operation:"yaml-parse",input:{yaml:"key: [NF_PRIVATE_VALUE_7f1c9"}},
    {id:"public-manifest-limit",operation:"manifest-schema",input:{file:"public-limit/actors.yaml"}},
    {id:"public-project-semantic-boundary",operation:"semantic-fragment",input:{documents}},
  ];
}
export function supplementalExpected(entry,native,bridgeObservation) {
  const d=(category,instancePath="")=>({code:"NF-SCHEMA",category,instancePath});
  let issues;
  switch(entry.id) {
    case "public-oneof":issues=[d("oneOf"),d("const"),d("const")];break;
    case "public-anyof":issues=[d("anyOf"),d("const"),d("const")];break;
    case "public-not":issues=[d("not")];break;
    case "public-required-pointer":issues=[{...d("required"),missingProperty:"a/b~c"}];break;
    case "public-local-limit":issues=Array.from({length:230},(_,i)=>d("type","/"+i));break;
    case "public-duplicate-key":issues=[{category:"duplicate-key"}];break;
    case "public-yaml-syntax":case "NF_PRIVATE_VALUE_7f1c9":issues=[{category:"syntax"}];break;
    case "public-manifest-limit":issues=expectedDiagnostics("original-230-invalid-actors").map(d=>({code:d.code,category:d.keyword,instancePath:d.path,kind:d.kind}));break;
    case "public-project-semantic-boundary":issues=bridgeObservation.diagnostics;break;
    default:throw new Error("missing supplemental expectation");
  }
  return projectNative({...native,valid:false},issues);
}
export function verifyPublicReport(report,catalog) {
  const errors=[];
  if(report.task!=="NF-102-01"||report.contractVersion!==contractVersion||report.taskOutcome!=="completed"||report.architectureOutcome!=="Draft/not-ready") errors.push("wrong-qualification-scope");
  if(report.publicLibrary.results.length!==catalog.cases.length+10||report.unsupportedCli.length!==16) errors.push("incomplete-public-scope");
  if(!same(report.publicLibrary.results.map(r=>[r.id,r.operation]),[...catalog.cases,...supplementalCases({})].map(r=>[r.id,r.operation]))) errors.push("incomplete-ordered-public-catalog");
  if(report.publicLibrary.runsPerCase!==4||report.publicLibrary.passed!==catalog.cases.length+10||report.publicLibrary.failed!==0) errors.push("invalid-public-run-counts");
  for(const result of report.publicLibrary.results) {
    if(result.errors.length||!result.repeatable||!result.inputUnchanged||publicContractErrors(result.public).length) errors.push("public-library-failure");
  }
  if(report.unsupportedCli.some(r=>r.exitCode!==2||!r.repeatable||r.actual.checks.discovery!=="not-run"||r.actual.result!==null)) errors.push("unsupported-profile-fallback");
  if(!same(report.scope,{libraryOperations:[...new Set(catalog.cases.map(c=>c.operation))],cliCommands:["validate","inspect"],cliProjectChecks:["discovery","schema","declared-only-inspection"],
    fullProjectSemantics:"unsupported",coreAndExtensionProfiles:"unsupported",runtime:"unsupported",productPublicAbi:"not-established",nativeDetails:"separate-experimental-api-only",targetAcceptance:"not-tested"})) errors.push("inflated-or-incomplete-scope");
  return [...new Set(errors)];
}
export const canonicalBytes=value=>JSON.stringify(canonical(value));
