import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(process.env.DATABASE_URL);

// Helper to run a single query with template literal syntax
// Usage: await sql`SELECT * FROM "User" WHERE email = ${email}`
export { neon };