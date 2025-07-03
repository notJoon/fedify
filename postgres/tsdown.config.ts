import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["mod.ts", "kv.ts", "mq.ts"],
  dts: true,
  platform: "node",
  outputOptions: {
    intro: `
      import { Temporal } from "@js-temporal/polyfill";
    `,
  },
});
