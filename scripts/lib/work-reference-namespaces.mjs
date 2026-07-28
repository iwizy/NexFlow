function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function validId(value) {
  return typeof value === "string" && value.length > 0;
}

function quoted(value) {
  return JSON.stringify(value);
}

export function validateWorkflowStepNamespace(workflow) {
  const workflowId = validId(workflow?.id) ? workflow.id : "<unknown>";
  const stageOwners = new Map();
  const stepOwners = new Map();
  const diagnostics = [];

  for (const stage of asArray(workflow?.stages)) {
    const stageId = validId(stage?.id) ? stage.id : "<unknown>";

    if (validId(stage?.id)) {
      const firstStage = stageOwners.get(stage.id);
      if (firstStage) {
        diagnostics.push({
          code: "duplicate-workflow-stage",
          message: `duplicate workflow stage ${quoted(stage.id)} in workflow ${quoted(workflowId)}`
        });
      } else {
        stageOwners.set(stage.id, stage);
      }
    }

    for (const step of asArray(stage?.steps)) {
      if (!validId(step?.id)) continue;

      const firstOwner = stepOwners.get(step.id);
      if (firstOwner) {
        diagnostics.push({
          code: "duplicate-workflow-step",
          message: `duplicate workflow step ${quoted(step.id)} in workflow ${quoted(workflowId)}; first declared in stage ${quoted(firstOwner.stageId)}, repeated in stage ${quoted(stageId)}`
        });
      } else {
        stepOwners.set(step.id, { stageId, step });
      }
    }
  }

  const ids = new Set(stepOwners.keys());

  for (const { step } of stepOwners.values()) {
    for (const dependency of asArray(step?.dependsOn)) {
      if (validId(dependency) && !ids.has(dependency)) {
        diagnostics.push({
          code: "unknown-workflow-step",
          message: `workflow step ${quoted(step.id)} references unknown workflow step ${quoted(dependency)} in workflow ${quoted(workflowId)}`
        });
      }
    }
  }

  for (const dependency of asArray(workflow?.dependencies)) {
    const edge = `${quoted(dependency?.from)} -> ${quoted(dependency?.to)}`;
    for (const endpoint of ["from", "to"]) {
      const reference = dependency?.[endpoint];
      if (validId(reference) && !ids.has(reference)) {
        diagnostics.push({
          code: "unknown-workflow-step",
          message: `workflow dependency ${edge} references unknown workflow step ${quoted(reference)} in workflow ${quoted(workflowId)}`
        });
      }
    }
  }

  return { ids, diagnostics };
}

export function validateArtifactNamespace(tasks, handoffs = []) {
  const artifactOwners = new Map();
  const diagnostics = [];

  for (const task of asArray(tasks)) {
    const taskId = validId(task?.id) ? task.id : "<unknown>";

    for (const artifact of asArray(task?.artifacts)) {
      if (!validId(artifact?.id)) continue;

      const firstOwner = artifactOwners.get(artifact.id);
      if (firstOwner) {
        diagnostics.push({
          code: "duplicate-artifact",
          source: "tasks",
          message: `duplicate artifact ${quoted(artifact.id)}; first declared by task ${quoted(firstOwner.taskId)}, repeated by task ${quoted(taskId)}`
        });
      } else {
        artifactOwners.set(artifact.id, { taskId, artifact });
      }
    }
  }

  const ids = new Set(artifactOwners.keys());

  for (const handoff of asArray(handoffs)) {
    for (const artifactRef of asArray(handoff?.artifacts)) {
      if (validId(artifactRef) && !ids.has(artifactRef)) {
        diagnostics.push({
          code: "unknown-artifact",
          source: "handoffs",
          message: `handoff ${quoted(handoff?.id)} references unknown artifact ${quoted(artifactRef)}`
        });
      }
    }
  }

  return { ids, diagnostics };
}
