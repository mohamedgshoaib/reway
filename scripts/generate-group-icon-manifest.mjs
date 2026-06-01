import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDirPath = path.dirname(scriptFilePath);

const ICON_SOURCE_PATH = path.resolve(scriptDirPath, "../lib/hugeicons-list.ts");
const OUTPUT_PATH = path.resolve(
  scriptDirPath,
  "../extension/js/group-icon-manifest.js",
);
const DEFAULT_ICON_KEY = "folder";
const FALLBACK_ICON_KEY = "fallback";

function readAllowedIconEntries() {
  const source = fs.readFileSync(ICON_SOURCE_PATH, "utf8");
  const matches = source.matchAll(
    /\{\s*name:\s*"([^"]+)",\s*icon:\s*([A-Za-z0-9_]+)\s*\}/g,
  );
  const seen = new Set();
  const entries = [];
  for (const [, key, exportName] of matches) {
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ key, exportName });
  }
  return entries;
}

function collectSvgNodes(node) {
  if (!node) return [];

  if (
    Array.isArray(node) &&
    node.length === 2 &&
    typeof node[0] === "string" &&
    node[1] &&
    typeof node[1] === "object" &&
    !Array.isArray(node[1])
  ) {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectSvgNodes);
  }

  if (typeof node === "object") {
    if (node.props?.children) {
      return collectSvgNodes(node.props.children);
    }
    if (node.children) {
      return collectSvgNodes(node.children);
    }
  }

  return [];
}

function sanitizeAttrs(attrs) {
  return Object.fromEntries(
    Object.entries(attrs || {}).filter(
      ([key, value]) => key !== "key" && value !== undefined && value !== null,
    ),
  );
}

function extractIconNodes(rawIcon) {
  const nodes = collectSvgNodes(rawIcon).map(([tag, attrs]) => ({
    tag,
    attrs: sanitizeAttrs(attrs),
  }));

  return nodes.length > 0 ? nodes : null;
}

async function main() {
  const iconEntries = readAllowedIconEntries();
  const iconModule = await import("@hugeicons/core-free-icons");
  const manifest = {};
  const missing = [];

  for (const entry of iconEntries) {
    const rawIcon = iconModule[entry.exportName];
    if (!rawIcon) {
      missing.push(`${entry.key} -> ${entry.exportName}`);
      continue;
    }

    const nodes = extractIconNodes(rawIcon);
    if (!nodes) {
      missing.push(`${entry.key} -> ${entry.exportName}`);
      continue;
    }

    manifest[entry.key] = {
      viewBox: "0 0 24 24",
      nodes,
    };
  }

  if (!manifest[DEFAULT_ICON_KEY]) {
    throw new Error(`Default icon "${DEFAULT_ICON_KEY}" is missing`);
  }

  manifest[FALLBACK_ICON_KEY] = manifest[DEFAULT_ICON_KEY];

  const fileContents = [
    "// AUTO-GENERATED. Run `pnpm generate:group-icons` after icon list changes.",
    `// Generated: ${new Date().toISOString()}`,
    `globalThis.REWAY_GROUP_ICON_MANIFEST = ${JSON.stringify(manifest)};`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, fileContents, "utf8");

  if (missing.length > 0) {
    console.warn(
      `Generated icon manifest with ${missing.length} missing icon export(s):`,
    );
    for (const item of missing) {
      console.warn(` - ${item}`);
    }
  }

  console.log(
    `Wrote ${Object.keys(manifest).length - 1} icon entries to ${OUTPUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
