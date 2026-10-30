export type Operation = "validate" | "inspect" | "graph";
export type Command = Operation | "help" | "version";
export interface Arguments {
  command: Command | null;
  subject: Operation | null;
  format: "text" | "json";
  valid: boolean;
  root: string;
  project?: string;
  files?: string[];
}
const operations = new Set(["validate", "inspect", "graph"]);

/** Tokenize even rejected invocations, without reinterpreting consumed values. */
export function parseArguments(argv: readonly string[]): Arguments {
  const result: Arguments = { command: null, subject: null, format: "text", valid: true, root: "" };
  const seen = new Set<string>(), files: string[] = [];
  let jsonRequested = false, help = false, version = false, operation: Operation | null = null;
  let index = 0;
  if (argv.length && operations.has(argv[0])) { operation = argv[0] as Operation; result.command = operation; index = 1; }
  else if (!argv.length || !argv[0].startsWith("--")) result.valid = false;
  for (; index < argv.length; index++) {
    const token = argv[index], equals = token.indexOf("=");
    const option = equals === -1 ? token : token.slice(0, equals);
    if (option === "--help" || option === "--version") {
      if (equals !== -1 || seen.has(option)) result.valid = false;
      seen.add(option); if (option === "--help") help = true; else version = true;
      continue;
    }
    if (!["--root", "--project", "--file", "--format"].includes(option)) { result.valid = false; continue; }
    const value = equals === -1 ? argv[++index] : token.slice(equals + 1);
    if (seen.has(option) && option !== "--file") result.valid = false;
    seen.add(option);
    if (value === undefined || value === "") { result.valid = false; continue; }
    if (option === "--format") {
      if (value === "json") jsonRequested = true;
      if (value === "text" || value === "json") result.format = value; else result.valid = false;
    } else if (option === "--root") result.root = value;
    else if (option === "--project") result.project = value;
    else files.push(value);
  }
  if (help || version) {
    if ((help && version) || (version && operation !== null)
      || seen.has("--root") || seen.has("--project") || seen.has("--file")) result.valid = false;
    result.subject = operation;
    result.command = help ? "help" : "version";
  } else if (!operation || !seen.has("--root")) result.valid = false;
  if (files.length) result.files = files;
  if (seen.has("--file") && seen.has("--project")) result.valid = false;
  if (!result.valid) result.format = jsonRequested ? "json" : "text";
  return result;
}
