import { join } from "@std/path";
import deno from "../deno.json" with { type: "json" };

const pkg = JSON.parse(
  await Deno.readTextFile(
    join(import.meta.dirname ?? ".", "..", "package.json"),
  ),
);

if (deno.version !== pkg.version) {
  console.error(
    `Version mismatch: deno.json version ${deno.version} ` +
      `does not match package.json version ${pkg.version}`,
  );
  Deno.exit(1);
}
