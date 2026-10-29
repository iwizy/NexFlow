import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const directory = new URL("../", import.meta.url);
const repository = new URL("../../", directory);
const read = p => JSON.parse(readFileSync(p, "utf8"));
const metadata = read(new URL("package.json", directory));
if (process.versions.node !== metadata.engines.node) throw new Error("Use the exact selected Node version to build this package.");
const snapshot = read(new URL("schema-snapshot.json", directory));
const sha = data => createHash("sha256").update(data).digest("hex");
const values = snapshot.schemas.map(item => {
  const bytes = readFileSync(new URL("schemas/" + item.file, repository));
  if (sha(bytes) !== item.sha256) throw new Error("Schema snapshot drift; review and requalify before changing it.");
  return JSON.parse(bytes);
});
const rulesBytes = readFileSync(new URL("evaluation/prototypes/typescript/semantic-rules.json", repository));
if (sha(rulesBytes) !== snapshot.semanticRulesSha256) throw new Error("Semantic fragment rules drifted.");
const rules = JSON.parse(rulesBytes);
const generated = 'import { type Json } from "./model.js";\n'
  + "export const schemaValues: Json[] = " + JSON.stringify(values) + ";\n"
  + "export const semanticRules: {declarations: string[][]; references: string[][]} = " + JSON.stringify({ declarations: rules.declarations, references: rules.references }) + ";\n"
  + "export const snapshot = " + JSON.stringify(snapshot) + ";\n";
writeFileSync(new URL("src/schema-data.ts", directory), generated);
rmSync(new URL("dist/", directory), { recursive: true, force: true });
execFileSync(process.execPath, [fileURLToPath(new URL("node_modules/typescript/bin/tsc", directory)), "-p", fileURLToPath(new URL("tsconfig.json", directory))], { stdio: "inherit" });
mkdirSync(new URL("dist/schemas/", directory), { recursive: true });
for (const item of snapshot.schemas) copyFileSync(new URL("schemas/" + item.file, repository), new URL("dist/schemas/" + item.file, directory));
copyFileSync(new URL("schema-snapshot.json", directory), new URL("dist/schema-snapshot.json", directory));
copyFileSync(new URL("LICENSE", repository), new URL("LICENSE", directory));
console.log(`Built ${metadata.name}: ${snapshot.schemas.length} exact local schemas, pure entry and declarations.`);
