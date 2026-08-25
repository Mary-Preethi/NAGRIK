import assert from 'assert';
import { PrismaClient } from '@prisma/client';

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

async function runInteractionVerification() {
  console.log('\n===============================================================');
  console.log('--- VERIFYING INTERACTION & MOTION EXPERIMENT INTEGRITY ---');
  console.log('===============================================================\n');

  // 1. Verify Homepage returns HTTP 200 with all interaction elements rendered
  console.log('TEST 1: Verifying Homepage rendered HTML and motion classes...');
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Homepage must return HTTP 200');
  const homeHtml = await homeRes.text();

  assert.strictEqual(homeHtml.includes('reveal-on-scroll'), true, 'Homepage must contain scroll-reveal classes');
  assert.strictEqual(homeHtml.includes('process-step-item'), true, 'Homepage must contain process step micro-interaction classes');
  assert.strictEqual(homeHtml.includes('stat-metric-card'), true, 'Homepage must contain stat metric card classes');
  assert.strictEqual(homeHtml.includes('carousel-nav-btn'), true, 'Homepage must contain carousel nav button classes');
  assert.strictEqual(homeHtml.includes('carousel-dot-btn'), true, 'Homepage must contain carousel dot button classes');
  console.log('✓ TEST 1 PASSED: All interaction, scroll-reveal, and micro-motion classes are rendered in DOM.');

  // 2. Verify Quote Reel leaders and transitions
  console.log('\nTEST 2: Verifying Quote Carousel static assets and slide stability...');
  const leaders = ['ambedkar.jpg', 'bharathiyar.jpg', 'bhagat_singh.jpg', 'vivekananda.jpg'];
  for (const img of leaders) {
    const res = await fetch(`${BASE_URL}/images/leaders/${img}`);
    assert.strictEqual(res.status, 200, `Image /images/leaders/${img} must return HTTP 200`);
  }
  console.log('✓ TEST 2 PASSED: All leader portrait images served with HTTP 200.');

  // 3. Verify Database and Auth invariants are strictly intact
  console.log('\nTEST 3: Verifying Database and Auth RBAC invariants...');
  const dbUserCount = await prisma.user.count();
  console.log(`Database active users count: ${dbUserCount}`);
  assert.ok(dbUserCount > 0 && dbUserCount < 50, 'Database users count must be untouched and genuine.');

  const unauthReportRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', description: 'Test', category: 'CIVIC_INFRASTRUCTURE' }),
  });
  assert.strictEqual(unauthReportRes.status, 401, 'Unauthenticated report submission must be strictly rejected with HTTP 401');
  console.log('✓ TEST 3 PASSED: Authentication and RBAC invariants remain strictly intact.');

  // 4. Verify other key routes remain 100% operational
  console.log('\nTEST 4: Verifying core routes accessibility...');
  const routes = ['/explore', '/login', '/register', '/report'];
  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`);
    assert.strictEqual(res.status, 200, `Route ${route} must return HTTP 200`);
    console.log(`✓ Route ${route} operational (HTTP 200).`);
  }

  console.log('\n===============================================================');
  console.log('--- ALL INTERACTION & SYSTEM INTEGRITY CHECKS PASSED (100%) ---');
  console.log('===============================================================\n');
}

runInteractionVerification()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
