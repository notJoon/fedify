import type { KvStore } from "@fedify/fedify/federation";
import { SqliteKvStore } from "@fedify/sqlite";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getCacheDir } from "./cache.ts";

export async function getKvStore(): Promise<KvStore> {
  const path = join(await getCacheDir(), "sqlite");
  const sqlite = new DatabaseSync(path);
  return new SqliteKvStore(sqlite);
}
