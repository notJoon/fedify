import { generateVocab } from "@fedify/vocab-tools";
import { rename } from "node:fs/promises";
import { join } from "node:path";

async function codegen() {
  const schemaDir = import.meta.dirname;
  if (!schemaDir) {
    throw new Error("Could not determine schema directory");
  }
  const generatedPath = join(
    schemaDir,
    `vocab-${crypto.randomUUID()}.ts`,
  );
  const realPath = join(schemaDir, "vocab.ts");

  await generateVocab(schemaDir, generatedPath);
  await rename(generatedPath, realPath);
}

if (import.meta.main) {
  await codegen();
}
