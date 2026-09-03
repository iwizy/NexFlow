function sameScope(left, right) {
  if (left === null || right === null) return left === right;
  return left.kind === right.kind && left.id === right.id;
}

function relationFor(pointer) {
  const segments = pointer.split("/").filter(Boolean);
  const field = segments.toReversed().find((segment) => segment !== "id" && !/^[0-9]+$/u.test(segment))
    ?? "reference";
  return field.replace(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase();
}

function sourceFor(reference, resources) {
  return resources
    .filter((resource) => resource.file === reference.file
      && reference.path.startsWith(`${resource.path}/`))
    .sort((left, right) => right.path.length - left.path.length)[0];
}

function targetKinds(reference, resources) {
  if (reference.kind !== "participant") return [reference.kind];
  return resources.some((resource) => resource.kind === "actor") ? ["actor"] : ["agent"];
}

function resolutionFor(reference, resources, nodeIds) {
  if (reference.id === "<redacted-id>" || reference.scope?.id === "<redacted-id>") {
    return { status: "redacted", to: null, candidates: [] };
  }
  const kinds = targetKinds(reference, resources);
  const matches = resources.filter((resource) => kinds.includes(resource.kind)
    && resource.id === reference.id && sameScope(resource.scope, reference.scope));
  if (matches.length === 1) return { status: "resolved", to: nodeIds.get(matches[0]), candidates: [] };
  if (matches.length === 0) return { status: "unresolved", to: null, candidates: [] };
  return { status: "ambiguous", to: null, candidates: matches.map((resource) => nodeIds.get(resource)) };
}

// The input is the bounded, allowlisted output of inspectManifestAssembly.
export function graphManifestInspection(inspection) {
  if (inspection?.mode !== "declared-only" || inspection.referencesResolved !== false
    || !Array.isArray(inspection.resources) || !Array.isArray(inspection.references)) {
    throw new Error("A declared inspection is required");
  }
  const nodeIds = new Map(inspection.resources.map((resource, index) => [resource, `n${index}`]));
  const nodes = inspection.resources.map((resource) => ({
    id: nodeIds.get(resource), kind: resource.kind, identity: resource.id,
    scope: resource.scope, file: resource.file, path: resource.path
  }));
  const edges = inspection.references.map((reference, index) => {
    const source = sourceFor(reference, inspection.resources);
    if (!source) throw new Error("Reference source is outside the declared resource inventory");
    const resolution = resolutionFor(reference, inspection.resources, nodeIds);
    return {
      id: `e${index}`, from: nodeIds.get(source), to: resolution.to,
      candidates: resolution.candidates, relation: relationFor(reference.path),
      target: { kind: reference.kind, identity: reference.id, scope: reference.scope },
      status: resolution.status, file: reference.file, path: reference.path
    };
  });
  return {
    mode: "static-declared", referenceCoverage: inspection.referenceCoverage,
    nodeCount: nodes.length, edgeCount: edges.length, nodes, edges
  };
}
