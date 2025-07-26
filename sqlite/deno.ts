import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";
import type { SQLiteDatabase, SQLiteStatement } from "./adapter.ts";
import type { SqliteKvStoreOptions } from "./kv.ts";
import { SqliteKvStore as BaseSqliteKvStore } from "./kv.ts";

class DenoSqliteDatabase implements SQLiteDatabase {
  constructor(private readonly db: DB) {}

  prepare(sql: string): SQLiteStatement {
    return new DenoSqliteStatement(this.db, sql);
  }

  exec(sql: string): void {
    this.db.execute(sql);
  }

  close(): void {
    this.db.close(true); // Force close all prepared statements
  }
}

class DenoSqliteStatement implements SQLiteStatement {
  private stmt: ReturnType<DB["prepareQuery"]>;

  constructor(private readonly db: DB, sql: string) {
    this.stmt = this.db.prepareQuery(sql);
  }

  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    try {
      const args =
        Array.isArray(params) && params.length === 1 && Array.isArray(params[0])
          ? params[0]
          : params;
      this.stmt.execute(args);
      return {
        changes: this.db.changes,
        lastInsertRowid: this.db.lastInsertRowId,
      };
    } finally {
      this.finalize();
    }
  }

  get(...params: unknown[]): unknown {
    try {
      const args =
        Array.isArray(params) && params.length === 1 && Array.isArray(params[0])
          ? params[0]
          : params;
      const result = this.stmt.first(args);

      // Handle the case when no rows are found
      if (result === undefined) {
        return undefined;
      }

      // Convert the result to the expected format with a value property
      if (typeof result === "object" && result !== null && "value" in result) {
        return result;
      } else {
        // If the query doesn't select a column named 'value', wrap the result
        return { value: result };
      }
    } finally {
      this.finalize();
    }
  }

  all(...params: unknown[]): unknown[] {
    try {
      const args =
        Array.isArray(params) && params.length === 1 && Array.isArray(params[0])
          ? params[0]
          : params;
      return this.stmt.all(args);
    } finally {
      this.finalize();
    }
  }

  private finalize(): void {
    this.stmt.finalize();
  }
}

export class SqliteKvStore extends BaseSqliteKvStore {
  constructor(db: DB, options: SqliteKvStoreOptions = {}) {
    super(new DenoSqliteDatabase(db), options);
  }
}
