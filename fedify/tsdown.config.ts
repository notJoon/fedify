import { cp, glob, rm } from "node:fs/promises";
import { join, sep } from "node:path";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./mod.ts",
    "./compat/mod.ts",
    "./federation/mod.ts",
    "./nodeinfo/mod.ts",
    "./runtime/mod.ts",
    "./sig/mod.ts",
    "./vocab/mod.ts",
    "./webfinger/mod.ts",
    "./x/hono.ts",
    "./x/sveltekit.ts",
    ...(await Array.fromAsync(glob(`**/*.test.ts`)))
      .filter((f) =>
        !f.startsWith(`codegen${sep}`) && f !== `x${sep}denokv.test.ts`
      ),
  ],
  dts: true,
  unbundle: true,
  inputOptions: {
    onwarn(warning, defaultHandler) {
      if (
        warning.code === "UNRESOLVED_IMPORT" &&
        warning.id?.endsWith("vocab/vocab.test.ts") &&
        warning.exporter === "@std/testing/snapshot"
      ) {
        return;
      } else if (
        warning.code === "UNRESOLVED_IMPORT" &&
        warning.id?.endsWith("testing/mod.ts") &&
        warning.exporter === "bun:test"
      ) {
        return;
      }
      defaultHandler(warning);
    },
  },
  outputOptions: {
    intro: `
      import { Temporal } from "@js-temporal/polyfill";
      import { URLPattern } from "urlpattern-polyfill";
    `,
  },
  hooks: {
    "build:done": async (ctx) => {
      await rm(join(ctx.options.outDir, "testing", "fixtures"), {
        recursive: true,
        force: true,
      });
      await cp(
        join("testing", "fixtures"),
        join(ctx.options.outDir, "testing", "fixtures"),
        { recursive: true },
      );
      await cp(
        join("codegen", "schema.yaml"),
        join(ctx.options.outDir, "codegen", "schema.yaml"),
        { force: true },
      );
      for await (const file of glob(`vocab/**/*.yaml`)) {
        await cp(
          file,
          join(ctx.options.outDir, file),
          { force: true },
        );
      }
    },
  },
});

// cSpell: ignore unbundle
