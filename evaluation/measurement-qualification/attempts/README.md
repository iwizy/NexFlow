# Preserved Measurement Attempts

These records are failures/partial observations, not complete comparable metric
cells or successful candidate qualification. The original producer revisions,
full raw JSON bytes, exits, signals and every completed sample are retained.
Lossless gzip receipts verify that no observations were discarded.

- [Run 40236474958](https://github.com/iwizy/NexFlow/actions/runs/40236474958),
  producer `d4c219c212ee4bd90a5ea87f28558fc7588e037d`: Linux Python's first
  100-pass warmup+sample process received signal 24 (SIGXCPU) after 121,459.926ms.
  The measurement launcher mistakenly retained a 120 CPU-second process limit
  for two separately allowed 120-second batches. The remaining jobs were stopped
  after this confirmed instrumentation defect; all six partial records survive.
  Candidate code and per-batch limits were not blamed or weakened.
- [Run 40237965259](https://github.com/iwizy/NexFlow/actions/runs/40237965259),
  producer `c715f0452e499d6ceb7051502afc23d9595da11d`: the added early build
  preflight caught a staging defect before long timings. Its overly broad
  project-output filter also removed dependencies' own `dist` directories,
  causing actual TypeScript TS2307/TS7016 diagnostics. The correction excludes
  only the project's output directory, retaining all pinned dependency bytes.
  A real scoped copy/compiler check independently reproduces all 24 qualified
  TypeScript distribution-file hashes. No candidate dependency/source repair.

Only a later complete successful native run can populate current measurement
cells; partial timings here are never pooled with a different cohort or source.
