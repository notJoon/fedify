import { DatabaseSync, StatementSync } from "node:sqlite";
import type { SQLiteDatabase, SQLiteStatement } from "./adapter.ts";
import type { SqliteKvStoreOptions } from "./kv.ts";
import { SqliteKvStore as BaseSqliteKvStore } from "./kv.ts";

class NodeSqliteDatabase implements SQLiteDatabase {
  constructor(private readonly db: DatabaseSync) {}

  prepare(sql: string): NodeSqliteStatement {
    return new NodeSqliteStatement(this.db.prepare(sql));
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  close(): void {
    this.db.close();
  }
}

class NodeSqliteStatement implements SQLiteStatement {
  constructor(private readonly stmt: StatementSync) {}

  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    return this.stmt.run(...params);
  }

  get(...params: unknown[]): unknown {
    return this.stmt.get(...params);
  }

  all(...params: unknown[]): unknown[] {
    return this.stmt.all(...params);
  }
}

export class SqliteKvStore extends BaseSqliteKvStore {
  constructor(db: DatabaseSync, options: SqliteKvStoreOptions = {}) {
    super(new NodeSqliteDatabase(db), options);
  }
}
