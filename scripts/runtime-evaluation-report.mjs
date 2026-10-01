#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { assessReport } from "./lib/runtime-evaluation.mjs";

try {
  if (process.argv.length !== 3) throw new Error("usage");
  const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const result = assessReport(report);
  console.log(JSON.stringify(result, null, 2));
  if (result.outcome !== "candidate-evidence-complete") process.exitCode = 1;
} catch {
  console.error("Evaluation report unavailable or invalid. Supply one JSON report path.");
  process.exitCode = 1;
}
