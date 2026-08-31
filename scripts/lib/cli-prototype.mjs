import { parseArgs } from "node:util";

import { writeCliResult } from "./cli-output.mjs";

const version = "NexFlow repository CLI prototype (unreleased; spec 0.1)";
const reservedCommands = new Set(["graph", "init"]);
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
  npm run cli-prototype -- discover --root <directory> [--project <file> | --file <file> ...] [--format text|json]
  npm run cli-prototype -- validate --root <directory> [--project <file> | --file <file> ...] [--format text|json]
  npm run cli-prototype -- inspect --root <directory> [--project <file> | --file <file> ...] [--format text|json]

For JSON without npm logging: node scripts/cli-prototype.mjs <command> --root <directory> --format json
JSON is one experimental versioned result on stdout, including errors; stderr stays empty.

discover builds a source inventory only. Schema and semantic validation are not performed.
validate checks the discovered manifests against the local spec 0.1 JSON Schemas only.
inspect summarizes declarations and selected references after discovery and schema validation.
No command performs full semantic validation, resolves Agent Assembly, or authorizes execution.
With no source flag, exactly one root project.yaml or project.yml must exist.
graph and init are not implemented.
`;

const options = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  root: { type: "string" },
  project: { type: "string" },
  file: { type: "string", multiple: true },
  format: { type: "string" }
};

// Detect an explicit JSON option even when strict usage validation will fail.
// Tokenization keeps option values and everything after -- from selecting output.
function requestedFormat(args) {
  const { tokens } = parseArgs({ args, options, tokens: true, allowPositionals: true, strict: false });
  return tokens.some((token) => token.kind === "option" && token.name === "format" && token.value === "json")
    ? "json" : "text";
}

function parseRequest(args) {
  const { values, positionals, tokens } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    tokens: true,
    options
  });
  const seen = new Set();
  for (const token of tokens) {
    if (token.kind !== "option" || token.name === "file") continue;
    if (seen.has(token.name)) throw new Error("duplicate option");
    seen.add(token.name);
  }
  if (values.format !== undefined && !["text", "json"].includes(values.format)) throw new Error("unknown format");
  const [command] = positionals;
  if (positionals.length > 1 || (command && !["discover", "validate", "inspect"].includes(command) && !reservedCommands.has(command))) {
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

async function discoverInput({ root, projectPath, sources }) {
  const { discoverFromDirectory, discoverFromProjectHints, discoverManifestAssembly } =
    await import("./manifest-discovery.mjs");
  if (sources) return discoverManifestAssembly({ root, sources });
  if (projectPath) return discoverFromProjectHints({ root, projectPath });
  return discoverFromDirectory({ root });
}

async function validateInput(assembly) {
  const { loadRepositorySchemaRegistry, validateManifestAssembly } = await import("./schema-validation.mjs");
  return validateManifestAssembly(assembly, await loadRepositorySchemaRegistry());
}

async function inspectInput(assembly) {
  const { inspectManifestAssembly } = await import("./manifest-inspection.mjs");
  return inspectManifestAssembly(assembly);
}

export async function runCliPrototype(args, {
  stdout = process.stdout,
  stderr = process.stderr,
  discover = discoverInput,
  validate = validateInput,
  inspect = inspectInput
} = {}) {
  let request;
  let format = "text";
  let inputMode = null;
  const checks = {
    discovery: "not-run", schema: "not-run", coreProfile: "not-run",
    semantic: "not-run", extensionProfiles: "not-run"
  };
  const finish = (exitCode, details = {}) => writeCliResult({
    command: request?.command ?? null, exitCode, inputMode, checks, ...details
  }, format, { stdout, stderr });
  const failure = (exitCode, code, message) => finish(exitCode, { diagnostics: [{ code, severity: "error", message }] });
  try {
    format = requestedFormat(args);
    request = parseRequest(args);
  } catch {
    return failure(2, "NEXFLOW-PROTOTYPE-USAGE", "Invalid prototype usage. Run with --help for supported commands and options.");
  }
  if (request.command === "help") {
    return finish(0, { result: { text: help } });
  }
  if (request.command === "version") {
    return finish(0, { result: { text: `${version}\n` } });
  }
  if (reservedCommands.has(request.command)) {
    return failure(3, "NEXFLOW-PROTOTYPE-UNIMPLEMENTED", `${request.command} is not implemented in the repository CLI prototype.`);
  }

  try {
    checks.discovery = "unavailable";
    const result = await discover(request);
    inputMode = result.inputMode;
    checks.discovery = result.valid ? "passed" : "failed";
    if (!result.valid) {
      return finish(result.diagnostics.some((entry) => unsupportedCodes.has(entry.code)) ? 3 : 1,
        { diagnostics: result.diagnostics });
    }
    if (["validate", "inspect"].includes(request.command)) {
      checks.schema = "unavailable";
      const validation = await validate(result.assembly);
      checks.schema = validation.valid ? "passed" : "failed";
      if (!validation.valid) {
        return finish(1, { diagnostics: validation.diagnostics, truncated: validation.truncated });
      }
      const inventory = { documentCount: validation.documentCount, documents: result.assembly.documents };
      if (request.command === "inspect") {
        const inspection = await inspect(result.assembly);
        if (!inspection.valid) return finish(1, { diagnostics: inspection.diagnostics });
        return finish(0, { result: { ...inventory, inspection: inspection.inspection } });
      }
      return finish(0, { result: inventory });
    }
    return finish(0, { result: { documentCount: result.assembly.documents.length, documents: result.assembly.documents } });
  } catch {
    return failure(4, "NEXFLOW-PROTOTYPE-INTERNAL", "Internal prototype failure. No validation or execution result is available.");
  }
}
