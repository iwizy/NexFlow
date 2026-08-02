# Manifest Discovery

Manifest discovery turns an explicit, bounded set of source files into one
logical NexFlow project assembly for validation and inspection.

The current implementation is repository validation tooling. It does not
execute workflows, scan arbitrary directories, fetch remote files, expand
bundles, select a default workflow, or define runtime state.

Design source: [RFC-0016](../rfcs/RFC-0016-core-profile-and-discovery.md).
Focused implementation:
[`scripts/lib/manifest-discovery.mjs`](../scripts/lib/manifest-discovery.mjs).

## Supported Input Modes

The implemented `0.1` slice supports two deterministic modes:

| Mode | Input | Behavior |
| --- | --- | --- |
| Explicit file list | Caller supplies every local source path and may supply an expected kind. | Every listed source is checked within one explicit root. |
| Project source hints | Caller supplies one Project path. | The Project is loaded first, then supported `Project.manifests` hints are normalized into an explicit file list. |

No implicit directory walk occurs in either mode. File names are not semantic:
an explicitly listed `people/team.yml` is classified from its declared `kind`,
not from its basename.

## Project Source Hints

`Project.manifests` remains optional. The historical singular workflow hint is
valid:

```yaml
manifests:
  agents: agents.yaml
  tasks: tasks.yaml
  workflow: workflow.yaml
```

Projects with multiple workflows use `workflows`:

```yaml
manifests:
  agents: people/team.yml
  tasks: work/items.yml
  workflows:
    - flows/documentation.yml
    - flows/release.yml
```

`workflow` and `workflows` cannot coexist. A `workflows` list must be non-empty
and cannot contain duplicate source paths.

The implemented source-hint registry maps these keys to expected manifest
kinds:

| Source Hint | Expected Kind |
| --- | --- |
| `actors` | `ActorSet` |
| `agents` | `AgentSet` |
| `agentDefinitions` | `AgentDefinitionSet` |
| `capabilities` | `CapabilitySet` |
| `permissions` | `PermissionSet` |
| `tasks` | `TaskSet` |
| `workflow`, `workflows` | `Workflow` |
| `handoffs` | `HandoffSet` |
| `context` | `ContextSet` |
| `memory` | `MemorySet` |
| `providers` | `ProviderSet` |
| `modelProfiles` | `ModelProfileSet` |
| `promptSets` | `PromptSet` |
| `retrievalProfiles` | `RetrievalProfileSet` |
| `events` | `EventSet` |
| `extensions` | `ExtensionSet` |

Source keys select an expected document kind for diagnostics. They do not
become resource identity, grant authority, or override a document's authored
`kind`. An unknown hint is unsupported by this slice rather than guessed.

## Discovery Boundary

The current helper applies these limits by default:

| Boundary | Default |
| --- | --- |
| Root | One explicit local directory. |
| Source type | Regular `.yaml` or `.yml` files only. |
| Remote access | Disabled. URI-like locators are rejected. |
| Path containment | Every resolved source must remain inside the root. |
| Symbolic links | Rejected, including sources reached through a symlinked path component. |
| Document count | Maximum 128 explicit sources. |
| File size | Maximum 1 MiB per source. |
| YAML aliases | Maximum 100 aliases. |
| YAML mapping keys | Duplicate keys are rejected. |

Lexical source sorting makes diagnostics and inspection output reproducible. It
does not establish precedence. Duplicate sources, documents, or workflow IDs
never use last-writer-wins behavior.

## Deterministic Assembly

Discovery performs these steps:

1. Canonicalize the explicit root.
2. Normalize and de-duplicate source locators.
3. Enforce containment, source type, symlink, count, size, and parser limits.
4. Parse each document safely and classify `specVersion`, `kind`, project
   metadata, and root resource identity.
5. Select exactly one Project and require `project.id` to match
   `metadata.project`.
6. Associate only documents with the selected project and specification
   version.
7. Enforce one document for current singleton kinds while retaining multiple
   unique Workflow documents.
8. Produce a source-grounded inventory for later schema and semantic checks.

Illustrative inspection shape:

```yaml
assembly:
  projectId: discovery-fixture
  specVersion: "0.1"
  documents:
    - kind: Project
      resourceId: discovery-fixture
      source: project.yaml
    - kind: Workflow
      resourceId: docs-delivery
      source: flows/documentation.yml
    - kind: Workflow
      resourceId: release-review
      source: flows/release.yml
  workflows:
    - id: docs-delivery
      source: flows/documentation.yml
    - id: release-review
      source: flows/release.yml
```

This is derived inspection data, not an authored manifest or a runtime input.
The helper retains parsed documents for downstream validation but does not infer
permissions, profile conformance, execution order, or effective configuration.

## Document Cardinality

| Kind | Current Cardinality |
| --- | --- |
| `Project` | Exactly one. |
| `Workflow` | Zero or more, keyed by unique `workflow.id`. |
| Every other current manifest kind | Zero or one document. |

Resource IDs inside singleton set documents retain their existing namespaces.
Aggregation of multiple TaskSet, AgentSet, PermissionSet, or other collection
documents remains future work and must not be inferred by concatenation.

## Multiple Workflow Rules

- Every discovered Workflow is retained.
- Workflow identity is `(project assembly, Workflow, workflow.id)`.
- Stage and step IDs remain local to their containing workflow.
- Two workflows may use the same stage or step ID.
- Multiple workflows may reference the same TaskSet task.
- Discovery does not merge workflow bodies or execution state.
- Discovery does not choose a default workflow.
- Scalar step dependencies resolve only inside the containing workflow.
- Cross-workflow dependency syntax and runtime scheduling remain unsupported.

## Implemented Diagnostics

| Code | Meaning |
| --- | --- |
| `NF-DISCOVERY-NO-PROJECT` | No eligible Project was discovered. |
| `NF-DISCOVERY-MULTIPLE-PROJECTS` | More than one Project was discovered. |
| `NF-DISCOVERY-PROJECT-MISMATCH` | Project identity or document association does not match. |
| `NF-DISCOVERY-UNSUPPORTED-VERSION` | A document does not use the selected Project version. |
| `NF-DISCOVERY-UNSUPPORTED-KIND` | A document kind is missing or unsupported. |
| `NF-DISCOVERY-KIND-MISMATCH` | A source hint's expected kind differs from the document kind. |
| `NF-DISCOVERY-DUPLICATE-SOURCE` | A source is repeated or singular and plural workflow hints coexist. |
| `NF-DISCOVERY-DUPLICATE-SINGLETON` | More than one document exists for a current singleton kind. |
| `NF-DISCOVERY-DUPLICATE-WORKFLOW` | Multiple Workflow documents declare the same workflow ID. |
| `NF-DISCOVERY-OUTSIDE-ROOT` | A locator is absolute, remote-like, or escapes the root. |
| `NF-DISCOVERY-UNSAFE-SOURCE` | A source type, symlink, file, or YAML document violates policy. |
| `NF-DISCOVERY-LIMIT-EXCEEDED` | A configured source, size, or parser limit is exceeded. |
| `NF-DISCOVERY-UNSUPPORTED-HINT` | A Project source-hint key is not in the implemented registry. |

These diagnostics are repository evidence for the draft model. Their wording
is not yet a stable reference CLI contract.

## Validation

Run:

```sh
npm run manifest-discovery-smoke
```

The focused checks cover the Project schema migration, a five-document fixture
with two workflows, source-order independence, workflow-local step namespaces,
schema validity, project and version association, expected kinds, conservative
cardinality, duplicate workflow IDs, root containment, remote locators,
symlinks, unsupported kinds, duplicate sources, and document limits.

The fixture under `fixtures/discovery/multi-workflow/` is validation evidence,
not another reference team example and not an executable workflow.

## Compatibility And Migration

Existing projects using `manifests.workflow` remain valid. A project moves to
multiple workflows by replacing that scalar hint with `manifests.workflows` and
assigning a unique `workflow.id` to every listed document.

The change remains in manifest `specVersion: "0.1"` because the candidate has
not been published and the plural form is additive for existing valid
projects. Removing the singular form, changing cardinality, allowing additional
collection documents, adding implicit scanning, or changing source safety
defaults requires a new compatibility decision.

## Not Implemented

- bounded directory scanning
- ignore-file behavior
- project index documents beyond the current source-hint map
- bundle expansion or equivalence checks
- JSON, standard input, or API document discovery
- remote source approval or fetching
- automatic profile or dependency closure
- complete semantic validation
- workflow selection for a CLI or graph view
- cross-workflow dependencies or execution state
- runtime loading, scheduling, or enforcement
