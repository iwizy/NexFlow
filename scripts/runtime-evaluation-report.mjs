#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { assessReport } from "./lib/runtime-evaluation.mjs";

try {
  if (process.argv.length !== 3 && !(process.argv.length === 5
    && process.argv[3] === "--review-context")) throw new Error("usage");
  const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const context = process.argv.length === 5
    ? JSON.parse(readFileSync(process.argv[4], "utf8")) : null;
  if (process.argv.length === 5 && (!context || typeof context !== "object" || Array.isArray(context))) throw new Error("context");
  const result = assessReport(report, undefined, context);
  console.log(JSON.stringify(result, null, 2));
  if (result.outcome !== "candidate-evidence-complete") process.exitCode = 1;
} catch {
  console.error("Evaluation report unavailable or invalid. Supply one JSON report path and optionally --review-context JSON-path.");
  process.exitCode = 1;
}
