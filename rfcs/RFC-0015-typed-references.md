# RFC-0015: Typed References

## Status

Draft

## Summary

This RFC proposes a typed reference model for NexFlow resources.

The model defines:

- a logical reference identity composed of target kind, target ID, and scope
- a controlled vocabulary of core reference target kinds
- project and nested namespace boundaries
- field contracts that declare allowed target kinds and scope behavior
- deterministic resolution independent of file order and bundle representation
- distinct handling for missing, ambiguous, duplicate, and wrong-kind targets
- stable `NF-REF-*` diagnostic codes and structured diagnostic details
- migration from current unqualified ID strings without changing current `0.1`
  manifests immediately

The central rule is:

> A reference identifies one declared resource of an allowed kind in one
> deterministic scope. It does not infer aliases, search unrelated scopes, or
> grant authority.

This RFC is specification-first. It does not change current schemas, examples,
or runtime behavior by itself.

## Motivation

Current NexFlow manifests use exact, case-sensitive ID strings for declarations
and references. The containing field supplies most of the meaning:

```yaml
agentRef: docs-agent
modelProfileRef: docs_agent_balanced
capabilitiesRequired:
  - read_repository
```

This is practical while each field has one obvious target collection. It becomes
less reliable as the domain model grows.

Several current or proposed fields may identify more than one resource kind:

- task owners and participants
- permission subjects
- handoff senders and recipients
- approval gate targets and approvers
- context and memory consumers or writers
- event actors and subjects
- future actor, authority, team, service, and automation references

The same ID may also be valid in distinct resource namespaces. For example,
`release-review` could be an agent, task, workflow step, approval gate, or
permission. A field that permits more than one of those kinds cannot safely
resolve the string without additional type information.

Nested declarations add another dimension. A workflow stage ID is owned by a
workflow. A workflow step is resolved inside a workflow. A future artifact model
may scope artifacts to producing tasks. File names and directory layout must not
become accidental namespaces because manifest bundles and alternative authoring
layouts should preserve meaning.

Without common rules, tools may diverge:

- one validator may search agents before tasks
- another may accept the first declaration loaded
- a runtime may infer a target from a field name
- a migration tool may rewrite an ambiguous ID incorrectly
- a bundle-aware tool may resolve differently from a directory-aware tool
- an extension may shadow a core target kind
- diagnostics may report every reference failure as "not found"

Typed references make target identity explicit while preserving concise syntax
where the field contract is already unambiguous.

## Goals

This RFC aims to:

- define a language-independent logical model for resource references
- give each reference field an explicit allowed target-kind set
- define project-wide and nested resolution scopes
- make resolution deterministic across files, bundles, validators, and runtimes
- preserve exact, case-sensitive ID matching
- distinguish reference ambiguity from duplicate declarations
- provide diagnostics that editors and migration tools can act on
- allow safe, staged migration from current unqualified IDs
- align typed references with the Actor Model and effective configuration work
- keep references separate from permissions, capabilities, and approval

## Non-Goals

This RFC does not:

- accept a new schema shape immediately
- require current examples to migrate immediately
- define remote or cross-project references
- define a package registry or dependency manager
- make file paths part of resource identity
- turn event types, URIs, prompt source paths, or provider model IDs into resource
  references
- define runtime object handles or database keys
- add aliases, fuzzy matching, case folding, or separator normalization
- select a latest version of a versioned resource
- let extensions introduce target kinds into core fields automatically
- grant capabilities, permissions, context, memory, or autonomy through a
  reference

## Terminology

### Declaration

A declaration creates a NexFlow resource identity in a known target-kind and
scope namespace.

Examples include:

- an entry in `agents.yaml`
- an entry in `permissions.yaml`
- a task in `tasks.yaml`
- a step inside a workflow

### Resource ID

A resource ID is the exact `id` value declared for a resource.

Current core IDs are case-sensitive and use the lexical rules in
`common.schema.json`.

### Target Kind

A target kind is a stable semantic token identifying the class of resource a
reference expects.

Examples include `agent`, `task`, `permission`, and `model-profile`.

A target kind is not the same as a manifest `kind`. A `TaskSet` manifest contains
resources whose reference target kind is `task`.

### Scope

A scope is the namespace boundary in which a declaration ID must be unique and a
reference is resolved.

The initial model recognizes:

- manifest assembly scope for project-level resources
- containing workflow scope for workflow stages and steps
- containing task scope for resource kinds explicitly defined as task-local in a
  future accepted model

### Manifest Assembly

A manifest assembly is the complete logical set of NexFlow manifests being
validated or inspected for one project.

A directory, expanded bundle, YAML multi-document stream, or another accepted
transport may produce the same assembly. Transport does not change reference
meaning.

[RFC-0016](RFC-0016-core-profile-and-discovery.md) proposes how minimum profiles,
optional modules, multiple workflows, and bounded discovery produce this logical
assembly.

### Field Contract

A field contract defines:

- whether a value is a NexFlow resource reference
- which target kinds are allowed
- whether the field accepts one or many references
- which scope is implicit
- whether an explicit scope is allowed or required
- whether a legacy unqualified ID is accepted

Field contracts are specification metadata. They are not inferred only from a
field name ending in `Ref`.

### Unqualified Reference

An unqualified reference is the current plain ID form:

```yaml
owner: docs-agent
```

It contains no authored target kind or explicit scope.

### Typed Reference

A typed reference explicitly records the target kind and ID, plus scope when the
field contract cannot supply it.

### Canonical Reference Identity

The canonical identity used by resolvers is the tuple:

```text
(scope, target kind, resource ID)
```

Authoring syntax may evolve, but this logical identity must remain stable.

## Current Reference Categories

Not every string that points somewhere is a NexFlow resource reference.

Tools must distinguish the following categories.

| Category | Examples | Resolution behavior |
| --- | --- | --- |
| Resource ID | `tasks[].id` | Creates a declaration in a target-kind and scope namespace. |
| Resource reference | `agentRef`, `permissionRefs`, `approvalGates` | Resolves to a declared NexFlow resource. |
| Event type | `task.completed` | Resolves in the separate dotted event-type vocabulary. |
| Vocabulary token | role or skill labels without a declaration manifest | Compared under the field's vocabulary rules, not resource lookup. |
| Source locator | prompt `sourceRef`, evidence paths, document locators | Resolved by the owning subsystem under explicit path or URI policy. |
| Provider model ID | provider-specific model identifier | Opaque to core resource reference resolution. |
| Integration handle | MCP server ID, corpus name, reranker name | Opaque unless a future manifest declares a target kind for it. |
| Extension namespace | `io.nexflow.github` | Governed by extension namespace rules, not core ID lookup. |
| Audit flag | `recordModelProfileRef: true` | Boolean behavior; not a reference despite its field name. |

Fields should not be classified by suffix alone.

Future schema and documentation work should clarify legacy names where a field
ending in `Ref` is actually a source locator or opaque integration handle.

## Design Principles

### Exact Resolution

IDs are matched exactly.

Resolvers must not:

- lowercase values
- trim whitespace to make an invalid value valid
- convert hyphens to underscores
- infer singular or plural forms
- use display names as aliases
- follow replacement metadata automatically
- choose a similar spelling

### Kind Before Lookup

The expected target kind is established before candidate lookup.

A resolver must not search every declaration namespace and then choose whichever
resource happens to match first.

### Scope Before Lookup

The effective scope is established before candidate lookup.

A resolver must not search parent directories, sibling projects, unrelated
workflows, previous bundles, or runtime registries to make a reference resolve.

### No File-Order Semantics

File names, directory order, YAML document order, map insertion order, and parser
load order do not affect reference resolution.

### References Select; They Do Not Authorize

A resolved reference proves only that one declared resource was identified.

It does not:

- grant a capability
- create a permission effect
- satisfy an approval gate
- authorize context or memory access
- raise autonomy
- activate a draft definition
- permit network access
- select credentials

### Fail Closed On Ambiguity

If the allowed kind and scope rules produce more than one candidate, resolution
fails. Tools must not pick a preferred kind or first declaration.

### Preserve Source Intent

Validators and inspection tools should preserve the authored value and report a
normalized target separately. They should not rewrite manifests during ordinary
validation.

## Logical Typed Reference Model

The candidate logical shape is:

```yaml
kind: agent
id: docs-agent
```

For a nested target whose scope is not implicit:

```yaml
kind: workflow-step
id: publish-release
scope:
  kind: workflow
  id: release-workflow
```

The normalized data model is:

| Field | Required | Meaning |
| --- | --- | --- |
| `kind` | Yes | Exact target-kind token. |
| `id` | Yes | Exact resource ID in the selected namespace. |
| `scope` | When required by the field contract | Owning project-level resource for a nested namespace. |
| `scope.kind` | With `scope` | Allowed owner target kind. |
| `scope.id` | With `scope` | Exact owner resource ID. |

The initial typed reference object should not contain:

- fallback candidates
- version ranges
- aliases
- file paths
- URLs
- provider preferences
- credentials
- inline permission or policy overrides

Those features have different semantics and should not be hidden inside a
reference.

## Candidate Authored Forms

### Single-Kind Field

When a field contract permits exactly one target kind and one deterministic
scope, the current concise form remains sufficient:

```yaml
agentRef: docs-agent
```

The field contract normalizes it as if it were:

```yaml
agentRef:
  kind: agent
  id: docs-agent
```

This equivalence applies only when the field contract is closed to one target
kind. It is not a general heuristic.

### Multi-Kind Field

A field that may target several kinds should use the explicit object form:

```yaml
appliesTo:
  - kind: task
    id: release-application
  - kind: workflow
    id: product-delivery
```

### Actor-Like Field

After the Actor Model is accepted, participant fields should prefer the `actor`
target kind:

```yaml
owner:
  kind: actor
  id: release-manager
```

This avoids an open-ended union of human, agent, automation, service, and
authority kinds at every participant field.

During the current transition, a field contract may permit both `agent` and
`project-maintainer`. A resolver must keep those namespaces distinct even when
the same ID appears in both declarations. It must not recreate an implicit actor
union unless the selected specification version defines that compatibility rule.

### Nested Field With Implicit Scope

A workflow dependency is already located inside one workflow. Its field contract
may provide the containing workflow as scope:

```yaml
dependencies:
  - from: build
    to: review
```

Both values can normalize to `workflow-step` references in the containing
workflow without an explicit scope object.

### Nested Field With Explicit Scope

If a future field permits a cross-workflow step reference, it must identify the
owner scope explicitly:

```yaml
dependsOn:
  - kind: workflow-step
    id: security-review
    scope:
      kind: workflow
      id: governed-release
```

Cross-workflow references are not accepted merely because this shape can express
them. The field contract must explicitly allow that scope mode.

## Why Use An Object Form

An object form is preferred over making `agent:docs-agent` the first canonical
syntax because it:

- maps directly to YAML, JSON, and language-independent data structures
- keeps target kind and ID independently validateable
- avoids escaping rules for separators
- adds scope without inventing a path grammar
- gives editors structured completion
- leaves current ID lexical rules unchanged
- avoids confusing resource references with URI schemes
- can evolve through explicit fields rather than string parsing

A compact string form may be considered later as authoring sugar. If added, it
must normalize to the same logical tuple and must not have different semantics.

## Core Target Kind Registry

Core target-kind tokens are lowercase kebab-case and controlled by the NexFlow
specification.

### Project-Level Target Kinds

| Target kind | Current or proposed declaration source | Scope |
| --- | --- | --- |
| `project` | `Project.project` | Manifest assembly |
| `project-maintainer` | `Project.project.maintainers[]` | Manifest assembly, owned by the project |
| `agent` | `AgentSet.agents[]` | Manifest assembly |
| `agent-definition` | `AgentDefinitionSet.agentDefinitions[]` | Manifest assembly |
| `capability` | `CapabilitySet.capabilities[]` | Manifest assembly |
| `permission` | `PermissionSet.permissions[]` | Manifest assembly |
| `approval-gate` | `Project.project.approvalGates[]` | Manifest assembly |
| `context-source` | `ContextSet.contextSources[]` | Manifest assembly |
| `memory-scope` | `MemorySet.memoryScopes[]` | Manifest assembly |
| `provider` | `ProviderSet.providers[]` | Manifest assembly |
| `model-profile` | `ModelProfileSet.modelProfiles[]` | Manifest assembly |
| `prompt-set` | `PromptSet.promptSets[]` | Manifest assembly |
| `retrieval-profile` | `RetrievalProfileSet.retrievalProfiles[]` | Manifest assembly |
| `task` | `TaskSet.tasks[]` | Manifest assembly |
| `workflow` | `Workflow.workflow` | Manifest assembly |
| `handoff` | `HandoffSet.handoffs[]` | Manifest assembly |
| `artifact` | Task artifact declarations under current `TaskSet` rules | Manifest assembly in current `0.1` drafts |
| `extension` | `ExtensionSet.extensions[]` | Manifest assembly |

### Nested Target Kinds

| Target kind | Declaration source | Required owner scope |
| --- | --- | --- |
| `workflow-stage` | `Workflow.workflow.stages[]` | `workflow` |
| `workflow-step` | `Workflow.workflow.stages[].steps[]` | `workflow` |
| `prompt` | `PromptSet.promptSets[].prompts[]` when referenced as a resource | `prompt-set` |

The `prompt` kind is reserved for fields that semantically reference a declared
prompt entry. Existing prompt `sourceRef` fields are source locators, not prompt
resource references.

### Reserved Draft Target Kinds

| Target kind | Dependency | Status |
| --- | --- | --- |
| `actor` | RFC-0013 Actor Model | Reserved until the actor declaration model is accepted. |

Reserved kinds must not be treated as implemented merely because a validator
recognizes the token.

### Vocabulary That Is Not Yet A Target Kind

Current fields may contain role names, skill names, corpus names, reranker names,
MCP server IDs, and evidence locators without a corresponding core declaration
manifest.

They are not typed NexFlow resource references until the specification defines:

- a declaration source
- a uniqueness scope
- lifecycle rules when relevant
- allowed reference fields
- semantic validation behavior

## Target Kind Governance

Adding a core target kind requires an RFC or an accepted specification change
that defines:

- token spelling
- declaration source
- uniqueness scope
- allowed reference fields
- lifecycle behavior when applicable
- compatibility and migration impact
- semantic validation expectations

Core kind tokens must not be reused with a different meaning.

Renaming or removing an adopted target kind is reference-breaking.

Extensions may define references inside their own namespaced configuration, but
an extension-defined kind must not:

- shadow a core target kind
- become a candidate for a core field silently
- satisfy a core reference contract without explicit specification support
- grant capabilities or permissions by resolving successfully

A future extension target-kind registry may define a structured namespaced form.
That design is outside this RFC.

## Namespace Model

### Assembly Namespace

The manifest assembly is the root namespace for project-level target kinds.

The symbol key is:

```text
(assembly identity, target kind, resource ID)
```

The assembly identity comes from the manifest discovery or bundle expansion
process and the declared project. It is not inferred from an arbitrary parent
directory name.

### Kind-Separated Namespaces

Each target kind has a distinct namespace.

The following declarations may coexist:

```text
agent: release-review
task: release-review
approval-gate: release-review
```

They are not duplicates because their target kinds differ.

A typed reference selects one namespace before lookup.

### Nested Namespaces

A nested declaration is keyed by its owner scope:

```text
(assembly, workflow-step, workflow:release-workflow, deploy)
```

The same step ID may be used in another workflow if the accepted workflow model
allows multiple workflows in one assembly and each reference has deterministic
scope.

Current workflow rules that require step IDs to be unique across stages within
one workflow remain unchanged.

### Bundle Neutrality

Bundle expansion must produce the same symbol table as separate manifests.

Bundle path, entry order, inline versus referenced content, and physical file
name do not create new resource namespaces.

### No Implicit Cross-Project Scope

The initial model does not resolve references across projects, repositories,
remote registries, or organization catalogs.

A value that cannot resolve in the current assembly is unresolved. A tool must
not fetch or search externally by default.

Cross-project references require a separate proposal covering identity,
versioning, trust, integrity, authentication, availability, and offline
validation.

## Field Reference Contracts

Every core reference field should eventually have a machine-readable contract.

Candidate contract metadata:

```yaml
referenceContract:
  cardinality: one
  allowedKinds:
    - agent
  scopeMode: assembly
  legacyUnqualified: allowed
```

A polymorphic example:

```yaml
referenceContract:
  cardinality: many
  allowedKinds:
    - task
    - workflow
    - capability
  scopeMode: assembly
  legacyUnqualified: deprecated
```

The exact storage for this metadata remains open. Options include:

- normative tables in the manifest reference
- reusable JSON Schema definitions
- schema annotations such as an accepted `x-nexflow-reference` keyword
- a generated reference registry checked into the repository

Regardless of storage, validators must use the same normative contracts.

### Closed Target Sets

Allowed target kinds are closed sets.

Unknown kinds and extension kinds are not added automatically.

### Field Names Are Not Enough

The following assumptions are unsafe:

- every field ending in `Ref` is a NexFlow resource reference
- every field named `owner` targets an agent
- every value named `id` creates a project-level declaration
- every list of IDs permits every target kind

Field contracts, not naming heuristics, define semantics.

## Resolution Algorithm

A conforming semantic resolver should process references in deterministic phases.

### Phase 1: Build The Manifest Assembly

- discover or expand the complete logical manifest set
- validate supported `specVersion` and manifest kinds
- retain physical and logical source locations
- reject duplicate logical manifests or paths under applicable bundle rules

### Phase 2: Build The Target Kind Registry

- load target-kind definitions supported by the claimed spec version
- load field contracts
- keep unsupported draft kinds distinguishable from accepted kinds
- do not let extensions mutate core field contracts implicitly

### Phase 3: Build Symbol Tables

- create one table per target kind and scope
- record declaration ID, kind, scope, file, manifest path, and lifecycle metadata
- detect duplicate declarations before resolving references
- preserve all duplicate candidates for diagnostics

### Phase 4: Classify The Authored Value

- determine whether the field is a resource reference
- distinguish typed object, legacy unqualified ID, event type, locator, vocabulary
  token, and opaque handle
- validate the authored shape without coercion

### Phase 5: Determine Allowed Kinds

- read the field contract
- reject a typed kind outside the allowed set
- for a legacy value, retain the complete allowed set for candidate lookup
- do not infer a kind from which declaration happens to exist

### Phase 6: Determine Scope

- use explicit scope only when the field contract permits it
- otherwise use the contract's assembly or containing-resource scope
- reject missing required scope
- reject explicit scope where the field is local-only
- resolve the scope owner exactly

### Phase 7: Resolve Candidates

- look up the exact ID in each allowed target-kind namespace for the effective
  scope
- do not search unrelated scopes
- do not normalize the ID
- do not follow aliases or replacement metadata

### Phase 8: Classify The Result

- zero candidates: unresolved
- one candidate: resolved
- more than one allowed-kind candidate for a legacy value: ambiguous
- duplicate declarations at one canonical key: duplicate target
- one same-ID declaration only in a disallowed kind: wrong-kind evidence, not a
  successful resolution

### Phase 9: Apply Domain Semantics

After reference resolution, domain validation may check:

- lifecycle eligibility
- version compatibility
- permission applicability
- actor kind suitability
- workflow graph validity
- context and memory policy
- extension lifecycle

Reference resolution itself must not perform or hide those policy decisions.

### Phase 10: Emit Normalized Results

Inspection output may include:

- authored value
- normalized target kind, ID, and scope
- declaration source location
- lifecycle metadata
- resolution status
- diagnostics and suggested migration when safe

## Ambiguity And Conflict Handling

### Duplicate Declaration

Two declarations with the same kind, ID, and scope are duplicate declarations.

This is invalid even if no reference points to them.

It is not a reference ambiguity because the symbol table itself is invalid.

### Legacy Multi-Kind Ambiguity

An unqualified value in a field that permits several target kinds is ambiguous
when more than one allowed namespace contains the ID.

Example declarations:

```text
task: release-review
workflow: release-review
```

Example legacy field:

```yaml
appliesTo:
  - release-review
```

A validator must require the author to choose a kind.

### Wrong Kind

If `agentRef: release-review` has no agent declaration but a task with that ID
exists, the reference remains unresolved as an agent reference.

The task may be reported as useful wrong-kind evidence, but the resolver must not
retarget the reference.

### Unknown Kind

A typed reference using a kind unknown to the selected specification version is
invalid.

### Kind Not Allowed By Field

A known kind may still be invalid in a particular field.

For example, a `model-profile` reference cannot satisfy a field that permits only
`actor` and `team` targets.

### Missing Or Invalid Scope

A nested target without required scope is invalid when the field contract does
not provide an implicit scope.

A scope owner that does not resolve is reported separately from the nested target
failure.

### Lifecycle Conflict

A reference may resolve structurally but point to a draft, deprecated, retired,
or otherwise ineligible resource.

That is a domain or lifecycle diagnostic, not `NF-REF-UNRESOLVED`.

### No Priority Rules

The following must never disambiguate a reference:

- agent before task
- local file before bundled entry
- active before draft
- declaration order
- alphabetical kind order
- newest version
- nearest physical file
- extension preference

## Diagnostic Model

Typed reference diagnostics use the `NF-REF-*` family introduced by RFC-0005.

Candidate stable codes:

| Code | Default severity | Meaning |
| --- | --- | --- |
| `NF-REF-MALFORMED` | Error | Reference value does not match an accepted authored shape. |
| `NF-REF-UNKNOWN-KIND` | Error | Typed target kind is unknown for the selected spec version. |
| `NF-REF-KIND-NOT-ALLOWED` | Error | Target kind is known but not permitted by the field contract. |
| `NF-REF-UNRESOLVED` | Error | No declaration matches the required kind, ID, and scope. |
| `NF-REF-AMBIGUOUS` | Error | A legacy multi-kind reference has more than one valid candidate. |
| `NF-REF-DUPLICATE-TARGET` | Error | The symbol table contains duplicate declarations at one canonical identity. |
| `NF-REF-SCOPE-REQUIRED` | Error | A nested reference lacks required scope. |
| `NF-REF-SCOPE-NOT-ALLOWED` | Error | The field contract does not permit the authored explicit scope. |
| `NF-REF-SCOPE-UNRESOLVED` | Error | The explicit scope owner does not resolve. |
| `NF-REF-CROSS-PROJECT-UNSUPPORTED` | Error | Reference requests unsupported external project scope. |
| `NF-REF-LEGACY-UNQUALIFIED` | Info or warning by migration stage | Plain ID is accepted temporarily but explicit typing is recommended or required later. |
| `NF-REF-ALIAS-UNSUPPORTED` | Error | Reference relies on an undeclared alias or normalization. |

Exact severity may depend on the selected spec version and migration stage, but
an ambiguous reference is always an error.

### Required Diagnostic Fields

A machine-readable reference diagnostic should include:

- `severity`
- `code`
- `message`
- physical file path
- logical manifest path when bundled
- manifest kind
- JSON/YAML field path
- authored value
- allowed target kinds
- effective scope
- candidate declarations when relevant
- related declaration locations
- suggested replacement only when deterministic

Example:

```json
{
  "severity": "error",
  "code": "NF-REF-AMBIGUOUS",
  "file": "project.yaml",
  "kind": "Project",
  "path": "$.project.approvalGates[0].appliesTo[0]",
  "value": "release-review",
  "allowedKinds": ["task", "workflow"],
  "scope": {
    "mode": "assembly",
    "project": "example-project"
  },
  "candidates": [
    {
      "kind": "task",
      "id": "release-review",
      "file": "tasks.yaml",
      "path": "$.tasks[2].id"
    },
    {
      "kind": "workflow",
      "id": "release-review",
      "file": "workflow.yaml",
      "path": "$.workflow.id"
    }
  ],
  "message": "Reference matches more than one allowed target kind; add an explicit kind."
}
```

### Suggested Fixes

A validator may suggest an exact typed replacement only when:

- one candidate exists
- the field contract permits that kind
- scope is deterministic
- the rewrite does not change cardinality or policy meaning

Validators must not auto-fix ambiguous references.

## Validation Expectations

### Structural Validation

Future JSON Schemas may validate:

- typed reference object shape
- required `kind` and `id`
- target-kind lexical form or enum
- core ID lexical form
- scope object shape
- field-specific allowed kind enums
- scalar-or-object migration unions

JSON Schema alone generally cannot prove:

- target existence across manifests
- target uniqueness across files
- correct implicit scope
- legacy multi-kind ambiguity
- lifecycle eligibility
- graph consistency

### Semantic Validation

Semantic validation should:

- build the target-kind registry and symbol tables
- enforce field contracts
- resolve references exactly
- report duplicate declarations separately
- reject ambiguity and wrong-kind fallback
- preserve bundle source mapping
- distinguish resource references from locators and vocabulary tokens
- apply version-specific migration severity
- expose normalized identities for downstream validation

### Reference Smoke Checks

Repository smoke checks may validate a documented subset of core references.

They must not claim complete typed-reference conformance unless they cover:

- every accepted field contract
- target-kind and scope validation
- duplicate and ambiguity handling
- diagnostics required by this RFC
- migration behavior for claimed spec versions

## Relationship To Actor Model

RFC-0013 proposes first-class human, agent, automation, service, and authority
actors.

Typed references should make `actor` the common target kind for participant
identity after that model is accepted. This reduces polymorphic fields and keeps
actor-kind suitability as a separate semantic check.

The Actor Model decides what an actor is. This RFC decides how an accepted actor
declaration is referenced.

## Relationship To Effective Agent Configuration

RFC-0014 requires selected agent definitions and components to resolve to the
expected kinds without ambiguity.

Typed references provide the common identity and diagnostics model for that
resolution. They do not change effective configuration precedence or grant any
behavior.

## Relationship To Approval Gates

RFC-0007 includes fields such as `appliesTo` whose targets may span multiple
resource kinds.

These fields are primary candidates for mandatory explicit typing because adding
a new same-ID declaration must not silently change gate scope.

## Relationship To Validation Strategy

RFC-0005 defines the `NF-REF` diagnostic family and separates schema validation
from semantic validation.

This RFC supplies candidate exact reference codes and the resolution phases that
a semantic validator should implement.

## Relationship To Reference CLI

RFC-0011 defines validation and inspection boundaries for a future reference
CLI.

A typed-reference-aware CLI should:

- print normalized target kind and scope in `inspect`
- report candidate locations for ambiguity
- keep diagnostic codes stable
- avoid rewriting files during validation
- offer migration output only through an explicit command or flag
- perform no network lookup for unresolved references by default

## Relationship To Manifest Bundling

RFC-0012 requires bundle expansion to preserve manifest meaning.

Reference symbol tables are built after expansion. Logical paths are retained for
diagnostics, but bundle structure and physical paths do not alter namespaces.

## Relationship To Extension Namespaces

RFC-0006 governs extension namespace ownership and lifecycle.

Extension namespace strings and core reference target kinds are separate
vocabularies. Supporting one does not imply support for the other.

## Conformance Impact

If accepted, typed references affect several conformance surfaces.

| Claim | Expected impact |
| --- | --- |
| `NF-MANIFEST` | Must preserve accepted typed and legacy reference forms for the claimed spec version. |
| `NF-SCHEMA` | Must validate typed reference shapes and field-specific kind constraints it claims. |
| `NF-SEMANTIC` | Must resolve kind, ID, and scope deterministically and report ambiguity or duplicates. |
| `NF-CLI` | Must expose stable reference diagnostics and normalized inspection output. |
| `NF-RUNTIME` | Must bind only references that passed required resolution and policy validation. |
| `NF-EXTENSION` | Must keep extension references namespace-scoped and unable to alter core field contracts silently. |

Parsing a typed reference object is not enough to claim semantic support.

## Compatibility Impact

This RFC is planning-oriented and does not change current manifests by itself.

Potentially compatible changes:

- documenting field contracts
- adding informational diagnostics for safely inferred legacy references
- exposing normalized references in inspection output
- accepting typed objects alongside legacy strings during a draft transition

Potentially breaking changes:

- requiring typed objects in fields that currently accept strings
- changing the target-kind set of an existing field
- changing a declaration's uniqueness scope
- making artifact IDs task-scoped instead of `TaskSet`-wide
- changing implicit workflow scope
- rejecting a legacy value that previously resolved by implementation order
- renaming an adopted target-kind token
- enabling cross-project resolution
- changing stable diagnostic code meaning

Any required syntax migration should be tied to an explicit manifest
`specVersion` policy and documented under NexFlow compatibility rules.

## Migration Strategy

Migration should be staged and tool-assisted.

### Stage 0: Document Current Contracts

- inventory every declaration and reference field
- classify locators, event types, vocabulary tokens, and opaque handles
- document allowed target kinds and scope for current fields
- add duplicate and ambiguity fixtures
- keep current schemas and examples valid

### Stage 1: Normalize Internally

- let validators normalize current single-kind string references to logical typed
  tuples
- emit no warning where the field is inherently single-kind and deterministic
- report ambiguous current multi-kind references as errors
- expose normalized results through inspection output

### Stage 2: Accept Typed Objects

- add a reusable typed reference schema
- update selected fields to accept a scalar ID or typed object
- require typed objects for new examples in genuinely multi-kind fields
- retain exact legacy behavior for deterministic single-kind fields
- add schema and semantic fixtures for every target kind

### Stage 3: Deprecate Unsafe Unqualified Forms

- warn on unqualified values in multi-kind fields
- provide deterministic replacement suggestions where one candidate exists
- refuse automatic migration where zero or multiple candidates exist
- publish the spec version in which unsafe unqualified forms become invalid

### Stage 4: Require Explicit Type Where Needed

- reject unqualified values in multi-kind fields
- keep concise scalar IDs in closed single-kind fields unless a later RFC finds a
  concrete interoperability reason to remove them
- stabilize required `NF-REF-*` diagnostics
- update conformance fixtures and migration documentation

### Stage 5: Evaluate Nested Scope Changes

- decide whether artifacts remain assembly-scoped or become task-scoped
- decide whether multiple workflows per assembly are supported
- add explicit scope only where the domain model requires it
- avoid changing scope merely for syntactic uniformity

## Migration Algorithm For Tools

A migration tool should process each legacy reference as follows:

1. Read the field contract for the selected spec version.
2. Determine the allowed target-kind set.
3. Determine the effective scope.
4. Perform exact lookup in every allowed namespace.
5. If one candidate exists, propose the exact typed object.
6. If no candidate exists, report unresolved and leave source unchanged.
7. If multiple candidates exist, report ambiguity and leave source unchanged.
8. Preserve comments, ordering, and source location when the authoring format
   permits it.
9. Re-run schema and semantic validation after any accepted rewrite.

A migration tool must not use runtime history, Git history, provider state, or
network search to guess intent.

## Security And Safety Impact

Typed references improve safety by preventing accidental or adversarial
retargeting across resource kinds.

Required safeguards:

- ambiguous references fail closed
- unknown kinds do not gain core meaning
- extension kinds cannot shadow core kinds
- wrong-kind matches are never accepted as fallback
- external lookup is disabled by default
- file paths do not become authority boundaries
- a reference cannot grant permissions or capabilities
- lifecycle checks remain separate and mandatory where applicable
- diagnostics avoid exposing sensitive resource contents
- migration tools do not make ambiguous rewrites

An attacker-controlled manifest must not influence resolution through declaration
order, file name, bundle entry order, or lookalike IDs.

## Privacy Impact

Reference diagnostics should report identifiers and source locations needed to
fix the manifest, not referenced content.

Tools should avoid including:

- prompt bodies
- retrieved context
- memory contents
- credentials or tokens
- private provider account identifiers
- raw approval evidence

Machine-specific absolute paths should be omitted or normalized in portable CI
artifacts when not required.

## Alternatives Considered

### Keep Field-Name-Only Typing

NexFlow could rely entirely on names such as `agentRef` and `task`.

This remains concise for single-kind fields but does not solve multi-kind fields,
scope evolution, consistent diagnostics, or extension boundaries.

### Require Typed Objects Everywhere

Every reference could immediately become `{kind, id}`.

This is uniform but creates large manifest churn where fields already have one
closed target kind. The proposed model requires explicit typing where it removes
real ambiguity and permits concise syntax where semantics are already complete.

### Use `kind:id` Strings

References could use strings such as `agent:docs-agent`.

This is compact, but scope requires a second grammar, editor support is weaker,
and IDs, URIs, and extension namespaces become easier to confuse. A compact form
may be added later as syntax sugar over the same logical tuple.

### Use File Paths

References could identify `agents.yaml#docs-agent`.

This couples identity to layout, makes bundle equivalence harder, and encourages
path traversal or remote fetch behavior. File paths belong in diagnostics, not
resource identity.

### Require Globally Unique IDs Across All Kinds

NexFlow could prohibit the same ID in any target kind.

This reduces some ambiguity but creates unnecessary naming pressure and still
does not express expected kind or nested scope. Kind-separated namespaces are
clearer and more extensible.

### Resolve By Priority

A resolver could define a fixed order such as actor, agent, task, workflow.

This makes adding declarations behavior-changing and hides author intent. It is
not acceptable for auditable orchestration specifications.

### Use URIs For Every Reference

References could use a URI scheme with project, kind, and ID segments.

URIs may become useful for signed cross-project packages or registries, but they
are unnecessary for deterministic local manifest assemblies and introduce remote
resolution expectations too early.

## Open Questions

- Should the typed object form be accepted as the only explicit authored form,
  or should a compact scalar shorthand also be standardized?
- Which current fields are genuinely multi-kind after the Actor Model is
  accepted?
- Should `actor` typing wait until `ActorSet` is accepted, or advance in the same
  specification version?
- Should artifact identity remain unique across `TaskSet` or become task-scoped?
- Should a future assembly support more than one `Workflow` declaration?
- Should prompt entries become independently referenceable core resources?
- Where should normative field contracts live: docs, schemas, a generated
  registry, or a combination?
- Should JSON Schema use annotations for target kinds even though semantic
  validation performs lookup?
- Which `NF-REF-*` codes must be stable before a reference CLI release?
- Should event declarations ever receive typed resource identities in addition
  to dotted event types?
- What manifest `specVersion` first permits typed objects?
- What manifest `specVersion` first rejects unsafe unqualified multi-kind
  references?
