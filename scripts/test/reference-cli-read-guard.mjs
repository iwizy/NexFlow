import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Used alongside the existing no-runtime-deny harness. Code/module reads and
// fixed installed metadata are separate from application manifest reads.
const modules = path.resolve(process.env.NEXFLOW_TEST_MODULE_ROOT) + path.sep;
const root = process.env.NEXFLOW_TEST_READ_ROOT ? path.resolve(process.env.NEXFLOW_TEST_READ_ROOT) : null;
const metadata = new Set(["cli","validation"].map(name=>path.join(modules,"@nexflow",name,"package.json")));
const deny = () => { process.stderr.write("NEXFLOW-TEST-FORBIDDEN-READ\n"); throw Error("Unexpected application read"); };
const filename = file => path.resolve(file instanceof URL ? fileURLToPath(file) : String(file));
const code = name => name.startsWith(modules) && /\.(?:c?js|json)$/.test(name) && new Error().stack.includes("node:internal/modules/");
const input = name => root !== null && name.startsWith(root + path.sep) && /\.ya?ml$/.test(name);
for (const method of ["readFileSync","openSync"]) {
  const original = fs[method];
  fs[method] = (file,...args) => { const name=filename(file);return code(name)||metadata.has(name)||input(name) ? original(file,...args) : deny(); };
}
for (const method of ["lstatSync","statSync","realpathSync"]) {
  const original=fs[method];
  fs[method]=(file,...args)=>{const name=filename(file);return name.startsWith(modules)||root!==null&&(name===root||name.startsWith(root+path.sep)||root.startsWith(name.endsWith(path.sep)?name:name+path.sep)) ? original(file,...args) : deny();};
}
fs.readdirSync=deny;fs.readdir=deny;fs.createReadStream=deny;
for(const method of ["readFile","readdir","opendir"])fsPromises[method]=deny;
syncBuiltinESMExports();
