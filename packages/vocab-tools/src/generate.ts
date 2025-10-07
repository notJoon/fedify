import { open } from "node:fs/promises";
import { generateClasses } from "./class.ts";
import { loadSchemaFiles } from "./schema.ts";

export default async function generateVocab(
  schemaDir: string,
  generatedPath: string,
) {
  const types = await loadSchemaFiles(schemaDir);
  const encoder = new TextEncoder();

  const file = await open(generatedPath, "w");
  const writer = file.createWriteStream();

  for await (const code of generateClasses(types)) {
    writer.write(encoder.encode(code));
  }

  await new Promise<void>((resolve, reject) =>
    writer.end((err?: Error | null) => err ? reject(err) : resolve())
  );

  await file.close();
}
