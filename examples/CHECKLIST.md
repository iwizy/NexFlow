# Example Consistency Checklist

Use this checklist when adding or changing a reference example.

Examples are part of the specification surface. They should remain small enough to review, but complete enough to show how NexFlow concepts fit together.

## Scope

- [ ] The example has a clear purpose and audience.
- [ ] The README explains when to use the example.
- [ ] The example remains specification-only and does not imply runtime behavior exists.
- [ ] The change is scoped to the example unless docs, schemas, or RFCs also need updates.

## File Set

- [ ] The example includes the expected manifest files listed in `examples/README.md`.
- [ ] `project.yaml` lists every manifest path that is present.
- [ ] Manifest file names match the common file set unless there is a documented reason.
- [ ] Each manifest uses `specVersion: "0.1"` until a new spec version is accepted.
- [ ] Each manifest uses the expected `kind`.
- [ ] YAML parses successfully.

## IDs And References

- [ ] Agent IDs are stable and unique within `agents.yaml`.
- [ ] Human actor IDs and agent IDs are not confused.
- [ ] Task IDs are unique within `tasks.yaml`.
- [ ] Workflow stage IDs and step IDs are unique within `workflow.yaml`.
- [ ] Handoff IDs are unique within `handoffs.yaml`.
- [ ] Capability IDs are defined in `capabilities.yaml` before use.
- [ ] Permission IDs are defined in `permissions.yaml` before use.
- [ ] Context source IDs are defined in `context.yaml` before use.
- [ ] Memory scope names are declared or standard.
- [ ] Provider IDs are defined in `providers.yaml` before use.
- [ ] Model profile IDs are defined in `model-profiles.yaml` before use.
- [ ] Prompt set IDs are defined in `prompt-sets.yaml` before use.
- [ ] Retrieval profile IDs are defined in `retrieval-profiles.yaml` before use.
- [ ] Extension IDs or namespaces are declared in `extensions.yaml` before use.
- [ ] References use the same spelling, case, and separator style everywhere.

## Agents And Agent Definitions

- [ ] Each agent has a role, description, responsibilities, and skills.
- [ ] Each agent lists only capabilities it actually needs in the example.
- [ ] Each agent references permissions that apply to that actor.
- [ ] Each agent's context access matches declared context sources.
- [ ] Each agent's memory access matches declared memory scopes.
- [ ] Each agent's autonomy level matches the example's safety posture.
- [ ] Each agent definition references an existing agent.
- [ ] Agent definitions reference existing model profiles, prompt sets, retrieval profiles, permissions, capabilities, context sources, memory scopes, and extensions.
- [ ] Agent definition review requirements are present for behavior-changing definitions.
- [ ] Compatibility notes explain behavior-significant changes.

## Capabilities, Permissions, And Approval Gates

- [ ] Capabilities describe technical ability, not policy approval.
- [ ] Permissions describe allow, deny, or approval-required policy decisions.
- [ ] High-risk capabilities are denied or approval-gated.
- [ ] Approval gates reference existing approvers.
- [ ] Approval gate IDs are reused consistently across project policy, permissions, tasks, workflows, and agent definitions.
- [ ] Dangerous actions do not rely on implied approval.
- [ ] Provider, extension, network, command, deployment, and destructive actions remain explicit.

## Tasks, Workflows, Handoffs, And Artifacts

- [ ] Each task has an owner that exists in `agents.yaml`.
- [ ] Task participants exist in `agents.yaml`.
- [ ] Task dependencies reference existing tasks.
- [ ] Task required capabilities exist in `capabilities.yaml`.
- [ ] Task approval gates match the risk of required capabilities.
- [ ] Workflow steps reference existing tasks.
- [ ] Workflow dependencies reference existing steps.
- [ ] Workflow emitted events are declared in `events.yaml`.
- [ ] Handoffs reference existing actors.
- [ ] Handoff artifacts are produced by prior or related tasks.
- [ ] Acceptance criteria are concrete and reviewable.
- [ ] Next actions are clear without implying autonomous execution.

## Context And Retrieval

- [ ] Context sources have clear type, access mode, classification, and freshness expectations.
- [ ] Agents only access context sources they need.
- [ ] Retrieval profiles reference declared context sources.
- [ ] Retrieval profiles declare freshness, citation, sensitivity, and review expectations.
- [ ] Web or remote sources include boundaries that avoid hidden network access.
- [ ] MCP or tool-like sources distinguish context access from tool execution.
- [ ] Private or sensitive prompt material is referenced, digested, or described without embedding raw private content.

## Memory

- [ ] Memory scopes are explicit.
- [ ] Retention, ownership, visibility, sensitivity, writers, and allowed consumers are clear.
- [ ] Cross-scope promotion is gated or prohibited where needed.
- [ ] Sensitive memory does not leak into broader scopes.
- [ ] Memory access in agents and agent definitions matches `memory.yaml`.
- [ ] Memory audit events are declared when the example expects memory updates.

## Providers, Models, Prompts, And Extensions

- [ ] Provider declarations remain provider-neutral unless the example intentionally demonstrates an extension.
- [ ] Model profiles explain selection mode, constraints, fallback, audit, and review triggers.
- [ ] Prompt sets avoid raw sensitive prompts when references or digests are enough.
- [ ] Prompt set owners and approvers exist.
- [ ] Extensions declare lifecycle state and required capabilities.
- [ ] Extensions do not grant access without matching capabilities and permissions.

## Events And Audit

- [ ] Events used by workflows, tasks, handoffs, memory, provider selection, or reviews are declared.
- [ ] Event payload expectations are specific enough to inspect.
- [ ] Envelope requirements match the event model.
- [ ] Audit and retention expectations are visible.
- [ ] Sensitive evidence is referenced rather than embedded when disclosure would be unsafe.

## Safety And Privacy

- [ ] No raw secrets, credentials, tokens, passwords, private keys, or local machine paths are present.
- [ ] No personal notes, local plans, or private workflow files are included.
- [ ] No manifest implies hidden network access.
- [ ] No manifest implies autonomous execution beyond declared autonomy and permissions.
- [ ] No example claims provider integration, runtime execution, or orchestration has been implemented.
- [ ] Unsafe behavior is either denied, approval-gated, or explicitly out of scope.

## Documentation And Change Control

- [ ] `examples/README.md` is updated if the example set changes.
- [ ] `examples/MATRIX.md` is updated if complexity, context, autonomy, gates, integrations, or learning order changes.
- [ ] `CHANGELOG.md` is updated for user-visible example changes.
- [ ] Relevant docs are updated if the example demonstrates new semantics.
- [ ] Relevant schemas are updated if manifest shape changes.
- [ ] An RFC is added or updated if the example depends on a new model decision.
- [ ] Compatibility impact is documented when an example changes expected meaning.

## Local Checks

- [ ] Check YAML syntax:

```sh
ruby -ryaml -e 'Dir["examples/**/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

- [ ] Check schema JSON syntax when schemas changed:

```sh
python3 - <<'PY'
import json
from pathlib import Path

for path in sorted(Path("schemas").glob("*.schema.json")):
    with path.open(encoding="utf-8") as handle:
        json.load(handle)
    print(f"ok {path}")
PY
```

- [ ] Inspect `git status --ignored` before staging and keep local-only files ignored.
