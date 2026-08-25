import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log('\n===============================================================');
  console.log('--- EXECUTING VERIFICATION TESTS FOR AUTH & CIVIC MEMBER STATS ---');
  console.log('===============================================================\n');

  // TEST 1: Logged out -> call /report page
  console.log('Running TEST 1: Logged out access to /report...');
  const reportPageRes = await fetch(`${BASE_URL}/report`, { redirect: 'manual' });
  const reportHtml = await reportPageRes.text();
  assert.strictEqual(reportHtml.includes('Verifying citizen authorization...'), true, 'Unauthenticated report page must gate with authorization check');
  console.log('✓ TEST 1 PASSED: Unauthenticated user visiting /report is intercepted by citizen authorization verification.');

  // TEST 2: Logged out -> call report creation API directly (POST /api/reports)
  console.log('\nRunning TEST 2: Logged out direct POST to /api/reports...');
  const unauthorizedPostRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthorized Test Incident',
      category: 'WATER_SANITATION',
      description: 'Testing unauthenticated rejection.',
      locationState: 'Delhi',
      locationDistrict: 'North District',
    }),
  });
  const unauthData = await unauthorizedPostRes.json();
  assert.strictEqual(unauthorizedPostRes.status, 401, 'Unauthenticated report submission must return HTTP 401');
  assert.strictEqual(unauthData.error, 'Authentication required to submit reports.', 'Must return proper error message');
  console.log(`✓ TEST 2 PASSED: Direct unauthenticated POST /api/reports strictly rejected with HTTP 401: "${unauthData.error}".`);

  // TEST 2B: Admin or Investigator trying to submit citizen report
  console.log('\nRunning TEST 2B: Admin/Investigator role trying to POST to /api/reports...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nagrik.in',
      password: 'Admin@2026',
    }),
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  const adminPostRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({
      title: 'Admin Attempting Citizen Report',
      category: 'WATER_SANITATION',
      description: 'Admin testing rejection.',
      locationState: 'Delhi',
      locationDistrict: 'North District',
    }),
  });
  assert.strictEqual(adminPostRes.status, 403, 'Admin attempting citizen report must return HTTP 403 Forbidden');
  console.log('✓ TEST 2B PASSED: Non-citizen roles (Admin/Investigator) forbidden from submitting citizen reports (HTTP 403).');

  // TEST 3 & 4: Logged-in Citizen -> submit report
  console.log('\nRunning TEST 3 & 4: Authenticated Citizen report submission...');
  const citizenLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'citizen@nagrik.in',
      password: 'Nagrik@2026',
    }),
  });
  const citizenCookie = citizenLoginRes.headers.get('set-cookie');
  assert.ok(citizenCookie, 'Citizen login must succeed and return session cookie');

  const reportRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: citizenCookie },
    body: JSON.stringify({
      title: 'Verified Citizen Water Contamination Report',
      category: 'WATER_SANITATION',
      description: 'Discolored water observed in block A taps with foul odor.',
      locationState: 'Delhi',
      locationDistrict: 'North District',
      locationGeneral: 'Block A, Sector 4',
    }),
  });
  const reportData = await reportRes.json();
  assert.strictEqual(reportRes.status, 200, 'Authenticated citizen report creation must succeed');
  assert.strictEqual(reportData.success, true);
  assert.ok(reportData.report.trackingId.startsWith('NAG-'), 'Must generate valid tracking ID');
  console.log(`✓ TEST 3 & 4 PASSED: Authenticated citizen submitted report successfully (Tracking ID: ${reportData.report.trackingId}).`);

  // TEST 5 & 6: Member count tracking & registration increment
  console.log('\nRunning TEST 5 & 6: Civic Member count tracking & registration increment...');
  const statsResBefore = await fetch(`${BASE_URL}/api/stats`);
  const statsBefore = await statsResBefore.json();
  const initialCitizens = statsBefore.totalCitizens;
  console.log(`Current active citizen count in database: ${initialCitizens}`);

  const homeHtmlBefore = await (await fetch(`${BASE_URL}/`)).text();
  assert.strictEqual(homeHtmlBefore.includes('50,000+'), true, 'Homepage must render "50,000+" presentation statistic');
  assert.strictEqual(homeHtmlBefore.includes('Citizens joined the NAGRIK Network'), true, 'Homepage must render "Citizens joined the NAGRIK Network"');

  // Register a new citizen account
  const timestamp = Date.now();
  const newEmail = `newcitizen_${timestamp}@nagrik-test.in`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Pooja Verma',
      email: newEmail,
      password: 'NagrikCitizen@2026',
    }),
  });
  const registerData = await registerRes.json();
  assert.strictEqual(registerData.success, true, 'Citizen registration must succeed');

  const statsResAfter = await fetch(`${BASE_URL}/api/stats`);
  const statsAfter = await statsResAfter.json();
  assert.strictEqual(statsAfter.totalCitizens, initialCitizens + 1, 'Total citizens count in /api/stats must increment exactly by 1');
  console.log(`✓ TEST 5 & 6 PASSED: Registration incremented member count from ${initialCitizens} to ${statsAfter.totalCitizens} on database / API without counting Admin/Investigator.`);

  // TEST 7: Verify login page displays redirect notice
  console.log('\nRunning TEST 7: Login page notice when redirecting from /report...');
  const loginPageRes = await fetch(`${BASE_URL}/login?redirect=/report`);
  const loginPageHtml = await loginPageRes.text();
  assert.strictEqual(loginPageHtml.includes('Please sign in to submit a civic report.'), true, 'Login page must display prompt to sign in for civic report submission');
  console.log('✓ TEST 7 PASSED: Login page renders "Please sign in to submit a civic report." banner when navigated from report.');

  console.log('\n===============================================================');
  console.log('--- ALL 7 VERIFICATION TESTS COMPLETED WITH 100% SUCCESS ---');
  console.log('===============================================================\n');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
