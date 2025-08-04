import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  platform: "neutral",
  external: [/^node:/, "elysia", "@fedify/fedify"],
});
