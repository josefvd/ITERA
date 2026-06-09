const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
require('dotenv').config({ path: path.join(cwd, '.env') })

async function main() {
  const sql = neon(process.env.DATABASE_URL)
  const schema = fs.readFileSync(path.join(cwd, 'prisma', 'schema.sql'), 'utf-8')
  const statements = schema.split(';').filter(s => s.trim())
  for (const stmt of statements) {
    try {
      // Use unsafe() for raw SQL strings that aren't tagged templates
      await sql.unsafe(stmt.trim() + ';')
      console.log('✓ Executed:', stmt.trim().substring(0, 60))
    } catch(e) {
      console.error('✗ Error:', e.message.substring(0, 100))
    }
  }
  console.log('Migration complete.')
}

main().catch(console.error)