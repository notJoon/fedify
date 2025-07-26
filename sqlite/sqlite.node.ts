import { DatabaseSync, StatementSync } from "node:sqlite";
import type {
  SqliteDatabaseAdapter,
  SqliteStatementAdapter,
} from "./adapter.ts";

export { DatabaseSync as PlatformDatabase };
export type { StatementSync as PlatformStatement };

export class SqliteDatabase implements SqliteDatabaseAdapter {
  constructor(private readonly db: DatabaseSync) {}

  prepare(sql: string): SqliteStatementAdapter {
    return new SqliteStatement(this.db.prepare(sql));
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  close(): void {
    this.db.close();
  }
}

export class SqliteStatement implements SqliteStatementAdapter {
  constructor(private readonly stmt: StatementSync) {}

  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    return this.stmt.run(...params);
  }

  get(...params: unknown[]): unknown | undefined {
    return this.stmt.get(...params);
  }

  all(...params: unknown[]): unknown[] {
    return this.stmt.all(...params);
  }
}
