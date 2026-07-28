#!/usr/bin/env node

import {
  validateArtifactNamespace,
  validateWorkflowStepNamespace
} from "./lib/work-reference-namespaces.mjs";

function workflow(stages, dependencies = []) {
  return {
    id: "delivery",
    stages,
    dependencies
  };
}

function stage(id, steps) {
  return { id, steps };
}

function step(id, dependsOn = []) {
  return { id, task: `${id}-task`, dependsOn };
}

function task(id, artifactIds) {
  return {
    id,
    artifacts: artifactIds.map((artifactId) => ({ id: artifactId, type: "document" }))
  };
}

function diagnosticCodes(result) {
  return result.diagnostics.map((diagnostic) => diagnostic.code).sort();
}

const cases = [
  {
    name: "cross-stage dependency resolves in one workflow",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow([
      stage("build", [step("implement")]),
      stage("review", [step("verify", ["implement"])])
    ]))),
    expected: []
  },
  {
    name: "duplicate step in one stage is rejected",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow([
      stage("build", [step("implement"), step("implement")])
    ]))),
    expected: ["duplicate-workflow-step"]
  },
  {
    name: "duplicate step across stages is rejected",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow([
      stage("build", [step("review")]),
      stage("release", [step("review")])
    ]))),
    expected: ["duplicate-workflow-step"]
  },
  {
    name: "same step ID in separate workflows is valid",
    actual: () => [
      ...diagnosticCodes(validateWorkflowStepNamespace({
        id: "build",
        stages: [stage("work", [step("review")])]
      })),
      ...diagnosticCodes(validateWorkflowStepNamespace({
        id: "release",
        stages: [stage("work", [step("review")])]
      }))
    ],
    expected: []
  },
  {
    name: "unknown inline step dependency is rejected",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow([
      stage("build", [step("implement", ["missing-review"])])
    ]))),
    expected: ["unknown-workflow-step"]
  },
  {
    name: "workflow dependency endpoints use the same step namespace",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow(
      [stage("build", [step("implement"), step("verify")])],
      [{ from: "implement", to: "verify" }]
    ))),
    expected: []
  },
  {
    name: "unknown workflow dependency endpoint is rejected",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow(
      [stage("build", [step("implement")])],
      [{ from: "implement", to: "missing-release" }]
    ))),
    expected: ["unknown-workflow-step"]
  },
  {
    name: "duplicate workflow stage is rejected",
    actual: () => diagnosticCodes(validateWorkflowStepNamespace(workflow([
      stage("build", [step("implement")]),
      stage("build", [step("verify")])
    ]))),
    expected: ["duplicate-workflow-stage"]
  },
  {
    name: "handoff resolves artifact produced by another task",
    actual: () => diagnosticCodes(validateArtifactNamespace(
      [task("implement", ["change-set"]), task("review", ["review-report"])],
      [{ id: "implementation-to-review", artifacts: ["change-set"] }]
    )),
    expected: []
  },
  {
    name: "duplicate artifact in one task is rejected",
    actual: () => diagnosticCodes(validateArtifactNamespace([
      task("implement", ["change-set", "change-set"])
    ])),
    expected: ["duplicate-artifact"]
  },
  {
    name: "duplicate artifact across tasks is rejected",
    actual: () => diagnosticCodes(validateArtifactNamespace([
      task("implement", ["evidence"]),
      task("review", ["evidence"])
    ])),
    expected: ["duplicate-artifact"]
  },
  {
    name: "unknown handoff artifact is rejected",
    actual: () => diagnosticCodes(validateArtifactNamespace(
      [task("implement", ["change-set"])],
      [{ id: "implementation-to-review", artifacts: ["missing-evidence"] }]
    )),
    expected: ["unknown-artifact"]
  },
  {
    name: "same artifact ID in separate assemblies is valid",
    actual: () => [
      ...diagnosticCodes(validateArtifactNamespace([task("build", ["report"])])),
      ...diagnosticCodes(validateArtifactNamespace([task("publish", ["report"])]))
    ],
    expected: []
  }
];

let failed = false;

for (const testCase of cases) {
  const actual = testCase.actual();
  if (JSON.stringify(actual) === JSON.stringify(testCase.expected)) continue;

  failed = true;
  console.error(
    `${testCase.name}: expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(actual)}`
  );
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Work reference namespace checks passed for ${cases.length} cases.`);
  console.log(
    "These checks cover workflow-scoped step identity and assembly-scoped task artifact identity, not graph ordering or artifact provenance."
  );
}
