import {
  lstat,
  readFile,
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
    return await realpath(path.resolve(root));
  } catch (error) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      String(root),
      `discovery root is unavailable: ${error.message}`
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

    const sourceStats = await stat(candidate);
    if (sourceStats.size > limits.maxFileBytes) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-LIMIT-EXCEEDED",
        source,
        `manifest source exceeds the ${limits.maxFileBytes} byte limit`
      ));
      return null;
    }

    const document = parseDocument(await readFile(candidate, "utf8"), {
      maxAliasCount: limits.maxAliasCount,
      uniqueKeys: true
    });

    if (document.errors.length > 0) {
      for (const error of document.errors) {
        diagnostics.push(diagnostic(
          "NF-DISCOVERY-UNSAFE-SOURCE",
          source,
          error.message.split("\n", 1)[0]
        ));
      }
      return null;
    }

    const manifest = document.toJS({ maxAliasCount: limits.maxAliasCount });
    if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSAFE-SOURCE",
        source,
        "manifest root must be a mapping"
      ));
      return null;
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
        `manifest kind ${JSON.stringify(kind)} is not supported by this discovery slice`
      ));
      return { source, expectedKind: sourceEntry.expectedKind, manifest, supported: false };
    }

    if (sourceEntry.expectedKind && sourceEntry.expectedKind !== kind) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-KIND-MISMATCH",
        source,
        `source hint expects ${JSON.stringify(sourceEntry.expectedKind)}, found ${JSON.stringify(kind)}`
      ));
    }

    return {
      source,
      expectedKind: sourceEntry.expectedKind,
      manifest,
      supported: true
    };
  } catch (error) {
    diagnostics.push(diagnostic(
      "NF-DISCOVERY-UNSAFE-SOURCE",
      source,
      `manifest source is unavailable: ${error.message}`
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
        `manifest specVersion ${JSON.stringify(manifest.specVersion)} does not match project version ${JSON.stringify(specVersion)}`
      ));
      continue;
    }

    if (manifest.metadata?.project !== projectId) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-PROJECT-MISMATCH",
        document.source,
        `manifest belongs to project ${JSON.stringify(manifest.metadata?.project)}, expected ${JSON.stringify(projectId)}`
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
        `workflow ID ${JSON.stringify(workflowId)} is duplicated`,
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
    .sort((left, right) => left.source.localeCompare(right.source));

  const workflows = [...workflowById]
    .map(([id, document]) => ({ id, source: document.source }))
    .sort((left, right) => left.id.localeCompare(right.id));

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

  uniqueSources.sort((left, right) => String(left.path).localeCompare(String(right.path)));
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

    const expectedKind = PROJECT_SOURCE_HINT_KINDS[key];
    if (!expectedKind) {
      diagnostics.push(diagnostic(
        "NF-DISCOVERY-UNSUPPORTED-HINT",
        `<Project.manifests.${key}>`,
        `source hint key ${JSON.stringify(key)} is not supported by this discovery slice`
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
  if (!projectManifest) return projectOnly;

  const normalized = sourceEntriesFromProject(projectManifest);
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
