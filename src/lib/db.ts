import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export default db;

export function dbQuery<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (sql.trim().toUpperCase().startsWith("SELECT")) {
    return stmt.all(...params) as T[];
  }
  return stmt.run(...params) as any;
}

export function dbGet<T = any>(
  sql: string,
  params: any[] = []
): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}