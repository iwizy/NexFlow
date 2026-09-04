import { lstat, open, readFile, realpath, stat, unlink } from "node:fs/promises";
import path from "node:path";

import { stringify } from "yaml";

export const INIT_TEMPLATE_NAME = "minimal-team";
export const INIT_TEMPLATE_VERSION = "0.1-draft";

function defaultDisplayName(projectId) {
  return projectId.split(/[-_]/u)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function templateDocuments(projectId, displayName) {
  const metadata = { project: projectId };
  return [
    {
      file: "project.yaml",
      document: {
        specVersion: "0.1",
        kind: "Project",
        metadata: { ...metadata, name: displayName },
        project: {
          id: projectId,
          displayName,
          description: "Starter NexFlow project for a human-led AI developer team.",
          maintainers: [{ id: "human-maintainer", name: "Human Maintainer", role: "maintainer" }],
          defaultAutonomy: "suggest_only",
          policies: { requireReview: true }
        },
        manifests: { actors: "actors.yaml", agents: "agents.yaml" }
      }
    },
    {
      file: "actors.yaml",
      document: {
        specVersion: "0.1",
        kind: "ActorSet",
        metadata,
        actors: [
          {
            id: "human-maintainer",
            kind: "human",
            displayName: "Human Maintainer",
            description: "Final human authority for reviewed project changes.",
            roles: ["maintainer"],
            responsibilities: ["Review proposed changes.", "Resolve ambiguity and approve accepted work."],
            skills: ["project_review"]
          },
          {
            id: "developer-agent",
            kind: "agent",
            displayName: "Developer Agent",
            description: "AI participant that proposes project changes for human review.",
            roles: ["developer"],
            responsibilities: ["Draft project changes.", "Flag uncertainty and request human review."],
            skills: ["software_development"],
            agentRef: { kind: "agent", id: "developer-agent" }
          }
        ]
      }
    },
    {
      file: "agents.yaml",
      document: {
        specVersion: "0.1",
        kind: "AgentSet",
        metadata,
        agents: [{
          id: "developer-agent",
          displayName: "Developer Agent",
          role: "developer",
          description: "Proposes project changes without runtime authority.",
          responsibilities: ["Draft project changes.", "Flag uncertainty and request human review."],
          skills: ["software_development"]
        }]
      }
    }
  ].map(({ file, document }) => ({ file, contents: stringify(document, { lineWidth: 0 }) }));
}

function diagnostic(code, message, source) {
  return { code, severity: "error", message, ...(source ? { source } : {}) };
}

async function existingFileState(file, expected) {
  try {
    const details = await lstat(file);
    if (!details.isFile() || details.isSymbolicLink()) return "conflict";
    return await readFile(file, "utf8") === expected ? "skipped" : "conflict";
  } catch (error) {
    if (error?.code === "ENOENT") return "missing";
    throw error;
  }
}

export async function initializeProject({ root, projectId, displayName }) {
  const resolvedName = displayName ?? defaultDisplayName(projectId);
  let destination;
  try {
    const lexicalDestination = path.resolve(root);
    const details = await lstat(lexicalDestination);
    if (!details.isDirectory() || details.isSymbolicLink()) throw new Error("unsafe destination");
    destination = await realpath(lexicalDestination);
    if (!(await stat(destination)).isDirectory()) throw new Error("unsafe destination");
  } catch {
    return {
      valid: false,
      diagnostics: [diagnostic(
        "NEXFLOW-PROTOTYPE-INIT-DESTINATION",
        "Init destination must be an existing, non-symlinked local directory. No files were written."
      )]
    };
  }

  const templates = templateDocuments(projectId, resolvedName);
  const states = [];
  for (const template of templates) {
    const target = path.join(destination, template.file);
    if (path.dirname(target) !== destination) throw new Error("template escaped destination");
    states.push({ ...template, target, status: await existingFileState(target, template.contents) });
  }

  const conflicts = states.filter(({ status }) => status === "conflict");
  if (conflicts.length > 0) {
    return {
      valid: false,
      diagnostics: conflicts.map(({ file }) => diagnostic(
        "NEXFLOW-PROTOTYPE-INIT-CONFLICT",
        "Starter file already exists with different content or type. No files were written.",
        file
      ))
    };
  }

  const reservations = [];
  try {
    for (const entry of states.filter(({ status }) => status === "missing")) {
      reservations.push({ entry, handle: await open(entry.target, "wx", 0o644) });
    }
    for (const { entry, handle } of reservations) await handle.writeFile(entry.contents, "utf8");
  } catch (error) {
    for (const { handle } of reservations) await handle.close().catch(() => {});
    for (const { entry } of reservations) await unlink(entry.target).catch(() => {});
    if (error?.code === "EEXIST") {
      return {
        valid: false,
        diagnostics: [diagnostic(
          "NEXFLOW-PROTOTYPE-INIT-CONFLICT",
          "A starter file changed while initialization was preparing its writes. No files were retained."
        )]
      };
    }
    throw error;
  }
  for (const { handle } of reservations) await handle.close();

  return {
    valid: true,
    template: { name: INIT_TEMPLATE_NAME, version: INIT_TEMPLATE_VERSION, specVersion: "0.1" },
    files: states.map(({ file, status }) => ({ file, status: status === "missing" ? "created" : status })),
    reviewRequired: true
  };
}
