#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import Ajv2020 from "ajv/dist/2020.js";
import { parseDocument } from "yaml";

async function readYaml(path) {
  const document = parseDocument(await readFile(path, "utf8"), {
    maxAliasCount: 100,
    uniqueKeys: true
  });

  if (document.errors.length > 0) {
    throw new Error(
      `${path}: ${document.errors.map((error) => error.message).join("; ")}`
    );
  }

  return document.toJS({ maxAliasCount: 100 });
}

const profileSchema = JSON.parse(
  await readFile("extensions/mcp/profile.schema.json", "utf8")
);
const profile = await readYaml("extensions/mcp/profile.yaml");
const commonSchema = JSON.parse(await readFile("schemas/common.schema.json", "utf8"));
const contextSchema = JSON.parse(await readFile("schemas/context.schema.json", "utf8"));

const profileAjv = new Ajv2020({ allErrors: true, strict: false });
const validateProfile = profileAjv.compile(profileSchema);

if (!validateProfile(profile)) {
  console.error("MCP extension profile failed schema validation.");
  console.error(JSON.stringify(validateProfile.errors, null, 2));
  process.exit(1);
}

const expectedSurfaces = ["actions", "context", "prompts", "resources", "tools"];
const actualSurfaces = profile.surfaces.map((surface) => surface.id).sort();
const profileErrors = [];

if (JSON.stringify(actualSurfaces) !== JSON.stringify(expectedSurfaces)) {
  profileErrors.push("profile surface registry does not match the ContextSet MCP vocabulary");
}

for (const surface of profile.surfaces) {
  const shouldRequireActionCapability = surface.class === "action";
  if (surface.actionCapabilityRequired !== shouldRequireActionCapability) {
    profileErrors.push(
      `${surface.id} actionCapabilityRequired must match class ${surface.class}`
    );
  }
}

if (!profile.requirements.extension.requiredCapabilities.includes("access_mcp")) {
  profileErrors.push("extension requirements must include access_mcp");
}

if (profile.requirements.network.capability !== "access_network") {
  profileErrors.push("networked transports must depend on access_network");
}

if (profileErrors.length > 0) {
  console.error("MCP extension profile consistency failed:");
  for (const error of profileErrors) console.error(`  - ${error}`);
  process.exit(1);
}

const schemaAjv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false
});
schemaAjv.addSchema(commonSchema);
const validateContext = schemaAjv.compile(contextSchema);

function manifest(source) {
  return {
    specVersion: "0.1",
    kind: "ContextSet",
    metadata: { project: "mcp-extension-check" },
    contextSources: [source]
  };
}

function source(update = {}) {
  return {
    id: "mcp_source",
    type: "mcp",
    description: "MCP source used for structural checks.",
    access: { default: "query", allowedActors: ["implementation-agent"] },
    classification: "internal",
    mcp: {
      serverId: "development_server",
      exposes: ["resources"]
    },
    ...update
  };
}

const cases = [
  {
    name: "resource-only MCP source",
    value: manifest(source()),
    expected: true
  },
  {
    name: "approved tool MCP source",
    value: manifest(source({
      mcp: {
        serverId: "development_server",
        exposes: ["context", "tools"],
        allowedTools: ["test-log-reader"],
        requiresApprovalForTools: true
      },
      approvalGates: ["tool_use_review"]
    })),
    expected: true
  },
  {
    name: "non-MCP source does not require MCP metadata",
    value: manifest({
      id: "project_docs",
      type: "docs",
      description: "Documentation source.",
      access: { default: "read" },
      classification: "public"
    }),
    expected: true
  },
  {
    name: "MCP source without MCP metadata",
    value: manifest(source({ mcp: undefined })),
    expected: false
  },
  {
    name: "MCP source without server ID",
    value: manifest(source({ mcp: { exposes: ["resources"] } })),
    expected: false
  },
  {
    name: "MCP source with empty surface inventory",
    value: manifest(source({
      mcp: { serverId: "development_server", exposes: [] }
    })),
    expected: false
  },
  {
    name: "MCP tool source without allow-list",
    value: manifest(source({
      mcp: {
        serverId: "development_server",
        exposes: ["tools"],
        requiresApprovalForTools: true
      }
    })),
    expected: false
  },
  {
    name: "MCP tool source without approval posture",
    value: manifest(source({
      mcp: {
        serverId: "development_server",
        exposes: ["tools"],
        allowedTools: ["test-log-reader"]
      }
    })),
    expected: false
  },
  {
    name: "MCP tool source with disabled approval posture",
    value: manifest(source({
      mcp: {
        serverId: "development_server",
        exposes: ["tools"],
        allowedTools: ["test-log-reader"],
        requiresApprovalForTools: false
      }
    })),
    expected: false
  },
  {
    name: "unknown MCP surface",
    value: manifest(source({
      mcp: { serverId: "development_server", exposes: ["sampling"] }
    })),
    expected: false
  }
];

let failed = false;

for (const testCase of cases) {
  const actual = validateContext(testCase.value);
  if (actual === testCase.expected) continue;

  failed = true;
  console.error(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  if (validateContext.errors) {
    console.error(JSON.stringify(validateContext.errors, null, 2));
  }
}

const extensionSet = await readYaml("examples/software-team/extensions.yaml");
const capabilitySet = await readYaml("examples/software-team/capabilities.yaml");
const permissionSet = await readYaml("examples/software-team/permissions.yaml");
const contextSet = await readYaml("examples/software-team/context.yaml");

const exampleErrors = [];
const mcpExtension = extensionSet.extensions.find(
  (extension) => extension.namespace === profile.namespace
);
if (!mcpExtension) {
  exampleErrors.push("Software Team does not declare io.nexflow.mcp");
} else if (!mcpExtension.requiredCapabilities?.includes("access_mcp")) {
  exampleErrors.push("Software Team MCP extension does not require access_mcp");
}

const capabilityIds = new Set(capabilitySet.capabilities.map((capability) => capability.id));
if (!capabilityIds.has("access_mcp")) {
  exampleErrors.push("Software Team does not declare access_mcp");
}

const permittedCapabilities = new Set(
  permissionSet.permissions.flatMap((permission) => permission.capabilities)
);
if (!permittedCapabilities.has("access_mcp")) {
  exampleErrors.push("Software Team does not permission access_mcp");
}

for (const contextSource of contextSet.contextSources.filter(
  (candidate) => candidate.type === "mcp"
)) {
  if (!validateContext(manifest(contextSource))) {
    exampleErrors.push(`Software Team MCP source ${contextSource.id} violates the draft profile`);
  }
}

if (exampleErrors.length > 0) {
  failed = true;
  console.error("MCP extension example consistency failed:");
  for (const error of exampleErrors) console.error(`  - ${error}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`MCP extension checks passed for ${cases.length} schema cases.`);
  console.log(
    "Validated the draft profile, surface authority boundaries, and Software Team cross-manifest declarations without connecting to an MCP server."
  );
}
