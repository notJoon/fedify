import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["mod.ts", "kv.ts"],
  dts: true,
  unbundle: true,
  platform: "node",
});
