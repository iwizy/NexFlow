#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = process.cwd();
const excludedDirectories = new Set([".git", "node_modules"]);
const errors = [];
const resolvedTargetsByFile = new Map();
const contentsByFile = new Map();
let localLinkCount = 0;

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await markdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

function withoutFencedCode(markdown) {
  let fence = null;
  const retained = [];

  for (const line of markdown.split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/u)?.[1] ?? null;
    if (marker) {
      if (fence === null) fence = marker[0];
      else if (marker[0] === fence) fence = null;
      continue;
    }
    if (fence === null) retained.push(line);
  }

  return retained.join("\n");
}

function destinationFrom(rawDestination) {
  const trimmed = rawDestination.trim();
  if (trimmed.startsWith("<")) {
    const closing = trimmed.indexOf(">");
    return closing === -1 ? trimmed : trimmed.slice(1, closing);
  }

  return trimmed.split(/\s+(?=["'(])/u, 1)[0];
}

function localDestinations(markdown) {
  const content = withoutFencedCode(markdown);
  const links = [];
  const linkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/gu;

  for (const match of content.matchAll(linkPattern)) {
    const destination = destinationFrom(match[1]);
    if (!destination || destination.startsWith("#")) continue;
    if (/^[a-z][a-z\d+.-]*:/iu.test(destination) || destination.startsWith("//")) {
      continue;
    }
    links.push(destination);
  }

  return links;
}

function repositoryRelative(absolutePath) {
  return path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
}

async function checkLocalDestination(sourceFile, destination) {
  const pathOnly = destination.split("#", 1)[0].split("?", 1)[0];
  if (!pathOnly) return null;

  if (path.isAbsolute(pathOnly)) {
    errors.push(`${repositoryRelative(sourceFile)}: local link must be relative: ${destination}`);
    return null;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathOnly);
  } catch {
    errors.push(`${repositoryRelative(sourceFile)}: invalid URL encoding: ${destination}`);
    return null;
  }

  const resolved = path.resolve(path.dirname(sourceFile), decodedPath);
  const relative = repositoryRelative(resolved);
  if (relative.startsWith("../") || relative === "..") {
    errors.push(`${repositoryRelative(sourceFile)}: link escapes the repository: ${destination}`);
    return null;
  }

  try {
    await stat(resolved);
  } catch {
    errors.push(`${repositoryRelative(sourceFile)}: missing local target: ${destination}`);
    return null;
  }

  localLinkCount += 1;
  return relative;
}

const files = (await markdownFiles(repositoryRoot)).sort();

for (const file of files) {
  const markdown = await readFile(file, "utf8");
  contentsByFile.set(repositoryRelative(file), markdown);
  const targets = new Set();
  for (const destination of localDestinations(markdown)) {
    const target = await checkLocalDestination(file, destination);
    if (target) targets.add(target);
  }
  resolvedTargetsByFile.set(repositoryRelative(file), targets);
}

const documentationPages = files
  .map(repositoryRelative)
  .filter((file) => /^docs\/[^/]+\.md$/u.test(file) && file !== "docs/index.md");
const indexedDocumentation = resolvedTargetsByFile.get("docs/index.md") ?? new Set();

for (const page of documentationPages) {
  if (!indexedDocumentation.has(page)) {
    errors.push(`docs/index.md: uncataloged documentation page: ${page}`);
  }
}

const requiredRepositoryHubs = [
  "docs/index.md",
  "schemas/README.md",
  "examples/README.md",
  "extensions/README.md",
  "fixtures/README.md",
  "rfcs/README.md",
  "conformance/README.md",
  "release/README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md"
];
const readmeTargets = resolvedTargetsByFile.get("README.md") ?? new Set();

for (const hub of requiredRepositoryHubs) {
  if (!readmeTargets.has(hub)) {
    errors.push(`README.md: missing repository hub link: ${hub}`);
  }
}

// Dated changelog entries describe published snapshots; Unreleased is not a release.
// Keep the current summaries consistent without rewriting historical evidence.
const published = [...(contentsByFile.get("CHANGELOG.md") ?? "").matchAll(
  /^## \[(\d+\.\d+\.\d+(?:-[\w.-]+)?)\] - \d{4}-\d{2}-\d{2}$/gmu
)].map((match) => match[1]);
const latestSource = published.find((version) => !version.includes("-"));

function checkVersion(file, pattern, expected, label) {
  const actual = contentsByFile.get(file)?.match(pattern)?.[1];
  if (!expected || actual !== expected) {
    errors.push(`${file}: ${label} must be ${expected ?? "recorded in CHANGELOG.md"}; found ${actual ?? "no version"}`);
  }
}

for (const file of ["README.md", "docs/roadmap.md", "docs/release-plan.md", "docs/compatibility-matrix.md", "release/README.md"]) {
  checkVersion(file, /Current source release: \[\*\*`v([^`]+)`\*\*\]/u, latestSource, "current source release");
}
checkVersion("SECURITY.md", /^\| `v([^`]+)` \| Latest published source milestone;/mu, latestSource, "supported source snapshot");
checkVersion("docs/roadmap.md", /^## Current Checkpoint: `v([^`]+)`$/mu, latestSource, "current checkpoint");

const cli = JSON.parse(await readFile(path.join(repositoryRoot, "packages/cli/package.json"), "utf8"));
const validation = JSON.parse(await readFile(path.join(repositoryRoot, "packages/validation/package.json"), "utf8"));
const publishedTooling = contentsByFile.get("docs/reference-cli-installation.md")?.match(/This guide describes the published `([^`]+)`/u)?.[1];
if (!publishedTooling || !published.includes(publishedTooling)) {
  errors.push("The installation guide must identify tooling with a dated publication entry in CHANGELOG.md.");
}
const expectedSequence = published.filter((version) => !version.includes("-") || version === publishedTooling).reverse();
const sequenceText = contentsByFile.get("README.md")?.match(/The published release sequence is \*\*([^*]+)\*\*/u)?.[1] ?? "";
const sequence = [...sequenceText.matchAll(/`v([^`]+)`/gu)].map((match) => match[1]);
if (JSON.stringify(sequence) !== JSON.stringify(expectedSequence)) {
  errors.push(`README.md: published release sequence must match dated changelog entries: ${expectedSequence.join(" -> ")}`);
}
for (const [file, metadata] of [["packages/cli/README.md", cli], ["packages/validation/README.md", validation]]) {
  // A future source candidate may have a version that has not been published.
  if (metadata.version !== publishedTooling) continue;
  const introduction = contentsByFile.get(file)?.slice(0, 800) ?? "";
  if (/\bunreleased\b/iu.test(introduction) || !introduction.includes(`/releases/tag/v${metadata.version}`)) {
    errors.push(`${file}: introduction must identify the published preview v${metadata.version}.`);
  }
}
checkVersion("CONTRIBUTING.md", /also require Node\.js\s+(\d+\.\d+\.\d+), npm/u, validation.engines.node, "reference-package Node prerequisite");
const contributionIntro = contentsByFile.get("CONTRIBUTING.md")?.split("## Local Validation\n", 2)[1]?.slice(0, 850) ?? "";
if (/\bunreleased\b/iu.test(contributionIntro) || !contributionIntro.includes(`/releases/tag/v${publishedTooling}`)) {
  errors.push("CONTRIBUTING.md: local validation guide must distinguish published tooling from new candidates.");
}

if (errors.length > 0) {
  console.error("Documentation navigation/status checks failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation navigation checks passed for ${files.length} Markdown files and ${localLinkCount} local links.`
  );
  console.log(
    `docs/index.md catalogs ${documentationPages.length} documentation pages; README.md links ${requiredRepositoryHubs.length} repository hubs.`
  );
  console.log(`Current release/status statements match v${latestSource}; published tooling is v${publishedTooling}, source builds use Node ${validation.engines.node}.`);
}
