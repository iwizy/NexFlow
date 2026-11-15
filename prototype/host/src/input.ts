import { createHash } from "node:crypto";
import { types } from "node:util";
import { createValidator, parseSource, projectSources, type Json, type Manifest } from "@nexflow/validation";
import { parseDocument, visit } from "yaml";
import { fixtureEffects, fixtureOperation, type AttemptScope, type Reason } from "../../host-contracts/src/index.js";

const sources = [
  ["actors.yaml", "ActorSet"],
  ["capabilities.yaml", "CapabilitySet"],
  ["permissions.yaml", "PermissionSet"],
  ["project.yaml", "Project"],
] as const;
const sourceNames = sources.map(([name]) => name);
const maxSourceBytes = 1024 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true });
const byteArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(byteArrayPrototype, "byteLength")!.get!;
const byteBuffer = Object.getOwnPropertyDescriptor(byteArrayPrototype, "buffer")!.get!;

type InputFailure = { state: "invalid" | "unsupported"; reason: Reason };

export function dataRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || types.isProxy(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length) return null;

  const result: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return null;
    result[key] = descriptor.value;
  }
  return result;
}

export function matches(value: unknown, expected: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(expected);
  const record = dataRecord(value, keys);
  return record !== null && keys.every(key => record[key] === expected[key]);
}

function copyBytes(value: unknown): Uint8Array | null {
  if (!types.isUint8Array(value) || types.isSharedArrayBuffer(byteBuffer.call(value))) return null;
  const length = byteLength.call(value) as number;
  if (length === 0 || length > maxSourceBytes) return null;
  const copy = new Uint8Array(length);
  copy.set(value);
  return copy;
}

const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const invalidInput: InputFailure = { state: "invalid", reason: "input-invalid" };

export function readInput(request: unknown): InputFailure | { scope: AttemptScope; files: ReadonlyMap<string, Uint8Array> } {
  const input = dataRecord(request, ["attemptId", "operation", "manifests", "effects"]);
  if (!input || typeof input.attemptId !== "string" || !/^fixture-attempt-[0-9]{1,6}$/u.test(input.attemptId)) {
    return invalidInput;
  }
  if (!matches(input.operation, fixtureOperation)) return { state: "unsupported", reason: "operation-unsupported" };
  if (!matches(input.effects, fixtureEffects)) return { state: "unsupported", reason: "effects-unsupported" };
  const manifests = input.manifests;
  if (types.isProxy(manifests) || !Array.isArray(manifests) || manifests.length !== sources.length) {
    return invalidInput;
  }
  if (Reflect.ownKeys(manifests).length !== sources.length + 1) return invalidInput;

  const files = new Map<string, Uint8Array>();
  for (let index = 0; index < sources.length; index++) {
    const item = Object.getOwnPropertyDescriptor(manifests, String(index));
    const file = dataRecord(item?.value, ["name", "bytes"]);
    if (!file || typeof file.name !== "string" || !sourceNames.some(name => name === file.name) || files.has(file.name)) {
      return invalidInput;
    }
    const bytes = copyBytes(file.bytes);
    if (!bytes) return invalidInput;
    files.set(file.name, bytes);
  }
  const assembly = sha256(JSON.stringify(sourceNames.map(name => [name, sha256(files.get(name)!)])));
  return { scope: { attemptId: input.attemptId, operation: fixtureOperation, assembly }, files };
}

export function validateAssembly(files: ReadonlyMap<string, Uint8Array>, validator: ReturnType<typeof createValidator>):
  InputFailure | { documents: Manifest[] } {
  const documents = [];
  for (const [name, kind] of sources) {
    let text: string;
    try {
      text = utf8.decode(files.get(name)!);
      // The preview parser bounds alias expansion. This fixture profile forbids aliases.
      const syntax = parseDocument(text, { logLevel: "silent" });
      let hasAlias = false;
      visit(syntax, { Alias() { hasAlias = true; return visit.BREAK; } });
      if (syntax.errors.length || hasAlias) return { state: "invalid", reason: "manifest-invalid" };
    } catch {
      return { state: "invalid", reason: "manifest-invalid" };
    }
    const parsed = parseSource(name, text, kind);
    if (!parsed.document) {
      if (parsed.diagnostics.some(diagnostic => diagnostic.code === "NF-DISCOVERY-UNSUPPORTED-VERSION")) {
        return { state: "unsupported", reason: "version-unsupported" };
      }
      return { state: "invalid", reason: "manifest-invalid" };
    }
    documents.push(parsed.document);
  }
  if (!validator.validateDocuments(documents).valid) return { state: "invalid", reason: "manifest-invalid" };

  const hints = projectSources(documents[3]!);
  if (hints.diagnostics.length || hints.sources.length !== 3 ||
      !hints.sources.every((source, index) => source.file === sources[index]![0] && source.kind === sources[index]![1])) {
    return { state: "invalid", reason: "manifest-invalid" };
  }
  return { documents };
}

export type Fields = Record<string, Json>;
export const fields = (value: Json | undefined): Fields =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
export const list = (value: Json | undefined): Json[] => Array.isArray(value) ? value : [];
