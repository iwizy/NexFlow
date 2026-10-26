// Deterministic evidence assembly; this does not accept an architecture or sign a review.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {json,fileSha,checked} from './common.mjs';
import {modelChecks,checkImports} from '../../evaluation/architecture/revised/contract-model.mjs';
checked(process.execPath,['scripts/qualification/verify-measurements.mjs']);
const root='evaluation/architecture/revised',measurement='evaluation/measurement-qualification',summary=json(measurement+'/summary.json'),layouts=json(root+'/layouts.json'),folders=['linux-amd64','macos-arm64','windows-amd64'],ids=['typescript','python'];
assert.equal(summary.sourceBoundNativeRecords,6);assert.equal(summary.measuredCells,42);assert.equal(summary.excludedCells,42);assert.equal(summary.originalAll84SuccessfulCriterionSatisfied,false);checkImports(layouts.dependencyGraph);
const inputRevision=checked('git',['rev-parse','HEAD']),criteria=json('rfcs/reviews/2026-10-11-runtime-architecture-review.json').scoring.criteria;assert.equal(criteria.reduce((n,c)=>n+c.weight,0),100);assert.equal(criteria.length,10);
const raw=(folder,id)=>JSON.parse(gunzipSync(readFileSync(measurement+'/'+folder+'/'+id+'.json.gz'))),median=values=>{const sorted=[...values].sort((a,b)=>a-b),n=sorted.length;assert.ok(n);return n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;};
const observations={},wins={typescript:{performance:0,operations:0},python:{performance:0,operations:0}},ties={performance:0,operations:0};
for(const folder of folders){observations[folder]={};for(const id of ids){const r=raw(folder,id);assert.equal(r.result,'passed-eligible-measurement-scope');const success=r.cold.filter(x=>x.successfulValidation);observations[folder][id]={coldStartMs:median(success.map(x=>x.elapsedMs)),peakMemoryBytes:median(success.map(x=>x.peakMemoryBytes)),validationOnePassMs:median(r.library.filter(x=>x.passes===1).map(x=>x.validationMs)),validationTenPassMs:median(r.library.filter(x=>x.passes===10).map(x=>x.validationMs)),validationHundredPassMs:median(r.library.filter(x=>x.passes===100).map(x=>x.validationMs)),cleanBuildMs:median(r.cleanBuild.map(x=>x.elapsedMs)),cachedBuildMs:median(r.cachedBuild.map(x=>x.elapsedMs)),ciLaneMs:median(r.ci.map(x=>x.elapsedMs)),artifactBytes:r.artifact.bytes,environmentSha256:r.environmentSha256,runId:r.runId,producer:r.producer.revision};}
  for(const [domain,metrics] of [['performance',['coldStartMs','peakMemoryBytes','validationOnePassMs','validationTenPassMs','validationHundredPassMs']],['operations',['cleanBuildMs','cachedBuildMs','ciLaneMs']]])for(const metric of metrics){const a=observations[folder].typescript[metric],b=observations[folder].python[metric];if(a===b)ties[domain]++;else wins[a<b?'typescript':'python'][domain]++;}
}
const scorecards=ids.map(id=>{const scores={specificationAndValidationFidelity:4,securityAndIsolationFit:3,crossPlatformDistribution:2,ecosystemAndIntegrationFit:2,contributorAccessibility:0,maintainability:id==='typescript'?4:3,performanceAndResourceUse:wins[id].performance>=8?4:3,observabilityAndDiagnostics:3,embeddingAndInteroperability:2,operationalFootprint:wins[id].operations>=5?4:3};
  const rationale={
    specificationAndValidationFidelity:'Complete frozen/native/public oracle evidence and all comparable successful library samples; full project semantics and product conformance remain outside the prototype claim.',
    securityAndIsolationFit:'Actual OS denial, inherited-handle, redaction/revocation and resource controls on all three targets; bounded declared threat model, no general runtime or arbitrary-broker certification.',
    crossPlatformDistribution:'Genuine install/upgrade/rollback/uninstall on three targets, immutable payload/checksums/provenance. Score 2 retains manual runtime prerequisites and unsigned developer-only distribution; no public trust approval.',
    ecosystemAndIntegrationFit:'Observed pinned YAML/schema/native CLI libraries work. Future graphs/policy/provider/protocol integrations are not implemented and receive no reputation-based credit.',
    contributorAccessibility:'No dedicated human onboarding/editor/recruitment study was performed; missing evidence scores zero rather than an invented usability result.',
    maintainability:id==='typescript'?'Strict compiler/type/error contracts and 24 reproducible distribution/declaration files support the proposed same-language package interfaces; runtime validation remains mandatory. This is a limited code/compile judgment, not a language-popularity claim.':'Explicit native modules, annotations, exceptions and contract regressions work; current dict-based runtime interfaces need additional boundary checks. This is a source-bound maintenance judgment, not a claim about all Python projects.',
    performanceAndResourceUse:'Within each target compare cold CLI, native peak memory and all 1/10/100-pass library medians: 15 same-host workload pairs. Score 4 only for a majority of these fixed single-process pairs, otherwise 3; no score 5 or cross-OS numeric pooling. Every raw sample/dispersion is retained. Concurrency and future host/FFI/IPC workloads are not tested or scored as established capabilities.',
    observabilityAndDiagnostics:'Deterministic versioned public JSON, native detail separation and redaction are tested. Production tracing/crash/telemetry infrastructure is not implemented.',
    embeddingAndInteroperability:'Independent native experimental library API is exercised without another-language backend. Stable product ABI, foreign embedding and executable IPC remain unestablished.',
    operationalFootprint:'Nine within-target clean/cached-build/actual-CI-lane median pairs. Score 4 only for a majority, otherwise 3. Shared provisioning, uncontrolled OS cache, lane upload/handoff and archive/runtime footprint limits remain explicit.'
  };
  const rows=criteria.map(c=>({...c,score:scores[c.id],weighted:c.weight*scores[c.id]/5,rationale:rationale[c.id],evidence:c.id==='contributorAccessibility'?[]:[measurement+'/summary.json',root+'/boundaries.md','evaluation/qualification/supply-chain-repair/'+id+'.json','evaluation/security-qualification/README.md','evaluation/lifecycle/completion/README.md']}));
  return {candidate:id,eligibility:'qualified-for-amended-unsigned-validation-evaluation',notClaimed:['full product NF-CLI or NF-RUNTIME conformance','signed public distribution','stable product ABI','independent human review'],maintainer:'Alexander Agafonov',reviewMode:'single-maintainer',analysisPreparedUnderExplicitDelegation:true,personalIndependentScoresClaimed:false,criteria:rows,total:Number(rows.reduce((n,c)=>n+c.weighted,0).toFixed(8)),withinTargetPairWins:wins[id]};
});
const ranking=[...scorecards].sort((a,b)=>b.total-a.total||b.criteria.find(x=>x.id==='maintainability').score-a.criteria.find(x=>x.id==='maintainability').score),selection=ranking[0].candidate;
const paths=['evaluation/baseline.json','evaluation/library-cases.json','evaluation/environment-contract.json','evaluation/delivery/unsigned-policy.json','evaluation/delivery/candidate-disposition.json','evaluation/lifecycle/completion/archive-verification.json',measurement+'/summary.json',measurement+'/approved-captures.json','scripts/qualification/measurement-method.json','scripts/qualification/verify-measurements.mjs','docs/single-maintainer-governance.md','rfcs/RFC-0024-single-maintainer-governance.md','rfcs/reviews/2026-10-11-single-maintainer-ownership.md','evaluation/supply-chain/2026-10-15-repaired/completion.json','evaluation/supply-chain/2026-10-15-repaired/disposition.json','evaluation/supply-chain/2026-10-15-repaired/license-index.json','evaluation/repairs/supply-chain/toolchains.json'];
paths.push('scripts/qualification/windows-orchestration.json','scripts/qualification/linux-orchestration.json','evaluation/prototypes/typescript/src/library.ts','evaluation/prototypes/typescript/src/model.ts','evaluation/prototypes/typescript/tsconfig.json','evaluation/prototypes/python/nexflow_python_evaluation/library.py','evaluation/prototypes/python/nexflow_python_evaluation/model.py');
for(const folder of folders){paths.push(measurement+'/'+folder+'/cohort.json');for(const id of ids)paths.push(measurement+'/'+folder+'/'+id+'.json.gz');for(const id of['typescript','python','rust','go'])for(const area of['evaluation/lifecycle/completion','evaluation/security-qualification'])paths.push(area+'/'+folder+'/'+id+'.json');}for(const id of ids)paths.push('evaluation/qualification/supply-chain-repair/'+id+'.json');
const evidenceIndex=[...new Set(paths)].map(file=>{const p=checked('git',['rev-parse',inputRevision+':'+file]);return {path:file,sha256:fileSha(file),gitBlob:p,revision:inputRevision,url:'https://github.com/iwizy/NexFlow/blob/'+inputRevision+'/'+file};});
const proposal={task:'NF-102-06',recordedAt:new Date().toISOString(),outcome:'proposal-ready-for-immutable-review',architectureAccepted:false,inputRevision,specificationRevision:json('evaluation/baseline.json').specificationRevision,prototypeRevision:'23e576efd0dda0f00f5462eda9295c1ae4ec8fee',corpusSha256:json('evaluation/baseline.json').corpus.sha256,catalogSha256:fileSha('evaluation/library-cases.json'),measurementSummarySha256:fileSha(measurement+'/summary.json'),distributionMode:'unsigned-evaluation-developer-only',selection:{candidate:selection,layout:'B',status:'proposed',tieBreak:'If totals tie, use the already declared maintainability score; never compensate a failed hard gate.'},scorecards,unscored:[{candidate:'rust',reason:'actual failed Windows confinement gate'},{candidate:'go',reason:'actual failed Windows confinement gate'}],pairedComparison:{observations,wins,ties,performancePairs:15,operationalPairs:9,comparison:'Only paired medians inside each single target cohort. Wins aggregate equal-workload comparisons, not raw metrics from different OS/hardware. No intrinsic language ranking.'},models:modelChecks(),evidenceIndex,newSources:['evaluation/architecture/revised/contract-model.mjs','evaluation/architecture/revised/layouts.json','evaluation/architecture/revised/boundaries.md','scripts/qualification/prepare-architecture-review.mjs'].map(file=>({path:file,sha256:fileSha(file)})),humanIndependentReviewClaimed:false,productReleaseAuthorized:false,runtimeImplementationAuthorized:false,signingPerformed:false};
for(const file of [root+'/source-distribution.json',root+'/review-distribution.mjs',root+'/conformance-plan.md','scripts/runtime-revised-architecture-smoke.mjs'])proposal.newSources.push({path:file,sha256:fileSha(file)});
// Controlled public source URLs must retain their protocol and immutable commit.
// This proposal contains no raw candidate/native output or private local roots.
const publicProposal=JSON.stringify(proposal,null,2)+'\n';
assert.ok(!/(?:^|[\s"'=])(?:[A-Za-z]:[\\/]|\/(?:Users|private|home|opt|var|tmp)\/)/mu.test(publicProposal));
writeFileSync(root+'/proposal.json',publicProposal);mkdirSync('rfcs',{recursive:true});
const title=selection==='typescript'?'TypeScript':'Python',toolchain=selection==='typescript'?'Node 26.12.0 and TypeScript 6.0.3':'CPython 3.12.15 with the exact locked wheel graph';
const rfc=`# RFC-0025: ${title} Reference Architecture With Separate Static And Host Packages

## Status

Draft

- Task: NF-102-06
- Decision owner: Alexander Agafonov, adopted single-maintainer mode
- Scope: unsigned validation/development architecture and inert future host contracts
- Proposed language/layout: ${title}, layout B (same language, separate packages)
- Exact evidence input: \`${inputRevision}\`
- Product release, executable runtime, signing/notarization and stable public ABI: not authorized or claimed

## Problem And Proposed Decision

The project needs one evidence-grounded implementation direction after four
independent candidates. Current TypeScript/Python passed the approved native
validation, diagnostics, lifecycle and security scope on all three targets.
Current Rust/Go fail Windows confinement and remain rejected/unscored. The
proposal selects ${title} from the original-weight eligible scorecards in the
[source-bound proposal](../evaluation/architecture/revised/proposal.json), with
all raw timing/dispersion, limits and missing evidence retained. A weighted
score does not offset any applicable selected-candidate hard-gate failure.

| Candidate | Current disposition | Original-weight score / 100 |
| --- | --- | ---: |
${scorecards.map(card=>'| '+(card.candidate==='typescript'?'TypeScript':'Python')+' | Qualified for unsigned validation evaluation | '+card.total+' |').join('\n')}
| Rust | Rejected: actual Windows confinement failure | Unscored |
| Go | Rejected: actual Windows confinement failure | Unscored |

The original ten weights are unchanged. Missing contributor-onboarding evidence
scores zero. Scores describe these pinned prototypes and bounded review
judgments; they are not independent human assurance or an intrinsic language
ranking. All 84 original metric cells remain visible: 42 measured eligible cells
and 42 rejected/null cells. The original all-four-success objective stays false.

The exact evaluation toolchain is ${toolchain}. This is an evaluation pin,
not a product-version/support-policy change. Layout B separates spec, validation,
CLI, host contracts, future host, adapters and executable-extension domains.
The [three-layout comparison](../evaluation/architecture/revised/layouts.json)
retains A's smaller package count and C's independent-host option, together with
their startup/version/bridge costs. No future host/FFI performance is invented.

## Alternatives Considered

Layout A shares a language/package surface, reducing package-version combinations
but requiring a proven static-only CLI export closure. Layout B keeps the same
language with explicit separate validation/host compatibility and authority
boundaries; it is preferred without introducing a second-language bridge. Layout
C remains possible for a future independently qualified host, but currently adds
duplicate semantic/toolchain or IPC/FFI ownership without a measured host workload.
TypeScript/Python eligible scores use the original weights; current Rust/Go are
not scored because their Windows hard gates failed. Missing human onboarding
and future integration evidence receive no invented study or ecosystem credit.

## Components, Authority And Startup

\`\`\`mermaid
flowchart BT
  CLI[Static CLI] --> Validation[Validation kernel]
  Validation --> Spec[Frozen spec models]
  Contracts[Host contracts] --> Spec
  Host[Future host: design only] --> Validation
  Host --> Contracts
  Adapters[Future adapters: design only] --> Contracts
  Extensions[Inert declarations; executable loading unsupported] --> Contracts
\`\`\`

[Boundary contracts](../evaluation/architecture/revised/boundaries.md) specify
the workspace-read facade versus proposed filesystem-free kernel, inward imports,
version-pair rejection and startup without privileged constructors. They define
host-owned catalog stages/digests, one-provider grants, no hidden fallback,
per-operation opaque credentials, revocation and unsupported-protocol rejection.
The immutable intent/receipt/gap/reconciliation journal design uses trusted head
anchors, idempotency and no automatic effect replay after uncertain outcomes.
Event classification precedes queues/export; deletion cannot erase active gaps.
These are inert design/failure models, not an implemented durable store/runtime.

## Security And Safety Considerations

Native validation runs retain real filesystem/network/process/credential denial,
explicit inherited handles, redaction and resource-failure controls. Future host
permissions, approvals, autonomy, network/context/memory policy and human override
are admission inputs owned by the host; an adapter, protocol or audit store cannot
broaden them. Catalog and per-operation grant models fail closed on ambiguity,
revocation, unavailable implementations and implicit fallback. Public projection
precedes queues/export. The event journal models pre-effect store failures and
post-effect gaps with no blind retry; its in-memory array is not disk durability
or a production runtime certificate. Applicable residual risks and unperformed
public signing remain explicit below and in the complete review gate table.

## Targets, Packaging And Support

The evaluated targets are native Ubuntu 24.04 AMD64, macOS 15 ARM64 and Windows
Server 2025 AMD64. Exact image/OS/CPU/toolchain fingerprints and run/job/source
identities are in the approved captures and each source-bound cohort. One pair
shares each actual native host. Hosted labels do not reproduce historical images;
different OS/hardware values are not pooled into an intrinsic language ranking.

Genuine retained V1 and real V2 verified-installer capsules establish install,
offline validate/inspect, upgrade, tampered-update refusal, rollback and scoped
uninstall. Runtime prerequisites remain external and pinned. Checksums and Git
provenance are present; project signatures/notarization and trusted public
distribution are not performed. The maintainer explicitly requested continuing
without unavailable project signing identities. This proposal is developer-only;
the original signing criterion stays false, public distribution/release is NF-103.
No certificate is borrowed and no Gatekeeper/security preference is disabled.

The [archive-format inspection](../evaluation/architecture/revised/source-distribution.json)
also records an external-runtime source-package option. The TypeScript capsules
contain identical JavaScript/declaration output on all three OS targets, without
native project executable files or nested archives. This is a packaging fact,
not platform trust certification. A source package could use separately
provisioned Node without a project app/installer/SEA; any public distribution
still needs NF-103 publisher/provenance and upstream-runtime verification.
Python's native wheel closure remains explicit. Future standalone native
packaging reopens its applicable signing/notarization requirements.

## Fidelity, Compatibility And Migration

The frozen spec/corpus/catalog/oracle and candidate source/locks remain unchanged.
Experimental diagnostics use nf-validation-diagnostics-v1 (current JSON
0.4-draft); spec, package, diagnostic and future host ABI are separate domains.
Unknown version pairs reject before effects. There is no new product version.
Current prototypes expose validate/inspect and seven experimental library
operations; full project semantic/Core/extension conformance, graph/init, stable
product ABI and NF-RUNTIME are not established by these prototypes. Historical
JavaScript reference commands keep their existing tested budgets and identity.
No old JavaScript prototype is renamed into a language candidate.

Existing manifests require no migration. Actual evaluation-package rollback is
tested; future ABI/configuration/journal migration needs versioned readers,
dry validation, backup and reversible activation before deployment. Architecture
adoption cannot by itself expand an NF-SCHEMA/NF-SEMANTIC/NF-CLI/NF-RUNTIME claim.

The [conformance and compatibility plan](../evaluation/architecture/revised/conformance-plan.md)
maps each claim and fixture family, separately owned version domain and failure
rule, evidence publication, future graph/init porting and reversible migration.
It preserves the current root-bound read-only facade while identifying kernel
extraction and actual product conformance as future implementation work.

## Review, Ownership And Risks

Both review lenses must bind one immutable RFC/evidence set. The single
maintainer's explicit delegation authorizes technical preparation/decisions;
personal independent reviews, extra people or signatures are never invented.
The separate decision record must explain its actual authority and every one
of the eleven gates. This Draft under review is not automatic acceptance from CI,
scorecards, publication or merge. RFC-0023 and old review snapshots keep their
historical Draft bytes; only a forward decision can supersede current guidance.

Alexander retains the seven bounded NF-101 roles: pre-release best effort, no
invented SLA/backup/on-call/signing authority. Known limits include kernel and
privileged-parent threats, arbitrary brokers, sampled Unix memory enforcement,
Windows packet filtering semantics, runtime read exceptions, unsigned delivery,
limited cohort sampling, untested concurrency and absent human onboarding evidence. Dated dependency
scans retain their bounded applicability; zero matches are not certification.
The [measurement method](../scripts/qualification/measurement-method.json),
[Windows outer-window addendum](../scripts/qualification/windows-orchestration.json),
[Linux outer-window addendum](../scripts/qualification/linux-orchestration.json) and
retained failures disclose instrumentation repairs, CI lane interpretation,
every sample/error and excluded candidates. No unresolved applicable acceptance
blocker may be hidden as a non-blocking follow-up.

## Open Questions And Deferred Scope

The immutable review must classify every applicable gate and resolve any blocker
before acceptance. Public signing/notarization, trusted public delivery and the
NF-103 release decision are unperformed and outside developer-only distribution;
absence of certificates is never called a signature pass. Future kernel/package
refactoring, graph/init porting, durable storage, executable adapters/extensions,
production operation and broader conformance claims require their own bounded
implementation evidence before those capabilities are offered. None is implied
by accepting an implementation direction. No product version, release or runtime
implementation is authorized by this proposal.
`;
writeFileSync('rfcs/RFC-0025-reference-implementation-architecture.md',rfc);console.log(JSON.stringify({task:'NF-102-06',proposalCandidate:selection,layout:'B',scores:scorecards.map(x=>({candidate:x.candidate,total:x.total})),inertControls:proposal.models.controls,evidenceFiles:evidenceIndex.length,accepted:false}));
