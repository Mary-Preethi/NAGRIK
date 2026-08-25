import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Native .env parser for Node.js
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          const val = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    });
  }
}

loadEnv();

function parseSqlStatements(sqlContent) {
  const lines = sqlContent.split('\n');
  const cleanedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) return '';
    return line;
  });

  const fullText = cleanedLines.join('\n');
  return fullText
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || (!tursoUrl.startsWith('libsql://') && !tursoUrl.startsWith('https://') && !tursoAuthToken)) {
    console.error('\n========================================================================');
    console.error(' [ERROR: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN MISSING]');
    console.error('========================================================================');
    console.error(' To apply the schema directly to remote Turso, define:');
    console.error('   TURSO_DATABASE_URL="libsql://your-db.turso.io"');
    console.error('   TURSO_AUTH_TOKEN="your-turso-auth-token"');
    console.error(' in your environment variables before running this script.');
    console.error('========================================================================\n');
    process.exit(1);
  }

  const sqlPath = path.join(process.cwd(), 'scripts', 'turso-schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('ERROR: scripts/turso-schema.sql not found.');
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(sqlPath, 'utf-8');
  const statements = parseSqlStatements(schemaSql);

  const displayUrl = tursoUrl.replace(/:[^@]+@/, ':***@');
  console.log(`Connecting to remote Turso database at ${displayUrl}...`);
  console.log(`Parsed ${statements.length} individual DDL statements from scripts/turso-schema.sql.`);

  const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });

  console.log('\nApplying statements sequentially...');
  let successCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split('\n')[0].trim();
    try {
      await client.execute(stmt);
      successCount++;
      console.log(` [${i + 1}/${statements.length}] ✓ ${firstLine}`);
    } catch (err) {
      // If table/index already exists, log as notice rather than fatal
      if (err.message && (err.message.includes('already exists') || err.message.includes('SQLITE_ERROR: table'))) {
        console.log(` [${i + 1}/${statements.length}] ℹ ${firstLine} (${err.message})`);
        successCount++;
      } else {
        console.error(`\n [FAILED STATEMENT ${i + 1}/${statements.length}]:`);
        console.error(stmt);
        console.error(` Error: ${err.message}\n`);
        throw err;
      }
    }
  }

  console.log(`\n✓ All ${successCount}/${statements.length} schema DDL statements applied successfully to Turso!`);
}

main().catch((err) => {
  console.error('Failed to apply schema to Turso:', err.message);
  process.exit(1);
});
