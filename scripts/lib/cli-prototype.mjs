import path from "node:path";
import { parseArgs } from "node:util";

const version = "NexFlow repository CLI prototype (unreleased; spec 0.1)";
const reservedCommands = new Set(["validate", "inspect", "graph", "init"]);
const unsupportedCodes = new Set([
  "NF-DISCOVERY-UNSUPPORTED-VERSION",
  "NF-DISCOVERY-UNSUPPORTED-KIND",
  "NF-DISCOVERY-UNSUPPORTED-HINT"
]);
const help = `${version}
Not a reference CLI release; no runtime or conformance claim.

Usage:
  npm run cli-prototype -- --help
  npm run cli-prototype -- --version
  npm run cli-prototype -- discover --root <directory> [--project <file> | --file <file> ...]

discover builds a source inventory only. Schema and semantic validation are not performed.
With no source flag, exactly one root project.yaml or project.yml must exist.
validate, inspect, graph, and init are not implemented.
`;

function parseRequest(args) {
  const { values, positionals, tokens } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    tokens: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      root: { type: "string" },
      project: { type: "string" },
      file: { type: "string", multiple: true }
    }
  });
  const seen = new Set();
  for (const token of tokens) {
    if (token.kind !== "option" || token.name === "file") continue;
    if (seen.has(token.name)) throw new Error("duplicate option");
    seen.add(token.name);
  }
  const [command] = positionals;
  if (positionals.length > 1 || (command && command !== "discover" && !reservedCommands.has(command))) {
    throw new Error("unknown command or positional argument");
  }
  if (values.project !== undefined && values.file !== undefined) throw new Error("conflicting modes");
  if (values.help && values.version) throw new Error("conflicting informational options");
  if (values.help || values.version || args.length === 0) {
    if (values.root !== undefined || values.project !== undefined || values.file !== undefined || (values.version && command)) {
      throw new Error("unexpected input options");
    }
    return { command: values.version ? "version" : "help" };
  }
  if (!command) throw new Error("missing command");
  if (reservedCommands.has(command)) return { command };
  if (!values.root?.trim() || values.project?.trim() === "" || values.file?.some((file) => !file.trim())) {
    throw new Error("missing input");
  }
  return { command, root: values.root, projectPath: values.project, sources: values.file };
}

function sourceLabel(source) {
  if (typeof source !== "string" || source.length > 512) return "<redacted-source>";
  if (source.startsWith("<") && source.endsWith(">")) return "<input>";
  const normalized = path.posix.normalize(source);
  if (path.posix.isAbsolute(source) || source.includes("\\") || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(source)
    || normalized === ".." || normalized.startsWith("../")) return "<redacted-source>";
  return JSON.stringify(source).replace(/[\u007f-\uffff]/gu,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

async function discoverInput({ root, projectPath, sources }) {
  const { discoverFromDirectory, discoverFromProjectHints, discoverManifestAssembly } =
    await import("./manifest-discovery.mjs");
  if (sources) return discoverManifestAssembly({ root, sources });
  if (projectPath) return discoverFromProjectHints({ root, projectPath });
  return discoverFromDirectory({ root });
}

export async function runCliPrototype(args, {
  stdout = process.stdout,
  stderr = process.stderr,
  discover = discoverInput
} = {}) {
  let request;
  try {
    request = parseRequest(args);
  } catch {
    stderr.write("Invalid prototype usage. Run with --help for supported commands and options.\n");
    return 2;
  }
  if (request.command === "help") {
    stdout.write(help);
    return 0;
  }
  if (request.command === "version") {
    stdout.write(`${version}\n`);
    return 0;
  }
  if (reservedCommands.has(request.command)) {
    stderr.write(`${request.command} is not implemented in the repository CLI prototype.\n`);
    return 3;
  }

  try {
    const result = await discover(request);
    if (!result.valid) {
      for (const entry of result.diagnostics) {
        stderr.write(`${entry.code} ${sourceLabel(entry.source)}: ${entry.message}\n`);
      }
      return result.diagnostics.some((entry) => unsupportedCodes.has(entry.code)) ? 3 : 1;
    }
    stdout.write(`Discovered ${result.assembly.documents.length} manifest(s) (${result.inputMode}).\n`);
    for (const document of result.assembly.documents) {
      stdout.write(`${sourceLabel(document.source)} ${document.kind}\n`);
    }
    stdout.write("Discovery only. Schema and semantic validation were not performed; no execution is authorized.\n");
    return 0;
  } catch {
    stderr.write("Internal prototype failure. No validation or execution result is available.\n");
    return 4;
  }
}
