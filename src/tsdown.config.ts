import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["mod.ts", "codec.ts", "kv.ts", "mq.ts"],
  dts: true,
  unbundle: true,
  platform: "node",
  outputOptions: {
    intro: `
      import { Temporal } from "@js-temporal/polyfill";
    `
  }
});
