#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseDocument } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesDirectory = path.join(root, "examples");
const diagnostics = [];

function relative(file) {
  return path.relative(root, file) || ".";
}

function report(file, message) {
  diagnostics.push({ file: relative(file), code: "NF-SEMANTIC", message });
}

async function filesUnder(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(entryPath, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stringItems(value) {
  return asArray(value).filter((item) => typeof item === "string" && item.length > 0);
}

function addUnique(file, set, id, label) {
  if (typeof id !== "string" || id.length === 0) return;
  if (set.has(id)) {
    report(file, `duplicate ${label} ${JSON.stringify(id)}`);
  } else {
    set.add(id);
  }
}

function requireRefs(file, refs, targets, label, targetLabel) {
  for (const ref of stringItems(refs)) {
    if (!targets.has(ref)) {
      report(file, `${label} references unknown ${targetLabel} ${JSON.stringify(ref)}`);
    }
  }
}

function typedReferenceIds(file, value, label, expectedKind) {
  const references = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const ids = [];

  for (const reference of references) {
    if (typeof reference === "string") {
      ids.push(reference);
      continue;
    }

    if (reference === null || typeof reference !== "object" || Array.isArray(reference)) continue;

    if (reference.kind !== expectedKind) {
      report(file, `${label} requires reference kind ${JSON.stringify(expectedKind)}, found ${JSON.stringify(reference.kind)}`);
      continue;
    }

    if (typeof reference.id === "string" && reference.id.length > 0) ids.push(reference.id);
  }

  return ids;
}

function requireTypedRefs(file, value, targets, label, targetLabel, expectedKind) {
  const ids = typedReferenceIds(file, value, label, expectedKind);
  requireRefs(file, ids, targets, label, targetLabel);
  return ids;
}

function isHumanControlledActor(id, actorById, visiting = new Set()) {
  if (visiting.has(id)) return false;

  const actor = actorById.get(id);
  if (!actor) return false;
  if (actor.kind === "human") return true;
  if (actor.kind !== "authority") return false;

  const representatives = asArray(actor.representedBy)
    .filter((reference) => reference?.kind === "actor" && typeof reference?.id === "string")
    .map((reference) => reference.id);

  if (representatives.length === 0) return false;

  const nextVisiting = new Set(visiting);
  nextVisiting.add(id);
  return representatives.every((representative) =>
    isHumanControlledActor(representative, actorById, nextVisiting));
}

function reportReferenceCycles(file, graph, label) {
  const states = new Map();
  const stack = [];
  const reported = new Set();

  function visit(id) {
    const state = states.get(id);
    if (state === "done") return;

    if (state === "visiting") {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const signature = cycle.join(" -> ");
      if (!reported.has(signature)) {
        report(file, `${label} cycle ${cycle.map((item) => JSON.stringify(item)).join(" -> ")}`);
        reported.add(signature);
      }
      return;
    }

    states.set(id, "visiting");
    stack.push(id);
    for (const target of graph.get(id) ?? []) {
      if (graph.has(target)) visit(target);
    }
    stack.pop();
    states.set(id, "done");
  }

  for (const id of graph.keys()) visit(id);
}

function providerRefsFromModelProfile(profile) {
  const refs = [];
  refs.push(...stringItems(profile.selection?.providerRefs));
  refs.push(...asArray(profile.selection?.providerRefs)
    .map((entry) => entry?.providerRef)
    .filter((entry) => typeof entry === "string"));
  refs.push(...asArray(profile.fallback?.candidateProviderRefs)
    .map((entry) => typeof entry === "string" ? entry : entry?.providerRef)
    .filter((entry) => typeof entry === "string"));
  return refs;
}

function collectArtifacts(tasks) {
  const artifacts = new Set();
  for (const task of tasks) {
    for (const artifact of asArray(task.artifacts)) {
      if (typeof artifact?.id === "string") artifacts.add(artifact.id);
    }
  }
  return artifacts;
}

function collectWorkflowSteps(workflow) {
  const steps = new Set();
  for (const stage of asArray(workflow?.stages)) {
    for (const step of asArray(stage.steps)) {
      if (typeof step?.id === "string") steps.add(step.id);
    }
  }
  return steps;
}

function validateProjectSet(directory, manifests) {
  const projectFile = manifests.get("Project")?.file ?? directory;
  const project = manifests.get("Project")?.data?.project ?? {};
  const actorsFile = manifests.get("ActorSet")?.file ?? directory;
  const agentsFile = manifests.get("AgentSet")?.file ?? directory;
  const taskFile = manifests.get("TaskSet")?.file ?? directory;
  const workflowFile = manifests.get("Workflow")?.file ?? directory;
  const handoffFile = manifests.get("HandoffSet")?.file ?? directory;
  const permissionsFile = manifests.get("PermissionSet")?.file ?? directory;
  const capabilitiesFile = manifests.get("CapabilitySet")?.file ?? directory;
  const contextFile = manifests.get("ContextSet")?.file ?? directory;
  const memoryFile = manifests.get("MemorySet")?.file ?? directory;
  const providersFile = manifests.get("ProviderSet")?.file ?? directory;
  const modelProfilesFile = manifests.get("ModelProfileSet")?.file ?? directory;
  const promptSetsFile = manifests.get("PromptSet")?.file ?? directory;
  const retrievalProfilesFile = manifests.get("RetrievalProfileSet")?.file ?? directory;
  const agentDefinitionsFile = manifests.get("AgentDefinitionSet")?.file ?? directory;
  const eventsFile = manifests.get("EventSet")?.file ?? directory;
  const extensionsFile = manifests.get("ExtensionSet")?.file ?? directory;

  const agents = new Set();
  const actors = new Set();
  const tasks = new Set();
  const workflowSteps = new Set();
  const approvalGates = new Set();
  const permissions = new Set();
  const capabilities = new Set();
  const contextSources = new Set();
  const memoryScopes = new Set();
  const providers = new Set();
  const modelProfiles = new Set();
  const promptSets = new Set();
  const retrievalProfiles = new Set();
  const agentDefinitions = new Set();
  const eventTypes = new Set();
  const extensions = new Set();
  const networkRules = new Set();
  const hasActorSet = manifests.has("ActorSet");
  const actorData = asArray(manifests.get("ActorSet")?.data?.actors);
  const agentDefinitionData = asArray(manifests.get("AgentDefinitionSet")?.data?.agentDefinitions);
  const promptSetData = asArray(manifests.get("PromptSet")?.data?.promptSets);
  const retrievalProfileData = asArray(manifests.get("RetrievalProfileSet")?.data?.retrievalProfiles);
  const actorById = new Map(actorData
    .filter((actor) => typeof actor?.id === "string")
    .map((actor) => [actor.id, actor]));
  const promptSetById = new Map(promptSetData
    .filter((promptSet) => typeof promptSet?.id === "string")
    .map((promptSet) => [promptSet.id, promptSet]));
  const retrievalProfileById = new Map(retrievalProfileData
    .filter((profile) => typeof profile?.id === "string")
    .map((profile) => [profile.id, profile]));
  const activeDefinitionsByAgent = new Map();

  if (!hasActorSet) {
    for (const maintainer of asArray(project.maintainers)) {
      addUnique(projectFile, actors, maintainer?.id, "actor");
    }
  }

  for (const gate of asArray(project.approvalGates)) {
    addUnique(projectFile, approvalGates, gate?.id, "approval gate");
  }

  for (const agent of asArray(manifests.get("AgentSet")?.data?.agents)) {
    addUnique(agentsFile, agents, agent?.id, "agent");
    if (!hasActorSet && typeof agent?.id === "string") actors.add(agent.id);
  }

  if (hasActorSet) {
    for (const actor of actorData) {
      addUnique(actorsFile, actors, actor?.id, "actor");
    }
  }

  for (const task of asArray(manifests.get("TaskSet")?.data?.tasks)) {
    addUnique(taskFile, tasks, task?.id, "task");
  }

  const taskData = asArray(manifests.get("TaskSet")?.data?.tasks);
  const artifacts = collectArtifacts(taskData);
  const workflow = manifests.get("Workflow")?.data?.workflow;
  for (const step of collectWorkflowSteps(workflow)) workflowSteps.add(step);

  for (const permission of asArray(manifests.get("PermissionSet")?.data?.permissions)) {
    addUnique(permissionsFile, permissions, permission?.id, "permission");
  }

  for (const capability of asArray(manifests.get("CapabilitySet")?.data?.capabilities)) {
    addUnique(capabilitiesFile, capabilities, capability?.id, "capability");
  }

  for (const source of asArray(manifests.get("ContextSet")?.data?.contextSources)) {
    addUnique(contextFile, contextSources, source?.id, "context source");
  }

  for (const scope of asArray(manifests.get("MemorySet")?.data?.memoryScopes)) {
    addUnique(memoryFile, memoryScopes, scope?.scope, "memory scope");
  }

  for (const provider of asArray(manifests.get("ProviderSet")?.data?.providers)) {
    addUnique(providersFile, providers, provider?.id, "provider");
  }

  for (const profile of asArray(manifests.get("ModelProfileSet")?.data?.modelProfiles)) {
    addUnique(modelProfilesFile, modelProfiles, profile?.id, "model profile");
  }

  for (const promptSet of promptSetData) {
    addUnique(promptSetsFile, promptSets, promptSet?.id, "prompt set");
  }

  for (const profile of retrievalProfileData) {
    addUnique(retrievalProfilesFile, retrievalProfiles, profile?.id, "retrieval profile");
  }

  for (const definition of agentDefinitionData) {
    addUnique(agentDefinitionsFile, agentDefinitions, definition?.id, "agent definition");

    if (definition?.status === "active" && typeof definition?.agentRef === "string") {
      const activeDefinitions = activeDefinitionsByAgent.get(definition.agentRef) ?? [];
      activeDefinitions.push(definition);
      activeDefinitionsByAgent.set(definition.agentRef, activeDefinitions);
    }
  }

  for (const event of asArray(manifests.get("EventSet")?.data?.events)) {
    addUnique(eventsFile, eventTypes, event?.type, "event type");
  }

  for (const extension of asArray(manifests.get("ExtensionSet")?.data?.extensions)) {
    addUnique(extensionsFile, extensions, extension?.id, "extension");
  }

  const configuredNetworkAccess = project.policies?.networkAccess;
  const networkAccess = configuredNetworkAccess !== null
    && typeof configuredNetworkAccess === "object"
    && !Array.isArray(configuredNetworkAccess)
    ? configuredNetworkAccess
    : null;
  const configuredHumanOverride = project.policies?.humanOverride;
  const humanOverride = configuredHumanOverride !== null
    && typeof configuredHumanOverride === "object"
    && !Array.isArray(configuredHumanOverride)
    ? configuredHumanOverride
    : null;

  for (const rule of asArray(networkAccess?.rules)) {
    addUnique(projectFile, networkRules, rule?.id, "network access rule");
  }

  for (const gate of asArray(project.approvalGates)) {
    requireRefs(projectFile, gate?.requiredApprovers, actors, `approval gate ${JSON.stringify(gate?.id)}`, "actor");
  }

  if (hasActorSet) {
    const linkedAgents = new Set();
    const actorRelationships = new Map(actorData
      .filter((actor) => typeof actor?.id === "string")
      .map((actor) => [actor.id, []]));

    for (const maintainer of asArray(project.maintainers)) {
      requireRefs(projectFile, [maintainer?.id], actors, `project maintainer ${JSON.stringify(maintainer?.id)}`, "actor");
    }

    for (const actor of actorData) {
      const label = `actor ${JSON.stringify(actor?.id)}`;

      if (actor?.kind === "agent") {
        const agentRefs = requireTypedRefs(actorsFile, actor?.agentRef, agents, label, "agent", "agent");
        for (const agentRef of agentRefs) {
          if (linkedAgents.has(agentRef)) {
            report(actorsFile, `${label} duplicates agent bridge for ${JSON.stringify(agentRef)}`);
          } else {
            linkedAgents.add(agentRef);
          }
        }
      }

      const operators = requireTypedRefs(actorsFile, actor?.operatedBy, actors, label, "actor", "actor");
      const representatives = requireTypedRefs(actorsFile, actor?.representedBy, actors, label, "actor", "actor");
      requireTypedRefs(actorsFile, actor?.integrationRef, extensions, label, "extension", "extension");

      if (typeof actor?.id === "string") {
        actorRelationships.set(actor.id, [...operators, ...representatives]);
      }
    }

    for (const agent of agents) {
      if (!linkedAgents.has(agent)) {
        report(actorsFile, `agent ${JSON.stringify(agent)} has no ActorSet bridge`);
      }
    }

    reportReferenceCycles(actorsFile, actorRelationships, "actor relationship");
  }

  for (const rule of asArray(networkAccess?.rules)) {
    const label = `network access rule ${JSON.stringify(rule?.id)}`;
    requireRefs(projectFile, rule?.actors, actors, label, "actor");
    requireRefs(projectFile, rule?.capabilities, capabilities, label, "capability");
    requireRefs(projectFile, rule?.destinations?.contextSources, contextSources, label, "context source");
    requireRefs(projectFile, rule?.destinations?.providers, providers, label, "provider");
    requireRefs(projectFile, rule?.destinations?.extensions, extensions, label, "extension");
    requireRefs(projectFile, [rule?.approvalGate], approvalGates, label, "approval gate");
  }

  requireRefs(projectFile, networkAccess?.audit?.events, eventTypes, "network access audit", "event type");

  if (humanOverride) {
    const label = "human override policy";

    if (!hasActorSet) {
      report(projectFile, `${label} requires ActorSet for typed human authority resolution`);
    } else {
      const authorityIds = requireTypedRefs(
        projectFile,
        humanOverride.authorities,
        actors,
        label,
        "actor",
        "actor"
      );

      for (const authorityId of authorityIds) {
        if (!isHumanControlledActor(authorityId, actorById)) {
          report(
            projectFile,
            `${label} authority ${JSON.stringify(authorityId)} is not a human or fully human-represented authority`
          );
        }
      }
    }

    requireRefs(
      projectFile,
      [humanOverride.resume?.approvalGate],
      approvalGates,
      `${label} resume`,
      "approval gate"
    );
    requireRefs(
      projectFile,
      humanOverride.audit?.events,
      eventTypes,
      `${label} audit`,
      "event type"
    );
  }

  for (const [agentRef, activeDefinitions] of activeDefinitionsByAgent) {
    if (activeDefinitions.length > 1) {
      report(
        agentDefinitionsFile,
        `agent ${JSON.stringify(agentRef)} has multiple unscoped active definitions: ${activeDefinitions
          .map((definition) => JSON.stringify(definition.id))
          .join(", ")}`
      );
    }
  }

  for (const agent of asArray(manifests.get("AgentSet")?.data?.agents)) {
    requireRefs(agentsFile, agent?.permissions, permissions, `agent ${JSON.stringify(agent?.id)}`, "permission");
    requireRefs(agentsFile, agent?.capabilities, capabilities, `agent ${JSON.stringify(agent?.id)}`, "capability");
    requireRefs(agentsFile, agent?.contextAccess, contextSources, `agent ${JSON.stringify(agent?.id)}`, "context source");
    requireRefs(agentsFile, agent?.memoryAccess, memoryScopes, `agent ${JSON.stringify(agent?.id)}`, "memory scope");
    requireRefs(agentsFile, agent?.providerPreferences?.map((entry) => entry?.provider), providers, `agent ${JSON.stringify(agent?.id)}`, "provider");
    requireRefs(agentsFile, agent?.extensions, extensions, `agent ${JSON.stringify(agent?.id)}`, "extension");
  }

  for (const task of taskData) {
    const label = `task ${JSON.stringify(task?.id)}`;
    requireRefs(taskFile, [task?.owner], actors, label, "actor");
    requireRefs(taskFile, task?.participants, actors, label, "actor");
    requireRefs(taskFile, task?.dependsOn, tasks, label, "task");
    requireRefs(taskFile, task?.capabilitiesRequired, capabilities, label, "capability");
    requireRefs(taskFile, task?.approvalGates, approvalGates, label, "approval gate");
  }

  for (const stage of asArray(workflow?.stages)) {
    for (const step of asArray(stage.steps)) {
      const label = `workflow step ${JSON.stringify(step?.id)}`;
      requireRefs(workflowFile, [step?.task], tasks, label, "task");
      requireRefs(workflowFile, step?.dependsOn, workflowSteps, label, "workflow step");
      requireRefs(workflowFile, step?.approvalGates, approvalGates, label, "approval gate");
      requireRefs(workflowFile, step?.emits, eventTypes, label, "event type");
    }
  }

  for (const dependency of asArray(workflow?.dependencies)) {
    const label = `workflow dependency ${JSON.stringify(dependency?.from)} -> ${JSON.stringify(dependency?.to)}`;
    requireRefs(workflowFile, [dependency?.from, dependency?.to], workflowSteps, label, "workflow step");
  }

  for (const handoff of asArray(manifests.get("HandoffSet")?.data?.handoffs)) {
    const label = `handoff ${JSON.stringify(handoff?.id)}`;
    requireRefs(handoffFile, handoff?.from, actors, label, "actor");
    requireRefs(handoffFile, handoff?.to, actors, label, "actor");
    requireRefs(handoffFile, handoff?.artifacts, artifacts, label, "artifact");
  }

  for (const permission of asArray(manifests.get("PermissionSet")?.data?.permissions)) {
    const label = `permission ${JSON.stringify(permission?.id)}`;
    requireRefs(permissionsFile, permission?.subjects, actors, label, "actor");
    requireRefs(permissionsFile, permission?.capabilities, capabilities, label, "capability");
    requireRefs(permissionsFile, [permission?.approvalGate], approvalGates, label, "approval gate");
  }

  for (const source of asArray(manifests.get("ContextSet")?.data?.contextSources)) {
    const label = `context source ${JSON.stringify(source?.id)}`;
    requireRefs(contextFile, source?.access?.allowedActors, actors, label, "actor");
    requireRefs(contextFile, source?.approvalGates, approvalGates, label, "approval gate");
  }

  for (const scope of asArray(manifests.get("MemorySet")?.data?.memoryScopes)) {
    const label = `memory scope ${JSON.stringify(scope?.scope)}`;
    requireRefs(memoryFile, scope?.allowedConsumers, actors, label, "actor");
    requireRefs(memoryFile, scope?.allowedWriters, actors, label, "actor");
    requireRefs(memoryFile, [scope?.approvalGate], approvalGates, label, "approval gate");
  }

  for (const profile of asArray(manifests.get("ModelProfileSet")?.data?.modelProfiles)) {
    const label = `model profile ${JSON.stringify(profile?.id)}`;
    requireRefs(modelProfilesFile, providerRefsFromModelProfile(profile), providers, label, "provider");
    requireRefs(modelProfilesFile, profile?.review?.approvers, actors, label, "actor");
    requireRefs(modelProfilesFile, profile?.recommendedFor, agents, label, "agent");
  }

  for (const promptSet of promptSetData) {
    const label = `prompt set ${JSON.stringify(promptSet?.id)}`;
    requireRefs(promptSetsFile, [promptSet?.owner], actors, label, "actor");
    requireRefs(promptSetsFile, promptSet?.review?.approvers, actors, label, "actor");
    requireRefs(promptSetsFile, promptSet?.compatibility?.affectedAgents, agents, label, "agent");
    requireRefs(promptSetsFile, promptSet?.recommendedFor, agents, label, "agent");
  }

  for (const profile of retrievalProfileData) {
    const label = `retrieval profile ${JSON.stringify(profile?.id)}`;
    requireRefs(retrievalProfilesFile, [profile?.owner], actors, label, "actor");
    requireRefs(retrievalProfilesFile, profile?.sources?.map((source) => source?.contextSourceRef), contextSources, label, "context source");
    requireRefs(retrievalProfilesFile, profile?.review?.approvers, actors, label, "actor");
    requireRefs(retrievalProfilesFile, profile?.compatibility?.affectedAgents, agents, label, "agent");
    requireRefs(retrievalProfilesFile, profile?.recommendedFor, agents, label, "agent");
  }

  for (const definition of agentDefinitionData) {
    const label = `agent definition ${JSON.stringify(definition?.id)}`;
    requireRefs(agentDefinitionsFile, [definition?.agentRef], agents, label, "agent");
    requireRefs(agentDefinitionsFile, [definition?.owner], actors, label, "actor");
    requireRefs(agentDefinitionsFile, [definition?.components?.modelProfileRef], modelProfiles, label, "model profile");
    requireRefs(agentDefinitionsFile, [definition?.components?.promptSetRef], promptSets, label, "prompt set");
    requireRefs(agentDefinitionsFile, [definition?.components?.retrievalProfileRef], retrievalProfiles, label, "retrieval profile");
    requireRefs(agentDefinitionsFile, definition?.components?.permissionRefs, permissions, label, "permission");
    requireRefs(agentDefinitionsFile, definition?.components?.capabilityRefs, capabilities, label, "capability");
    requireRefs(agentDefinitionsFile, definition?.components?.contextSourceRefs, contextSources, label, "context source");
    requireRefs(agentDefinitionsFile, definition?.components?.memoryScopes, memoryScopes, label, "memory scope");
    requireRefs(agentDefinitionsFile, definition?.components?.extensionRefs, extensions, label, "extension");
    requireRefs(agentDefinitionsFile, definition?.review?.approvers, actors, label, "actor");
    requireRefs(agentDefinitionsFile, [definition?.review?.approvalGate], approvalGates, label, "approval gate");
    requireRefs(agentDefinitionsFile, definition?.compatibility?.affectedAgents, agents, label, "agent");
    requireRefs(agentDefinitionsFile, definition?.audit?.events, eventTypes, label, "event type");

    if (definition?.status === "active") {
      const promptSet = promptSetById.get(definition?.components?.promptSetRef);
      const retrievalProfile = retrievalProfileById.get(definition?.components?.retrievalProfileRef);

      if (promptSet && promptSet.status !== "active") {
        report(
          agentDefinitionsFile,
          `${label} references prompt set ${JSON.stringify(promptSet.id)} with lifecycle status ${JSON.stringify(promptSet.status)}`
        );
      }

      if (
        promptSet?.review?.required === true
        && promptSet?.review?.safetyReviewStatus !== "approved"
      ) {
        report(
          agentDefinitionsFile,
          `${label} references prompt set ${JSON.stringify(promptSet.id)} without approved safety review`
        );
      }

      if (retrievalProfile && retrievalProfile.status !== "active") {
        report(
          agentDefinitionsFile,
          `${label} references retrieval profile ${JSON.stringify(retrievalProfile.id)} with lifecycle status ${JSON.stringify(retrievalProfile.status)}`
        );
      }
    }
  }

  for (const extension of asArray(manifests.get("ExtensionSet")?.data?.extensions)) {
    const label = `extension ${JSON.stringify(extension?.id)}`;
    requireRefs(extensionsFile, extension?.requiredCapabilities, capabilities, label, "capability");
  }
}

const manifestFiles = await filesUnder(examplesDirectory, (name) => /\.ya?ml$/u.test(name));
const projects = new Map();

for (const file of manifestFiles) {
  let manifest;

  try {
    const document = parseDocument(await readFile(file, "utf8"), {
      maxAliasCount: 100,
      uniqueKeys: true
    });

    if (document.errors.length > 0) continue;
    manifest = document.toJS({ maxAliasCount: 100 });
  } catch {
    continue;
  }

  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) continue;

  const projectDirectory = path.dirname(file);
  if (!projects.has(projectDirectory)) projects.set(projectDirectory, new Map());

  const kind = manifest.kind;
  if (typeof kind === "string" && kind.length > 0) {
    projects.get(projectDirectory).set(kind, { file, data: manifest });
  }
}

for (const [directory, manifests] of [...projects.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  validateProjectSet(directory, manifests);
}

if (diagnostics.length > 0) {
  console.error(`NexFlow semantic reference smoke checks failed with ${diagnostics.length} diagnostic(s):`);
  for (const diagnostic of diagnostics) {
    console.error(`${diagnostic.file}\n  ${diagnostic.code}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Semantic reference smoke checks passed for ${projects.size} example project(s).`);
  console.log("Checked core actor identity, agent bridges, active definition authority, task, workflow, artifact, permission, network policy, human override, context, profile, gate, event, and extension references.");
  console.log("This is a repository smoke check, not full semantic validation.");
}
