import { build, emptyDir } from "@deno/dnt";
import metadata from "./deno.json" with { type: "json" };

await emptyDir("./npm");

const importMap = ".dnt-import-map.json";
await Deno.writeTextFile(
  importMap,
  JSON.stringify({
    imports: {
      ...metadata.imports,
      "@fedify/fedify": metadata.imports["@fedify/fedify"]
        .replace(/^jsr:/, "npm:")
        .replace(/\+.+$/, ""),
      "@logtape/logtape": metadata.imports["@logtape/logtape"]
        .replace(/^jsr:/, "npm:")
        .replace(/\+.+$/, ""),
    },
  }),
);

await build({
  package: {
    // package.json properties
    name: metadata.name,
    version: Deno.args[0] ?? metadata.version,
    description: "Redis drivers for Fedify",
    keywords: ["fedify", "redis"],
    license: "MIT",
    author: {
      name: "Hong Minhee",
      email: "hong@minhee.org",
      url: "https://hongminhee.org/",
    },
    homepage: "https://github.com/fedify-dev/redis",
    repository: {
      type: "git",
      url: "git+https://github.com/fedify-dev/redis.git",
    },
    bugs: {
      url: "https://github.com/fedify-dev/redis/issues",
    },
    funding: [
      "https://opencollective.com/fedify",
      "https://github.com/sponsors/dahlia",
    ],
  },
  outDir: "./npm",
  entryPoints: [
    "./mod.ts",
    { name: "./kv", path: "./src/kv.ts" },
    { name: "./mq", path: "./src/mq.ts" },
  ],
  importMap,
  shims: {
    deno: true,
    custom: [
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
  },
  typeCheck: "both",
  declaration: "separate",
  declarationMap: true,
  test: Deno.env.get("DNT_TEST") !== "false",
  async postBuild() {
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");
  },
});

await Deno.remove(importMap);

// cSpell: ignore Minhee
