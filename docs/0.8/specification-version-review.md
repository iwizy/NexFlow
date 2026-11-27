# 0.8 Specification Version Review

Status: **preliminary NF-119 assessment, not the NF-121 release decision**.
Recorded on 2026-11-27 before freezing the interoperability corpus.

## Evidence And Compatibility

The assessed source is `a7dd64df680babaf9dcf26fcea181c41f30f8ea2`.
The prerequisite [v0.7.0 publication](https://github.com/iwizy/NexFlow/releases/tag/v0.7.0)
identifies `eb1a6cbe0c1a753c88b7d07119df74ced53ced56`; its downloaded
[receipt](https://github.com/iwizy/NexFlow/releases/download/v0.7.0/PUBLICATION.json)
was rechecked against SHA-256
`42b91f92aa59e4ca702b1230888cc1db6adb93ae6135492c891cb71de2edc8dd`.
All three native source verification results are passed. Current main/develop
also passed their nine post-merge workflows at the assessed source.

The [machine-readable assessment](../../fixtures/interoperability/v1/version-assessment.json)
records the exact before/after schema hashes and observations:

- There are 18 schema files for 17 manifest kinds plus common definitions.
- Compared with published 0.1 (`3f70eb22d9ddfcdeab766cdd52a59f047cb82751`),
  two schemas differ: common definitions add credentialHandlingPolicy,
  credentialKind and credentialPurpose; Project adds optional credentialHandling.
  No existing common definition changes and that field is not required.
- All **113** foundation example manifests validate against the current schemas.
  This is a bounded compatibility observation, not proof for all old inputs.
- A concrete counterexample is retained: the foundation open-object schema
  accepts an unspecified credentialHandling string; today's typed policy rejects
  it. This acceptance narrowing must not be hidden by the passing examples or
  described as universally backward compatible. The earlier schema did not
  define a credential authority contract for that unknown field.
- No schema, example, profile or extension file changed between v0.7.0 and the
  assessed source. All 156 inputs in the frozen 352-case library catalog retain
  their bytes. Six of its seven rule documents are unchanged; validation.md has
  later tooling guidance. Cases keep their original exact rule revision and
  fragment scope rather than pretending that all current prose is identical.
- The published CLI/library supports manifest 0.1 only. Changing to 0.2 or 0.8
  today would produce unsupported-version results, not newly working tooling.
  Extension profile, registry, claim and output versions are separate domains.

## Alternatives

| Choice | Evidence and cost | Treatment in NF-119 |
| --- | --- | --- |
| Retain manifest 0.1 / Draft | Evaluates the implemented language and existing published tooling without rewriting the corpus. Draft-era schema narrowing still needs explicit migration and support notes. | Selected **for comparison inputs only**. It is not automatic approval of the 0.8 release's specification version. |
| Introduce manifest 0.2 / Draft | Provides an explicit compatibility boundary if the review elects to separate accumulated draft-era changes, including the retained narrowing. Requires approved semantics, version dispatch, schemas, examples, validator/CLI support and migration qualification. | A substantive option for NF-121; no 0.2 schema or implementation is claimed here. |
| Align manifest with repository 0.8 | The repository milestone alone supplies no new language contract. Existing tooling would reject rewritten inputs. | No technical basis to select the number solely for visual alignment. |
| Remove Draft / declare stable | The independent comparison has not been performed; full semantics, broader conformance and current unsupported surfaces remain explicit. | Not supported by NF-119 evidence. Final status belongs to NF-121 and later stabilization review. |

## Corpus Boundary And Final Decision

The corpus therefore freezes the **actual 0.1 Draft snapshot**, not a fabricated
0.2/0.8 dialect. Its own corpus/result format is independently versioned.
Migration cases expose old accepted, preferred, conflicting and ambiguous forms;
unsupported semantic/runtime work cannot be normalized into success.

Before release, NF-121 must explicitly choose the manifest version and Draft
status using NF-120 results and the retained narrowing. Keeping 0.1 requires an
honest snapshot/compatibility explanation and migration guidance. Choosing 0.2
requires a separate approved implementation/migration scope and new qualified
inputs before claiming support; the frozen corpus and old reports stay intact.
This assessment neither executes NF-120 nor approves a release or architecture.
