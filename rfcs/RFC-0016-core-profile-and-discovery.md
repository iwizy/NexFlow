# RFC-0016: Core Profile And Logical Discovery

## Status

Draft

## Cross-RFC Review

The [Foundational Model Cross-RFC Review](reviews/2026-07-foundational-model-review.md)
accepts the core-profile and logical-assembly direction for implementation
planning and defers profile schema migration until participant identity and
reference contracts are stable. This RFC remains Draft.

## Summary

This RFC proposes a minimum useful NexFlow core profile, optional manifest
modules, incremental adoption rules, support for multiple workflows, and a
logical discovery model independent of file names and directory layout.

The proposal defines:

- a minimum core profile containing project identity and participant inventory
- optional modules for policy, work planning, workflows, handoffs, context,
  memory, agent behavior, providers, events, and extensions
- dependency closure rules that make referenced modules required
- fail-closed meaning for omitted modules
- a logical manifest assembly as the input to validation and future runtimes
- deterministic discovery from explicit files, bounded directories, indexes, or
  bundles
- multiple workflow documents identified by workflow ID
- diagnostics for incomplete profiles, missing dependencies, duplicate logical
  resources, and unsafe discovery
- staged migration from the current all-manifests-required `0.1` project shape

The central rule is:

> File layout helps locate manifests. Declared identity, kind, scope, and
> references determine their meaning.

This RFC does not change current schemas or examples by itself. The current
`0.1` repository continues to validate the complete 16-manifest base example
sets; the Minimal Team additionally carries the optional ActorSet migration
manifest. Reduced profiles remain unimplemented.

## Motivation

RFC-0002 accepted an initial set of separate manifests because separate files
make review, ownership, and validation clearer. The repository has since grown
from the original set to include agent definitions, model profiles, prompt sets,
and retrieval profiles.

Current reference examples contain the 16-kind base set, and the Minimal Team
also covers `ActorSet`. The current `Project` schema requires a `manifests` map with paths for agents,
workflow, tasks, handoffs, permissions, capabilities, context, memory, providers,
events, and extensions.

That complete shape is useful as a specification fixture. It is not a good
minimum adoption boundary.

A project may initially want only to describe:

- project identity and policies
- who participates
- which responsibilities exist

It should not need empty workflow, handoff, provider, event, and extension files
before NexFlow provides value.

The current path map also implies one workflow through a single `workflow`
entry. Real projects may have independent workflows for documentation, feature
delivery, release, incident response, research, or compliance. These workflows
should not be forced into one large document merely because discovery expects one
file name.

Finally, current examples and repository scripts commonly use conventional file
names such as `agents.yaml` and `workflow.yaml`. These conventions are readable,
but they must not become semantic requirements. A manifest stored as
`governance/permissions.yml`, embedded in an accepted bundle, or passed directly
to a validator should mean the same thing.

Without a common profile and discovery model, implementations may diverge:

- one tool may require every known manifest kind
- another may treat every manifest as optional
- one runtime may scan a directory recursively
- another may trust only `project.yaml` paths
- one validator may accept multiple workflows
- another may overwrite the first workflow with the second
- an absent permission file may be interpreted as unrestricted access
- bundle expansion may produce different semantics from directory discovery

NexFlow needs a deterministic minimum and a deterministic path from minimum to
complete adoption before a reference CLI or runtime is implemented.

## Goals

This RFC aims to:

- define the smallest manifest set that still provides reviewable project value
- allow optional modules without weakening safety
- make manifest requirements depend on adopted profiles and actual references
- support incremental adoption without empty placeholder files
- support more than one independent workflow in one project
- separate logical identity from physical file layout
- normalize files, directories, indexes, and bundles into one assembly model
- define deterministic discovery and duplicate handling
- make missing optional modules fail closed
- preserve current examples during migration
- align discovery with typed references, validation, bundling, and future CLI
  behavior

## Non-Goals

This RFC does not:

- change current JSON Schemas immediately
- make current reduced manifest sets schema-valid immediately
- accept the Actor Model or `ActorSet` schema
- define a runtime or orchestration engine
- define workflow scheduling or cross-workflow execution
- permit remote manifest fetching by default
- define a package manager or registry
- make directory names or file names part of resource identity
- require all collection manifests to support multi-document aggregation
- define YAML include or template behavior
- allow missing policy modules to imply permission
- replace manifest bundling rules
- define cross-project references
- add a new conformance level merely for parsing a core profile

## Current State

### Accepted Initial Model

RFC-0002 accepted separate manifests for:

- project
- agents
- workflow
- tasks
- handoffs
- permissions
- capabilities
- context
- memory
- providers
- events
- extensions

The repository later added draft schemas and examples for:

- agent definitions
- model profiles
- prompt sets
- retrieval profiles

### Current Project Schema

The current `Project` schema requires a `manifests` object and requires path
entries for 11 module names.

This has three effects:

1. A reduced project cannot pass the current schema.
2. Discovery is strongly associated with a project path map.
3. The singular `workflow` entry does not represent multiple workflow documents.

### Current Examples

Each maintained example currently includes the 16-kind base set. The Minimal
Team additionally includes `ActorSet` as the first staged migration path.

They remain useful complete examples and should not be rewritten as reduced
profiles merely to demonstrate this proposal.

### Current Repository Tooling

The repository scripts discover YAML under `examples/`, identify manifests by
their declared `kind`, and currently expect one manifest per kind in each example
directory.

This is repository maintenance behavior, not yet a general discovery contract.

## Terminology

### Manifest Document

A manifest document is one parsed YAML or JSON-compatible document with a
declared `specVersion` and `kind`.

Its physical source may be a file, bundle entry, multi-document stream entry, or
another accepted transport.

### Logical Manifest Assembly

A logical manifest assembly is the complete normalized set of manifest documents
and declared resources belonging to one NexFlow project for one validation or
inspection operation.

The assembly records source locations for diagnostics, but source paths do not
define resource identity.

### Module

A module is a coherent optional area of the NexFlow manifest model.

Examples include work planning, context, memory, or agent behavior. A module may
contain one or more manifest kinds.

### Profile

A profile is a named set of minimum manifest and validation expectations for an
authoring purpose.

Profiles describe declaration completeness. They do not grant runtime behavior.

### Core Profile

The core profile is the minimum useful NexFlow project description.

It identifies the project and its participants without implying workflow
execution, provider access, memory, or integrations.

### Participant Inventory

Participant inventory is the profile slot that declares who may participate.

During the current `0.1` draft, `AgentSet` supplies this slot even though it mixes
AI agents and legacy human entries. If RFC-0013 is accepted, `ActorSet` should
become the participant inventory and `AgentSet` should become AI-agent-specific.

### Dependency Closure

Dependency closure is the set of additional manifests and declarations required
by the references and semantics of the manifests already present.

### Discovery Root

A discovery root is the explicit bounded input from which a tool is allowed to
read candidate manifests.

It may be an explicit file list, one directory, one project index, or one accepted
bundle.

### Source Locator

A source locator records where a manifest document came from for loading and
diagnostics.

It is not part of the logical identity of the resources declared inside that
document.

## Design Principles

### Start Small, Add Deliberately

NexFlow should provide value before a project models every possible surface.

Projects may adopt optional modules when they need the corresponding review and
validation behavior.

### Omission Never Grants

An absent module cannot be interpreted as unrestricted behavior.

In particular:

- no permissions module means no declared allow effect
- no provider module means no declared provider availability
- no context module means no declared context source access
- no memory module means no declared memory scope access
- no workflow module means no declared orchestration flow
- no extension module means no declared extension behavior
- no event module means no declared event contract

### References Close Dependencies

If a present manifest references a resource owned by another module, that target
module becomes required.

Optionality applies before use. It does not make dangling references optional.

### Profiles Do Not Execute

Declaring that a project satisfies the core, workflow, or agent behavior profile
does not execute agents or workflows and does not establish runtime conformance.

### Documents Self-Describe

Tools should determine manifest semantics from parsed declarations such as:

- `specVersion`
- `kind`
- `metadata.project`
- resource IDs

Tools should not determine semantics from a base file name.

### Transport Does Not Change Meaning

Separate files, an accepted bundle, and an explicit list of documents must
normalize to the same logical assembly when they contain the same manifests.

### Discovery Is Bounded And Visible

Tools must not scan arbitrary parents, home directories, sibling repositories,
or remote sources to complete an assembly silently.

### No Last Writer Wins

Duplicate singleton documents, workflow IDs, or resource IDs are errors under
their applicable namespace rules. Discovery order cannot select a winner.

## Minimum Core Profile

The proposed minimum core profile has two required slots.

| Slot | Current `0.1` manifest | Future direction | Purpose |
| --- | --- | --- | --- |
| Project identity and policy | `Project` | Remains `Project` | Declares project identity, maintainers, broad policy, and spec version. |
| Participant inventory | `AgentSet` | `ActorSet` if RFC-0013 is accepted | Declares at least one participant and stable responsibility metadata. |

A core profile is useful for:

- documenting team identity
- documenting responsibilities
- reviewing project-level safety policy
- bootstrapping additional modules
- sharing a provider-neutral project description

A core profile alone does not describe executable work.

### Current Core Profile Constraints

While `AgentSet` supplies participant inventory:

- at least one participant is required by the current schema
- permission, capability, context, memory, provider, and extension references
  should be empty unless their target modules are present
- autonomy remains a declared posture, not permission
- an elevated autonomy value without corresponding policy modules does not grant
  actions and should produce a review warning

### Core Profile Safety Posture

The effective behavior of a core-only project is fail-closed:

- participants may be described
- responsibilities and skills may be documented
- no task is declared
- no workflow is declared
- no action is authorized
- no external context is declared
- no durable memory is declared
- no provider is selected
- no extension is active

## Optional Module Profiles

Projects may add modules independently when their dependencies are satisfied.

| Module profile | Manifest kinds | Adds |
| --- | --- | --- |
| Policy | `CapabilitySet`, `PermissionSet`, project approval gates | Action vocabulary, risk, allow/deny/approval effects, and review gates. |
| Work planning | `TaskSet` | Work items, owners, participants, dependencies, artifacts, and acceptance criteria. |
| Workflow | One or more `Workflow` documents | Ordered stages, steps, task bindings, dependencies, gates, and emitted event types. |
| Handoff | `HandoffSet` | Explicit transfer of work, artifacts, blockers, criteria, and next actions. |
| Context | `ContextSet` | Declared sources, classification, access, freshness, and approval expectations. |
| Memory | `MemorySet` | Declared scopes, ownership, retention, writers, consumers, and sensitivity. |
| Agent behavior | `AgentDefinitionSet`, and referenced `ModelProfileSet`, `PromptSet`, `RetrievalProfileSet` | Versioned behavioral releases and reviewed model, prompt, and retrieval components. |
| Provider inventory | `ProviderSet` | Provider-neutral availability and provider-level constraints. |
| Events and audit | `EventSet` | Declared event types, payload expectations, retention, and audit guidance. |
| Extensions | `ExtensionSet` | Namespaced integration metadata, lifecycle, and declared requirements. |

These profiles are composable. The table does not require adoption in this exact
order.

## Requiredness Model

A manifest or declaration may become required for four different reasons.

### Profile Requiredness

The selected authoring profile names a minimum set.

Example: the core profile requires project identity and participant inventory.

### Reference Requiredness

A present reference requires its target declaration and owning module.

Example: a task with `capabilitiesRequired` requires the capability declarations
to exist.

### Semantic Requiredness

A declared feature may require another module even without a direct scalar
reference.

Example: a future executable action profile may require permission evaluation
for every requested capability.

### Conformance Requiredness

A tool's claimed conformance may require support for a module.

Example: a tool claiming workflow inspection must understand every accepted
workflow document in the assembly.

These reasons should be reported separately in diagnostics.

## Absent, Empty, And Incomplete Modules

The states have different meanings.

| State | Meaning |
| --- | --- |
| Absent | Module is not adopted and contributes no behavior or authority. |
| Present and empty | Module is explicitly included but declares no resources. It still contributes no authority. |
| Present with declarations | Module participates in validation and reference resolution. |
| Referenced but absent | Invalid incomplete assembly. |
| Present with dangling references | Invalid incomplete assembly. |
| Present but unsupported by tool | Tool must report unsupported behavior and must not execute dependent features. |

Tools must not create implicit empty manifests to hide missing dependencies.

## Dependency Closure

The following table describes major dependency edges. Exact field contracts
remain governed by the manifest reference and typed reference work.

| Source feature | Required target module or declaration |
| --- | --- |
| Agent permission references | `PermissionSet` entries |
| Agent capability references | `CapabilitySet` entries |
| Agent context references | `ContextSet` entries |
| Agent memory references | `MemorySet` entries |
| Agent provider preferences | `ProviderSet` entries |
| Agent extension references or attachments | Declared `ExtensionSet` support under the applicable field contract |
| Task owner or participants | Participant inventory |
| Task capability requirements | `CapabilitySet` entries |
| Task approval gates | Project approval gate declarations |
| Task dependencies | `TaskSet` entries |
| Workflow step task bindings | `TaskSet` entries |
| Workflow gates | Project approval gate declarations |
| Workflow emitted event types | `EventSet` entries |
| Handoff endpoints | Participant inventory |
| Handoff artifacts | Producing task artifact declarations |
| Permission subjects | Participant inventory |
| Permission capabilities | `CapabilitySet` entries |
| Permission approval gate | Project approval gate declaration |
| Context allowed or denied actors | Participant inventory |
| Context approval gates | Project approval gate declarations |
| Memory consumers or writers | Participant inventory |
| Memory approval gate | Project approval gate declaration |
| Agent definition identity | `AgentSet` agent entry under the current draft |
| Agent definition components | Referenced model, prompt, retrieval, permission, capability, context, memory, and extension declarations |
| Model profile provider references | `ProviderSet` entries |
| Retrieval profile source references | `ContextSet` entries |
| Extension required capabilities | `CapabilitySet` entries |

Dependency closure is transitive.

For example:

```text
Workflow
  -> TaskSet
    -> Participant inventory
    -> CapabilitySet
      -> PermissionSet when executable authorization is claimed
```

Presence does not imply authorization. A complete reference graph may still fail
policy, approval, lifecycle, or safety validation.

## Incremental Adoption

Projects should be able to grow through reviewable stages.

### Stage 1: Project And Participants

Add:

- `Project`
- current `AgentSet` participant inventory

Result:

- project and team responsibilities are inspectable
- no executable work or access is implied

### Stage 2: Capabilities And Permissions

Add:

- `CapabilitySet`
- `PermissionSet`
- approval gates where required

Result:

- requested actions and authorization policy become reviewable
- declarations still do not enforce themselves

### Stage 3: Tasks

Add:

- `TaskSet`

Result:

- owners, participants, dependencies, artifacts, and acceptance criteria become
  explicit

### Stage 4: Workflows And Handoffs

Add as needed:

- one or more `Workflow` documents
- `HandoffSet`

Result:

- ordering and transfers become inspectable
- no scheduler or runtime is implied

### Stage 5: Context And Memory

Add independently as needed:

- `ContextSet`
- `MemorySet`

Result:

- information access and retention boundaries become explicit
- omitted context or memory remains unavailable by declaration

### Stage 6: Versioned Agent Behavior

Add as needed:

- `AgentDefinitionSet`
- `ModelProfileSet`
- `PromptSet`
- `RetrievalProfileSet`
- `ProviderSet` when provider references are used

Result:

- agent behavioral releases become reviewable
- draft or unresolved definitions remain non-executable

### Stage 7: Events And Extensions

Add as needed:

- `EventSet`
- `ExtensionSet`

Result:

- event contracts and integration metadata become explicit
- no live integration or event transport is implied

This sequence is guidance, not a required lifecycle. A research project may add
context before tasks. A policy project may add permissions without workflows.
Dependency closure remains mandatory regardless of order.

## Multiple Workflow Model

A logical assembly should support zero or more `Workflow` documents.

### Workflow Identity

Each workflow is identified by:

```text
(project assembly, Workflow, workflow.id)
```

Workflow IDs must be unique within the project assembly.

### Workflow Local Scope

Stage and step IDs remain scoped to their owning workflow under accepted typed
reference and workflow rules.

Two workflows may use the same step ID without collision when the workflow scope
is explicit and the specification version permits that arrangement.

### Shared Tasks

Multiple workflows may reference the same task when that is intentional.

Sharing a task does not:

- merge workflow execution state
- imply that completing it in one workflow completes it in another runtime
- grant either workflow additional permissions
- create ordering between workflows

Runtime state semantics require a separate runtime proposal.

### Cross-Workflow Dependencies

The initial multiple workflow model should not infer cross-workflow ordering.

A cross-workflow dependency requires:

- explicit accepted syntax
- typed workflow and step scope
- cycle validation across workflows
- runtime scheduling semantics
- audit and failure behavior

Until those rules are accepted, dependencies remain within the containing
workflow.

### Workflow Discovery

All discovered workflow documents are retained and keyed by `workflow.id`.

A tool must not:

- keep only the first workflow
- overwrite by file name
- merge workflow bodies implicitly
- select a default workflow by lexical order

If a command needs one workflow, the user or project policy must select it
explicitly.

## Logical Manifest Assembly

The assembly is the common input to schema and semantic validation.

Candidate assembly inventory:

```yaml
assembly:
  projectId: example-project
  specVersion: "0.1"
  documents:
    - kind: Project
      source: project.yaml
    - kind: AgentSet
      source: team/participants.yaml
    - kind: Workflow
      resourceId: docs-delivery
      source: workflows/docs.yml
    - kind: Workflow
      resourceId: release
      source: workflows/release.yml
  profiles:
    - core
    - workflow
```

This is candidate inspection output, not a new authored manifest.

The assembly should retain:

- project identity
- selected spec version
- every source document
- physical and logical source locations
- document kind
- declared resource identities
- profile and module inventory
- duplicate candidates
- unsupported documents
- diagnostics

It must not contain inferred permissions or hidden runtime defaults.

## Document Cardinality

The initial logical assembly proposal uses conservative cardinality.

| Manifest kind | Assembly cardinality | Identity behavior |
| --- | --- | --- |
| `Project` | Exactly one | Singleton project identity. |
| `Workflow` | Zero or more | Each document keyed by unique `workflow.id`. |
| Other current set kinds | Zero or one document initially | Resources inside the set use their documented ID namespace. |

Future work may allow multiple `TaskSet`, `AgentSet`, or other collection
documents. That requires explicit aggregation rules for:

- set-level metadata
- duplicate resource IDs
- set-level policy fields
- ordering where meaningful
- diagnostics and source maps

Until those rules are accepted, discovering two documents for a non-workflow
singleton set kind is an error. Tools must not concatenate them silently.

## Discovery Inputs

A conforming discovery implementation may support one or more explicit input
modes.

### Explicit File List

The caller provides every source document.

This is the most deterministic initial mode.

### Explicit Project Document

The caller provides a `Project` document whose current path map or future index
identifies additional sources.

Paths are loading hints, not logical identity.

### Bounded Directory

The caller provides one directory root.

The tool may inspect supported YAML files under documented depth, count, size,
ignore, and symlink policies.

The tool must report which files it selected.

### Accepted Manifest Bundle

The caller provides a bundle accepted under RFC-0012 or a later bundling
specification.

Bundle expansion produces logical manifest documents before assembly.

### Standard Input Or API Documents

A future CLI or library may accept already parsed or streamed documents.

The same assembly and validation rules apply.

## Discovery Algorithm

A conforming discovery tool should use deterministic phases.

### Phase 1: Establish Input Boundary

- record the explicit input mode
- establish the allowed root or source set
- establish local-only or explicitly approved external access policy
- set size, depth, document count, and parser limits

### Phase 2: Enumerate Candidate Sources

- enumerate only allowed sources
- normalize paths for containment checks
- sort for deterministic diagnostics, not semantic precedence
- reject unsupported source types
- report skipped sources when relevant

### Phase 3: Parse Safely

- parse YAML or JSON-compatible data without executing tags or templates
- reject duplicate mapping keys
- enforce alias and resource limits
- preserve source locations
- do not resolve prompt or evidence locators during manifest discovery

### Phase 4: Classify Documents

- read `specVersion`
- read `kind`
- read `metadata.project` when applicable
- identify root resource IDs such as `project.id` and `workflow.id`
- retain unsupported documents for diagnostics without applying semantics

### Phase 5: Select Project Identity

- require exactly one `Project` document for a core profile
- use `project.id` as the assembly project identity
- verify the Project metadata is internally consistent
- reject ambiguous multiple Project documents

### Phase 6: Associate Project Documents

- include documents whose project identity matches the selected project
- report missing project metadata when required
- report foreign-project documents rather than absorbing them
- do not use directory proximity as a project identity fallback

### Phase 7: Enforce Cardinality

- require one Project
- allow multiple unique workflows
- enforce current singleton set-kind limits
- retain all collisions for diagnostics
- never select a winner by load order

### Phase 8: Build Logical Inventory

- inventory manifest kinds
- inventory resources and IDs
- build workflow identities
- record selected optional modules
- prepare symbol tables for typed reference resolution

### Phase 9: Compute Profile And Dependency Closure

- verify core profile slots
- identify adopted optional modules
- traverse references
- identify required missing modules or declarations
- report unsupported modules required by present features

### Phase 10: Validate

- validate every supported document against the matching schema
- run semantic checks claimed by the tool
- report profile, discovery, reference, policy, and graph diagnostics separately
- do not execute workflows or external integrations

## Project Manifest And Discovery Hints

The current `project.manifests` map is a useful explicit loading mechanism, but it
should not remain the only semantic model.

Future schema work should separate:

- project identity and policy
- profile or module declarations
- source discovery hints
- logical resource identity

Possible migration-compatible source representations include:

- current named path map for one-document module kinds
- a list of source entries with expected kind
- multiple workflow source entries
- a bundle index
- explicit CLI input without a stored index

The exact future schema is deferred. Any accepted shape must preserve these
rules:

- source path does not become resource ID
- expected kind is verified against document `kind`
- duplicate sources do not override
- omitted optional modules do not require empty paths
- multiple workflows are not collapsed into one map value
- source discovery cannot grant permissions or capabilities

## Conventional File Names

Conventional names remain recommended for readability:

```text
project.yaml
agents.yaml
tasks.yaml
workflow.yaml
```

They are conventions, not requirements.

A conforming tool must accept an explicitly provided supported manifest whose
name is different, such as:

```text
team/participants.yml
workflows/documentation.yml
governance/access-policy.yaml
```

assuming the selected discovery mode permits those sources.

Renaming a file without changing its content or source index should not change
manifest meaning.

## Discovery Diagnostics

Candidate diagnostic codes:

| Code | Default severity | Meaning |
| --- | --- | --- |
| `NF-DISCOVERY-NO-PROJECT` | Error | No Project document exists for a requested core assembly. |
| `NF-DISCOVERY-MULTIPLE-PROJECTS` | Error | More than one Project document is eligible. |
| `NF-DISCOVERY-PROJECT-MISMATCH` | Error | A document belongs to a different project. |
| `NF-DISCOVERY-UNSUPPORTED-VERSION` | Error | A document uses an unsupported spec version. |
| `NF-DISCOVERY-UNSUPPORTED-KIND` | Error or warning by explicit preservation policy | A document kind is unsupported. |
| `NF-DISCOVERY-DUPLICATE-SINGLETON` | Error | More than one document exists for a singleton set kind. |
| `NF-DISCOVERY-DUPLICATE-WORKFLOW` | Error | Multiple workflows declare the same workflow ID. |
| `NF-DISCOVERY-OUTSIDE-ROOT` | Error | A source escapes the allowed discovery root. |
| `NF-DISCOVERY-UNSAFE-SOURCE` | Error | A symlink, remote locator, tag, archive entry, or source violates discovery policy. |
| `NF-DISCOVERY-LIMIT-EXCEEDED` | Error | Source count, size, depth, alias, or parser limits were exceeded. |
| `NF-PROFILE-INCOMPLETE` | Error | Required core profile slot is absent. |
| `NF-PROFILE-MISSING-DEPENDENCY` | Error | A present module references an absent required module or declaration. |
| `NF-PROFILE-UNSUPPORTED-MODULE` | Error | A required module is not supported by the tool's claim. |
| `NF-PROFILE-ELEVATED-AUTONOMY-WITHOUT-POLICY` | Warning | Declared autonomy lacks sufficient policy modules for meaningful safe evaluation. |

Exact code stability should align with RFC-0005 and RFC-0011 before a reference
CLI release.

Diagnostics should include:

- source path or bundle entry
- logical document kind
- project identity when known
- resource ID when known
- expected profile or dependency
- related colliding or referencing locations
- suggested fix when deterministic

## Validation Expectations

### Structural Validation

Future schemas may validate:

- a reduced core Project shape
- optional module or profile declarations
- future discovery index shape
- arrays or records for multiple workflow sources
- per-document `specVersion`, `kind`, and metadata

JSON Schema cannot fully validate:

- directory discovery
- project association across arbitrary files
- duplicate documents across sources
- workflow ID uniqueness across files
- dependency closure across modules
- safe path containment
- bundle and directory equivalence

### Semantic Validation

Semantic validation should:

- consume a normalized logical assembly
- check profile completeness
- check reference-driven module dependencies
- reject omitted-module authority assumptions
- check workflow identity uniqueness
- resolve references after discovery
- distinguish missing module from missing resource
- report unsupported required modules
- preserve source maps for diagnostics

### Inspection

A future `inspect` command should show:

- project identity
- discovery mode and root
- source documents
- manifest kinds
- selected profile slots
- adopted optional modules
- workflows by ID
- missing dependencies
- unsupported documents
- no implied runtime state

## Relationship To Core Manifest Model

RFC-0002 remains the accepted initial separate-manifest decision.

This RFC proposes to refine requiredness and discovery without returning to one
large runtime-specific configuration file.

If accepted, RFC-0002 should be updated to distinguish:

- the complete core vocabulary
- the minimum core profile
- optional modules
- logical discovery

## Relationship To Actor Model

RFC-0013 proposes replacing mixed participant declarations with first-class
actors. The repository implements the first additive `ActorSet` migration slice
for the Minimal Team while the broader RFC remains Draft.

This RFC defines a participant inventory slot rather than permanently declaring
`AgentSet` to be the correct identity model. The slot is satisfied by the current
`AgentSet` for legacy examples and by `ActorSet` where the staged Actor Model
migration has been applied.

## Relationship To Typed References

RFC-0015 defines reference identity as kind, ID, and scope.

Discovery builds the assembly and symbol inventory before typed reference
resolution. Typed references then determine dependency closure without using file
names as namespaces.

## Relationship To Manifest Bundling

RFC-0012 proposes optional bundling as transport and authoring convenience.

Bundle expansion and directory discovery must produce equivalent logical
assemblies. A bundle does not make an optional module required and does not
change workflow identity or profile semantics.

## Relationship To Reference CLI

RFC-0011 proposes validation, inspection, graph, and initialization commands.

If this RFC is accepted:

- `nexflow init` should default to a safe core profile or an explicitly selected
  larger template
- `nexflow validate` should report discovered profiles and missing dependencies
- `nexflow inspect` should show the logical assembly
- `nexflow graph` should support selecting one or more workflow IDs
- CLI discovery should follow the bounded deterministic algorithm in this RFC

## Relationship To Effective Agent Configuration

RFC-0014 requires deterministic agent definition and component resolution.

The agent behavior module may be omitted before versioned agent behavior is
adopted. Once an agent definition is referenced or activation is attempted, its
complete component dependency closure becomes required.

## Relationship To Compatibility Matrix

The current compatibility matrix documents complete `0.1` examples and current
repository tooling.

Until this RFC is accepted and implemented, reduced core profiles and multiple
workflow assemblies remain specified proposals, not supported current schema
combinations.

## Conformance Impact

If accepted, this RFC affects existing conformance surfaces.

| Claim | Expected impact |
| --- | --- |
| `NF-MANIFEST` | Must identify supported profiles, optional modules, and document cardinality for the claimed spec version. |
| `NF-SCHEMA` | Must validate reduced profiles and future discovery/index shapes it claims. |
| `NF-SEMANTIC` | Must validate dependency closure, project association, workflow uniqueness, and absent-module safety. |
| `NF-CLI` | Must disclose discovery inputs, selected documents, profiles, and unsupported modules. |
| `NF-RUNTIME` | Must refuse execution when required modules or enforcement semantics are absent. |
| `NF-EXTENSION` | Must not make extension modules required or authoritative merely through discovery. |

Profiles should be published as qualifiers on existing conformance claims, not
as evidence of runtime support.

Example future claim:

```text
Spec versions: 0.2
Conformance: NF-MANIFEST, NF-SCHEMA
Profiles: core, policy, work-planning
Does not support: workflow, runtime, extension execution
```

This is documentation guidance, not a new manifest format.

## Compatibility Impact

This RFC is planning-oriented and changes no current manifest requirements by
itself.

Potentially compatible changes:

- documenting conventional file names as non-semantic
- adding discovery diagnostics
- exposing a logical assembly in inspection output
- accepting multiple unique Workflow documents through a new explicit mode
- making previously required empty modules optional in a new schema version

Potentially breaking changes:

- changing required `Project.manifests` fields
- changing the shape of `Project.manifests`
- treating a previously ignored second Workflow document as part of the assembly
- changing singleton rules for collection manifests
- changing directory scan depth or ignore behavior
- changing missing-module behavior in validators
- requiring participant inventory through a future `ActorSet`
- stabilizing new diagnostic code meanings

Current complete examples should remain valid under the migration.

## Migration Strategy

Migration should be staged.

### Stage 0: Document The Proposal

- publish this RFC
- document current all-manifest requirements
- inventory current discovery assumptions
- keep current schemas and examples unchanged

### Stage 1: Introduce Logical Assembly Internally

- refactor future validation tooling to distinguish source discovery from logical
  inventory
- preserve current one-document-per-kind behavior
- expose discovered project, kinds, resources, and source paths
- add duplicate and project mismatch diagnostics

### Stage 2: Define Profile Contracts

- accept or revise the core profile
- publish module dependency tables
- define profile qualifiers for conformance claims
- add conformance fixtures for reduced profiles without adding unnecessary public
  team examples

### Stage 3: Update Project Schema

- make optional modules genuinely optional
- define a migration path from the required path map
- add a source/index representation capable of multiple workflows
- decide the required `specVersion` change
- keep current complete projects valid

### Stage 4: Add Multiple Workflow Support

- accept multiple unique Workflow documents
- update schema discovery and semantic fixtures
- add workflow selection to inspection and graph plans
- reject duplicate workflow IDs
- keep cross-workflow dependencies unsupported until separately specified

### Stage 5: Stabilize Discovery

- define bounded directory scan behavior
- define symlink, ignore, depth, size, and document count policy
- align bundle expansion and file discovery
- stabilize required diagnostics

### Stage 6: Runtime Preflight

- require complete dependency closure for requested runtime features
- refuse unsupported modules
- fail closed when enforcement declarations are absent
- publish runtime profile support explicitly

## Security And Safety Impact

Incremental adoption is safe only when omission is fail-closed.

Required safeguards:

- absent permissions never imply allow
- absent approval gates never imply approval is unnecessary
- absent context or memory never implies unrestricted access
- absent provider inventory never permits provider calls
- absent workflow never creates implicit task ordering
- unknown or unsupported modules never gain semantics
- discovery never executes templates, tags, or commands
- directory scanning stays inside an explicit root
- symlink and path traversal behavior is explicit and safe
- remote fetch is disabled by default
- duplicate documents never use last-writer-wins
- multiple workflows do not gain hidden cross-workflow ordering
- unsupported dependency closure blocks dependent execution

Reduced authoring profiles must not become reduced safety profiles for behavior
that is actually requested.

## Privacy Impact

Discovery and inspection should avoid exposing unrelated local files.

Tools should:

- scan only explicit roots
- honor documented ignore policy
- avoid unrelated parent traversal
- avoid printing raw manifest contents by default
- avoid including secrets, prompt bodies, memory contents, or retrieved context in
  diagnostics
- normalize machine-specific absolute paths in portable reports when practical
- avoid remote lookups for project association

## Alternatives Considered

### Require Every Known Manifest

This maximizes completeness but creates empty placeholder files, raises adoption
cost, and conflates full examples with the minimum standard.

### Require Only Project

A project-only profile is very small, but it does not describe a team. Project
plus participant inventory is the minimum that advances NexFlow's mission.

### Make Every Manifest Optional Without Dependency Rules

This is flexible but unsafe. References and requested behavior must close their
dependencies deterministically.

### Use File Names As Manifest Kinds

This is simple for one directory layout but breaks explicit paths, bundles,
multiple workflows, renames, and alternative project organization.

### Require One Large Manifest

This simplifies discovery but weakens focused review, ownership, change history,
and module adoption. It conflicts with RFC-0002's accepted separation principle.

### Recursively Scan Everything

Unbounded scanning is convenient until it absorbs unrelated projects, generated
files, private data, fixtures, or vendor directories. Discovery must be bounded.

### Allow Multiple Documents Of Every Kind Immediately

This would maximize layout freedom but requires aggregation semantics for set
metadata and conflicts. Multiple workflows solve an immediate concrete need;
other collection splitting can be specified when justified.

### Treat Project Path Map As Semantic Identity

This makes file moves behavior-changing and prevents equivalent bundle or API
inputs. Paths should remain loading hints and diagnostic locations.

### Infer Missing Modules At Runtime

A runtime could create default permissions, providers, memory, or events.

This would hide authority and weaken auditability. Missing modules must remain
absent unless explicitly authored or generated and reviewed.

## Open Questions

- Is Project plus participant inventory the correct minimum core profile?
- Should policy manifests be required in the core profile even when no action is
  modeled?
- Which future spec version first permits reduced profiles?
- Should projects declare adopted profiles explicitly or should tools derive
  them from present manifests?
- What exact schema should replace or supplement the current
  `Project.manifests` path map?
- Should multiple workflows be represented through a project index, a discovery
  list, bounded scan, or all accepted input modes?
- Should more than one `TaskSet` or `AgentSet` document be allowed later?
- How should set-level metadata merge if collection splitting is accepted?
- Which directory ignore rules belong in the specification versus a reference
  CLI?
- Should symlinks be forbidden initially or allowed only when their resolved path
  remains inside the discovery root?
- Should YAML multi-document streams be accepted before manifest bundles?
- Which profile and discovery diagnostic codes must stabilize before CLI work?
- How should profile qualifiers appear in machine-readable conformance records?
- Which migration step requires a manifest `specVersion` change?
