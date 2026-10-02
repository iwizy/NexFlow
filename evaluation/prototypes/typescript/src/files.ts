import { constants, closeSync, fstatSync, lstatSync, openSync, readSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { TextDecoder } from "node:util";

export class InputFailure extends Error {
  constructor(readonly code: string) { super(code); }
}
export class LocalInputs {
  readonly root: string;
  constructor(root: string) {
    try {
      this.root = realpathSync(resolve(root));
      if (!lstatSync(this.root).isDirectory()) throw new Error();
    } catch { throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE"); }
  }
  private path(locator: string): string {
    if (!locator || locator.length > 512 || isAbsolute(locator) || /[:\\\u0000-\u001f]/u.test(locator) ||
      locator.split("/").some(part => !part || part === "." || part === "..")) {
      throw new InputFailure("NF-DISCOVERY-OUTSIDE-ROOT");
    }
    const full = resolve(this.root, locator);
    const inside = relative(this.root, full);
    if (!inside || inside.startsWith(".." + sep) || isAbsolute(inside)) throw new InputFailure("NF-DISCOVERY-OUTSIDE-ROOT");
    let current = this.root;
    for (const part of locator.split("/")) {
      current = join(current, part);
      if (lstatSync(current).isSymbolicLink()) throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
    }
    return full;
  }
  exists(locator: "project.yaml" | "project.yml"): boolean {
    try { lstatSync(join(this.root, locator)); return true; }
    catch (error) {
      if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return false;
      throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
    }
  }
  read(locator: string): string {
    let descriptor: number | undefined;
    try {
      const full = this.path(locator);
      if (!/\.ya?ml$/u.test(locator)) throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
      if (!lstatSync(full).isFile()) throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
      // Final symlinks are denied at open where supported. Parent-component races
      // require an independent OS effect-deny experiment; this is not a sandbox.
      descriptor = openSync(full, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
      const stat = fstatSync(descriptor);
      if (!stat.isFile()) throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
      if (stat.size > 1024 * 1024) throw new InputFailure("NF-DISCOVERY-LIMIT-EXCEEDED");
      const buffer = Buffer.alloc(1024 * 1024 + 1);
      let length = 0;
      while (length < buffer.length) {
        const count = readSync(descriptor, buffer, length, buffer.length - length, null);
        if (!count) break;
        length += count;
      }
      if (length > 1024 * 1024) throw new InputFailure("NF-DISCOVERY-LIMIT-EXCEEDED");
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, length));
    } catch (error) {
      if (error instanceof InputFailure) throw error;
      throw new InputFailure("NF-DISCOVERY-UNSAFE-SOURCE");
    } finally { if (descriptor !== undefined) closeSync(descriptor); }
  }
}
