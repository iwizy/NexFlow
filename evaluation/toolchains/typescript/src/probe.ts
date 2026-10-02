import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseDocument } from "yaml";

const packet = JSON.parse(readFileSync(process.argv[2], "utf8"));
const results = packet.cases.map((entry: any) => {
  if (entry.operation === "yaml") {
    const doc = parseDocument(entry.text, { version: "1.2", uniqueKeys: true, stringKeys: true, logLevel: "silent" });
    const valid = doc.errors.length === 0;
    return { id: entry.id, valid, ...(valid ? { value: doc.toJS({ maxAliasCount: 100 }) } : {}), diagnostics: valid ? [] : [{ category: "yaml", path: "", keyword: "parse" }] };
  }
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: true });
  addFormats(ajv);
  for (const [id, resource] of Object.entries(packet.resources)) ajv.addSchema(resource as any, id);
  try {
    const validate = ajv.compile(entry.schema);
    const valid = Boolean(validate(entry.instance));
    return { id: entry.id, valid, diagnostics: (validate.errors ?? []).map(error => ({ category: "schema", path: error.instancePath, keyword: error.keyword })) };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("resolve reference")) throw error;
    return { id: entry.id, valid: false, unresolvedReference: true, diagnostics: [{ category: "reference", path: "", keyword: "$ref" }] };
  }
});
process.stdout.write(JSON.stringify({ candidate: "typescript", scope: packet.scope, results }) + "\n");
