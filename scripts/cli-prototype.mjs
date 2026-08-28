#!/usr/bin/env node

import { runCliPrototype } from "./lib/cli-prototype.mjs";

process.exitCode = await runCliPrototype(process.argv.slice(2));
