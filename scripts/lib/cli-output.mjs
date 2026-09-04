import path from "node:path";

export const CLI_OUTPUT_VERSION = "0.4-draft";
export const MAX_JSON_DIAGNOSTICS = 200;

function safeSource(source) {
  if (source === undefined) return null;
  if (typeof source !== "string" || source.length > 512) return "<redacted-source>";
  if (source.startsWith("<") && source.endsWith(">")) return "<input>";
  const normalized = path.posix.normalize(source);
  if (path.posix.isAbsolute(source) || source.includes("\\") || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(source)
    || normalized === ".." || normalized.startsWith("../")) return "<redacted-source>";
  return source;
}

function asciiJson(value, space) {
  return JSON.stringify(value, null, space).replace(/[\u007f-\uffff]/gu,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function sourceLabel(source) {
  return ["<input>", "<redacted-source>"].includes(source) ? source : asciiJson(source);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function jsonDiagnostic(entry) {
  return {
    severity: entry.severity,
    code: entry.code,
    message: entry.message,
    file: safeSource(entry.source),
    kind: entry.kind ?? null,
    path: entry.instancePath ?? null,
    keyword: entry.keyword ?? null,
    related: (entry.relatedSources ?? []).map((source) => ({ file: safeSource(source) }))
      .sort((left, right) => compareText(left.file, right.file))
  };
}

function inspectionProjection(inspection) {
  const location = ({ file, path, kind, id, scope }) => ({
    file: safeSource(file), path, kind, id,
    scope: scope === null ? null : { kind: scope.kind, id: scope.id }
  });
  return {
    mode: inspection.mode, referencesResolved: inspection.referencesResolved, referenceCoverage: inspection.referenceCoverage,
    project: { id: inspection.project.id, file: safeSource(inspection.project.file), path: inspection.project.path },
    summary: inspection.summary.map(({ kind, documentCount, resourceCount }) => ({ kind, documentCount, resourceCount })),
    resources: inspection.resources.map(location), references: inspection.references.map(location)
  };
}

function graphProjection(graph) {
  const scope = (value) => value === null ? null : { kind: value.kind, id: value.id };
  return {
    mode: graph.mode, referenceCoverage: graph.referenceCoverage,
    nodeCount: graph.nodeCount, edgeCount: graph.edgeCount,
    nodes: graph.nodes.map((node) => ({
      id: node.id, kind: node.kind, identity: node.identity, scope: scope(node.scope),
      file: safeSource(node.file), path: node.path
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id, from: edge.from, to: edge.to, candidates: [...edge.candidates],
      relation: edge.relation,
      target: { kind: edge.target.kind, identity: edge.target.identity, scope: scope(edge.target.scope) },
      status: edge.status, file: safeSource(edge.file), path: edge.path
    }))
  };
}

function initProjection(result) {
  return {
    template: {
      name: result.template.name,
      version: result.template.version,
      specVersion: result.template.specVersion
    },
    files: result.files.map(({ file, status }) => ({ file: safeSource(file), status })),
    reviewRequired: result.reviewRequired
  };
}

// Raw manifests and helper details are never spread into the output contract.
export function writeCliResult(outcome, format, { stdout, stderr }) {
  const { command, exitCode, inputMode, checks, diagnostics = [], truncated = false, result = null } = outcome;
  const inspection = command === "inspect" && exitCode === 0 ? inspectionProjection(result.inspection) : null;
  const graph = command === "graph" && exitCode === 0 ? graphProjection(result.graph) : null;
  const initialized = command === "init" && exitCode === 0 ? initProjection(result) : null;
  if (format === "json") {
    const entries = diagnostics.map(jsonDiagnostic).sort((left, right) => {
      for (const key of ["file", "path", "severity", "code", "kind", "keyword", "message"]) {
        const order = compareText(left[key] ?? "", right[key] ?? "");
        if (order !== 0) return order;
      }
      return compareText(JSON.stringify(left.related), JSON.stringify(right.related));
    });
    stdout.write(`${asciiJson({
      formatVersion: CLI_OUTPUT_VERSION,
      tool: { name: "nexflow-repository-cli-prototype", version: "unreleased" },
      supportedSpecVersions: ["0.1"],
      command, success: exitCode === 0, exitCode, inputMode, checks,
      executionAuthorized: false,
      diagnostics: entries.slice(0, MAX_JSON_DIAGNOSTICS),
      truncated: truncated || entries.length > MAX_JSON_DIAGNOSTICS,
      result: result === null ? null : result.text !== undefined ? { text: result.text } : initialized ?? {
        documentCount: result.documentCount,
        documents: result.documents.map((document) => ({ file: safeSource(document.source), kind: document.kind }))
          .sort((left, right) => compareText(left.file, right.file)),
        ...(inspection ? { inspection } : {}),
        ...(graph ? { graph } : {})
      }
    }, 2)}\n`);
    return exitCode;
  }

  if (exitCode !== 0) {
    for (const entry of diagnostics) {
      if (entry.code.startsWith("NEXFLOW-PROTOTYPE-")) {
        stderr.write(`${entry.message}\n`);
      } else {
        const field = entry.kind === undefined ? "" : ` ${entry.kind} ${JSON.stringify(entry.instancePath)} [${entry.keyword}]`;
        stderr.write(`${entry.code} ${sourceLabel(safeSource(entry.source))}${field}: ${entry.message}\n`);
      }
    }
    if (truncated) stderr.write("Additional schema diagnostics omitted; validation failed.\n");
  } else if (result.text !== undefined) {
    stdout.write(result.text);
  } else if (command === "init") {
    const created = initialized.files.filter(({ status }) => status === "created").length;
    const skipped = initialized.files.filter(({ status }) => status === "skipped").length;
    stdout.write(`Initialized starter manifests from ${initialized.template.name}@${initialized.template.version}: ${created} created, ${skipped} unchanged.\n`);
    for (const entry of initialized.files) stdout.write(`${entry.status} ${sourceLabel(entry.file)}\n`);
    stdout.write("Review the generated manifests before use. No runtime behavior or execution authority was configured.\n");
  } else if (command === "inspect") {
    stdout.write(`Inspected ${result.documentCount} manifest(s) (${inputMode}).\n`);
    stdout.write(`Project ${asciiJson(inspection.project.id)} at ${sourceLabel(inspection.project.file)} ${asciiJson(inspection.project.path)}\n`);
    for (const entry of inspection.summary) {
      stdout.write(`${entry.kind}: ${entry.documentCount} document(s), ${entry.resourceCount} declaration(s)\n`);
    }
    for (const [label, records] of [["Resources", inspection.resources], ["Selected references (not resolved)", inspection.references]]) {
      stdout.write(`${label}:\n`);
      for (const entry of records) {
        const scope = entry.scope === null ? "" : ` in ${entry.scope.kind} ${asciiJson(entry.scope.id)}`;
        stdout.write(`  ${sourceLabel(entry.file)} ${asciiJson(entry.path)} ${entry.kind} ${asciiJson(entry.id)}${scope}\n`);
      }
    }
    stdout.write("Declared inventory only. References are not resolved; effective configuration and Agent Assembly are not computed.\n");
    stdout.write("Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.\n");
  } else if (command === "graph") {
    stdout.write(`Graphed ${graph.nodeCount} node(s) and ${graph.edgeCount} edge(s) from ${result.documentCount} manifest(s) (${inputMode}).\n`);
    stdout.write("Nodes:\n");
    for (const node of graph.nodes) {
      const scope = node.scope === null ? "" : ` in ${node.scope.kind} ${asciiJson(node.scope.id)}`;
      stdout.write(`  [${node.id}] ${node.kind} ${asciiJson(node.identity)}${scope} at ${sourceLabel(node.file)} ${asciiJson(node.path)}\n`);
    }
    stdout.write("Reference edges:\n");
    for (const edge of graph.edges) {
      const destination = edge.to ?? (edge.candidates.length ? `[${edge.candidates.join(",")}]` : "?");
      const scope = edge.target.scope === null ? "" : ` in ${edge.target.scope.kind} ${asciiJson(edge.target.scope.id)}`;
      stdout.write(`  [${edge.id}] ${edge.from} -> ${destination} ${edge.relation} ${edge.target.kind} ${asciiJson(edge.target.identity)}${scope} (${edge.status}) at ${sourceLabel(edge.file)} ${asciiJson(edge.path)}\n`);
    }
    stdout.write("Static declared graph only. Selected references are resolved only against this bounded inventory; no order, runtime state, or execution is inferred.\n");
    stdout.write("Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.\n");
  } else if (command === "validate") {
    stdout.write(`Validated ${result.documentCount} manifest(s) against the local spec 0.1 schemas (${inputMode}).\n`);
    stdout.write("Schema validation only. Core Profile and full semantic validation were not performed; no execution is authorized.\n");
  } else {
    stdout.write(`Discovered ${result.documentCount} manifest(s) (${inputMode}).\n`);
    for (const document of result.documents) {
      stdout.write(`${sourceLabel(safeSource(document.source))} ${document.kind}\n`);
    }
    stdout.write("Discovery only. Schema and semantic validation were not performed; no execution is authorized.\n");
  }
  return exitCode;
}
