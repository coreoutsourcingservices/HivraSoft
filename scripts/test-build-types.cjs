/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression script. */
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const ts = require("typescript");

async function main() {
  const configPath = path.resolve(__dirname, "../tsconfig.build.json");
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(read.error, undefined);
  const config = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(configPath));
  assert.equal(config.errors.length, 0);
  const files = config.fileNames.map((file) => file.replaceAll("\\", "/"));
  assert(files.some((file) => file.endsWith("/app/page.tsx")), "Application source remains type checked");
  assert(files.some((file) => file.endsWith("/.next/types/validator.ts")), "Fresh production route validation remains enabled");
  assert(!files.some((file) => file.includes("/.next/dev/")), "Dev cache must never enter production type checking");
  assert.equal(config.options.strict, true);
  const configUrl = pathToFileURL(path.resolve(__dirname, "../next.config.mjs"));
  process.env.NODE_ENV = "production";
  const production = (await import(configUrl.href + "?test=production")).default;
  assert.equal(production.typescript.tsconfigPath, "tsconfig.build.json");
  assert.notEqual(production.typescript.ignoreBuildErrors, true);
  process.env.NODE_ENV = "development";
  const development = (await import(configUrl.href + "?test=development")).default;
  assert.equal(development.typescript.tsconfigPath, "tsconfig.json");
  console.log("Build type configuration checks passed: production routes and strict checks enabled; dev cache isolated.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
