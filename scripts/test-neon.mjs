import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function test() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  console.log("DATABASE_URL length:", url.length, "chars");
  
  const sql = neon(url);
  
  try {
    const result = await sql`SELECT NOW() as now`;
    console.log("Connection OK:", JSON.stringify(result));
    
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables:", tables.map(t => t.table_name).join(", "));
  } catch (e) {
    console.error("Error:", e.message || e);
  }
}

test();