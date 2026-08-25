import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log('\n--- VERIFYING RBAC REGISTRATION FIX ---');

  // TEST 1: Open /register HTML
  const res1 = await fetch(`${BASE_URL}/register`);
  const html = await res1.text();
  assert.strictEqual(html.includes('Account Capability'), false, 'Role selector title must not exist in HTML');
  assert.strictEqual(html.includes('<select'), false, 'Select dropdown must not exist in HTML');
  console.log('✓ TEST 1: /register HTML has NO role dropdown.');

  // TEST 2: Create a normal account
  const timestamp = Date.now();
  const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Normal Citizen',
      email: `citizen_${timestamp}@nagrik-test.in`,
      password: 'CitizenPassword123!',
    }),
  });
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  assert.strictEqual(data2.user.role, 'CITIZEN', 'Normal account must receive CITIZEN role');
  console.log(`✓ TEST 2: Normal registration assigned role: "${data2.user.role}".`);

  // TEST 3: Attempt role escalation with role="ADMIN"
  const res3 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Malicious Admin Attacker',
      email: `attacker_admin_${timestamp}@exploit.com`,
      password: 'AttackerPassword123!',
      role: 'ADMIN',
    }),
  });
  const data3 = await res3.json();
  assert.strictEqual(data3.success, true);
  assert.strictEqual(data3.user.role, 'CITIZEN', 'Attacker attempting role=ADMIN must be saved as CITIZEN');
  console.log(`✓ TEST 3: Attempted role="ADMIN" in payload was ignored and forced to: "${data3.user.role}".`);

  // TEST 4: Attempt role escalation with role="INVESTIGATOR"
  const res4 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Malicious Investigator Attacker',
      email: `attacker_inv_${timestamp}@exploit.com`,
      password: 'AttackerPassword123!',
      role: 'INVESTIGATOR',
    }),
  });
  const data4 = await res4.json();
  assert.strictEqual(data4.success, true);
  assert.strictEqual(data4.user.role, 'CITIZEN', 'Attacker attempting role=INVESTIGATOR must be saved as CITIZEN');
  console.log(`✓ TEST 4: Attempted role="INVESTIGATOR" in payload was ignored and forced to: "${data4.user.role}".`);

  // TEST 5: Verify existing seeded admin & investigator accounts still work
  const resAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nagrik.in',
      password: 'Admin@2026',
    }),
  });
  const dataAdmin = await resAdmin.json();
  assert.strictEqual(dataAdmin.success, true);
  assert.strictEqual(dataAdmin.user.role, 'ADMIN');
  console.log(`✓ TEST 5: Seeded Administrator login verified (role: "${dataAdmin.user.role}").`);

  const resInv = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'investigator@nagrik.in',
      password: 'Investigator@2026',
    }),
  });
  const dataInv = await resInv.json();
  assert.strictEqual(dataInv.success, true);
  assert.strictEqual(dataInv.user.role, 'INVESTIGATOR');
  console.log(`✓ TEST 6: Seeded Investigator login verified (role: "${dataInv.user.role}").`);

  console.log('\n===============================================================');
  console.log('--- ALL 6 RBAC REGISTRATION VERIFICATION TESTS PASSED (100%) ---');
  console.log('===============================================================\n');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
