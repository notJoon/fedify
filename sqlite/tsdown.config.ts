import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["node.ts", "bun.ts"],
  dts: true,
  unbundle: true,
  platform: "node",
});
