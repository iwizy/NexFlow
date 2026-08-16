# Provider Constraints

Provider constraints describe static eligibility facts and policy boundaries for
a declared provider abstraction. They make selection reviewable without binding
NexFlow to one vendor or calling a live provider API.

They do not grant provider access, network access, credentials, context access,
tool access, permission, or runtime authority.

Related documents:

- [Provider Abstraction](provider-abstraction.md)
- [Provider Adapter Boundary](provider-adapter-boundary.md)
- [Provider Features](provider-features.md)
- [Model Profiles](model-profiles.md)
- [Network Access Policy](network-access-policy.md)
- [RFC-0010: Provider Selection](../rfcs/RFC-0010-provider-selection.md)

## Authored Shape

```yaml
providers:
  - id: reviewed_reasoning
    type: abstract
    description: Provider-neutral reviewed reasoning class.
    constraints:
      trainingUse: prohibited
      dataResidency: regions
      allowedRegions:
        - eu-west
        - eu-central
      toolUse: declared_tools_only
      maxSensitivity: confidential
      costTier: medium
      latencyClass: interactive
      deployment: remote
      networkAccess: required
      approvalRequired: true
      dataRetention:
        mode: bounded
        maxDuration: P30D
```

The constraints object is optional. When present, it must contain at least one
field. Omission or `unspecified` is not evidence that a restrictive model
profile requirement is satisfied.

## Core Vocabulary

| Field | Values or shape | Meaning |
| --- | --- | --- |
| `trainingUse` | `allowed`, `prohibited`, `requires_approval`, `unspecified` | Provider-side policy for use of project data in model improvement. |
| `dataResidency` | `any`, `project_policy`, `organization_policy`, `regions`, `local_only`, `unspecified` | Processing and storage locality boundary. |
| `allowedRegions` | Non-empty unique strings | Allowed region identifiers when `dataResidency: regions`. |
| `toolUse` | `none`, `declared_tools_only`, `provider_native_tools`, `unspecified` | Provider-side tool mode that may be considered during selection. |
| `maxSensitivity` | `public`, `internal`, `confidential`, `restricted` | Highest information classification the declaration permits. |
| `costTier` | `low`, `medium`, `high`, `custom`, `unspecified` | Declared provider cost class for policy comparison. |
| `latencyClass` | `interactive`, `batch`, `background`, `custom`, `unspecified` | Declared operational latency class. |
| `deployment` | `remote`, `local`, `hybrid`, `unspecified` | Where the provider abstraction may execute. |
| `networkAccess` | `required`, `optional`, `prohibited`, `unspecified` | Whether provider use depends on an outbound connection. |
| `approvalRequired` | Boolean | Whether provider selection requires approval at this policy layer. |
| `dataRetention.mode` | `none`, `bounded`, `provider_policy`, `organization_policy`, `unspecified` | Provider-side retention posture. |
| `dataRetention.maxDuration` | Non-empty duration string | Required when retention is `bounded`; ISO 8601 duration syntax is recommended. |

Provider-specific fields may be preserved as namespaced metadata while schemas
remain draft-flexible. Unknown fields never grant access or satisfy a core
constraint automatically.

## Provider And Model Profile Boundaries

Provider and model-profile constraints answer different questions:

| Declaration | Question |
| --- | --- |
| `ProviderSet.providers[].constraints` | What static policy boundary or operating class does this candidate advertise? |
| `ModelProfileSet.modelProfiles[].constraints` | What must be true for this behavioral use? |

A future selector should intersect them with project and organization policy.
It should reject clear conflicts and treat unresolved facts as blockers when a
restrictive requirement matters.

Examples:

- A profile requiring `trainingUse: prohibited` is not satisfied by a provider
  with `trainingUse: allowed` or `unspecified`.
- A provider with `maxSensitivity: internal` cannot process confidential
  context merely because a profile requests it.
- `toolUse: provider_native_tools` does not grant a tool capability or
  permission.
- `networkAccess: required` describes connectivity needs; it does not satisfy
  `access_network` or project network policy.
- A `costTier` or `latencyClass` label does not prove live price, performance,
  availability, or service quality.

The current repository does not implement a complete comparison or selection
algorithm. Focused checks validate authored structure and obvious invalid
combinations only.

## Selection And Failure Rules

A future selector should:

1. Resolve the active model profile and eligible provider references.
2. Apply project and organization policy.
3. Compare explicit provider constraints with model-profile requirements.
4. Exclude candidates with clear conflicts.
5. Treat material `unspecified`, unknown, or externally resolved facts as
   blockers or approval requirements.
6. Apply fallback only when the model profile permits it.
7. Evaluate permissions, context, memory, network, credentials, and approvals
   independently.
8. Record the constraints used and the reason for selection or rejection.

After selection, the future
[Provider Adapter Boundary](provider-adapter-boundary.md) prevents an adapter
from replacing the target, weakening constraints through provider defaults, or
performing fallback locally. A fallback must return to the selector and repeat
policy, approval, context, memory, network, and credential evaluation.

Static validation must not call provider APIs, infer current pricing, test
latency, acquire credentials, or treat a declared candidate as available.

## Legacy `allowTrainingUse`

Early `0.1` drafts used a boolean:

```yaml
constraints:
  allowTrainingUse: false
```

The field remains structurally valid and deprecated during the `0.1` migration
window. It cannot coexist with `trainingUse`.

Migration:

```yaml
constraints:
  trainingUse: prohibited
```

Map `false` to `prohibited`. Map `true` to `allowed` only when that accurately
represents reviewed policy; otherwise use `requires_approval` or `unspecified`.
Then review every affected model profile, context classification, fallback, and
approval gate.

## Validation Evidence

Run:

```sh
npm run provider-constraint-schema-smoke
npm run validate
```

The focused command covers 17 accepted and rejected cases for structured and
legacy training policy, residency and region coupling, tool use, sensitivity,
network posture, retention, and namespaced extension preservation.

These checks do not establish live provider compatibility or `NF-RUNTIME`
conformance.

## Compatibility

The structured vocabulary is a compatibility tightening inside the unreleased
`specVersion: "0.1"` draft. Maintained examples use `trainingUse`; the legacy
boolean remains readable for migration.

Removing a value, changing its meaning, broadening training or tool use,
raising sensitivity, weakening residency or retention, removing approval, or
changing constraint composition may be behavior-, privacy-, audit-, or
safety-breaking.
