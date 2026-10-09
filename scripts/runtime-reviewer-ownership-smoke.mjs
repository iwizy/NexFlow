import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { digest } from "./lib/runtime-evaluation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
export const snapshot = "3d318fb8257be748cceebc6d3251455364acf738";
export const recordPath = "rfcs/reviews/2026-10-09-runtime-reviewer-ownership.json";
const notePath = "rfcs/reviews/2026-10-09-runtime-reviewer-ownership.md";
const read = file => readFileSync(path.join(root, file));

// This checks an immutable pending snapshot, not future appointment evidence.
// Later real appointments require a new dated, independently verified record.
export function expectedPendingRecord() {
  const evidence = file => {
    const archived = execFileSync("git", ["show", `${snapshot}:${file}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
    assert.deepEqual(read(file), archived, `pinned review input changed: ${file}`);
    return { path: file, revision: snapshot, sha256: digest(archived), url: `https://github.com/iwizy/NexFlow/blob/${snapshot}/${file}` };
  };
  const rfc = evidence("rfcs/RFC-0023-runtime-architecture-decision.md");
  const bundle = evidence("rfcs/reviews/runtime-architecture-decision-draft.json");
  const framework = evidence("rfcs/reviews/runtime-architecture-decision-review.md");
  const forms = ["reviewer-a", "reviewer-b", "reconciliation"].map(id => evidence(`evaluation/reports/review/${id}.json`));
  const reports = ["typescript", "python", "rust", "go"].map(candidate => ({
    candidate, report: evidence(`evaluation/reports/${candidate}/candidate.json`),
    companion: evidence(`evaluation/reports/${candidate}/bundle.json`)
  }));
  const owner = (id, responsibility, proposedPerson) => ({
    id, responsibility, proposedPerson, status: "pending", confirmedPerson: null,
    acknowledgement: null, backup: null, supportWindow: null, incidentAuthority: null,
    dependencyUpdatePolicy: null, acceptedObligations: null
  });
  const reviewer = (slot, scope) => ({
    slot, scope, status: "pending", confirmedPerson: null, consent: null,
    publicationConsent: null, independenceConfirmed: false, authorshipConflictCheck: null,
    conflictsOfInterest: null, completedReview: null, signature: null
  });
  return {
    formatVersion: "0.1-draft", task: "NF-101", recordedOn: "2026-10-09",
    status: "pending-human-confirmation", taskCompleted: false, outcome: "not-ready",
    sourceSnapshot: snapshot,
    confirmationBasis: {
      directHumanResponse: "request-for-proposal-only",
      reviewerAppointments: [], ownerAcknowledgements: [], publicationConsents: [],
      missingConfirmationIsNotConsent: true
    },
    reviewInputs: { rfc, bundle, framework, reports, blankForms: forms },
    reviewers: [
      reviewer("reviewer-a", ["architecture", "CLI", "validation", "compatibility"]),
      reviewer("reviewer-b", ["security", "supply-chain", "isolation", "distribution"])
    ],
    owners: [
      owner("cli", "Validation-only CLI maintenance and compatibility", "Alexander Agafonov"),
      owner("validation", "Pure validation libraries, fixtures and diagnostics", "Alexander Agafonov"),
      owner("runtime", "Future runtime host and effect boundaries; no runtime support promise", null),
      owner("security", "Security boundaries, triage and incident coordination", null),
      owner("dependencies", "Dependency review and update policy, separate from security acceptance", "Alexander Agafonov"),
      owner("release-ci", "CI, artifact provenance and release coordination", "Alexander Agafonov"),
      owner("signing-distribution", "Permitted signing identities, target delivery and support", null)
    ],
    reviewProtocol: {
      independentFromEvaluatedAuthors: true, distinctPeopleRequired: true,
      separateEvidenceLinkedScoresBeforeReconciliation: true, samePinnedReportSet: true,
      scores: null, reconciliation: null, completedReviews: [],
      ineligibleCandidatesMustNotBeScored: true
    },
    organizationalGates: [
      { number: 2, status: "blocked", blocker: "Two real independent reviewers, consent and separate completed reviews are absent." },
      { number: 9, status: "blocked", blocker: "Operational, release/CI, distribution/signing and support obligations are not acknowledged." },
      { number: 11, status: "blocked", blocker: "Named maintainers have not accepted applicable ownership and maintenance obligations." }
    ],
    requiredHumanResponse: [
      "Two distinct reviewer identities, role acceptance, independence/conflict declarations and consent to publish agreed identifiers.",
      "Owner acknowledgement for each applicable CLI/validation/runtime/security/dependency/release-CI/signing-distribution responsibility.",
      "Backups, support windows, incident authority and dependency update policy accepted by the responsible people.",
      "Permitted signing identity/authority and exact supported target/provisioning obligations; no borrowed credentials.",
      "Explicitly resolve any proposed not-applicable/deferred scope through governance; do not silently waive a mandatory owner or gate."
    ],
    authorization: {
      conditionalMergePrerequisiteSatisfied: false, mergePerformed: false,
      architectureAccepted: false, runtimeImplementationAuthorized: false,
      releaseAuthorized: false, signingAuthorized: false
    },
    retainedEvidence: {
      decisionStatus: "Draft", blockedMandatoryGates: 11,
      candidateEligibility: "all-four-ineligible", missingComparableMetricCells: 84,
      candidateCodeAndLocksChanged: false, newCandidateRuns: 0
    },
    limitations: [
      "NF-101 remains incomplete. Publishing this pending record does not appoint anyone or accept support obligations.",
      "Prepared profiles, two checks by one author, empty forms, commits, green CI and merge are not independent human review.",
      "NF-102 actual technical review and NF-103 readiness remain separate; all technical failures and not-tested evidence remain blockers.",
      "No external contact, signing/keychain action, credential provisioning, paid infrastructure, candidate repair, release or version change."
    ]
  };
}

export function assertPendingRecord(actual, expected) {
  assert.deepEqual(actual, expected, "dated pending record changed or unsupported confirmation/promotion added");
}

export function verifyPendingRecord() {
  const expected = expectedPendingRecord(), bytes = read(recordPath).toString();
  const actual = JSON.parse(bytes);
  assert.equal(bytes, `${JSON.stringify(actual, null, 2)}\n`, "noncanonical pending record");
  assertPendingRecord(actual, expected);
  const note = read(notePath).toString();
  for (const text of ["NF-101 remains incomplete", "pending-human-confirmation", "not-ready", "request for proposals is not consent", "two distinct independent people", "separate scores before reconciliation", "not permission to merge", snapshot]) assert.ok(note.includes(text), text);
  return actual;
}

if (process.argv.includes("--print-record")) {
  process.stdout.write(`${JSON.stringify(expectedPendingRecord(), null, 2)}\n`);
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const actual = verifyPendingRecord(), expected = expectedPendingRecord();
  const mutations = [
    value => { value.taskCompleted = true; },
    value => { value.outcome = "accepted"; },
    value => { value.confirmationBasis.directHumanResponse = "appointment"; },
    value => { value.reviewers[0].confirmedPerson = "Invented reviewer"; },
    value => { value.reviewers[1].consent = "assumed"; },
    value => { value.reviewers[0].independenceConfirmed = true; },
    value => { value.reviewers[0].signature = "fabricated"; },
    value => { value.owners[0].confirmedPerson = "Alexander Agafonov"; },
    value => { value.owners[0].acceptedObligations = "assumed"; },
    value => { value.owners[2].status = "not-applicable"; },
    value => { value.reviewProtocol.scores = [5]; },
    value => { value.organizationalGates[0].status = "passed"; },
    value => { value.authorization.conditionalMergePrerequisiteSatisfied = true; },
    value => { value.authorization.architectureAccepted = true; },
    value => { value.authorization.signingAuthorized = true; },
    value => { value.reviewInputs.rfc.revision = "0".repeat(40); }
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(actual); mutate(changed);
    assert.throws(() => assertPendingRecord(changed, expected));
  }
  console.log(`NF-101 pending snapshot: 2 unconfirmed reviewers, 7 unconfirmed ownership roles, 14 immutable inputs and ${mutations.length} rejection controls passed; task incomplete, no merge/acceptance authority.`);
}
