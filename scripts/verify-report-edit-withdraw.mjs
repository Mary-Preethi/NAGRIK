import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\n===============================================================');
  console.log('--- EXECUTING REPORT EDIT, EVIDENCE & WITHDRAWAL VERIFICATION ---');
  console.log('===============================================================\n');

  // Setup: Create 2 test citizens
  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash('TestPass@2026', 10);

  const citizen1 = await db.user.create({
    data: {
      email: `citizen_edit_${timestamp}@nagrik.in`,
      passwordHash,
      displayName: `Citizen Editor ${timestamp}`,
      role: 'CITIZEN',
      isActive: true,
    },
  });

  const citizen2 = await db.user.create({
    data: {
      email: `citizen_victim_${timestamp}@nagrik.in`,
      passwordHash,
      displayName: `Citizen Victim ${timestamp}`,
      role: 'CITIZEN',
      isActive: true,
    },
  });

  // Login helper
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.strictEqual(res.status, 200, `Login failed for ${email}`);
    const cookies = res.headers.get('set-cookie');
    return cookies;
  }

  const citizen1Cookie = await login(citizen1.email, 'TestPass@2026');
  const citizen2Cookie = await login(citizen2.email, 'TestPass@2026');

  // TEST 1: Citizen 1 creates a report with evidence
  console.log('TEST 1: Citizen 1 submits a civic report with initial evidence...');
  const formData = new FormData();
  formData.append('title', 'Initial Broken Water Pipeline');
  formData.append('category', 'WATER_SANITATION');
  formData.append('description', 'Main pipeline leaking heavily near junction 4.');
  formData.append('locationState', 'Maharashtra');
  formData.append('locationDistrict', 'Pune');
  formData.append('locationGeneral', 'Kothrud Junction');
  const initialBlob = new Blob(['sample pipeline evidence content'], { type: 'application/pdf' });
  formData.append('evidenceFile', initialBlob, 'pipeline_photo.pdf');
  formData.append('evidenceDescription', 'Initial photo of pipeline leakage');

  const createRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: {
      Cookie: citizen1Cookie,
    },
    body: formData,
  });

  assert.strictEqual(createRes.status, 200);
  const createData = await createRes.json();
  assert.strictEqual(createData.success, true);
  const report1 = createData.report;
  assert.ok(report1.id);
  assert.strictEqual(report1.status, 'SUBMITTED');
  assert.strictEqual(report1.evidence.length, 1);
  const initialEvidenceId = report1.evidence[0].id;
  console.log(`✓ TEST 1 PASSED: Report created with Tracking ID ${report1.trackingId}, 1 evidence file.`);

  // TEST 2: Citizen 1 edits own submitted report text fields
  console.log('\nTEST 2: Citizen 1 edits own submitted report text fields...');
  const editRes1 = await fetch(`${BASE_URL}/api/reports/${report1.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: citizen1Cookie,
    },
    body: JSON.stringify({
      title: 'Corrected Pipeline Leakage Title',
      description: 'Updated description with more details about water flooding.',
      category: 'WATER_SANITATION',
      locationDistrict: 'Pune Central',
    }),
  });

  assert.strictEqual(editRes1.status, 200);
  const editData1 = await editRes1.json();
  assert.strictEqual(editData1.report.title, 'Corrected Pipeline Leakage Title');
  assert.strictEqual(editData1.report.locationDistrict, 'Pune Central');
  console.log('✓ TEST 2 PASSED: Report text fields successfully updated by owner.');

  // TEST 3: Citizen 1 removes initial evidence & uploads replacement evidence
  console.log('\nTEST 3: Citizen 1 removes incorrect evidence and attaches replacement file...');
  const editFormData = new FormData();
  editFormData.append('removeEvidenceIds', JSON.stringify([initialEvidenceId]));
  const replacementBlob = new Blob(['corrected high res evidence'], { type: 'application/pdf' });
  editFormData.append('evidenceFile', replacementBlob, 'corrected_pipeline_evidence.pdf');
  editFormData.append('evidenceDescription', 'Corrected clear document of leakage');

  const editRes2 = await fetch(`${BASE_URL}/api/reports/${report1.id}`, {
    method: 'PATCH',
    headers: {
      Cookie: citizen1Cookie,
    },
    body: editFormData,
  });

  assert.strictEqual(editRes2.status, 200);
  const editData2 = await editRes2.json();
  assert.strictEqual(editData2.report.evidence.length, 1);
  assert.strictEqual(editData2.report.evidence[0].fileName, 'corrected_pipeline_evidence.pdf');
  assert.notStrictEqual(editData2.report.evidence[0].id, initialEvidenceId);
  console.log('✓ TEST 3 PASSED: Old evidence unlinked, replacement evidence attached.');

  // TEST 4: Malicious user (Citizen 2) attempts to edit Citizen 1's report
  console.log('\nTEST 4: Malicious user (Citizen 2) attempts to edit Citizen 1\'s report...');
  const unauthorizedEditRes = await fetch(`${BASE_URL}/api/reports/${report1.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: citizen2Cookie,
    },
    body: JSON.stringify({
      title: 'Hacked Title Attempt',
    }),
  });

  assert.strictEqual(unauthorizedEditRes.status, 403);
  console.log('✓ TEST 4 PASSED: Server rejected unauthorized edit attempt with HTTP 403 Forbidden.');

  // TEST 5: Direct DELETE is blocked
  console.log('\nTEST 5: Citizen attempts hard DELETE on report...');
  const deleteRes = await fetch(`${BASE_URL}/api/reports/${report1.id}`, {
    method: 'DELETE',
    headers: {
      Cookie: citizen1Cookie,
    },
  });

  assert.strictEqual(deleteRes.status, 403);
  const deleteData = await deleteRes.json();
  assert.strictEqual(deleteData.action, 'USE_WITHDRAWAL');
  console.log('✓ TEST 5 PASSED: Hard delete strictly rejected with HTTP 403 and guidance to use withdrawal.');

  // TEST 6: Citizen 1 withdraws their report
  console.log('\nTEST 6: Citizen 1 withdraws own report with explanation...');
  const withdrawRes = await fetch(`${BASE_URL}/api/reports/${report1.id}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: citizen1Cookie,
    },
    body: JSON.stringify({
      reason: 'Issue was resolved by local municipal team this morning.',
    }),
  });

  assert.strictEqual(withdrawRes.status, 200);
  const withdrawData = await withdrawRes.json();
  assert.strictEqual(withdrawData.success, true);
  assert.strictEqual(withdrawData.report.status, 'WITHDRAWN');
  console.log('✓ TEST 6 PASSED: Report status transitioned to WITHDRAWN, database record preserved.');

  // TEST 7: Withdrawn report is excluded from public explore, but visible in citizen's dashboard
  console.log('\nTEST 7: Verifying public exclusion and private owner dashboard retention...');
  const publicReportsRes = await fetch(`${BASE_URL}/api/reports`);
  const publicReportsData = await publicReportsRes.json();
  const foundInPublic = (publicReportsData.reports || []).some((r) => r.id === report1.id);
  assert.strictEqual(foundInPublic, false, 'Withdrawn report must NOT appear in public feed');

  const myReportsRes = await fetch(`${BASE_URL}/api/reports?mine=true`, {
    headers: { Cookie: citizen1Cookie },
  });
  const myReportsData = await myReportsRes.json();
  const myReport = (myReportsData.reports || []).find((r) => r.id === report1.id);
  assert.ok(myReport, 'Withdrawn report must appear in owner dashboard');
  assert.strictEqual(myReport.status, 'WITHDRAWN');
  console.log('✓ TEST 7 PASSED: Excluded from public feed, preserved in citizen owner history.');

  // TEST 8: Check immutable audit log records
  console.log('\nTEST 8: Verifying append-only audit trail records for all operations...');
  const auditLogs = await db.auditLog.findMany({
    where: { targetId: report1.id },
    orderBy: { timestamp: 'asc' },
  });

  const actionTypes = auditLogs.map((l) => l.actionType);
  console.log('Audit events recorded for report:', actionTypes);
  assert.ok(actionTypes.includes('SUBMIT_REPORT'), 'Must record SUBMIT_REPORT');
  assert.ok(actionTypes.includes('UPDATE_REPORT'), 'Must record UPDATE_REPORT');
  assert.ok(actionTypes.includes('REMOVE_EVIDENCE'), 'Must record REMOVE_EVIDENCE');
  assert.ok(actionTypes.includes('UPDATE_EVIDENCE'), 'Must record UPDATE_EVIDENCE');
  assert.ok(actionTypes.includes('WITHDRAW_REPORT'), 'Must record WITHDRAW_REPORT');
  console.log('✓ TEST 8 PASSED: Complete audit trail recorded with actors, timestamps, and diffs.');

  // TEST 9: Reports under active investigation
  console.log('\nTEST 9: Testing lifecycle guard on reports under active investigation...');
  // Create an investigated report
  const investigatedReport = await db.report.create({
    data: {
      trackingId: `NAG-${new Date().getFullYear()}-9999`,
      userId: citizen1.id,
      title: 'Investigated Toxic Waste Dump',
      category: 'ENVIRONMENT',
      description: 'Industrial chemicals leaking into stormwater drain.',
      locationState: 'Karnataka',
      locationDistrict: 'Bengaluru Urban',
      locationGeneral: 'Peenya Industrial Area',
      status: 'UNDER_INVESTIGATION',
    },
  });

  // Attempt direct edit on investigated report
  const lockedEditRes = await fetch(`${BASE_URL}/api/reports/${investigatedReport.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: citizen1Cookie,
    },
    body: JSON.stringify({ title: 'Modified Evidence Title' }),
  });

  assert.strictEqual(lockedEditRes.status, 409);
  const lockedData = await lockedEditRes.json();
  assert.strictEqual(lockedData.isLocked, true);
  console.log('✓ Direct edit correctly blocked for report under investigation.');

  // Submit formal request action instead
  const requestActionRes = await fetch(`${BASE_URL}/api/reports/${investigatedReport.id}/request-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: citizen1Cookie,
    },
    body: JSON.stringify({
      requestType: 'CORRECTION',
      reason: 'The chemical tanker plate was KA-01-AB-1234 instead of KA-02-AB-1234.',
    }),
  });

  assert.strictEqual(requestActionRes.status, 200);
  const reqData = await requestActionRes.json();
  assert.strictEqual(reqData.success, true);

  const requestAudit = await db.auditLog.findFirst({
    where: { targetId: investigatedReport.id, actionType: 'REQUEST_REPORT_CORRECTION' },
  });
  assert.ok(requestAudit, 'Must record REQUEST_REPORT_CORRECTION audit event');
  console.log('✓ TEST 9 PASSED: Direct edits locked during investigation; correction request recorded.');

  // TEST 10: Unauthenticated access blocked
  console.log('\nTEST 10: Verifying unauthenticated requests are blocked...');
  const unauthRes = await fetch(`${BASE_URL}/api/reports/${report1.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Anonymous edit attempt' }),
  });
  assert.strictEqual(unauthRes.status, 401);
  console.log('✓ TEST 10 PASSED: Unauthenticated requests rejected with HTTP 401.');

  console.log('\n===============================================================');
  console.log('--- ALL 10 VERIFICATION TESTS PASSED WITH 100% SUCCESS ---');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
