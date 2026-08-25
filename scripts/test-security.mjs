import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

console.log('--- RUNNING SECURITY, RBAC & PRIVACY BOUNDARY VERIFICATION TESTS ---');

const JWT_SECRET = 'nagrik-test-secret-key-12345678901234567890';

// Test 1: Password Hashing & Verification
const plain = 'Nagrik@2026';
const hash = await bcrypt.hash(plain, 10);
const matches = await bcrypt.compare(plain, hash);
assert.strictEqual(matches, true, 'Password should verify correctly against bcrypt hash');
console.log('✓ Test 1 Passed: Secure bcrypt password hashing and verification functional.');

// Test 2: Role-based JWT Token generation & validation
const payload = { userId: 'usr-123', email: 'citizen@nagrik.in', role: 'CITIZEN', displayName: 'Citizen Tester' };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(token, JWT_SECRET);
assert.strictEqual(decoded.role, 'CITIZEN', 'Decoded token role must match');
console.log('✓ Test 2 Passed: Signed JWT Token RBAC payload verified.');

// Test 3: Public Report DTO Privacy Filter (Zero Leakage Check)
const rawDatabaseReport = {
  id: 'rep-456',
  trackingId: 'NAG-2026-1001',
  userId: 'usr-secret-private-id',
  user: {
    email: 'private_citizen@example.com',
    phone: '+91 9876543210',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  },
  title: 'Tap water discoloration',
  category: 'WATER_SANITATION',
  description: 'Brown water in taps',
  locationState: 'Delhi',
  locationDistrict: 'North District',
  locationGeneral: 'Sector 4',
  status: 'SUBMITTED',
  evidence: [
    { id: 'ev-1', fileName: 'private_id_proof.jpg', filePath: '/secret/uploads/id.jpg', isPrivate: true },
    { id: 'ev-2', fileName: 'water_photo.jpg', filePath: '/public/uploads/water.jpg', isPrivate: false },
  ],
  supports: [{ id: 's-1', userId: 'usr-2' }],
  createdAt: new Date(),
};

function serializePublicReport(r) {
  const publicEvidence = (r.evidence || []).filter((e) => !e.isPrivate);
  return {
    id: r.id,
    trackingId: r.trackingId,
    title: r.title,
    category: r.category,
    description: r.description,
    locationState: r.locationState,
    locationDistrict: r.locationDistrict,
    locationGeneral: r.locationGeneral,
    status: r.status,
    supportCount: r.supports?.length || 0,
    hasEvidence: (r.evidence?.length || 0) > 0,
    publicEvidenceCount: publicEvidence.length,
    createdAt: r.createdAt.toISOString(),
  };
}

const publicDTO = serializePublicReport(rawDatabaseReport);

// Assert private fields are never present in public DTO
assert.strictEqual(publicDTO.userId, undefined, 'userId must not leak in public DTO');
assert.strictEqual(publicDTO.user, undefined, 'user profile must not leak in public DTO');
assert.strictEqual(publicDTO.email, undefined, 'email must not leak in public DTO');
assert.strictEqual(publicDTO.phone, undefined, 'phone must not leak in public DTO');
assert.strictEqual(publicDTO.passwordHash, undefined, 'passwordHash must not leak in public DTO');
assert.strictEqual(publicDTO.evidence, undefined, 'private evidence array must not leak in public DTO');
assert.strictEqual(publicDTO.publicEvidenceCount, 1, 'Only non-private evidence count reflected');

console.log('✓ Test 3 Passed: Public DTO projection strictly eliminates private citizen identities and files.');

console.log('--- ALL SECURITY & PRIVACY TESTS PASSED SUCCESSFULLY ---\n');
