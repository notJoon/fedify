/**
 * SQLite adapter
 */

export interface SQLiteDatabase {
  /**
   * Prepares a SQL statement.
   * @param sql - The SQL statement to prepare.
   */
  prepare(sql: string): SQLiteStatement;

  /**
   * Executes a SQL statement.
   * @param sql - The SQL statement to execute.
   */
  exec(sql: string): void;

  /**
   * Closes the database connection.
   */
  close(): void;
}

export interface SQLiteStatement {
  /**
   * Executes a SQL statement and returns the number of changes made to the database.
   * @param params - The parameters to bind to the SQL statement.
   */
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };

  /**
   * Executes a SQL statement and returns the first row of the result set.
   * @param params - The parameters to bind to the SQL statement.
   */
  get(...params: unknown[]): unknown;

  /**
   * Executes a SQL statement and returns all rows of the result set.
   * @param params - The parameters to bind to the SQL statement.
   */
  all(...params: unknown[]): unknown[];
}

export function createSQLiteDatabase(db: unknown): SQLiteDatabase {
  throw new Error("Unsupported database type");
}
