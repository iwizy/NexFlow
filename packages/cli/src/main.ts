#!/usr/bin/env node
import { asciiJson, textOutput } from "./output.js";
import { evaluate } from "./runtime.js";

const { value, format } = await evaluate(process.argv.slice(2));
process.stdout.write(format === "json" ? asciiJson(value) + "\n" : textOutput(value));
process.exitCode = value.exitCode;
