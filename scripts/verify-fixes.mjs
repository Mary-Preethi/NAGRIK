import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\n===============================================================');
  console.log('--- EXECUTING VERIFICATION TESTS FOR EVIDENCE UPLOAD & RBAC ---');
  console.log('===============================================================\n');

  // TEST 1: Open /report and verify file input control
  const res1 = await fetch(`${BASE_URL}/report`);
  const html1 = await res1.text();
  assert.strictEqual(html1.includes('type="file"'), true, 'Report page must contain file input');
  assert.strictEqual(html1.includes('accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"'), true, 'Report page must accept supported formats');
  console.log('✓ TEST 1 & 2 PASSED: /report contains real file upload control with accepted types (.pdf,.png,.jpg,.jpeg,.doc,.docx).');

  // Login as citizen first to get session cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@nagrik.in', password: 'Nagrik@2026' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  assert.ok(cookie, 'Citizen login must return session cookie');
  console.log('✓ Authenticated as citizen for report submission tests.');

  // TEST 3: Submit report WITH a real evidence file (e.g. sample PDF bytes)
  const formDataWithFile = new FormData();
  formDataWithFile.append('title', 'Water Contamination in Block C');
  formDataWithFile.append('category', 'WATER_SANITATION');
  formDataWithFile.append('description', 'Tap water has heavy sulfur odor and brown discoloration.');
  formDataWithFile.append('locationState', 'Delhi');
  formDataWithFile.append('locationDistrict', 'North District');
  formDataWithFile.append('locationGeneral', 'Block C Ward 12');
  formDataWithFile.append('evidenceDescription', 'Laboratory test report document');
  
  const samplePdfBytes = Buffer.from('%PDF-1.4 sample test document for NAGRIK evidence');
  const samplePdfBlob = new Blob([samplePdfBytes], { type: 'application/pdf' });
  formDataWithFile.append('evidenceFile', samplePdfBlob, 'water_test_report_2026.pdf');

  const reportResWithFile = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      cookie,
    },
    body: formDataWithFile,
  });

  const reportDataWithFile = await reportResWithFile.json();
  assert.strictEqual(reportResWithFile.status, 200, 'Report submission with evidence must succeed');
  assert.ok(reportDataWithFile.report.trackingId.startsWith('NAG-'), 'Must have tracking ID');
  assert.strictEqual(reportDataWithFile.report.evidence.length, 1, 'Evidence length must be 1');
  assert.strictEqual(reportDataWithFile.report.evidence[0].fileName, 'water_test_report_2026.pdf');
  console.log(`✓ TEST 3 PASSED: Report with real PDF file submitted successfully (Tracking ID: ${reportDataWithFile.report.trackingId}, File: ${reportDataWithFile.report.evidence[0].fileName}).`);

  // TEST 4: Submit report WITHOUT evidence (Evidence is strictly optional)
  const formDataNoFile = new FormData();
  formDataNoFile.append('title', 'Broken Streetlight on 5th Cross Road');
  formDataNoFile.append('category', 'ROADS_INFRASTRUCTURE');
  formDataNoFile.append('description', 'Streetlight pole fallen and dark stretch for 300 meters.');
  formDataNoFile.append('locationState', 'Delhi');
  formDataNoFile.append('locationDistrict', 'North District');

  const reportResNoFile = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      cookie,
    },
    body: formDataNoFile,
  });

  const reportDataNoFile = await reportResNoFile.json();
  assert.strictEqual(reportResNoFile.status, 200, 'Report submission without evidence must succeed');
  assert.strictEqual(reportDataNoFile.report.evidence.length, 0, 'Evidence length must be 0');
  console.log(`✓ TEST 4 & 5 PASSED: Report WITHOUT evidence submitted successfully (Evidence is strictly optional, Evidence Count: 0).`);

  // TEST 5: Reject unsupported executable file (e.g. .exe)
  const formDataExe = new FormData();
  formDataExe.append('title', 'Test Malicious Report');
  formDataExe.append('category', 'CIVIC_SERVICES');
  formDataExe.append('description', 'Testing executable rejection.');
  formDataExe.append('locationState', 'Delhi');
  formDataExe.append('locationDistrict', 'North District');
  
  const exeBlob = new Blob([Buffer.from('MZ executable payload')], { type: 'application/x-msdownload' });
  formDataExe.append('evidenceFile', exeBlob, 'malicious_script.exe');

  const reportResExe = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { cookie },
    body: formDataExe,
  });

  const reportDataExe = await reportResExe.json();
  assert.strictEqual(reportResExe.status, 400, 'Executable file must be rejected with status 400');
  console.log(`✓ TEST 6 PASSED: Server rejected executable file (.exe) with message: "${reportDataExe.error}".`);

  // TEST 6: Reject oversized file (> 10MB)
  const formDataOversized = new FormData();
  formDataOversized.append('title', 'Test Oversized File Report');
  formDataOversized.append('category', 'CIVIC_SERVICES');
  formDataOversized.append('description', 'Testing oversized file rejection.');
  formDataOversized.append('locationState', 'Delhi');
  formDataOversized.append('locationDistrict', 'North District');
  
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
  const oversizedBlob = new Blob([oversizedBuffer], { type: 'application/pdf' });
  formDataOversized.append('evidenceFile', oversizedBlob, 'huge_document.pdf');

  const reportResOversized = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { cookie },
    body: formDataOversized,
  });

  const reportDataOversized = await reportResOversized.json();
  assert.strictEqual(reportResOversized.status, 400, 'Oversized file must be rejected with status 400');
  console.log(`✓ File size validation PASSED: Server rejected 11MB file with message: "${reportDataOversized.error}".`);

  // TEST 7: Attempt public registration with role=ADMIN
  const timestamp = Date.now();
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Attacker Trying Admin',
      email: `attacker_${timestamp}@exploit.com`,
      password: 'AttackerPassword123!',
      role: 'ADMIN',
    }),
  });
  const registerData = await registerRes.json();
  assert.strictEqual(registerData.success, true);
  assert.strictEqual(registerData.user.role, 'CITIZEN', 'Role must remain CITIZEN regardless of payload');
  console.log(`✓ TEST 7 PASSED: Public registration strictly assigns role: "${registerData.user.role}" (attempted role=ADMIN ignored).`);

  // TEST 8: Admin account login via seeded environment credentials
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nagrik.in',
      password: 'Admin@2026',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  assert.strictEqual(adminLoginData.success, true);
  assert.strictEqual(adminLoginData.user.role, 'ADMIN');

  // Verify Admin can access audit logs endpoint
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(auditRes.status, 200, 'Admin must have access to audit logs');
  console.log(`✓ TEST 8 PASSED: Seeded Administrator logged in successfully and verified access to admin audit endpoints.`);

  // TEST 9: Verify normal Citizen cannot access admin audit logs
  const citizenAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { cookie },
  });
  assert.strictEqual(citizenAuditRes.status, 403, 'Citizen must be forbidden from accessing admin audit logs (403)');
  console.log(`✓ TEST 9 PASSED: Normal Citizen access to admin audit endpoints is strictly forbidden (HTTP 403).`);

  console.log('\n===============================================================');
  console.log('--- ALL 9 VERIFICATION TESTS COMPLETED WITH 100% SUCCESS ---');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
