const disabledRuntimeEffects = Object.freeze({
  network: false,
  processExecution: false,
  credentialAccess: false,
  providerCalls: false,
  extensionLoading: false,
  runtimePreflight: false,
  workflowExecution: false,
  backgroundWork: false
});
const budgetFields = Object.freeze(["projectRead", "projectWrite", ...Object.keys(disabledRuntimeEffects)].sort());

function effectBudget(projectRead, projectWrite) {
  return Object.freeze({
    projectRead,
    projectWrite,
    ...disabledRuntimeEffects
  });
}

export const CLI_OPERATION_COMMANDS = Object.freeze([
  "discover",
  "validate",
  "inspect",
  "graph",
  "init"
]);

export const CLI_EFFECT_BUDGETS = Object.freeze({
  help: effectBudget("none", "none"),
  version: effectBudget("none", "none"),
  discover: effectBudget("selected-manifests", "none"),
  validate: effectBudget("selected-manifests-and-local-schemas", "none"),
  inspect: effectBudget("selected-manifests-and-local-schemas", "none"),
  graph: effectBudget("selected-manifests-and-local-schemas", "none"),
  init: effectBudget("built-in-template-and-existing-targets", "fixed-starter-files")
});

export function assertCliEffectBudget(command) {
  if (!Object.hasOwn(CLI_EFFECT_BUDGETS, command)) {
    throw new Error("Command has no CLI effect budget");
  }
  const budget = CLI_EFFECT_BUDGETS[command];
  if (JSON.stringify(Object.keys(budget).sort()) !== JSON.stringify(budgetFields)) {
    throw new Error("CLI effect budget has an unknown field");
  }
  for (const [effect, allowed] of Object.entries(disabledRuntimeEffects)) {
    if (budget[effect] !== allowed) throw new Error("CLI runtime effect budget widened");
  }
  return budget;
}
