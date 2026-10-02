#!/usr/bin/env node
import { parseArgs } from "node:util";
import { diagnostic, jsonLine } from "./diagnostics.js";
import { evaluate } from "./library.js";
import { type Envelope } from "./model.js";

function jsonRequested(args: string[]): boolean {
  const valueOptions = new Set(["--root", "--project", "--file", "--format"]);
  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (token === "--") break;
    if (token === "--format=json" || token === "--format" && args[index + 1] === "json") return true;
    if (valueOptions.has(token)) index++;
  }
  return false;
}
function usage(): Envelope {
  return { formatVersion: "0.4-draft", tool: { name: "nexflow-typescript-evaluation", version: "unreleased" },
    supportedSpecVersions: ["0.1"], command: null, success: false, exitCode: 2, inputMode: null,
    checks: { discovery: "not-run", schema: "not-run", coreProfile: "not-run", semantic: "not-run", extensionProfiles: "not-run" },
    executionAuthorized: false, diagnostics: [diagnostic("NEXFLOW-PROTOTYPE-USAGE", null)], truncated: false, result: null };
}
function main(args: string[]): { json: boolean; output: Envelope } {
  const json = jsonRequested(args);
  try {
    const command = args[0];
    if (command !== "validate" && command !== "inspect") return { json, output: usage() };
    const parsed = parseArgs({ args: args.slice(1), strict: true, allowPositionals: false, tokens: true, options: {
      root: { type: "string" }, project: { type: "string" }, file: { type: "string", multiple: true }, format: { type: "string" },
    } });
    const singleton = new Set<string>();
    for (const token of parsed.tokens) {
      if (token.kind !== "option") throw new Error("usage");
      if (token.name !== "file" && singleton.has(token.name)) throw new Error("usage");
      singleton.add(token.name);
    }
    const { root, project, file, format } = parsed.values;
    if (!root || project !== undefined && (!project || file !== undefined) ||
      file?.some(value => !value) || format !== undefined && format !== "json" && format !== "text") return { json, output: usage() };
    return { json: format === "json", output: evaluate(command, { root, project, files: file }) };
  } catch { return { json, output: usage() }; }
}
const { output, json } = main(process.argv.slice(2));
if (json) process.stdout.write(jsonLine(output));
else {
  for (const item of output.diagnostics) process.stdout.write(
    `${item.severity} ${item.code}: ${item.message} file=${JSON.stringify(item.file)} path=${JSON.stringify(item.path)} keyword=${JSON.stringify(item.keyword)}\n`);
  if (output.success) {
    process.stdout.write("Selected local manifest structure is valid; no execution is authorized.\n");
    if (output.result?.inspection) process.stdout.write(jsonLine(output.result.inspection));
  }
}
process.exitCode = output.exitCode;
