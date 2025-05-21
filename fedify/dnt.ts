import { build, emptyDir } from "@deno/dnt";
import { copy } from "@std/fs";
import workspaceMetadata from "../deno.json" with { type: "json" };
import metadata from "./deno.json" with { type: "json" };

await emptyDir("./npm");
await emptyDir("./npm/esm/codegen");

const excludedExports = ["./x/denokv", "./x/fresh"];

const entryPoints = Object.entries(metadata.exports as Record<string, string>)
  .map(([name, path]) => ({ name, path }))
  .filter(({ name }) => !excludedExports.includes(name));

const testExports = [];
for (const { name } of entryPoints) {
  const match = name.match(/^\.\/([^/]+)/);
  if (match && match[1] != "x") testExports.push(match[1]);
}

const importMap = ".dnt-import-map.json";
const imports = {
  ...workspaceMetadata.imports,
  ...metadata.imports,
};
await Deno.writeTextFile(
  importMap,
  JSON.stringify({
    imports: {
      ...imports,
      "@logtape/logtape": imports["@logtape/logtape"].replace(/^jsr:/, "npm:"),
      "@hugoalh/http-header-link": imports["@hugoalh/http-header-link"]
        .replace(/^jsr:/, "npm:"),
    },
  }),
);

await build({
  package: {
    // package.json properties
    name: "@fedify/fedify",
    version: Deno.args[0] ?? metadata.version,
    description: "An ActivityPub server framework",
    keywords: ["ActivityPub", "fediverse"],
    license: "MIT",
    author: {
      name: "Hong Minhee",
      email: "hong@minhee.org",
      url: "https://hongminhee.org/",
    },
    homepage: "https://fedify.dev/",
    repository: {
      type: "git",
      url: "git+https://github.com/fedify-dev/fedify.git",
    },
    bugs: {
      url: "https://github.com/fedify-dev/fedify/issues",
    },
    funding: [
      "https://opencollective.com/fedify",
      "https://github.com/sponsors/dahlia",
    ],
    engines: {
      "deno": ">=2.0.0",
      "node": ">=22.0.0",
      "bun": ">=1.1.0",
    },
  },
  outDir: "./npm",
  entryPoints,
  importMap,
  scriptModule: false,
  shims: {
    deno: true,
    crypto: true,
    custom: [
      {
        package: {
          name: "urlpattern-polyfill",
          version: "~10.0.0",
        },
        globalNames: [
          {
            name: "URLPattern",
            exportName: "URLPattern",
          },
        ],
      },
      {
        package: {
          name: "@js-temporal/polyfill",
          version: "^0.5.0",
        },
        globalNames: [
          {
            name: "Temporal",
            exportName: "Temporal",
          },
        ],
      },
    ],
    customDev: [
      {
        module: "./shim/event.ts",
        globalNames: ["addEventListener"],
      },
    ],
  },
  typeCheck: "both",
  declaration: "separate",
  declarationMap: true,
  test: Deno.env.get("DNT_SKIP_TEST") !== "true",
  compilerOptions: {
    target: "ES2022",
  },
  // deno-lint-ignore no-explicit-any
  filterDiagnostic(diagnostic: any) {
    if (
      diagnostic.file?.fileName.endsWith("2KNRVU.ts")
    ) {
      return false; // ignore all diagnostics in this file
    }
    // etc... more checks here
    return true;
  },
  testPattern: `{${testExports.join(",")}}/**/*.test.ts`,
  async postBuild() {
    await copy(
      "testing/fixtures",
      "npm/esm/testing/fixtures",
      { overwrite: true },
    );
    for await (const entry of Deno.readDir("vocab")) {
      if (!entry.isFile || !entry.name.endsWith(".yaml")) continue;
      await Deno.copyFile(`vocab/${entry.name}`, `npm/esm/vocab/${entry.name}`);
    }
    await Deno.copyFile("codegen/schema.yaml", "npm/esm/codegen/schema.yaml");
    await Deno.copyFile("../CHANGES.md", "npm/CHANGES.md");
    await Deno.copyFile("../CONTRIBUTING.md", "npm/CONTRIBUTING.md");
    await Deno.copyFile("../FEDERATION.md", "npm/FEDERATION.md");
    await Deno.copyFile("../LICENSE", "npm/LICENSE");
    await Deno.copyFile("../logo.svg", "npm/logo.svg");
    await Deno.copyFile("../README.md", "npm/README.md");
    await Deno.copyFile("../SECURITY.md", "npm/SECURITY.md");
    await Deno.copyFile("../SPONSORS.md", "npm/SPONSORS.md");
  },
});

await Deno.remove(importMap);

// cSpell: ignore Minhee 2KNRVU
