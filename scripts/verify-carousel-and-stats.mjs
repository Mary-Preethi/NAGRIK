import assert from 'assert';
import { PrismaClient } from '@prisma/client';

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

async function runVerification() {
  console.log('\n===============================================================');
  console.log('--- VERIFYING HOMEPAGE CITIZEN COUNT & QUOTE CAROUSEL FIXES ---');
  console.log('===============================================================\n');

  // 1. Verify Homepage HTML contains "50,000+" and "Citizens in the NAGRIK Network"
  console.log('Checking TEST 1: Homepage 50,000+ Presentation/Demo Count...');
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Homepage must return HTTP 200');
  const homeHtml = await homeRes.text();

  assert.strictEqual(homeHtml.includes('50,000+'), true, 'Homepage must contain "50,000+"');
  assert.strictEqual(homeHtml.includes('Citizens joined the NAGRIK Network'), true, 'Homepage must contain "Citizens joined the NAGRIK Network"');
  console.log('✓ TEST 1 PASSED: 50,000+ Presentation/Demo statistic is visible and properly formatted on the homepage.');

  // 2. Verify Database User count remains genuine (no 50,000 fake records inserted)
  console.log('\nChecking TEST 2: Genuine Database User Count Integrity...');
  const dbUserCount = await prisma.user.count();
  console.log(`Actual User records in database: ${dbUserCount}`);
  assert.ok(dbUserCount < 20, 'Database must only contain actual local users, zero fake records.');
  console.log('✓ TEST 2 PASSED: Database User records remain genuine and untouched.');

  // 3. Verify all 4 Leader Images are accessible via HTTP 200
  console.log('\nChecking TEST 3: Static Asset Serving for Leader Portraits...');
  const leaders = ['ambedkar.jpg', 'bharathiyar.jpg', 'bhagat_singh.jpg', 'vivekananda.jpg'];
  for (const img of leaders) {
    const res = await fetch(`${BASE_URL}/images/leaders/${img}`);
    assert.strictEqual(res.status, 200, `Image /images/leaders/${img} must return HTTP 200`);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('image/'), `Content-Type for ${img} must be image/*`);
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 10000, `Image ${img} must have valid non-empty file size`);
    console.log(`✓ Image /images/leaders/${img} verified (${(buffer.byteLength / 1024).toFixed(1)} KB, ${contentType}).`);
  }

  // 4. Verify StorytellingQuoteReel component structure in rendered HTML
  console.log('Checking TEST 4: Quote Reel component rendered structure...');
  const homeRes2 = await fetch(`${BASE_URL}/`);
  const html = await homeRes2.text();
  assert.strictEqual(html.includes('DR. A. P. J. ABDUL KALAM'), true, 'Abdul Kalam slide present as first leader');
  assert.strictEqual(html.includes('/images/leaders/kalam.jpg'), true, 'Kalam image rendered');
  console.log('✓ TEST 4 PASSED: Quote Carousel component rendered with initial leader.');

  console.log('\n===============================================================');
  console.log('--- ALL VERIFICATION CHECKS COMPLETED WITH 100% SUCCESS ---');
  console.log('===============================================================\n');
}

runVerification()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
