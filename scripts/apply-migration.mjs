/**
 * Applies a SQL migration file directly via Supabase service role.
 * Usage: DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/apply-migration.mjs <file.sql>
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const file = process.argv[2]

if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
if (!file) { console.error('Usage: node scripts/apply-migration.mjs <file.sql>'); process.exit(1) }

const sql = readFileSync(file, 'utf8')
const supabase = createClient(url, key)

const { error } = await supabase.rpc('exec_sql', { query: sql }).single()
if (error) {
  // exec_sql RPC may not exist — fall back to direct DB URL hint
  console.error('RPC exec_sql not available. Apply the migration via Supabase dashboard SQL editor:')
  console.error(`  https://supabase.com/dashboard/project/idufruywbvlynmznpoib/sql/new`)
  console.error('\nOr with psql:')
  console.error(`  psql "postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres" -f ${file}`)
  process.exit(1)
}

console.log('Migration applied successfully.')
