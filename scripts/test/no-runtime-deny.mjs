import childProcess from "node:child_process";
import cluster from "node:cluster";
import dgram from "node:dgram";
import dns from "node:dns";
import fs, { constants } from "node:fs";
import fsPromises from "node:fs/promises";
import http from "node:http";
import http2 from "node:http2";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";
import workerThreads from "node:worker_threads";

const marker = "NEXFLOW-TEST-FORBIDDEN-RUNTIME-EFFECT";
const denied = (effect = "unknown") => {
  process.stderr.write(`${marker}:${effect}\n`);
  throw new Error(`${marker}:${effect}`);
};
const writeMask = constants.O_WRONLY | constants.O_RDWR | constants.O_APPEND
  | constants.O_CREAT | constants.O_TRUNC;
const writeRoot = process.env.NEXFLOW_TEST_WRITE_ROOT
  ? fs.realpathSync(path.resolve(process.env.NEXFLOW_TEST_WRITE_ROOT)) : null;
const starterFiles = new Set(["project.yaml", "actors.yaml", "agents.yaml"]);

function hasWriteFlag(flags) {
  if (typeof flags === "number") return (flags & writeMask) !== 0;
  return typeof flags === "string" && !["r", "rs", "sr"].includes(flags);
}

function isStarterTarget(value) {
  if (writeRoot === null || typeof value !== "string") return false;
  const resolved = path.resolve(value);
  return path.dirname(resolved) === writeRoot && starterFiles.has(path.basename(resolved));
}

function replaceFunctions(target, names) {
  for (const name of names) {
    if (typeof target[name] !== "function") continue;
    Object.defineProperty(target, name, {
      configurable: true,
      enumerable: true,
      value: () => denied(name),
      writable: true
    });
  }
}

replaceFunctions(childProcess, ["exec", "execFile", "execFileSync", "execSync", "fork", "spawn", "spawnSync"]);
replaceFunctions(cluster, ["fork", "setupMaster", "setupPrimary"]);
replaceFunctions(dgram, ["createSocket"]);
replaceFunctions(dns, [
  "lookup", "lookupService", "resolve", "resolve4", "resolve6", "resolveAny",
  "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs",
  "resolvePtr", "resolveSoa", "resolveSrv", "resolveTxt", "reverse"
]);
replaceFunctions(dns.promises, [
  "lookup", "lookupService", "resolve", "resolve4", "resolve6", "resolveAny",
  "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs",
  "resolvePtr", "resolveSoa", "resolveSrv", "resolveTxt", "reverse"
]);
const open = fs.open.bind(fs);
fs.open = (file, flags, ...rest) => hasWriteFlag(flags) && !isStarterTarget(file)
  ? denied("fs.open") : open(file, flags, ...rest);
const openSync = fs.openSync.bind(fs);
fs.openSync = (file, flags, ...rest) => hasWriteFlag(flags) && !isStarterTarget(file)
  ? denied("fs.openSync") : openSync(file, flags, ...rest);
replaceFunctions(fs, [
  "appendFile", "appendFileSync", "chmod", "chmodSync", "chown", "chownSync",
  "copyFile", "copyFileSync", "cp", "cpSync", "createWriteStream", "link",
  "linkSync", "mkdir", "mkdirSync", "mkdtemp", "mkdtempSync", "rename",
  "renameSync", "rm", "rmSync", "rmdir", "rmdirSync", "symlink",
  "symlinkSync", "truncate", "truncateSync", "unlinkSync", "utimes",
  "utimesSync", "writeFile", "writeFileSync"
]);
const promiseOpen = fsPromises.open.bind(fsPromises);
fsPromises.open = (file, flags, ...rest) => hasWriteFlag(flags) && !isStarterTarget(file)
  ? denied("fsPromises.open") : promiseOpen(file, flags, ...rest);
const promiseUnlink = fsPromises.unlink.bind(fsPromises);
fsPromises.unlink = (file, ...rest) => isStarterTarget(file) ? promiseUnlink(file, ...rest) : denied("fsPromises.unlink");
replaceFunctions(fsPromises, [
  "appendFile", "chmod", "chown", "copyFile", "cp", "link", "mkdir",
  "mkdtemp", "rename", "rm", "rmdir", "symlink", "truncate", "utimes",
  "writeFile"
]);
replaceFunctions(http, ["createServer", "get", "request"]);
replaceFunctions(http2, ["connect", "createSecureServer", "createServer"]);
replaceFunctions(https, ["createServer", "get", "request"]);
replaceFunctions(net, ["connect", "createConnection", "createServer"]);
replaceFunctions(tls, ["connect", "createServer"]);
replaceFunctions(workerThreads, ["Worker"]);

syncBuiltinESMExports();

globalThis.fetch = () => denied("fetch");
globalThis.WebSocket = class DeniedWebSocket {
  constructor() {
    denied("WebSocket");
  }
};
