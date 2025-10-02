import { deepStrictEqual } from "node:assert";
import { join } from "node:path";
import { test } from "node:test";
import { readDirRecursive } from "./fs.ts";

test("readDirRecursive()", async () => {
  // Create a temporary directory that has fixtures in it:
  const dir = await Deno.makeTempDir();
  await Deno.mkdir(join(dir, "a"));
  await Deno.writeTextFile(join(dir, "a", "aa.txt"), "aa");
  await Deno.writeTextFile(join(dir, "a", "ab.txt"), "aa");
  await Deno.mkdir(join(dir, "a", "aa"));
  await Deno.writeTextFile(join(dir, "a", "aa", "aaa.txt"), "aaa");
  await Deno.mkdir(join(dir, "b"));
  await Deno.writeTextFile(join(dir, "b", "ba.txt"), "ba");
  await Deno.writeTextFile(join(dir, "b", "bb.txt"), "bb");

  // Read the directory recursively:
  deepStrictEqual(
    new Set(await Array.fromAsync(readDirRecursive(dir))),
    new Set([
      join("a", "aa", "aaa.txt"),
      join("a", "aa.txt"),
      join("a", "ab.txt"),
      join("b", "ba.txt"),
      join("b", "bb.txt"),
    ]),
  );
});
