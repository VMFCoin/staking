import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);
const distDir = join(
  projectRoot,
  "node_modules",
  "ts-interface-checker",
  "dist"
);
const jsPath = join(distDir, "index.js");
const dtsPath = join(distDir, "index.d.ts");
const STUB_SENTINEL = "@codex-ts-interface-checker-stub";

function needsStub(filePath) {
  try {
    const stats = statSync(filePath);
    if (stats.size === 0) {
      return true;
    }
    const content = readFileSync(filePath, "utf8");
    return (
      content.includes(STUB_SENTINEL) ||
      content.includes("Minimal stub for ts-interface-checker") ||
      (filePath.endsWith(".d.ts") && content.length < 200)
    );
  } catch {
    return true;
  }
}

const shouldWriteJs = needsStub(jsPath);
const shouldWriteDts = needsStub(dtsPath);

if (shouldWriteJs || shouldWriteDts) {
  mkdirSync(distDir, { recursive: true });
}

if (shouldWriteJs) {
  const stub = `"use strict";
/* ${STUB_SENTINEL} */
/**
 * Auto-generated fallback for ts-interface-checker.
 * Some npm installs (notably on Node 22) omit the compiled runtime file,
 * which breaks dependencies such as Tailwind (via sucrase). This stub keeps
 * the dev server running by providing the minimal surface that callers use.
 */

function createChecker() {
  return {
    strictCheck() {},
    check() {},
    validate() {},
  };
}

function createCheckers(...typeSuites) {
  const aggregated = Object.assign({}, ...typeSuites);
  const checkers = Object.create(null);
  for (const key of Object.keys(aggregated)) {
    checkers[key] = createChecker();
  }
  return checkers;
}

function makeType(kind, payload) {
  return Object.freeze({ kind, ...payload });
}

function lit(value) {
  return makeType("literal", { value });
}

function union(...types) {
  return makeType("union", { types });
}

function iface(extendsList = [], fields = {}) {
  return makeType("interface", { extends: extendsList, fields });
}

function array(itemType) {
  return makeType("array", { itemType });
}

function opt(type) {
  return makeType("optional", { type });
}

const api = {
  createCheckers,
  lit,
  union,
  iface,
  array,
  opt,
  Checker: createChecker,
};

api.default = api;

module.exports = api;
`;
  writeFileSync(jsPath, stub);
}

if (shouldWriteDts) {
  const stubTypes = `/* ${STUB_SENTINEL} */
export type Checker = {
  strictCheck(value: unknown): void;
  check(value: unknown): void;
  validate(value: unknown): void;
};

export function createCheckers(...typeSuites: Array<Record<string, unknown>>): Record<string, Checker>;
export function lit(value: unknown): unknown;
export function union(...types: unknown[]): unknown;
export function iface(extendsList: unknown[], fields: Record<string, unknown>): unknown;
export function array(itemType: unknown): unknown;
export function opt(type: unknown): unknown;

declare const _default: {
  createCheckers,
  lit,
  union,
  iface,
  array,
  opt,
};
export default _default;
`;
  writeFileSync(dtsPath, stubTypes);
}

// Ensure nested react-is packages keep their CJS builds (npm 11 bug drops them sometimes)
const reactIsSourceDir = join(projectRoot, "node_modules", "react-is", "cjs");
const reactIsTargets = [
  join(projectRoot, "node_modules", "prop-types", "node_modules", "react-is"),
  join(
    projectRoot,
    "node_modules",
    "hoist-non-react-statics",
    "node_modules",
    "react-is"
  ),
];
const reactIsFiles = ["react-is.development.js", "react-is.production.js"];

if (existsSync(reactIsSourceDir)) {
  for (const targetDir of reactIsTargets) {
    const targetCjsDir = join(targetDir, "cjs");
    if (!existsSync(targetCjsDir)) {
      continue;
    }
    for (const file of reactIsFiles) {
      const sourceFile = join(reactIsSourceDir, file);
      const destFile = join(targetCjsDir, file);
      try {
        const stats = statSync(destFile);
        if (stats.size > 0) {
          continue;
        }
      } catch {
        // Missing file, will copy
      }
      if (existsSync(sourceFile)) {
        copyFileSync(sourceFile, destFile);
      }
    }
  }
}

// Patch superstruct so Vite can resolve it even when the ESM build is missing
const superstructPackagePath = join(
  projectRoot,
  "node_modules",
  "superstruct",
  "package.json"
);
try {
  const superstructPkg = JSON.parse(
    readFileSync(superstructPackagePath, "utf8")
  );
  if (superstructPkg.module !== "./dist/index.cjs") {
    superstructPkg.module = "./dist/index.cjs";
    writeFileSync(
      superstructPackagePath,
      `${JSON.stringify(superstructPkg, null, 2)}\n`
    );
  }
} catch {
  // ignore
}
