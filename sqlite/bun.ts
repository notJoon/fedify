import type { Database, Statement } from "bun:sqlite";
import type { SQLiteDatabase, SQLiteStatement } from "./adapter.ts";
import type { SqliteKvStoreOptions } from "./kv.ts";
import { SqliteKvStore as BaseSqliteKvStore } from "./kv.ts";

class BunSqliteDatabase implements SQLiteDatabase {
  constructor(private readonly db: Database) {}

  prepare(sql: string): SQLiteStatement {
    return new BunSqliteStatement(this.db.query(sql));
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  close(): void {
    this.db.close(false);
  }
}

class BunSqliteStatement implements SQLiteStatement {
  constructor(private readonly stmt: Statement) {}

  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    return this.stmt.run(...params);
  }

  get(...params: unknown[]): unknown {
    const result = this.stmt.get(...params);
    if (result === null) {
      return undefined;
    }
    return result;
  }

  all(...params: unknown[]): unknown[] {
    return this.stmt.all(...params);
  }
}

export class SqliteKvStore extends BaseSqliteKvStore {
  constructor(db: Database, options: SqliteKvStoreOptions = {}) {
    super(new BunSqliteDatabase(db), options);
  }
}
