import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["mod.ts", "kv.ts", "sqlite.node.ts", "sqlite.bun.ts"],
  dts: true,
  unbundle: true,
  platform: "node",
  inputOptions: {
    onwarn(warning, defaultHandler) {
      if (
        warning.code === "UNRESOLVED_IMPORT" &&
        ["#sqlite", "bun:sqlite"].includes(warning.exporter ?? "")
      ) {
        return;
      }
      defaultHandler(warning);
    },
  },
  outputOptions: {
    intro: `
      import { Temporal } from "@js-temporal/polyfill";
    `,
  },
});
