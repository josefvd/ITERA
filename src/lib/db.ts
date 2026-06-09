import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _sql = neon(url);
  }
  return _sql;
}

// Lazy accessor — only validates DATABASE_URL when first query runs
// This prevents build-time crashes when env vars aren't available yet
export function useDb() {
  return getSql();
}

// Convenience re-export
export { neon };
export type SqlQuery = ReturnType<typeof neon>;