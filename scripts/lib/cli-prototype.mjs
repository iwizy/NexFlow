import { parseArgs } from "node:util";

import { assertCliEffectBudget, CLI_OPERATION_COMMANDS } from "./cli-boundary.mjs";
import { writeCliResult } from "./cli-output.mjs";

const version = "NexFlow repository CLI prototype (unreleased; spec 0.1)";
const projectIdPattern = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/u;
const unsafeDisplayNamePattern = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
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
  npm run cli-prototype -- graph --root <directory> [--project <file> | --file <file> ...] [--format text|json]
  npm run cli-prototype -- init --root <directory> --id <project-id> [--name <display-name>] [--format text|json]

For JSON without npm logging: node scripts/cli-prototype.mjs <command> --root <directory> --format json
JSON is one experimental versioned result on stdout, including errors; stderr stays empty.

discover builds a source inventory only. Schema and semantic validation are not performed.
validate checks the discovered manifests against the local spec 0.1 JSON Schemas only.
inspect summarizes declarations and selected references after discovery and schema validation.
graph derives static nodes and reference edges from the declared inspection.
init writes a minimal human-led starter into an explicit existing directory.
No command performs full semantic validation, resolves Agent Assembly, or authorizes execution.
With no source flag, exactly one root project.yaml or project.yml must exist.
`;

const options = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  root: { type: "string" },
  project: { type: "string" },
  file: { type: "string", multiple: true },
  format: { type: "string" },
  id: { type: "string" },
  name: { type: "string" }
};

function validProjectId(value) {
  return typeof value === "string" && value.length <= 128 && projectIdPattern.test(value);
}

function validDisplayName(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0
    && value.length <= 128 && !unsafeDisplayNamePattern.test(value);
}

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
  if (positionals.length > 1 || (command && !CLI_OPERATION_COMMANDS.includes(command))) {
    throw new Error("unknown command or positional argument");
  }
  if (values.project !== undefined && values.file !== undefined) throw new Error("conflicting modes");
  if (values.help && values.version) throw new Error("conflicting informational options");
  if (values.help || values.version || args.length === 0) {
    if (values.root !== undefined || values.project !== undefined || values.file !== undefined
      || values.id !== undefined || values.name !== undefined || (values.version && command)) {
      throw new Error("unexpected input options");
    }
    return { command: values.version ? "version" : "help" };
  }
  if (!command) throw new Error("missing command");
  if (command === "init") {
    if (!values.root?.trim() || values.project !== undefined || values.file !== undefined
      || !validProjectId(values.id) || (values.name !== undefined && !validDisplayName(values.name))) {
      throw new Error("invalid init input");
    }
    return { command, root: values.root, projectId: values.id, displayName: values.name };
  }
  if (values.id !== undefined || values.name !== undefined) throw new Error("unexpected init option");
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

async function graphInput(inspection) {
  const { graphManifestInspection } = await import("./manifest-graph.mjs");
  return graphManifestInspection(inspection);
}

async function initProject(request) {
  const { initializeProject } = await import("./project-init.mjs");
  return initializeProject(request);
}

export async function runCliPrototype(args, {
  stdout = process.stdout,
  stderr = process.stderr,
  discover = discoverInput,
  validate = validateInput,
  inspect = inspectInput,
  graph = graphInput,
  initialize = initProject
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
  try {
    assertCliEffectBudget(request.command);
  } catch {
    return failure(4, "NEXFLOW-PROTOTYPE-INTERNAL", "Internal prototype effect boundary is unavailable. No project operation or execution result is available.");
  }
  if (request.command === "help") {
    return finish(0, { result: { text: help } });
  }
  if (request.command === "version") {
    return finish(0, { result: { text: `${version}\n` } });
  }
  if (request.command === "init") {
    try {
      const initialized = await initialize(request);
      if (!initialized.valid) return finish(1, { diagnostics: initialized.diagnostics });
      return finish(0, { result: initialized });
    } catch {
      return failure(4, "NEXFLOW-PROTOTYPE-INTERNAL", "Internal prototype failure. No successful initialization or execution result is available.");
    }
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
    if (["validate", "inspect", "graph"].includes(request.command)) {
      checks.schema = "unavailable";
      const validation = await validate(result.assembly);
      checks.schema = validation.valid ? "passed" : "failed";
      if (!validation.valid) {
        return finish(1, { diagnostics: validation.diagnostics, truncated: validation.truncated });
      }
      const inventory = { documentCount: validation.documentCount, documents: result.assembly.documents };
      if (["inspect", "graph"].includes(request.command)) {
        const inspection = await inspect(result.assembly);
        if (!inspection.valid) return finish(1, { diagnostics: inspection.diagnostics });
        if (request.command === "inspect") {
          return finish(0, { result: { ...inventory, inspection: inspection.inspection } });
        }
        return finish(0, { result: { ...inventory, graph: await graph(inspection.inspection) } });
      }
      return finish(0, { result: inventory });
    }
    return finish(0, { result: { documentCount: result.assembly.documents.length, documents: result.assembly.documents } });
  } catch {
    return failure(4, "NEXFLOW-PROTOTYPE-INTERNAL", "Internal prototype failure. No validation or execution result is available.");
  }
}
