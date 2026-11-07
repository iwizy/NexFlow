import { readFileSync, rmSync, mkdirSync, lstatSync, realpathSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const directory = new URL("../",import.meta.url), library = new URL("../../validation/",import.meta.url);
const metadata = JSON.parse(readFileSync(new URL("package.json",directory),"utf8"));
if (process.versions.node !== metadata.engines.node) throw new Error("Use the exact selected Node version.");
rmSync(new URL("dist/",directory),{recursive:true,force:true});
execFileSync(process.execPath,[fileURLToPath(new URL("node_modules/typescript/bin/tsc",library)),"-p",fileURLToPath(new URL("tsconfig.json",directory))],{stdio:"inherit"});
// Development-only resolution of the actual adjacent compiled library. This
// link is ignored output, never an installation/distribution qualification.
const modules = new URL("node_modules/@nexflow/",directory), link = new URL("validation",modules);
mkdirSync(modules,{recursive:true});
try {
  lstatSync(link);
  if (realpathSync(link) !== realpathSync(library)) throw new Error("An existing development dependency must not be replaced.");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  symlinkSync(fileURLToPath(library),fileURLToPath(link),process.platform==="win32"?"junction":"dir");
}
console.log("Built the reference CLI source entry and declarations; final installation remains separate.");
