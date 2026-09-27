# Adopter Guide

Use this guide to introduce NexFlow into a project as a reviewed description of
participants, responsibilities, work, and policy. The first useful result is a
small manifest set that your team understands and can validate reproducibly.

Current adoption uses the draft specification, maintained examples, JSON
Schemas, and experimental repository tools. Task execution, model calls,
policy enforcement, live integrations, and extension loading remain outside
the implemented repository scope. See the
[Compatibility Matrix](compatibility-matrix.md) before choosing an integration
or making a support claim.

## Choose A Starting Point

Start with the smallest example that answers your immediate question.

| Goal | Starting point | First deliverable |
| --- | --- | --- |
| Describe who participates and who reviews changes | [Minimal Team](../examples/minimal-team/) | Project, authoritative ActorSet, and compact AgentSet. |
| Describe one human working with a coding assistant | [Solo Developer](../examples/solo-developer/) | Reviewed identity, policy, tasks, context, handoff, and event declarations. |
| Compare a broader team composition | [Examples Guide](../examples/README.md) and [Example Matrix](../examples/MATRIX.md) | A selected subset of a complete reference example, with dependencies reviewed. |
| Implement an independent validator or integration | [Schema Guide](../schemas/README.md), [Conformance](conformance.md), and [Extension Profiles](../extensions/README.md) | An explicit scope, pinned contracts, positive and negative evidence, and known gaps. |

The complete examples are learning material. Their six legacy project sets
contain draft agent definitions; copying them does not create a selected active
configuration. The [Core Profile](core-profile.md) defines the minimum slots,
optional modules, and dependency closure rules.

## 1. Define A Small Pilot

Choose one project and name the human who owns its review. Record:

- the adoption goal and the first deliverable
- the participants and their responsibilities
- the modules you intend to describe
- the specification, schema, and tool revisions you will use
- the validation and manual review needed before accepting the pilot

Keep this first scope small enough to review as one change. An identity-only
pilot can be useful before adding tasks, policy, models, or integrations.

## 2. Prepare A Reproducible Tool Checkout

Use Git and Node.js 20 or newer. The commands below obtain the current `main`
development snapshot in a new tooling checkout and retain it at one commit:

```sh
git clone --branch main https://github.com/iwizy/NexFlow.git
cd NexFlow
git checkout --detach
git rev-parse HEAD
npm ci --ignore-scripts
npm run validate
```

Record the full commit reported by `git rev-parse HEAD`. The schemas and
prototype scripts come from that same checkout; the lock file pins their
maintenance dependencies. Dependency installation may need network access.
The subsequent prototype commands operate on local input.

The published foundation release is `v0.1.0`; current `main` also contains
unreleased development. A development commit must be identified as such. If
your pilot requires a reviewed release, select that tag and confirm which
commands it contains before following this guide. Manifest
`specVersion: "0.1"` does not identify a schema or tool snapshot by itself.

There is no distributed `nexflow` executable or independent schema bundle to
install today. Keep using the scripts and schemas from your pinned checkout.

## 3. Learn The Three-Manifest Baseline

Run from the tooling checkout root:

```sh
node scripts/cli-prototype.mjs validate --root examples/minimal-team
node scripts/cli-prototype.mjs inspect --root examples/minimal-team
node scripts/cli-prototype.mjs graph --root examples/minimal-team
```

The validator should report three selected manifests. Read them in this order:

1. `project.yaml` names the Project, human maintainer, and manifest source hints.
2. `actors.yaml` defines the authoritative participant inventory.
3. `agents.yaml` defines stable AI identity; the actor's explicit `agentRef`
   connects to that identity.

Inspection reports declarations and selected references. The static graph
reports selected relationships and their resolution labels. Neither computes
a complete effective configuration. The
[Examples Validation Walkthrough](examples-validation-walkthrough.md) explains
their output and an intentional validation failure in more detail.

## 4. Create Your Own Starter

Keep your project separate from the tooling checkout. The example below uses a
new sibling directory named `my-team`; choose another destination if it already
exists. Continue running commands from the tooling checkout root:

```sh
mkdir ../my-team
node scripts/cli-prototype.mjs init --root ../my-team --id my-team --name "My Team"
node scripts/cli-prototype.mjs validate --root ../my-team
node scripts/cli-prototype.mjs inspect --root ../my-team
node scripts/cli-prototype.mjs graph --root ../my-team
```

The [initializer](cli-init.md) writes exactly `project.yaml`, `actors.yaml`,
and `agents.yaml`. Its `minimal-team@0.1-draft` template uses manifest
`specVersion: "0.1"`, `suggest_only` default autonomy, and mandatory review.
Initialization reports file creation; run validation separately afterwards.

If a target file already differs from the template, `init` refuses every
preflight-conflicting write. It has no overwrite or merge mode. Once you edit
the starter, validate that project directly instead of rerunning `init` as an
updater.

Review and edit the generated files:

- set the project description and participant responsibilities to your actual
  pilot
- preserve one consistent `project.id` and `metadata.project` across all files
- choose stable participant IDs and update every reference when an ID changes
- keep the actor-to-agent `agentRef` explicit, even when both IDs match
- keep human review and autonomy choices visible
- use project-local role labels where personal information is unnecessary

The starter leaves model, provider, permission, context, memory, task, event,
and extension declarations absent. Add each deliberately when the pilot needs
it; omission contributes no authority.

## 5. Add One Module At A Time

Use the [Manifest Reference](manifest-reference.md) for field meaning and the
matching schema for structural shape. Review dependency closure before adding
each module.

| Need | Add and review | Key relationship |
| --- | --- | --- |
| Describe possible actions and their policy | CapabilitySet, PermissionSet, and relevant approval gates | Capability identity, permission effect, and human approval are separate decisions. |
| Describe planned work | TaskSet, then Workflow or HandoffSet as needed | Owners, tasks, dependencies, artifacts, gates, and workflow scope must refer to the intended declarations. |
| Describe information and retention | ContextSet and MemorySet as needed | Access, classification, retention, visibility, and reuse remain explicit. |
| Describe versioned AI behavior | AgentDefinitionSet and every referenced component | Identity stays in AgentSet; requested behavior belongs to the selected definition and its resources. |
| Describe providers or integrations | ProviderSet or ExtensionSet with the owning profile | Provider support signals and extension declarations do not grant permission or prove live availability. |
| Describe review evidence | EventSet and audit expectations | Event declarations describe evidence requirements; the repository emits no runtime events. |

Update `Project.manifests` to list each adopted document so the prototype can
discover it. The current directory mode selects exactly one root
`project.yaml` or `project.yml` and follows supported source hints; it does not
scan all YAML files. Every selected source must remain within the explicit
root and belong to the same project and supported specification version. See
[Manifest Discovery](manifest-discovery.md) for the complete boundary.

Optionality ends when a resource is referenced. For example, a task's capability
reference needs the matching CapabilitySet declaration. Dependencies are
transitive: a definition that references a model profile may also require the
ProviderSet referenced by that profile. Empty placeholder files do not close
missing references.

When adding agent behavior, begin with a reviewed draft definition. Complete
the active-definition requirements before selecting exactly one unscoped
active definition for an agent. Do not choose by file order or version number.
See [Effective Agent Configuration](effective-agent-configuration.md) and the
[Agent Identity Migration](agent-identity-migration.md).

## 6. Validate The Project You Actually Changed

After every change, run from the tooling checkout root:

```sh
node scripts/cli-prototype.mjs validate --root ../my-team
node scripts/cli-prototype.mjs inspect --root ../my-team
node scripts/cli-prototype.mjs graph --root ../my-team
```

Stop and review any nonzero exit status. A successful `validate` checks bounded
discovery and JSON Schema structure for selected input. Core Profile checks,
complete semantic validation, authorization, and runtime readiness are not
performed by that command.

`npm run validate` checks the schemas and maintained examples in the tooling
repository. `npm run semantic-smoke` checks selected invariants in maintained
examples. Neither command discovers or evaluates your sibling project. Use the
prototype's explicit `--root` for its supported checks on your project, then
review dependency closure, policy, and uncovered references manually against
the [Semantic Reference Inventory](semantic-reference-inventory.md).

For machine consumers, JSON output is available:

```sh
node scripts/cli-prototype.mjs validate --root ../my-team --format json
```

Pin the checkout and experimental `formatVersion` together. Check `success`,
`exitCode`, `checks`, and `diagnostics`; `executionAuthorized` remains `false`.
See [CLI Machine-Readable Diagnostics](cli-diagnostics.md) for the current
contract, stream rules, truncation, and redaction boundaries.

## Common Stops

| Symptom | Next action |
| --- | --- |
| No Project entry or both `project.yaml` and `project.yml` exist | Select one intended entry or use the documented explicit Project mode; do not rely on filename preference. |
| A newly added YAML file is absent from inspection | Check its Project source hint. The prototype does not scan for unlisted documents. |
| A source escapes the root, is symlinked, or has another project ID | Correct the local source boundary and project association before continuing. |
| `NF-SCHEMA` reports a required field or invalid value | Use the diagnostic's kind and pointer to review the matching schema and manifest reference. |
| An ID resolves to zero or multiple possible targets | Review the intended kind and scope; never pick the first matching name. |
| `init` reports a conflict after starter customization | Keep your edited project and validate it; the initializer is not a migration tool. |
| The version or module is unsupported | Consult the compatibility matrix and migration guide; changing a version string alone is not migration. |

## Accept And Maintain The Pilot

Before adopting the manifest set as a team reference, have its human owner
review identity, responsibilities, dependencies, policy, and evidence gaps.
Keep a short adoption record alongside your project documentation:

- project revision and owner
- adoption goal and included modules
- NexFlow tool/schema commit and manifest `specVersion`
- commands run, results, and manual reviews completed
- known unsupported or unvalidated behavior
- next review date or change that triggers review

Preserve the prior project revision for authoring rollback. On future changes,
use the [Migration Guide](migration-guide.md) and
[Versioning](versioning.md) to assess affected domains and compatibility.

An evidence-backed statement can say that the selected manifests passed the
prototype's structural checks at a named commit. Broader claims require their
own scoped evidence. Use [Conformance Claims](conformance-claims.md) only when
you can substantiate the stated levels, profiles, and limitations; NexFlow does
not provide certification or endorse an external implementation.

For a documentation inconsistency, reproducible tooling problem, or proposed
specification change, follow [Contributing](../CONTRIBUTING.md). Send
vulnerabilities through the private reporting path in
[Security Policy](../SECURITY.md).
