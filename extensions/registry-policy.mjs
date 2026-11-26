import { isDeepStrictEqual } from "node:util";

// Offline metadata consistency checks. Call only after schema validation.
// A coherent snapshot does not establish ownership, support or authority.
const lifecycleTransitions = {
  experimental: ["stable", "deprecated"],
  stable: ["deprecated"],
  deprecated: ["removed"],
  removed: [],
};
const publicationTransitions = {
  draft: ["published", "withdrawn", "revoked"],
  published: ["deprecated", "withdrawn", "revoked"],
  deprecated: ["withdrawn", "revoked"],
  withdrawn: ["revoked"],
  revoked: [],
};
const profileStatus = {
  experimental: "draft",
  stable: "stable",
  deprecated: "deprecated",
  removed: "removed",
};

const currentFormat = "0.2-draft";
const withdrawn = entry => ["withdrawn", "revoked"].includes(entry.publication.status);
const reserved = namespace => namespace === "io.nexflow" || namespace.startsWith("io.nexflow.");
const canTransition = (table, before, after) => before === after || table[before].includes(after);

function entryKey(entry, current) {
  return current ? `${entry.namespace}:${entry.profile.version}` : entry.namespace;
}

function checkEntry(entry, scope, generatedAt, errors) {
  const { namespace, owner, profile, compatibility, publication, deprecation, withdrawal } = entry;
  const key = entryKey(entry, true);
  const fail = reason => errors.push(key + ": " + reason);
  if (scope === "public" && namespace.startsWith("local.")) fail("local namespace in public snapshot");
  if (profile.status !== profileStatus[entry.lifecycle]) fail("profile status disagrees with lifecycle");
  if (compatibility.profileVersions[0] !== profile.version) fail("compatibility omits exact profile version");
  if (["published", "deprecated"].includes(publication.status) &&
      !["registry_verified", "disputed"].includes(owner.verification.status)) {
    fail("published record needs a verified owner decision or a recorded dispute");
  }
  for (const [label, date] of Object.entries({
    publishedAt: publication.publishedAt, updatedAt: publication.updatedAt,
    deprecatedAt: deprecation?.effectiveAt, withdrawnAt: withdrawal?.effectiveAt,
  })) {
    if (date !== undefined && !(Date.parse(date) <= generatedAt)) fail(label + " follows snapshot time or cannot be read");
  }
  if (deprecation?.supportEndsAt != null &&
      !(Date.parse(deprecation.supportEndsAt) >= Date.parse(deprecation.effectiveAt))) {
    fail("support end precedes deprecation or cannot be read");
  }
  if (entry.lifecycle === "removed" && publication.status !== "revoked" &&
      (deprecation?.supportEndsAt == null || Date.parse(deprecation.supportEndsAt) > generatedAt)) {
    fail("removal requires the announced support window to end");
  }
  const replacement = deprecation?.replacement;
  if (replacement && replacement.namespace === namespace && replacement.version === profile.version) {
    fail("replacement points to the same profile");
  }
}

function checkHistory(previous, snapshot, errors) {
  const before = previous.metadata;
  const after = snapshot.metadata;
  if (previous.registryFormatVersion !== currentFormat ||
      before.registryId !== after.registryId || before.scope !== after.scope ||
      before.source.repository !== after.source.repository) {
    errors.push("history belongs to a different registry or format");
    return;
  }
  if (!(Date.parse(before.generatedAt) <= Date.parse(after.generatedAt))) errors.push("snapshot time moved backwards");
  if (before.source.revision === after.source.revision && !isDeepStrictEqual(previous, snapshot)) {
    errors.push("snapshot changed at the same revision");
  }

  const currentEntries = new Map(snapshot.entries.map(entry => [entryKey(entry, true), entry]));
  const previousKeys = new Set(previous.entries.map(entry => entryKey(entry, true)));
  for (const [key, entry] of currentEntries) {
    if (!previousKeys.has(key) && entry.publication.status !== "draft" && !withdrawn(entry)) {
      errors.push(key + ": new profile record skipped draft");
    }
  }
  for (const prior of previous.entries) {
    const key = entryKey(prior, true);
    const entry = currentEntries.get(key);
    const fail = reason => errors.push(key + ": " + reason);
    if (!entry) {
      fail("prior profile record missing");
      continue;
    }
    if (!isDeepStrictEqual(prior.profile.source, entry.profile.source) ||
        !isDeepStrictEqual(prior.compatibility, entry.compatibility) ||
        !isDeepStrictEqual(prior.requirements, entry.requirements)) {
      fail("profile version reused with different pinned content or compatibility requirements");
    }
    if (!canTransition(lifecycleTransitions, prior.lifecycle, entry.lifecycle)) fail("invalid lifecycle transition");
    if (!canTransition(publicationTransitions, prior.publication.status, entry.publication.status)) {
      fail("invalid publication transition");
    }
    if (prior.publication.publishedAt && entry.publication.publishedAt !== prior.publication.publishedAt) {
      fail("original publication time changed");
    }
    if (prior.deprecation) {
      const previousNotice = prior.deprecation;
      const nextNotice = entry.deprecation;
      // The first committed cutoff fills null; once set it remains bound to this record.
      const expected = previousNotice.supportEndsAt === null && nextNotice
        ? { ...previousNotice, supportEndsAt: nextNotice.supportEndsAt } : previousNotice;
      if (!isDeepStrictEqual(expected, nextNotice)) fail("deprecation record changed");
    }
    if (prior.withdrawal && (prior.publication.status === entry.publication.status ?
        !isDeepStrictEqual(prior.withdrawal, entry.withdrawal) :
        !(Date.parse(prior.withdrawal.effectiveAt) <= Date.parse(entry.withdrawal?.effectiveAt)))) {
      fail("withdrawal record changed or moved backwards");
    }
    const oldVerification = prior.owner.verification;
    const newVerification = entry.owner.verification;
    if (prior.publication.status === "draft" && entry.publication.status === "published" &&
        newVerification.status !== "registry_verified") fail("cannot publish without a verified owner decision");
    if (oldVerification.status === "disputed" && newVerification.status === "registry_verified" &&
        oldVerification.evidence === newVerification.evidence) fail("dispute resolution needs distinct evidence");
    if (prior.owner.identifier !== entry.owner.identifier &&
        !(oldVerification.status === "disputed" && newVerification.status === "registry_verified" &&
          oldVerification.evidence !== newVerification.evidence)) {
      fail("owner changed without a recorded dispute and decision");
    }
  }
}

export function registryPolicyErrors(snapshot, previous) {
  const errors = [];
  const current = snapshot.registryFormatVersion === currentFormat;
  const generatedAt = Date.parse(snapshot.metadata.generatedAt);
  const keys = new Set();
  const namespaceClaims = new Map();
  let priorEntry;
  for (const entry of snapshot.entries) {
    const key = entryKey(entry, current);
    if (keys.has(key)) errors.push("duplicate " + (current ? "namespace/profile version" : "namespace"));
    keys.add(key);
    const unordered = priorEntry && (current ? entry.namespace < priorEntry.namespace ||
      (entry.namespace === priorEntry.namespace && entry.profile.version < priorEntry.profile.version) :
      entry.namespace.localeCompare(priorEntry.namespace) < 0);
    if (unordered) {
      errors.push(current ? "entries are not ordered by namespace and profile version" : "entries are not ordered lexically by namespace");
    }
    priorEntry = entry;
    if ((current ? reserved(entry.namespace) : entry.namespace.startsWith("io.nexflow.")) &&
        entry.owner.type !== "project") {
      errors.push(entry.namespace + " does not identify project ownership");
    }
    if (!current) continue;
    checkEntry(entry, snapshot.metadata.scope, generatedAt, errors);

    if (!withdrawn(entry)) {
      const claim = [entry.owner.identifier, entry.owner.type, entry.owner.verification.status];
      const known = namespaceClaims.get(entry.namespace);
      if (known && !isDeepStrictEqual(known, claim)) errors.push(entry.namespace + " has conflicting owner decisions");
      namespaceClaims.set(entry.namespace, claim);
    }
  }
  if (previous && current) checkHistory(previous, snapshot, errors);
  if (previous?.registryFormatVersion === currentFormat && !current) errors.push("registry format moved backwards");
  return errors;
}
