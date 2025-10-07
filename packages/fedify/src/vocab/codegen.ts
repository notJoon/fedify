import { generateVocab } from "@fedify/vocab-tools";
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
  await generateVocab(schemaDir, generatedPath);
  await Deno.rename(generatedPath, "src/vocab/vocab.ts");
}

if (import.meta.main) {
  await codegen();
}
