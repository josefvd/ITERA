import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');

// Parse .env: DATABASE_URL="..." or DATABASE_URL=...
const match = envContent.match(/DATABASE_URL\s*=\s*['"]?([^'"\n]+)['"]?\s*$/m);
if (!match) { console.error('No DATABASE_URL found in .env'); process.exit(1); }

const url = match[1];
console.log('URL prefix:', url.substring(0, 25) + '...');

const sql = neon(url);

async function main() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tables:', JSON.stringify(tables.map(t => t.table_name)));
  
  for (const t of tables) {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${t.table_name}
    `;
    console.log(`\n--- ${t.table_name} ---`);
    console.log(JSON.stringify(cols, null, 2));
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });