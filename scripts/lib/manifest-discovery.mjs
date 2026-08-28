import { constants } from "node:fs";
import {
  lstat,
  open,
  realpath,
  stat
} from "node:fs/promises";
import path from "node:path";

import { parseDocument } from "yaml";

export const DEFAULT_DISCOVERY_LIMITS = Object.freeze({
  maxDocuments: 128,
  maxFileBytes: 1024 * 1024,
  maxAliasCount: 100
});

export const PROJECT_SOURCE_HINT_KINDS = Object.freeze({
  actors: "ActorSet",
  agents: "AgentSet",
  agentDefinitions: "AgentDefinitionSet",
  capabilities: "CapabilitySet",
  permissions: "PermissionSet",
  tasks: "TaskSet",
  workflow: "Workflow",
  handoffs: "HandoffSet",
  context: "ContextSet",
  memory: "MemorySet",
  providers: "ProviderSet",
  modelProfiles: "ModelProfileSet",
  promptSets: "PromptSet",
  retrievalProfiles: "RetrievalProfileSet",
  events: "EventSet",
  extensions: "ExtensionSet"
});

export const SUPPORTED_MANIFEST_KINDS = Object.freeze([
  "Project",
  ...new Set(Object.values(PROJECT_SOURCE_HINT_KINDS))
]);

const supportedKinds = new Set(SUPPORTED_MANIFEST_KINDS);
const supportedExtensions = new Set([".yaml", ".yml"]);
const projectEntrypoints = ["project.yaml", "project.yml"];

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validLimits(limits) {
  return limits && typeof limits === "object" && !Array.isArray(limits)
    && Object.entries(limits).every(([key, value]) => Object.hasOwn(DEFAULT_DISCOVERY_LIMITS, key)
      && Number.isSafeInteger(value) && value >= (key === "maxAliasCount" ? 0 : 1)
      && value <= DEFAULT_DISCOVERY_LIMITS[key]);
}

function jsonCompatible(value) {
  const active = new WeakSet();
  const visited = new WeakSet();
  const pending = [{ value, leave: false }];
  while (pending.length > 0) {
    const entry = pending.pop();
    const current = entry.value;
    if (current === null || typeof current === "string" || typeof current === "boolean") continue;
    if (typeof current === "number") {
      if (!Number.isFinite(current)) return false;
      continue;
    }
    if (typeof current !== "object") return false;
    if (entry.leave) {
      active.delete(current);
      visited.add(current);
      continue;
    }
    if (active.has(current)) return false;
    if (visited.has(current)) continue;
    if (!Array.isArray(current) && Object.getPrototypeOf(current) !== Object.prototype) return false;
    active.add(current);
    pending.push({ value: current, leave: true });
    for (const child of Object.values(current)) pending.push({ value: child, leave: false });
  }
  return true;
}

function diagnostic(code, source, message, relatedSources = []) {
  return {
    code,
    severity: "error",
    source,
    message,
    ...(relatedSources.length > 0 ? { relatedSources } : {})
  };
}

function asPortablePath(value) {
  return value.split(path.sep).join("/");
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function resourceIdFor(manifest) {
  if (manifest?.kind === "Project") return manifest.project?.id;
  if (manifest?.kind === "Workflow") return manifest.workflow?.id;
  return undefined;
}

function normalizedSourceEntry(entry) {
  if (typeof entry === "string") return { path: entry };
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    return { path: entry.path, expectedKind: entry.expectedKind };
  }
  return { path: undefined };
}

function emptyResult(inputMode, diagnostics) {
  return {
    valid: false,
    inputMode,
    assembly: null,
    diagnostics
  };
}

async function canonicalRoot(root, diagnostics) {
  try {
    if (typeof root !== "string" || !root.trim() || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(root)) {
      throw new Error("invalid root");
    }
    const resolved = await realpath(path.resolve(root));
    if (!(await stat(resolved)).isDirectory()) throw new Error("not a directory");
    return resolved;
  } catch {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      "<root>",
      "discovery root must be an available local directory"
    ));
    return null;
  }
}

async function loadSource(root, sourceEntry, limits, diagnostics) {
  const locator = sourceEntry.path;
  const label = typeof locator === "string" ? locator : "<invalid-source>";

  if (typeof locator !== "string" || locator.trim().length === 0) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      label,
      "source locator must be a non-empty relative path"
    ));
    return null;
  }

  if (
    path.isAbsolute(locator)
    || locator.includes("\\")
    || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(locator)
  ) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-OUTSIDE-ROOT",
      locator,
      "source locator must be a local relative path inside the discovery root"
    ));
    return null;
  }

  const candidate = path.resolve(root, locator);
  if (!isContained(root, candidate)) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-OUTSIDE-ROOT",
      locator,
      "source path escapes the discovery root"
    ));
    return null;
  }

  const source = asPortablePath(path.relative(root, candidate));
  if (!supportedExtensions.has(path.extname(candidate).toLowerCase())) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      source,
      "only explicit .yaml and .yml manifest sources are supported"
    ));
    return null;
  }

  try {
    // Reject symlinked ancestors before inspecting or opening their children.
    let componentPath = root;
    for (const component of path.relative(root, candidate).split(path.sep)) {
      componentPath = path.join(componentPath, component);
      if ((await lstat(componentPath)).isSymbolicLink()) {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-UNSAFE-SOURCE", source, "symbolic-link manifest paths are not followed"
        ));
        return null;
      }
    }
    const sourceInfo = await lstat(candidate);
    if (sourceInfo.isSymbolicLink()) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE",
        source,
        "symbolic-link manifest sources are not followed"
      ));
      return null;
    }
    if (!sourceInfo.isFile()) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE",
        source,
        "manifest source is not a regular file"
      ));
      return null;
    }

    const resolvedSource = await realpath(candidate);
    if (!isContained(root, resolvedSource) || resolvedSource !== candidate) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE",
        source,
        "manifest source resolves through a symbolic link or outside the discovery root"
      ));
      return null;
    }

    let contents;
    const handle = await open(candidate, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    try {
      const openedInfo = await handle.stat();
      if (!openedInfo.isFile()) throw new Error("not a regular file");
      if (openedInfo.size > limits.maxFileBytes) {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-LIMIT-EXCEEDED", source, "manifest source exceeds the file size limit"
        ));
        return null;
      }
      // Bound actual bytes read as well as the pre-read size check.
      const buffer = Buffer.alloc(limits.maxFileBytes + 1);
      let total = 0;
      while (total < buffer.length) {
        const { bytesRead } = await handle.read(buffer, total, buffer.length - total, null);
        if (bytesRead === 0) break;
        total += bytesRead;
      }
      if (total > limits.maxFileBytes) {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-LIMIT-EXCEEDED", source, "manifest source exceeds the file size limit"
        ));
        return null;
      }
      contents = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, total));
    } finally {
      await handle.close();
    }

    const document = parseDocument(contents, {
      maxAliasCount: limits.maxAliasCount,
      uniqueKeys: true,
      stringKeys: true,
      prettyErrors: false
    });

    if (document.errors.length > 0 || document.warnings.length > 0) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE", source,
        "manifest must contain one valid YAML document with unique string keys and supported tags"
      ));
      return null;
    }

    let manifest;
    try {
      manifest = document.toJS({ maxAliasCount: limits.maxAliasCount });
    } catch {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE", source, "YAML conversion failed or exceeded the alias-expansion budget"
      ));
      return null;
    }
    if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest) || !jsonCompatible(manifest)) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE",
        source,
        "manifest must be a JSON-compatible mapping without cycles or non-finite numbers"
      ));
      return null;
    }

    if (manifest.specVersion !== "0.1") {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-VERSION", source, 'only specVersion "0.1" is supported'
      ));
      return { source, expectedKind: sourceEntry.expectedKind, manifest, supported: false };
    }

    const kind = manifest.kind;
    if (typeof kind !== "string" || kind.length === 0) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-KIND",
        source,
        "manifest must declare a non-empty kind"
      ));
      return { source, expectedKind: sourceEntry.expectedKind, manifest, supported: false };
    }

    if (!supportedKinds.has(kind)) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-KIND",
        source,
        "manifest kind is not supported by this discovery slice"
      ));
      return { source, expectedKind: sourceEntry.expectedKind, manifest, supported: false };
    }

    if (sourceEntry.expectedKind && sourceEntry.expectedKind !== kind) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-KIND-MISMATCH",
        source,
        "source hint expected kind differs from the declared manifest kind"
      ));
    }

    return {
      source,
      expectedKind: sourceEntry.expectedKind,
      manifest,
      supported: true
    };
  } catch {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      source,
      "manifest source could not be read safely as a local UTF-8 file"
    ));
    return null;
  }
}

function buildAssembly(inputMode, documents, diagnostics) {
  const supportedDocuments = documents.filter((document) => document?.supported);
  const projectDocuments = supportedDocuments.filter(
    (document) => document.manifest.kind === "Project"
  );

  if (projectDocuments.length === 0) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-NO-PROJECT",
      "<assembly>",
      "exactly one Project document is required"
    ));
    return null;
  }

  if (projectDocuments.length > 1) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-MULTIPLE-PROJECTS",
      projectDocuments[0].source,
      "more than one Project document was discovered",
      projectDocuments.slice(1).map((document) => document.source)
    ));
    return null;
  }

  const projectDocument = projectDocuments[0];
  const projectId = projectDocument.manifest.project?.id;
  const specVersion = projectDocument.manifest.specVersion;
  const associatedDocuments = [];
  const unsupportedDocuments = documents
    .filter((document) => document && !document.supported)
    .map((document) => ({ source: document.source, kind: document.manifest?.kind }));

  if (
    typeof projectId !== "string"
    || projectId.length === 0
    || projectDocument.manifest.metadata?.project !== projectId
  ) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-PROJECT-MISMATCH",
      projectDocument.source,
      "Project project.id and metadata.project must be the same non-empty ID"
    ));
  }

  for (const document of supportedDocuments) {
    const manifest = document.manifest;
    if (manifest.specVersion !== specVersion) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-VERSION",
        document.source,
        "manifest specVersion does not match the selected Project version"
      ));
      continue;
    }

    if (manifest.metadata?.project !== projectId) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-PROJECT-MISMATCH",
        document.source,
        "manifest project association does not match the selected Project"
      ));
      continue;
    }

    associatedDocuments.push(document);
  }

  const documentsByKind = new Map();
  for (const document of associatedDocuments) {
    const kind = document.manifest.kind;
    const current = documentsByKind.get(kind) ?? [];
    current.push(document);
    documentsByKind.set(kind, current);
  }

  for (const [kind, kindDocuments] of documentsByKind) {
    if (kind === "Workflow" || kind === "Project" || kindDocuments.length <= 1) continue;
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-DUPLICATE-SINGLETON",
      kindDocuments[0].source,
      `manifest kind ${JSON.stringify(kind)} allows one document in the current discovery contract`,
      kindDocuments.slice(1).map((document) => document.source)
    ));
  }

  const workflowById = new Map();
  for (const document of documentsByKind.get("Workflow") ?? []) {
    const workflowId = document.manifest.workflow?.id;
    if (typeof workflowId !== "string" || workflowId.length === 0) continue;

    if (workflowById.has(workflowId)) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-DUPLICATE-WORKFLOW",
        workflowById.get(workflowId).source,
        "workflow ID is duplicated",
        [document.source]
      ));
    } else {
      workflowById.set(workflowId, document);
    }
  }

  const inventory = associatedDocuments
    .map((document) => ({
      kind: document.manifest.kind,
      ...(resourceIdFor(document.manifest) ? { resourceId: resourceIdFor(document.manifest) } : {}),
      source: document.source
    }))
    .sort((left, right) => compareText(left.source, right.source));

  const workflows = [...workflowById]
    .map(([id, document]) => ({ id, source: document.source }))
    .sort((left, right) => compareText(left.id, right.id));

  return {
    projectId,
    specVersion,
    documents: inventory,
    workflows,
    unsupportedDocuments,
    loadedDocuments: associatedDocuments.map((document) => ({
      source: document.source,
      manifest: document.manifest
    }))
  };
}

export async function discoverManifestAssembly({
  root,
  sources,
  inputMode = "explicit-file-list",
  limits = {}
}) {
  const diagnostics = [];
  if (!validLimits(limits)) {
    return emptyResult(inputMode, [diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE", "<limits>", "discovery limits must be valid integers no higher than the defaults"
    )]);
  }
  const effectiveLimits = { ...DEFAULT_DISCOVERY_LIMITS, ...limits };
  const resolvedRoot = await canonicalRoot(root, diagnostics);
  if (!resolvedRoot) return emptyResult(inputMode, diagnostics);

  if (!Array.isArray(sources) || sources.length === 0) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-NO-PROJECT",
      "<assembly>",
      "explicit discovery requires at least one source"
    ));
    return emptyResult(inputMode, diagnostics);
  }

  if (sources.length > effectiveLimits.maxDocuments) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-LIMIT-EXCEEDED",
      "<assembly>",
      `source count ${sources.length} exceeds the ${effectiveLimits.maxDocuments} document limit`
    ));
    return emptyResult(inputMode, diagnostics);
  }

  const normalizedSources = sources.map(normalizedSourceEntry);
  const uniqueSources = [];
  const seenSources = new Map();

  for (const source of normalizedSources) {
    if (typeof source.path !== "string") {
      uniqueSources.push(source);
      continue;
    }

    const normalized = asPortablePath(path.normalize(source.path));
    if (seenSources.has(normalized)) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-DUPLICATE-SOURCE",
        source.path,
        "the same source locator is declared more than once",
        [seenSources.get(normalized)]
      ));
      continue;
    }

    seenSources.set(normalized, source.path);
    uniqueSources.push(source);
  }

  uniqueSources.sort((left, right) => compareText(String(left.path), String(right.path)));
  const documents = [];
  for (const source of uniqueSources) {
    const document = await loadSource(resolvedRoot, source, effectiveLimits, diagnostics);
    if (document) documents.push(document);
  }

  const assembly = buildAssembly(inputMode, documents, diagnostics);
  return {
    valid: assembly !== null && diagnostics.length === 0,
    inputMode,
    assembly,
    diagnostics
  };
}

export function sourceEntriesFromProject(projectManifest) {
  const diagnostics = [];
  const entries = [];
  const hints = projectManifest?.manifests;

  if (hints === undefined) return { entries, diagnostics };
  if (hints === null || typeof hints !== "object" || Array.isArray(hints)) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      "<Project.manifests>",
      "Project.manifests must be a source-hint mapping"
    ));
    return { entries, diagnostics };
  }

  if (hints.workflow !== undefined && hints.workflows !== undefined) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-DUPLICATE-SOURCE",
      "<Project.manifests>",
      "workflow and workflows source hints cannot coexist"
    ));
  }

  for (const [key, value] of Object.entries(hints)) {
    if (key === "workflows") {
      if (!Array.isArray(value) || value.length === 0) {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-UNSAFE-SOURCE",
          "<Project.manifests.workflows>",
          "workflows must be a non-empty list of source paths"
        ));
        continue;
      }
      for (const locator of value) entries.push({ path: locator, expectedKind: "Workflow" });
      continue;
    }

    const expectedKind = Object.hasOwn(PROJECT_SOURCE_HINT_KINDS, key) ? PROJECT_SOURCE_HINT_KINDS[key] : undefined;
    if (!expectedKind) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-HINT",
        `<Project.manifests.${key}>`,
        "source hint key is not supported by this discovery slice"
      ));
      continue;
    }
    entries.push({ path: value, expectedKind });
  }

  return { entries, diagnostics };
}

export async function discoverFromProjectHints({
  root,
  projectPath = "project.yaml",
  limits = {}
}) {
  const projectOnly = await discoverManifestAssembly({
    root,
    sources: [{ path: projectPath, expectedKind: "Project" }],
    inputMode: "project-source-hints",
    limits
  });

  const projectManifest = projectOnly.assembly?.loadedDocuments
    .find((document) => document.manifest.kind === "Project")?.manifest;
  if (!projectOnly.valid || !projectManifest) return projectOnly;

  const normalized = sourceEntriesFromProject(projectManifest);
  if (normalized.diagnostics.length > 0) {
    return emptyResult("project-source-hints", normalized.diagnostics);
  }
  const result = await discoverManifestAssembly({
    root,
    sources: [
      { path: projectPath, expectedKind: "Project" },
      ...normalized.entries
    ],
    inputMode: "project-source-hints",
    limits
  });

  result.diagnostics.unshift(...normalized.diagnostics);
  result.valid = result.assembly !== null && result.diagnostics.length === 0;
  return result;
}

export async function discoverFromDirectory({ root, limits = {} }) {
  const inputMode = "directory-project";
  const diagnostics = [];
  const resolvedRoot = await canonicalRoot(root, diagnostics);
  if (!resolvedRoot) return emptyResult(inputMode, diagnostics);

  const found = [];
  for (const entry of projectEntrypoints) {
    try {
      await lstat(path.join(resolvedRoot, entry));
      found.push(entry);
    } catch (error) {
      if (error.code !== "ENOENT") {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-UNSAFE-SOURCE", entry, "Project entry point could not be inspected safely"
        ));
      }
    }
  }
  if (diagnostics.length > 0) return emptyResult(inputMode, diagnostics);
  if (found.length === 0) {
    return emptyResult(inputMode, [diagnostic(
      "NF-DISCOVERY-NO-PROJECT", "<root>", "directory must contain project.yaml or project.yml"
    )]);
  }
  if (found.length > 1) {
    return emptyResult(inputMode, [diagnostic(
      "NF-DISCOVERY-MULTIPLE-PROJECTS", found[0], "directory contains ambiguous Project entry points", found.slice(1)
    )]);
  }
  const result = await discoverFromProjectHints({ root: resolvedRoot, projectPath: found[0], limits });
  return { ...result, inputMode };
}
