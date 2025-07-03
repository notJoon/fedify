import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["mod.ts", "src/kv.ts", "src/mq.ts"],
  dts: true,
  platform: "node",
  outputOptions: {
    intro: `
      import { Temporal } from "@js-temporal/polyfill";
    `,
  },
});
