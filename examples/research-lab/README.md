# Research Lab Example

A research-oriented workflow for literature review, experiment planning, result recording, reproducibility review, and research summary preparation.

This example emphasizes citation discipline, experiment provenance, reproducibility artifacts, memory limits, and human review before publication claims.

## What This Example Teaches

Use this example when AI helpers support research work but should not turn tentative findings into claims without human review.

It demonstrates:

- a human principal investigator as final authority for research scope and publication claims
- literature review artifacts with citation expectations
- experiment plans that separate hypotheses, datasets, metrics, and commands
- experiment logs and result reports that remain evidence, not conclusions
- reproducibility review before research summaries are approved
- memory limits for unpublished findings, sensitive data, and private review notes

This is still specification-only. It does not search papers, run experiments, process datasets, publish papers, or store research memory.

## Research Workflow

| Stage | Task | Owner | Evidence | Gate |
| --- | --- | --- | --- | --- |
| Literature | `review-literature` | `literature-agent` | `literature_review`, `citation_map`, `open_questions` | `research_scope_review` |
| Experiment Design | `design-experiment` | `principal-investigator` | `experiment_plan`, `dataset_manifest`, `evaluation_protocol` | `experiment_approval` |
| Experiment Run | `run-experiment` | `experiment-agent` | `experiment_log`, `results_report`, `artifact_manifest` | `experiment_approval` |
| Reproducibility | `review-reproducibility` | `reproducibility-reviewer` | `reproducibility_report`, `limitations_note` | `reproducibility_review` |
| Research Summary | `prepare-research-summary` | `research-writer` | `research_summary`, `citation_packet`, `publication_claims` | `publication_review` |

The workflow describes expected evidence and review order. It does not imply that NexFlow includes an experiment runner or paper-writing system.

## Citation And Evidence Pattern

The example treats citation and provenance as first-class artifacts:

- `literature_review` summarizes relevant work and unresolved questions
- `citation_map` links claims to sources
- `experiment_plan` records hypothesis, metrics, datasets, and expected commands
- `experiment_log` records what actually ran
- `results_report` records observed outputs and anomalies
- `reproducibility_report` records whether another actor can inspect or reproduce the result
- `publication_claims` records which claims are approved, limited, deferred, or rejected

Research summaries should cite evidence and limitations. They should not present generated interpretations as validated findings.

## Memory Limit Pattern

Research memory is deliberately conservative:

- ephemeral memory supports active reading and experiment work
- task memory can retain working summaries with source citations
- project memory requires principal investigator approval
- team memory requires reproducibility review and excludes private review notes
- organization memory is not enabled in this example

Sensitive experimental data, raw participant data, credentials, unpublished security details, and private reviewer notes must not be retained in broader memory scopes.

## Handoff Pattern

| Handoff | Purpose |
| --- | --- |
| `literature-to-design` | Moves cited literature, open questions, and research gaps into experiment design. |
| `design-to-experiment` | Moves approved protocol, dataset manifest, and evaluation criteria into experiment execution. |
| `experiment-to-reproducibility` | Moves logs, results, artifacts, and anomalies into reproducibility review. |
| `reproducibility-to-writing` | Moves reproducibility status, limitations, citations, and accepted claims into research summary drafting. |

Each handoff should identify missing citations, missing artifacts, unresolved anomalies, and claim boundaries.

## Safety Notes

- Network and paper access are declared context sources; they do not imply hidden browsing.
- Experiment execution is approval-gated and must record commands and artifacts.
- Research summaries remain draft until publication review.
- Private reviewer notes and sensitive data should not be embedded in public manifests.
- Publication claims must be reviewed by a human principal investigator.

## Local Check

The example should parse as YAML:

```sh
ruby -ryaml -e 'Dir["examples/research-lab/*.yaml"].sort.each { |p| YAML.load_file(p); puts "ok #{p}" }'
```

For broader example review, use the [Example Consistency Checklist](../CHECKLIST.md).
