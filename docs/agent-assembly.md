# Agent Assembly

Agent Assembly is the human-readable inspection projection of an
[Effective Agent Configuration](effective-agent-configuration.md).

It shows how authored manifests resolve for one agent: which identity and
definition were selected, which behavior was requested, which policies narrow
that request, which references supplied each value, and which unresolved items
or blockers remain.

Agent Assembly is not a manifest kind, an authored configuration, a behavioral
release, or a source of authority. NexFlow does not define
`agent-assembly.yaml`, `AgentAssemblySet`, or a `Project.manifests` entry for it.
An exported view is read-only evidence and MUST NOT be re-ingested as a grant,
override, or replacement for its source manifests.

Related RFCs:
[RFC-0004: Agent Definition Versioning](../rfcs/RFC-0004-agent-definition-versioning.md)
and
[RFC-0014: Effective Agent Configuration](../rfcs/RFC-0014-effective-agent-configuration.md).

## One Model, Four Representations

| Representation | Meaning | Authority |
| --- | --- | --- |
| Authored manifests | Identity, requested behavior, policy, and component declarations written by project authors. | Each manifest remains authoritative for its own domain. |
| Effective Agent Configuration | The deterministic, policy-bounded semantic result of resolving those declarations for one agent. | Derived result; it cannot broaden authored authority. |
| Agent Assembly view | A review and inspection projection of the effective result, including provenance and blockers. | Read-only derived evidence; never an input or grant. |
| Resolved Execution Snapshot | Future invocation-time facts such as selected provider, loaded prompt revision, approvals, and actual context or memory use. | Runtime evidence; no such implementation exists in this repository. |

The model is singular. Agent Assembly does not compete with Effective Agent
Configuration; it makes that result inspectable.

## Purpose

An Agent Assembly view answers:

- which project, actor, and stable agent identity are being inspected
- which unique active agent definition was selected, or why selection failed
- which model, prompt, retrieval, permission, capability, context, memory,
  autonomy, and extension values the definition requested
- which policy manifests and runtime constraints narrow those requests
- which approval requirements remain
- which references are missing, ambiguous, incompatible, denied, or unsupported
- which authored resource supplied or constrained each reported value
- whether manifest-level resolution is complete enough for later runtime
  preflight

It does not answer which provider was called, which prompt was loaded, which
context was retrieved, which memory was written, or which action was executed.
Those are future resolved snapshot and runtime concerns.

## Derivation Inputs

| Domain | Primary input | Constraint or resolution input |
| --- | --- | --- |
| Identity | `ActorSet` when present, plus stable `AgentSet` identity | Project association and legacy participant migration rules |
| Requested behavior | Unique unscoped active `AgentDefinitionSet` entry | Definition lifecycle and review requirements |
| Model | `modelProfileRef` | `ModelProfileSet`, provider inventory, project policy, runtime support |
| Prompts | `promptSetRef` | `PromptSet` lifecycle, safety review, runtime support |
| Retrieval | `retrievalProfileRef` | `RetrievalProfileSet`, `ContextSet`, provider policy, runtime support |
| Capabilities | `capabilityRefs` | `CapabilitySet`, runtime, sandbox, and integration support |
| Permissions | `permissionRefs` | `PermissionSet` effects, conditions, scope, and approval gates |
| Context | `contextSourceRefs` | `ContextSet` allow and deny policy |
| Memory | `memoryScopes` | `MemorySet` retention, consumers, writers, updates, and promotion rules |
| Autonomy | `autonomyLevel` | Project, task, workflow, human-control, and runtime ceilings |
| Extensions | `extensionRefs` | `ExtensionSet` lifecycle, requirements, policy, and runtime support |

References request or select applicable declarations. They do not grant access.

## Deterministic Derivation

A future inspector producing an Agent Assembly view should:

1. Discover one logical project assembly using the applicable discovery rules.
2. Resolve the project, actor when present, and stable agent identity.
3. Select exactly one eligible active definition using the accepted selection
   contract.
4. Resolve every component and policy reference by its field contract.
5. Separate requested behavior from applicable policy and runtime constraints.
6. Apply only domain-specific narrowing rules; never use a generic deep merge.
7. Record effective values, unresolved runtime facts, blockers, and provenance.
8. Return the same result regardless of file order, declaration order, file
   name, modification time, or provider availability.

A tool MUST fail closed on missing or ambiguous identity, multiple active
definitions, wrong-kind references, unsafe broadening, or unsupported required
semantics. It MUST NOT guess a version, union conflicting arrays, or select the
last declaration read.

Deprecated AgentSet behavior fields are migration data. They are not merged into
the requested configuration and may appear only in compatibility diagnostics.

## Candidate View States

The following state vocabulary is illustrative and not yet a versioned output
contract:

| State | Meaning |
| --- | --- |
| `resolved` | Manifest-level identity, definition, reference, and policy resolution succeeded. Runtime choices may still be unresolved. |
| `blocked` | Resolution found an applicable deny, active human override, known unsatisfied approval for the required scope, or another deterministic blocker. |
| `incomplete` | Missing or ambiguous authored configuration prevents a complete effective result. |
| `unsupported` | The inspector cannot interpret a required specification feature, extension, or namespace safely. |

`resolved` does not mean executable. A provider, runtime capability, credential,
approval, task scope, or other operational fact may remain unresolved.

## Illustrative View

The following shape demonstrates the information an inspector could expose. It
is not an authored manifest, a JSON Schema contract, or implemented CLI output.

```yaml
agentAssembly:
  sourceSpecVersion: "0.1"
  status: resolved
  identity:
    actorRef: docs-agent
    agentRef: docs-agent
  selectedDefinition:
    ref: docs_agent_2026_06
    version: "2026.06.0"
    selectionMode: unique_unscoped_active
  requested:
    modelProfileRef: docs_agent_balanced
    promptSetRef: docs_agent_prompts
    retrievalProfileRef: docs_agent_retrieval
    permissionRefs:
      - docs_write_with_review
    capabilityRefs:
      - read_repository
      - modify_documentation
    contextSourceRefs:
      - repository
      - docs
    memoryScopes:
      - ephemeral
      - task
    autonomyLevel: ask_before_changes
    extensionRefs: []
  constraints:
    permissions:
      approvalRequired:
        - capabilityRef: modify_documentation
          gateRef: human_review
    context:
      allowed:
        - repository
        - docs
    memory:
      allowed:
        - ephemeral
        - task
    autonomy:
      ceiling: ask_before_changes
  runtimeResolution:
    status: not_attempted
  blockers: []
  provenance:
    - domain: identity
      manifestKind: AgentSet
      resourceRef: docs-agent
    - domain: requested_behavior
      manifestKind: AgentDefinitionSet
      resourceRef: docs_agent_2026_06
    - domain: permissions
      manifestKind: PermissionSet
      resourceRef: docs_write_with_review
```

The example intentionally reports resource identity rather than source file
paths. Discovery paths are transport details and may be exposed separately as
diagnostic locations when useful.

## Authority And Provenance Rules

The selected active agent definition is authoritative for requested behavior.
It does not authorize that behavior.

`PermissionSet`, `CapabilitySet`, `ContextSet`, `MemorySet`, model and provider
policy, project policy, task and workflow constraints, human control, and
runtime support remain authoritative in their domains. They may narrow the
request and MUST NOT be replaced by a value copied into an Agent Assembly view.

Every effective value, exclusion, approval requirement, and blocker should
identify the source resource and domain rule that produced it. Provenance should
be stable resource identity where possible, with diagnostic source locations as
optional tool metadata.

An exported view MUST NOT:

- become an input to effective configuration resolution
- override a newer or conflicting authored manifest
- grant a capability, permission, context source, memory scope, or autonomy
- satisfy an approval gate
- establish provider, extension, credential, or runtime support
- conceal a missing, ambiguous, denied, or unsupported source

## Blockers And Diagnostics

A blocked, incomplete, or unsupported view should preserve all safely known
identity and source information while making the failure explicit.

Candidate diagnostics include:

- `NF-EFFECTIVE-CONFIG-NO-ACTIVE-DEFINITION`
- `NF-EFFECTIVE-CONFIG-AMBIGUOUS-DEFINITION`
- `NF-EFFECTIVE-CONFIG-INELIGIBLE-DEFINITION`
- `NF-EFFECTIVE-CONFIG-UNRESOLVED-COMPONENT`
- `NF-EFFECTIVE-CONFIG-INCOMPLETE-ACTIVE-DEFINITION`
- `NF-EFFECTIVE-CONFIG-CONTEXT-DENIED`
- `NF-EFFECTIVE-CONFIG-MEMORY-DENIED`
- `NF-EFFECTIVE-CONFIG-APPROVAL-PENDING`
- `NF-EFFECTIVE-CONFIG-RUNTIME-UNSUPPORTED`

The [Diagnostic Code Catalog](diagnostic-code-catalog.md) classifies these names
as Candidate. They remain draft and are not emitted by a complete effective
configuration resolver. Tools should report precise resource and field
locations without exposing sensitive content.

## Serialization Boundary

The current NexFlow `0.1` repository defines Agent Assembly semantics in
documentation only.

- no `AgentAssemblySet` manifest exists
- no Agent Assembly JSON Schema exists
- no generated assembly file belongs in the maintained examples
- no reference CLI or runtime currently emits this view
- current project discovery does not search for an assembly document
- current schema validation does not validate an assembly document

A future machine-readable output contract must define field stability,
diagnostic compatibility, deterministic ordering, redaction, and conformance
impact before tools claim interoperable output.

## Security And Privacy

An Agent Assembly view should contain references, versions, decisions,
constraints, and content digests where needed for review. It should not contain:

- raw prompt text
- retrieved documents or context excerpts
- memory contents
- credentials, tokens, private keys, or secret values
- sensitive approval evidence
- unnecessary personal data
- provider request or response bodies

Unknown or unredactable sensitive values must be omitted or represented by a
safe diagnostic. Redaction must not hide the existence of a blocker.

## Versioning And Compatibility

Agent Assembly has no independently authored version. `sourceSpecVersion`
identifies the specification version of the manifests used to derive the view.
Component and definition versions remain visible through their resource
references.

Changing an authored component can change the derived view without changing
`specVersion`. Changing a future standardized Agent Assembly output field,
status meaning, ordering rule, or diagnostic code may affect `NF-CLI` and
`NF-SEMANTIC` compatibility even when manifest compatibility is unchanged.

## Validation, Runtime, And Conformance

JSON Schema validates authored manifest shape. Repository semantic smoke checks
currently cover selected references and unique active-definition authority, but
they do not calculate a complete Agent Assembly view.

A future `nexflow inspect` command may emit the view without executing an agent.
A future runtime may consume the underlying effective configuration and produce
a Resolved Execution Snapshot. The runtime must not treat the inspection
serialization as stronger authority than the authored manifests and policies
from which it was derived.

No implementation in this repository currently claims Agent Assembly
conformance.

## Current Status

The current slice defines Agent Assembly as a documentation-level inspection
projection in the unreleased NexFlow `0.1` draft.

Implemented in this repository:

- the conceptual relationship to Effective Agent Configuration
- authority, provenance, blocker, serialization, security, compatibility, and
  conformance boundaries
- an illustrative, non-normative view shape

Not implemented:

- a complete effective configuration resolver
- an Agent Assembly serializer or CLI command
- a machine-readable output schema
- runtime preflight, enforcement, execution, or resolved snapshots
