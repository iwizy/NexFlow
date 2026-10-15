#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
const base = "evaluation/prototypes/go/";
const approved = JSON.parse(readFileSync("evaluation/repairs/supply-chain/toolchains.json"));
for (const file of ["go.mod","go.sum"]) assert.equal(createHash("sha256").update(readFileSync(base+file)).digest("hex"),approved.locks[base+file]);
