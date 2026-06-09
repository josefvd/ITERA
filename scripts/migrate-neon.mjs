import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(databaseUrl);
const schemaPath = path.join(process.cwd(), "prisma", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

// Split by CREATE TABLE to handle comments properly
const statements = schema
  .split("CREATE TABLE")
  .filter((s) => s.trim().length > 0)
  .map((s) => "CREATE TABLE" + s)
  .map((s) => s.trim());

async function migrate() {
  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log("✓", stmt.substring(0, 60) + "...");
    } catch (e) {
      if (e.message && e.message.includes("already exists")) {
        console.log("~", stmt.substring(0, 60) + "... (exists)");
      } else {
        console.log("✗", e.message?.substring(0, 120) || e);
      }
    }
  }
  console.log("\nMigration complete!");

  // Verify tables exist
  const tables = await sql.unsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("\nTables in database:", tables.map((t) => t.table_name).join(", "));
}

migrate().catch(console.error);