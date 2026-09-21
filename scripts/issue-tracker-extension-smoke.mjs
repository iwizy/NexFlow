#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { isAlias, parseDocument, visit } from "yaml";

async function readYaml(path) {
  const document = parseDocument(await readFile(path, "utf8"), { uniqueKeys: true });
  assert.equal(document.errors.length, 0, `${path}: invalid YAML`);
  visit(document, (_key, node) => {
    assert.equal(isAlias(node), false, `${path}: aliases are forbidden`);
  });
  return document.toJS({ maxAliasCount: 0 });
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = JSON.parse(await readFile("extensions/issue-tracker/profile.schema.json", "utf8"));
const validate = ajv.compile(schema);
const profile = await readYaml("extensions/issue-tracker/profile.yaml");
let count = 0;

function check(name, value, expected, validator = validate) {
  const actual = validator(value);
  assert.equal(actual, expected, `${name}: ${JSON.stringify(validator.errors)}`);
  count += 1;
}

function mutation(name, change, expected = false) {
  const value = structuredClone(profile);
  change(value);
  check(name, value, expected);
}

check("maintained profile", profile, true);
mutation("unknown namespace", (v) => { v.namespace = "io.nexflow.jira"; });
mutation("future profile requires explicit support", (v) => { v.profileVersion = "0.2-draft"; });
mutation("not a stable support claim", (v) => { v.status = "stable"; });
mutation("provider ownership", (v) => { v.provider.authority = "nexflow"; });
mutation("provider instance scope required", (v) => { v.provider.binding = "infer_from_url"; });
mutation("no embedded token", (v) => { v.provider.token = "fictional-placeholder"; });
mutation("no new manifest kind", (v) => { v.kind = "IssueTrackerProfile"; });
mutation("missing issue surface", (v) => { v.surfaces.splice(1, 1); });
mutation("duplicate surface cannot replace identity", (v) => { v.surfaces[3] = structuredClone(v.surfaces[1]); });
mutation("surface class cannot be swapped", (v) => { v.surfaces[1].class = "identity"; });
mutation("provider ownership cannot be removed", (v) => { v.surfaces[1].providerOwned = false; });
mutation("issue does not become local task", (v) => { v.surfaces[1].nexflowTreatment = "taskset"; });
mutation("status does not complete local task", (v) => { v.surfaces[2].nexflowTreatment = "local_completion"; });
mutation("assignee does not become local actor", (v) => { v.surfaces[3].nexflowTreatment = "actor"; });
mutation("comment does not grant approval", (v) => { v.surfaces[4].nexflowTreatment = "approval_decision"; });
mutation("attachment needs provenance", (v) => { v.surfaces[5].nexflowTreatment = "accepted_artifact"; });
mutation("webhook is untrusted", (v) => { v.surfaces[6].nexflowTreatment = "trusted_event"; });
mutation("display key is not identity", (v) => { v.requirements.references.displayKeys = "stable_identity"; });
mutation("no new core reference kind", (v) => { v.requirements.references.coreTypedReferences = "issue"; });
mutation("no implicit task correlation", (v) => { v.requirements.references.taskCorrelation = "match_title"; });
mutation("content instructions carry no authority", (v) => { v.requirements.content.instructions = "follow"; });
mutation("links need independent authorization", (v) => { v.requirements.content.linkedContent = "inherit"; });
mutation("classification cannot drop on import", (v) => { v.requirements.content.classification = "public"; });
mutation("no delete operation", (v) => { v.requirements.operations[2].id = "delete_issue"; });
mutation("operation inventory cannot shrink", (v) => { v.requirements.operations.pop(); });
mutation("operation cannot expand effect", (v) => { v.requirements.operations[0].effect = "write"; });
mutation("duplicate with reordered capabilities cannot replace operation", (v) => {
  v.requirements.operations[4] = structuredClone(v.requirements.operations[1]);
  v.requirements.operations[4].requiredCapabilities.reverse();
});
for (const id of ["create_issue", "update_issue", "add_comment", "transition_issue"]) {
  mutation(`${id} cannot bypass approval`, (v) => {
    v.requirements.operations.find((op) => op.id === id).approvalPolicy = "local_policy";
  });
  mutation(`${id} requires effect capability`, (v) => {
    v.requirements.operations.find((op) => op.id === id).requiredCapabilities.shift();
  });
}
mutation("write credential capability required", (v) => { v.requirements.operations[1].requiredCapabilities.pop(); });
mutation("read needs network authority", (v) => { v.requirements.operations[0].requiredCapabilities.pop(); });
mutation("permission is independently required", (v) => { v.requirements.authorization.permissionRequired = false; });
mutation("remote state grants no local authority", (v) => { v.requirements.authorization.remoteState = "local_acceptance"; });
mutation("operation approval must remain scoped", (v) => { v.requirements.authorization.operationScope = "all_tracker_actions"; });
mutation("no background sync", (v) => { v.requirements.synchronization.mode = "bidirectional"; });
mutation("no universal state mapping", (v) => { v.requirements.synchronization.stateMapping = "closed_means_completed"; });
mutation("write freshness cannot be skipped", (v) => { v.requirements.synchronization.freshness = "ignore"; });
mutation("no last-write-wins on conflict", (v) => { v.requirements.synchronization.conflicts = "overwrite"; });
mutation("no blind retry", (v) => { v.requirements.synchronization.retries = "retry_until_success"; });
mutation("echo cannot reauthorize", (v) => { v.requirements.synchronization.echoHandling = "repeat_mutation"; });
mutation("inbound unsupported", (v) => { v.requirements.network.inboundWebhooks = "enabled"; });
mutation("outbound policy required", (v) => { delete v.requirements.network.outboundPolicy; });
mutation("authenticated reads need credentials policy", (v) => { v.requirements.credentials.authenticatedReads = "ambient_token"; });
mutation("credential material remains external", (v) => { v.requirements.credentials.manifestSecrets = "allowed"; });
mutation("unknown operations stay inert", (v) => { v.failurePolicy.unknownOperation = "execute"; });
mutation("ambiguous identity fails closed", (v) => { v.failurePolicy.ambiguousIdentityOrMapping = "guess"; });
mutation("uncertain outcome is not failure", (v) => { v.failurePolicy.uncertainWriteOutcome = "retry"; });
mutation("audit cannot omit mutation decisions", (v) => {
  v.requirements.audit.requiredFor = v.requirements.audit.requiredFor.filter((id) => id !== "mutation_decision");
});
mutation("audit cannot substitute duplicate entry", (v) => {
  v.requirements.audit.requiredFor[1] = v.requirements.audit.requiredFor[0];
});
mutation("network requirement block cannot disappear", (v) => { delete v.requirements.network; });
mutation("inventory ordering is not authority", (v) => {
  v.surfaces.reverse();
  v.requirements.operations.reverse();
  for (const op of v.requirements.operations) op.requiredCapabilities.reverse();
  v.requirements.audit.requiredFor.reverse();
}, true);

// Declaration fragments use existing manifest schemas, not a new binding format.
const manifestAjv = new Ajv2020({ allErrors: true, strict: false });
addFormats(manifestAjv);
manifestAjv.addSchema(JSON.parse(await readFile("schemas/common.schema.json", "utf8")));
const manifestValidators = {};
for (const name of ["extensions", "context"]) {
  manifestValidators[name] = manifestAjv.compile(JSON.parse(await readFile(`schemas/${name}.schema.json`, "utf8")));
}
const extension = await readYaml("extensions/issue-tracker/extension.example.yaml");
const context = await readYaml("extensions/issue-tracker/context.example.yaml");
check("extension fragment uses existing manifest schema", extension, true, manifestValidators.extensions);
check("context fragment uses existing manifest schema", context, true, manifestValidators.context);

// Selected static adoption checks only; this is not a runtime binding validator.
function adoptionMatches({ extension, context }) {
  if (!manifestValidators.extensions(extension) || !manifestValidators.context(context)) return false;
  if (extension.metadata.project !== context.metadata.project) return false;
  if (extension.extensions.length !== 1 || context.contextSources.length !== 1) return false;
  const declaration = extension.extensions[0];
  const source = context.contextSources[0];
  const requirements = profile.requirements;
  return declaration.namespace === profile.namespace
    && requirements.extension.lifecycle.includes(declaration.lifecycle)
    && declaration.appliesTo?.length > 0
    && declaration.appliesTo.every((area) => requirements.extension.appliesTo.includes(area))
    && requirements.extension.requiredCapabilities.every((capability) => declaration.requiredCapabilities?.includes(capability))
    && requirements.contextSource.allowedTypes.includes(source.type)
    && requirements.contextSource.requiredFields.every((field) => Object.hasOwn(source, field))
    && typeof source.uri === "string" && source.uri.trim().length > 0
    && source.contentTypes.length > 0
    && source.contentTypes.every((type) => requirements.contextSource.allowedContentTypes.includes(type));
}
const binding = { extension, context };
check("read-only adoption fragments", binding, true, adoptionMatches);
function bindingMutation(name, change, expected = false) {
  const value = structuredClone(binding);
  change(value);
  check(name, value, expected, adoptionMatches);
}
bindingMutation("provider namespace is not automatic adoption", (v) => { v.extension.extensions[0].namespace = "io.nexflow.jira"; });
bindingMutation("read baseline needs network capability", (v) => { v.extension.extensions[0].requiredCapabilities.pop(); });
bindingMutation("context URI required for adoption", (v) => { delete v.context.contextSources[0].uri; });
bindingMutation("blank context scope rejected", (v) => { v.context.contextSources[0].uri = " "; });
bindingMutation("empty content categories rejected", (v) => { v.context.contextSources[0].contentTypes = []; });
bindingMutation("source code is outside issue profile", (v) => { v.context.contextSources[0].contentTypes = ["source_code"]; });
bindingMutation("unrelated context type rejected", (v) => { v.context.contextSources[0].type = "figma"; });
bindingMutation("project mismatch rejected", (v) => { v.context.metadata.project = "other-project"; });
for (const type of ["github", "gitlab", "jira", "linear"]) {
  bindingMutation(`${type} context is structurally eligible, not runtime support`, (v) => { v.context.contextSources[0].type = type; }, true);
}

console.log(`Issue tracker extension checks passed for ${count} cases.`);
console.log("Validated profile and fictional declaration boundaries offline; no tracker access, synchronization, or runtime enforcement.");
