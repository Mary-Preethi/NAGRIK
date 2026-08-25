import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
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

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  const isRemote = tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://') || tursoAuthToken);

  console.log('\n--- NAGRIK DATABASE VERIFICATION INSPECTOR ---');
  if (isRemote) {
    console.log(`Target: Remote Turso Cloud Database (${tursoUrl})`);
  } else {
    console.log(`Target: Local SQLite Database (${path.resolve(process.cwd(), 'prisma', 'dev.db')})`);
  }

  let prisma;
  if (isRemote) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    prisma = new PrismaClient({ adapter });
  } else {
    const localDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
    const libsql = createClient({ url: `file:${localDbPath}` });
    const adapter = new PrismaLibSQL(libsql);
    prisma = new PrismaClient({ adapter });
  }

  try {
    const [userCount, issueCount, reportCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.systemicIssue.count(),
      prisma.report.count(),
      prisma.auditLog.count(),
    ]);

    console.log(`\nRecords Overview:`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Systemic Issues: ${issueCount}`);
    console.log(`  - Citizen Reports: ${reportCount}`);
    console.log(`  - Immutable Audit Logs: ${auditCount}`);

    const targetTrackingIds = ['SYS-2026-0014', 'SYS-2026-0022', 'SYS-2026-0035'];
    const foundIssues = await prisma.systemicIssue.findMany({
      where: { trackingId: { in: targetTrackingIds } },
      include: {
        responsibilityNodes: true,
        reportLinks: true,
      },
    });

    console.log(`\nKey Systemic Issues Verification:`);
    for (const trackingId of targetTrackingIds) {
      const match = foundIssues.find((i) => i.trackingId === trackingId);
      if (match) {
        console.log(`  ✓ [FOUND] ${match.trackingId}`);
        console.log(`      Title: ${match.title}`);
        console.log(`      Status: ${match.status} | Priority: ${match.priorityScore.toFixed(1)}/100 | Public: ${match.isPublic}`);
        console.log(`      Responsibility Nodes: ${match.responsibilityNodes.length} | Linked Reports: ${match.reportLinks.length}`);
      } else {
        console.log(`  ✗ [MISSING] ${trackingId}`);
      }
    }

    console.log('\n--- VERIFICATION COMPLETED ---\n');
  } catch (err) {
    console.error('Verification query failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
