import type { KvStore } from "@fedify/fedify/federation";
import { SqliteKvStore } from "@fedify/sqlite";
import { Database } from "bun:sqlite";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { getCacheDir } from "./cache.ts";

export async function getKvStore(): Promise<KvStore> {
  const path = join(await getCacheDir(), "sqlite");
  const sqlite = new Database(path);
  return new SqliteKvStore(sqlite as unknown as DatabaseSync);
}
